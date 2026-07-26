import { Request, Response, NextFunction } from "express";
import { MarketingService } from "../services/marketing.service";

export class MarketingController {
  /**
   * GET /api/email-blast
   */
  static async getEmailBlasts(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const blasts = await MarketingService.getEmailBlasts(companyId);
      res.json({ success: true, blasts });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/email-blast
   */
  static async createEmailBlast(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const blast = await MarketingService.createEmailBlast({
        ...req.body,
        companyId
      });

      res.status(201).json({ success: true, blast });
    } catch (err) {
      next(err);
    }
  }
}
