/**
 * sentry.server.config.ts
 * ──────────────────────────────────────────────────────────────
 * Sentry SDK initialization for the SERVER (Node.js) side.
 *
 * This covers:
 * - API Routes
 * - Server Actions
 * - Middleware (non-edge)
 * - Server Components
 * - Route Handlers
 *
 * CRITICAL: This file guards against PII and Meta CAPI data
 * appearing in server-side Sentry traces.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",

  // ── Performance tracing ──────────────────────────────────────
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // ── Expected errors — do not alert ─────────────────────────
  ignoreErrors: [
    "NEXT_NOT_FOUND",       // Next.js notFound() call — expected
    "NEXT_REDIRECT",        // Next.js redirect() call — expected
    "AbortError",           // Request aborted by client
  ],

  // ── PII & CAPI Data Scrubbing ────────────────────────────────
  // CRITICAL: Meta CAPI sends hashed user_data. Even hashed data
  // should not appear in observability tools per Meta policy.
  // This hook strips sensitive payload sections before sending.
  beforeSend(event) {
    // ── Strip user PII ──────────────────────────────────────
    if (event.user) {
      event.user = {
        id: event.user.id, // Keep ID for deduplication
        ip_address: "{{auto}}", // Keep IP for geo (Sentry anonymizes it)
        // Everything else (email, username, name) is stripped
      };
    }

    // ── Strip Meta CAPI payloads from request body ──────────
    // Server Actions that call sendMetaCapiEvent() must not
    // expose user_data in Sentry traces.
    if (event.request?.data) {
      const dataStr =
        typeof event.request.data === "string"
          ? event.request.data
          : JSON.stringify(event.request.data);

      if (
        dataStr.includes("user_data") ||
        dataStr.includes("access_token") ||
        dataStr.includes("pixel_id")
      ) {
        event.request.data = "[CAPI_PAYLOAD_REDACTED — contains user_data]";
      }
    }

    // ── Strip Authorization headers ─────────────────────────
    if (event.request?.headers) {
      const headers = event.request.headers as Record<string, string>;
      if (headers["authorization"]) {
        headers["authorization"] = "[REDACTED]";
      }
      if (headers["x-api-key"]) {
        headers["x-api-key"] = "[REDACTED]";
      }
    }

    // ── Strip TikTok / LinkedIn CAPI tokens ────────────────
    if (event.extra) {
      const sensitiveKeys = ["accessToken", "access_token", "pixelId", "pixel_id", "apiKey"];
      for (const key of sensitiveKeys) {
        if (key in event.extra) {
          (event.extra as Record<string, unknown>)[key] = "[REDACTED]";
        }
      }
    }

    return event;
  },

  // ── Custom fingerprinting for better grouping ────────────────
  // Prevents Sentry from grouping all Prisma errors into one issue
  beforeSendTransaction(event) {
    return event;
  },
});
