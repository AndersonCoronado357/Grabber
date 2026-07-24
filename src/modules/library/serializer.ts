import type { Prisma } from '@prisma/client';
import { config } from '../../config/env.js';
import {
  PLATFORM_CODE,
  type Platform,
  dateLabel,
  daysSince,
  deletedLabel,
  humanDuration,
  humanSize,
  humanViews,
  jobFormatLabel,
} from '../../shared/format.js';

export type LibraryItemFull = Prisma.LibraryItemGetPayload<{
  include: {
    MediaSource: true;
    CollectionItems: true;
    Tags: { include: { Tag: true } };
  };
}>;

/** DTO de item de biblioteca con los nombres de campo del mock del frontend. */
export function libraryItemDto(item: LibraryItemFull) {
  const platform = item.MediaSource.Platform as Platform;
  return {
    id: item.Id,
    title: item.Title,
    author: item.MediaSource.Author ?? '—',
    platform,
    code: PLATFORM_CODE[platform] ?? platform,
    quality: item.Quality.startsWith('Audio') ? 'Audio' : item.Quality,
    format: jobFormatLabel(item.Quality, item.Format),
    size: humanSize(item.FileSizeBytes),
    sizeB: Math.round(Number(item.FileSizeBytes) / 1024 ** 2),
    duration: humanDuration(item.MediaSource.DurationSeconds),
    thumbnailUrl: item.MediaSource.ThumbnailUrl,
    views: humanViews(item.MediaSource.ViewCount),
    days: daysSince(item.CreatedAt),
    dateLabel: dateLabel(item.CreatedAt),
    favorite: item.IsFavorite,
    mediaSourceId: item.MediaSourceId,
    rawQuality: item.Quality,
    collectionId: item.CollectionItems[0]?.CollectionId ?? null,
    url: item.MediaSource.SourceUrl,
    notes: item.Notes ?? '',
    tags: item.Tags.map((t) => t.Tag.Name),
    fileMissing: item.FileMissing,
    fileUrl: `/api/v1/library/${item.Id}/file`,
    createdAt: item.CreatedAt,
  };
}

/** DTO de papelera: campos del mock (dateLabel 'eliminado hace…', left = días restantes). */
export function trashItemDto(item: LibraryItemFull) {
  const deletedAt = item.DeletedAt ?? new Date();
  const left = Math.max(0, config.trashRetentionDays - daysSince(deletedAt));
  return {
    id: item.Id,
    title: item.Title,
    platform: item.MediaSource.Platform,
    format: jobFormatLabel(item.Quality, item.Format),
    size: humanSize(item.FileSizeBytes),
    dateLabel: deletedLabel(deletedAt),
    left,
    deletedAt,
  };
}
