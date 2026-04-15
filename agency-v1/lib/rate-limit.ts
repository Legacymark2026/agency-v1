/**
 * lib/rate-limit.ts
 * A-5 Fix: Rate limiting para server actions sensibles.
 * 
 * Implementación en memoria — suficiente para un solo proceso.
 * Para producción multi-instancia: reemplazar con Upstash Redis o Vercel KV.
 * 
 * @example
 * const allowed = rateLimit(`create_deal:${userId}`, 10, 60_000); // 10/min
 * if (!allowed) return { error: "Too many requests. Please wait." };
 */

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Limpiar entradas expiradas cada 5 minutos para evitar memory leaks
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, record] of rateLimitMap.entries()) {
            if (now > record.resetAt) rateLimitMap.delete(key);
        }
    }, 5 * 60 * 1000);
}

/**
 * Verifica si una acción está dentro del límite de velocidad permitido.
 * 
 * @param key     Clave única (ejemplo: `create_deal:${userId}`)
 * @param limit   Número máximo de invocaciones permitidas en la ventana
 * @param windowMs Ventana de tiempo en milisegundos
 * @returns `true` si la acción está permitida, `false` si ha excedido el límite
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
        return true; // primera llamada en la ventana — permitted
    }

    if (record.count >= limit) return false; // límite excedido — blocked

    record.count++;
    return true; // dentro del límite — permitted
}
