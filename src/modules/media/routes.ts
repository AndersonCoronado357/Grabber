import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { AppError, ERROR_CATALOG, type ErrorCode } from '../../http/errors.js';
import { optionalAuth } from '../../http/auth.js';
import { getExtractor, ExtractorError, type AnalyzedMedia } from '../../services/extractor/index.js';
import { dateLabel, detectPlatform, humanDuration, humanViews } from '../../shared/format.js';
import type { MediaSource } from '@prisma/client';

const CACHE_TTL_MS = 15 * 60_000;

/** DTO de análisis con los campos que el frontend consume en la tarjeta de resultado. */
export function mediaSourceDto(source: MediaSource) {
  const formats = JSON.parse(source.AvailableFormats) as unknown[];
  return {
    mediaSourceId: source.Id,
    title: source.Title,
    author: source.Author ?? '—',
    platform: source.Platform,
    platformLabel: source.Platform,
    duration: humanDuration(source.DurationSeconds),
    durationSeconds: source.DurationSeconds,
    views: humanViews(source.ViewCount),
    date: source.PublishedAt ? dateLabel(source.PublishedAt) : '—',
    thumbnailUrl: source.ThumbnailUrl,
    url: source.SourceUrl,
    formats,
  };
}

async function upsertSource(analyzed: AnalyzedMedia): Promise<MediaSource> {
  return prisma.mediaSource.upsert({
    where: { Platform_SourceId: { Platform: analyzed.platform, SourceId: analyzed.sourceId } },
    create: {
      Platform: analyzed.platform,
      SourceId: analyzed.sourceId,
      SourceUrl: analyzed.sourceUrl,
      Title: analyzed.title,
      Author: analyzed.author,
      DurationSeconds: analyzed.durationSeconds,
      ThumbnailUrl: analyzed.thumbnailUrl,
      PublishedAt: analyzed.publishedAt,
      ViewCount: analyzed.viewCount != null ? BigInt(analyzed.viewCount) : null,
      AvailableFormats: JSON.stringify(analyzed.formats),
      RawMetadata: JSON.stringify(analyzed.raw).slice(0, 1_000_000),
    },
    update: {
      Title: analyzed.title,
      Author: analyzed.author,
      DurationSeconds: analyzed.durationSeconds,
      ThumbnailUrl: analyzed.thumbnailUrl,
      PublishedAt: analyzed.publishedAt,
      ViewCount: analyzed.viewCount != null ? BigInt(analyzed.viewCount) : null,
      AvailableFormats: JSON.stringify(analyzed.formats),
      RawMetadata: JSON.stringify(analyzed.raw).slice(0, 1_000_000),
      FetchedAt: new Date(),
    },
  });
}

export async function analyzeUrl(url: string): Promise<MediaSource> {
  const trimmed = url.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new AppError('INVALID_URL', { field: 'url' });
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new AppError('INVALID_URL', { field: 'url' });
  if (!detectPlatform(trimmed)) throw new AppError('UNSUPPORTED_PLATFORM', { field: 'url' });

  // caché compartida entre usuarios: si se analizó hace poco, no se relanza el extractor
  const cached = await prisma.mediaSource.findFirst({
    where: { SourceUrl: trimmed, FetchedAt: { gt: new Date(Date.now() - CACHE_TTL_MS) } },
  });
  if (cached) return cached;

  try {
    const analyzed = await getExtractor().analyze(trimmed);
    return await upsertSource(analyzed);
  } catch (err) {
    if (err instanceof ExtractorError) throw new AppError(err.code, { field: 'url' });
    throw err;
  }
}

export async function mediaRoutes(app: FastifyInstance): Promise<void> {
  const analyzeRateLimit = { rateLimit: { max: 30, timeWindow: '1 minute' } };

  app.post('/media/analyze', { config: analyzeRateLimit, preHandler: optionalAuth }, async (req) => {
    const body = z.object({ url: z.string().min(1).max(1000) }).parse(req.body);
    const source = await analyzeUrl(body.url);
    return { media: mediaSourceDto(source) };
  });

  app.post('/media/analyze/batch', { config: analyzeRateLimit, preHandler: optionalAuth }, async (req) => {
    const body = z.object({ urls: z.array(z.string().min(1).max(1000)).min(1).max(20) }).parse(req.body);
    const results = await Promise.all(
      body.urls.map(async (url) => {
        try {
          const source = await analyzeUrl(url);
          return { url, ok: true as const, media: mediaSourceDto(source) };
        } catch (err) {
          if (err instanceof AppError) {
            return { url, ok: false as const, error: { code: err.code, message: err.message, field: null } };
          }
          const code: ErrorCode = 'EXTRACTOR_FAILED';
          return { url, ok: false as const, error: { code, message: ERROR_CATALOG[code].message, field: null } };
        }
      }),
    );
    return { results };
  });
}
