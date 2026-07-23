import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { z, ZodError } from 'zod';
import { config } from '../config/env.js';
import { prisma } from '../db/client.js';
import { sendMail } from '../services/mailer/mailer.js';
import { logger } from './logger.js';
import { AppError } from './errors.js';
import { authRoutes } from '../modules/auth/routes.js';
import { googleAuthRoutes } from '../modules/auth/google.js';
import { userRoutes } from '../modules/users/routes.js';
import { mediaRoutes } from '../modules/media/routes.js';
import { downloadRoutes } from '../modules/downloads/routes.js';
import { libraryRoutes } from '../modules/library/routes.js';
import { collectionRoutes } from '../modules/collections/routes.js';
import { notificationRoutes } from '../modules/notifications/routes.js';
import { billingRoutes, billingWebhookRoutes } from '../modules/billing/routes.js';

export async function buildApp() {
  const app = Fastify({
    loggerInstance: logger.child({ mod: 'http' }),
    // Detrás del proxy de acmsy (Caddy) hay que confiar en X-Forwarded-* para
    // que req.protocol sea https y req.ip sea la IP real (rate limit correcto).
    trustProxy: config.env === 'production',
    bodyLimit: 1024 * 1024,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false, // API JSON; el frontend se sirve aparte
    crossOriginResourcePolicy: { policy: 'same-site' },
  });
  await app.register(cors, {
    // En producción el frontend se sirve desde el MISMO origen público; se
    // admiten ambos para no romper el desarrollo local.
    origin: [config.corsOrigin, config.origin].filter((v, i, a) => v && a.indexOf(v) === i),
    credentials: true,
  });
  await app.register(cookie);
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
  await app.register(rateLimit, {
    global: false,
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () => ({
      error: { code: 'RATE_LIMITED', message: 'Demasiados intentos, espera un momento', field: null },
    }),
  });

  // assets de marca (favicon, manifest, iconos)
  await app.register(fastifyStatic, {
    root: path.resolve('public'),
    prefix: '/public/',
    decorateReply: false,
  });

  // frontend (Grabber.dc.html cableado al API) servido en /
  // sin caché: en desarrollo el HTML/JS cambia a menudo y el navegador
  // debe traer siempre la última versión (evita ver una build vieja).
  await app.register(fastifyStatic, {
    root: path.resolve('public/app'),
    prefix: '/',
    index: 'index.html',
    decorateReply: false,
    etag: false,
    lastModified: false,
    cacheControl: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    },
  });

  // Forma única de error: { error: { code, message, field } }
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof AppError) {
      return reply.code(err.status).send(err.toBody());
    }
    if (err instanceof ZodError) {
      const first = err.issues[0];
      return reply.code(400).send({
        error: {
          code: 'VALIDATION',
          message: first ? `${first.path.join('.')}: ${first.message}` : 'Datos inválidos',
          field: first?.path.join('.') || null,
        },
      });
    }
    if ((err as { statusCode?: number }).statusCode === 429) {
      return reply
        .code(429)
        .send({ error: { code: 'RATE_LIMITED', message: 'Demasiados intentos, espera un momento', field: null } });
    }
    req.log.error({ err }, 'error no controlado');
    return reply.code(500).send({ error: { code: 'INTERNAL', message: 'Algo salió mal', field: null } });
  });

  app.setNotFoundHandler((_req, reply) =>
    reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No encontrado', field: null } }),
  );

  app.get('/health', async () => ({ ok: true, ts: new Date().toISOString() }));

  // Login con Google en la RAÍZ: la URI registrada en Google Cloud Console es
  // https://<dominio>/auth/google/callback (sin el prefijo /api/v1).
  await app.register(googleAuthRoutes);

  // estado público (página "Estado" del frontend)
  app.get('/api/v1/status', async () => {
    let db = false;
    try {
      await prisma.$queryRaw`SELECT 1 AS ok`;
      db = true;
    } catch {
      /* la BD no responde */
    }
    const [active, queued] = db
      ? await Promise.all([
          prisma.downloadJob.count({ where: { Status: 'downloading' } }),
          prisma.downloadJob.count({ where: { Status: 'queued' } }),
        ])
      : [0, 0];
    return {
      api: true,
      db,
      extractor: existsSync(config.ytdlpPath),
      queue: { active, queued },
      ts: new Date().toISOString(),
    };
  });

  // contacto: en local el mensaje se escribe a disco vía el mailer
  app.post(
    '/api/v1/contact',
    { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } },
    async (req) => {
      const body = z
        .object({
          email: z.string().trim().toLowerCase().email(),
          message: z.string().trim().min(5).max(2000),
        })
        .parse(req.body);
      await sendMail({
        to: 'soporte@grabber.local',
        subject: `Contacto de ${body.email}`,
        body: body.message,
      });
      return { ok: true };
    },
  );

  await app.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(userRoutes);
      await api.register(mediaRoutes);
      await api.register(downloadRoutes);
      await api.register(libraryRoutes);
      await api.register(collectionRoutes);
      await api.register(notificationRoutes);
      await api.register(billingRoutes);
      await api.register(billingWebhookRoutes);
    },
    { prefix: '/api/v1' },
  );

  return app;
}
