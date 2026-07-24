import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  auth,
  createMediaSource,
  makeApp,
  prisma,
  registerAndLogin,
  resetDb,
  useFakeExtractor,
  type App,
} from './helpers.js';
import { startRunner, stopRunner } from '../src/workers/runner.js';
import { config } from '../src/config/env.js';

let app: App;

beforeAll(async () => {
  app = await makeApp();
  useFakeExtractor();
});
afterAll(async () => {
  stopRunner();
  await app.close();
  await prisma.$disconnect();
});
beforeEach(resetDb);

describe('transiciones de estado de un job', () => {
  it('queued → paused → queued → canceled vía rutas', async () => {
    const u = await registerAndLogin(app);
    const source = await createMediaSource();

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/downloads',
      headers: auth(u.accessToken),
      payload: { mediaSourceId: source.Id, quality: '1080p', format: 'MP4' },
    });
    expect(created.statusCode).toBe(201);
    const job = created.json().job;
    expect(job.status).toBe('queued');
    expect(job.format).toBe('1080p MP4');

    const paused = await app.inject({
      method: 'POST',
      url: `/api/v1/downloads/${job.id}/pause`,
      headers: auth(u.accessToken),
    });
    expect(paused.json().job.status).toBe('paused');

    const resumed = await app.inject({
      method: 'POST',
      url: `/api/v1/downloads/${job.id}/resume`,
      headers: auth(u.accessToken),
    });
    expect(resumed.json().job.status).toBe('queued');

    const canceled = await app.inject({
      method: 'DELETE',
      url: `/api/v1/downloads/${job.id}`,
      headers: auth(u.accessToken),
    });
    expect(canceled.statusCode).toBe(200);

    // cancelado no aparece en la cola
    const list = await app.inject({ method: 'GET', url: '/api/v1/downloads', headers: auth(u.accessToken) });
    expect(list.json().jobs).toHaveLength(0);
    // pero en BD queda con el estado canónico del spec
    const db = await prisma.downloadJob.findUniqueOrThrow({ where: { Id: job.id } });
    expect(db.Status).toBe('canceled');
  });

  it('el runner completa un job con el extractor simulado y crea el item de biblioteca', async () => {
    const u = await registerAndLogin(app);
    const source = await createMediaSource({ title: 'Descarga runner' });

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/downloads',
      headers: auth(u.accessToken),
      payload: { mediaSourceId: source.Id, quality: '720p' },
    });
    const jobId = created.json().job.id as string;

    await startRunner();
    try {
      // esperar a que el runner lo procese
      const deadline = Date.now() + 15_000;
      let status = 'queued';
      while (Date.now() < deadline) {
        const row = await prisma.downloadJob.findUniqueOrThrow({ where: { Id: jobId } });
        status = row.Status;
        if (status === 'completed' || status === 'failed') break;
        await new Promise((r) => setTimeout(r, 250));
      }
      expect(status).toBe('completed');
    } finally {
      stopRunner();
    }

    const item = await prisma.libraryItem.findFirstOrThrow({ where: { DownloadJobId: jobId } });
    expect(item.UserId).toBe(u.userId);
    expect(Number(item.FileSizeBytes)).toBe(1000);

    // contador de uso incrementado y notificación creada
    const counter = await prisma.usageCounter.findFirstOrThrow({ where: { UserId: u.userId } });
    expect(counter.DownloadsUsed).toBe(1);
    const notif = await prisma.notification.findFirstOrThrow({ where: { UserId: u.userId } });
    expect(notif.Type).toBe('download_completed');

    // el DTO mapea completed → done (literal del frontend)
    const list = await app.inject({ method: 'GET', url: '/api/v1/downloads', headers: auth(u.accessToken) });
    expect(list.json().jobs[0].status).toBe('done');
  });
});

describe('muro de invitado', () => {
  it(`permite ${config.guestDownloadLimit} descargas sin cuenta y luego responde QUOTA_EXCEEDED`, async () => {
    const source = await createMediaSource();
    let last: { statusCode: number; json: () => { guestLeft?: number; error?: { code: string } } } | undefined;
    for (let i = 0; i < config.guestDownloadLimit; i++) {
      last = await app.inject({
        method: 'POST',
        url: '/api/v1/downloads',
        payload: { mediaSourceId: source.Id, quality: '720p' },
      });
      expect(last.statusCode).toBe(201);
    }
    expect(last!.json().guestLeft).toBe(0);

    const blocked = await app.inject({
      method: 'POST',
      url: '/api/v1/downloads',
      payload: { mediaSourceId: source.Id, quality: '720p' },
    });
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json().error.code).toBe('QUOTA_EXCEEDED');
    expect(blocked.json().error.message).toBe('Sin descargas de invitado');
  });
});
