import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../../config/env.js';
import { prisma } from '../../db/client.js';
import { requireAuth } from '../../http/auth.js';
import { AppError } from '../../http/errors.js';
import { dateLabel } from '../../shared/format.js';
import { sendPushToUser } from '../../services/push/push.js';

/** Título humano por tipo, con el tono de los items del popover del frontend. */
function title(type: string, payload: Record<string, unknown>): string {
  const t = typeof payload.title === 'string' ? payload.title : '';
  switch (type) {
    case 'download_completed':
      return `«${t}» terminó de descargarse`;
    case 'download_failed':
      return `«${t}» falló`;
    case 'weekly_summary':
      return 'Tu resumen semanal está listo';
    case 'library_file_missing':
      return `El archivo de «${t}» ya no está en disco`;
    default:
      return t || 'Notificación';
  }
}

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/notifications', async (req) => {
    const rows = await prisma.notification.findMany({
      where: { UserId: req.userId! },
      orderBy: { CreatedAt: 'desc' },
      take: 50,
    });
    const unread = await prisma.notification.count({
      where: { UserId: req.userId!, ReadAt: null },
    });
    return {
      unread,
      notifications: rows.map((n) => {
        const payload = safeParse(n.Payload);
        return {
          id: n.Id,
          type: n.Type,
          title: title(n.Type, payload),
          time: dateLabel(n.CreatedAt),
          read: !!n.ReadAt,
          payload,
          createdAt: n.CreatedAt,
        };
      }),
    };
  });

  app.post('/notifications/:id/read', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const result = await prisma.notification.updateMany({
      where: { Id: id, UserId: req.userId!, ReadAt: null },
      data: { ReadAt: new Date() },
    });
    if (result.count === 0) throw new AppError('NOT_FOUND');
    return { ok: true };
  });

  app.post('/notifications/read-all', async (req) => {
    await prisma.notification.updateMany({
      where: { UserId: req.userId!, ReadAt: null },
      data: { ReadAt: new Date() },
    });
    return { ok: true };
  });

  // —— Web Push (VAPID) ——

  // clave pública para que el navegador se suscriba
  app.get('/push/vapid-key', async () => ({
    publicKey: config.push.enabled ? config.push.publicKey : '',
    enabled: config.push.enabled,
  }));

  // guardar/actualizar la suscripción del navegador actual (upsert por endpoint)
  app.post('/push/subscribe', async (req) => {
    const body = z
      .object({
        endpoint: z.string().url().max(500),
        keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
      })
      .parse(req.body);
    const ua = String(req.headers['user-agent'] ?? '').slice(0, 300);
    await prisma.pushSubscription.upsert({
      where: { Endpoint: body.endpoint },
      create: {
        UserId: req.userId!,
        Endpoint: body.endpoint,
        P256dh: body.keys.p256dh,
        Auth: body.keys.auth,
        UserAgent: ua,
      },
      update: { UserId: req.userId!, P256dh: body.keys.p256dh, Auth: body.keys.auth, UserAgent: ua },
    });
    return { ok: true };
  });

  // borrar la suscripción (al desactivar push)
  app.post('/push/unsubscribe', async (req) => {
    const body = z.object({ endpoint: z.string().url().max(500) }).parse(req.body);
    await prisma.pushSubscription.deleteMany({
      where: { Endpoint: body.endpoint, UserId: req.userId! },
    });
    return { ok: true };
  });

  // enviar un push de prueba al usuario actual (para confirmar el permiso)
  app.post('/push/test', async (req) => {
    await sendPushToUser(req.userId!, {
      title: 'Grabber',
      body: 'Las notificaciones push están activas ✓',
      url: '/',
      tag: 'grabber-test',
    });
    return { ok: true };
  });
}

function safeParse(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
