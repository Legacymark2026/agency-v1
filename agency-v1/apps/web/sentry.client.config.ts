/**
 * sentry.client.config.ts
 * ──────────────────────────────────────────────────────────────
 * Sentry SDK initialization for the CLIENT (browser) side.
 *
 * Key design decisions:
 * - Session Replay is DISABLED by default (cost control).
 *   Only enabled on error events to capture reproduction context.
 * - `beforeSend` strips PII before any data leaves the browser.
 * - tracesSampleRate is low in production (cost + performance).
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",

  // ── Performance tracing ──────────────────────────────────────
  // Sample only 10% of transactions in production to control costs.
  // 100% in development/staging for full visibility.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // ── Session Replay ───────────────────────────────────────────
  // Capture full session replay ONLY when an error occurs.
  // Zero passive recording (privacy + cost).
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,

  // ── Integrations ────────────────────────────────────────────
  integrations: [
    Sentry.replayIntegration({
      // Mask ALL text and block ALL media in replays by default.
      // This ensures personal data (names, emails, passwords) is
      // never captured in session recordings.
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // ── PII Scrubbing ────────────────────────────────────────────
  // This hook runs on every event BEFORE it is sent to Sentry.
  // It is the last line of defense against PII leakage.
  beforeSend(event) {
    // Redact user email from the user context
    if (event.user?.email) {
      event.user.email = "[REDACTED]";
    }
    // Redact user name from the user context
    if (event.user?.username) {
      event.user.username = "[REDACTED]";
    }
    // Remove phone numbers from extra data
    if (event.extra?.phone) {
      delete event.extra.phone;
    }
    // Remove any access tokens that may appear in breadcrumbs
    if (Array.isArray(event.breadcrumbs)) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb: any) => {
        if (breadcrumb.data?.token || breadcrumb.data?.accessToken) {
          return {
            ...breadcrumb,
            data: { ...breadcrumb.data, token: "[REDACTED]", accessToken: "[REDACTED]" },
          };
        }
        return breadcrumb;
      });
    }
    return event;
  },

  // ── Reduce noise: ignore expected non-errors ─────────────────
  ignoreErrors: [
    // User cancels navigation
    "AbortError",
    // Next.js soft navigation — not a real error
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
    // Network flakiness — not actionable
    "NetworkError",
    "Failed to fetch",
    // Browser extension conflicts
    /^ResizeObserver loop/,
  ],
});
