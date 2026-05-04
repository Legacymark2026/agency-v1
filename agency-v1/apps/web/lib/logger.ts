/**
 * lib/logger.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Logger estructurado con Winston para el sistema LegacyMark.
 *
 * COMPORTAMIENTO:
 * - Development: salida legible por humanos en consola con colores
 * - Production: JSON estructurado para ingestión en plataformas (Datadog, Loki)
 *   Los errores y fatales también se reportan a Sentry automáticamente.
 *
 * CONTEXTO:
 * Cada llamada acepta un objeto de contexto opcional. En producción,
 * este contexto se serializa junto con el mensaje. Esto permite rastrear
 * userId, companyId, requestId, etc. en todos los logs.
 *
 * @example
 *   import { logger } from "@/lib/logger";
 *
 *   logger.info("[CRM] Deal creado", { dealId: deal.id, userId });
 *   logger.error("[CAPI] Fallo al enviar evento", { error: err.message, platform: "meta" });
 */

import winston from "winston";
import type { SeverityLevel } from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
type LogContext = any;

const isDev = process.env.NODE_ENV === "development";
const SERVICE = "legacymark-web";

// Configurar Winston
const logger = winston.createLogger({
  level: isDev ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    isDev
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""}`;
          })
        )
      : winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// Niveles que siempre se emiten (incluso en producción)
const ALWAYS_LOG: LogLevel[] = ["warn", "error", "fatal"];

// ── Núcleo de logging ──────────────────────────────────────────────────────────

function emit(level: LogLevel, message: string, context?: LogContext): void {
  logger.log(level, message, context);
}

// ── API pública ───────────────────────────────────────────────────────────────

export { logger };
  if (!ALWAYS_LOG.includes(level)) return;

  const entry = {
    level,
    message,
    service: SERVICE,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (level === "error" || level === "fatal") {
    console.error(JSON.stringify(entry));

    // Reportar a Sentry de forma lazy para no romper si no está configurado
    void (async () => {
      try {
        const Sentry = await import("@sentry/nextjs");
        const sentryLevel: SeverityLevel = level === "fatal" ? "fatal" : "error";
        Sentry.captureMessage(message, {
          level: sentryLevel,
          extra: context,
          tags: { service: SERVICE },
        });
      } catch {
        // Sentry no disponible — ignorar silenciosamente
      }
    })();
  } else {
    console.warn(JSON.stringify(entry));
  }
}

// ── API Pública ────────────────────────────────────────────────────────────────

export const logger = {
  /** Solo visible en development. Usar para debugging durante dev. */
  debug: (message: string, context?: LogContext) => emit("debug", message, context),

  /** Información general del sistema. Solo visible en development. */
  info: (message: string, context?: LogContext) => emit("info", message, context),

  /** Advertencias no fatales. Visible en todos los entornos. */
  warn: (message: string, context?: LogContext) => emit("warn", message, context),

  /** Error recuperable. Reportado a Sentry en producción. */
  error: (message: string, context?: LogContext) => emit("error", message, context),

  /** Error no recuperable. Reportado a Sentry como fatal. */
  fatal: (message: string, context?: LogContext) => emit("fatal", message, context),

  /**
   * Helper para auth — compatible con el patrón existente de [AUTH] prefix.
   * @deprecated Usar logger.debug("[AUTH] mensaje") directamente.
   */
  auth: (message: string, context?: LogContext) =>
    emit("debug", `[AUTH] ${message}`, context),
} as const;
