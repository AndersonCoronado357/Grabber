import type { DownloadJob, MediaSource } from '@prisma/client';
import { humanSize, humanSpeed, jobFormatLabel } from '../../shared/format.js';

/**
 * Estados que el frontend consume: queued | analyzing | downloading |
 * paused | error | done. En base de datos se guardan los del spec
 * (completed / failed / canceled); aquí se mapean — el HTML gana.
 */
export function jobStatusDto(dbStatus: string): string {
  if (dbStatus === 'completed') return 'done';
  if (dbStatus === 'failed') return 'error';
  return dbStatus;
}

export function jobDto(job: DownloadJob & { MediaSource: MediaSource }) {
  const pct = Number(job.ProgressPercent);
  return {
    id: job.Id,
    title: job.MediaSource.Title,
    platform: job.MediaSource.Platform,
    format: jobFormatLabel(job.Quality, job.Format),
    quality: job.Quality,
    status: jobStatusDto(job.Status),
    pct,
    speed: job.Status === 'downloading' ? humanSpeed(job.SpeedBytesPerSec) : '—',
    etaS: job.Status === 'downloading' ? (job.EtaSeconds ?? 0) : 0,
    size: humanSize(job.TotalBytes ?? job.DownloadedBytes),
    downloadedBytes: Number(job.DownloadedBytes),
    totalBytes: job.TotalBytes != null ? Number(job.TotalBytes) : null,
    errorCode: job.ErrorCode,
    errorMessage: job.ErrorMessage,
    attempts: job.Attempts,
    createdAt: job.CreatedAt,
    startedAt: job.StartedAt,
    completedAt: job.CompletedAt,
    mediaSourceId: job.MediaSourceId,
    targetCollectionId: job.TargetCollectionId,
  };
}
