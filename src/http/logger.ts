import pino from 'pino';
import { config, redactValues } from '../config/env.js';

/**
 * Logger con redacción: DB_PASSWORD (y cualquier cadena que la contenga)
 * sale como [redacted]. La cadena de conexión compuesta nunca se loguea.
 */
function scrub(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') {
    let out = value;
    for (const secret of redactValues) {
      if (secret && out.includes(secret)) out = out.split(secret).join('[redacted]');
    }
    return out;
  }
  // los objetos de fastify (req/res/sockets) traen ciclos: límite de
  // profundidad + WeakSet y se devuelven tal cual si se exceden
  if (depth >= 4) return value;
  if (Array.isArray(value)) {
    return value.map((v) => scrub(v, depth + 1, seen));
  }
  if (value && typeof value === 'object') {
    if (seen.has(value)) return value;
    seen.add(value);
    if (Object.getPrototypeOf(value) !== Object.prototype) return value; // solo objetos planos
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = scrub(v, depth + 1, seen);
    }
    return out;
  }
  return value;
}

export const logger = pino({
  level: config.env === 'test' ? 'warn' : 'info',
  redact: { paths: ['DB_PASSWORD', '*.DB_PASSWORD', 'password', '*.password'], censor: '[redacted]' },
  hooks: {
    logMethod(args, method) {
      method.apply(
        this,
        args.map((a) => scrub(a)) as Parameters<typeof method>,
      );
    },
  },
  transport:
    config.env === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
});
