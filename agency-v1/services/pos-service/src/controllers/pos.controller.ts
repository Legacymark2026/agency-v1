import { Request, Response, NextFunction } from "express";
import { PosService } from "../services/pos.service";

export class PosController {
  /**
   * GET /api/pos/sessions
   */
  static async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const sessions = await PosService.getSessions(companyId);
      res.json({ success: true, sessions });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/pos/sessions/open
   */
  static async openSession(req: Request, res: Response, next: NextFunction) {
    try {
      const cashierId = String(req.headers["x-user-id"] || req.body.cashierId || "");
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");

      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const session = await PosService.openSession({
        ...req.body,
        companyId,
        cashierId
      });

      res.status(201).json({ success: true, session });
    } catch (err) {
      next(err);
    }
  }
}
