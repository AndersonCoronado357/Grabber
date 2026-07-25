/**
 * Seed de desarrollo: un usuario, 12 items de biblioteca de plataformas
 * variadas, 5 jobs en estados distintos, 3 colecciones y 2 items en
 * papelera — los mismos datos simulados del frontend (Grabber.dc.html),
 * para que la interfaz se pueda probar contra datos reales.
 *
 * Credenciales: alex@correo.com / Grabber#2026
 */
import argon2 from 'argon2';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from './client.js';
import { config } from '../config/env.js';
import { defaultNotificationSettings } from '../modules/users/serializer.js';

/** Crea un archivo de relleno pequeño para que la reconciliación no marque el item. */
async function placeholderFile(relPath: string): Promise<void> {
  const abs = path.resolve(config.downloadRoot, relPath);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, Buffer.from('grabber seed placeholder'));
}

const MB = 1024 * 1024;
const GB = 1024 * MB;
const DAY = 86_400_000;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY);
}

function dur(text: string): number {
  const parts = text.split(':').map(Number);
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

interface SeedVideo {
  title: string;
  author: string;
  platform: string;
  quality: string;
  format: string;
  sizeBytes: number;
  duration: string;
  views: number;
  days: number;
  favorite: boolean;
  collection: string | null;
  url: string;
  tags: string[];
}

const VIDEOS: SeedVideo[] = [
  { title: 'Cómo funciona la compresión de video moderna, explicado a fondo', author: 'Estudio Norte', platform: 'YouTube', quality: '1080p', format: 'MP4', sizeBytes: 720 * MB, duration: '12:04', views: 1_200_000, days: 5, favorite: true, collection: 'Referencias de edición', url: 'https://youtube.com/watch?v=a1b2c3', tags: ['tutorial', 'codec'] },
  { title: 'Entrevista completa — sesión de estudio en directo', author: 'Canal Abierto', platform: 'Facebook', quality: '1440p', format: 'MP4', sizeBytes: 1.4 * GB, duration: '48:21', views: 82_000, days: 12, favorite: false, collection: null, url: 'https://facebook.com/watch/?v=771122', tags: ['entrevista'] },
  { title: 'Rutina de color en Instagram — antes y después', author: '@lumafilms', platform: 'Instagram', quality: '1080p', format: 'MP4', sizeBytes: 88 * MB, duration: '0:58', views: 340_000, days: 2, favorite: true, collection: null, url: 'https://instagram.com/reel/xyz', tags: ['color', 'reel'] },
  { title: 'Ambient para concentrarse — una hora', author: 'Nocturne', platform: 'YouTube', quality: 'Audio MP3', format: 'MP3', sizeBytes: 58 * MB, duration: '1:02:00', views: 3_100_000, days: 20, favorite: false, collection: 'Música y audio', url: 'https://youtube.com/watch?v=amb01', tags: ['música', 'focus'] },
  { title: 'Hilo desmontado en 90 segundos', author: '@datosgraf', platform: 'X', quality: '720p', format: 'MP4', sizeBytes: 40 * MB, duration: '1:31', views: 210_000, days: 1, favorite: false, collection: null, url: 'https://x.com/datosgraf/status/1', tags: [] },
  { title: 'Charla completa de la conferencia de otoño', author: 'Foro Diseño', platform: 'Facebook', quality: '1080p', format: 'MP4', sizeBytes: 150 * MB, duration: '34:12', views: 56_000, days: 40, favorite: false, collection: 'Ver después', url: 'https://facebook.com/watch/?v=99', tags: ['charla'] },
  { title: 'Timelapse de la ciudad en 4K, noche completa', author: 'Estudio Norte', platform: 'YouTube', quality: '2160p', format: 'MP4', sizeBytes: 2.8 * GB, duration: '6:40', views: 910_000, days: 8, favorite: true, collection: 'Referencias de edición', url: 'https://youtube.com/watch?v=tl4k', tags: ['4k', 'timelapse'] },
  { title: 'Detrás de cámaras — dirección de fotografía', author: 'Canal Abierto', platform: 'YouTube', quality: '1080p', format: 'MP4', sizeBytes: 500 * MB, duration: '22:15', views: 44_000, days: 15, favorite: false, collection: 'Música y audio', url: 'https://youtube.com/watch?v=554433', tags: ['bts'] },
  { title: 'Truco de transición vertical', author: '@editcuts', platform: 'TikTok', quality: '720p', format: 'MP4', sizeBytes: 18 * MB, duration: '0:22', views: 2_400_000, days: 3, favorite: false, collection: null, url: 'https://tiktok.com/@editcuts/video/1', tags: ['transición'] },
  { title: 'Receta corta — pan sin amasar', author: '@cocinaplana', platform: 'Instagram', quality: '720p', format: 'MP4', sizeBytes: 60 * MB, duration: '0:44', views: 780_000, days: 6, favorite: false, collection: 'Ver después', url: 'https://instagram.com/reel/pan', tags: ['receta'] },
  { title: 'Explicación del algoritmo de recomendación', author: 'r/programacion', platform: 'Reddit', quality: '480p', format: 'MP4', sizeBytes: 30 * MB, duration: '8:03', views: 19_000, days: 30, favorite: false, collection: null, url: 'https://reddit.com/r/programacion/x', tags: [] },
  { title: 'Sesión de mezcla — masterclass de audio', author: 'Nocturne', platform: 'YouTube', quality: 'Audio M4A', format: 'M4A', sizeBytes: 92 * MB, duration: '1:48:00', views: 128_000, days: 50, favorite: true, collection: 'Música y audio', url: 'https://youtube.com/watch?v=mix01', tags: ['audio', 'master'] },
];

const TRASH = [
  { title: 'Clip privado que fue eliminado', platform: 'TikTok', quality: '720p', format: 'MP4', sizeBytes: 24 * MB, duration: '0:31', deletedDays: 3, url: 'https://tiktok.com/@x/video/9' },
  { title: 'Video antiguo de prueba', platform: 'Reddit', quality: '480p', format: 'MP4', sizeBytes: 30 * MB, duration: '2:10', deletedDays: 11, url: 'https://reddit.com/r/test/old' },
];

const COLLECTIONS = [
  { name: 'Referencias de edición', color: '#8A6D6D', days: 5 },
  { name: 'Ver después', color: '#6D7F8A', days: 1 },
  { name: 'Música y audio', color: '#7A6D8A', days: 20 },
];

const QUEUE = [
  { title: 'Cómo funciona la compresión de video moderna', platform: 'YouTube', quality: '1080p', format: 'MP4', status: 'downloading', pct: 42, speed: 8.4 * MB, eta: 38, total: 182 * MB, duration: '12:04', url: 'https://youtube.com/watch?v=q-comp' },
  { title: 'Entrevista completa — sesión de estudio', platform: 'YouTube', quality: '1440p', format: 'MP4', status: 'downloading', pct: 12, speed: 5.1 * MB, eta: 120, total: 640 * MB, duration: '48:21', url: 'https://youtube.com/watch?v=q-entrev' },
  { title: 'Clip corto vertical', platform: 'TikTok', quality: '720p', format: 'MP4', status: 'paused', pct: 60, speed: 0, eta: 0, total: 24 * MB, duration: '0:18', url: 'https://tiktok.com/@q/video/3' },
  { title: 'Este video ya no está disponible', platform: 'X', quality: '720p', format: 'MP4', status: 'failed', pct: 0, speed: 0, eta: 0, total: 0, duration: '1:00', url: 'https://x.com/gone/status/404' },
  { title: 'Documental — parte 1', platform: 'YouTube', quality: 'Audio MP3', format: 'MP3', status: 'completed', pct: 100, speed: 0, eta: 0, total: 58 * MB, duration: '58:00', url: 'https://youtube.com/watch?v=q-doc1' },
];

async function main(): Promise<void> {
  console.log('Sembrando base de desarrollo…');

  // limpiar en orden de dependencias
  await prisma.$transaction([
    prisma.libraryItemTag.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.collectionItem.deleteMany(),
    prisma.collection.deleteMany(),
    prisma.libraryItem.deleteMany(),
    prisma.downloadJob.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.usageCounter.deleteMany(),
    prisma.guestUsage.deleteMany(),
    prisma.mediaSource.deleteMany(),
    prisma.session.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.emailVerificationCode.deleteMany(),
    prisma.twoFactorSecret.deleteMany(),
    prisma.userPreferences.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const user = await prisma.user.create({
    data: {
      Email: 'alex@correo.com',
      Username: 'alexrivera',
      DisplayName: 'Alex Rivera',
      Bio: 'Archivo referencias de edición, charlas y música para el estudio.',
      PasswordHash: await argon2.hash('Grabber#2026', { type: argon2.argon2id }),
      EmailVerifiedAt: daysAgo(480),
      Plan: 'pro',
      CreatedAt: new Date('2025-03-10T12:00:00Z'),
      Preferences: {
        create: {
          Theme: 'system',
          Locale: 'Español',
          Timezone: 'GMT−6 · Ciudad de México',
          DefaultQuality: '1080p',
          DefaultFormat: 'MP4',
          FilenameTemplate: '{titulo}-{calidad}',
          ConcurrentDownloads: 2,
          AutoPurgeTrash: true,
          NotificationSettings: JSON.stringify(defaultNotificationSettings()),
        },
      },
    },
  });

  const collections = new Map<string, string>();
  for (const c of COLLECTIONS) {
    const created = await prisma.collection.create({
      data: {
        UserId: user.Id,
        Name: c.name,
        ColorTag: c.color,
        CreatedAt: daysAgo(c.days + 30),
        UpdatedAt: daysAgo(c.days),
      },
    });
    collections.set(c.name, created.Id);
  }

  let i = 0;
  for (const v of VIDEOS) {
    i++;
    const source = await prisma.mediaSource.create({
      data: {
        Platform: v.platform,
        SourceId: `seed-${i}`,
        SourceUrl: v.url,
        Title: v.title,
        Author: v.author,
        DurationSeconds: dur(v.duration),
        ViewCount: BigInt(v.views),
        PublishedAt: daysAgo(v.days + 30),
        AvailableFormats: JSON.stringify([]),
      },
    });
    await placeholderFile(`seed/${i}.${v.format.toLowerCase()}`);
    const item = await prisma.libraryItem.create({
      data: {
        UserId: user.Id,
        MediaSourceId: source.Id,
        Title: v.title,
        FilePath: `seed/${i}.${v.format.toLowerCase()}`,
        FileSizeBytes: BigInt(Math.round(v.sizeBytes)),
        Format: v.format,
        Quality: v.quality,
        IsFavorite: v.favorite,
        CreatedAt: daysAgo(v.days),
        UpdatedAt: daysAgo(v.days),
      },
    });
    if (v.collection) {
      await prisma.collectionItem.create({
        data: { CollectionId: collections.get(v.collection)!, LibraryItemId: item.Id },
      });
    }
    for (const name of v.tags) {
      const tag = await prisma.tag.upsert({
        where: { UserId_Name: { UserId: user.Id, Name: name } },
        create: { UserId: user.Id, Name: name },
        update: {},
      });
      await prisma.libraryItemTag.create({ data: { LibraryItemId: item.Id, TagId: tag.Id } });
    }
  }

  for (const t of TRASH) {
    i++;
    const source = await prisma.mediaSource.create({
      data: {
        Platform: t.platform,
        SourceId: `seed-${i}`,
        SourceUrl: t.url,
        Title: t.title,
        DurationSeconds: dur(t.duration),
        AvailableFormats: JSON.stringify([]),
      },
    });
    await placeholderFile(`seed/${i}.mp4`);
    await prisma.libraryItem.create({
      data: {
        UserId: user.Id,
        MediaSourceId: source.Id,
        Title: t.title,
        FilePath: `seed/${i}.mp4`,
        FileSizeBytes: BigInt(t.sizeBytes),
        Format: t.format,
        Quality: t.quality,
        CreatedAt: daysAgo(t.deletedDays + 20),
        DeletedAt: daysAgo(t.deletedDays),
      },
    });
  }

  for (const q of QUEUE) {
    i++;
    const source = await prisma.mediaSource.create({
      data: {
        Platform: q.platform,
        SourceId: `seed-${i}`,
        SourceUrl: q.url,
        Title: q.title,
        DurationSeconds: dur(q.duration),
        AvailableFormats: JSON.stringify([]),
      },
    });
    await prisma.downloadJob.create({
      data: {
        UserId: user.Id,
        MediaSourceId: source.Id,
        // los seeds 'downloading' entran como 'paused' para que el runner
        // no intente bajarlos de verdad al arrancar
        Status: q.status === 'downloading' ? 'paused' : q.status,
        Quality: q.quality,
        Format: q.format,
        ProgressPercent: q.pct,
        TotalBytes: q.total > 0 ? BigInt(Math.round(q.total)) : null,
        DownloadedBytes: BigInt(Math.round((q.total * q.pct) / 100)),
        SpeedBytesPerSec: q.speed > 0 ? BigInt(Math.round(q.speed)) : null,
        EtaSeconds: q.eta || null,
        ErrorCode: q.status === 'failed' ? 'SOURCE_UNAVAILABLE' : null,
        ErrorMessage: q.status === 'failed' ? 'El video ya no está disponible' : null,
        StartedAt: q.status !== 'queued' ? daysAgo(0) : null,
        CompletedAt: q.status === 'completed' ? daysAgo(0) : null,
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      { UserId: user.Id, Type: 'download_completed', Payload: JSON.stringify({ title: 'Documental — parte 1' }) },
      { UserId: user.Id, Type: 'download_failed', Payload: JSON.stringify({ title: 'Este video ya no está disponible', code: 'SOURCE_UNAVAILABLE' }) },
      { UserId: user.Id, Type: 'weekly_summary', Payload: JSON.stringify({}), ReadAt: daysAgo(1), CreatedAt: daysAgo(1) },
    ],
  });

  const periodStart = new Date();
  periodStart.setUTCDate(1);
  periodStart.setUTCHours(0, 0, 0, 0);
  await prisma.usageCounter.create({
    data: { UserId: user.Id, PeriodStart: periodStart, DownloadsUsed: 318 },
  });

  console.log('Listo. Usuario: alex@correo.com · contraseña: Grabber#2026');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
