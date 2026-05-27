"use strict";
/**
 * Macro Webhook Real Integration (P1 #8)
 *
 * Execute webhooks for macros
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWebhookUrl = validateWebhookUrl;
exports.sendWebhook = sendWebhook;
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.logWebhookDelivery = logWebhookDelivery;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("./logger");
const WEBHOOK_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const BACKOFF_MULTIPLIER = 2;
/**
 * Valida URL antes de enviar webhook
 */
function validateWebhookUrl(url) {
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
    }
    catch (error) {
        return {
            isValid: false,
            error: "URL inválida",
        };
    }
}
/**
 * Envía webhook con retry logic
 */
async function sendWebhook(url, payload, options = {}) {
    const { retries = MAX_RETRIES, timeout = WEBHOOK_TIMEOUT } = options;
    // Validar URL
    const validation = validateWebhookUrl(url);
    if (!validation.isValid) {
        logger_1.logger.error("[Webhook] Invalid URL", { url, error: validation.error });
        return {
            success: false,
            error: validation.error,
            attempts: 0,
        };
    }
    let lastError;
    let lastStatusCode;
    let lastResponse;
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
                logger_1.logger.info("[Webhook] Success", {
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
        }
        catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
            if (attempt < retries) {
                // Exponential backoff
                const delay = Math.pow(BACKOFF_MULTIPLIER, attempt) * 1000;
                logger_1.logger.warn("[Webhook] Retry", {
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
    logger_1.logger.error("[Webhook] Failed after retries", {
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
function generateSignature(payload) {
    // En producción, usar secret de la company
    const secret = process.env.WEBHOOK_SECRET || "dev-secret";
    return crypto_1.default
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
}
/**
 * Verifica firma de webhook entrante (para recibir webhooks)
 */
function verifyWebhookSignature(payload, signature, secret) {
    const expected = crypto_1.default
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
    return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
/**
 * Log webhook delivery para debugging
 */
async function logWebhookDelivery(webhookId, result) {
    try {
        logger_1.logger.info("[Webhook] Delivery logged", {
            webhookId,
            success: result.success,
            statusCode: result.statusCode,
            attempts: result.attempts,
            error: result.error,
        });
    }
    catch (error) {
        logger_1.logger.error("[Webhook] Error logging delivery", {
            webhookId,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
//# sourceMappingURL=webhooks.js.map