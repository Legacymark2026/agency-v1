/**
 * Macro Webhook Real Integration (P1 #8)
 *
 * Execute webhooks for macros
 */
export interface WebhookPayload {
    macroId: string;
    conversationId: string;
    executedBy: string;
    timestamp: string;
    conversationData?: Record<string, any>;
    result?: Record<string, any>;
}
/**
 * Valida URL antes de enviar webhook
 */
export declare function validateWebhookUrl(url: string): {
    isValid: boolean;
    error?: string;
};
/**
 * Envía webhook con retry logic
 */
export declare function sendWebhook(url: string, payload: WebhookPayload, options?: {
    retries?: number;
    timeout?: number;
}): Promise<{
    success: boolean;
    statusCode?: number;
    response?: any;
    error?: string;
    attempts: number;
}>;
/**
 * Verifica firma de webhook entrante (para recibir webhooks)
 */
export declare function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
/**
 * Log webhook delivery para debugging
 */
export declare function logWebhookDelivery(webhookId: string, result: Awaited<ReturnType<typeof sendWebhook>>): Promise<void>;
