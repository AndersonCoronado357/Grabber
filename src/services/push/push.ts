import webpush from 'web-push';
import { config } from '../../config/env.js';
import { prisma } from '../../db/client.js';
import { logger } from '../../http/logger.js';

/**
 * Web Push nativo (VAPID). Ningún módulo fuera de aquí conoce `web-push`:
 * el resto del backend solo llama a `sendPushToUser` / `notifyPush`.
 */

let configured = false;
function ensureConfigured(): boolean {
  if (!config.push.enabled) return false;
  if (!configured) {
    webpush.setVapidDetails(config.push.subject, config.push.publicKey, config.push.privateKey);
    configured = true;
  }
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/** Envía un push a todas las suscripciones del usuario; poda las muertas (404/410). */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  const subs = await prisma.pushSubscription.findMany({ where: { UserId: userId } });
  if (subs.length === 0) return;

  const data = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.Endpoint, keys: { p256dh: s.P256dh, auth: s.Auth } },
          data,
          { urgency: 'high', TTL: 12 * 3600 },
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { Id: s.Id } }).catch(() => undefined);
        } else {
          logger.warn({ status, userId }, 'fallo al enviar push');
        }
      }
    }),
  );
}

/**
 * Mapa tipo-de-notificación → clave de preferencia (done/error/features/
 * weekly/billing). Solo se envía push si el usuario lo tiene activo en esa fila.
 */
const TYPE_TO_PREF: Record<string, string> = {
  download_completed: 'done',
  download_failed: 'error',
  weekly_summary: 'weekly',
  library_file_missing: 'error',
  new_feature: 'features',
  billing_receipt: 'billing',
};

/** Comprueba la preferencia push del usuario y envía si procede. */
export async function notifyPush(
  userId: string,
  type: string,
  payload: PushPayload,
): Promise<void> {
  if (!config.push.enabled) return;
  const prefKey = TYPE_TO_PREF[type];
  if (prefKey) {
    const prefs = await prisma.userPreferences.findUnique({ where: { UserId: userId } });
    if (prefs) {
      try {
        const settings = JSON.parse(prefs.NotificationSettings) as Record<
          string,
          Record<string, boolean>
        >;
        const row = settings[prefKey];
        if (row && row.push === false) return; // el usuario apagó push para este evento
      } catch {
        /* JSON corrupto → se envía igual */
      }
    }
  }
  await sendPushToUser(userId, payload);
}
