"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WompiAdapter = exports.WompiGateway = void 0;
/**
 * Wompi (Bancolombia) Payment Gateway Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates official Wompi integrity signatures, builds payment links,
 * and validates asynchronous webhook notifications.
 */
const crypto_1 = __importDefault(require("crypto"));
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || "";
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || "";
const gateway_registry_1 = require("../infrastructure/gateway-registry");
class WompiGateway {
    providerName = "WOMPI";
    isAvailable() {
        return Boolean(WOMPI_PUBLIC_KEY && WOMPI_INTEGRITY_SECRET);
    }
    async getTransactionStatus(externalId) {
        try {
            const pubKey = process.env.WOMPI_PUBLIC_KEY || "";
            const response = await fetch(`https://production.wompi.co/v1/transactions/${externalId}`, {
                headers: { Authorization: `Bearer ${pubKey}` }
            });
            if (!response.ok)
                return "PENDING";
            const data = await response.json();
            const status = data?.data?.status;
            if (status === "APPROVED")
                return "APPROVED";
            if (status === "DECLINED" || status === "VOIDED" || status === "ERROR")
                return "DECLINED";
            return "PENDING";
        }
        catch {
            return "PENDING";
        }
    }
    async createSession(params, txReference) {
        const amountInCents = Math.round(params.amount * 100);
        const signature = this.computeIntegritySignature(txReference, amountInCents, "COP");
        const publicKey = WOMPI_PUBLIC_KEY;
        const url = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${txReference}&signature:integrity=${signature}`;
        return { url };
    }
    verifyWebhook(payload, signature) {
        const eventsSecret = process.env.WOMPI_EVENTS_SECRET || WOMPI_INTEGRITY_SECRET;
        if (payload?.signature && payload?.timestamp && eventsSecret) {
            const { transaction } = payload.data;
            const raw = `${transaction.id}${transaction.status}${transaction.amount_in_cents}${payload.timestamp}${eventsSecret}`;
            const calculated = crypto_1.default.createHash("sha256").update(raw).digest("hex");
            const isValid = crypto_1.default.timingSafeEqual(Buffer.from(calculated, "hex"), Buffer.from(payload.signature.checksum, "hex"));
            if (!isValid) {
                return { isValid: false, eventType: "UNKNOWN", transactionId: "" };
            }
        }
        const event = payload?.data?.transaction;
        if (event && payload?.event === "transaction.updated") {
            const isApproved = event.status === "APPROVED";
            return {
                isValid: true,
                eventType: isApproved ? "PAYMENT_APPROVED" : "PAYMENT_DECLINED",
                transactionId: event.id,
                amount: event.amount_in_cents / 100,
                currency: event.currency
            };
        }
        return { isValid: true, eventType: "UNKNOWN", transactionId: "" };
    }
    computeIntegritySignature(reference, amountInCents, currency = "COP", expirationTime) {
        const raw = `${reference}${amountInCents}${currency}${expirationTime || ""}${WOMPI_INTEGRITY_SECRET}`;
        return crypto_1.default.createHash("sha256").update(raw).digest("hex");
    }
}
exports.WompiGateway = WompiGateway;
exports.WompiAdapter = new WompiGateway();
gateway_registry_1.gatewayRegistry.register(exports.WompiAdapter);
