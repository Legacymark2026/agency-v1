import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service";

export class AnalyticsController {
  /**
   * GET /api/analytics/activity
   */
  static async getUserActivityLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String(req.headers["x-user-id"] || req.query.userId || "");
      if (!userId) {
        return res.status(400).json({ success: false, error: "userId is required" });
      }

      const logs = await AnalyticsService.getUserActivityLogs(
        userId,
        req.query.limit ? parseInt(req.query.limit as string, 10) : 50
      );

      res.json({ success: true, logs });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/track
   */
  static async trackActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await AnalyticsService.trackActivity({
        ...req.body,
        ipAddress: req.ip || req.headers["x-forwarded-for"] as string || "127.0.0.1",
        userAgent: req.headers["user-agent"]
      });

      res.status(201).json({ success: true, log });
    } catch (err) {
      next(err);
    }
  }
}
