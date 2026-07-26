import { Request, Response, NextFunction } from "express";
import { AgentTeamService } from "../services/agent-team.service";

export class AgentTeamController {
  /**
   * GET /api/agent/teams
   */
  static async getTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const teams = await AgentTeamService.getTeams(companyId);
      res.json({ success: true, teams });
    } catch (err) {
      next(err);
    }
  }
}
