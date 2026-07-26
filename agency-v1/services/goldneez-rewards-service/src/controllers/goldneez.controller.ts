import { Request, Response, NextFunction } from "express";
import { GoldneezService } from "../services/goldneez.service";

export class GoldneezController {
  /**
   * GET /api/rewards/points
   */
  static async getPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = String(req.headers["x-customer-id"] || req.query.customerId || "");
      if (!customerId) {
        return res.status(400).json({ success: false, error: "customerId is required" });
      }

      const points = await GoldneezService.getPoints(customerId);
      res.json({ success: true, customerId, points });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/rewards/redeem
   */
  static async redeemReward(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = String(req.headers["x-customer-id"] || req.body.customerId || "");
      const { rewardId, pointsCost } = req.body;

      if (!customerId || !rewardId || pointsCost === undefined) {
        return res.status(400).json({ success: false, error: "customerId, rewardId and pointsCost are required" });
      }

      const result = await GoldneezService.redeemReward(customerId, rewardId, Number(pointsCost));
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}
