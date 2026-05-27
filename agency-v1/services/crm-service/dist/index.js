"use strict";
/**
 * CRM Service — Customer Relationship Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Leads, Deals, Pipeline, Scoring, Sequences, Commissions
 * Port: 4002
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const ioredis_1 = __importDefault(require("ioredis"));
const date_fns_1 = require("date-fns");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4002", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "5mb" }));
// ── Health Checks ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "crm-service", timestamp: new Date().toISOString() });
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
// ── Leads ────────────────────────────────────────────────────────────────────
app.get("/api/leads", async (req, res) => {
    try {
        const { companyId, status, source, scoreMin, scoreMax, search, page = "1", pageSize = "20", sortBy = "createdAt", sortOrder = "desc", syncDealId, syncEmail, } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const where = {
            companyId: String(companyId),
        };
        if (status)
            where.status = String(status);
        if (source)
            where.source = String(source);
        if (scoreMin || scoreMax) {
            where.score = {
                gte: scoreMin ? parseInt(String(scoreMin), 10) : 0,
                lte: scoreMax ? parseInt(String(scoreMax), 10) : 100,
            };
        }
        if (syncDealId || syncEmail) {
            const orConditions = [];
            if (syncDealId)
                orConditions.push({ convertedToDealId: String(syncDealId) });
            if (syncEmail)
                orConditions.push({ email: { equals: String(syncEmail), mode: "insensitive" } });
            where.OR = orConditions;
        }
        else if (search) {
            where.OR = [
                { name: { contains: String(search), mode: "insensitive" } },
                { email: { contains: String(search), mode: "insensitive" } },
                { company: { contains: String(search), mode: "insensitive" } },
            ];
        }
        const p = parseInt(String(page), 10);
        const limit = parseInt(String(pageSize), 10);
        const skip = (p - 1) * limit;
        const [leads, total] = await Promise.all([
            database_1.prisma.lead.findMany({
                where,
                orderBy: { [String(sortBy)]: String(sortOrder) },
                skip,
                take: limit,
            }),
            database_1.prisma.lead.count({ where }),
        ]);
        res.json({
            leads,
            total,
            pages: Math.ceil(total / limit),
            page: p,
        });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/leads/analytics/source", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const analytics = await database_1.prisma.lead.groupBy({
            by: ["source"],
            where: { companyId: String(companyId) },
            _count: { id: true },
            _avg: { score: true },
        });
        const result = analytics.map((a) => ({
            source: a.source,
            count: a._count.id,
            avgScore: Math.round(a._avg.score || 0),
        }));
        res.json({ success: true, data: result });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/leads/:id", async (req, res) => {
    try {
        const lead = await database_1.prisma.lead.findUnique({
            where: { id: req.params.id },
            include: {
                campaign: { select: { id: true, name: true, platform: true, code: true } },
            },
        });
        if (!lead)
            return res.status(404).json({ error: "Lead not found" });
        // Fetch optional relations independently
        let conversations = [];
        let marketingEvents = [];
        try {
            conversations = await database_1.prisma.conversation.findMany({
                where: { leadId: req.params.id },
                take: 5,
                orderBy: { updatedAt: "desc" },
                select: { id: true, channel: true, status: true, lastMessageAt: true, lastMessagePreview: true },
            });
        }
        catch { }
        try {
            marketingEvents = await database_1.prisma.marketingEvent.findMany({
                where: { leadId: req.params.id },
                take: 10,
                orderBy: { createdAt: "desc" },
                select: { id: true, eventType: true, eventName: true, url: true, createdAt: true },
            });
        }
        catch { }
        res.json({ lead: { ...lead, conversations, marketingEvents } });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/leads", async (req, res) => {
    try {
        const correlationId = (req.headers["x-correlation-id"] || `trace-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
        const lead = await database_1.prisma.$transaction(async (tx) => {
            const createdLead = await tx.lead.create({ data: req.body });
            await tx.outboxEvent.create({
                data: {
                    eventName: "lead.created",
                    payload: { leadId: createdLead.id, companyId: createdLead.companyId, data: createdLead },
                    correlationId,
                },
            });
            return createdLead;
        });
        res.status(201).json({ lead });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.patch("/api/leads/:id", async (req, res) => {
    try {
        const updated = await database_1.prisma.lead.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                updatedAt: new Date(),
            },
        });
        res.json({ lead: updated });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.delete("/api/leads/:id", async (req, res) => {
    try {
        const lead = await database_1.prisma.lead.findUnique({
            where: { id: req.params.id },
            select: { email: true, companyId: true }
        });
        if (lead) {
            if (lead.email) {
                await database_1.prisma.deal.deleteMany({
                    where: {
                        companyId: lead.companyId,
                        contactEmail: lead.email,
                    }
                });
            }
            await database_1.prisma.lead.delete({
                where: { id: req.params.id }
            });
            res.json({ success: true });
        }
        else {
            res.status(404).json({ error: "Lead not found" });
        }
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/leads/bulk-update", async (req, res) => {
    try {
        const { ids, data, companyId } = req.body;
        if (!ids || !Array.isArray(ids))
            return res.status(400).json({ error: "ids array required" });
        const result = await database_1.prisma.lead.updateMany({
            where: {
                id: { in: ids },
                ...(companyId && { companyId }),
            },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });
        res.json({ success: true, count: result.count });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/leads/bulk-delete", async (req, res) => {
    try {
        const { ids, companyId } = req.body;
        if (!ids || !Array.isArray(ids))
            return res.status(400).json({ error: "ids array required" });
        const leads = await database_1.prisma.lead.findMany({
            where: {
                id: { in: ids },
                ...(companyId && { companyId }),
            },
            select: { email: true, companyId: true },
        });
        const emails = leads.map((l) => l.email).filter(Boolean);
        await database_1.prisma.$transaction([
            database_1.prisma.deal.deleteMany({
                where: {
                    companyId: { in: leads.map((l) => l.companyId) },
                    contactEmail: { in: emails },
                },
            }),
            database_1.prisma.lead.deleteMany({
                where: {
                    id: { in: ids },
                    ...(companyId && { companyId }),
                },
            }),
        ]);
        res.json({ success: true, count: ids.length });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/leads/convert-to-deal", async (req, res) => {
    try {
        const { leadId, dealData } = req.body;
        const lead = await database_1.prisma.lead.findUnique({
            where: { id: leadId },
            select: { name: true, email: true, phone: true }
        });
        if (!lead)
            return res.status(404).json({ error: "Lead not found" });
        const [deal] = await database_1.prisma.$transaction([
            database_1.prisma.deal.create({
                data: {
                    title: dealData.title,
                    value: dealData.value,
                    stage: "QUALIFIED",
                    probability: dealData.probability ?? 30,
                    contactName: lead.name ?? undefined,
                    contactEmail: lead.email,
                    companyId: dealData.companyId,
                    source: "LEAD_CONVERTED",
                    expectedClose: dealData.expectedClose ? new Date(dealData.expectedClose) : undefined,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            }),
            database_1.prisma.lead.update({
                where: { id: leadId },
                data: { status: "CONVERTED", convertedAt: new Date(), updatedAt: new Date() },
            }),
        ]);
        res.status(201).json({ success: true, dealId: deal.id });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Deals ────────────────────────────────────────────────────────────────────
app.get("/api/deals", async (req, res) => {
    try {
        const { companyId, stage } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const where = { companyId: String(companyId) };
        if (stage)
            where.stage = String(stage);
        const deals = await database_1.prisma.deal.findMany({
            where,
            orderBy: { updatedAt: "desc" },
        });
        res.json({ deals });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/deals", async (req, res) => {
    try {
        const deal = await database_1.prisma.deal.create({
            data: {
                title: req.body.title,
                value: req.body.value || 0,
                stage: req.body.stage || "NEW",
                priority: req.body.priority || "MEDIUM",
                probability: req.body.probability || 10,
                contactName: req.body.contactName,
                contactEmail: req.body.contactEmail,
                companyId: req.body.companyId,
                notes: req.body.notes,
                expectedClose: req.body.expectedClose ? new Date(req.body.expectedClose) : undefined,
                source: req.body.source || "MANUAL",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        if (req.body.contactEmail) {
            const existingLead = await database_1.prisma.lead.findFirst({
                where: {
                    email: req.body.contactEmail.toLowerCase(),
                    companyId: req.body.companyId
                }
            });
            if (!existingLead) {
                await database_1.prisma.lead.create({
                    data: {
                        name: req.body.contactName || null,
                        email: req.body.contactEmail.toLowerCase(),
                        phone: req.body.contactPhone || null,
                        company: req.body.contactCompany || null,
                        message: req.body.notes || `Creado automáticamente desde Pipeline para el Deal: ${deal.title}`,
                        source: req.body.source || "DIRECT",
                        utmSource: req.body.utmSource || null,
                        utmMedium: req.body.utmMedium || null,
                        utmCampaign: req.body.utmCampaign || null,
                        companyId: req.body.companyId,
                        status: "NEW",
                    }
                });
            }
        }
        res.status(201).json({ success: true, id: deal.id });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.patch("/api/deals/:id", async (req, res) => {
    try {
        const deal = await database_1.prisma.deal.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                updatedAt: new Date(),
            },
        });
        res.json({ success: true, deal });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.delete("/api/deals/:id", async (req, res) => {
    try {
        await database_1.prisma.deal.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/deals/:id/activities", async (req, res) => {
    try {
        const { type, content, userId } = req.body;
        const activity = await database_1.prisma.cRMActivity.create({
            data: {
                dealId: req.params.id,
                type,
                content,
                userId: userId || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
        res.status(201).json({ success: true, activity });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/deals/:id/activities", async (req, res) => {
    try {
        const activities = await database_1.prisma.cRMActivity.findMany({
            where: { dealId: req.params.id },
            orderBy: { createdAt: "desc" },
            include: { user: { select: { name: true, image: true } } },
        });
        res.json(activities);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.patch("/api/deals/:id/stage", async (req, res) => {
    try {
        const { stage, userId } = req.body;
        const deal = await database_1.prisma.deal.findUnique({ where: { id: req.params.id } });
        if (!deal)
            return res.status(404).json({ error: "Deal not found" });
        const updated = await database_1.prisma.deal.update({
            where: { id: req.params.id },
            data: { stage, lastActivity: new Date(), updatedAt: new Date() },
        });
        if (deal.stage !== stage) {
            await database_1.prisma.dealStageHistory.create({
                data: {
                    dealId: deal.id,
                    fromStage: deal.stage,
                    toStage: stage,
                    changedBy: userId || undefined,
                }
            }).catch(() => { });
        }
        await eventBus.publish("deal.stage_changed", {
            dealId: deal.id,
            companyId: deal.companyId,
            fromStage: deal.stage,
            toStage: stage,
        });
        if (stage === "WON") {
            await eventBus.publish("deal.won", { dealId: deal.id, value: deal.value, companyId: deal.companyId });
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 1);
            await database_1.prisma.task.create({
                data: {
                    title: `[Automatizado] Iniciar Onboarding para Deal: ${deal.title}`,
                    description: `Reunir requisitos iniciales y enviar contrato/factura. Valor Ganado: $${deal.value}.`,
                    completed: false,
                    priority: deal.value > 10000 ? "HIGH" : "MEDIUM",
                    dueDate: dueDate,
                    dealId: deal.id,
                    companyId: deal.companyId,
                    assignedTo: deal.assignedToUserId,
                    createdBy: userId || "SYSTEM",
                }
            });
            await database_1.prisma.cRMActivity.create({
                data: {
                    dealId: deal.id,
                    userId: userId || null,
                    type: "SYSTEM",
                    content: "El deal ha pasado a GANADO y se generó la tarea de Onboarding automáticamente.",
                    createdAt: new Date(),
                }
            }).catch((e) => console.error("Error creating system CRM activity:", e));
        }
        res.json({ deal: updated });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── CRM Dashboard & Performance Analytics ───────────────────────────────────────
app.get("/api/crm/stats", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const [pipelineValue, activeDeals, wonDeals, lostDeals] = await Promise.all([
            database_1.prisma.deal.aggregate({ _sum: { value: true }, where: { companyId: String(companyId), stage: { notIn: ["WON", "LOST"] } } }),
            database_1.prisma.deal.count({ where: { companyId: String(companyId), stage: { notIn: ["WON", "LOST"] } } }),
            database_1.prisma.deal.count({ where: { companyId: String(companyId), stage: "WON" } }),
            database_1.prisma.deal.count({ where: { companyId: String(companyId), stage: "LOST" } }),
        ]);
        const totalClosed = wonDeals + lostDeals;
        const winRate = totalClosed > 0 ? (wonDeals / totalClosed) * 100 : 0;
        const wonValue = await database_1.prisma.deal.aggregate({ _sum: { value: true }, where: { companyId: String(companyId), stage: "WON" } });
        const avgDealSize = wonDeals > 0 ? (wonValue._sum.value || 0) / wonDeals : 0;
        res.json({
            pipelineValue: pipelineValue._sum.value || 0,
            activeDeals,
            winRate: Math.round(winRate),
            avgDealSize: Math.round(avgDealSize),
        });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/crm/funnel/:companyId", async (req, res) => {
    try {
        const stages = await database_1.prisma.deal.groupBy({
            by: ["stage"],
            where: { companyId: req.params.companyId },
            _count: true,
            _sum: { value: true },
        });
        res.json({ funnel: stages });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/crm/recent-activity", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const [recentLeads, recentDeals] = await Promise.all([
            database_1.prisma.lead.findMany({
                where: { companyId: String(companyId) },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { id: true, name: true, status: true, createdAt: true }
            }),
            database_1.prisma.deal.findMany({
                where: { companyId: String(companyId) },
                orderBy: { updatedAt: "desc" },
                take: 5,
                select: { id: true, name: true, title: true, stage: true, updatedAt: true, value: true }
            }),
        ]);
        const activity = [
            ...recentLeads.map((l) => ({ id: l.id, type: "LEAD", title: `Nuevo lead: ${l.name}`, desc: `Estado: ${l.status}`, date: l.createdAt })),
            ...recentDeals.map((d) => ({ id: d.id, type: "DEAL", title: `Deal actualizado: ${d.title || d.name}`, desc: `Etapa: ${d.stage} - $${d.value}`, date: d.updatedAt })),
        ]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
        res.json(activity);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/crm/top-deals", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const deals = await database_1.prisma.deal.findMany({
            where: {
                companyId: String(companyId),
                stage: { notIn: ["WON", "LOST"] }
            },
            orderBy: { value: "desc" },
            take: 5,
            select: { id: true, name: true, title: true, value: true, stage: true, probability: true, expectedClose: true },
        });
        res.json(deals);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/crm/high-performance-stats", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const cid = String(companyId);
        const today = new Date();
        const thirtyDaysAgo = (0, date_fns_1.subDays)(today, 30);
        const lastMonthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subDays)(today, 30));
        const lastMonthEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subDays)(today, 30));
        const forecastMonths = [
            { start: (0, date_fns_1.startOfMonth)(today), end: (0, date_fns_1.endOfMonth)(today), name: (0, date_fns_1.format)(today, "MMM") },
            { start: (0, date_fns_1.startOfMonth)((0, date_fns_1.subDays)(today, -30)), end: (0, date_fns_1.endOfMonth)((0, date_fns_1.subDays)(today, -30)), name: (0, date_fns_1.format)((0, date_fns_1.subDays)(today, -30), "MMM") },
            { start: (0, date_fns_1.startOfMonth)((0, date_fns_1.subDays)(today, -60)), end: (0, date_fns_1.endOfMonth)((0, date_fns_1.subDays)(today, -60)), name: (0, date_fns_1.format)((0, date_fns_1.subDays)(today, -60), "MMM") },
        ];
        const forecastWindowStart = forecastMonths[0].start;
        const forecastWindowEnd = forecastMonths[forecastMonths.length - 1].end;
        const [wonDealsCount, lostDealsCount, wonDealsData, stagnantDealsCount, leadSources, lostReasons, currentPipeline, lastMonthPipeline, recentActivitiesCount, leaderboardRaw, allForecastDeals,] = await Promise.all([
            database_1.prisma.deal.count({ where: { companyId: cid, stage: "WON" } }),
            database_1.prisma.deal.count({ where: { companyId: cid, stage: "LOST" } }),
            database_1.prisma.deal.findMany({
                where: { companyId: cid, stage: "WON" },
                select: { createdAt: true, updatedAt: true, value: true },
            }),
            database_1.prisma.deal.count({
                where: { companyId: cid, stage: { notIn: ["WON", "LOST"] }, updatedAt: { lt: thirtyDaysAgo } },
            }),
            database_1.prisma.lead.groupBy({
                by: ["source"],
                where: { companyId: cid },
                _count: { source: true },
                orderBy: { _count: { source: "desc" } },
                take: 5,
            }),
            database_1.prisma.deal.groupBy({
                by: ["lostReason"],
                where: { companyId: cid, stage: "LOST", lostReason: { not: null } },
                _count: { lostReason: true },
                orderBy: { _count: { lostReason: "desc" } },
            }),
            database_1.prisma.deal.aggregate({
                _sum: { value: true },
                where: { companyId: cid, createdAt: { gte: (0, date_fns_1.startOfMonth)(today) } },
            }),
            database_1.prisma.deal.aggregate({
                _sum: { value: true },
                where: { companyId: cid, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
            }),
            database_1.prisma.cRMActivity.count({ where: { createdAt: { gte: (0, date_fns_1.subDays)(today, 7) } } }),
            database_1.prisma.deal.groupBy({
                by: ["assignedToUserId"],
                where: {
                    companyId: cid,
                    stage: "WON",
                    assignedToUserId: { not: null },
                },
                _sum: { value: true },
                orderBy: { _sum: { value: "desc" } },
                take: 5,
            }),
            database_1.prisma.deal.findMany({
                where: {
                    companyId: cid,
                    stage: { notIn: ["WON", "LOST"] },
                    expectedClose: { gte: forecastWindowStart, lte: forecastWindowEnd },
                },
                select: { value: true, probability: true, expectedClose: true },
            }),
        ]);
        const assignedUserIds = leaderboardRaw
            .map((r) => r.assignedToUserId)
            .filter((id) => !!id);
        const userNames = assignedUserIds.length > 0
            ? await database_1.prisma.user.findMany({
                where: { id: { in: assignedUserIds } },
                select: { id: true, name: true },
            })
            : [];
        const nameMap = new Map(userNames.map((u) => [u.id, u.name]));
        const rankedLeaderboard = leaderboardRaw.map((r) => ({
            name: nameMap.get(r.assignedToUserId) || r.assignedToUserId || "Sin asignar",
            wonValue: r._sum.value || 0,
        }));
        const forecastData = forecastMonths.map((month) => {
            const monthDeals = allForecastDeals.filter((d) => {
                const ec = d.expectedClose;
                return ec && ec >= month.start && ec <= month.end;
            });
            const weighted = monthDeals.reduce((acc, d) => acc + d.value * (d.probability / 100), 0);
            const total = monthDeals.reduce((acc, d) => acc + d.value, 0);
            return { name: month.name, weighted: Math.round(weighted), total: Math.round(total) };
        });
        const forecastValue = forecastData.reduce((acc, d) => acc + d.weighted, 0);
        const currentVal = currentPipeline._sum.value || 0;
        const lastVal = lastMonthPipeline._sum.value || 0;
        const momGrowth = lastVal === 0 ? 100 : ((currentVal - lastVal) / lastVal) * 100;
        const totalDays = wonDealsData.reduce((acc, deal) => {
            const diff = Math.abs(deal.updatedAt.getTime() - deal.createdAt.getTime());
            return acc + Math.ceil(diff / 86400000);
        }, 0);
        const avgDaysToClose = wonDealsData.length > 0 ? Math.round(totalDays / wonDealsData.length) : 0;
        const wonValue = wonDealsData.reduce((acc, deal) => acc + deal.value, 0);
        const monthlyTarget = parseInt(process.env.MONTHLY_SALES_TARGET ?? "50000", 10);
        const goalProgress = (wonValue / monthlyTarget) * 100;
        res.json({
            forecastValue: Math.round(forecastValue),
            forecastData,
            leadSources: leadSources.map((ls) => ({ name: ls.source, value: ls._count.source })),
            lostReasons: lostReasons.map((lr) => ({ reason: lr.lostReason || "Other", count: lr._count.lostReason })),
            stagnantDealsCount,
            momGrowth: Math.round(momGrowth),
            avgDaysToClose,
            wonValue: Math.round(wonValue),
            monthlyTarget,
            goalProgress: Math.min(100, Math.round(goalProgress)),
            activityIntensity: recentActivitiesCount,
            winRate: wonDealsCount + lostDealsCount > 0
                ? Math.round((wonDealsCount / (wonDealsCount + lostDealsCount)) * 100)
                : 0,
            leaderboard: rankedLeaderboard,
        });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Event Bus Setup & CQRS Worker ────────────────────────────────────────────
const eventBus = new events_1.EventBus(REDIS_URL, "crm-service");
const redisClient = new ioredis_1.default(REDIS_URL);
// CQRS Synchronizer: Listen to Write DB events and update Read DB (Redis)
eventBus.subscribe("lead.created", async (payload) => {
    const { leadId, companyId, data } = payload.data;
    if (leadId && companyId && data) {
        console.log(`[CQRS Worker] Synchronizing lead ${leadId} to Read DB (Redis)`);
        await redisClient.set(`cqrs:leads:${companyId}:${leadId}`, JSON.stringify(data));
    }
});
eventBus.subscribe("invoice.paid", async (payload) => {
    const { dealId } = payload.data;
    if (dealId) {
        console.log(`[crm-service] Invoice paid for deal ${dealId}`);
    }
});
// ── Message Relay Worker ─────────────────────────────────────────────────────
/**
 * Polls tbl_outbox_events for PENDING/FAILED events and publishes them to EventBus.
 * This decouples the HTTP request from the Redis publish, guaranteeing
 * at-least-once delivery even if Redis was down when the lead was created.
 */
const startMessageRelayWorker = () => {
    const INTERVAL_MS = 2000;
    const poll = async () => {
        try {
            const pendingEvents = await database_1.prisma.outboxEvent.findMany({
                where: {
                    status: { in: ["PENDING", "FAILED"] },
                    attempts: { lt: 3 },
                },
                orderBy: { createdAt: "asc" },
                take: 20,
            });
            for (const event of pendingEvents) {
                try {
                    const payloadData = event.payload;
                    await eventBus.publish(event.eventName, payloadData, event.correlationId);
                    await database_1.prisma.outboxEvent.update({
                        where: { id: event.id },
                        data: {
                            status: "PROCESSED",
                            processedAt: new Date(),
                            attempts: { increment: 1 },
                        },
                    });
                }
                catch (pubErr) {
                    console.error(`[MessageRelayWorker] Failed to publish outbox event ${event.id}:`, pubErr);
                    await database_1.prisma.outboxEvent.update({
                        where: { id: event.id },
                        data: {
                            attempts: { increment: 1 },
                            status: "FAILED",
                        },
                    });
                }
            }
        }
        catch (err) {
            console.error(`[MessageRelayWorker] Error checking outbox events:`, err);
        }
        finally {
            setTimeout(poll, INTERVAL_MS);
        }
    };
    setTimeout(poll, INTERVAL_MS);
    console.log("📨 Message Relay Worker started");
};
startMessageRelayWorker();
// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
    console.log(`📊 CRM Service running on port ${PORT}`);
});
process.on("SIGTERM", async () => {
    await eventBus.disconnect();
    await database_1.prisma.$disconnect();
    process.exit(0);
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.default = app;
//# sourceMappingURL=index.js.map