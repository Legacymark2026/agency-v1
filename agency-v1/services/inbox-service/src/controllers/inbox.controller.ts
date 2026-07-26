import { Request, Response, NextFunction } from "express";
import { InboxService } from "../services/inbox.service";

export class InboxController {
  /**
   * GET /api/conversations
   */
  static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const result = await InboxService.getConversations(
        companyId,
        req.query.status as string,
        req.query.page ? parseInt(req.query.page as string, 10) : 1,
        req.query.limit ? parseInt(req.query.limit as string, 10) : 20
      );

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/messages
   */
  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const senderId = String(req.headers["x-user-id"] || req.body.senderId || "system");
      const message = await InboxService.sendMessage({
        ...req.body,
        senderId
      });

      res.status(201).json({ success: true, message });
    } catch (err) {
      next(err);
    }
  }
}
