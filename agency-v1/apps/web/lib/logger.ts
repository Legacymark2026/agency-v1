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
const winstonLogger = winston.createLogger({
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

function emit(level: LogLevel, message: string, context?: LogContext): void {
  // Siempre loguear a winston
  winstonLogger.log(level === "fatal" ? "error" : level, message, context);

  // Si es un nivel de error, también mandar a Sentry
  if (level === "error" || level === "fatal") {
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
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit("debug", message, context),
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  error: (message: string, context?: LogContext) => emit("error", message, context),
  fatal: (message: string, context?: LogContext) => emit("fatal", message, context),
  auth: (message: string, context?: LogContext) => emit("debug", `[AUTH] ${message}`, context),
} as const;
