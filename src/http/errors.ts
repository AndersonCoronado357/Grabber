/**
 * Catálogo de errores. Los `code` y sus mensajes mapean a los textos
 * que el frontend (Grabber.dc.html) ya muestra bajo el campo de URL;
 * los literales existentes en el HTML se conservan tal cual.
 */
export const ERROR_CATALOG = {
  // — extracción / análisis de URL (textos del frontend) —
  INVALID_URL: { status: 422, message: 'El enlace no parece válido' },
  SOURCE_UNAVAILABLE: { status: 422, message: 'El video ya no está disponible' },
  SOURCE_PRIVATE: { status: 422, message: 'Este video es privado' },
  ACCOUNT_PRIVATE: { status: 422, message: 'Esta cuenta es privada' },
  UNSUPPORTED_PLATFORM: { status: 422, message: 'Esa plataforma no está admitida' },
  QUOTA_EXCEEDED: { status: 429, message: 'Sin descargas de invitado' },
  EXTRACTOR_FAILED: { status: 502, message: 'No se pudo analizar el enlace' },

  // — genéricos de API —
  VALIDATION: { status: 400, message: 'Datos inválidos' },
  UNAUTHORIZED: { status: 401, message: 'Necesitas iniciar sesión' },
  FORBIDDEN: { status: 403, message: 'No tienes acceso a este recurso' },
  NOT_FOUND: { status: 404, message: 'No encontrado' },
  CONFLICT: { status: 409, message: 'Ya existe un registro con esos datos' },
  RATE_LIMITED: { status: 429, message: 'Demasiados intentos, espera un momento' },
  INVALID_CREDENTIALS: { status: 401, message: 'Correo o contraseña incorrectos' },
  INVALID_TOKEN: { status: 401, message: 'La sesión expiró, inicia sesión de nuevo' },
  INVALID_CODE: { status: 400, message: 'El código no es válido o expiró' },
  TWOFA_REQUIRED: { status: 401, message: 'Introduce tu código de verificación' },
  USERNAME_TAKEN: { status: 409, message: 'Ese nombre de usuario ya está en uso' },
  EMAIL_TAKEN: { status: 409, message: 'Ya existe una cuenta con ese correo' },
  INTERNAL: { status: 500, message: 'Algo salió mal' },
} as const;

export type ErrorCode = keyof typeof ERROR_CATALOG;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly field: string | null;

  constructor(code: ErrorCode, opts?: { message?: string; field?: string | null }) {
    super(opts?.message ?? ERROR_CATALOG[code].message);
    this.code = code;
    this.status = ERROR_CATALOG[code].status;
    this.field = opts?.field ?? null;
  }

  toBody() {
    return { error: { code: this.code, message: this.message, field: this.field } };
  }
}
