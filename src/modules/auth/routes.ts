import type { FastifyInstance } from 'fastify';
import argon2 from 'argon2';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { AppError } from '../../http/errors.js';
import { requireAuth } from '../../http/auth.js';
import { userDto, defaultNotificationSettings } from '../users/serializer.js';
import {
  REFRESH_COOKIE,
  clearRefreshCookie,
  consumeEmailCode,
  consumePasswordReset,
  createSession,
  disableTwoFactor,
  enableTwoFactor,
  isTwoFactorEnabled,
  issueEmailCode,
  issuePasswordReset,
  rotateSession,
  setRefreshCookie,
  setupTwoFactor,
  verifyTotpOrRecovery,
} from './service.js';

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  totp: z.string().trim().optional(),
});

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_.]+$/, 'solo letras, números, punto y guion bajo'),
  password: z.string().min(8).max(200),
  displayName: z.string().trim().min(1).max(80).optional(),
});

/** Rate limit para endpoints sensibles: 10 intentos por 15 minutos por IP. */
const authRateLimit = {
  rateLimit: { max: 10, timeWindow: '15 minutes' },
};

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/register', { config: authRateLimit }, async (req, reply) => {
    const body = registerSchema.parse(req.body);

    const [emailTaken, usernameTaken] = await Promise.all([
      prisma.user.findUnique({ where: { Email: body.email } }),
      prisma.user.findUnique({ where: { Username: body.username } }),
    ]);
    if (emailTaken) throw new AppError('EMAIL_TAKEN', { field: 'email' });
    if (usernameTaken) throw new AppError('USERNAME_TAKEN', { field: 'username' });

    const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
    const user = await prisma.user.create({
      data: {
        Email: body.email,
        Username: body.username,
        PasswordHash: passwordHash,
        DisplayName: body.displayName ?? body.username,
        Preferences: {
          create: { NotificationSettings: JSON.stringify(defaultNotificationSettings()) },
        },
      },
    });
    // Sin muro de verificación: el registro entra directo (así lo hace el
    // frontend), por eso NO se manda código de confirmación — el único correo
    // de la cuenta es el de recuperar contraseña.
    return reply.code(201).send({ user: userDto(user), verificationRequired: false });
  });

  app.post('/auth/login', { config: authRateLimit }, async (req, reply) => {
    const body = credentialsSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { Email: body.email } });
    if (!user || user.DeletedAt || !user.PasswordHash) throw new AppError('INVALID_CREDENTIALS');
    const ok = await argon2.verify(user.PasswordHash, body.password);
    if (!ok) throw new AppError('INVALID_CREDENTIALS');

    if (await isTwoFactorEnabled(user.Id)) {
      if (!body.totp) throw new AppError('TWOFA_REQUIRED');
      await verifyTotpOrRecovery(user.Id, body.totp);
    }

    const { refreshToken, accessToken } = await createSession(user.Id, req);
    setRefreshCookie(reply, refreshToken);
    return { accessToken, user: userDto(user) };
  });

  app.post('/auth/refresh', async (req, reply) => {
    const presented = req.cookies[REFRESH_COOKIE];
    if (!presented) throw new AppError('INVALID_TOKEN');
    const rotated = await rotateSession(presented, req);
    setRefreshCookie(reply, rotated.refreshToken);
    const user = await prisma.user.findUniqueOrThrow({ where: { Id: rotated.userId } });
    return { accessToken: rotated.accessToken, user: userDto(user) };
  });

  app.post('/auth/logout', { preHandler: requireAuth }, async (req, reply) => {
    await prisma.session.updateMany({
      where: { Id: req.sessionId!, UserId: req.userId! },
      data: { RevokedAt: new Date() },
    });
    clearRefreshCookie(reply);
    return { ok: true };
  });

  app.post('/auth/verify-email', { config: authRateLimit }, async (req, reply) => {
    const body = z
      .object({ email: z.string().trim().toLowerCase().email(), code: z.string().trim().length(6) })
      .parse(req.body);
    const user = await prisma.user.findUnique({ where: { Email: body.email } });
    if (!user) throw new AppError('INVALID_CODE');
    await consumeEmailCode(user.Id, body.code);
    const { refreshToken, accessToken } = await createSession(user.Id, req);
    setRefreshCookie(reply, refreshToken);
    const fresh = await prisma.user.findUniqueOrThrow({ where: { Id: user.Id } });
    return { accessToken, user: userDto(fresh) };
  });

  app.post('/auth/verify-email/resend', { config: authRateLimit }, async (req) => {
    const body = z.object({ email: z.string().trim().toLowerCase().email() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { Email: body.email } });
    if (user && !user.EmailVerifiedAt) await issueEmailCode(user.Id, user.Email);
    return { ok: true };
  });

  app.post('/auth/password/forgot', { config: authRateLimit }, async (req) => {
    const body = z.object({ email: z.string().trim().toLowerCase().email() }).parse(req.body);
    await issuePasswordReset(body.email);
    return { ok: true };
  });

  app.post('/auth/password/reset', { config: authRateLimit }, async (req) => {
    const body = z.object({ token: z.string().min(10), password: z.string().min(8).max(200) }).parse(req.body);
    await consumePasswordReset(body.token, body.password);
    return { ok: true };
  });

  // —— 2FA ——

  app.post('/auth/2fa/setup', { preHandler: requireAuth }, async (req) => {
    const { otpauthUri } = await setupTwoFactor(req.userId!);
    return { otpauthUri };
  });

  app.post('/auth/2fa/enable', { preHandler: requireAuth }, async (req) => {
    const body = z.object({ code: z.string().trim().min(6).max(8) }).parse(req.body);
    const { recoveryCodes } = await enableTwoFactor(req.userId!, body.code);
    return { ok: true, recoveryCodes };
  });

  app.post('/auth/2fa/disable', { preHandler: requireAuth }, async (req) => {
    const body = z.object({ code: z.string().trim().min(6).max(12) }).parse(req.body);
    await disableTwoFactor(req.userId!, body.code);
    return { ok: true };
  });

  // —— Sesiones activas ——

  app.get('/auth/sessions', { preHandler: requireAuth }, async (req) => {
    const sessions = await prisma.session.findMany({
      where: { UserId: req.userId!, RevokedAt: null, ExpiresAt: { gt: new Date() } },
      orderBy: { LastSeenAt: 'desc' },
    });
    return {
      sessions: sessions.map((s) => ({
        id: s.Id,
        device: s.DeviceLabel?.split(' · ')[0] ?? 'Dispositivo',
        browser: s.DeviceLabel?.split(' · ')[1] ?? 'Navegador',
        loc: s.IpAddress ?? '—',
        last: s.LastSeenAt,
        current: s.Id === req.sessionId,
      })),
    };
  });

  app.delete('/auth/sessions/:id', { preHandler: requireAuth }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const result = await prisma.session.updateMany({
      where: { Id: id, UserId: req.userId!, RevokedAt: null },
      data: { RevokedAt: new Date() },
    });
    if (result.count === 0) throw new AppError('NOT_FOUND');
    return { ok: true };
  });

  app.delete('/auth/sessions', { preHandler: requireAuth }, async (req) => {
    await prisma.session.updateMany({
      where: { UserId: req.userId!, RevokedAt: null, NOT: { Id: req.sessionId! } },
      data: { RevokedAt: new Date() },
    });
    return { ok: true };
  });
}
