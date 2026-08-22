"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeRouter = void 0;
const express_1 = require("express");
const finance_controller_1 = require("../controllers/finance.controller");
const finance_middleware_1 = require("../middlewares/finance.middleware");
const zod_1 = require("zod");
const createInvoiceSchema = zod_1.z.object({
    clientName: zod_1.z.string().min(1, "Client name is required"),
    subtotalAmount: zod_1.z.number().positive("Subtotal must be positive"),
    totalAmount: zod_1.z.number().positive("Total must be positive"),
    notes: zod_1.z.string().optional(),
});
exports.financeRouter = (0, express_1.Router)();
exports.financeRouter.get("/invoices", finance_controller_1.FinanceController.getInvoices);
exports.financeRouter.post("/invoices", (0, finance_middleware_1.validateRequest)(createInvoiceSchema), finance_controller_1.FinanceController.createInvoice);
exports.financeRouter.get("/billing/wallet", finance_controller_1.FinanceController.getWallet);
exports.financeRouter.post("/billing/wallet/recharge", finance_controller_1.FinanceController.rechargeWallet);
exports.financeRouter.post("/billing/stripe/webhook", finance_controller_1.FinanceController.handleStripeWebhook);
exports.financeRouter.get("/billing/cashflow/forecast", finance_controller_1.FinanceController.getCashFlowForecast);
exports.financeRouter.post("/billing/reconcile", finance_controller_1.FinanceController.reconcileTransactions);
//# sourceMappingURL=finance.routes.js.map