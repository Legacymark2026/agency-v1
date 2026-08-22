"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceController = void 0;
const finance_service_1 = require("../services/finance.service");
class FinanceController {
    /**
     * GET /api/invoices
     */
    static async getInvoices(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const invoices = await finance_service_1.FinanceService.getInvoices(companyId, req.query.status);
            res.json({ success: true, invoices });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/invoices
     */
    static async createInvoice(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const invoice = await finance_service_1.FinanceService.createInvoice({
                ...req.body,
                companyId
            });
            res.status(201).json({ success: true, invoice });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/billing/wallet
     */
    static async getWallet(req, res, next) {
        try {
            const raw = req.headers["x-company-id"] || req.query.companyId || "company-default";
            const companyId = Array.isArray(raw) ? String(raw[0]) : String(raw);
            const { WalletService } = await Promise.resolve().then(() => __importStar(require("../services/wallet.service")));
            const wallet = await WalletService.getWalletBalance(companyId);
            res.json({ success: true, wallet });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/billing/wallet/recharge
     */
    static async rechargeWallet(req, res, next) {
        try {
            const raw = req.headers["x-company-id"] || req.body.companyId || "company-default";
            const companyId = Array.isArray(raw) ? String(raw[0]) : String(raw);
            const amountUsd = Number(req.body.amountUsd || 50);
            const { WalletService } = await Promise.resolve().then(() => __importStar(require("../services/wallet.service")));
            const wallet = await WalletService.rechargeWallet(companyId, amountUsd);
            res.json({ success: true, wallet });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/billing/stripe/webhook
     */
    static async handleStripeWebhook(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || req.body.companyId || "company-default");
            const event = req.body;
            if (!event || !event.type) {
                return res.status(400).json({ success: false, error: "Stripe event is required" });
            }
            const result = await finance_service_1.FinanceService.handleStripeWebhookEvent(companyId, event);
            res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/billing/cashflow/forecast
     */
    static async getCashFlowForecast(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "company-default");
            const forecast = await finance_service_1.FinanceService.getCashFlowForecast(companyId);
            res.json({ success: true, ...forecast });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/billing/reconcile
     */
    static async reconcileTransactions(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || req.body.companyId || "company-default");
            const { transactions } = req.body;
            if (!transactions || !Array.isArray(transactions)) {
                return res.status(400).json({ success: false, error: "transactions array is required" });
            }
            const { ReconciliationService } = await Promise.resolve().then(() => __importStar(require("../services/reconciliation.service")));
            const matches = await ReconciliationService.reconcileTransactions(companyId, transactions);
            res.json({ success: true, matches });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.FinanceController = FinanceController;
//# sourceMappingURL=finance.controller.js.map