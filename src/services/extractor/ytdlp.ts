import { spawn } from 'node:child_process';
import { existsSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { config } from '../../config/env.js';
import { logger } from '../../http/logger.js';
import { detectPlatform, humanSize, QUALITIES } from '../../shared/format.js';
import {
  ExtractorError,
  type AnalyzedFormat,
  type AnalyzedMedia,
  type DownloadProgress,
  type DownloadRequest,
  type DownloadResult,
  type MediaExtractor,
} from './types.js';

/**
 * Implementación sobre yt-dlp. Ningún módulo fuera de services/extractor
 * conoce el binario: los controladores hablan solo con MediaExtractor.
 */

const HEIGHT_BY_QUALITY: Record<string, number> = {
  '2160p': 2160,
  '1440p': 1440,
  '1080p': 1080,
  '720p': 720,
  '480p': 480,
  '360p': 360,
};

function normalizeError(stderr: string): ExtractorError {
  const s = stderr.toLowerCase();
  if (s.includes('private video') || s.includes('this video is private'))
    return new ExtractorError('SOURCE_PRIVATE');
  if (s.includes('private account') || s.includes('account is private'))
    return new ExtractorError('ACCOUNT_PRIVATE');
  if (
    s.includes('video unavailable') ||
    s.includes('removed') ||
    s.includes('no longer available') ||
    s.includes('404') ||
    s.includes('not found')
  )
    return new ExtractorError('SOURCE_UNAVAILABLE');
  if (s.includes('unsupported url') || s.includes('no suitable extractor'))
    return new ExtractorError('UNSUPPORTED_PLATFORM');
  if (s.includes('is not a valid url') || s.includes('invalid url'))
    return new ExtractorError('INVALID_URL');
  if (
    s.includes('timed out') ||
    s.includes('timeout') ||
    s.includes('connection reset') ||
    s.includes('temporary failure') ||
    s.includes('network')
  )
    return new ExtractorError('EXTRACTOR_FAILED', undefined, true);
  return new ExtractorError('EXTRACTOR_FAILED');
}

function run(
  args: string[],
  opts: { signal?: AbortSignal; onLine?: (line: string) => void } = {},
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    if (!existsSync(config.ytdlpPath)) {
      reject(
        new ExtractorError(
          'EXTRACTOR_FAILED',
          `No se encontró yt-dlp en ${config.ytdlpPath}. Descárgalo de https://github.com/yt-dlp/yt-dlp y colócalo ahí (o ajusta YTDLP_PATH).`,
        ),
      );
      return;
    }
    const child = spawn(config.ytdlpPath, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    let buffered = '';

    const onAbort = () => {
      child.kill('SIGTERM');
    };
    opts.signal?.addEventListener('abort', onAbort, { once: true });

    child.stdout.on('data', (d: Buffer) => {
      const text = d.toString('utf8');
      stdout += text;
      if (opts.onLine) {
        buffered += text;
        const lines = buffered.split(/\r?\n/);
        buffered = lines.pop() ?? '';
        for (const l of lines) if (l.trim()) opts.onLine(l.trim());
      }
    });
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString('utf8');
    });
    child.on('error', (err) => {
      opts.signal?.removeEventListener('abort', onAbort);
      reject(new ExtractorError('EXTRACTOR_FAILED', err.message, true));
    });
    child.on('close', (code) => {
      opts.signal?.removeEventListener('abort', onAbort);
      if (opts.signal?.aborted) {
        reject(new ExtractorError('EXTRACTOR_FAILED', 'cancelado', false));
        return;
      }
      if (code === 0) resolve({ stdout, stderr });
      else reject(normalizeError(stderr || stdout));
    });
  });
}

function buildFormats(info: Record<string, unknown>): AnalyzedFormat[] {
  const rawFormats = Array.isArray(info.formats) ? (info.formats as Record<string, unknown>[]) : [];
  const out: AnalyzedFormat[] = [];

  for (const q of QUALITIES) {
    if (q.startsWith('Audio')) {
      const best = rawFormats
        .filter((f) => f.vcodec === 'none' && typeof f.abr === 'number')
        .sort((a, b) => Number(b.abr) - Number(a.abr))[0];
      const size = best ? Number(best.filesize ?? best.filesize_approx ?? 0) || null : null;
      out.push({
        quality: q,
        format: q === 'Audio MP3' ? 'MP3' : 'M4A',
        sizeBytes: size,
        sizeLabel: humanSize(size),
      });
      continue;
    }
    const height = HEIGHT_BY_QUALITY[q]!;
    const candidates = rawFormats.filter(
      (f) => typeof f.height === 'number' && Math.abs(Number(f.height) - height) <= height * 0.15,
    );
    if (candidates.length === 0 && height > 1080) continue; // la fuente no llega a esa calidad
    const best = candidates.sort(
      (a, b) => Number(b.tbr ?? 0) - Number(a.tbr ?? 0),
    )[0];
    const size = best ? Number(best.filesize ?? best.filesize_approx ?? 0) || null : null;
    out.push({ quality: q, format: 'MP4', sizeBytes: size, sizeLabel: humanSize(size) });
  }
  return out;
}

export class YtDlpExtractor implements MediaExtractor {
  async analyze(url: string): Promise<AnalyzedMedia> {
    const platform = detectPlatform(url);
    if (!platform) throw new ExtractorError('UNSUPPORTED_PLATFORM');

    const { stdout } = await run(['--dump-single-json', '--no-playlist', '--no-warnings', url]);
    let info: Record<string, unknown>;
    try {
      info = JSON.parse(stdout) as Record<string, unknown>;
    } catch {
      throw new ExtractorError('EXTRACTOR_FAILED');
    }

    const publishedAt =
      typeof info.upload_date === 'string' && /^\d{8}$/.test(info.upload_date)
        ? new Date(
            `${info.upload_date.slice(0, 4)}-${info.upload_date.slice(4, 6)}-${info.upload_date.slice(6, 8)}T00:00:00Z`,
          )
        : null;

    return {
      platform,
      sourceId: String(info.id ?? url),
      sourceUrl: String(info.webpage_url ?? url),
      title: String(info.title ?? 'Sin título'),
      author: info.uploader ? String(info.uploader) : info.channel ? String(info.channel) : null,
      durationSeconds: typeof info.duration === 'number' ? Math.round(info.duration) : null,
      thumbnailUrl: info.thumbnail ? String(info.thumbnail) : null,
      publishedAt,
      viewCount: typeof info.view_count === 'number' ? info.view_count : null,
      formats: buildFormats(info),
      raw: info,
    };
  }

  async download(
    req: DownloadRequest,
    onProgress: (p: DownloadProgress) => void,
    signal: AbortSignal,
  ): Promise<DownloadResult> {
    const isAudio = req.quality.startsWith('Audio');
    const outTemplate = path.join(req.partialDir, `${req.baseName}.%(ext)s`);

    const args = ['--newline', '--no-playlist', '--no-warnings', '-o', outTemplate];
    args.push(
      '--progress-template',
      'download:GRABBER|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s',
    );
    if (isAudio) {
      args.push('-x', '--audio-format', req.format === 'MP3' ? 'mp3' : 'm4a');
      args.push('-f', 'bestaudio/best');
    } else {
      const h = HEIGHT_BY_QUALITY[req.quality] ?? 1080;
      args.push('-f', `bestvideo[height<=${h}]+bestaudio/best[height<=${h}]/best`);
      args.push('--merge-output-format', 'mp4');
    }
    if (req.includeSubtitles) args.push('--write-subs', '--sub-langs', 'es.*,en.*');
    if (req.includeThumbnail) args.push('--write-thumbnail');
    args.push(req.sourceUrl);

    await run(args, {
      signal,
      onLine: (line) => {
        if (!line.startsWith('GRABBER|')) return;
        const [, downloaded, total, totalEst, speed, eta] = line.split('|');
        const totalBytes = Number(total) || Number(totalEst) || null;
        const downloadedBytes = Number(downloaded) || 0;
        onProgress({
          percent: totalBytes ? Math.min(100, (downloadedBytes / totalBytes) * 100) : 0,
          downloadedBytes,
          totalBytes,
          speedBytesPerSec: Number(speed) || null,
          etaSeconds: Number(eta) || null,
        });
      },
    });

    // localizar el archivo final producido (yt-dlp resuelve la extensión)
    const wantedExt = isAudio ? (req.format === 'MP3' ? '.mp3' : '.m4a') : '.mp4';
    const files = readdirSync(req.partialDir).filter((f) => f.startsWith(req.baseName));
    const media =
      files.find((f) => f.toLowerCase().endsWith(wantedExt)) ??
      files.find((f) => !/\.(json|jpg|jpeg|png|webp|vtt|srt|part)$/i.test(f));
    if (!media) throw new ExtractorError('EXTRACTOR_FAILED', 'no se encontró el archivo descargado');

    const filePath = path.join(req.partialDir, media);
    const fileSizeBytes = statSync(filePath).size;
    logger.info({ jobId: req.jobId, filePath, fileSizeBytes }, 'descarga completada por el extractor');
    return { filePath, fileSizeBytes };
  }
}
