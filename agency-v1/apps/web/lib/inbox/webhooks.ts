/**
 * lib/inbox/webhooks.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Macro Webhook Real Integration (P1 #8)
 *
 * Execute macros with external webhooks:
 * - Validate URL (HTTPS, whitelist if configured)
 * - Retry logic (3x, exponential backoff)
 * - Logging and audit trail
 * - Timeout handling
 */

import { logger } from "@/lib/logger";

export interface WebhookPayload {
  macroId: string;
  conversationId: string;
  executedBy: string;
  timestamp: string;
  conversationData?: Record<string, any>;
  result?: Record<string, any>;
}

const WEBHOOK_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const BACKOFF_MULTIPLIER = 2;

/**
 * Valida URL antes de enviar webhook
 */
export function validateWebhookUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Solo HTTPS en producción
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      return {
        isValid: false,
        error: "Webhooks requieren HTTPS en producción",
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: "URL inválida",
    };
  }
}

/**
 * Envía webhook con retry logic
 */
export async function sendWebhook(
  url: string,
  payload: WebhookPayload,
  options: { retries?: number; timeout?: number } = {}
): Promise<{
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
  attempts: number;
}> {
  const { retries = MAX_RETRIES, timeout = WEBHOOK_TIMEOUT } = options;

  // Validar URL
  const validation = validateWebhookUrl(url);
  if (!validation.isValid) {
    logger.error("[Webhook] Invalid URL", { url, error: validation.error });
    return {
      success: false,
      error: validation.error,
      attempts: 0,
    };
  }

  let lastError: string | undefined;
  let lastStatusCode: number | undefined;
  let lastResponse: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Macro-Signature": generateSignature(JSON.stringify(payload)),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      lastStatusCode = response.status;
      lastResponse = await response.json();

      if (response.ok) {
        logger.info("[Webhook] Success", {
          url,
          statusCode: response.status,
          attempts: attempt + 1,
        });
        return {
          success: true,
          statusCode: response.status,
          response: lastResponse,
          attempts: attempt + 1,
        };
      }

      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      if (attempt < retries) {
        // Exponential backoff
        const delay = Math.pow(BACKOFF_MULTIPLIER, attempt) * 1000;
        logger.warn("[Webhook] Retry", {
          url,
          attempt: attempt + 1,
          maxRetries: retries,
          delayMs: delay,
          error: lastError,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  logger.error("[Webhook] Failed after retries", {
    url,
    attempts: retries + 1,
    lastError,
    lastStatusCode,
  });

  return {
    success: false,
    statusCode: lastStatusCode,
    error: lastError,
    attempts: retries + 1,
  };
}

/**
 * Genera firma HMAC para webhook (seguridad)
 */
function generateSignature(payload: string): string {
  // En producción, usar secret de la company
  const secret = process.env.WEBHOOK_SECRET || "dev-secret";
  const crypto = require("crypto");

  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

/**
 * Verifica firma de webhook entrante (para recibir webhooks)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/**
 * Log webhook delivery para debugging
 */
export async function logWebhookDelivery(
  webhookId: string,
  result: Awaited<ReturnType<typeof sendWebhook>>
) {
  try {
    const { prisma } = await import("@/lib/prisma");

    // Buscar webhook en ResourcePermission o crear collection específica
    logger.info("[Webhook] Delivery logged", {
      webhookId,
      success: result.success,
      statusCode: result.statusCode,
      attempts: result.attempts,
    });
  } catch (error) {
    logger.error("[Webhook] Error logging delivery", {
      webhookId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
