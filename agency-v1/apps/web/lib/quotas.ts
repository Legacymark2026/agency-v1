/**
 * lib/quotas.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sistema de cuotas (SaaS) limitadas por el tier de subscripción.
 * Usa Upstash Redis para contar uso en la ventana mensual sin saturar la DB.
 *
 * CORRECCIONES v2:
 *  - Fix DECR: usaba URL incompleta y body mal formateado para el pipeline
 *  - Fix ventana mensual: ahora calcula TTL real hasta fin del mes actual
 *  - MASTER_TENANT_ID bypass preservado
 */

import { logger } from "@/lib/logger";

export interface QuotaLimits {
  leads: number;
  emails_per_month: number;
  campaigns: number;
  ai_agents: number;
  ai_interactions: number;
}

export const TIER_LIMITS: Record<string, QuotaLimits> = {
  free: {
    leads: 100,
    emails_per_month: 500,
    campaigns: 1,
    ai_agents: 1,
    ai_interactions: 50,
  },
  pro: {
    leads: 5000,
    emails_per_month: 10000,
    campaigns: 10,
    ai_agents: 3,
    ai_interactions: 5000,
  },
  agency: {
    leads: 999999,
    emails_per_month: 100000,
    campaigns: 999,
    ai_agents: 999,
    ai_interactions: 999999,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Calcula los segundos restantes hasta el primer día del mes siguiente (00:00 UTC).
 * Garantiza que la ventana de quota se resetea siempre el día 1 de cada mes.
 */
function secondsUntilEndOfMonth(): number {
  const now = new Date();
  const firstOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return Math.ceil((firstOfNextMonth.getTime() - now.getTime()) / 1000);
}

const hasRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// ── API Pública ────────────────────────────────────────────────────────────────

/**
 * Incrementa el uso de una feature y verifica si excede la cuota del plan.
 *
 * @param companyId El tenant (agencia cliente)
 * @param feature   La feature a verificar (ej. 'leads', 'emails_per_month')
 * @param tier      El nivel de subscripción de la tabla Company (default: 'free')
 */
export async function enforceQuota(
  companyId: string,
  feature: keyof QuotaLimits,
  tier: string = "free"
): Promise<{ allowed: boolean; limit: number; remaining?: number }> {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS["free"];
  const maxLimit = limits[feature];

  // ── BYPASS: Agencia dueña del sistema → acceso ilimitado ──────────────────
  if (process.env.MASTER_TENANT_ID && companyId === process.env.MASTER_TENANT_ID) {
    return { allowed: true, limit: 999999, remaining: 999999 };
  }

  if (!hasRedis) {
    logger.warn("[Quota] Redis no configurado — cuotas no aplicadas en tiempo real.", { feature, tier });
    return { allowed: true, limit: maxLimit };
  }

  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
  const quotaKey = `quota:${companyId}:${feature}:${monthKey}`;
  // TTL real: segundos restantes hasta el 1ro del mes siguiente
  const windowSec = secondsUntilEndOfMonth();

  try {
    // INCR + EXPIRE en pipeline (atómico)
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", quotaKey],
        ["EXPIRE", quotaKey, windowSec],
      ]),
    });

    if (!res.ok) throw new Error(`Upstash HTTP error: ${res.status}`);

    const data = await res.json() as [{ result: number }, { result: number }];
    const currentUsage = data[0].result;
    const allowed = currentUsage <= maxLimit;

    if (!allowed) {
      // Revertir el INCR si se excedió el límite
      // FIX: URL correcta (/pipeline), body correcto (array de arrays), Content-Type presente
      fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([["DECR", quotaKey]]),
      }).catch((err) =>
        logger.warn("[Quota] DECR rollback failed", {
          key: quotaKey,
          error: err instanceof Error ? err.message : String(err),
        })
      );
    }

    return {
      allowed,
      limit: maxLimit,
      remaining: Math.max(0, maxLimit - currentUsage),
    };
  } catch (error) {
    logger.error("[Quota] Error verificando cuota — fail-open", {
      feature,
      companyId,
      error: error instanceof Error ? error.message : String(error),
    });
    // fail-open: no bloqueamos la operación si Redis falla
    return { allowed: true, limit: maxLimit };
  }
}

/**
 * Obtiene el uso actual de una feature sin incrementar el contador.
 * Útil para mostrar consumo en el dashboard de billing.
 *
 * FIX (5.2): Ahora acepta tier param o lo consulta desde DB para devolver limit correcto.
 */
export async function getQuotaUsage(
  companyId: string,
  feature: keyof QuotaLimits,
  tier?: string
): Promise<{ usage: number; limit: number; tier: string } | null> {
  // FIX #6: Usar el singleton de prisma en vez de crear una nueva instancia
  // La instanciación repetida de PrismaClient agota el connection pool bajo carga
  let resolvedTier = tier;
  if (!resolvedTier) {
    try {
      const { prisma } = await import("@/lib/prisma");
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { subscriptionTier: true },
      });
      resolvedTier = company?.subscriptionTier || "free";
    } catch {
      resolvedTier = "free";
    }
  }

  const limits = TIER_LIMITS[resolvedTier] || TIER_LIMITS["free"];
  const maxLimit = limits[feature];

  if (!hasRedis) return { usage: 0, limit: maxLimit, tier: resolvedTier };

  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
  const quotaKey = `quota:${companyId}:${feature}:${monthKey}`;

  try {
    const res = await fetch(`${url}/get/${quotaKey}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { usage: 0, limit: maxLimit, tier: resolvedTier };
    const data = await res.json() as { result: string | null };
    return {
      usage: parseInt(data.result || "0", 10),
      limit: maxLimit,
      tier: resolvedTier,
    };
  } catch {
    return { usage: 0, limit: maxLimit, tier: resolvedTier };
  }
}
