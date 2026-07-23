import { config } from './config/env.js';
import { prisma } from './db/client.js';
import { buildApp } from './http/app.js';
import { logger } from './http/logger.js';
import { sseCloseAll } from './realtime/sse.js';
import { ensureStorageRoots } from './services/storage/paths.js';
import { detectFullText } from './modules/library/repo.js';
import { startRunner, stopRunner } from './workers/runner.js';
import { startScheduler, stopScheduler } from './workers/scheduler.js';
import { existsSync } from 'node:fs';

async function main(): Promise<void> {
  ensureStorageRoots();

  // verificación temprana de conexión: falla claro si la BD no responde
  await prisma.$queryRaw`SELECT 1 AS ok`;
  logger.info({ db: config.db.name }, 'conexión a SQL Server verificada');

  await detectFullText();

  if (!existsSync(config.ytdlpPath)) {
    logger.warn(
      { path: config.ytdlpPath },
      'yt-dlp no está en YTDLP_PATH: /media/analyze y las descargas fallarán con EXTRACTOR_FAILED hasta colocarlo',
    );
  }

  const app = await buildApp();
  await startRunner();
  startScheduler();

  // Siempre 0.0.0.0: en desarrollo para abrir la app desde el celular en la
  // misma red, y en producción porque dentro del contenedor el proxy llega
  // desde otra IP (escuchar en 127.0.0.1 lo dejaría inalcanzable).
  await app.listen({ port: config.port, host: '0.0.0.0' });
  const host = '0.0.0.0';
  logger.info({ port: config.port, host }, 'Grabber API escuchando');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'apagando…');
    stopScheduler();
    stopRunner();
    sseCloseAll();
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err }, 'el servidor no pudo arrancar');
  process.exit(1);
});
