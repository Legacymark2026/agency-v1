import { Request, Response, NextFunction } from "express";
import { AiService } from "../services/ai.service";

export class AiController {
  /**
   * GET /api/agents
   */
  static async getAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const agents = await AiService.getAgents(companyId);
      res.json({ success: true, agents });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/agents/:agentId/run
   */
  static async runAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { agentId } = req.params;
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const result = await AiService.runAgent({
        agentId: String(agentId),
        companyId,
        userMessage: req.body.userMessage,
        conversationId: req.body.conversationId
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
