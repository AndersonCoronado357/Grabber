import type { FastifyInstance, FastifyRequest } from 'fastify';
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { config } from '../../config/env.js';
import { AppError } from '../../http/errors.js';
import { guestFingerprint, optionalAuth, requireAuth } from '../../http/auth.js';
import { sseSubscribe } from '../../realtime/sse.js';
import { abortJob } from '../../workers/runner.js';
import { QUALITIES } from '../../shared/format.js';
import { jobDto } from './serializer.js';

const createSchema = z.object({
  mediaSourceId: z.string().uuid(),
  quality: z.enum(QUALITIES),
  format: z.enum(['MP4', 'MP3', 'M4A']).optional(),
  options: z
    .object({
      subtitles: z.boolean().optional(),
      thumbnail: z.boolean().optional(),
      collectionId: z.string().uuid().nullable().optional(),
    })
    .optional(),
});

function formatFor(quality: string, explicit?: string): string {
  if (quality === 'Audio MP3') return 'MP3';
  if (quality === 'Audio M4A') return 'M4A';
  return explicit && explicit !== 'MP3' && explicit !== 'M4A' ? explicit : 'MP4';
}

async function guestQuota(fingerprint: string): Promise<{ used: number; left: number }> {
  const periodStart = new Date();
  periodStart.setUTCHours(0, 0, 0, 0);
  const row = await prisma.guestUsage.findUnique({
    where: { Fingerprint_PeriodStart: { Fingerprint: fingerprint, PeriodStart: periodStart } },
  });
  const used = row?.DownloadsUsed ?? 0;
  return { used, left: Math.max(0, config.guestDownloadLimit - used) };
}

async function createJob(
  req: FastifyRequest,
  input: z.infer<typeof createSchema>,
): Promise<ReturnType<typeof jobDto>> {
  const source = await prisma.mediaSource.findUnique({ where: { Id: input.mediaSourceId } });
  if (!source) throw new AppError('NOT_FOUND', { field: 'mediaSourceId' });

  let fingerprint: string | null = null;
  if (!req.userId) {
    // muro suave: 3 descargas de invitado por día
    fingerprint = guestFingerprint(req);
    const { left } = await guestQuota(fingerprint);
    if (left <= 0) throw new AppError('QUOTA_EXCEEDED');
    const periodStart = new Date();
    periodStart.setUTCHours(0, 0, 0, 0);
    await prisma.guestUsage.upsert({
      where: { Fingerprint_PeriodStart: { Fingerprint: fingerprint, PeriodStart: periodStart } },
      create: { Fingerprint: fingerprint, PeriodStart: periodStart, DownloadsUsed: 1 },
      update: { DownloadsUsed: { increment: 1 } },
    });
  }

  if (input.options?.collectionId && req.userId) {
    const owned = await prisma.collection.findFirst({
      where: { Id: input.options.collectionId, UserId: req.userId },
    });
    if (!owned) throw new AppError('NOT_FOUND', { field: 'collectionId' });
  }

  const job = await prisma.downloadJob.create({
    data: {
      UserId: req.userId,
      GuestFingerprint: fingerprint,
      MediaSourceId: source.Id,
      Status: 'queued',
      Quality: input.quality,
      Format: formatFor(input.quality, input.format),
      IncludeSubtitles: input.options?.subtitles ?? false,
      IncludeThumbnail: input.options?.thumbnail ?? true,
      TargetCollectionId: req.userId ? (input.options?.collectionId ?? null) : null,
    },
    include: { MediaSource: true },
  });
  return jobDto(job);
}

export async function downloadRoutes(app: FastifyInstance): Promise<void> {
  // —— cola del usuario ——
  app.get('/downloads', { preHandler: requireAuth }, async (req) => {
    const jobs = await prisma.downloadJob.findMany({
      where: { UserId: req.userId!, NOT: { Status: 'canceled' } },
      include: { MediaSource: true },
      orderBy: { CreatedAt: 'desc' },
      take: 100,
    });
    return { jobs: jobs.map(jobDto) };
  });

  // crear (usuarios y también invitados, con muro de 3)
  app.post('/downloads', { preHandler: optionalAuth }, async (req, reply) => {
    const input = createSchema.parse(req.body);
    const job = await createJob(req, input);
    let guestLeft: number | null = null;
    if (!req.userId) guestLeft = (await guestQuota(guestFingerprint(req))).left;
    return reply.code(201).send({ job, guestLeft });
  });

  app.post('/downloads/batch', { preHandler: requireAuth }, async (req, reply) => {
    const body = z.object({ items: z.array(createSchema).min(1).max(50) }).parse(req.body);
    const jobs = [];
    for (const item of body.items) jobs.push(await createJob(req, item));
    return reply.code(201).send({ jobs });
  });

  app.post('/downloads/:id/pause', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const job = await prisma.downloadJob.findFirst({ where: { Id: id, UserId: req.userId! } });
    if (!job) throw new AppError('NOT_FOUND');
    if (!['downloading', 'queued'].includes(job.Status)) return { job: await freshDto(id) };
    abortJob(id); // mata el proceso hijo; el archivo parcial se conserva
    const updated = await prisma.downloadJob.update({
      where: { Id: id },
      data: { Status: 'paused', SpeedBytesPerSec: null, EtaSeconds: null },
      include: { MediaSource: true },
    });
    return { job: jobDto(updated) };
  });

  app.post('/downloads/:id/resume', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const result = await prisma.downloadJob.updateMany({
      where: { Id: id, UserId: req.userId!, Status: 'paused' },
      data: { Status: 'queued' },
    });
    if (result.count === 0) throw new AppError('NOT_FOUND');
    return { job: await freshDto(id) };
  });

  app.post('/downloads/:id/retry', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const result = await prisma.downloadJob.updateMany({
      where: { Id: id, UserId: req.userId!, Status: 'failed' },
      data: { Status: 'queued', Attempts: 0, ErrorCode: null, ErrorMessage: null, ProgressPercent: 0 },
    });
    if (result.count === 0) throw new AppError('NOT_FOUND');
    return { job: await freshDto(id) };
  });

  // estado de un job (dueño o invitado por huella, para el progreso del home)
  app.get('/downloads/:id', { preHandler: optionalAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const job = await prisma.downloadJob.findUnique({ where: { Id: id }, include: { MediaSource: true } });
    if (!job) throw new AppError('NOT_FOUND');
    const owns = job.UserId ? job.UserId === req.userId : job.GuestFingerprint === guestFingerprint(req);
    if (!owns) throw new AppError('NOT_FOUND');
    return { job: jobDto(job) };
  });

  app.delete('/downloads/:id', { preHandler: optionalAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const job = await prisma.downloadJob.findUnique({ where: { Id: id } });
    const owns = job && (job.UserId ? job.UserId === req.userId : job.GuestFingerprint === guestFingerprint(req));
    if (!job || !owns) throw new AppError('NOT_FOUND');
    abortJob(id);
    await prisma.downloadJob.update({ where: { Id: id }, data: { Status: 'canceled' } });
    // reembolsar el cupo del invitado si se cancela antes de completar
    if (!job.UserId && job.GuestFingerprint && job.Status !== 'completed') {
      const periodStart = new Date();
      periodStart.setUTCHours(0, 0, 0, 0);
      await prisma.guestUsage.updateMany({
        where: { Fingerprint: job.GuestFingerprint, PeriodStart: periodStart, DownloadsUsed: { gt: 0 } },
        data: { DownloadsUsed: { decrement: 1 } },
      });
    }
    return { ok: true };
  });

  app.post('/downloads/pause-all', { preHandler: requireAuth }, async (req) => {
    const jobs = await prisma.downloadJob.findMany({
      where: { UserId: req.userId!, Status: { in: ['downloading', 'queued'] } },
      select: { Id: true },
    });
    for (const j of jobs) abortJob(j.Id);
    await prisma.downloadJob.updateMany({
      where: { UserId: req.userId!, Status: { in: ['downloading', 'queued'] } },
      data: { Status: 'paused', SpeedBytesPerSec: null, EtaSeconds: null },
    });
    return { ok: true, count: jobs.length };
  });

  app.delete('/downloads/completed', { preHandler: requireAuth }, async (req) => {
    // limpiar la lista no borra items de biblioteca: solo oculta los jobs terminados
    const result = await prisma.downloadJob.updateMany({
      where: { UserId: req.userId!, Status: 'completed' },
      data: { Status: 'canceled' },
    });
    return { ok: true, count: result.count };
  });

  // —— SSE de progreso ——
  // EventSource no permite cabeceras: el token también se acepta por query.
  app.get('/downloads/stream', async (req, reply) => {
    const q = req.query as { token?: string };
    if (q.token && !req.headers.authorization) {
      req.headers.authorization = `Bearer ${q.token}`;
    }
    await requireAuth(req, reply);
    sseSubscribe(req.userId!, reply);
    // la respuesta queda abierta; fastify no debe serializar nada
    return reply;
  });

  // —— descarga del archivo por invitados (y usuarios) ——
  app.get('/downloads/:id/file', { preHandler: optionalAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const job = await prisma.downloadJob.findUnique({ where: { Id: id }, include: { LibraryItems: true } });
    if (!job || job.Status !== 'completed') throw new AppError('NOT_FOUND');

    let filePath: string;
    if (job.UserId) {
      if (job.UserId !== req.userId) throw new AppError('NOT_FOUND');
      const libraryItem = job.LibraryItems[0];
      if (!libraryItem) throw new AppError('NOT_FOUND');
      filePath = path.resolve(config.downloadRoot, libraryItem.FilePath);
    } else {
      if (job.GuestFingerprint !== guestFingerprint(req)) throw new AppError('NOT_FOUND');
      const guestDir = path.join(config.downloadRoot, 'guest', id);
      const files = existsSync(guestDir) ? readdirSync(guestDir) : [];
      const media = files.find((f) => !/\.(json|jpg|jpeg|png|webp|vtt|srt)$/i.test(f));
      if (!media) throw new AppError('NOT_FOUND');
      filePath = path.join(guestDir, media);
    }
    if (!filePath.startsWith(path.resolve(config.downloadRoot))) throw new AppError('NOT_FOUND');
    if (!existsSync(filePath)) throw new AppError('NOT_FOUND');

    const stat = statSync(filePath);
    reply.header('Content-Type', 'application/octet-stream');
    reply.header('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    reply.header('Content-Length', stat.size);
    return reply.send(createReadStream(filePath));
  });

  // —— cuota de invitado (para el muro suave del home) ——
  app.get('/downloads/guest-quota', { preHandler: optionalAuth }, async (req) => {
    if (req.userId) return { guestLeft: null, unlimited: true };
    const { left } = await guestQuota(guestFingerprint(req));
    return { guestLeft: left, unlimited: false };
  });
}

async function freshDto(id: string) {
  const job = await prisma.downloadJob.findUniqueOrThrow({
    where: { Id: id },
    include: { MediaSource: true },
  });
  return jobDto(job);
}
