import { Request, Response } from "express";
import Redis from "ioredis";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
const eventBus = new EventBus(redisUrl, "@agency/affiliate-service");

// Fallback URL para redirección
const FALLBACK_URL = process.env.NEXT_APP_URL || "https://tuagencia.com";

redis.on("error", (err) => console.error("[ClickController] Redis error:", err));

export async function trackClick(req: Request, res: Response) {
  const { code } = req.params;
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "";
  const referer = req.headers["referer"] || "";

  if (!code) {
    return res.redirect(FALLBACK_URL);
  }

  try {
    // 1. Click Spamming Rate Limiting en Redis (Max 5 clics por minuto por IP y código)
    const rateLimitKey = `rate:click:${ip}:${code}`;
    const clickCount = await redis.incr(rateLimitKey);
    
    if (clickCount === 1) {
      await redis.expire(rateLimitKey, 60); // expira en 60 segundos
    }

    if (clickCount > 5) {
      console.warn(`[ClickController] Click spam detected for IP: ${ip}, Code: ${code}. Request count: ${clickCount}`);
      // Redirigir al Home sin trackear analíticas en la base de datos
      return res.redirect(FALLBACK_URL);
    }

    // 2. Validar código en caché (O(1))
    const cacheKey = `affiliate:valid:${code}`;
    let cachedStatus = await redis.get(cacheKey);

    if (cachedStatus === null) {
      // No está en caché, consultar PostgreSQL
      const affiliate = await prisma.affiliateProfile.findUnique({
        where: { code }
      });

      if (!affiliate || affiliate.status !== "ACTIVE") {
        // Guardar "false" en caché por 1 hora para prevenir spam a la DB
        await redis.set(cacheKey, "false", "EX", 3600);
        return res.redirect(FALLBACK_URL);
      }

      // Guardar "true" en caché por 24 horas
      await redis.set(cacheKey, "true", "EX", 86400);
      cachedStatus = "true";
    }

    if (cachedStatus === "false") {
      // Código inválido o inactivo
      return res.redirect(FALLBACK_URL);
    }

    // 3. Asincronía Total: Enviar analíticas mediante el Event Bus (Redis Stream)
    // Esto se procesará en segundo plano por el consumidor de eventos
    eventBus.publish("affiliate.click_registered", {
      code,
      ip,
      userAgent,
      referer
    }).catch(err => {
      console.error("[ClickController] Error publishing click event:", err);
    });

    // 4. Setear Cookie de Tracking de Afiliado (HttpOnly, Secure, Lax)
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("affiliate_code", code, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax"
    });

    // 5. Redireccionar al flujo final de checkout/compra
    const checkoutUrl = `${FALLBACK_URL}/checkout-o-servicio`;
    return res.redirect(checkoutUrl);

  } catch (error) {
    console.error("[ClickController] Error handling redirection:", error);
    // En caso de fallo catastrófico de Redis o DB, priorizar experiencia del usuario redirigiendo sin trackear
    return res.redirect(FALLBACK_URL);
  }
}
