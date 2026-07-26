import { Request, Response, NextFunction } from "express";
import { IntegrationService } from "../services/integration.service";

export class IntegrationController {
  /**
   * GET /api/integrations
   */
  static async getIntegrations(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const integrations = await IntegrationService.getIntegrations(companyId);
      res.json({ success: true, integrations });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/integrations
   */
  static async connectIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const integration = await IntegrationService.connectIntegration({
        ...req.body,
        companyId
      });

      res.status(201).json({ success: true, integration });
    } catch (err) {
      next(err);
    }
  }
}
