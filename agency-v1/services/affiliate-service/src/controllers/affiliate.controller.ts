import { Request, Response, NextFunction } from "express";
import { AffiliateService } from "../services/affiliate.service";

export class AffiliateController {
  /**
   * GET /api/affiliates/profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String(req.headers["x-user-id"] || req.query.userId || "");
      if (!userId) {
        return res.status(400).json({ success: false, error: "userId is required" });
      }

      const profile = await AffiliateService.getProfile(userId);
      res.json({ success: true, profile });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /r/:code
   */
  static async trackClick(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const result = await AffiliateService.trackClick(
        code,
        req.ip || req.headers["x-forwarded-for"] as string,
        req.headers["user-agent"]
      );

      res.redirect(result.targetUrl || "/");
    } catch (err) {
      next(err);
    }
  }
}
