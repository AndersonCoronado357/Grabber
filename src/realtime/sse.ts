import type { FastifyReply } from 'fastify';

/**
 * Canal SSE en proceso. Una conexión por pestaña; se indexan por usuario.
 * Eventos: progress | status | completed | failed. Heartbeat cada 20 s.
 */
type Client = { userId: string; reply: FastifyReply };

const clients = new Set<Client>();
let heartbeat: NodeJS.Timeout | null = null;

export function sseSubscribe(userId: string, reply: FastifyReply): void {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  reply.raw.write(': conectado\n\n');

  const client: Client = { userId, reply };
  clients.add(client);
  if (!heartbeat) {
    heartbeat = setInterval(() => {
      for (const c of clients) {
        try {
          c.reply.raw.write(': hb\n\n');
        } catch {
          clients.delete(c);
        }
      }
    }, 20_000);
    heartbeat.unref();
  }

  reply.raw.on('close', () => {
    clients.delete(client);
  });
}

export function sseEmit(
  userId: string,
  event: 'progress' | 'status' | 'completed' | 'failed',
  data: Record<string, unknown>,
): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of clients) {
    if (c.userId !== userId) continue;
    try {
      c.reply.raw.write(payload);
    } catch {
      clients.delete(c);
    }
  }
}

export function sseCloseAll(): void {
  for (const c of clients) {
    try {
      c.reply.raw.end();
    } catch {
      /* ignorar */
    }
  }
  clients.clear();
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
}
