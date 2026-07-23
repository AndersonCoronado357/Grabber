/**
 * Helpers de presentación. Los formatos de salida replican los literales
 * que el frontend (Grabber.dc.html) ya consume: '720 MB', '1.4 GB',
 * '1.2M', '12:04', 'hace 5 días', 'ayer', etc.
 */

export const PLATFORMS = ['YouTube', 'Instagram', 'TikTok', 'X', 'Facebook', 'Reddit'] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_CODE: Record<Platform, string> = {
  YouTube: 'YT',
  Instagram: 'IG',
  TikTok: 'TT',
  X: 'X',
  Facebook: 'FB',
  Reddit: 'RD',
};

export const QUALITIES = ['2160p', '1440p', '1080p', '720p', '480p', '360p', 'Audio MP3', 'Audio M4A'] as const;
export const FORMATS = ['MP4', 'MP3', 'M4A'] as const;
export const COLLECTION_COLORS = ['#8A6D6D', '#6D7F8A', '#7A6D8A'] as const;

export function detectPlatform(url: string): Platform | null {
  const u = url.toLowerCase();
  if (u.includes('youtu')) return 'YouTube';
  if (u.includes('instagram')) return 'Instagram';
  if (u.includes('tiktok')) return 'TikTok';
  if (u.includes('x.com') || u.includes('twitter')) return 'X';
  if (u.includes('facebook') || u.includes('fb.watch')) return 'Facebook';
  if (u.includes('reddit')) return 'Reddit';
  return null;
}

/** '720 MB' / '1.4 GB' / '58 MB' — mismo estilo que el mock. */
export function humanSize(bytes: number | bigint | null | undefined): string {
  const b = Number(bytes ?? 0);
  if (b <= 0) return '—';
  if (b >= 1024 ** 3) {
    const gb = b / 1024 ** 3;
    return `${gb >= 10 ? Math.round(gb) : Math.round(gb * 10) / 10} GB`;
  }
  if (b >= 1024 ** 2) return `${Math.round(b / 1024 ** 2)} MB`;
  return `${Math.max(1, Math.round(b / 1024))} KB`;
}

/** '8.4 MB/s' */
export function humanSpeed(bytesPerSec: number | bigint | null | undefined): string {
  const b = Number(bytesPerSec ?? 0);
  if (b <= 0) return '—';
  const mb = b / 1024 ** 2;
  return `${mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10} MB/s`;
}

/** '1.2M' / '82K' / '910K' */
export function humanViews(views: number | bigint | null | undefined): string {
  const v = Number(views ?? 0);
  if (v <= 0) return '—';
  if (v >= 1_000_000) return `${Math.round((v / 1_000_000) * 10) / 10}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return String(v);
}

/** '12:04' / '1:02:00' */
export function humanDuration(totalSeconds: number | null | undefined): string {
  const s = Math.max(0, Math.round(totalSeconds ?? 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
}

export function daysSince(date: Date, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}

/** 'hoy' / 'ayer' / 'hace 5 días' / 'hace 6 semanas' / 'hace 2 meses' */
export function dateLabel(date: Date, now = new Date()): string {
  const d = daysSince(date, now);
  if (d === 0) return 'hoy';
  if (d === 1) return 'ayer';
  if (d < 28) return `hace ${d} días`;
  if (d < 60) return `hace ${Math.round(d / 7)} semanas`;
  if (d < 365) return `hace ${Math.round(d / 30)} ${Math.round(d / 30) === 1 ? 'mes' : 'meses'}`;
  const y = Math.round(d / 365);
  return `hace ${y} ${y === 1 ? 'año' : 'años'}`;
}

/** 'eliminado hace 3 días' */
export function deletedLabel(date: Date, now = new Date()): string {
  const base = dateLabel(date, now);
  return base === 'hoy' ? 'eliminado hoy' : base === 'ayer' ? 'eliminado ayer' : `eliminado ${base}`;
}

/** Formato de la cola: '1080p MP4' / 'Audio MP3'. */
export function jobFormatLabel(quality: string, format: string): string {
  if (quality.startsWith('Audio') || format === 'MP3' || format === 'M4A') {
    return `Audio ${format === 'MP4' ? 'MP3' : format}`;
  }
  return `${quality} ${format}`;
}
