/**
 * Trabajos diarios de la suscripción (Wompi):
 *  - runRenewals: cobra las que están por vencer y tienen fuente de pago.
 *  - runRenewalReminders: avisa por correo 3 días antes del cobro.
 * Se disparan desde el scheduler en proceso.
 */
import { prisma } from '../../db/client.js';
import { logger } from '../../http/logger.js';
import { sendMail, upcomingChargeMail } from '../../services/mailer/mailer.js';
import { PLAN_PRICE_COP, copFromCents, planLabel } from './plans.js';
import { wompiConfigured, chargeRenewal, MONTH_MS } from './wompi.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function fechaEs(d: Date): string {
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

export async function runRenewals(): Promise<void> {
  if (!wompiConfigured()) return;
  const soon = new Date(Date.now() + DAY_MS);
  const due = await prisma.user.findMany({
    where: {
      DeletedAt: null,
      Plan: { in: ['pro', 'studio'] },
      AutoRenew: true,
      WompiPaymentSourceId: { not: null },
      PlanUntil: { lte: soon },
    },
  });
  for (const user of due) {
    const result = await chargeRenewal({
      Id: user.Id,
      Email: user.Email,
      Plan: user.Plan,
      WompiPaymentSourceId: user.WompiPaymentSourceId,
    });
    if (result === 'APPROVED') {
      // chargeRenewal ya extendió el vencimiento vía activateFromTransaction.
      logger.info({ user: user.Id, plan: user.Plan }, 'renovación aprobada');
    } else if (result === 'PENDING') {
      // Extendemos igual; si luego falla, el próximo ciclo lo corrige.
      const base = user.PlanUntil && user.PlanUntil.getTime() > Date.now() ? user.PlanUntil.getTime() : Date.now();
      await prisma.user.update({ where: { Id: user.Id }, data: { PlanUntil: new Date(base + MONTH_MS) } });
      logger.info({ user: user.Id }, 'renovación pendiente; plan extendido provisionalmente');
    } else {
      await prisma.user.update({
        where: { Id: user.Id },
        data: { Plan: 'free', PlanUntil: null, AutoRenew: false, WompiPaymentSourceId: null },
      });
      logger.warn({ user: user.Id }, 'cobro de renovación no aprobado; degradado a Free');
    }
  }
}

export async function runRenewalReminders(): Promise<void> {
  if (!wompiConfigured()) return;
  const now = Date.now();
  const in3 = new Date(now + 3 * DAY_MS);
  const candidates = await prisma.user.findMany({
    where: {
      DeletedAt: null,
      Plan: { in: ['pro', 'studio'] },
      AutoRenew: true,
      WompiPaymentSourceId: { not: null },
      PlanUntil: { gt: new Date(now), lte: in3 },
    },
  });
  for (const user of candidates) {
    if (!user.PlanUntil) continue;
    // Ya se avisó de este mismo vencimiento: no repetir.
    if (user.RenewalReminderAt && user.RenewalReminderAt.getTime() === user.PlanUntil.getTime()) continue;
    const name = user.DisplayName ?? user.Username;
    const amount = copFromCents(PLAN_PRICE_COP[user.Plan as 'pro' | 'studio']);
    await sendMail(upcomingChargeMail(user.Email, name, planLabel(user.Plan), amount, fechaEs(user.PlanUntil)));
    await prisma.user.update({ where: { Id: user.Id }, data: { RenewalReminderAt: user.PlanUntil } });
    logger.info({ user: user.Id, plan: user.Plan }, 'aviso de renovación enviado');
  }
}
