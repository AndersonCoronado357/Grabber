import type { Platform } from '../../shared/format.js';
import type { ErrorCode } from '../../http/errors.js';

export interface AnalyzedFormat {
  /** Valor literal del selector del frontend: '2160p' … '480p', 'Audio MP3', 'Audio M4A'. */
  quality: string;
  /** 'MP4' | 'MP3' | 'M4A' */
  format: string;
  /** Peso estimado en bytes (null si la plataforma no lo expone). */
  sizeBytes: number | null;
  /** Etiqueta humana del peso: '2.8 GB', '12 MB'. */
  sizeLabel: string;
}

export interface AnalyzedMedia {
  platform: Platform;
  sourceId: string;
  sourceUrl: string;
  title: string;
  author: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
  viewCount: number | null;
  formats: AnalyzedFormat[];
  raw: unknown;
}

export interface DownloadProgress {
  percent: number;
  downloadedBytes: number;
  totalBytes: number | null;
  speedBytesPerSec: number | null;
  etaSeconds: number | null;
}

export interface DownloadRequest {
  jobId: string;
  sourceUrl: string;
  quality: string;
  format: string;
  includeSubtitles: boolean;
  includeThumbnail: boolean;
  /** Directorio de trabajo para el archivo parcial. */
  partialDir: string;
  /** Nombre base (sin extensión) del archivo final. */
  baseName: string;
}

export interface DownloadResult {
  filePath: string;
  fileSizeBytes: number;
}

export class ExtractorError extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    /** true si vale la pena reintentar (red, timeout). */
    readonly transient = false,
  ) {
    super(message ?? code);
  }
}

export interface MediaExtractor {
  analyze(url: string): Promise<AnalyzedMedia>;
  download(
    req: DownloadRequest,
    onProgress: (p: DownloadProgress) => void,
    signal: AbortSignal,
  ): Promise<DownloadResult>;
}
