"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationWebhookService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class IntegrationWebhookService {
    /**
     * Registrar un endpoint de webhook para eventos
     */
    static async registerWebhook(companyId, url, events, secret) {
        const webhookSecret = secret || crypto_1.default.randomBytes(24).toString('hex');
        return {
            id: 'wh_' + Math.random().toString(36).substring(7),
            companyId,
            url,
            events,
            secret: webhookSecret,
            createdAt: new Date()
        };
    }
    /**
     * Listar webhooks registrados
     */
    static async getWebhooks(companyId) {
        return [];
    }
    /**
     * Eliminar un webhook
     */
    static async deleteWebhook(webhookId) {
        return { success: true, id: webhookId };
    }
    /**
     * Enviar evento a todos los webhooks registrados que coincidan
     */
    static async dispatchEvent(companyId, event, payload) {
        const webhooks = [
            { id: 'wh_1', url: 'https://example.com/hook', events: ['email.sent', 'email.opened'], secret: 'test-secret' }
        ];
        const relevantWebhooks = webhooks.filter(w => w.events.includes(event));
        for (const webhook of relevantWebhooks) {
            const body = JSON.stringify({
                event,
                payload,
                timestamp: new Date().toISOString()
            });
            const signature = crypto_1.default
                .createHmac('sha256', webhook.secret)
                .update(body)
                .digest('hex');
            try {
                await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Signature': signature
                    },
                    body
                });
            }
            catch (error) {
                console.error(`Error enviando webhook ${webhook.id}:`, error);
            }
        }
    }
    /**
     * Enviar evento ping de prueba para verificar URL
     */
    static async testWebhook(webhookId) {
        const webhook = { id: webhookId, url: 'https://example.com/hook', events: ['email.sent'], secret: 'test-secret' };
        const body = JSON.stringify({
            event: 'ping',
            message: 'Prueba de webhook',
            timestamp: new Date().toISOString()
        });
        const signature = crypto_1.default
            .createHmac('sha256', webhook.secret)
            .update(body)
            .digest('hex');
        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature
                },
                body
            });
            return { success: response.ok, status: response.status };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
}
exports.IntegrationWebhookService = IntegrationWebhookService;
//# sourceMappingURL=integration-webhook.service.js.map