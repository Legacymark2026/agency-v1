"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Finance Service — Billing, Payroll & Accounting Microservice
 * Port: 4006 | Low frequency, high data criticality
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4006", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "5mb" }));
app.get("/health", (_req, res) => { res.json({ status: "healthy", service: "finance-service" }); });
app.get("/ready", async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ready" });
    }
    catch (err) {
        res.status(503).json({ status: "not_ready", error: String(err) });
    }
});
// ── Invoices ─────────────────────────────────────────────────────────────────
app.get("/api/invoices", async (req, res) => {
    try {
        const { companyId, status } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const where = { companyId: String(companyId) };
        if (status)
            where.status = String(status);
        const invoices = await database_1.prisma.invoice.findMany({ where, orderBy: { createdAt: "desc" }, include: { items: true } });
        res.json({ invoices });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.patch("/api/invoices/:id/pay", async (req, res) => {
    try {
        const invoice = await database_1.prisma.invoice.update({ where: { id: req.params.id }, data: { status: "PAID" } });
        await eventBus.publish("invoice.paid", { invoiceId: invoice.id, companyId: invoice.companyId, dealId: invoice.dealId, amount: invoice.totalAmount });
        res.json({ invoice });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Payroll ──────────────────────────────────────────────────────────────────
app.get("/api/payroll", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const payrolls = await database_1.prisma.payroll.findMany({ where: { companyId: String(companyId) }, orderBy: { periodEnd: "desc" }, include: { employee: true } });
        res.json({ payrolls });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Expenses ─────────────────────────────────────────────────────────────────
app.get("/api/expenses", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const expenses = await database_1.prisma.expense.findMany({ where: { companyId: String(companyId) }, orderBy: { date: "desc" }, include: { category: true } });
        res.json({ expenses });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Webhook: Stripe ──────────────────────────────────────────────────────────
app.post("/api/webhooks/stripe", async (req, res) => {
    console.log("[finance-service] Stripe webhook received");
    // TODO: Verify stripe signature and process payment events
    res.json({ received: true });
});
app.post("/api/webhooks/paypal", async (req, res) => {
    console.log("[finance-service] PayPal webhook received");
    res.json({ received: true });
});
// ── Cron: Subscriptions ──────────────────────────────────────────────────────
app.post("/api/cron/subscriptions", async (_req, res) => {
    console.log("[finance-service] Processing subscription renewals");
    res.json({ processed: 0 });
});
const eventBus = new events_1.EventBus(REDIS_URL, "finance-service");
app.listen(PORT, "0.0.0.0", () => { console.log(`💰 Finance Service running on port ${PORT}`); });
process.on("SIGTERM", async () => { await eventBus.disconnect(); await database_1.prisma.$disconnect(); process.exit(0); });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.default = app;
//# sourceMappingURL=index.js.map