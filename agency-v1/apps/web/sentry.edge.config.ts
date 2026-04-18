/**
 * sentry.edge.config.ts
 * ──────────────────────────────────────────────────────────────
 * Sentry SDK initialization for the EDGE RUNTIME.
 *
 * Edge runtime runs in: middleware.ts and edge API routes.
 * It has a constrained API (no Node.js built-ins).
 *
 * Note: The OpenTelemetry setup is SKIPPED for edge runtime
 * to prevent compatibility issues with the WebAssembly sandbox.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",

  // Lower sampling for edge — it runs on every request including
  // static assets which would inflate trace volume rapidly.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0.5,

  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],

  // Edge runtime has limited API — keep beforeSend minimal
  beforeSend(event) {
    // Strip authorization from edge middleware traces
    if (event.request?.headers) {
      const headers = event.request.headers as Record<string, string>;
      if (headers["authorization"]) {
        headers["authorization"] = "[REDACTED]";
      }
      if (headers["cookie"]) {
        // Cookies may contain session tokens — do not log them
        headers["cookie"] = "[REDACTED]";
      }
    }
    return event;
  },
});
