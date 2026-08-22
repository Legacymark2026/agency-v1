import { Request, Response, NextFunction } from "express";
export declare class FinanceController {
    /**
     * GET /api/invoices
     */
    static getInvoices(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/invoices
     */
    static createInvoice(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/v1/billing/wallet
     */
    static getWallet(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/billing/wallet/recharge
     */
    static rechargeWallet(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/billing/stripe/webhook
     */
    static handleStripeWebhook(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/v1/billing/cashflow/forecast
     */
    static getCashFlowForecast(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/billing/reconcile
     */
    static reconcileTransactions(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
