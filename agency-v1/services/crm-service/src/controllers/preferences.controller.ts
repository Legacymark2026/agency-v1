import { Request, Response, NextFunction } from "express";
import { PreferencesService } from "../services/preferences.service.js";

export class PreferencesController {
  /**
   * POST /api/v1/leads/unsubscribe
   */
  static async unsubscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, channel } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "email is required" });
      }

      const targetChannel = channel || "ALL";
      const result = await PreferencesService.unsubscribeLead(String(email), targetChannel);

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
