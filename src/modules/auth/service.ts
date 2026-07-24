import argon2 from 'argon2';
import { randomInt, randomBytes } from 'node:crypto';
import * as OTPAuth from 'otpauth';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../db/client.js';
import { config } from '../../config/env.js';
import { AppError } from '../../http/errors.js';
import { logger } from '../../http/logger.js';
import { sendMail, verificationMail, passwordResetMail } from '../../services/mailer/mailer.js';
import { hashToken, newRefreshToken, signAccessToken } from './tokens.js';
import { decryptSecret, encryptSecret } from './totp-crypto.js';

export const REFRESH_COOKIE = 'grabber_refresh';

export function setRefreshCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
    path: '/api/v1/auth',
    maxAge: config.jwt.refreshTtlSeconds,
  });
}

export function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
}

function deviceLabel(userAgent: string | undefined): string {
  const ua = userAgent ?? '';
  if (/iphone/i.test(ua)) return 'iPhone';
  if (/ipad/i.test(ua)) return 'iPad';
  if (/android/i.test(ua)) return 'Android';
  if (/macintosh/i.test(ua)) return 'Mac';
  if (/windows/i.test(ua)) return 'Windows PC';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Dispositivo';
}

function browserLabel(userAgent: string | undefined): string {
  const ua = userAgent ?? '';
  if (/edg\//i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/firefox/i.test(ua)) return 'Firefox';
  return 'Navegador';
}

export async function createSession(
  userId: string,
  req: FastifyRequest,
): Promise<{ sessionId: string; refreshToken: string; accessToken: string }> {
  const refreshToken = newRefreshToken();
  const session = await prisma.session.create({
    data: {
      UserId: userId,
      RefreshTokenHash: hashToken(refreshToken),
      UserAgent: (req.headers['user-agent'] ?? '').slice(0, 400),
      IpAddress: req.ip.slice(0, 45),
      DeviceLabel: `${deviceLabel(req.headers['user-agent'])} · ${browserLabel(req.headers['user-agent'])}`,
      ExpiresAt: new Date(Date.now() + config.jwt.refreshTtlSeconds * 1000),
    },
  });
  const accessToken = await signAccessToken(userId, session.Id);
  return { sessionId: session.Id, refreshToken, accessToken };
}

export async function rotateSession(
  presentedToken: string,
  req: FastifyRequest,
): Promise<{ userId: string; sessionId: string; refreshToken: string; accessToken: string }> {
  const presentedHash = hashToken(presentedToken);
  const now = new Date();

  const session = await prisma.session.findFirst({
    where: { RefreshTokenHash: presentedHash, RevokedAt: null, ExpiresAt: { gt: now } },
  });

  if (!session) {
    // Detección de reutilización: si el hash coincide con un token ya rotado,
    // alguien está reusando un refresh viejo → se revoca toda la familia.
    const reused = await prisma.session.findFirst({ where: { PriorTokenHash: presentedHash } });
    if (reused) {
      await prisma.session.updateMany({
        where: { UserId: reused.UserId, RevokedAt: null },
        data: { RevokedAt: now },
      });
      logger.warn({ userId: reused.UserId }, 'refresh reutilizado: familia de sesiones revocada');
    }
    throw new AppError('INVALID_TOKEN');
  }

  const refreshToken = newRefreshToken();
  await prisma.session.update({
    where: { Id: session.Id },
    data: {
      RefreshTokenHash: hashToken(refreshToken),
      PriorTokenHash: presentedHash,
      LastSeenAt: now,
      IpAddress: req.ip.slice(0, 45),
      ExpiresAt: new Date(Date.now() + config.jwt.refreshTtlSeconds * 1000),
    },
  });
  const accessToken = await signAccessToken(session.UserId, session.Id);
  return { userId: session.UserId, sessionId: session.Id, refreshToken, accessToken };
}

export async function issueEmailCode(userId: string, email: string): Promise<void> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await prisma.emailVerificationCode.create({
    data: {
      UserId: userId,
      CodeHash: hashToken(code),
      ExpiresAt: new Date(Date.now() + 15 * 60_000),
    },
  });
  await sendMail(verificationMail(email, code));
}

export async function consumeEmailCode(userId: string, code: string): Promise<void> {
  const now = new Date();
  const record = await prisma.emailVerificationCode.findFirst({
    where: { UserId: userId, ConsumedAt: null, ExpiresAt: { gt: now } },
    orderBy: { CreatedAt: 'desc' },
  });
  if (!record) throw new AppError('INVALID_CODE');
  if (record.Attempts >= 5) throw new AppError('INVALID_CODE');
  if (record.CodeHash !== hashToken(code)) {
    await prisma.emailVerificationCode.update({
      where: { Id: record.Id },
      data: { Attempts: { increment: 1 } },
    });
    throw new AppError('INVALID_CODE');
  }
  await prisma.$transaction([
    prisma.emailVerificationCode.update({ where: { Id: record.Id }, data: { ConsumedAt: now } }),
    prisma.user.update({ where: { Id: userId }, data: { EmailVerifiedAt: now } }),
  ]);
}

export async function issuePasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { Email: email } });
  // Silencio deliberado si el correo no existe: no filtramos qué cuentas hay.
  if (!user || user.DeletedAt) return;
  const token = randomBytes(32).toString('base64url');
  await prisma.passwordResetToken.create({
    data: {
      UserId: user.Id,
      TokenHash: hashToken(token),
      ExpiresAt: new Date(Date.now() + 30 * 60_000),
    },
  });
  await sendMail(passwordResetMail(email, token));
}

export async function consumePasswordReset(token: string, newPassword: string): Promise<void> {
  const now = new Date();
  const record = await prisma.passwordResetToken.findFirst({
    where: { TokenHash: hashToken(token), ConsumedAt: null, ExpiresAt: { gt: now } },
  });
  if (!record) throw new AppError('INVALID_CODE');
  const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
  await prisma.$transaction([
    prisma.passwordResetToken.update({ where: { Id: record.Id }, data: { ConsumedAt: now } }),
    prisma.user.update({ where: { Id: record.UserId }, data: { PasswordHash: passwordHash } }),
    // cambiar contraseña cierra todas las sesiones abiertas
    prisma.session.updateMany({ where: { UserId: record.UserId, RevokedAt: null }, data: { RevokedAt: now } }),
  ]);
}

// —— 2FA (TOTP) ——

export function buildTotp(secretBase32: string, account: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: 'Grabber',
    label: account,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export async function setupTwoFactor(userId: string): Promise<{ otpauthUri: string; secret: string }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { Id: userId } });
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  await prisma.twoFactorSecret.upsert({
    where: { UserId: userId },
    create: { UserId: userId, SecretEncrypted: encryptSecret(secret) },
    update: { SecretEncrypted: encryptSecret(secret), EnabledAt: null, RecoveryCodesHash: null },
  });
  return { otpauthUri: buildTotp(secret, user.Email).toString(), secret };
}

export async function enableTwoFactor(userId: string, code: string): Promise<{ recoveryCodes: string[] }> {
  const record = await prisma.twoFactorSecret.findUnique({ where: { UserId: userId } });
  if (!record) throw new AppError('INVALID_CODE');
  const secret = decryptSecret(Buffer.from(record.SecretEncrypted));
  const user = await prisma.user.findUniqueOrThrow({ where: { Id: userId } });
  const delta = buildTotp(secret, user.Email).validate({ token: code, window: 1 });
  if (delta === null) throw new AppError('INVALID_CODE');

  const recoveryCodes = Array.from({ length: 8 }, () => randomBytes(5).toString('hex'));
  const hashes = await Promise.all(recoveryCodes.map((c) => argon2.hash(c, { type: argon2.argon2id })));
  await prisma.twoFactorSecret.update({
    where: { UserId: userId },
    data: { EnabledAt: new Date(), RecoveryCodesHash: JSON.stringify(hashes) },
  });
  return { recoveryCodes };
}

export async function disableTwoFactor(userId: string, code: string): Promise<void> {
  await verifyTotpOrRecovery(userId, code);
  await prisma.twoFactorSecret.delete({ where: { UserId: userId } });
}

export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const record = await prisma.twoFactorSecret.findUnique({ where: { UserId: userId } });
  return !!record?.EnabledAt;
}

export async function verifyTotpOrRecovery(userId: string, code: string): Promise<void> {
  const record = await prisma.twoFactorSecret.findUnique({ where: { UserId: userId } });
  if (!record?.EnabledAt) throw new AppError('INVALID_CODE');
  const secret = decryptSecret(Buffer.from(record.SecretEncrypted));
  const user = await prisma.user.findUniqueOrThrow({ where: { Id: userId } });
  if (buildTotp(secret, user.Email).validate({ token: code, window: 1 }) !== null) return;

  // códigos de recuperación
  const hashes: string[] = record.RecoveryCodesHash ? JSON.parse(record.RecoveryCodesHash) : [];
  for (let i = 0; i < hashes.length; i++) {
    if (await argon2.verify(hashes[i]!, code)) {
      hashes.splice(i, 1);
      await prisma.twoFactorSecret.update({
        where: { UserId: userId },
        data: { RecoveryCodesHash: JSON.stringify(hashes) },
      });
      return;
    }
  }
  throw new AppError('INVALID_CODE');
}
