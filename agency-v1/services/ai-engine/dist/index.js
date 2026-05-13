"use strict";
/**
 * AI Engine — Agent Intelligence Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: AI Agents, ReFRAG, Knowledge Bases, Agent Teams, Memory, Embeddings
 * Port: 4004
 *
 * GPU-INTENSIVE SERVICE — Different scaling profile than other services
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
const agent_runner_1 = require("./agent-runner");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4004", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
// ── Health Checks ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "ai-engine", timestamp: new Date().toISOString() });
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
// ── Agent Invocation ─────────────────────────────────────────────────────────
app.post("/api/agents/:agentId/run", async (req, res) => {
    try {
        const { companyId, userMessage, conversationId, contactData, inlineHistory, senderUserId, userContext } = req.body;
        const { agentId } = req.params;
        const result = await (0, agent_runner_1.runAIAgent)({ agentId, companyId, userMessage, conversationId, senderUserId, contactData, inlineHistory, userContext });
        res.json(result);
    }
    catch (err) {
        console.error("[ai-engine] Agent run error:", err);
        res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
});
// POST /api/agents/triage — Auto-route to best agent (Swarm)
app.post("/api/agents/triage", async (req, res) => {
    try {
        const { companyId, userMessage, conversationId, contactData, inlineHistory, userContext } = req.body;
        const result = await (0, agent_runner_1.triageAndRouteMessage)(companyId, userMessage, conversationId, contactData, inlineHistory, userContext);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Agent Configuration ──────────────────────────────────────────────────────
app.get("/api/agents", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const agents = await database_1.prisma.aIAgent.findMany({
            where: { companyId: String(companyId) },
            include: { _count: { select: { conversations: true } } },
        });
        res.json({ agents });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Agent Teams ──────────────────────────────────────────────────────────────
app.post("/api/agents/teams/:teamId/run", async (req, res) => {
    try {
        const { companyId, userMessage } = req.body;
        const team = await database_1.prisma.agentTeam.findUnique({
            where: { id: req.params.teamId },
            include: { members: { include: { agent: true } } },
        });
        if (!team || team.companyId !== companyId) {
            return res.status(404).json({ error: "Team not found" });
        }
        // TODO: Implement full agent-team-engine.ts orchestration
        res.json({
            teamName: team.name,
            strategy: team.strategy,
            membersInvoked: team.members.length,
            result: `[AI Engine] Team "${team.name}" received task with ${team.members.length} members`,
        });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Knowledge Base Management ────────────────────────────────────────────────
app.get("/api/knowledge-bases", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const kbs = await database_1.prisma.knowledgeBase.findMany({
            where: { companyId: String(companyId), isActive: true },
            select: { id: true, name: true, sourceType: true, isActive: true, createdAt: true },
        });
        res.json({ knowledgeBases: kbs });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Event Bus ────────────────────────────────────────────────────────────────
const eventBus = new events_1.EventBus(REDIS_URL, "ai-engine");
// Listen for messages that need AI processing
eventBus.subscribe("message.received", async (payload) => {
    console.log(`[ai-engine] Processing incoming message: ${payload.data.messageId}`);
});
eventBus.subscribe("workflow.ai_step", async (payload) => {
    console.log(`[ai-engine] Workflow AI step requested: ${payload.data.stepId}`);
});
// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🧠 AI Engine running on port ${PORT}`);
});
process.on("SIGTERM", async () => {
    await eventBus.disconnect();
    await (0, agent_runner_1.disconnectRedis)();
    await database_1.prisma.$disconnect();
    process.exit(0);
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.default = app;
//# sourceMappingURL=index.js.map