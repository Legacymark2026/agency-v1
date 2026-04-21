/**
 * services/capi-dispatcher.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio centralizado de dispatching S2S (Server-to-Server) para todas
 * las plataformas de conversión: Meta CAPI, TikTok CAPI, GA4, LinkedIn CAPI.
 *
 * PROBLEMA RESUELTO:
 * Antes, cada stage change en crm.ts llamaba directamente a:
 *   await triggerMetaCapi(...)
 *   await triggerTiktokCapi(...)
 *   await triggerGoogleCapi(...)
 *   await triggerLinkedinCapi(...)
 * ...de forma SÍNCRONA, bloqueando la respuesta al usuario ~400-800ms extra.
 *
 * AHORA:
 * - Un solo punto de entrada: `dispatchConversionEvent()`
 * - Ejecución ASÍNCRONA y NO BLOQUEANTE (fire-and-forget con error logging)
 * - Retry 1 vez por plataforma en caso de fallo de red
 * - Compatible con leads.ts y crm.ts
 *
 * USO en Server Actions:
 *   dispatchConversionEvent({
 *     eventName: "Purchase",
 *     value: deal.value,
 *     currency: "USD",
 *     userData: { email: deal.contactEmail, name: deal.contactName },
 *   }, companyId); // sin await — no bloquea la respuesta
 *
 * @module services/capi-dispatcher
 */

import { logger } from "@/lib/logger";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { sendTiktokCapiEvent } from "@/lib/tiktok-capi";
import { sendGa4Event } from "@/lib/ga4-mp";
import { sendLinkedinCapiEvent } from "@/lib/linkedin-capi";

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface ConversionPayload {
  /** Nombre del evento según la nomenclatura Meta: "Purchase", "Lead", "CompleteRegistration", etc. */
  eventName: string;
  /** Valor monetario del evento (en USD por defecto) */
  value?: number;
  /** Moneda ISO 4217 */
  currency?: string;
  /** Datos del usuario para hashing. NUNCA enviar en texto plano — las librerías hacen el hash. */
  userData?: {
    email?: string | null;
    phone?: string | null;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    fbc?: string | null;
    fbp?: string | null;
    fbclid?: string | null;
    gclid?: string | null;
    ttclid?: string | null;
    li_fat_id?: string | null;
  };
  /** ID del lead o deal que origina el evento (para deduplicación) */
  sourceId?: string;
  /** Timestamp Unix en segundos (default: now) */
  eventTime?: number;
  /** Plataformas a notificar. Por defecto notifica a todas. */
  platforms?: Array<"meta" | "tiktok" | "ga4" | "linkedin">;
}

// ── Dispatcher Core ────────────────────────────────────────────────────────────

/**
 * Despacha un evento de conversión a todas las plataformas S2S configuradas.
 * SIEMPRE debe llamarse sin `await` para no bloquear la respuesta al usuario.
 *
 * @returns Promise<void> — ignorable (fire and forget)
 *
 * @example
 *   // En updateDealStage, después del update de Prisma:
 *   dispatchConversionEvent({ eventName: "Purchase", value: deal.value, userData: {...} }, companyId);
 *   return { success: true }; // ← respuesta inmediata al usuario
 */
export function dispatchConversionEvent(
  payload: ConversionPayload,
  companyId: string
): void {
  // Fire-and-forget: iniciamos la Promise pero no esperamos
  _dispatchAsync(payload, companyId).catch((err) => {
    logger.error("[CAPI Dispatcher] Error inesperado en dispatching", {
      error: err instanceof Error ? err.message : String(err),
      eventName: payload.eventName,
      companyId,
    });
  });
}

// ── Implementación Interna ─────────────────────────────────────────────────────

async function _dispatchAsync(
  payload: ConversionPayload,
  companyId: string
): Promise<void> {
  const {
    eventName,
    value,
    currency = "USD",
    userData = {},
    sourceId,
    eventTime = Math.floor(Date.now() / 1000),
    platforms = ["meta", "tiktok", "ga4", "linkedin"],
  } = payload;

  const context = { eventName, companyId, sourceId, value };

  const tasks: Promise<void>[] = [];

  if (platforms.includes("meta")) {
    tasks.push(
      withRetry(
        async () => {
          const { prisma } = await import("@/lib/prisma");
          const config = await prisma.integrationConfig.findUnique({ where: { companyId_provider: { companyId, provider: 'meta-pixel' } } });
          if (!config || !config.isEnabled) return;
          const pixelId = (config.config as any)?.pixelId || (config.config as any)?.metaPixelId;
          const accessToken = (config.config as any)?.accessToken || (config.config as any)?.metaAccessToken;
          if (!pixelId || !accessToken) return;
          
          return sendMetaCapiEvent({
             pixelId,
             accessToken,
             eventName: eventName as any,
             userData,
             customData: { value, currency }
          });
        },
        "meta",
        context
      )
    );
  }

  if (platforms.includes("tiktok")) {
    tasks.push(
      withRetry(
        () =>
          sendTiktokCapiEvent(companyId, {
            eventName,
            eventTime,
            userData: userData as any,
            customData: {
                value,
                currency,
            }
          }),
        "tiktok",
        context
      )
    );
  }

  if (platforms.includes("ga4")) {
    tasks.push(
      withRetry(
        () =>
          sendGa4Event(companyId, {
            eventName: eventName.toLowerCase(),
            userData: userData as any,
            eventParams: {
                value,
                currency,
            }
          }),
        "ga4",
        context
      )
    );
  }

  if (platforms.includes("linkedin")) {
    tasks.push(
      withRetry(() => sendLinkedinCapiEvent(companyId, {
          userData: userData as any,
          conversionInfo: {
              currencyCode: currency,
              amount: value
          }
      }), "linkedin", context)
    );
  }

  // Ejecutar todas las plataformas en paralelo — si una falla, las demás continúan
  await Promise.allSettled(tasks);
}

// ── Retry Helper ───────────────────────────────────────────────────────────────

async function withRetry(
  fn: () => Promise<unknown>,
  platform: string,
  context: Record<string, unknown>,
  maxRetries = 1
): Promise<void> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await fn();
      logger.debug(`[CAPI] ${platform} event dispatched`, context);
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        logger.error(`[CAPI] ${platform} failed after ${maxRetries + 1} attempts`, {
          ...context,
          platform,
          error: err instanceof Error ? err.message : String(err),
        });
      } else {
        logger.warn(`[CAPI] ${platform} attempt ${attempt + 1} failed, retrying...`, { platform });
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      }
    }
  }
}
