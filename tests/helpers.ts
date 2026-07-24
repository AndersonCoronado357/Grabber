import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../src/db/client.js';
import { buildApp } from '../src/http/app.js';
import { ensureStorageRoots } from '../src/services/storage/paths.js';
import { setExtractor } from '../src/services/extractor/index.js';
import type {
  AnalyzedMedia,
  DownloadProgress,
  DownloadRequest,
  DownloadResult,
  MediaExtractor,
} from '../src/services/extractor/types.js';

export type App = Awaited<ReturnType<typeof buildApp>>;

/** Limpia todas las tablas entre casos, en orden de dependencias. */
export async function resetDb(): Promise<void> {
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
}

export async function makeApp(): Promise<App> {
  ensureStorageRoots();
  return buildApp();
}

let counter = 0;

/** Registra + verifica un usuario y devuelve su token de acceso. */
export async function registerAndLogin(
  app: App,
  overrides: Partial<{ email: string; username: string; password: string }> = {},
): Promise<{ accessToken: string; userId: string; email: string; password: string; cookie: string }> {
  counter++;
  const email = overrides.email ?? `user${counter}-${Date.now()}@test.local`;
  const username = overrides.username ?? `user${counter}${Date.now() % 100000}`;
  const password = overrides.password ?? 'Segura#12345';

  const reg = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: { email, username, password },
  });
  if (reg.statusCode !== 201) throw new Error(`registro falló: ${reg.body}`);

  // verificar con el código persistido (el mailer solo escribe a disco)
  const user = await prisma.user.findUniqueOrThrow({ where: { Email: email } });
  await prisma.user.update({ where: { Id: user.Id }, data: { EmailVerifiedAt: new Date() } });

  const login = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password },
  });
  if (login.statusCode !== 200) throw new Error(`login falló: ${login.body}`);
  const body = login.json() as { accessToken: string };
  const cookie = login.cookies.find((c) => c.name === 'grabber_refresh')?.value ?? '';
  return { accessToken: body.accessToken, userId: user.Id, email, password, cookie };
}

export function auth(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

export async function createMediaSource(over: Partial<{ title: string; platform: string; url: string }> = {}) {
  counter++;
  return prisma.mediaSource.create({
    data: {
      Platform: over.platform ?? 'YouTube',
      SourceId: `test-${counter}-${Date.now()}`,
      SourceUrl: over.url ?? `https://youtube.com/watch?v=t${counter}`,
      Title: over.title ?? `Video de prueba ${counter}`,
      Author: 'Tester',
      DurationSeconds: 120,
      ViewCount: 1000n,
      AvailableFormats: '[]',
    },
  });
}

/** Extractor simulado: nunca toca la red ni yt-dlp. */
export class FakeExtractor implements MediaExtractor {
  failWith: string | null = null;

  async analyze(url: string): Promise<AnalyzedMedia> {
    return {
      platform: 'YouTube',
      sourceId: `fake-${url.slice(-8)}`,
      sourceUrl: url,
      title: 'Video simulado',
      author: 'Fake',
      durationSeconds: 60,
      thumbnailUrl: null,
      publishedAt: null,
      viewCount: 42,
      formats: [
        { quality: '1080p', format: 'MP4', sizeBytes: 1000, sizeLabel: '1 KB' },
      ],
      raw: {},
    };
  }

  async download(
    req: DownloadRequest,
    onProgress: (p: DownloadProgress) => void,
    _signal: AbortSignal,
  ): Promise<DownloadResult> {
    onProgress({ percent: 50, downloadedBytes: 500, totalBytes: 1000, speedBytesPerSec: 100, etaSeconds: 5 });
    await mkdir(req.partialDir, { recursive: true });
    const filePath = path.join(req.partialDir, `${req.baseName}.mp4`);
    await writeFile(filePath, Buffer.alloc(1000));
    onProgress({ percent: 100, downloadedBytes: 1000, totalBytes: 1000, speedBytesPerSec: 100, etaSeconds: 0 });
    return { filePath, fileSizeBytes: 1000 };
  }
}

export function useFakeExtractor(): FakeExtractor {
  const fake = new FakeExtractor();
  setExtractor(fake);
  return fake;
}

export { prisma };
