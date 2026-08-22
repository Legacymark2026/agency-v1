import { Request, Response, NextFunction } from "express";
import { AgentTeamService } from "../services/agent-team.service";

export class AgentTeamController {
  /**
   * GET /api/agent/teams
   */
  static async getTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const rawCompanyId = req.headers["x-company-id"] || req.query.companyId || "";
      const companyId = typeof rawCompanyId === "string" ? rawCompanyId : (Array.isArray(rawCompanyId) ? String(rawCompanyId[0]) : String(rawCompanyId));
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const teams = await AgentTeamService.getTeams(companyId);
      res.json({ success: true, teams });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/agent/teams/:teamId/run
   */
  static async runTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { teamId } = req.params;
      const rawCompanyId = req.headers["x-company-id"] || req.query.companyId || req.body.companyId || "";
      const companyId = typeof rawCompanyId === "string" ? rawCompanyId : (Array.isArray(rawCompanyId) ? String(rawCompanyId[0]) : String(rawCompanyId));

      const userMessage = String(req.body.userMessage || "");

      if (!userMessage) {
        return res.status(400).json({ success: false, error: "userMessage is required" });
      }

      const result = await AgentTeamService.runCollaborativeTeam(String(teamId), String(companyId), String(userMessage));
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}
