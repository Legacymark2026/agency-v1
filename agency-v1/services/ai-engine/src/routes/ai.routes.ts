import { Router } from "express";
import { AiController } from "../controllers/ai.controller";
import { ToolExecutorService } from "../services/tool-executor.service";
import { PresetGalleryService } from "../services/preset-gallery.service";
import { AgentMemoryService } from "../services/agent-memory.service";
import { MemoryVectorService } from "../services/memory-vector.service";
import { validateRequest } from "../middlewares/ai.middleware";
import { guardrailsMiddleware } from "../middlewares/guardrails.middleware";
import { z } from "zod";

// ── Schemas ─────────────────────────────────────────────────────────────────
const runAgentSchema = z.object({
  userMessage: z.string().min(1, "User message is required"),
  conversationId: z.string().optional(),
  companyId: z.string().optional(),
  leadId: z.string().optional(),
  enableRefrag: z.boolean().optional()
});

const governanceSchema = z.object({
  autonomyMode: z.enum(["AUTONOMOUS", "SEMI_AUTONOMOUS", "SUPERVISED_ONLY"]).optional(),
  temperature: z.number().min(0).max(1).optional(),
  dailyTokenBudget: z.number().int().positive().optional(),
  monthlyUsdBudget: z.number().positive().optional(),
  hitlConfidenceThreshold: z.number().min(0).max(1).optional(),
  hitlHighValueQuoteUsd: z.number().positive().optional(),
  allowedTools: z.array(z.string()).optional(),
  systemPromptOverride: z.string().optional(),
  isActive: z.boolean().optional()
});

export const aiRouter = Router();

// ── 🤖 Core Agent ──────────────────────────────────────────────────────────
aiRouter.get("/agents", AiController.getAgents);
aiRouter.post("/agents/:agentId/run",
  guardrailsMiddleware,
  validateRequest(runAgentSchema),
  AiController.runAgent
);

// ── 🎛️ Governance & Configuration ──────────────────────────────────────────
aiRouter.get("/agents/governance", AiController.listGovernance);
aiRouter.get("/agents/:agentId/governance", AiController.getGovernance);
aiRouter.patch("/agents/:agentId/governance", validateRequest(governanceSchema), AiController.updateGovernance);

// ── 📜 Reasoning Traces (Audit Logs) ────────────────────────────────────────
aiRouter.get("/agents/traces", AiController.listTraces);
aiRouter.get("/agents/traces/:traceId", AiController.getTrace);

// ── 📣 Feedback (👍 / 👎 + Stars) ──────────────────────────────────────────
aiRouter.post("/agents/:agentId/feedback", AiController.recordFeedback);
aiRouter.get("/agents/:agentId/feedback/stats", AiController.getFeedbackStats);
aiRouter.get("/agents/feedback/recent", AiController.listRecentFeedback);

// ── 🔍 ReFRAG ───────────────────────────────────────────────────────────────
aiRouter.post("/agents/refrag/query", AiController.queryRefrag);

// ── 👤 Human-in-the-Loop (HITL) ────────────────────────────────────────────
aiRouter.get("/agents/hitl/pending", AiController.getPendingHitl);
aiRouter.post("/agents/hitl/decision", AiController.processHitlDecision);

// ── 🛡️ Guardrails & Safety ─────────────────────────────────────────────────
aiRouter.post("/agents/guardrails/check", AiController.checkGuardrails);

// ── 🏪 Marketplace & Hub Metadata ──────────────────────────────────────────
aiRouter.get("/agents/tools", (_req, res) => {
  res.json({ success: true, tools: ToolExecutorService.getAvailableTools() });
});

aiRouter.get("/agents/presets", (_req, res) => {
  res.json({
    success: true,
    presets: PresetGalleryService.getPresets(),
    categories: PresetGalleryService.getCategories()
  });
});

aiRouter.get("/agents/memory/:conversationId", async (req, res, next) => {
  try {
    const limit = parseInt(String(req.query.limit || "20"), 10);
    const history = await AgentMemoryService.getConversationContext(req.params.conversationId, limit);
    res.json({ success: true, conversationId: req.params.conversationId, memoryCount: history.length, history });
  } catch (err) { next(err); }
});

aiRouter.delete("/agents/memory/:conversationId", async (req, res, next) => {
  try {
    await AgentMemoryService.clearMemory(req.params.conversationId);
    res.json({ success: true, message: `Memoria de conversación ${req.params.conversationId} limpiada.` });
  } catch (err) { next(err); }
});

// ── 🧠 Vector Memory Search & Storage (PgVector Integration) ─────────────────
aiRouter.post("/agents/:agentId/vector-memory", async (req, res, next) => {
  try {
    const { content, metadata } = req.body;
    if (!content) return res.status(400).json({ error: "content is required" });
    await MemoryVectorService.saveMemoryWithVector(req.params.agentId, content, metadata || {});
    res.json({ success: true, message: "Memory saved to vector store." });
  } catch (err) { next(err); }
});

aiRouter.get("/agents/:agentId/vector-memory/search", async (req, res, next) => {
  try {
    const query = String(req.query.q || "");
    const limit = parseInt(String(req.query.limit || "5"), 10);
    if (!query) return res.status(400).json({ error: "search query 'q' parameter is required" });
    const matches = await MemoryVectorService.searchMemory(req.params.agentId, query, limit);
    res.json({ success: true, query, matches });
  } catch (err) { next(err); }
});
