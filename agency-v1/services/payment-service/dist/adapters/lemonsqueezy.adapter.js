"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LemonSqueezyAdapter = void 0;
class LemonSqueezyAdapter {
    providerName = "LEMON_SQUEEZY";
    isAvailable() {
        return Boolean(process.env.LEMONSQUEEZY_API_KEY);
    }
    async createSession(params, txReference) {
        // TODO: Implement Lemon Squeezy SDK integration
        return { url: `https://app.lemonsqueezy.com/mock?ref=${txReference}`, externalId: txReference };
    }
    verifyWebhook(payload, signature) {
        // TODO: Implement Lemon Squeezy signature validation
        return { isValid: true, eventType: "UNKNOWN", transactionId: payload.meta?.custom_data?.txReference || "" };
    }
    async getTransactionStatus(externalId) {
        return "PENDING";
    }
}
exports.LemonSqueezyAdapter = LemonSqueezyAdapter;
