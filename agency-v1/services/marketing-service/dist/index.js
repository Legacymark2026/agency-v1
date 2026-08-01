"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
try {
    require("@agency/observability/register");
}
catch { /* optional */ }
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const marketing_routes_1 = require("./routes/marketing.routes");
const marketing_middleware_1 = require("./middlewares/marketing.middleware");
// ── Local Graceful Shutdown (avoids @agency/service-auth compile dependency) ──
function setupGracefulShutdown(server) {
    const shutdown = async (signal) => {
        console.log(`[marketing-service] Received ${signal}. Starting graceful shutdown...`);
        server.close(async () => {
            await database_1.prisma.$disconnect().catch(() => { });
            console.log('[marketing-service] Shutdown complete.');
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 15000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4009", 10);
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
// ─── Health & Readiness ───────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({
        status: "healthy",
        service: "marketing-service",
        version: "2.0.0",
        timestamp: new Date().toISOString()
    });
});
app.get("/ready", async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ready", db: "connected" });
    }
    catch (err) {
        res.status(503).json({ status: "not_ready", error: String(err) });
    }
});
const enterprise_routes_1 = require("./routes/enterprise.routes");
const drip_sequence_service_1 = require("./services/drip-sequence.service");
// ─── Router Mounting ──────────────────────────────────────────────────────────
// Mount under /api/v1 (versioned) and /api (backwards compatibility for proxy)
app.use("/api/v1", marketing_routes_1.marketingRouter);
app.use("/api/v1", enterprise_routes_1.enterpriseRouter);
app.use("/api", marketing_routes_1.marketingRouter);
app.use("/api", enterprise_routes_1.enterpriseRouter);
// ─── Email Templates & Mailing Lists (Auxiliary Legacy Routes) ───────────────
app.get("/api/v1/email-templates", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const templates = await database_1.prisma.emailTemplate.findMany({
            where: { companyId: String(companyId) },
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, subject: true, category: true, createdAt: true }
        });
        res.json(templates);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/v1/mailing-lists", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const lists = await database_1.prisma.mailingList.findMany({
            where: { companyId: String(companyId) },
            include: { _count: { select: { subscribers: true } } },
            orderBy: { createdAt: "desc" }
        });
        res.json(lists);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post("/api/v1/mailing-lists", async (req, res) => {
    try {
        const { companyId, name, description } = req.body;
        if (!companyId || !name)
            return res.status(400).json({ error: "companyId and name required" });
        const list = await database_1.prisma.mailingList.create({
            data: { companyId: String(companyId), name: String(name), description: description ? String(description) : null }
        });
        res.status(201).json(list);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get("/api/v1/mailing-lists/:id/subscribers", async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const subscribers = await database_1.prisma.audienceSubscriber.findMany({
            where: { listId: String(id), companyId: String(companyId) },
            orderBy: { createdAt: "desc" }
        });
        res.json(subscribers);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post("/api/v1/mailing-lists/:id/subscribers", async (req, res) => {
    try {
        const { id } = req.params;
        const { companyId, subscribers } = req.body;
        if (!companyId || !Array.isArray(subscribers)) {
            return res.status(400).json({ error: "companyId and subscribers array required" });
        }
        const created = [];
        for (const sub of subscribers) {
            if (sub.email && sub.email.includes("@")) {
                const item = await database_1.prisma.audienceSubscriber.upsert({
                    where: {
                        listId_email: {
                            listId: String(id),
                            email: sub.email.toLowerCase().trim()
                        }
                    },
                    update: { name: sub.name || undefined, customFields: sub.customFields || undefined },
                    create: {
                        listId: String(id),
                        companyId: String(companyId),
                        email: sub.email.toLowerCase().trim(),
                        name: sub.name || "",
                        customFields: sub.customFields || {}
                    }
                });
                created.push(item);
            }
        }
        res.status(201).json({ success: true, count: created.length });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
const marketing_service_1 = require("./services/marketing.service");
app.use(marketing_middleware_1.errorHandler);
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Marketing Service (Mass Email Platform v2.0) listening at http://localhost:${PORT}`);
});
// Cron worker en segundo plano para despachar campañas programadas cada 30 segundos
setInterval(() => {
    const publicUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://app.legacymarksas.com";
    marketing_service_1.MarketingService.processScheduledBlasts(publicUrl).catch((err) => {
        console.error("[Scheduled Blasts Worker Error]:", err);
    });
}, 30000);
// Worker de secuencias drip: procesar pasos vencidos cada 60 segundos
setInterval(() => {
    drip_sequence_service_1.DripSequenceService.processDueSteps().catch((err) => {
        console.error("[Drip Sequence Worker Error]:", err);
    });
}, 60000);
setupGracefulShutdown(server);
process.on("SIGTERM", async () => {
    await database_1.prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=index.js.map