import type { FastifyInstance } from 'fastify';
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { config } from '../../config/env.js';
import { AppError } from '../../http/errors.js';
import { requireAuth } from '../../http/auth.js';
import { resolveAvatarPath } from '../../services/storage/paths.js';
import { humanSize } from '../../shared/format.js';
import { prefsDto, userDto } from './serializer.js';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** Valida el tipo real por magic bytes, no por extensión ni Content-Type. */
function sniffImage(buf: Buffer): 'png' | 'jpeg' | 'webp' | null {
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (
    buf.length > 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'webp';
  return null;
}

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/me', async (req) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { Id: req.userId! } });
    const twofa = await prisma.twoFactorSecret.findUnique({ where: { UserId: req.userId! } });
    const [downloads, storage, collections] = await Promise.all([
      prisma.libraryItem.count({ where: { UserId: req.userId! } }),
      prisma.libraryItem.aggregate({
        where: { UserId: req.userId!, DeletedAt: null },
        _sum: { FileSizeBytes: true },
      }),
      prisma.collection.count({ where: { UserId: req.userId! } }),
    ]);
    return {
      user: { ...userDto(user), twofaEnabled: !!twofa?.EnabledAt },
      stats: {
        totalDownloads: downloads,
        storageBytes: Number(storage._sum.FileSizeBytes ?? 0),
        storageLabel: humanSize(storage._sum.FileSizeBytes),
        collections,
        memberSince: user.CreatedAt,
      },
    };
  });

  app.patch('/me', async (req) => {
    const body = z
      .object({
        displayName: z.string().trim().min(1).max(80).optional(),
        username: z
          .string()
          .trim()
          .toLowerCase()
          .min(3)
          .max(32)
          .regex(/^[a-z0-9_.]+$/)
          .optional(),
        bio: z.string().trim().max(280).optional(),
      })
      .parse(req.body);

    if (body.username) {
      const taken = await prisma.user.findFirst({
        where: { Username: body.username, NOT: { Id: req.userId! } },
      });
      if (taken) throw new AppError('USERNAME_TAKEN', { field: 'username' });
    }
    const user = await prisma.user.update({
      where: { Id: req.userId! },
      data: {
        ...(body.displayName !== undefined ? { DisplayName: body.displayName } : {}),
        ...(body.username !== undefined ? { Username: body.username } : {}),
        ...(body.bio !== undefined ? { Bio: body.bio } : {}),
      },
    });
    return { user: userDto(user) };
  });

  app.get('/me/username-available', async (req) => {
    const { u } = z.object({ u: z.string().trim().toLowerCase() }).parse(req.query);
    if (u.length < 3) return { available: false, reason: 'Muy corto' };
    if (!/^[a-z0-9_.]+$/.test(u)) return { available: false, reason: 'Caracteres no permitidos' };
    const taken = await prisma.user.findFirst({ where: { Username: u, NOT: { Id: req.userId! } } });
    return taken ? { available: false, reason: 'En uso' } : { available: true, reason: 'Disponible' };
  });

  // —— Avatar ——

  app.post('/me/avatar', async (req) => {
    const file = await req.file({ limits: { fileSize: AVATAR_MAX_BYTES, files: 1 } });
    if (!file) throw new AppError('VALIDATION', { message: 'Falta la imagen', field: 'avatar' });
    const buf = await file.toBuffer();
    if (!sniffImage(buf)) {
      throw new AppError('VALIDATION', { message: 'El archivo no es una imagen válida', field: 'avatar' });
    }

    // Reescribir con sharp descarta metadatos y cualquier payload incrustado.
    const clean = await sharp(buf)
      .rotate()
      .resize(512, 512, { fit: 'cover' })
      .webp({ quality: 90 })
      .toBuffer();

    const name = `${req.userId}-${randomBytes(8).toString('hex')}.webp`;
    const abs = resolveAvatarPath(name);
    await writeFile(abs, clean);

    const prev = await prisma.user.findUniqueOrThrow({ where: { Id: req.userId! } });
    if (prev.AvatarPath) {
      try {
        await unlink(resolveAvatarPath(prev.AvatarPath));
      } catch {
        /* el archivo anterior puede no existir */
      }
    }
    const user = await prisma.user.update({
      where: { Id: req.userId! },
      data: { AvatarPath: name },
    });
    return { user: userDto(user) };
  });

  app.get('/me/avatar', async (req, reply) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { Id: req.userId! } });
    if (!user.AvatarPath) throw new AppError('NOT_FOUND');
    const abs = resolveAvatarPath(user.AvatarPath);
    if (!existsSync(abs)) throw new AppError('NOT_FOUND');
    reply.header('Content-Type', 'image/webp');
    reply.header('Cache-Control', 'private, max-age=60');
    return reply.send(await readFile(abs));
  });

  app.delete('/me/avatar', async (req) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { Id: req.userId! } });
    if (user.AvatarPath) {
      try {
        await unlink(resolveAvatarPath(user.AvatarPath));
      } catch {
        /* ignorar */
      }
      await prisma.user.update({ where: { Id: req.userId! }, data: { AvatarPath: null } });
    }
    return { ok: true };
  });

  // —— Preferencias ——

  app.get('/me/preferences', async (req) => {
    const prefs = await prisma.userPreferences.findUniqueOrThrow({ where: { UserId: req.userId! } });
    return { preferences: prefsDto(prefs) };
  });

  app.patch('/me/preferences', async (req) => {
    const body = z
      .object({
        theme: z.enum(['light', 'dark', 'system']).optional(),
        language: z.string().max(40).optional(),
        timezone: z.string().max(60).optional(),
        quality: z.enum(['2160p', '1440p', '1080p', '720p', '480p']).optional(),
        format: z.enum(['MP4', 'MP3', 'M4A']).optional(),
        filename: z.string().min(1).max(200).optional(),
        concurrency: z.enum(['1', '2', '3', '5']).optional(),
        autoTrash: z.enum(['7 días', '30 días', '90 días', 'Nunca']).optional(),
        notifications: z.record(z.record(z.boolean())).optional(),
      })
      .parse(req.body);

    const prefs = await prisma.userPreferences.update({
      where: { UserId: req.userId! },
      data: {
        ...(body.theme ? { Theme: body.theme } : {}),
        ...(body.language ? { Locale: body.language } : {}),
        ...(body.timezone ? { Timezone: body.timezone } : {}),
        ...(body.quality ? { DefaultQuality: body.quality } : {}),
        ...(body.format ? { DefaultFormat: body.format } : {}),
        ...(body.filename ? { FilenameTemplate: body.filename } : {}),
        ...(body.concurrency ? { ConcurrentDownloads: Number(body.concurrency) } : {}),
        ...(body.autoTrash ? { AutoPurgeTrash: body.autoTrash !== 'Nunca' } : {}),
        ...(body.notifications ? { NotificationSettings: JSON.stringify(body.notifications) } : {}),
      },
    });
    return { preferences: prefsDto(prefs) };
  });

  app.post('/me/password', async (req) => {
    const body = z
      .object({ currentPassword: z.string().min(8), newPassword: z.string().min(8).max(200) })
      .parse(req.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { Id: req.userId! } });
    if (!user.PasswordHash || !(await argon2.verify(user.PasswordHash, body.currentPassword))) {
      throw new AppError('INVALID_CREDENTIALS', { field: 'currentPassword' });
    }
    const hash = await argon2.hash(body.newPassword, { type: argon2.argon2id });
    await prisma.$transaction([
      prisma.user.update({ where: { Id: req.userId! }, data: { PasswordHash: hash } }),
      prisma.session.updateMany({
        where: { UserId: req.userId!, RevokedAt: null, NOT: { Id: req.sessionId! } },
        data: { RevokedAt: new Date() },
      }),
    ]);
    return { ok: true };
  });

  // —— Uso ——

  app.get('/me/usage', async (req) => {
    const periodStart = new Date();
    periodStart.setUTCDate(1);
    periodStart.setUTCHours(0, 0, 0, 0);
    const [counter, storage] = await Promise.all([
      prisma.usageCounter.findFirst({ where: { UserId: req.userId!, PeriodStart: periodStart } }),
      prisma.libraryItem.aggregate({
        where: { UserId: req.userId!, DeletedAt: null },
        _sum: { FileSizeBytes: true },
      }),
    ]);
    const user = await prisma.user.findUniqueOrThrow({ where: { Id: req.userId! } });
    const limitGb = user.Plan === 'studio' ? 1024 : user.Plan === 'pro' ? 200 : 0;
    const usedBytes = Number(storage._sum.FileSizeBytes ?? 0);
    return {
      usage: {
        downloadsThisPeriod: counter?.DownloadsUsed ?? 0,
        periodStart,
        storageBytes: usedBytes,
        storageLabel: humanSize(usedBytes),
        storageLimitGb: limitGb,
        usagePct: limitGb > 0 ? Math.min(100, Math.round((usedBytes / (limitGb * 1024 ** 3)) * 100)) : 0,
        usageLabel: `${humanSize(usedBytes)} / ${limitGb} GB`,
      },
    };
  });

  // —— Exportación ——

  app.get('/me/export', async (req, reply) => {
    const { format } = z.object({ format: z.enum(['csv', 'json']).default('json') }).parse(req.query);
    const items = await prisma.libraryItem.findMany({
      where: { UserId: req.userId! },
      include: { MediaSource: true, Tags: { include: { Tag: true } } },
      orderBy: { CreatedAt: 'desc' },
    });
    const rows = items.map((i) => ({
      id: i.Id,
      title: i.Title,
      platform: i.MediaSource.Platform,
      author: i.MediaSource.Author ?? '',
      url: i.MediaSource.SourceUrl,
      quality: i.Quality,
      format: i.Format,
      sizeBytes: Number(i.FileSizeBytes),
      favorite: i.IsFavorite,
      notes: i.Notes ?? '',
      tags: i.Tags.map((t) => t.Tag.Name).join('|'),
      deletedAt: i.DeletedAt?.toISOString() ?? '',
      createdAt: i.CreatedAt.toISOString(),
    }));

    if (format === 'json') {
      reply.header('Content-Disposition', 'attachment; filename="grabber-export.json"');
      return { exportedAt: new Date().toISOString(), items: rows };
    }
    const headers = Object.keys(rows[0] ?? { id: '' });
    const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc((r as never)[h])).join(','))].join(
      '\r\n',
    );
    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', 'attachment; filename="grabber-export.csv"');
    return reply.send(csv);
  });

  // —— Eliminación de cuenta ——

  app.delete('/me', async (req, reply) => {
    const body = z.object({ username: z.string().trim() }).parse(req.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { Id: req.userId! } });
    if (body.username.toLowerCase() !== user.Username.toLowerCase()) {
      throw new AppError('VALIDATION', {
        message: 'Escribe tu nombre de usuario exacto para confirmar',
        field: 'username',
      });
    }
    const now = new Date();
    const stamp = now.getTime();
    await prisma.$transaction([
      prisma.session.updateMany({ where: { UserId: user.Id }, data: { RevokedAt: now } }),
      prisma.user.update({
        where: { Id: user.Id },
        data: {
          DeletedAt: now,
          // liberar email/username para futuros registros
          Email: `deleted-${stamp}-${user.Email}`.slice(0, 320),
          Username: `del-${stamp}`.slice(0, 32),
        },
      }),
    ]);
    reply.clearCookie('grabber_refresh', { path: '/api/v1/auth' });
    return { ok: true };
  });
}
