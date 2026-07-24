import { mkdir, rename, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { prisma } from '../db/client.js';
import { config } from '../config/env.js';
import { logger } from '../http/logger.js';
import { sseEmit } from '../realtime/sse.js';
import { getExtractor, ExtractorError } from '../services/extractor/index.js';
import { notifyPush } from '../services/push/push.js';
import { applyFilenameTemplate, sanitizeFilename } from '../services/storage/paths.js';
import { jobDto } from '../modules/downloads/serializer.js';
import { ERROR_CATALOG, type ErrorCode } from '../http/errors.js';

/**
 * Runner de la cola: la cola ES la tabla DownloadJobs. Este proceso toma
 * trabajos `queued` por orden de llegada, respeta la concurrencia por
 * usuario (tope duro MAX_CONCURRENT_DOWNLOADS) y persiste el progreso
 * con throttle de 1 s mientras lo emite por SSE en tiempo real.
 */

interface ActiveJob {
  userId: string | null;
  abort: AbortController;
}

const active = new Map<string, ActiveJob>();
const retryNotBefore = new Map<string, number>();
let timer: NodeJS.Timeout | null = null;
let scanning = false;

export function activeCount(): number {
  return active.size;
}

export async function startRunner(): Promise<void> {
  // trabajos que quedaron a medias en el arranque vuelven a la cola
  await prisma.downloadJob.updateMany({
    where: { Status: 'downloading' },
    data: { Status: 'queued', SpeedBytesPerSec: null, EtaSeconds: null },
  });
  timer = setInterval(() => {
    void scan();
  }, 1000);
  timer.unref();
  logger.info('runner de descargas iniciado');
}

export function stopRunner(): void {
  if (timer) clearInterval(timer);
  timer = null;
  for (const [, job] of active) job.abort.abort();
}

export function abortJob(jobId: string): boolean {
  const job = active.get(jobId);
  if (!job) return false;
  job.abort.abort();
  return true;
}

async function scan(): Promise<void> {
  if (scanning) return;
  scanning = true;
  try {
    while (active.size < config.maxConcurrentDownloads) {
      const claimed = await claimNext();
      if (!claimed) break;
      void process(claimed).catch((err) => logger.error({ err, jobId: claimed }, 'fallo procesando job'));
    }
  } catch (err) {
    logger.error({ err }, 'error en el scan del runner');
  } finally {
    scanning = false;
  }
}

/** Toma el siguiente job respetando la concurrencia por usuario. */
async function claimNext(): Promise<string | null> {
  const candidates = await prisma.downloadJob.findMany({
    where: { Status: 'queued' },
    orderBy: { CreatedAt: 'asc' },
    take: 25,
    select: { Id: true, UserId: true },
  });
  if (candidates.length === 0) return null;

  const now = Date.now();
  const runningByUser = new Map<string, number>();
  for (const [, j] of active) {
    if (j.userId) runningByUser.set(j.userId, (runningByUser.get(j.userId) ?? 0) + 1);
  }

  for (const c of candidates) {
    if ((retryNotBefore.get(c.Id) ?? 0) > now) continue;
    if (c.UserId) {
      const prefs = await prisma.userPreferences.findUnique({ where: { UserId: c.UserId } });
      const userLimit = Math.min(prefs?.ConcurrentDownloads ?? 2, config.maxConcurrentDownloads);
      if ((runningByUser.get(c.UserId) ?? 0) >= userLimit) continue;
    }
    // claim atómico: ROWLOCK + READPAST evita que dos runners tomen el mismo
    const rows = await prisma.$queryRaw<{ Id: string }[]>`
      UPDATE DownloadJobs WITH (ROWLOCK, READPAST)
      SET Status = N'downloading', StartedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
      OUTPUT inserted.Id
      WHERE Id = ${c.Id} AND Status = N'queued'`;
    if (rows.length > 0) {
      active.set(c.Id, { userId: c.UserId, abort: new AbortController() });
      return c.Id;
    }
  }
  return null;
}

async function emitJob(jobId: string, event: 'progress' | 'status' | 'completed' | 'failed'): Promise<void> {
  const job = await prisma.downloadJob.findUnique({ where: { Id: jobId }, include: { MediaSource: true } });
  if (!job?.UserId) return;
  sseEmit(job.UserId, event, { jobId, job: jobDto(job) });
}

async function process(jobId: string): Promise<void> {
  const entry = active.get(jobId);
  const job = await prisma.downloadJob.findUnique({ where: { Id: jobId }, include: { MediaSource: true } });
  if (!job || !entry) {
    active.delete(jobId);
    return;
  }
  await emitJob(jobId, 'status');

  const prefs = job.UserId
    ? await prisma.userPreferences.findUnique({ where: { UserId: job.UserId } })
    : null;
  const template = prefs?.FilenameTemplate ?? '{titulo}-{calidad}';
  const baseName = applyFilenameTemplate(template, {
    titulo: sanitizeFilename(job.MediaSource.Title),
    calidad: job.Quality.replace('Audio ', '').toLowerCase(),
    plataforma: job.MediaSource.Platform.toLowerCase(),
    fecha: new Date().toISOString().slice(0, 10),
  });

  const partialDir = path.join(config.downloadRoot, '.partial', jobId);
  await mkdir(partialDir, { recursive: true });

  let lastPersist = 0;
  const persistProgress = async (p: {
    percent: number;
    downloadedBytes: number;
    totalBytes: number | null;
    speedBytesPerSec: number | null;
    etaSeconds: number | null;
  }) => {
    await prisma.downloadJob.update({
      where: { Id: jobId },
      data: {
        ProgressPercent: Math.round(p.percent * 100) / 100,
        DownloadedBytes: BigInt(Math.round(p.downloadedBytes)),
        TotalBytes: p.totalBytes != null ? BigInt(Math.round(p.totalBytes)) : undefined,
        SpeedBytesPerSec: p.speedBytesPerSec != null ? BigInt(Math.round(p.speedBytesPerSec)) : null,
        EtaSeconds: p.etaSeconds != null ? Math.round(p.etaSeconds) : null,
      },
    });
  };

  try {
    const result = await getExtractor().download(
      {
        jobId,
        sourceUrl: job.MediaSource.SourceUrl,
        quality: job.Quality,
        format: job.Format,
        includeSubtitles: job.IncludeSubtitles,
        includeThumbnail: job.IncludeThumbnail,
        partialDir,
        baseName,
      },
      (p) => {
        const now = Date.now();
        // SSE en tiempo real; persistencia con throttle de 1 s
        void emitProgressLight(job.UserId, jobId, p);
        if (now - lastPersist >= 1000) {
          lastPersist = now;
          void persistProgress(p).catch(() => undefined);
        }
      },
      entry.abort.signal,
    );

    await onCompleted(jobId, result.filePath, result.fileSizeBytes);
  } catch (err) {
    if (entry.abort.signal.aborted) {
      // pausa o cancelación: el estado ya lo fijó la ruta; el parcial se conserva
      logger.info({ jobId }, 'descarga interrumpida (pausa/cancelación)');
    } else {
      await onFailed(jobId, err);
    }
  } finally {
    active.delete(jobId);
  }
}

function emitProgressLight(
  userId: string | null,
  jobId: string,
  p: { percent: number; downloadedBytes: number; totalBytes: number | null; speedBytesPerSec: number | null; etaSeconds: number | null },
): void {
  if (!userId) return;
  sseEmit(userId, 'progress', {
    jobId,
    pct: Math.round(p.percent * 100) / 100,
    downloadedBytes: Math.round(p.downloadedBytes),
    totalBytes: p.totalBytes,
    speed: p.speedBytesPerSec,
    etaS: p.etaSeconds ?? 0,
  });
}

async function onCompleted(jobId: string, tempFilePath: string, fileSizeBytes: number): Promise<void> {
  const job = await prisma.downloadJob.findUniqueOrThrow({
    where: { Id: jobId },
    include: { MediaSource: true },
  });

  // mover a su destino final
  const fileName = path.basename(tempFilePath);
  let finalPath: string;
  if (job.UserId) {
    finalPath = path.join(config.downloadRoot, fileName);
    let n = 1;
    while (existsSync(finalPath)) {
      const ext = path.extname(fileName);
      finalPath = path.join(config.downloadRoot, `${path.basename(fileName, ext)}-${n++}${ext}`);
    }
  } else {
    // invitados: carpeta propia por job, se sirve por /downloads/:id/file
    const guestDir = path.join(config.downloadRoot, 'guest', jobId);
    await mkdir(guestDir, { recursive: true });
    finalPath = path.join(guestDir, fileName);
  }
  await rename(tempFilePath, finalPath);
  await rm(path.join(config.downloadRoot, '.partial', jobId), { recursive: true, force: true }).catch(
    () => undefined,
  );

  const now = new Date();
  await prisma.downloadJob.update({
    where: { Id: jobId },
    data: {
      Status: 'completed',
      ProgressPercent: 100,
      CompletedAt: now,
      SpeedBytesPerSec: null,
      EtaSeconds: 0,
      TotalBytes: BigInt(fileSizeBytes),
      DownloadedBytes: BigInt(fileSizeBytes),
    },
  });

  if (job.UserId) {
    const periodStart = new Date();
    periodStart.setUTCDate(1);
    periodStart.setUTCHours(0, 0, 0, 0);

    const item = await prisma.libraryItem.create({
      data: {
        UserId: job.UserId,
        DownloadJobId: job.Id,
        MediaSourceId: job.MediaSourceId,
        Title: job.MediaSource.Title,
        FilePath: path.relative(config.downloadRoot, finalPath),
        FileSizeBytes: BigInt(fileSizeBytes),
        Format: job.Format,
        Quality: job.Quality,
      },
    });
    if (job.TargetCollectionId) {
      const owned = await prisma.collection.findFirst({
        where: { Id: job.TargetCollectionId, UserId: job.UserId },
      });
      if (owned) {
        await prisma.collectionItem.create({
          data: { CollectionId: owned.Id, LibraryItemId: item.Id },
        });
      }
    }
    await prisma.usageCounter.upsert({
      where: { UserId_PeriodStart: { UserId: job.UserId, PeriodStart: periodStart } },
      create: { UserId: job.UserId, PeriodStart: periodStart, DownloadsUsed: 1 },
      update: { DownloadsUsed: { increment: 1 } },
    });
    await prisma.notification.create({
      data: {
        UserId: job.UserId,
        Type: 'download_completed',
        Payload: JSON.stringify({ jobId, title: job.MediaSource.Title, libraryItemId: item.Id }),
      },
    });
    void notifyPush(job.UserId, 'download_completed', {
      title: 'Descarga completada',
      body: `«${job.MediaSource.Title}» ya está en tu biblioteca`,
      url: '/#/biblioteca',
      tag: 'grabber-dl',
    });
  }

  await emitJob(jobId, 'completed');
  logger.info({ jobId }, 'job completado');
}

async function onFailed(jobId: string, err: unknown): Promise<void> {
  const code: ErrorCode = err instanceof ExtractorError ? err.code : 'EXTRACTOR_FAILED';
  const transient = err instanceof ExtractorError ? err.transient : false;
  const message = ERROR_CATALOG[code].message;

  const job = await prisma.downloadJob.update({
    where: { Id: jobId },
    data: { Attempts: { increment: 1 }, ErrorCode: code, ErrorMessage: message },
  });

  // reintento con espera exponencial solo para errores transitorios (red, timeout)
  if (transient && job.Attempts < 3) {
    retryNotBefore.set(jobId, Date.now() + 2 ** job.Attempts * 5_000);
    await prisma.downloadJob.update({
      where: { Id: jobId },
      data: { Status: 'queued', SpeedBytesPerSec: null, EtaSeconds: null },
    });
    logger.warn({ jobId, code, attempt: job.Attempts }, 'job devuelto a la cola para reintento');
    return;
  }

  await prisma.downloadJob.update({
    where: { Id: jobId },
    data: { Status: 'failed', SpeedBytesPerSec: null, EtaSeconds: null },
  });
  if (job.UserId) {
    const source = await prisma.mediaSource.findUnique({ where: { Id: job.MediaSourceId } });
    await prisma.notification.create({
      data: {
        UserId: job.UserId,
        Type: 'download_failed',
        Payload: JSON.stringify({ jobId, title: source?.Title ?? '', code }),
      },
    });
    void notifyPush(job.UserId, 'download_failed', {
      title: 'Descarga fallida',
      body: `«${source?.Title ?? 'Tu descarga'}» no se pudo completar`,
      url: '/#/cola',
      tag: 'grabber-dl',
    });
  }
  await emitJob(jobId, 'failed');
  logger.warn({ jobId, code }, 'job fallido');
}
