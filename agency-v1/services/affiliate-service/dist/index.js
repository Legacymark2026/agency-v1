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
// ── Profile ──────────────────────────────────────────────────────────────────────
app.get("/api/affiliates/profile", async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            res.status(400).json({ success: false, error: "userId required" });
            return;
        }
        const profile = await database_1.prisma.affiliateProfile.findUnique({
            where: { userId },
            include: { commissionPlan: true },
        });
        res.json({ success: true, data: profile });
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
app.post("/api/affiliates/profile", async (req, res) => {
    try {
        const { userId, code, commissionPlanId } = req.body;
        if (!userId || !code || !commissionPlanId) {
            res.status(400).json({ success: false, error: "userId, code, commissionPlanId required" });
            return;
        }
        const profile = await database_1.prisma.affiliateProfile.create({
            data: { userId, code: code.toUpperCase(), commissionPlanId },
            include: { commissionPlan: true },
        });
        res.json({ success: true, data: profile });
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
// ── Stats ─────────────────────────────────────────────────────────────────────────
app.get("/api/affiliates/stats", async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            res.status(400).json({ success: false, error: "userId required" });
            return;
        }
        const profile = await database_1.prisma.affiliateProfile.findUnique({
            where: { userId },
            include: { commissionPlan: true },
        });
        if (!profile) {
            res.json({ success: true, data: null });
            return;
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [totalClicks, convertedClicks, last30DaysClicks, totalReferrals, pendingReferrals, approvedReferrals, rejectedReferrals, last30DaysReferrals, earnedAgg, pendingAgg, paidAgg,] = await Promise.all([
            database_1.prisma.click.count({ where: { affiliateCode: profile.code } }),
            database_1.prisma.click.count({ where: { affiliateCode: profile.code } }), // all clicks (no converted field in schema)
            database_1.prisma.click.count({ where: { affiliateCode: profile.code, createdAt: { gte: thirtyDaysAgo } } }),
            database_1.prisma.referral.count({ where: { affiliateId: profile.id } }),
            database_1.prisma.referral.count({ where: { affiliateId: profile.id, status: 'PENDING' } }),
            database_1.prisma.referral.count({ where: { affiliateId: profile.id, status: 'APPROVED' } }),
            database_1.prisma.referral.count({ where: { affiliateId: profile.id, status: 'REJECTED' } }),
            database_1.prisma.referral.count({ where: { affiliateId: profile.id, createdAt: { gte: thirtyDaysAgo } } }),
            database_1.prisma.referral.aggregate({ where: { affiliateId: profile.id, status: 'APPROVED' }, _sum: { commissionAmount: true } }),
            database_1.prisma.referral.aggregate({ where: { affiliateId: profile.id, status: 'PENDING' }, _sum: { commissionAmount: true } }),
            database_1.prisma.payout.aggregate({ where: { affiliateId: profile.id, status: 'PAID' }, _sum: { amount: true } }),
        ]);
        const toNum = (v) => v?.toString?.() ?? "0.00";
        const totalEarned = toNum(earnedAgg._sum.commissionAmount);
        const pendingEarned = toNum(pendingAgg._sum.commissionAmount);
        const totalPaidOut = toNum(paidAgg._sum.amount);
        const balance = (parseFloat(totalEarned) - parseFloat(totalPaidOut)).toFixed(2);
        res.json({
            success: true,
            data: {
                profile: { ...profile, commissionPlan: { ...profile.commissionPlan, value: Number(profile.commissionPlan.value) } },
                totalClicks, convertedClicks,
                conversionRate: totalReferrals > 0 ? Math.round((approvedReferrals / totalReferrals) * 100) : 0,
                totalReferrals, pendingReferrals, approvedReferrals, rejectedReferrals,
                totalEarned, pendingEarned, totalPaidOut,
                pendingPayoutBalance: balance,
                last30DaysClicks, last30DaysReferrals,
            }
        });
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
// ── Referrals ─────────────────────────────────────────────────────────────────────
app.get("/api/affiliates/referrals", async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            res.status(400).json({ success: false, error: "userId required" });
            return;
        }
        const profile = await database_1.prisma.affiliateProfile.findUnique({ where: { userId } });
        if (!profile) {
            res.json({ success: true, data: [] });
            return;
        }
        const rows = await database_1.prisma.referral.findMany({
            where: { affiliateId: profile.id },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        const data = rows.map((r) => ({
            ...r,
            commissionAmount: r.commissionAmount?.toString?.() ?? "0.00",
            orderAmount: r.orderAmount?.toString?.() ?? "0.00",
        }));
        res.json({ success: true, data });
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
// ── Clicks ────────────────────────────────────────────────────────────────────────
app.get("/api/affiliates/clicks", async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            res.status(400).json({ success: false, error: "userId required" });
            return;
        }
        const profile = await database_1.prisma.affiliateProfile.findUnique({ where: { userId } });
        if (!profile) {
            res.json({ success: true, data: [] });
            return;
        }
        const rows = await database_1.prisma.click.findMany({
            where: { affiliateCode: profile.code },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        res.json({ success: true, data: rows });
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
// ── Payouts list ──────────────────────────────────────────────────────────────────
app.get("/api/affiliates/payouts", async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            res.status(400).json({ success: false, error: "userId required" });
            return;
        }
        const profile = await database_1.prisma.affiliateProfile.findUnique({ where: { userId } });
        if (!profile) {
            res.json({ success: true, data: [] });
            return;
        }
        const rows = await database_1.prisma.payout.findMany({
            where: { affiliateId: profile.id },
            orderBy: { createdAt: 'desc' },
        });
        const data = rows.map((p) => ({ ...p, amount: p.amount?.toString?.() ?? "0.00" }));
        res.json({ success: true, data });
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
// ── Commission Plans ──────────────────────────────────────────────────────────────
app.get("/api/affiliates/plans", async (_req, res) => {
    try {
        const rows = await database_1.prisma.commissionPlan.findMany({ orderBy: { createdAt: 'desc' } });
        const data = rows.map((p) => ({ ...p, value: Number(p.value) }));
        res.json({ success: true, data });
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
app.post("/api/affiliates/plans", async (req, res) => {
    try {
        const { name, type, value, cookieLifetimeInt } = req.body;
        if (!name || !type || value == null) {
            res.status(400).json({ success: false, error: "name, type, value required" });
            return;
        }
        const plan = await database_1.prisma.commissionPlan.create({
            data: { name, type, value, cookieLifetimeInt: cookieLifetimeInt ?? 30 }
        });
        res.json({ success: true, data: { ...plan, value: Number(plan.value) } });
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
app.delete("/api/affiliates/plans/:id", async (req, res) => {
    try {
        await database_1.prisma.commissionPlan.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
// ── All Affiliates (Admin) ────────────────────────────────────────────────────────
app.get("/api/affiliates", async (_req, res) => {
    try {
        const rows = await database_1.prisma.affiliateProfile.findMany({
            include: { commissionPlan: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: rows });
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
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