import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { config } from '../../config/env.js';

const accessKey = new TextEncoder().encode(config.jwt.accessSecret);

export interface AccessClaims {
  sub: string;
  sid: string;
}

export async function signAccessToken(userId: string, sessionId: string): Promise<string> {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer('grabber')
    .setExpirationTime(Math.floor(Date.now() / 1000) + config.jwt.accessTtlSeconds)
    .sign(accessKey);
}

export async function verifyAccessToken(token: string): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, accessKey, { issuer: 'grabber' });
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') return null;
    return { sub: payload.sub, sid: payload.sid };
  } catch {
    return null;
  }
}

/** Refresh token opaco: 48 bytes aleatorios; solo se persiste su hash. */
export function newRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
