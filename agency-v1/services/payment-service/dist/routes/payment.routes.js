"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentRouter = createPaymentRouter;
/**
 * Payment Service — Express Inbound Router (Driving Adapter)
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express_1 = require("express");
const zod_1 = require("zod");
const checkoutSessionSchema = zod_1.z.object({
    companyId: zod_1.z.string().min(1),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.enum(["COP", "USD", "EUR"]).default("USD"),
    title: zod_1.z.string().optional(),
    customerEmail: zod_1.z.string().email().optional(),
    invoiceId: zod_1.z.string().optional(),
    orderId: zod_1.z.string().optional(),
    preferredProvider: zod_1.z.enum(["STRIPE", "WOMPI", "PAYPAL", "MERCADOPAGO", "BOLD", "TRANSFER"]).optional(),
    successUrl: zod_1.z.string().url().optional(),
    cancelUrl: zod_1.z.string().url().optional(),
});
const posPaymentSchema = zod_1.z.object({
    companyId: zod_1.z.string().min(1),
    amount: zod_1.z.number().positive(),
    orderId: zod_1.z.string().optional(),
    provider: zod_1.z.enum(["BOLD", "REDEBAN", "WOMPI", "CREDIBANCO"]).default("BOLD"),
    cardBrand: zod_1.z.string().optional(),
    cardLast4: zod_1.z.string().optional(),
    terminalId: zod_1.z.string().optional(),
});
function createPaymentRouter(useCases) {
    const router = (0, express_1.Router)();
    router.get("/gateways", (_req, res) => {
        const gateways = useCases.getAvailableGateways();
        res.json({ success: true, gateways });
    });
    router.post("/checkout-session", async (req, res) => {
        try {
            const parsed = checkoutSessionSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, errors: parsed.error.errors });
            }
            const result = await useCases.createCheckoutSession(parsed.data);
            res.json({ success: true, ...result });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
    router.post("/pos/create", async (req, res) => {
        try {
            const parsed = posPaymentSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, errors: parsed.error.errors });
            }
            const tx = await useCases.processPOSPayment(parsed.data);
            res.status(201).json({ success: true, transaction: tx.toJSON() });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
    router.post("/webhooks/:provider", async (req, res) => {
        try {
            const provider = String(req.params.provider);
            // NOTE: For Stripe, the payload must be received as a raw buffer for signature verification.
            // Wompi signatures are embedded in the body payload itself.
            const signature = (req.headers["stripe-signature"] || req.headers["x-signature"] || "");
            const result = await useCases.handleWebhook(provider, req.body, signature);
            res.json({ success: true, ...result });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    });
    return router;
}
