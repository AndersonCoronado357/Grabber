import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  auth,
  createMediaSource,
  makeApp,
  prisma,
  registerAndLogin,
  resetDb,
  type App,
} from './helpers.js';
import { purgeTrash } from '../src/workers/scheduler.js';
import { config } from '../src/config/env.js';

let app: App;

beforeAll(async () => {
  app = await makeApp();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});
beforeEach(resetDb);

async function seedItem(
  userId: string,
  over: Partial<{
    title: string;
    platform: string;
    format: string;
    quality: string;
    size: number;
    favorite: boolean;
    createdAt: Date;
    deletedAt: Date | null;
  }> = {},
) {
  const source = await createMediaSource({ platform: over.platform ?? 'YouTube' });
  return prisma.libraryItem.create({
    data: {
      UserId: userId,
      MediaSourceId: source.Id,
      Title: over.title ?? source.Title,
      FilePath: `test/${source.SourceId}.mp4`,
      FileSizeBytes: BigInt(over.size ?? 1000),
      Format: over.format ?? 'MP4',
      Quality: over.quality ?? '1080p',
      IsFavorite: over.favorite ?? false,
      CreatedAt: over.createdAt ?? new Date(),
      DeletedAt: over.deletedAt ?? null,
    },
  });
}

describe('aislamiento por usuario', () => {
  it('un usuario no puede leer ni modificar items de otro', async () => {
    const a = await registerAndLogin(app);
    const b = await registerAndLogin(app);
    const item = await seedItem(a.userId, { title: 'Privado de A' });

    const read = await app.inject({
      method: 'GET',
      url: `/api/v1/library/${item.Id}`,
      headers: auth(b.accessToken),
    });
    expect(read.statusCode).toBe(404);

    const patch = await app.inject({
      method: 'PATCH',
      url: `/api/v1/library/${item.Id}`,
      headers: auth(b.accessToken),
      payload: { title: 'hackeado' },
    });
    expect(patch.statusCode).toBe(404);

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/v1/library/${item.Id}`,
      headers: auth(b.accessToken),
    });
    expect(del.statusCode).toBe(404);

    // el listado de B no incluye el item de A
    const list = await app.inject({ method: 'GET', url: '/api/v1/library', headers: auth(b.accessToken) });
    expect(list.json().items).toHaveLength(0);

    // y el título original sigue intacto
    const fresh = await prisma.libraryItem.findUniqueOrThrow({ where: { Id: item.Id } });
    expect(fresh.Title).toBe('Privado de A');
  });

  it('bulk ignora ids ajenos', async () => {
    const a = await registerAndLogin(app);
    const b = await registerAndLogin(app);
    const ajeno = await seedItem(a.userId);
    const propio = await seedItem(b.userId);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/library/bulk',
      headers: auth(b.accessToken),
      payload: { ids: [ajeno.Id, propio.Id], action: 'favorite' },
    });
    expect(res.statusCode).toBe(200);
    expect((await prisma.libraryItem.findUniqueOrThrow({ where: { Id: ajeno.Id } })).IsFavorite).toBe(false);
    expect((await prisma.libraryItem.findUniqueOrThrow({ where: { Id: propio.Id } })).IsFavorite).toBe(true);
  });
});

describe('filtros y paginación por cursor', () => {
  it('filtra por plataforma, formato, calidad y favoritos', async () => {
    const u = await registerAndLogin(app);
    await seedItem(u.userId, { platform: 'YouTube', quality: '1080p', favorite: true, title: 'yt fav' });
    await seedItem(u.userId, { platform: 'TikTok', quality: '720p', title: 'tiktok' });
    await seedItem(u.userId, { platform: 'YouTube', quality: 'Audio MP3', format: 'MP3', title: 'audio' });

    const byPlat = await app.inject({
      method: 'GET',
      url: '/api/v1/library?platform=TikTok',
      headers: auth(u.accessToken),
    });
    expect(byPlat.json().items.map((i: { title: string }) => i.title)).toEqual(['tiktok']);

    const byQuality = await app.inject({
      method: 'GET',
      url: '/api/v1/library?quality=Audio',
      headers: auth(u.accessToken),
    });
    expect(byQuality.json().items.map((i: { title: string }) => i.title)).toEqual(['audio']);

    const byFav = await app.inject({
      method: 'GET',
      url: '/api/v1/library?favorite=true',
      headers: auth(u.accessToken),
    });
    expect(byFav.json().items.map((i: { title: string }) => i.title)).toEqual(['yt fav']);

    const search = await app.inject({
      method: 'GET',
      url: '/api/v1/library?q=tikt',
      headers: auth(u.accessToken),
    });
    expect(search.json().items.map((i: { title: string }) => i.title)).toEqual(['tiktok']);
  });

  it('pagina con cursor estable sin repetir ni saltarse items', async () => {
    const u = await registerAndLogin(app);
    for (let i = 0; i < 7; i++) {
      await seedItem(u.userId, {
        title: `Item ${i}`,
        createdAt: new Date(Date.now() - i * 60_000),
      });
    }
    const seen = new Set<string>();
    let cursor: string | null = null;
    let rounds = 0;
    do {
      const url = `/api/v1/library?limit=3${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
      const res = await app.inject({ method: 'GET', url, headers: auth(u.accessToken) });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { items: { id: string }[]; nextCursor: string | null };
      for (const item of body.items) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
      cursor = body.nextCursor;
      rounds++;
    } while (cursor && rounds < 10);
    expect(seen.size).toBe(7);
    expect(rounds).toBe(3); // 3 + 3 + 1
  });
});

describe('papelera', () => {
  it('borrado lógico, restauración y purga por retención', async () => {
    const u = await registerAndLogin(app);
    const item = await seedItem(u.userId, { title: 'A la papelera' });

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/v1/library/${item.Id}`,
      headers: auth(u.accessToken),
    });
    expect(del.statusCode).toBe(200);

    const trash = await app.inject({ method: 'GET', url: '/api/v1/library/trash', headers: auth(u.accessToken) });
    expect(trash.json().items).toHaveLength(1);
    expect(trash.json().items[0].left).toBeLessThanOrEqual(config.trashRetentionDays);

    const restore = await app.inject({
      method: 'POST',
      url: `/api/v1/library/${item.Id}/restore`,
      headers: auth(u.accessToken),
    });
    expect(restore.statusCode).toBe(200);
    expect((await prisma.libraryItem.findUniqueOrThrow({ where: { Id: item.Id } })).DeletedAt).toBeNull();

    // purga: un item borrado hace más días que la retención desaparece
    const viejo = await seedItem(u.userId, {
      title: 'Muy viejo',
      deletedAt: new Date(Date.now() - (config.trashRetentionDays + 2) * 86_400_000),
    });
    const reciente = await seedItem(u.userId, { title: 'Reciente', deletedAt: new Date() });
    await purgeTrash();
    expect(await prisma.libraryItem.findUnique({ where: { Id: viejo.Id } })).toBeNull();
    expect(await prisma.libraryItem.findUnique({ where: { Id: reciente.Id } })).not.toBeNull();
  });
});
