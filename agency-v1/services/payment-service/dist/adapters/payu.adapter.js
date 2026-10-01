"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayUAdapter = void 0;
class PayUAdapter {
    providerName = "PAYU";
    isAvailable() {
        return Boolean(process.env.PAYU_API_KEY);
    }
    async createSession(params, txReference) {
        // TODO: Implement PayU SDK integration
        return { url: `https://checkout.payulatam.com/mock?ref=${txReference}`, externalId: txReference };
    }
    verifyWebhook(payload, signature) {
        // TODO: Implement PayU signature validation
        return { isValid: true, eventType: "UNKNOWN", transactionId: payload.reference_sale || "" };
    }
    async getTransactionStatus(externalId) {
        return "PENDING";
    }
}
exports.PayUAdapter = PayUAdapter;
