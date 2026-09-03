/**
 * Accounting Router — Hexagonal Driving Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * REST endpoints for Colombian double-entry journal vouchers, reversal,
 * trial balances, and cryptographic audit trail verification.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { AccountingCommandService } from "../core/accounting/commands";
import { AccountingQueryService } from "../core/accounting/queries";
import { prisma } from "@agency/database";

const createVoucherSchema = z.object({
  companyId: z.string().min(1),
  documentType: z.enum(["INGRESO", "EGRESO", "FACTURA_VENTA", "FACTURA_COMPRA", "NOMINA", "NOTA_CONTABLE", "ANULACION"]).default("NOTA_CONTABLE"),
  date: z.string().min(10), // YYYY-MM-DD
  concept: z.string().min(3),
  costCenterCode: z.string().optional(),
  sourceInvoiceId: z.string().optional(),
  sourceExpenseId: z.string().optional(),
  lines: z.array(
    z.object({
      accountCode: z.string().min(4),
      accountName: z.string().min(2),
      thirdPartyNit: z.string().optional(),
      thirdPartyName: z.string().optional(),
      debit: z.number().min(0).default(0),
      credit: z.number().min(0).default(0),
      description: z.string().optional(),
      costCenterCode: z.string().optional(),
    })
  ).min(2),
});

export const accountingRouter = Router();

// POST /api/accounting/vouchers - Asentar comprobante contable
accountingRouter.post("/vouchers", async (req: Request, res: Response) => {
  try {
    const parsed = createVoucherSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.errors });
    }

    const voucher = await AccountingCommandService.createJournalVoucher(parsed.data);
    res.status(201).json({ success: true, voucher });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/accounting/vouchers/:id/reverse - Anulación por contrapartida (sin borrado físico)
accountingRouter.post("/vouchers/:id/reverse", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, error: "El motivo de anulación es obligatorio." });
    }

    const result = await AccountingCommandService.reverseJournalVoucher(id, reason);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/accounting/trial-balance - Balance de Comprobación
accountingRouter.get("/trial-balance", async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    if (!companyId) {
      return res.status(400).json({ success: false, error: "companyId es requerido" });
    }

    const report = await AccountingQueryService.getTrialBalance(
      companyId,
      req.query.startDate as string,
      req.query.endDate as string
    );
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/accounting/audit/integrity - Verificación de cadena de custodia criptográfica
accountingRouter.get("/audit/integrity", async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    if (!companyId) {
      return res.status(400).json({ success: false, error: "companyId es requerido" });
    }

    const audit = await AccountingQueryService.verifyLedgerIntegrityChain(companyId);
    res.json(audit);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/accounting/vouchers - Historial de comprobantes
accountingRouter.get("/vouchers", async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    if (!companyId) {
      return res.status(400).json({ success: false, error: "companyId es requerido" });
    }

    const vouchers = await (prisma as any).accountingVoucher.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: { lines: true },
      take: 100,
    });

    res.json({ success: true, count: vouchers.length, vouchers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
