import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client.js';
import { logger } from '../../http/logger.js';

/**
 * Búsqueda de biblioteca. Si la instancia tiene full-text instalado y el
 * índice existe, usa CONTAINS; si no, cae a LIKE (NVARCHAR) y lo avisa
 * en el arranque.
 */
let fullTextAvailable = false;

export async function detectFullText(): Promise<void> {
  try {
    const rows = await prisma.$queryRaw<{ installed: number | null; hasIndex: number }[]>`
      SELECT FULLTEXTSERVICEPROPERTY('IsFullTextInstalled') AS installed,
             (SELECT COUNT(*) FROM sys.fulltext_indexes fi
               JOIN sys.objects o ON o.object_id = fi.object_id
              WHERE o.name = 'LibraryItems') AS hasIndex`;
    const row = rows[0];
    fullTextAvailable = !!row && row.installed === 1 && row.hasIndex > 0;
    if (!fullTextAvailable) {
      logger.warn(
        'full-text no disponible para LibraryItems: el buscador usa LIKE (ejecuta scripts/setup-fulltext.sql como admin para habilitarlo)',
      );
    } else {
      logger.info('full-text habilitado para el buscador de biblioteca');
    }
  } catch {
    fullTextAvailable = false;
    logger.warn('no se pudo comprobar full-text: el buscador usa LIKE');
  }
}

/** Devuelve ids que matchean `q` por CONTAINS, o null si hay que usar LIKE. */
export async function fullTextIds(userId: string, q: string): Promise<string[] | null> {
  if (!fullTextAvailable) return null;
  const term = q.replace(/["*]/g, ' ').trim();
  if (!term) return null;
  const pattern = `"${term}*"`;
  try {
    const rows = await prisma.$queryRaw<{ Id: string }[]>(
      Prisma.sql`SELECT TOP 500 Id FROM LibraryItems WHERE UserId = ${userId} AND CONTAINS(Title, ${pattern})`,
    );
    return rows.map((r) => r.Id);
  } catch {
    return null;
  }
}
