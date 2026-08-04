import { Router } from "express";
import { AiController } from "../controllers/ai.controller";
import { ToolExecutorService } from "../services/tool-executor.service";
import { PresetGalleryService } from "../services/preset-gallery.service";
import { AgentMemoryService } from "../services/agent-memory.service";
import { validateRequest } from "../middlewares/ai.middleware";
import { guardrailsMiddleware } from "../middlewares/guardrails.middleware";
import { z } from "zod";

const runAgentSchema = z.object({
  userMessage: z.string().min(1, "User message is required"),
  conversationId: z.string().optional(),
  companyId: z.string().optional(),
  leadId: z.string().optional(),
  enableRefrag: z.boolean().optional()
});

export const aiRouter = Router();

// ── 🤖 Core Agent Endpoints ────────────────────────────────────────────────
aiRouter.get("/agents", AiController.getAgents);
aiRouter.post("/agents/:agentId/run", guardrailsMiddleware, validateRequest(runAgentSchema), AiController.runAgent);

// ── 🔍 ReFRAG (Recursive RAG & Re-ranking) ─────────────────────────────────
aiRouter.post("/agents/refrag/query", AiController.queryRefrag);

// ── 👤 Human-in-the-Loop (HITL Queue & Approval Decisions) ─────────────────
aiRouter.get("/agents/hitl/pending", AiController.getPendingHitl);
aiRouter.post("/agents/hitl/decision", AiController.processHitlDecision);

// ── 🛡️ Guardrails & Safety Auditing ────────────────────────────────────────
aiRouter.post("/agents/guardrails/check", AiController.checkGuardrails);

// ── 🛠️ Hub Metadata & Marketplace Presets ──────────────────────────────────
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
    const { conversationId } = req.params;
    const limit = parseInt(String(req.query.limit || '20'), 10);
    const history = await AgentMemoryService.getConversationContext(conversationId, limit);
    res.json({ success: true, conversationId, memoryCount: history.length, history });
  } catch (err) { next(err); }
});

aiRouter.delete("/agents/memory/:conversationId", async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    await AgentMemoryService.clearMemory(conversationId);
    res.json({ success: true, message: `Memoria de conversación ${conversationId} limpiada.` });
  } catch (err) { next(err); }
});
