/**
 * Login con Google (OAuth 2.0) sobre el auth propio de Grabber.
 *
 * Va montado en la RAÍZ (no bajo /api/v1) para que la URI de redirección sea
 * https://<dominio>/auth/google/callback, que es la que se registra en Google
 * Cloud Console.
 *
 * Flujo: /auth/google → consentimiento de Google → /auth/google/callback →
 * se busca o crea el usuario por correo (Google ya lo verificó), se abre sesión
 * (cookie de refresco httpOnly) y se redirige a la app: el SPA hace tryRefresh()
 * al arrancar y entra solo, sin pasar tokens por la URL.
 */
import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { config } from '../../config/env.js';
import { logger } from '../../http/logger.js';
import { defaultNotificationSettings } from '../users/serializer.js';
import { createSession, setRefreshCookie } from './service.js';

const STATE_COOKIE = 'grabber_oauth_state';

function redirectUri(): string {
  return `${config.origin}/auth/google/callback`;
}

/** Nombre de usuario libre a partir del correo (alex@x.com → alex, alex2, …). */
async function uniqueUsername(email: string): Promise<string> {
  const base = (email.split('@')[0] || 'usuario')
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '')
    .slice(0, 24) || 'usuario';
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}${i + 1}`;
    const taken = await prisma.user.findUnique({ where: { Username: candidate } });
    if (!taken) return candidate;
  }
  return `${base}${randomBytes(3).toString('hex')}`;
}

export async function googleAuthRoutes(app: FastifyInstance): Promise<void> {
  /** Arranca el flujo: manda al consentimiento de Google. */
  app.get('/auth/google', async (req, reply) => {
    if (!config.google.enabled) {
      return reply.redirect(`${config.origin}/?oauth=disabled`);
    }
    const state = randomBytes(16).toString('hex');
    reply.setCookie(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.env === 'production',
      path: '/auth/google',
      maxAge: 600, // 10 minutos
    });
    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: redirectUri(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  /** Vuelta de Google: canjea el código, abre sesión y entra a la app. */
  app.get('/auth/google/callback', async (req, reply) => {
    const back = (motivo: string) => reply.redirect(`${config.origin}/?oauth=${motivo}`);
    if (!config.google.enabled) return back('disabled');

    const query = z
      .object({ code: z.string().optional(), state: z.string().optional(), error: z.string().optional() })
      .parse(req.query);
    if (query.error || !query.code) return back('cancelado');

    // El state debe coincidir con la cookie (protección CSRF).
    const expected = req.cookies[STATE_COOKIE];
    reply.clearCookie(STATE_COOKIE, { path: '/auth/google' });
    if (!expected || !query.state || expected !== query.state) return back('estado');

    try {
      // 1) código → tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: query.code,
          client_id: config.google.clientId,
          client_secret: config.google.clientSecret,
          redirect_uri: redirectUri(),
          grant_type: 'authorization_code',
        }),
      });
      const tokens = (await tokenRes.json()) as { access_token?: string; error?: string };
      if (!tokenRes.ok || !tokens.access_token) {
        logger.warn({ error: tokens.error }, 'Google: no se pudo canjear el código');
        return back('token');
      }

      // 2) tokens → perfil
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const info = (await infoRes.json()) as {
        email?: string;
        email_verified?: boolean;
        name?: string;
      };
      const email = info.email?.trim().toLowerCase();
      if (!infoRes.ok || !email) return back('perfil');

      // 3) buscar o crear la cuenta (el correo ya viene verificado por Google)
      let user = await prisma.user.findUnique({ where: { Email: email } });
      if (user?.DeletedAt) return back('cuenta');
      if (!user) {
        user = await prisma.user.create({
          data: {
            Email: email,
            Username: await uniqueUsername(email),
            DisplayName: info.name?.trim().slice(0, 80) || email.split('@')[0],
            PasswordHash: null, // solo entra con Google hasta que ponga contraseña
            EmailVerifiedAt: new Date(),
            Preferences: {
              create: { NotificationSettings: JSON.stringify(defaultNotificationSettings()) },
            },
          },
        });
        logger.info({ user: user.Id }, 'cuenta creada con Google');
      } else if (!user.EmailVerifiedAt && info.email_verified) {
        user = await prisma.user.update({
          where: { Id: user.Id },
          data: { EmailVerifiedAt: new Date() },
        });
      }

      // 4) sesión (cookie httpOnly) y a la app: el SPA hace tryRefresh() al cargar
      const { refreshToken } = await createSession(user.Id, req);
      setRefreshCookie(reply, refreshToken);
      return reply.redirect(`${config.origin}/`);
    } catch (err) {
      logger.error({ err }, 'fallo en el callback de Google');
      return back('error');
    }
  });
}
