"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlacetoPayAdapter = void 0;
class PlacetoPayAdapter {
    providerName = "PLACETOPAY";
    isAvailable() {
        return Boolean(process.env.PLACETOPAY_TRANKEY);
    }
    async createSession(params, txReference) {
        // TODO: Implement PlacetoPay SDK integration
        return { url: `https://checkout.placetopay.com/mock?ref=${txReference}`, externalId: txReference };
    }
    verifyWebhook(payload, signature) {
        // TODO: Implement PlacetoPay signature validation
        return { isValid: true, eventType: "UNKNOWN", transactionId: payload.reference || "" };
    }
    async getTransactionStatus(externalId) {
        return "PENDING";
    }
}
exports.PlacetoPayAdapter = PlacetoPayAdapter;
