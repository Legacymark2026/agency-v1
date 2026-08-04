import { Request, Response, NextFunction } from "express";
import { AiService } from "../services/ai.service";
import { RefragService } from "../services/refrag.service";
import { HitlWorkflowService } from "../services/hitl-workflow.service";
import { GuardrailsService } from "../services/guardrails.service";

export class AiController {
  /**
   * GET /api/v1/agents
   */
  static async getAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "company-default");
      const agents = await AiService.getAgents(companyId);
      res.json({ success: true, agents });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/agents/:agentId/run
   */
  static async runAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { agentId } = req.params;
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "company-default");

      const result = await AiService.runAgent({
        agentId: String(agentId),
        companyId,
        userMessage: req.body.userMessage,
        conversationId: req.body.conversationId,
        leadId: req.body.leadId,
        enableRefrag: req.body.enableRefrag !== false
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/v1/agents/refrag/query
   */
  static async queryRefrag(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "company-default");
      const { query, topK, minScoreThreshold } = req.body;
      if (!query) return res.status(400).json({ success: false, error: "query is required" });

      const result = await RefragService.retrieveAndRerank(query, companyId, {
        topK: topK || 5,
        minScoreThreshold: minScoreThreshold || 0.35,
        enableReranking: true
      });

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/agents/hitl/pending
   */
  static async getPendingHitl(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "company-default");
      const pendingItems = await HitlWorkflowService.getPendingReviews(companyId);
      res.json({ success: true, count: pendingItems.length, pendingItems });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/agents/hitl/decision
   */
  static async processHitlDecision(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "company-default");
      const userId = String(req.headers["x-user-id"] || req.body.userId || "user-supervisor");
      const { hitlId, decision, modifiedResponse } = req.body;

      if (!hitlId || !['APPROVED', 'REJECTED', 'MODIFIED'].includes(decision)) {
        return res.status(400).json({ success: false, error: "hitlId and valid decision (APPROVED, REJECTED, MODIFIED) are required" });
      }

      const updated = await HitlWorkflowService.processDecision(hitlId, companyId, decision, userId, modifiedResponse);
      res.json({ success: true, updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/v1/agents/guardrails/check
   */
  static async checkGuardrails(req: Request, res: Response, next: NextFunction) {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ success: false, error: "text parameter is required" });

      const check = GuardrailsService.inspect(text);
      res.json({ success: true, check });
    } catch (err) {
      next(err);
    }
  }
}
