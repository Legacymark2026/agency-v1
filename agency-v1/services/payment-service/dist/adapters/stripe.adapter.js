"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeAdapter = exports.StripeGateway = exports.stripeClient = void 0;
/**
 * Stripe Payment Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Encapsulates Stripe SDK interactions: Session checkout, PaymentIntent,
 * and Webhook signature verification.
 */
const stripe_1 = __importDefault(require("stripe"));
const gateway_registry_1 = require("../infrastructure/gateway-registry");
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
exports.stripeClient = STRIPE_SECRET_KEY
    ? new stripe_1.default(STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" })
    : null;
class StripeGateway {
    providerName = "STRIPE";
    isAvailable() {
        return Boolean(STRIPE_SECRET_KEY && exports.stripeClient);
    }
    async getTransactionStatus(externalId) {
        if (!exports.stripeClient)
            throw new Error("Stripe not configured");
        const session = await exports.stripeClient.checkout.sessions.retrieve(externalId);
        if (session.payment_status === "paid")
            return "APPROVED";
        if (session.payment_status === "unpaid" && session.status === "expired")
            return "DECLINED";
        return "PENDING";
    }
    async createSession(params, txReference) {
        if (!exports.stripeClient) {
            throw new Error("Stripe secret key not configured.");
        }
        const isCop = (params.currency || "USD").toUpperCase() === "COP";
        const currency = isCop ? "cop" : (params.currency || "usd").toLowerCase();
        const unitAmount = isCop ? Math.round(params.amount) : Math.round(params.amount * 100);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legacymarksas.com";
        const successUrl = params.successUrl || `${baseUrl}/invoice/${params.invoiceId}?payment_success=true`;
        const cancelUrl = params.cancelUrl || `${baseUrl}/invoice/${params.invoiceId}?payment_canceled=true`;
        const session = await exports.stripeClient.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: {
                            name: params.title || "Pago de Servicio — LegacyMark",
                            metadata: {
                                companyId: params.companyId,
                                invoiceId: params.invoiceId || "",
                                orderId: params.orderId || "",
                            },
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            customer_email: params.customerEmail,
            client_reference_id: txReference, // use txReference instead of invoiceId
            metadata: {
                companyId: params.companyId,
                invoiceId: params.invoiceId || "",
                orderId: params.orderId || "",
                reference: txReference
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
        });
        return {
            url: session.url || "",
            externalId: session.id,
        };
    }
    verifyWebhook(payload, signature) {
        if (!exports.stripeClient || !STRIPE_WEBHOOK_SECRET) {
            throw new Error("Stripe webhook credentials missing");
        }
        try {
            const event = exports.stripeClient.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
            if (event.type === "checkout.session.completed") {
                const session = event.data.object;
                const ref = session.client_reference_id || session.id;
                return {
                    isValid: true,
                    eventType: "PAYMENT_APPROVED",
                    transactionId: session.id,
                    amount: (session.amount_total || 0) / 100,
                    currency: (session.currency || "usd").toUpperCase()
                };
            }
            return { isValid: true, eventType: "UNKNOWN", transactionId: "" };
        }
        catch (err) {
            return { isValid: false, eventType: "UNKNOWN", transactionId: "" };
        }
    }
}
exports.StripeGateway = StripeGateway;
exports.StripeAdapter = new StripeGateway(); // For backwards compatibility
gateway_registry_1.gatewayRegistry.register(exports.StripeAdapter);
