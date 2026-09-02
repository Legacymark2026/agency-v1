/**
 * Governance, Reasoning Traces & HITL Router — AI Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: Protected with requireUserOrServiceAuth.
 * Handles token quotas, reasoning logs, safety guardrails and Human-in-the-Loop.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { AiController } from "../controllers/ai.controller";
import { ToolExecutorService } from "../services/tool-executor.service";
import { PresetGalleryService } from "../services/preset-gallery.service";
import { validateRequest } from "../middlewares/ai.middleware";

const governanceSchema = z.object({
  autonomyMode: z.enum(["AUTONOMOUS", "SEMI_AUTONOMOUS", "SUPERVISED_ONLY"]).optional(),
  temperature: z.number().min(0).max(1).optional(),
  dailyTokenBudget: z.number().int().positive().optional(),
  monthlyUsdBudget: z.number().positive().optional(),
  hitlConfidenceThreshold: z.number().min(0).max(1).optional(),
  hitlHighValueQuoteUsd: z.number().positive().optional(),
  allowedTools: z.array(z.string()).optional(),
  systemPromptOverride: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const governanceRouter = Router();

governanceRouter.use(requireUserOrServiceAuth);

// ── 🎛️ Governance & Configuration ──────────────────────────────────────────
governanceRouter.get("/agents/governance", AiController.listGovernance);
governanceRouter.get("/agents/:agentId/governance", AiController.getGovernance);
governanceRouter.patch("/agents/:agentId/governance", validateRequest(governanceSchema), AiController.updateGovernance);

// ── 📜 Reasoning Traces ─────────────────────────────────────────────────────
governanceRouter.get("/agents/traces", AiController.listTraces);
governanceRouter.get("/agents/traces/:traceId", AiController.getTrace);

// ── 📣 Feedback ─────────────────────────────────────────────────────────────
governanceRouter.post("/agents/:agentId/feedback", AiController.recordFeedback);
governanceRouter.get("/agents/:agentId/feedback/stats", AiController.getFeedbackStats);
governanceRouter.get("/agents/feedback/recent", AiController.listRecentFeedback);

// ── 👤 Human-in-the-Loop (HITL) ────────────────────────────────────────────
governanceRouter.get("/agents/hitl/pending", AiController.getPendingHitl);
governanceRouter.post("/agents/hitl/decision", AiController.processHitlDecision);

// ── 🛡️ Guardrails & Safety ─────────────────────────────────────────────────
governanceRouter.post("/agents/guardrails/check", AiController.checkGuardrails);

// ── 🏪 Marketplace & Metadata ──────────────────────────────────────────────
governanceRouter.get("/agents/tools", (_req: Request, res: Response) => {
  res.json({ success: true, tools: ToolExecutorService.getAvailableTools() });
});

governanceRouter.get("/agents/presets", (_req: Request, res: Response) => {
  res.json({
    success: true,
    presets: PresetGalleryService.getPresets(),
    categories: PresetGalleryService.getCategories(),
  });
});
