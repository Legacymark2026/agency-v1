"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const click_controller_1 = require("./controllers/click.controller");
const payout_controller_1 = require("./controllers/payout.controller");
const consumer_1 = require("./events/consumer");
const release_referrals_1 = require("./cron/release-referrals");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4019", 10);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
// ── Health & Readiness Check ──────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({
        status: "healthy",
        service: "affiliate-service",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});
app.get("/ready", async (_req, res) => {
    try {
        // Probar conexión a la base de datos
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ready", db: "connected" });
    }
    catch (err) {
        res.status(503).json({ status: "not_ready", error: String(err) });
    }
});
// ── Redirección & Analíticas de Enlaces ─────────────────────────────────────────
app.get("/r/:code", click_controller_1.trackClick);
// ── Liquidación de Comisiones (Payouts) ─────────────────────────────────────────
app.post("/api/affiliates/payouts", payout_controller_1.processPayout);
// ── Ejecución Manual de Tareas Programadas (Testing) ───────────────────────────
app.post("/api/affiliates/cron/release", async (req, res) => {
    try {
        const warrantyDays = req.body.warrantyDays ? parseInt(req.body.warrantyDays, 10) : 15;
        const result = await (0, release_referrals_1.releaseReferrals)(warrantyDays);
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ── Inicializar Consumidores & Cron Jobs ──────────────────────────────────────
(0, consumer_1.startEventConsumers)();
(0, release_referrals_1.startReferralReleaseScheduler)();
// ── Arrancar Servidor ────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Affiliate Service listening at http://localhost:${PORT}`);
});
process.on("SIGTERM", async () => {
    console.log("SIGTERM received. Shutting down...");
    server.close(async () => {
        await database_1.prisma.$disconnect();
        console.log("Database disconnected. Server closed.");
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map