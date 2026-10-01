"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadoPagoAdapter = void 0;
class MercadoPagoAdapter {
    providerName = "MERCADOPAGO";
    isAvailable() {
        return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
    }
    async createSession(params, txReference) {
        // TODO: Implement MercadoPago SDK integration
        return { url: `https://mercadopago.com/mock?ref=${txReference}`, externalId: txReference };
    }
    verifyWebhook(payload, signature) {
        // TODO: Implement MercadoPago signature validation
        return { isValid: true, eventType: "UNKNOWN", transactionId: payload.id || "" };
    }
    async getTransactionStatus(externalId) {
        return "PENDING";
    }
}
exports.MercadoPagoAdapter = MercadoPagoAdapter;
