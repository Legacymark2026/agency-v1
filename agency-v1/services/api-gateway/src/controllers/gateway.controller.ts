import { Request, Response, NextFunction } from "express";
import { GatewayService } from "../services/gateway.service";

export class GatewayController {
  /**
   * POST /api/gateway/verify-token
   */
  static async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ valid: false, error: "Token required" });
      }
      const result = await GatewayService.verifyToken(token);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/gateway/services
   */
  static listServices(_req: Request, res: Response) {
    const services = ["auth", "crm", "project", "ai-engine", "finance", "agent-team", "notification", "analytics"];
    res.json({ success: true, services });
  }
}
