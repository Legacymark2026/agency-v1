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
      const action = req.body.action || req.body.eventType || req.body.eventName || "TRACK";
      const details = req.body.details || req.body.metadata || req.body;
      const log = await AnalyticsService.trackActivity({
        userId: req.body.userId || null,
        action,
        details,
        ipAddress: req.ip || (req.headers["x-forwarded-for"] as string) || "127.0.0.1",
        userAgent: req.headers["user-agent"]
      });

      res.status(201).json({ success: true, eventId: log.id, log });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/heartbeat
   */
  static async heartbeat(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await AnalyticsService.trackActivity({
        action: "SESSION_HEARTBEAT",
        details: req.body || {},
        ipAddress: req.ip || (req.headers["x-forwarded-for"] as string) || "127.0.0.1",
        userAgent: req.headers["user-agent"]
      });
      res.status(200).json({ success: true, eventId: log.id });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/end-session
   */
  static async endSession(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await AnalyticsService.trackActivity({
        action: "SESSION_END",
        details: req.body || {},
        ipAddress: req.ip || (req.headers["x-forwarded-for"] as string) || "127.0.0.1",
        userAgent: req.headers["user-agent"]
      });
      res.status(200).json({ success: true, eventId: log.id });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/analytics/metered-usage
   */
  static async getMeteredUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const raw = req.headers["x-company-id"] || req.query.companyId || "company-default";
      const companyId = Array.isArray(raw) ? String(raw[0]) : String(raw);
      const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;

      const { MeteringAggregatorService } = await import("../services/metering-aggregator.service");
      const stats = await MeteringAggregatorService.getCompanyUsageStats(companyId, days);

      res.json({ success: true, ...stats });
    } catch (err) {
      next(err);
    }
  }
}
