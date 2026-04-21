/**
 * lib/rate-limit.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Rate limiting distribuido para entornos serverless (Vercel).
 *
 * ESTRATEGIA:
 * - Si UPSTASH_REDIS_REST_URL está configurado → usa Upstash Redis via REST API
 *   (sin dependencias extra, solo fetch nativo). Compatible con Edge Runtime.
 * - Si no está configurado → usa Map in-memory con advertencia en production.
 *   NOTA: In-memory NO funciona correctamente en multi-instancia serverless.
 *
 * SETUP UPSTASH (recomendado para producción):
 * 1. Crear cuenta en upstash.com (plan gratuito: 10k requests/día)
 * 2. Agregar al .env.local:
 *    UPSTASH_REDIS_REST_URL="https://xxxx.upstash.io"
 *    UPSTASH_REDIS_REST_TOKEN="AXxx..."
 *
 * @example
 *   const allowed = await rateLimit(`create_deal:${userId}`, 5, 60_000);
 *   if (!allowed) return fail("Demasiadas peticiones. Espera un momento.", 429);
 */

import { logger } from "@/lib/logger";

// ── Sliding Window con Upstash REST API ───────────────────────────────────────

async function rateLimitRedis(key: string, limit: number, windowMs: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const windowSec = Math.ceil(windowMs / 1000);
  const nowSec = Math.floor(Date.now() / 1000);
  const windowKey = `rl:${key}:${Math.floor(nowSec / windowSec)}`;

  try {
    // INCR + EXPIRE en pipeline para atomicidad
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", windowKey],
        ["EXPIRE", windowKey, windowSec],
      ]),
    });

    if (!res.ok) throw new Error(`Upstash HTTP error: ${res.status}`);

    const data = (await res.json()) as [{ result: number }, { result: number }];
    const count = data[0].result;
    return count <= limit;
  } catch (err) {
    // Si Redis falla, falla abierto (permitir la request) pero loggear
    logger.error("[RateLimit] Upstash error — failing open", {
      error: err instanceof Error ? err.message : String(err),
      key,
    });
    return true;
  }
}

// ── Fallback In-Memory (solo dev / single-instance) ───────────────────────────

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Limpiar entradas expiradas cada 5 minutos
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetAt) rateLimitMap.delete(key);
      }
    },
    5 * 60 * 1_000
  );
}

function rateLimitMemory(key: string, limit: number, windowMs: number): boolean {
  if (process.env.NODE_ENV === "production") {
    logger.warn("[RateLimit] Using in-memory rate limiter in production. Set UPSTASH_REDIS_REST_URL for distributed rate limiting.", { key });
  }

  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) return false;

  record.count++;
  return true;
}

// ── API Pública ────────────────────────────────────────────────────────────────

const hasRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

/**
 * Verifica si una acción está dentro del límite de velocidad permitido.
 *
 * @param key      Clave única (ej: `create_deal:${userId}`)
 * @param limit    Número máximo de invocaciones en la ventana
 * @param windowMs Ventana de tiempo en milisegundos
 * @returns `true` si la acción está permitida, `false` si ha excedido el límite
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  if (hasRedis) {
    return rateLimitRedis(key, limit, windowMs);
  }
  return rateLimitMemory(key, limit, windowMs);
}

/**
 * @deprecated Usar `await rateLimit(...)` (versión async).
 * Esta función síncrona se mantiene por compatibilidad con código legacy.
 * En producción sin Redis, su comportamiento no es fiable en multi-instancia.
 */
export function rateLimitSync(key: string, limit: number, windowMs: number): boolean {
  return rateLimitMemory(key, limit, windowMs);
}
