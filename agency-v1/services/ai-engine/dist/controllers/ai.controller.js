"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const ai_service_1 = require("../services/ai.service");
const refrag_service_1 = require("../services/refrag.service");
const hitl_workflow_service_1 = require("../services/hitl-workflow.service");
const guardrails_service_1 = require("../services/guardrails.service");
const agent_governance_service_1 = require("../services/agent-governance.service");
const reasoning_trace_service_1 = require("../services/reasoning-trace.service");
const feedback_service_1 = require("../services/feedback.service");
/** Safely extract a single string from req.headers (which may return string | string[]) */
function extractCompanyId(req) {
    const raw = req.headers["x-company-id"] || req.query.companyId || req.body?.companyId || "company-default";
    if (Array.isArray(raw))
        return String(raw[0]);
    return String(raw);
}
function extractUserId(req) {
    const raw = req.headers["x-user-id"] || req.body?.userId || "user-default";
    if (Array.isArray(raw))
        return String(raw[0]);
    return String(raw);
}
class AiController {
    // ─────────────────────────────────────────────────────────────────────────
    // Core Agent Execution
    // ─────────────────────────────────────────────────────────────────────────
    static async getAgents(req, res, next) {
        try {
            const companyId = extractCompanyId(req);
            const agents = await ai_service_1.AiService.getAgents(companyId);
            res.json({ success: true, agents });
        }
        catch (err) {
            next(err);
        }
    }
    static async runAgent(req, res, next) {
        try {
            const { agentId } = req.params;
            const companyId = extractCompanyId(req);
            const result = await ai_service_1.AiService.runAgent({
                agentId: String(agentId),
                companyId,
                userMessage: req.body.userMessage,
                conversationId: req.body.conversationId,
                leadId: req.body.leadId,
                enableRefrag: req.body.enableRefrag !== false
            });
            res.json(result);
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Governance & Configuration
    // ─────────────────────────────────────────────────────────────────────────
    /** GET /api/v1/agents/governance → list all configs for company */
    static async listGovernance(req, res, next) {
        try {
            const companyId = extractCompanyId(req);
            const configs = await agent_governance_service_1.AgentGovernanceService.listConfigs(companyId);
            res.json({ success: true, configs });
        }
        catch (err) {
            next(err);
        }
    }
    /** GET /api/v1/agents/:agentId/governance → get config for specific agent */
    static async getGovernance(req, res, next) {
        try {
            const companyId = extractCompanyId(req);
            const { agentId } = req.params;
            const config = await agent_governance_service_1.AgentGovernanceService.getConfig(companyId, String(agentId));
            res.json({ success: true, config });
        }
        catch (err) {
            next(err);
        }
    }
    /** PATCH /api/v1/agents/:agentId/governance → update governance config */
    static async updateGovernance(req, res, next) {
        try {
            const companyId = extractCompanyId(req);
            const { agentId } = req.params;
            const { autonomyMode, temperature, dailyTokenBudget, monthlyUsdBudget, hitlConfidenceThreshold, hitlHighValueQuoteUsd, allowedTools, systemPromptOverride, isActive } = req.body;
            // Validate ranges
            if (temperature !== undefined && (temperature < 0 || temperature > 1)) {
                return res.status(400).json({ success: false, error: "temperature must be between 0.0 and 1.0" });
            }
            if (autonomyMode && !["AUTONOMOUS", "SEMI_AUTONOMOUS", "SUPERVISED_ONLY"].includes(autonomyMode)) {
                return res.status(400).json({ success: false, error: "Invalid autonomyMode. Must be: AUTONOMOUS, SEMI_AUTONOMOUS, or SUPERVISED_ONLY" });
            }
            const config = await agent_governance_service_1.AgentGovernanceService.upsertConfig(companyId, String(agentId), {
                ...(autonomyMode !== undefined && { autonomyMode }),
                ...(temperature !== undefined && { temperature }),
                ...(dailyTokenBudget !== undefined && { dailyTokenBudget }),
                ...(monthlyUsdBudget !== undefined && { monthlyUsdBudget }),
                ...(hitlConfidenceThreshold !== undefined && { hitlConfidenceThreshold }),
                ...(hitlHighValueQuoteUsd !== undefined && { hitlHighValueQuoteUsd }),
                ...(allowedTools !== undefined && { allowedTools }),
                ...(systemPromptOverride !== undefined && { systemPromptOverride }),
                ...(isActive !== undefined && { isActive })
            });
            res.json({ success: true, config });
        }
        catch (err) {
            next(err);
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Reasoning Traces (Audit Logs)
    // ─────────────────────────────────────────────────────────────────────────
    /** GET /api/v1/agents/traces → paginated list of traces */
    static async listTraces(req, res, next) {
        try {
            const companyId = extractCompanyId(req);
            const limit = Math.min(parseInt(String(req.query.limit || "20")), 50);
            const offset = parseInt(String(req.query.offset || "0"));
            const traces = await reasoning_trace_service_1.ReasoningTraceService.listTraces(companyId, limit, offset);
            res.json({ success: true, count: traces.length, traces });
        }
        catch (err) {
            next(err);
        }
    }
    /** GET /api/v1/agents/traces/:traceId → single trace detail */
    static async getTrace(req, res, next) {
        try {
            const companyId = extractCompanyId(req);
            const traceId = String(req.params.traceId);
            const trace = await reasoning_trace_service_1.ReasoningTraceService.getTrace(companyId, traceId);
            if (!trace)
                return res.status(404).json({ success: false, error: "Trace no encontrado" });
            res.json({ success: true, trace });
        }
        catch (err) {
            next(err);
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Feedback (👍 / 👎 + Stars)
    // ─────────────────────────────────────────────────────────────────────────
    /** POST /api/v1/agents/:agentId/feedback */
    static async recordFeedback(req, res, next) {
        try {
            const companyId = extractCompanyId(req);
            const userId = extractUserId(req);
            const { agentId } = req.params;
            const { rating, stars, comment, conversationId, traceId } = req.body;
            if (!["THUMBS_UP", "THUMBS_DOWN"].includes(rating)) {
                return res.status(400).json({ success: false, error: "rating must be THUMBS_UP or THUMBS_DOWN" });
            }
            if (stars !== undefined && (stars < 1 || stars > 5)) {
                return res.status(400).json({ success: false, error: "stars must be between 1 and 5" });
            }
            const feedback = await feedback_service_1.FeedbackService.recordFeedback({
                agentId: String(agentId),
                companyId,
                conversationId: conversationId || "",
                traceId,
                rating,
                stars,
                comment,
                givenBy: userId
            });
            res.json({ success: true, feedback });
        }
        catch (err) {
            next(err);
        }
    }
    /** GET /api/v1/agents/:agentId/feedback/stats */
    static async getFeedbackStats(req, res, next) {
        try {
            const companyId = extractCompanyId(req);
            const { agentId } = req.params;
            const stats = await feedback_service_1.FeedbackService.getStats(companyId, String(agentId));
            res.json({ success: true, stats });
        }
        catch (err) {
            next(err);
        }
    }
    /** GET /api/v1/agents/feedback/recent */
    static async listRecentFeedback(req, res, next) {
        try {
            const companyId = extractCompanyId(req);
            const limit = parseInt(String(req.query.limit || "20"));
            const feedback = await feedback_service_1.FeedbackService.listRecentFeedback(companyId, limit);
            res.json({ success: true, count: feedback.length, feedback });
        }
        catch (err) {
            next(err);
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // ReFRAG, HITL, Guardrails (existing)
    // ─────────────────────────────────────────────────────────────────────────
    static async queryRefrag(req, res, next) {
        try {
            const companyId = extractCompanyId(req);
            const { query, topK, minScoreThreshold } = req.body;
            if (!query)
                return res.status(400).json({ success: false, error: "query is required" });
            const result = await refrag_service_1.RefragService.retrieveAndRerank(query, companyId, {
                topK: topK || 5, minScoreThreshold: minScoreThreshold || 0.35, enableReranking: true
            });
            res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getPendingHitl(req, res, next) {
        try {
            const companyId = extractCompanyId(req);
            const pendingItems = await hitl_workflow_service_1.HitlWorkflowService.getPendingReviews(companyId);
            res.json({ success: true, count: pendingItems.length, pendingItems });
        }
        catch (err) {
            next(err);
        }
    }
    static async processHitlDecision(req, res, next) {
        try {
            const companyId = extractCompanyId(req);
            const userId = extractUserId(req);
            const { hitlId, decision, modifiedResponse } = req.body;
            if (!hitlId || !["APPROVED", "REJECTED", "MODIFIED"].includes(decision)) {
                return res.status(400).json({ success: false, error: "hitlId y decision válida (APPROVED, REJECTED, MODIFIED) son requeridos" });
            }
            const updated = await hitl_workflow_service_1.HitlWorkflowService.processDecision(hitlId, companyId, decision, userId, modifiedResponse);
            res.json({ success: true, updated });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }
    static async checkGuardrails(req, res, next) {
        try {
            const { text } = req.body;
            if (!text)
                return res.status(400).json({ success: false, error: "text is required" });
            const check = guardrails_service_1.GuardrailsService.inspect(text);
            res.json({ success: true, check });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AiController = AiController;
//# sourceMappingURL=ai.controller.js.map