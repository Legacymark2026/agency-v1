"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaddleAdapter = void 0;
class PaddleAdapter {
    providerName = "PADDLE";
    isAvailable() {
        return Boolean(process.env.PADDLE_API_KEY);
    }
    async createSession(params, txReference) {
        // TODO: Implement Paddle SDK integration
        return { url: `https://checkout.paddle.com/mock?ref=${txReference}`, externalId: txReference };
    }
    verifyWebhook(payload, signature) {
        // TODO: Implement Paddle signature validation
        return { isValid: true, eventType: "UNKNOWN", transactionId: payload.p_order_id || "" };
    }
    async getTransactionStatus(externalId) {
        return "PENDING";
    }
}
exports.PaddleAdapter = PaddleAdapter;
