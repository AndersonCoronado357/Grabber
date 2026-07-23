import 'dotenv/config';
import { z } from 'zod';

const boolStr = z
  .string()
  .transform((v) => v.trim().toLowerCase())
  .pipe(z.enum(['true', 'false']))
  .transform((v) => v === 'true');

const schema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: z
    .string()
    .optional()
    .default('')
    .transform((v) => (v.trim() === '' ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v > 0 && v < 65536), 'DB_PORT inválido'),
  DB_INSTANCE: z.string().optional().default(''),
  DB_NAME: z.string().min(1),
  DB_NAME_TEST: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_ENCRYPT: boolStr,
  DB_TRUST_SERVER_CERT: boolStr,
  PORT: z.coerce.number().int().positive(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  CORS_ORIGIN: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(48),
  JWT_REFRESH_SECRET: z.string().min(48),
  ACCESS_TOKEN_TTL: z.string().regex(/^\d+[smhd]$/),
  REFRESH_TOKEN_TTL: z.string().regex(/^\d+[smhd]$/),
  TOTP_ENCRYPTION_KEY: z
    .string()
    .refine((v) => Buffer.from(v, 'base64').length === 32, 'TOTP_ENCRYPTION_KEY debe ser 32 bytes en base64'),
  DOWNLOAD_ROOT: z.string().min(1),
  AVATAR_ROOT: z.string().min(1),
  YTDLP_PATH: z.string().min(1),
  MAX_CONCURRENT_DOWNLOADS: z.coerce.number().int().positive(),
  GUEST_DOWNLOAD_LIMIT: z.coerce.number().int().nonnegative(),
  TRASH_RETENTION_DAYS: z.coerce.number().int().positive(),
  // Web Push (VAPID). Opcionales: sin ellas el push queda deshabilitado.
  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  VAPID_SUBJECT: z.string().optional().default('mailto:admin@grabber.local'),
  // Wompi (pasarela de pago, COP). Opcionales: sin ellas los pagos quedan
  // deshabilitados y los planes de pago no se pueden activar.
  WOMPI_ENV: z.enum(['sandbox', 'production']).optional().default('sandbox'),
  WOMPI_PUBLIC_KEY: z.string().optional().default(''),
  WOMPI_PRIVATE_KEY: z.string().optional().default(''),
  WOMPI_INTEGRITY_SECRET: z.string().optional().default(''),
  WOMPI_EVENTS_SECRET: z.string().optional().default(''),
  // URL pública del frontend para el redirect de Wompi tras pagar. Vacío =
  // se deriva del host de la petición (ideal en local/LAN).
  APP_URL: z.string().optional().default(''),
  /**
   * Origen público de la app (https://grabber.acmsy.com). Se usa para enlaces
   * de correo, OAuth y CSRF. NUNCA derivar del host de la petición: tras el
   * proxy llega como localhost.
   */
  ORIGIN: z.string().optional().default(''),
  // Google OAuth (login "Continuar con Google"). Sin ellas, el botón se oculta.
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  throw new Error(`Configuración inválida (.env): ${issues}`);
}

const raw = parsed.data;

/**
 * Compone la cadena de conexión de Prisma para SQL Server.
 * El conector sqlserver usa formato JDBC/ADO.NET (pares clave=valor
 * separados por `;`), NO una URL: aquí encodeURIComponent rompe la
 * autenticación porque `%23`/`%24` quedan literales. El escapado
 * correcto es envolver usuario y contraseña en llaves `{…}` (doblando
 * cualquier `}` interno), que protege `#`, `$`, `;` y espacios.
 * (Verificado empíricamente contra SQL Server 2025 + Prisma 5.)
 */
function escapeOdbcValue(value: string): string {
  return '{' + value.replace(/\}/g, '}}') + '}';
}

export function buildDatabaseUrl(dbName: string): string {
  const user = escapeOdbcValue(raw.DB_USER);
  const pass = escapeOdbcValue(raw.DB_PASSWORD);
  const host = raw.DB_INSTANCE
    ? `${raw.DB_HOST}\\${raw.DB_INSTANCE}`
    : raw.DB_PORT
      ? `${raw.DB_HOST}:${raw.DB_PORT}`
      : raw.DB_HOST;
  return (
    `sqlserver://${host};database=${dbName};user=${user};password=${pass};` +
    `encrypt=${raw.DB_ENCRYPT};trustServerCertificate=${raw.DB_TRUST_SERVER_CERT}`
  );
}

export const databaseUrl = buildDatabaseUrl(raw.DB_NAME);
export const testDatabaseUrl = buildDatabaseUrl(raw.DB_NAME_TEST);

function ttlToSeconds(ttl: string): number {
  const n = parseInt(ttl, 10);
  const unit = ttl.slice(-1);
  const mult = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
  return n * mult;
}

export const config = {
  env: raw.NODE_ENV,
  port: raw.PORT,
  corsOrigin: raw.CORS_ORIGIN,
  /** Origen público (enlaces de correo, OAuth). Cae a CORS_ORIGIN en local. */
  origin: (raw.ORIGIN || raw.CORS_ORIGIN).replace(/\/$/, ''),
  google: {
    clientId: raw.GOOGLE_CLIENT_ID,
    /** secreto — nunca loguear */
    clientSecret: raw.GOOGLE_CLIENT_SECRET,
    enabled: raw.GOOGLE_CLIENT_ID.length > 0 && raw.GOOGLE_CLIENT_SECRET.length > 0,
  },
  db: {
    host: raw.DB_HOST,
    port: raw.DB_PORT,
    instance: raw.DB_INSTANCE || null,
    name: raw.DB_NAME,
    testName: raw.DB_NAME_TEST,
    user: raw.DB_USER,
    /** secreto — nunca loguear; pino lo redacta */
    password: raw.DB_PASSWORD,
    encrypt: raw.DB_ENCRYPT,
    trustServerCert: raw.DB_TRUST_SERVER_CERT,
  },
  jwt: {
    accessSecret: raw.JWT_ACCESS_SECRET,
    refreshSecret: raw.JWT_REFRESH_SECRET,
    accessTtlSeconds: ttlToSeconds(raw.ACCESS_TOKEN_TTL),
    refreshTtlSeconds: ttlToSeconds(raw.REFRESH_TOKEN_TTL),
  },
  totpEncryptionKey: Buffer.from(raw.TOTP_ENCRYPTION_KEY, 'base64'),
  downloadRoot: raw.DOWNLOAD_ROOT,
  avatarRoot: raw.AVATAR_ROOT,
  ytdlpPath: raw.YTDLP_PATH,
  maxConcurrentDownloads: raw.MAX_CONCURRENT_DOWNLOADS,
  guestDownloadLimit: raw.GUEST_DOWNLOAD_LIMIT,
  trashRetentionDays: raw.TRASH_RETENTION_DAYS,
  push: {
    publicKey: raw.VAPID_PUBLIC_KEY,
    /** secreto — nunca loguear */
    privateKey: raw.VAPID_PRIVATE_KEY,
    subject: raw.VAPID_SUBJECT,
    enabled: raw.VAPID_PUBLIC_KEY.length > 0 && raw.VAPID_PRIVATE_KEY.length > 0,
  },
  appUrl: raw.APP_URL,
  wompi: {
    env: raw.WOMPI_ENV,
    publicKey: raw.WOMPI_PUBLIC_KEY,
    /** secreto — nunca loguear */
    privateKey: raw.WOMPI_PRIVATE_KEY,
    /** secreto — nunca loguear */
    integritySecret: raw.WOMPI_INTEGRITY_SECRET,
    /** secreto — nunca loguear */
    eventsSecret: raw.WOMPI_EVENTS_SECRET,
    /** listo para cobrar sólo si están las 3 llaves imprescindibles */
    enabled:
      raw.WOMPI_PUBLIC_KEY.length > 0 &&
      raw.WOMPI_PRIVATE_KEY.length > 0 &&
      raw.WOMPI_INTEGRITY_SECRET.length > 0,
  },
} as const;

/** Base de la API REST de Wompi según el entorno. */
export function wompiApiBase(): string {
  return config.wompi.env === 'production'
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1';
}

/** Valores que pino debe redactar en cualquier log. */
export const redactValues = [
  raw.DB_PASSWORD,
  raw.GOOGLE_CLIENT_SECRET,
  raw.VAPID_PRIVATE_KEY,
  raw.WOMPI_PRIVATE_KEY,
  raw.WOMPI_INTEGRITY_SECRET,
  raw.WOMPI_EVENTS_SECRET,
].filter(Boolean);
