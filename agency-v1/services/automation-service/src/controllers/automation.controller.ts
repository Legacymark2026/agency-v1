import { Request, Response, NextFunction } from "express";
import { AutomationService } from "../services/automation.service";

export class AutomationController {
  /**
   * GET /api/workflows
   */
  static async getWorkflows(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const workflows = await AutomationService.getWorkflows(companyId);
      res.json({ success: true, workflows });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/workflows
   */
  static async createWorkflow(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const workflow = await AutomationService.createWorkflow({
        ...req.body,
        companyId
      });

      res.status(201).json({ success: true, workflow });
    } catch (err) {
      next(err);
    }
  }
}
