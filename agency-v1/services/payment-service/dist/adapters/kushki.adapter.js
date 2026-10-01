"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KushkiAdapter = void 0;
class KushkiAdapter {
    providerName = "KUSHKI";
    isAvailable() {
        return Boolean(process.env.KUSHKI_PUBLIC_KEY);
    }
    async createSession(params, txReference) {
        // TODO: Implement Kushki SDK integration
        return { url: `https://kushkipagos.com/mock?ref=${txReference}`, externalId: txReference };
    }
    verifyWebhook(payload, signature) {
        // TODO: Implement Kushki signature validation
        return { isValid: true, eventType: "UNKNOWN", transactionId: payload.ticketNumber || "" };
    }
    async getTransactionStatus(externalId) {
        return "PENDING";
    }
}
exports.KushkiAdapter = KushkiAdapter;
