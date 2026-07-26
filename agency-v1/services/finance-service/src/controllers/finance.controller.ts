import { Request, Response, NextFunction } from "express";
import { FinanceService } from "../services/finance.service";

export class FinanceController {
  /**
   * GET /api/invoices
   */
  static async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const invoices = await FinanceService.getInvoices(companyId, req.query.status as string);
      res.json({ success: true, invoices });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/invoices
   */
  static async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
      if (!companyId) {
        return res.status(400).json({ success: false, error: "companyId is required" });
      }

      const invoice = await FinanceService.createInvoice({
        ...req.body,
        companyId
      });

      res.status(201).json({ success: true, invoice });
    } catch (err) {
      next(err);
    }
  }
}
