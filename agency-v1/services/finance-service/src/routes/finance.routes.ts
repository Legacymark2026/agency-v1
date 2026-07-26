import { Router } from "express";
import { FinanceController } from "../controllers/finance.controller";
import { validateRequest } from "../middlewares/finance.middleware";
import { z } from "zod";

const createInvoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  subtotalAmount: z.number().positive("Subtotal must be positive"),
  totalAmount: z.number().positive("Total must be positive"),
  notes: z.string().optional(),
});

export const financeRouter = Router();

financeRouter.get("/invoices", FinanceController.getInvoices);
financeRouter.post("/invoices", validateRequest(createInvoiceSchema), FinanceController.createInvoice);
