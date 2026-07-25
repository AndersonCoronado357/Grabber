import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { config } from '../../config/env.js';
import { requireAuth } from '../../http/auth.js';
import { AppError } from '../../http/errors.js';
import { humanSize } from '../../shared/format.js';
import { userDto } from '../users/serializer.js';
import { PLAN_PRICE_COP, PLAN_CARDS, copFromCents, isPaidPlan, planLabel } from './plans.js';
import {
  wompiConfigured,
  buildReference,
  checkoutSignature,
  fetchTransaction,
  activateFromTransaction,
  verifyWebhookSignature,
} from './wompi.js';

const ADDONS = [
  { name: 'Almacenamiento extra', desc: '+500 GB de biblioteca', price: '$12.000/mes' },
  { name: 'Descargas en lote', desc: 'Cola ilimitada y prioridad', price: '$10.000/mes' },
];

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const STATUS_ES: Record<string, string> = {
  APPROVED: 'Pagada',
  PENDING: 'Pendiente',
  DECLINED: 'Rechazada',
  VOIDED: 'Anulada',
  ERROR: 'Error',
};

function payDate(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS_ES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Base pública para el redirect de Wompi: APP_URL si está, si no el host de la petición. */
function appBase(req: { protocol: string; headers: Record<string, unknown> }): string {
  if (config.appUrl) return config.appUrl.replace(/\/$/, '');
  const host = String(req.headers['host'] ?? 'localhost');
  return `${req.protocol}://${host}`;
}

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  /** ¿Está lista la pasarela? (para que el frontend muestre el estado). */
  app.get('/billing/pay/status', async () => ({
    enabled: wompiConfigured(),
    env: config.wompi.env,
  }));

  app.get('/billing/plans', async (req) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { Id: req.userId! } });
    return {
      plans: PLAN_CARDS.map((p) => ({
        id: p.id,
        name: p.name,
        price: copFromCents(PLAN_PRICE_COP[p.id]),
        feats: p.feats,
        current: p.id === user.Plan,
      })),
      addons: ADDONS,
    };
  });

  /**
   * Cambio de plan directo: SÓLO permite bajar a Free. Los planes de pago se
   * activan pagando de verdad (checkout), nunca con un simple cambio de estado.
   */
  app.post('/billing/plan', async (req) => {
    const body = z.object({ plan: z.literal('free') }).parse(req.body);
    const user = await prisma.user.update({
      where: { Id: req.userId! },
      data: { Plan: body.plan, PlanUntil: null, AutoRenew: false, WompiPaymentSourceId: null },
    });
    return { ok: true, user: userDto(user) };
  });

  /**
   * Prepara un checkout de Wompi para el plan elegido. Crea un Payment PENDING
   * y devuelve los parámetros firmados para abrir el Checkout Web de Wompi.
   */
  app.post('/billing/checkout', async (req) => {
    if (!wompiConfigured()) {
      throw new AppError('VALIDATION', { message: 'La pasarela de pago aún no está configurada' });
    }
    const { plan } = z.object({ plan: z.enum(['pro', 'studio']) }).parse(req.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { Id: req.userId! } });

    const amountInCents = PLAN_PRICE_COP[plan];
    const currency = 'COP';
    const reference = buildReference(user.Id, plan);
    const signature = checkoutSignature(reference, amountInCents, currency);

    await prisma.payment.create({
      data: {
        UserId: user.Id,
        Plan: plan,
        AmountCents: amountInCents,
        Currency: currency,
        Status: 'PENDING',
        Reference: reference,
      },
    });

    return {
      publicKey: config.wompi.publicKey,
      currency,
      amountInCents,
      reference,
      signature,
      redirectUrl: `${appBase(req)}/?wompi=1`,
      checkoutUrl: 'https://checkout.wompi.co/p/',
      customerEmail: user.Email,
    };
  });

  /** Detalle de la suscripción actual para la UI. */
  app.get('/billing/subscription', async (req) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { Id: req.userId! } });
    return {
      plan: user.Plan,
      planLabel: planLabel(user.Plan),
      planUntil: user.PlanUntil,
      autoRenew: user.AutoRenew,
      active: isPaidPlan(user.Plan) && !!user.PlanUntil && user.PlanUntil.getTime() > Date.now(),
    };
  });

  /** Cancela la renovación automática. El plan sigue activo hasta que venza. */
  app.post('/billing/cancel', async (req) => {
    const user = await prisma.user.update({
      where: { Id: req.userId! },
      data: { AutoRenew: false },
    });
    return { ok: true, plan: user.Plan, planUntil: user.PlanUntil, autoRenew: user.AutoRenew };
  });

  /**
   * Verifica una transacción por id contra Wompi y activa el plan si fue
   * aprobada. Es el camino que funciona en local (sin webhook público): el
   * frontend lo llama al volver del checkout.
   */
  app.get('/billing/verify', async (req) => {
    if (!wompiConfigured()) throw new AppError('VALIDATION', { message: 'Pasarela no configurada' });
    const { id } = z.object({ id: z.string().min(1) }).parse(req.query);
    const txn = await fetchTransaction(id);
    if (!txn) throw new AppError('NOT_FOUND', { message: 'Transacción no encontrada' });

    // La referencia debe pertenecer a un Payment de este usuario.
    const payment = txn.reference
      ? await prisma.payment.findUnique({ where: { Reference: txn.reference } })
      : null;
    if (!payment || payment.UserId !== req.userId) {
      throw new AppError('FORBIDDEN', { message: 'La transacción no corresponde a tu cuenta' });
    }

    if (txn.status === 'PENDING') return { status: 'PENDING', activated: false };
    const result = await activateFromTransaction(txn);
    const user = await prisma.user.findUniqueOrThrow({ where: { Id: req.userId! } });
    return { status: txn.status ?? 'UNKNOWN', activated: result.ok, user: userDto(user) };
  });

  /** Historial de pagos del usuario (desde la tabla Payment). */
  app.get('/billing/history', async (req) => {
    const rows = await prisma.payment.findMany({
      where: { UserId: req.userId! },
      orderBy: { CreatedAt: 'desc' },
      take: 36,
    });
    // "Facturas" con la forma que ya consume el frontend.
    const invoices = rows.map((p, i) => ({
      id: `INV-${String(rows.length - i).padStart(4, '0')}`,
      date: payDate(p.CreatedAt),
      amount: copFromCents(p.AmountCents),
      status: STATUS_ES[p.Status] ?? p.Status,
      plan: planLabel(p.Plan),
      reference: p.Reference,
    }));
    return { invoices };
  });

  app.get('/billing/usage', async (req) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { Id: req.userId! } });
    const periodStart = new Date();
    periodStart.setUTCDate(1);
    periodStart.setUTCHours(0, 0, 0, 0);
    const [counter, storage] = await Promise.all([
      prisma.usageCounter.findFirst({ where: { UserId: req.userId!, PeriodStart: periodStart } }),
      prisma.libraryItem.aggregate({
        where: { UserId: req.userId!, DeletedAt: null },
        _sum: { FileSizeBytes: true },
      }),
    ]);
    // Renueva: si hay suscripción de pago, la fecha real de vencimiento; si no,
    // el primer día del próximo mes (ciclo de uso).
    const renew =
      isPaidPlan(user.Plan) && user.PlanUntil
        ? user.PlanUntil
        : new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1));
    return {
      usage: {
        downloadsThisPeriod: counter?.DownloadsUsed ?? 0,
        downloadsLabel:
          user.Plan === 'free' ? 'límite diario de 3' : `ilimitadas en ${planLabel(user.Plan)}`,
        bandwidthLabel: humanSize(Number(storage._sum.FileSizeBytes ?? 0)),
        renewsAt: renew,
        renewsLabel: `${String(renew.getUTCDate()).padStart(2, '0')} ${MONTHS_ES[renew.getUTCMonth()]}`,
      },
    };
  });
}

/**
 * Webhook de Wompi (producción / robustez). Va SIN autenticación (lo llama
 * Wompi), por eso es un plugin aparte del resto de /billing (que exige login).
 */
export async function billingWebhookRoutes(app: FastifyInstance): Promise<void> {
  app.post('/billing/webhook', async (req, reply) => {
    try {
      const evt = req.body as {
        event?: string;
        data?: { transaction?: Record<string, unknown> };
        signature?: { checksum?: string; properties?: string[] };
        timestamp?: number;
      };
      const txn = evt?.data?.transaction;
      if (evt?.event !== 'transaction.updated' || !txn) return { ok: true };
      if (!verifyWebhookSignature(evt)) {
        return reply.code(401).send({ error: { code: 'FORBIDDEN', message: 'Firma inválida', field: null } });
      }
      await activateFromTransaction(txn as never);
      return { ok: true };
    } catch (err) {
      req.log.error({ err }, 'error en webhook de Wompi');
      // Wompi reintenta si no es 2xx; evitamos loops.
      return reply.code(200).send({ ok: true });
    }
  });
}
