"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const tool_executor_service_1 = require("../services/tool-executor.service");
const preset_gallery_service_1 = require("../services/preset-gallery.service");
const agent_memory_service_1 = require("../services/agent-memory.service");
const memory_vector_service_1 = require("../services/memory-vector.service");
const ai_middleware_1 = require("../middlewares/ai.middleware");
const guardrails_middleware_1 = require("../middlewares/guardrails.middleware");
const zod_1 = require("zod");
// ── Schemas ─────────────────────────────────────────────────────────────────
const runAgentSchema = zod_1.z.object({
    userMessage: zod_1.z.string().min(1, "User message is required"),
    conversationId: zod_1.z.string().optional(),
    companyId: zod_1.z.string().optional(),
    leadId: zod_1.z.string().optional(),
    enableRefrag: zod_1.z.boolean().optional()
});
const governanceSchema = zod_1.z.object({
    autonomyMode: zod_1.z.enum(["AUTONOMOUS", "SEMI_AUTONOMOUS", "SUPERVISED_ONLY"]).optional(),
    temperature: zod_1.z.number().min(0).max(1).optional(),
    dailyTokenBudget: zod_1.z.number().int().positive().optional(),
    monthlyUsdBudget: zod_1.z.number().positive().optional(),
    hitlConfidenceThreshold: zod_1.z.number().min(0).max(1).optional(),
    hitlHighValueQuoteUsd: zod_1.z.number().positive().optional(),
    allowedTools: zod_1.z.array(zod_1.z.string()).optional(),
    systemPromptOverride: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional()
});
exports.aiRouter = (0, express_1.Router)();
// ── 🤖 Core Agent ──────────────────────────────────────────────────────────
exports.aiRouter.get("/agents", ai_controller_1.AiController.getAgents);
exports.aiRouter.post("/agents/:agentId/run", guardrails_middleware_1.guardrailsMiddleware, (0, ai_middleware_1.validateRequest)(runAgentSchema), ai_controller_1.AiController.runAgent);
// ── 🎛️ Governance & Configuration ──────────────────────────────────────────
exports.aiRouter.get("/agents/governance", ai_controller_1.AiController.listGovernance);
exports.aiRouter.get("/agents/:agentId/governance", ai_controller_1.AiController.getGovernance);
exports.aiRouter.patch("/agents/:agentId/governance", (0, ai_middleware_1.validateRequest)(governanceSchema), ai_controller_1.AiController.updateGovernance);
// ── 📜 Reasoning Traces (Audit Logs) ────────────────────────────────────────
exports.aiRouter.get("/agents/traces", ai_controller_1.AiController.listTraces);
exports.aiRouter.get("/agents/traces/:traceId", ai_controller_1.AiController.getTrace);
// ── 📣 Feedback (👍 / 👎 + Stars) ──────────────────────────────────────────
exports.aiRouter.post("/agents/:agentId/feedback", ai_controller_1.AiController.recordFeedback);
exports.aiRouter.get("/agents/:agentId/feedback/stats", ai_controller_1.AiController.getFeedbackStats);
exports.aiRouter.get("/agents/feedback/recent", ai_controller_1.AiController.listRecentFeedback);
// ── 🔍 ReFRAG ───────────────────────────────────────────────────────────────
exports.aiRouter.post("/agents/refrag/query", ai_controller_1.AiController.queryRefrag);
// ── 👤 Human-in-the-Loop (HITL) ────────────────────────────────────────────
exports.aiRouter.get("/agents/hitl/pending", ai_controller_1.AiController.getPendingHitl);
exports.aiRouter.post("/agents/hitl/decision", ai_controller_1.AiController.processHitlDecision);
// ── 🛡️ Guardrails & Safety ─────────────────────────────────────────────────
exports.aiRouter.post("/agents/guardrails/check", ai_controller_1.AiController.checkGuardrails);
// ── 🏪 Marketplace & Hub Metadata ──────────────────────────────────────────
exports.aiRouter.get("/agents/tools", (_req, res) => {
    res.json({ success: true, tools: tool_executor_service_1.ToolExecutorService.getAvailableTools() });
});
exports.aiRouter.get("/agents/presets", (_req, res) => {
    res.json({
        success: true,
        presets: preset_gallery_service_1.PresetGalleryService.getPresets(),
        categories: preset_gallery_service_1.PresetGalleryService.getCategories()
    });
});
exports.aiRouter.get("/agents/memory/:conversationId", async (req, res, next) => {
    try {
        const limit = parseInt(String(req.query.limit || "20"), 10);
        const history = await agent_memory_service_1.AgentMemoryService.getConversationContext(req.params.conversationId, limit);
        res.json({ success: true, conversationId: req.params.conversationId, memoryCount: history.length, history });
    }
    catch (err) {
        next(err);
    }
});
exports.aiRouter.delete("/agents/memory/:conversationId", async (req, res, next) => {
    try {
        await agent_memory_service_1.AgentMemoryService.clearMemory(req.params.conversationId);
        res.json({ success: true, message: `Memoria de conversación ${req.params.conversationId} limpiada.` });
    }
    catch (err) {
        next(err);
    }
});
// ── 🧠 Vector Memory Search & Storage (PgVector Integration) ─────────────────
exports.aiRouter.post("/agents/:agentId/vector-memory", async (req, res, next) => {
    try {
        const { content, metadata } = req.body;
        if (!content)
            return res.status(400).json({ error: "content is required" });
        await memory_vector_service_1.MemoryVectorService.saveMemoryWithVector(req.params.agentId, content, metadata || {});
        res.json({ success: true, message: "Memory saved to vector store." });
    }
    catch (err) {
        next(err);
    }
});
exports.aiRouter.get("/agents/:agentId/vector-memory/search", async (req, res, next) => {
    try {
        const query = String(req.query.q || "");
        const limit = parseInt(String(req.query.limit || "5"), 10);
        if (!query)
            return res.status(400).json({ error: "search query 'q' parameter is required" });
        const matches = await memory_vector_service_1.MemoryVectorService.searchMemory(req.params.agentId, query, limit);
        res.json({ success: true, query, matches });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=ai.routes.js.map