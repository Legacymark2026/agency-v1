"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpaycoAdapter = void 0;
class EpaycoAdapter {
    providerName = "EPAYCO";
    isAvailable() {
        return Boolean(process.env.EPAYCO_PUBLIC_KEY);
    }
    async createSession(params, txReference) {
        // TODO: Implement ePayco SDK integration
        return { url: `https://checkout.epayco.co/mock?ref=${txReference}`, externalId: txReference };
    }
    verifyWebhook(payload, signature) {
        // TODO: Implement ePayco signature validation (P_CUST_ID_CLIENTE, P_KEY)
        return { isValid: true, eventType: "UNKNOWN", transactionId: payload.x_ref_payco || "" };
    }
    async getTransactionStatus(externalId) {
        return "PENDING";
    }
}
exports.EpaycoAdapter = EpaycoAdapter;
