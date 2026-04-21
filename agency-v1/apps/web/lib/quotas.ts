/**
 * lib/quotas.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sistema de cuotas (SaaS) limitadas por el tier de subscripción.
 * Usa Upstash Redis para contar uso en la ventana mensual sin saturar la DB.
 */

import { logger } from "@/lib/logger";

interface QuotaLimits {
  leads: number;
  emails_per_month: number;
  campaigns: number;
  ai_agents: number;
  ai_interactions: number;
}

const TIER_LIMITS: Record<string, QuotaLimits> = {
  free: {
    leads: 100,
    emails_per_month: 500,
    campaigns: 1,
    ai_agents: 1, // Estrategia Bajo CAC (1 agente de prueba)
    ai_interactions: 50, // Límite estricto gratis
  },
  pro: {
    leads: 5000,
    emails_per_month: 10000,
    campaigns: 10,
    ai_agents: 3,
    ai_interactions: 5000,
  },
  agency: {
    leads: 999999, // Ilimitado
    emails_per_month: 100000,
    campaigns: 999,
    ai_agents: 999,
    ai_interactions: 999999,
  },
};

const hasRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

/**
 * Incrementa el uso de una función y verifica si excede la cuota del plan (SaaS).
 * @param companyId El Inquilino
 * @param feature El feature a verificar (ej. 'leads')
 * @param tier El nivel de subscripción de la tabla Company (ej. 'free')
 */
export async function enforceQuota(
  companyId: string,
  feature: keyof QuotaLimits,
  tier: string = "free"
): Promise<{ allowed: boolean; limit: number; remaining?: number }> {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS["free"];
  const maxLimit = limits[feature];

  // 1. ==============================================================
  // BYPASS: LA AGENCIA DUEÑA (HOST) ES GRATIS Y TIENE ACCESO INFINITO
  // =================================================================
  if (process.env.MASTER_TENANT_ID && companyId === process.env.MASTER_TENANT_ID) {
    return { allowed: true, limit: 999999, remaining: 999999 };
  }

  if (!hasRedis) {
    // Si no hay Redis, solo garantizamos no fallar crasheando.
    logger.warn("[Quota] Redis no configurado, cuotas no aplicadas en tiempo real.");
    return { allowed: true, limit: maxLimit };
  }

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL!;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
    
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const quotaKey = `quota:${companyId}:${feature}:${monthKey}`;

    // Ventana mensual aproximada en segundos (31 días)
    const windowSec = 31 * 24 * 60 * 60;

    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", quotaKey],
        ["EXPIRE", quotaKey, windowSec], // Renueva la expiración para que dure el mes
      ]),
    });

    if (!res.ok) throw new Error(`Upstash HTTP error: ${res.status}`);

    const data = await res.json();
    const currentUsage = data[0].result as number;

    const allowed = currentUsage <= maxLimit;

    if (!allowed) {
       // Revertimos el INCR si falló
       fetch(`${url}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(["DECR", quotaKey])
       }).catch(() => {});
    }

    return { allowed, limit: maxLimit, remaining: Math.max(0, maxLimit - currentUsage) };
  } catch(error) {
    logger.error("[Quota] Error verificando cuota", error);
    // Open-fail
    return { allowed: true, limit: maxLimit };
  }
}
