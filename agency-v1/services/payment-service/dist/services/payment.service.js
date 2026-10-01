"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = exports.paymentEventBus = void 0;
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
exports.paymentEventBus = new events_1.EventBus(REDIS_URL, "payment-service");
const gateway_registry_1 = require("../infrastructure/gateway-registry");
class PaymentService {
    /**
     * Derives active gateway capabilities based on environment presence.
     */
    getAvailableGateways() {
        const available = gateway_registry_1.gatewayRegistry.getAvailableProviders();
        const result = {};
        for (const provider of available) {
            const currency = ["WOMPI", "BOLD", "PSE", "EPAYCO"].includes(provider) ? "COP" : "USD";
            result[provider.toLowerCase()] = { enabled: true, currency };
        }
        return result;
    }
    /**
     * Unified Checkout Session Creator (Web / Invoicing / Subscriptions)
     */
    async createCheckoutSession(params) {
        const reference = `REF-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        let provider = params.preferredProvider || "TRANSFER";
        if (provider !== "TRANSFER") {
            try {
                const gateway = gateway_registry_1.gatewayRegistry.get(provider);
                const session = await gateway.createSession(params, reference);
                return {
                    url: session.url,
                    reference,
                    provider,
                };
            }
            catch (e) {
                console.warn(`[PaymentService Legacy] Could not create session for ${provider}:`, e);
            }
        }
        // Simulation / Direct transfer fallback
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legacymarksas.com";
        return {
            url: `${baseUrl}/invoice/${params.invoiceId || reference}?mock_payment=true`,
            reference,
            provider: "TRANSFER",
        };
    }
    /**
     * Process and register an in-store POS card/terminal transaction
     */
    async processPOSPayment(payload) {
        const gateway = gateway_registry_1.gatewayRegistry.get(payload.provider);
        let tx;
        if (typeof gateway.createPOSTransaction === "function") {
            tx = gateway.createPOSTransaction(payload);
        }
        else {
            tx = { id: "unknown", reference: "unknown", amount: payload.amount, currency: "COP", provider: payload.provider };
        }
        // Asynchronously notify subscribers via EventBus (Event-Driven Decoupling)
        exports.paymentEventBus.publish("payment.succeeded", {
            transactionId: tx.id,
            companyId: tx.companyId,
            orderId: tx.orderId,
            reference: tx.reference,
            amount: tx.amount,
            currency: tx.currency,
            provider: tx.provider,
            approvalCode: tx.approvalCode,
            rrn: tx.rrn,
            timestamp: tx.createdAt,
        }).catch((err) => console.warn("[PaymentService] Event publish warning:", err.message));
        return tx;
    }
    /**
     * Handles incoming webhooks from payment providers.
     * Decouples provider verification and emits normalized `payment.succeeded` event.
     */
    async handleWebhook(provider, rawPayload, signatureHeader) {
        const providerUpper = provider.toUpperCase();
        try {
            const gateway = gateway_registry_1.gatewayRegistry.get(providerUpper);
            const result = gateway.verifyWebhook(rawPayload, signatureHeader || "");
            if (result.isValid && result.eventType === "PAYMENT_APPROVED") {
                await exports.paymentEventBus.publish("payment.succeeded", {
                    reference: result.transactionId,
                    amount: result.amount || 0,
                    currency: result.currency || "USD",
                    provider: providerUpper,
                    timestamp: new Date().toISOString(),
                });
                return { acknowledged: true, eventDispatched: true, reference: result.transactionId };
            }
            return { acknowledged: true, eventDispatched: false };
        }
        catch (e) {
            console.error("[PaymentService Legacy] Webhook failed:", e);
            return { acknowledged: true, eventDispatched: false };
        }
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
