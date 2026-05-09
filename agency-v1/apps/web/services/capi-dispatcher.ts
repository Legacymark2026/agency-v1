/**
 * services/capi-dispatcher.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin wrapper / compatibility shim.
 *
 * MIGRATION NOTE (2026-05-09):
 *   The canonical dispatcher is now `lib/services/conversions/dispatcher.ts`.
 *   That file handles all 4 platforms (Meta, Google, TikTok, LinkedIn) with:
 *     ✅ external_id (SHA-256 leadId)
 *     ✅ dynamic action_source (website vs system_generated)
 *     ✅ ttp cookie support for TikTok
 *     ✅ multi-conversionId for LinkedIn
 *     ✅ correct deduplication event_id for Meta
 *
 *   This file re-exports `dispatchConversion` as `dispatchConversionEvent` so
 *   any existing callers that use the old signature keep working without
 *   needing an immediate mass-rename across the codebase.
 *
 * USAGE (unchanged API for existing callers):
 *   dispatchConversionEvent({
 *     eventName: "Purchase",
 *     value: deal.value,
 *     currency: "USD",
 *     userData: { email: "...", fbclid: "...", ... },
 *     sourceId: deal.id,
 *   }, companyId);
 *
 * @module services/capi-dispatcher
 */

import { dispatchConversion, type ConversionEvent } from "@/lib/services/conversions/dispatcher";
import { logger } from "@/lib/logger";

// ── Re-export canonical types ──────────────────────────────────────────────────

export type { ConversionEvent };

/**
 * Legacy payload shape used by older callers (crm.ts, etc.).
 * Maps to the canonical ConversionEvent expected by lib/services/conversions/dispatcher.ts.
 */
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
    ttp?: string | null;
    li_fat_id?: string | null;
  };
  /** ID del lead o deal que origina el evento (para deduplicación) */
  sourceId?: string;
  /** Timestamp Unix en segundos (default: now) */
  eventTime?: number;
  /** Plataformas a notificar. Ignorado en el dispatcher canónico (siempre notifica a todas las activas). */
  platforms?: Array<"meta" | "tiktok" | "ga4" | "linkedin">;
}

// ── Dispatcher shim ────────────────────────────────────────────────────────────

/**
 * @deprecated Use `dispatchConversion` from `@/lib/services/conversions/dispatcher` directly.
 *
 * Compatibility wrapper that maps the old ConversionPayload shape to the
 * canonical ConversionEvent and delegates to the primary dispatcher.
 * Fire-and-forget: ALWAYS call without `await`.
 */
export function dispatchConversionEvent(
  payload: ConversionPayload,
  companyId: string
): void {
  const canonicalEvent: ConversionEvent = {
    leadId:    payload.sourceId || `anon_${Date.now()}`,
    eventName: payload.eventName,
    value:     payload.value    ?? 0,
    currency:  payload.currency ?? "USD",
    timestamp: payload.eventTime ? payload.eventTime * 1000 : Date.now(),
    userData: {
      email:     payload.userData?.email,
      phone:     payload.userData?.phone,
      firstName: payload.userData?.firstName || (payload.userData?.name ? payload.userData.name.split(" ")[0] : undefined),
      lastName:  payload.userData?.lastName  || (payload.userData?.name ? payload.userData.name.split(" ").slice(1).join(" ") : undefined),
      ip:        payload.userData?.ipAddress,
      userAgent: payload.userData?.userAgent,
      fbc:       payload.userData?.fbc,
      fbp:       payload.userData?.fbp,
      fbclid:    payload.userData?.fbclid,
      gclid:     payload.userData?.gclid,
      ttclid:    payload.userData?.ttclid,
      li_fat_id: payload.userData?.li_fat_id,
    },
  };

  dispatchConversion(canonicalEvent, companyId).catch((err) => {
    logger.error("[CAPI Shim] Error inesperado en dispatching", {
      error:     err instanceof Error ? err.message : String(err),
      eventName: payload.eventName,
      companyId,
    });
  });
}
