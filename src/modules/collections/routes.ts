import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { AppError } from '../../http/errors.js';
import { requireAuth } from '../../http/auth.js';
import { COLLECTION_COLORS, dateLabel, daysSince } from '../../shared/format.js';

function collectionDto(
  c: { Id: string; Name: string; ColorTag: string; CreatedAt: Date; UpdatedAt: Date },
  count: number,
) {
  const days = daysSince(c.UpdatedAt);
  return {
    id: c.Id,
    name: c.Name,
    color: c.ColorTag,
    count,
    days,
    dateLabel: `actualizada ${dateLabel(c.UpdatedAt).replace('hace', 'hace')}`,
    createdAt: c.CreatedAt,
    updatedAt: c.UpdatedAt,
  };
}

export async function collectionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/collections', async (req) => {
    const collections = await prisma.collection.findMany({
      where: { UserId: req.userId! },
      include: { _count: { select: { Items: true } } },
      orderBy: { CreatedAt: 'asc' },
    });
    return {
      collections: collections.map((c) => collectionDto(c, c._count.Items)),
      colors: COLLECTION_COLORS,
    };
  });

  app.post('/collections', async (req, reply) => {
    const body = z
      .object({
        name: z.string().trim().min(1).max(80),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      })
      .parse(req.body);
    const existing = await prisma.collection.findFirst({
      where: { UserId: req.userId!, Name: body.name },
    });
    if (existing) throw new AppError('CONFLICT', { message: 'Ya tienes una colección con ese nombre', field: 'name' });
    const count = await prisma.collection.count({ where: { UserId: req.userId! } });
    const collection = await prisma.collection.create({
      data: {
        UserId: req.userId!,
        Name: body.name,
        ColorTag: body.color ?? COLLECTION_COLORS[count % COLLECTION_COLORS.length]!,
      },
    });
    return reply.code(201).send({ collection: collectionDto(collection, 0) });
  });

  app.patch('/collections/:id', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z
      .object({
        name: z.string().trim().min(1).max(80).optional(),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      })
      .parse(req.body);
    const owned = await prisma.collection.findFirst({ where: { Id: id, UserId: req.userId! } });
    if (!owned) throw new AppError('NOT_FOUND');
    if (body.name) {
      const dup = await prisma.collection.findFirst({
        where: { UserId: req.userId!, Name: body.name, NOT: { Id: id } },
      });
      if (dup) throw new AppError('CONFLICT', { message: 'Ya tienes una colección con ese nombre', field: 'name' });
    }
    const updated = await prisma.collection.update({
      where: { Id: id },
      data: {
        ...(body.name ? { Name: body.name } : {}),
        ...(body.color ? { ColorTag: body.color } : {}),
      },
      include: { _count: { select: { Items: true } } },
    });
    return { collection: collectionDto(updated, updated._count.Items) };
  });

  app.delete('/collections/:id', async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const owned = await prisma.collection.findFirst({ where: { Id: id, UserId: req.userId! } });
    if (!owned) throw new AppError('NOT_FOUND');
    // borrar la colección no borra los items de biblioteca, solo la agrupación
    await prisma.collection.delete({ where: { Id: id } });
    return { ok: true };
  });

  app.post('/collections/:id/items', async (req, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({ libraryItemIds: z.array(z.string().uuid()).min(1).max(200) }).parse(req.body);
    const owned = await prisma.collection.findFirst({ where: { Id: id, UserId: req.userId! } });
    if (!owned) throw new AppError('NOT_FOUND');
    const items = await prisma.libraryItem.findMany({
      where: { Id: { in: body.libraryItemIds }, UserId: req.userId! },
      select: { Id: true },
    });
    for (const item of items) {
      await prisma.collectionItem.upsert({
        where: { CollectionId_LibraryItemId: { CollectionId: id, LibraryItemId: item.Id } },
        create: { CollectionId: id, LibraryItemId: item.Id },
        update: {},
      });
    }
    await prisma.collection.update({ where: { Id: id }, data: { UpdatedAt: new Date() } });
    return reply.code(201).send({ ok: true, added: items.length });
  });

  app.delete('/collections/:id/items/:libraryItemId', async (req) => {
    const params = z
      .object({ id: z.string().uuid(), libraryItemId: z.string().uuid() })
      .parse(req.params);
    const owned = await prisma.collection.findFirst({
      where: { Id: params.id, UserId: req.userId! },
    });
    if (!owned) throw new AppError('NOT_FOUND');
    await prisma.collectionItem.deleteMany({
      where: { CollectionId: params.id, LibraryItemId: params.libraryItemId },
    });
    return { ok: true };
  });
}
