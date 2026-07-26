import type { FastifyInstance } from 'fastify';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client.js';
import { config } from '../../config/env.js';
import { AppError } from '../../http/errors.js';
import { requireAuth } from '../../http/auth.js';
import { PLATFORMS } from '../../shared/format.js';
import { fullTextIds } from './repo.js';
import { libraryItemDto, trashItemDto, type LibraryItemFull } from './serializer.js';

const INCLUDE = {
  MediaSource: true,
  CollectionItems: true,
  Tags: { include: { Tag: true } },
} as const;

const listQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  platform: z.union([z.string(), z.array(z.string())]).optional(),
  format: z.union([z.string(), z.array(z.string())]).optional(),
  quality: z.union([z.string(), z.array(z.string())]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  collectionId: z.string().uuid().optional(),
  favorite: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  sort: z.enum(['recent', 'title', 'size']).default('recent'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

function asArray(v: string | string[] | undefined): string[] | undefined {
  if (v === undefined) return undefined;
  const arr = (Array.isArray(v) ? v : v.split(',')).map((s) => s.trim()).filter(Boolean);
  return arr.length ? arr : undefined;
}

interface Cursor {
  k: string | number;
  id: string;
}

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

function decodeCursor(raw: string): Cursor {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Cursor;
    if (parsed && typeof parsed.id === 'string') return parsed;
  } catch {
    /* cae abajo */
  }
  throw new AppError('VALIDATION', { message: 'Cursor inválido', field: 'cursor' });
}

export async function libraryRoutes(app: FastifyInstance): Promise<void> {
  // El <video> del reproductor no puede enviar cabeceras: se admite el token
  // por query (mismo patrón que el stream SSE). onRequest corre ANTES de
  // requireAuth, así que la autenticación normal sigue intacta.
  app.addHook('onRequest', async (req) => {
    const q = req.query as { token?: string } | undefined;
    if (q?.token && !req.headers.authorization) {
      req.headers.authorization = `Bearer ${q.token}`;
    }
  });
  app.addHook('preHandler', requireAuth);

  // —— listado con filtros y paginación por cursor (nunca OFFSET) ——
  app.get('/library', async (req) => {
    const qy = listQuerySchema.parse(req.query);
    const userId = req.userId!;

    const platforms = asArray(qy.platform)?.filter((p) => (PLATFORMS as readonly string[]).includes(p));
    const formats = asArray(qy.format);
    const qualities = asArray(qy.quality);

    const where: Prisma.LibraryItemWhereInput = {
      UserId: userId,
      DeletedAt: null,
      ...(platforms ? { MediaSource: { Platform: { in: platforms } } } : {}),
      ...(formats ? { Format: { in: formats } } : {}),
      ...(qy.favorite !== undefined ? { IsFavorite: qy.favorite } : {}),
      ...(qy.from || qy.to
        ? { CreatedAt: { ...(qy.from ? { gte: qy.from } : {}), ...(qy.to ? { lte: qy.to } : {}) } }
        : {}),
      ...(qy.collectionId
        ? { CollectionItems: { some: { CollectionId: qy.collectionId } } }
        : {}),
    };

    if (qualities) {
      // 'Audio' agrupa 'Audio MP3' y 'Audio M4A' (literal del filtro del frontend)
      const exact = qualities.filter((q) => q !== 'Audio');
      const wantsAudio = qualities.includes('Audio');
      where.OR = [
        ...(exact.length ? [{ Quality: { in: exact } }] : []),
        ...(wantsAudio ? [{ Quality: { startsWith: 'Audio' } }] : []),
      ];
    }

    if (qy.q) {
      const ftIds = await fullTextIds(userId, qy.q);
      if (ftIds) where.Id = { in: ftIds };
      else where.Title = { contains: qy.q };
    }

    // cursor por (clave de orden + id): estable para scroll infinito
    const limit = qy.limit;
    let orderBy: Prisma.LibraryItemOrderByWithRelationInput[];
    if (qy.sort === 'title') orderBy = [{ Title: 'asc' }, { Id: 'asc' }];
    else if (qy.sort === 'size') orderBy = [{ FileSizeBytes: 'desc' }, { Id: 'asc' }];
    else orderBy = [{ CreatedAt: 'desc' }, { Id: 'asc' }];

    let cursorWhere: Prisma.LibraryItemWhereInput | undefined;
    if (qy.cursor) {
      const c = decodeCursor(qy.cursor);
      if (qy.sort === 'title') {
        cursorWhere = {
          OR: [{ Title: { gt: String(c.k) } }, { Title: String(c.k), Id: { gt: c.id } }],
        };
      } else if (qy.sort === 'size') {
        cursorWhere = {
          OR: [
            { FileSizeBytes: { lt: BigInt(c.k) } },
            { FileSizeBytes: BigInt(c.k), Id: { gt: c.id } },
          ],
        };
      } else {
        const dt = new Date(c.k as string);
        cursorWhere = { OR: [{ CreatedAt: { lt: dt } }, { CreatedAt: dt, Id: { gt: c.id } }] };
      }
    }

    const items = (await prisma.libraryItem.findMany({
      where: cursorWhere ? { AND: [where, cursorWhere] } : where,
      include: INCLUDE,
      orderBy,
      take: limit + 1,
    })) as LibraryItemFull[];

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeCursor({
            k:
              qy.sort === 'title'
                ? last.Title
                : qy.sort === 'size'
                  ? String(last.FileSizeBytes)
                  : last.CreatedAt.toISOString(),
            id: last.Id,
          })
        : null;

    return { items: page.map(libraryItemDto), nextCursor, hasMore };
  });

  // —— papelera (antes que /library/:id para no colisionar) ——
  app.get('/library/trash', async (req) => {
    const items = (await prisma.libraryItem.findMany({
      where: { UserId: req.userId!, DeletedAt: { not: null } },
      include: INCLUDE,
      orderBy: { DeletedAt: 'desc' },
    })) as LibraryItemFull[];
    return { items: items.map(trashItemDto) };
  });

  app.delete('/library/trash', async (req) => {
    const items = await prisma.libraryItem.findMany({
      where: { UserId: req.userId!, DeletedAt: { not: null } },
    });
    for (const item of items) {
      const abs = path.resolve(config.downloadRoot, item.FilePath);
      if (abs.startsWith(path.resolve(config.downloadRoot))) {
        await rm(abs, { force: true }).catch(() => undefined);
      }
    }
    await prisma.$transaction([
      prisma.collectionItem.deleteMany({
        where: { LibraryItem: { UserId: req.userId!, DeletedAt: { not: null } } },
      }),
      prisma.libraryItem.deleteMany({ where: { UserId: req.userId!, DeletedAt: { not: null } } }),
    ]);
    return { ok: true, count: items.length };
  });

  // —— acciones en lote ——
  app.post('/library/bulk', async (req) => {
    const body = z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(200),
        action: z.enum(['favorite', 'unfavorite', 'move', 'delete', 'restore']),
        collectionId: z.string().uuid().optional(),
      })
      .parse(req.body);

    // autorización a nivel de fila: el filtro por UserId va en el propio query
    const ownWhere = { UserId: req.userId!, Id: { in: body.ids } };

    switch (body.action) {
      case 'favorite':
        await prisma.libraryItem.updateMany({ where: ownWhere, data: { IsFavorite: true } });
        break;
      case 'unfavorite':
        await prisma.libraryItem.updateMany({ where: ownWhere, data: { IsFavorite: false } });
        break;
      case 'delete':
        await prisma.libraryItem.updateMany({
          where: { ...ownWhere, DeletedAt: null },
          data: { DeletedAt: new Date() },
        });
        break;
      case 'restore':
        await prisma.libraryItem.updateMany({
          where: { ...ownWhere, DeletedAt: { not: null } },
          data: { DeletedAt: null },
        });
        break;
      case 'move': {
        if (!body.collectionId) {
          throw new AppError('VALIDATION', { message: 'Falta collectionId', field: 'collectionId' });
        }
        const coll = await prisma.collection.findFirst({
          where: { Id: body.collectionId, UserId: req.userId! },
        });
        if (!coll) throw new AppError('NOT_FOUND', { field: 'collectionId' });
        const owned = await prisma.libraryItem.findMany({ where: ownWhere, select: { Id: true } });
        for (const item of owned) {
          await prisma.collectionItem.upsert({
            where: {
              CollectionId_LibraryItemId: { CollectionId: coll.Id, LibraryItemId: item.Id },
            },
            create: { CollectionId: coll.Id, LibraryItemId: item.Id },
            update: {},
          });
        }
        break;
      }
    }
    return { ok: true };
  });

  // —— item individual ——
  app.get('/library/:id', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const item = (await prisma.libraryItem.findFirst({
      where: { Id: id, UserId: req.userId! },
      include: INCLUDE,
    })) as LibraryItemFull | null;
    if (!item) throw new AppError('NOT_FOUND');
    return { item: libraryItemDto(item) };
  });

  app.patch('/library/:id', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z
      .object({
        title: z.string().trim().min(1).max(500).optional(),
        notes: z.string().max(4000).optional(),
        isFavorite: z.boolean().optional(),
        tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
      })
      .parse(req.body);

    const owned = await prisma.libraryItem.findFirst({ where: { Id: id, UserId: req.userId! } });
    if (!owned) throw new AppError('NOT_FOUND');

    if (body.tags) {
      await prisma.libraryItemTag.deleteMany({ where: { LibraryItemId: id } });
      for (const name of [...new Set(body.tags.map((t) => t.toLowerCase()))]) {
        const tag = await prisma.tag.upsert({
          where: { UserId_Name: { UserId: req.userId!, Name: name } },
          create: { UserId: req.userId!, Name: name },
          update: {},
        });
        await prisma.libraryItemTag.create({ data: { LibraryItemId: id, TagId: tag.Id } });
      }
    }

    await prisma.libraryItem.update({
      where: { Id: id },
      data: {
        ...(body.title !== undefined ? { Title: body.title } : {}),
        ...(body.notes !== undefined ? { Notes: body.notes } : {}),
        ...(body.isFavorite !== undefined ? { IsFavorite: body.isFavorite } : {}),
      },
    });
    const fresh = (await prisma.libraryItem.findUniqueOrThrow({
      where: { Id: id },
      include: INCLUDE,
    })) as LibraryItemFull;
    return { item: libraryItemDto(fresh) };
  });

  app.delete('/library/:id', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const result = await prisma.libraryItem.updateMany({
      where: { Id: id, UserId: req.userId!, DeletedAt: null },
      data: { DeletedAt: new Date() },
    });
    if (result.count === 0) throw new AppError('NOT_FOUND');
    return { ok: true };
  });

  app.post('/library/:id/restore', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const result = await prisma.libraryItem.updateMany({
      where: { Id: id, UserId: req.userId!, DeletedAt: { not: null } },
      data: { DeletedAt: null },
    });
    if (result.count === 0) throw new AppError('NOT_FOUND');
    return { ok: true };
  });

  // —— descarga del archivo local con streaming y soporte de Range ——
  app.get('/library/:id/file', async (req, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const item = await prisma.libraryItem.findFirst({ where: { Id: id, UserId: req.userId! } });
    if (!item) throw new AppError('NOT_FOUND');

    const abs = path.resolve(config.downloadRoot, item.FilePath);
    if (!abs.startsWith(path.resolve(config.downloadRoot))) throw new AppError('NOT_FOUND');
    if (!existsSync(abs)) {
      await prisma.libraryItem.update({ where: { Id: id }, data: { FileMissing: true } });
      throw new AppError('NOT_FOUND', { message: 'El archivo ya no existe en disco' });
    }

    const stat = statSync(abs);
    const range = req.headers.range;
    const fileName = path.basename(abs);
    // ?inline=1 → el navegador lo REPRODUCE en vez de descargarlo (reproductor
    // integrado). Sin el parámetro se mantiene la descarga de siempre.
    const inline = (req.query as { inline?: string } | undefined)?.inline === '1';
    reply.header('Accept-Ranges', 'bytes');
    reply.header(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename="${fileName}"`,
    );
    reply.header('Content-Type', guessMime(fileName));

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? Math.min(parseInt(match[2], 10), stat.size - 1) : stat.size - 1;
        if (start <= end && start < stat.size) {
          reply.code(206);
          reply.header('Content-Range', `bytes ${start}-${end}/${stat.size}`);
          reply.header('Content-Length', end - start + 1);
          return reply.send(createReadStream(abs, { start, end }));
        }
        reply.code(416);
        reply.header('Content-Range', `bytes */${stat.size}`);
        return reply.send();
      }
    }
    reply.header('Content-Length', stat.size);
    return reply.send(createReadStream(abs));
  });
}

function guessMime(name: string): string {
  const ext = path.extname(name).toLowerCase();
  const map: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
  };
  return map[ext] ?? 'application/octet-stream';
}
