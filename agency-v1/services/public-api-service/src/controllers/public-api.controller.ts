import { Request, Response, NextFunction } from "express";
import { PublicApiService } from "../services/public-api.service";

export class PublicApiController {
  /**
   * GET /api/v1/status
   */
  static async getStatus(_req: Request, res: Response, next: NextFunction) {
    try {
      const status = await PublicApiService.getPublicStatus();
      res.json({ success: true, ...status });
    } catch (err) {
      next(err);
    }
  }
}
