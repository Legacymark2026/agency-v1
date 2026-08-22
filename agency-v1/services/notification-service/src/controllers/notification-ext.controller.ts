import { Request, Response, NextFunction } from "express";
import { PriorityQueueService } from "../services/priority-queue.service.js";

export class NotificationExtController {
  /**
   * POST /api/v1/notifications/enqueue
   */
  static async enqueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { payload, priority } = req.body;
      if (!payload) {
        return res.status(400).json({ success: false, error: "payload is required" });
      }

      const result = await PriorityQueueService.enqueueNotification(payload, priority);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
