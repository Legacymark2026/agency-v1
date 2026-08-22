import { Request, Response, NextFunction } from "express";
import { PosService } from "../services/pos.service.js";
import { OfflineSyncService } from "../services/offline-sync.service.js";

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

  /**
   * POST /api/v1/pos/sync-offline
   */
  static async syncOffline(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || req.body.companyId || "company-default");
      const { transactions } = req.body;
      if (!transactions || !Array.isArray(transactions)) {
        return res.status(400).json({ success: false, error: "transactions array is required" });
      }

      const result = await OfflineSyncService.syncOfflineTransactions(companyId, transactions);

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/pos/tickets/:id/qr
   */
  static async getTicketQr(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = String(req.params.id);
      const qrDataUrl = await PosService.renderTicketQr(orderId);
      res.json({ success: true, orderId, qrDataUrl });
    } catch (err) {
      next(err);
    }
  }
}
