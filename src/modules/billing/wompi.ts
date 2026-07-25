/**
 * Integración con Wompi (pasarela colombiana). Portada de Vexcel al stack de
 * Grabber (Fastify + Prisma + SQL Server). El flujo:
 *   1. /billing/checkout crea un Payment PENDING y devuelve los parámetros
 *      firmados para abrir el Checkout Web de Wompi.
 *   2. Al volver, el frontend llama /billing/verify (o Wompi llama al webhook);
 *      verificamos la transacción con la llave privada y, si fue APPROVED,
 *      activamos el plan 30 días. Nunca confiamos en el redirect por sí solo.
 *
 * A diferencia de Vexcel (Mongo ObjectId de 24 hex), el id de usuario aquí es
 * un GUID de SQL Server, así que NO lo parseamos desde la referencia: guardamos
 * la referencia en la tabla Payment y reconciliamos por ahí.
 */
import crypto from 'node:crypto';
import { prisma } from '../../db/client.js';
import { config, wompiApiBase } from '../../config/env.js';
import { logger } from '../../http/logger.js';
import { PLAN_PRICE_COP, isPaidPlan, type PaidPlan } from './plans.js';

export const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function wompiConfigured(): boolean {
  return config.wompi.enabled;
}

/** Referencia única para Wompi: gr_<hex32>_<plan>_<timestamp>. */
export function buildReference(userId: string, plan: PaidPlan): string {
  const hex = userId.replace(/-/g, '').toLowerCase();
  return `gr_${hex}_${plan}_${Date.now()}`;
}

/** Firma de integridad: SHA256(reference + amountInCents + currency + integritySecret). */
export function checkoutSignature(reference: string, amountInCents: number, currency: string): string {
  return crypto
    .createHash('sha256')
    .update(`${reference}${amountInCents}${currency}${config.wompi.integritySecret}`)
    .digest('hex');
}

export interface WompiTxn {
  id?: string;
  status?: string;
  reference?: string;
  amount_in_cents?: number;
  payment_method_type?: string | null;
  payment_source_id?: number | string | null;
  finalized_at?: string | null;
  created_at?: string | null;
}

/** Consulta una transacción por id contra la API de Wompi (llave privada). */
export async function fetchTransaction(id: string): Promise<WompiTxn | null> {
  const r = await fetch(`${wompiApiBase()}/transactions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${config.wompi.privateKey}` },
  });
  if (!r.ok) return null;
  const body = (await r.json()) as { data?: WompiTxn };
  return body.data ?? null;
}

/** Token de aceptación vigente del comercio (necesario para cobrar por API). */
export async function acceptanceToken(): Promise<string | null> {
  try {
    const r = await fetch(`${wompiApiBase()}/merchants/${config.wompi.publicKey}`);
    const b = (await r.json()) as { data?: { presigned_acceptance?: { acceptance_token?: string } } };
    return b.data?.presigned_acceptance?.acceptance_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Reconciliación central: dada una transacción de Wompi, actualiza el Payment
 * correspondiente (por referencia) y, si fue APPROVED, activa el plan del
 * dueño del Payment 30 días. Idempotente: se puede llamar desde verify y webhook.
 */
export async function activateFromTransaction(
  txn: WompiTxn,
): Promise<{ ok: boolean; plan?: PaidPlan; userId?: string }> {
  const ref = txn.reference ?? '';
  if (!ref) return { ok: false };
  const payment = await prisma.payment.findUnique({ where: { Reference: ref } });
  if (!payment) return { ok: false }; // no es una referencia nuestra

  const status = txn.status ?? 'PENDING';
  // Registra el estado de la transacción pase lo que pase.
  await prisma.payment.update({
    where: { Id: payment.Id },
    data: {
      Status: status,
      Method: txn.payment_method_type ?? payment.Method ?? null,
      WompiTransactionId: txn.id ?? payment.WompiTransactionId ?? null,
    },
  });

  if (status !== 'APPROVED') return { ok: false };
  if (!isPaidPlan(payment.Plan)) return { ok: false };

  const current = await prisma.user.findUnique({ where: { Id: payment.UserId } });
  if (!current) return { ok: false };
  // Extiende desde el vencimiento vigente si aún no ha pasado (acumula tiempo).
  const base = current.PlanUntil && current.PlanUntil.getTime() > Date.now() ? current.PlanUntil.getTime() : Date.now();
  await prisma.user.update({
    where: { Id: payment.UserId },
    data: {
      Plan: payment.Plan,
      PlanUntil: new Date(base + MONTH_MS),
      AutoRenew: true,
      ...(txn.payment_source_id ? { WompiPaymentSourceId: String(txn.payment_source_id) } : {}),
    },
  });
  logger.info({ user: payment.UserId, plan: payment.Plan }, 'plan activado por pago Wompi');
  return { ok: true, plan: payment.Plan, userId: payment.UserId };
}

/**
 * Verifica la firma de un evento de webhook de Wompi con el events secret.
 * Firma = SHA256(concat(valores señalados por properties) + timestamp + eventsSecret).
 */
export function verifyWebhookSignature(evt: {
  data?: unknown;
  signature?: { checksum?: string; properties?: string[] };
  timestamp?: number;
}): boolean {
  if (!config.wompi.eventsSecret) return true; // sin secret configurado, no bloqueamos
  const props = evt.signature?.properties;
  const checksum = evt.signature?.checksum;
  if (!props || !checksum) return false;
  const concat = props
    .map((path) => path.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], evt.data))
    .join('');
  const expected = crypto
    .createHash('sha256')
    .update(`${concat}${evt.timestamp ?? ''}${config.wompi.eventsSecret}`)
    .digest('hex');
  return expected === checksum;
}

/** COBRA por API a las renovaciones vencidas con fuente de pago guardada. */
export async function chargeRenewal(user: {
  Id: string;
  Email: string;
  Plan: string;
  WompiPaymentSourceId: string | null;
}): Promise<'APPROVED' | 'PENDING' | 'FAILED'> {
  if (!isPaidPlan(user.Plan) || !user.WompiPaymentSourceId) return 'FAILED';
  const acceptance = await acceptanceToken();
  if (!acceptance) return 'FAILED';
  const amount = PLAN_PRICE_COP[user.Plan];
  const reference = buildReference(user.Id, user.Plan);
  await prisma.payment.create({
    data: {
      UserId: user.Id,
      Plan: user.Plan,
      AmountCents: amount,
      Currency: 'COP',
      Status: 'PENDING',
      Reference: reference,
    },
  });
  try {
    const r = await fetch(`${wompiApiBase()}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.wompi.privateKey}` },
      body: JSON.stringify({
        acceptance_token: acceptance,
        amount_in_cents: amount,
        currency: 'COP',
        customer_email: user.Email,
        payment_source_id: Number(user.WompiPaymentSourceId),
        reference,
      }),
    });
    const body = (await r.json()) as { data?: WompiTxn };
    const txn = body.data;
    if (txn) await activateFromTransaction({ ...txn, reference });
    const status = txn?.status;
    if (status === 'APPROVED') return 'APPROVED';
    if (status === 'PENDING') return 'PENDING';
    return 'FAILED';
  } catch (err) {
    logger.warn({ err, user: user.Id }, 'error cobrando renovación Wompi');
    return 'FAILED';
  }
}
