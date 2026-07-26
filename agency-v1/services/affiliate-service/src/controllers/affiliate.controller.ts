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
      const codeStr = Array.isArray(req.params.code) ? req.params.code[0] : String(req.params.code || "");
      const rawIp = req.headers["x-forwarded-for"] || req.ip;
      const ipAddress: string = Array.isArray(rawIp) ? rawIp[0] : String(rawIp || "127.0.0.1");
      const rawUa = req.headers["user-agent"];
      const userAgent: string | undefined = rawUa ? (Array.isArray(rawUa) ? rawUa[0] : String(rawUa)) : undefined;

      const result = await AffiliateService.trackClick(
        codeStr,
        ipAddress,
        userAgent
      );

      res.redirect(result.targetUrl || "/");
    } catch (err) {
      next(err);
    }
  }
}
