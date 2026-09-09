/**
 * Utilidad de Rate Limiting en memoria para Next.js Route Handlers y Middleware.
 * Implementa una ventana deslizante de conteo por clave (IP, identificador o email)
 * con recolección automática de basura para prevenir fugas de memoria.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const MAX_MAP_ENTRIES = 10000; // Prevenir ataques de denegación de servicio por memoria (Memory Exhaustion)

// Limpieza periódica de registros expirados cada 5 minutos
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS && rateLimitMap.size < MAX_MAP_ENTRIES) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }

  // Si aún supera el límite máximo, purgar los registros más antiguos
  if (rateLimitMap.size >= MAX_MAP_ENTRIES) {
    const keysToDelete = Array.from(rateLimitMap.keys()).slice(0, Math.floor(MAX_MAP_ENTRIES * 0.2));
    for (const k of keysToDelete) {
      rateLimitMap.delete(k);
    }
  }
}

export interface RateLimitOptions {
  /** Número máximo de solicitudes permitidas en la ventana de tiempo */
  maxRequests: number;
  /** Duración de la ventana en segundos (por ejemplo, 60 para 1 minuto) */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Evalúa si una solicitud identificada por `key` supera el límite de tasa permitido.
 * 
 * @param key Identificador de la solicitud (generalmente IP o IP + ruta)
 * @param options Configuración de límite y ventana
 * @returns RateLimitResult con estado de éxito y metadatos de cabecera
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  cleanupExpired();

  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const existing = rateLimitMap.get(key);

  if (!existing || existing.resetAt <= now) {
    // Nuevo periodo para este identificador
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      success: true,
      limit: options.maxRequests,
      remaining: options.maxRequests - 1,
      resetSeconds: options.windowSeconds,
    };
  }

  // Si aún está dentro de la ventana de tiempo
  if (existing.count >= options.maxRequests) {
    const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      success: false,
      limit: options.maxRequests,
      remaining: 0,
      resetSeconds,
    };
  }

  // Incrementar contador
  existing.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    success: true,
    limit: options.maxRequests,
    remaining: options.maxRequests - existing.count,
    resetSeconds,
  };
}

/**
 * Obtiene la dirección IP del cliente a partir de los encabezados de la solicitud.
 */
export function getClientIp(req: Request): string {
  // 1. Cloudflare header
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // 2. Standard X-Forwarded-For
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }

  // 3. Nginx / reverse proxy header
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "127.0.0.1";
}
