import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service";

export class NotificationController {
  /**
   * GET /api/notifications
   */
  static async getUserNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String(req.headers["x-user-id"] || req.query.userId || "");
      if (!userId) {
        return res.status(400).json({ success: false, error: "userId is required" });
      }

      const notifications = await NotificationService.getUserNotifications(
        userId,
        req.query.unreadOnly === "true",
        req.query.limit ? parseInt(req.query.limit as string, 10) : 20
      );

      res.json({ success: true, notifications });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/notifications/dispatch
   */
  static async dispatchNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String(req.headers["x-user-id"] || req.body.userId || "");
      if (!userId) {
        return res.status(400).json({ success: false, error: "userId is required" });
      }

      const notification = await NotificationService.dispatchNotification({
        ...req.body,
        userId
      });

      res.status(201).json({ success: true, notification });
    } catch (err) {
      next(err);
    }
  }
}
