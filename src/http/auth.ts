import type { FastifyReply, FastifyRequest } from 'fastify';
import { createHash } from 'node:crypto';
import { AppError } from './errors.js';
import { verifyAccessToken } from '../modules/auth/tokens.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string | null;
    sessionId: string | null;
  }
}

export async function optionalAuth(req: FastifyRequest): Promise<void> {
  req.userId = null;
  req.sessionId = null;
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return;
  const claims = await verifyAccessToken(header.slice(7));
  if (claims) {
    req.userId = claims.sub;
    req.sessionId = claims.sid;
  }
}

export async function requireAuth(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  await optionalAuth(req);
  if (!req.userId) throw new AppError('UNAUTHORIZED');
}

/** Huella de invitado: hash de IP + user agent (nunca se guarda la IP en claro aquí). */
export function guestFingerprint(req: FastifyRequest): string {
  return createHash('sha256')
    .update(`${req.ip}|${req.headers['user-agent'] ?? ''}`)
    .digest('hex')
    .slice(0, 64);
}
