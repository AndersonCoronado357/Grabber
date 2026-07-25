/**
 * Planes y precios de Grabber. La pasarela es Wompi (Colombia), que sólo cobra
 * en COP: por eso los precios viven en CENTAVOS de peso, como en Vexcel. Son
 * montos redondos ("bonitos", terminados en 000). Wompi descuenta su comisión
 * (~2,65% + $700 + IVA), así que lo neto es ~3% menos que el precio de lista.
 */
export type PaidPlan = 'pro' | 'studio';
export type Plan = 'free' | PaidPlan;

export const PLANS: Plan[] = ['free', 'pro', 'studio'];

/** Precio mensual que se COBRA, en centavos de COP. */
export const PLAN_PRICE_COP: Record<Plan, number> = {
  free: 0,
  pro: 3_000_000, // cobra $30.000
  studio: 6_000_000, // cobra $60.000
};

export function isPaidPlan(plan: string): plan is PaidPlan {
  return plan === 'pro' || plan === 'studio';
}

/** "$30.000" a partir de centavos de COP (sin depender del locale del sistema). */
export function copFromCents(cents: number): string {
  const pesos = Math.round(cents / 100).toString();
  return '$' + pesos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Etiqueta capitalizada del plan ("pro" → "Pro"). */
export function planLabel(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

/** Metadatos que consume el frontend (nombre, precio formateado, features). */
export const PLAN_CARDS: Array<{ id: Plan; name: string; feats: string[] }> = [
  { id: 'free', name: 'Free', feats: ['3 descargas al día', '720p máximo', 'Sin biblioteca'] },
  {
    id: 'pro',
    name: 'Pro',
    feats: ['Descargas ilimitadas', 'Hasta 4K', '200 GB de biblioteca', 'Colecciones y etiquetas'],
  },
  {
    id: 'studio',
    name: 'Studio',
    feats: ['Todo de Pro', '1 TB de biblioteca', 'Modo lote', 'Acceso a la API'],
  },
];
