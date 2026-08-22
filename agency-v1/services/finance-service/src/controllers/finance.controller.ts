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

  /**
   * GET /api/v1/billing/wallet
   */
  static async getWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const raw = req.headers["x-company-id"] || req.query.companyId || "company-default";
      const companyId = Array.isArray(raw) ? String(raw[0]) : String(raw);

      const { WalletService } = await import("../services/wallet.service");
      const wallet = await WalletService.getWalletBalance(companyId);

      res.json({ success: true, wallet });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/billing/wallet/recharge
   */
  static async rechargeWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const raw = req.headers["x-company-id"] || req.body.companyId || "company-default";
      const companyId = Array.isArray(raw) ? String(raw[0]) : String(raw);
      const amountUsd = Number(req.body.amountUsd || 50);

      const { WalletService } = await import("../services/wallet.service");
      const wallet = await WalletService.rechargeWallet(companyId, amountUsd);

      res.json({ success: true, wallet });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/billing/stripe/webhook
   */
  static async handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || req.body.companyId || "company-default");
      const event = req.body;
      if (!event || !event.type) {
        return res.status(400).json({ success: false, error: "Stripe event is required" });
      }

      const result = await FinanceService.handleStripeWebhookEvent(companyId, event);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/billing/cashflow/forecast
   */
  static async getCashFlowForecast(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "company-default");
      const forecast = await FinanceService.getCashFlowForecast(companyId);
      res.json({ success: true, ...forecast });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/billing/reconcile
   */
  static async reconcileTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || req.body.companyId || "company-default");
      const { transactions } = req.body;

      if (!transactions || !Array.isArray(transactions)) {
        return res.status(400).json({ success: false, error: "transactions array is required" });
      }

      const { ReconciliationService } = await import("../services/reconciliation.service");
      const matches = await ReconciliationService.reconcileTransactions(companyId, transactions);

      res.json({ success: true, matches });
    } catch (err) {
      next(err);
    }
  }
}
