import { rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { prisma } from '../db/client.js';
import { config } from '../config/env.js';
import { logger } from '../http/logger.js';
import { runRenewals, runRenewalReminders } from '../modules/billing/renewals.js';

/**
 * Scheduler simple en proceso:
 *  - purga de papelera (diaria)
 *  - limpieza de tokens/códigos/sesiones expirados (cada hora)
 *  - reinicio de contadores al cambiar el período (diaria)
 *  - reconciliación de biblioteca contra el disco (diaria)
 */

const timers: NodeJS.Timeout[] = [];

export function startScheduler(): void {
  const hourly = 60 * 60_000;
  const daily = 24 * hourly;

  schedule('limpieza de tokens y sesiones', hourly, cleanupExpired);
  schedule('purga de papelera', daily, purgeTrash);
  schedule('reconciliación de biblioteca', daily, reconcileLibrary);
  schedule('rotación de contadores de uso', daily, rotateUsageCounters);
  schedule('renovaciones de suscripción (Wompi)', daily, runRenewals);
  schedule('avisos de renovación (Wompi)', daily, runRenewalReminders);
}

export function stopScheduler(): void {
  for (const t of timers) clearInterval(t);
  timers.length = 0;
}

function schedule(name: string, everyMs: number, fn: () => Promise<void>): void {
  // primera pasada al arrancar (con un pequeño retraso para no competir con el boot)
  setTimeout(() => void run(name, fn), 15_000).unref();
  const t = setInterval(() => void run(name, fn), everyMs);
  t.unref();
  timers.push(t);
}

async function run(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    logger.error({ err, task: name }, 'tarea programada falló');
  }
}

export async function purgeTrash(): Promise<void> {
  const cutoff = new Date(Date.now() - config.trashRetentionDays * 86_400_000);
  const victims = await prisma.libraryItem.findMany({
    where: { DeletedAt: { not: null, lt: cutoff } },
  });
  for (const item of victims) {
    const abs = path.resolve(config.downloadRoot, item.FilePath);
    if (abs.startsWith(path.resolve(config.downloadRoot))) {
      await rm(abs, { force: true }).catch(() => undefined);
    }
  }
  if (victims.length > 0) {
    const ids = victims.map((v) => v.Id);
    await prisma.$transaction([
      prisma.collectionItem.deleteMany({ where: { LibraryItemId: { in: ids } } }),
      prisma.libraryItemTag.deleteMany({ where: { LibraryItemId: { in: ids } } }),
      prisma.libraryItem.deleteMany({ where: { Id: { in: ids } } }),
    ]);
    logger.info({ count: victims.length }, 'papelera purgada');
  }
}

export async function cleanupExpired(): Promise<void> {
  const now = new Date();
  const [tokens, codes, sessions] = await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: { OR: [{ ExpiresAt: { lt: now } }, { ConsumedAt: { not: null } }] },
    }),
    prisma.emailVerificationCode.deleteMany({
      where: { OR: [{ ExpiresAt: { lt: now } }, { ConsumedAt: { not: null } }] },
    }),
    prisma.session.deleteMany({
      where: { OR: [{ ExpiresAt: { lt: now } }, { RevokedAt: { not: null } }] },
    }),
  ]);
  if (tokens.count + codes.count + sessions.count > 0) {
    logger.info(
      { tokens: tokens.count, codes: codes.count, sessions: sessions.count },
      'expirados eliminados',
    );
  }
}

export async function reconcileLibrary(): Promise<void> {
  const items = await prisma.libraryItem.findMany({
    where: { DeletedAt: null, FileMissing: false },
    select: { Id: true, FilePath: true, UserId: true, Title: true },
  });
  let missing = 0;
  for (const item of items) {
    const abs = path.resolve(config.downloadRoot, item.FilePath);
    if (!existsSync(abs)) {
      missing++;
      await prisma.libraryItem.update({ where: { Id: item.Id }, data: { FileMissing: true } });
      await prisma.notification.create({
        data: {
          UserId: item.UserId,
          Type: 'library_file_missing',
          Payload: JSON.stringify({ libraryItemId: item.Id, title: item.Title }),
        },
      });
    }
  }
  if (missing > 0) logger.warn({ missing }, 'items de biblioteca sin archivo en disco');
}

export async function rotateUsageCounters(): Promise<void> {
  // los contadores son por (UserId, PeriodStart): al cambiar el mes, el
  // upsert del runner crea la fila nueva; aquí solo se recortan los viejos
  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 12);
  const result = await prisma.usageCounter.deleteMany({ where: { PeriodStart: { lt: cutoff } } });
  const guests = await prisma.guestUsage.deleteMany({
    where: { PeriodStart: { lt: new Date(Date.now() - 7 * 86_400_000) } },
  });
  if (result.count + guests.count > 0) {
    logger.info({ usage: result.count, guests: guests.count }, 'contadores antiguos recortados');
  }
}
