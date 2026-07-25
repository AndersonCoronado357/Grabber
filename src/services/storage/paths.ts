import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { config } from '../../config/env.js';
import { AppError } from '../../http/errors.js';

export function ensureStorageRoots(): void {
  mkdirSync(config.downloadRoot, { recursive: true });
  mkdirSync(config.avatarRoot, { recursive: true });
  mkdirSync(path.join(config.downloadRoot, '.partial'), { recursive: true });
  mkdirSync(path.join(config.downloadRoot, '.mail'), { recursive: true });
}

/**
 * Resuelve una ruta y verifica que quede dentro de su raíz configurada
 * (cierra path traversal). Lanza NOT_FOUND si escapa de la raíz.
 */
export function resolveInsideRoot(root: string, relativeOrAbsolute: string): string {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativeOrAbsolute);
  if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
    throw new AppError('NOT_FOUND');
  }
  return resolved;
}

export function resolveDownloadPath(p: string): string {
  return resolveInsideRoot(config.downloadRoot, p);
}

export function resolveAvatarPath(p: string): string {
  return resolveInsideRoot(config.avatarRoot, p);
}

/** Sanea un nombre de archivo derivado de un título (sin separadores ni reservados). */
export function sanitizeFilename(name: string): string {
  const clean = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[<>:"/\\|?*]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 120)
    .toLowerCase();
  return clean || 'descarga';
}

/** Aplica la plantilla de nombre de archivo de las preferencias. */
export function applyFilenameTemplate(
  template: string,
  vars: { titulo: string; calidad: string; plataforma: string; fecha: string },
): string {
  const out = template
    .replace(/\{titulo\}/g, vars.titulo)
    .replace(/\{calidad\}/g, vars.calidad)
    .replace(/\{plataforma\}/g, vars.plataforma)
    .replace(/\{fecha\}/g, vars.fecha);
  return sanitizeFilename(out);
}
