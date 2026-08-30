/**
 * Invoices Router
 * Fix A-1: extracts all /api/invoices/* handlers from index.ts God Object
 * Fix A-2: unifies duplicate routes (/api/v1/invoices + /api/invoices)
 * Fix A-3: validates invoice state before DELETE (DIAN compliance)
 * Fix A-4: requires payment metadata when marking PAID
 * Fix C-2: all routes protected by requireUserOrServiceAuth
 * Fix M-1: proper pagination with MAX_PAGE_LIMIT
 * Fix M-2: complete Zod validation
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { eventBus } from "../lib/event-bus.singleton";
import { logger } from "../utils/logger.utils";

const MAX_PAGE_LIMIT = 100;

// ── Validation Schemas ────────────────────────────────────────────────────────
const createInvoiceSchema = z.object({
  companyId: z.string().min(1).optional(),
  clientName: z.string().min(1, "Client name is required"),
  clientNit: z.string().optional(),
  clientAddress: z.string().optional(),
  clientCity: z.string().optional(),
  clientPhone: z.string().optional(),
  subtotalAmount: z.number().positive("Subtotal must be positive"),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  totalAmount: z.number().positive("Total must be positive"),
  advanceAmount: z.number().min(0).default(0),
  finalAmount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional().or(z.string().optional()),
  notes: z.string().optional(),
  terms: z.string().optional(),
  leadId: z.string().optional(),
  dealId: z.string().optional(),
  isElectronic: z.boolean().default(true),
  currency: z.string().default("COP"),
  items: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    taxRate: z.number().min(0).default(0.19),
    totalAmount: z.number().positive(),
  })).optional(),
});

const markPaidSchema = z.object({
  paidAmount: z.number().positive("paidAmount is required"),
  paymentMethod: z.enum(["STRIPE", "WOMPI", "PAYPAL", "MERCADOPAGO", "TRANSFER", "CASH", "CHECK", "OTHER"]),
  transactionId: z.string().min(1, "transactionId is required"),
  paidAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const patchInvoiceSchema = z.object({
  status: z.string().optional(),
  paymentUrl: z.string().url().optional().or(z.literal("")),
  stripeInvoiceId: z.string().optional(),
}).strict();

/** Allowed DIAN-compliant statuses for DELETE */
const DELETABLE_STATUSES = new Set(["DRAFT_AWAITING_PAYMENT", "CANCELLED"]);

/** Statuses that require nota crédito instead of delete */
const NON_DELETABLE_STATUSES = new Set(["PAID", "SUBMITTED_TO_DIAN", "VALIDATED_BY_DIAN"]);

export const invoicesRouter = Router();

invoicesRouter.use(requireUserOrServiceAuth);

// ── GET /invoices ──────────────────────────────────────────────────────────────
invoicesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId =
      (req.headers["x-company-id"] as string | undefined) ||
      (req.query.companyId ? String(req.query.companyId) : undefined);

    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const { status, page = "1", limit = "20" } = req.query;
    const safeLimit = Math.min(parseInt(String(limit), 10) || 20, MAX_PAGE_LIMIT);
    const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: Record<string, unknown> = { companyId };
    if (status) where.status = String(status);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { items: true },
        take: safeLimit,
        skip,
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ success: true, invoices, total, page: safePage, limit: safeLimit });
  } catch (err) {
    logger.error("[invoices] GET / failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── GET /invoices/stats ────────────────────────────────────────────────────────
// NOTE: must be declared BEFORE /:id to avoid route conflict
invoicesRouter.get("/stats", async (req: Request, res: Response) => {
  try {
    const companyId =
      (req.headers["x-company-id"] as string | undefined) ||
      (req.query.companyId ? String(req.query.companyId) : undefined);

    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const invoices = await prisma.invoice.findMany({
      where: { companyId },
      select: { totalAmount: true, status: true, dueDate: true },
    });

    const now = new Date();
    let billed = 0, outstanding = 0, overdue = 0, paidCount = 0;

    for (const inv of invoices) {
      if (inv.status === "PAID") {
        billed += Number(inv.totalAmount);
        paidCount++;
      } else if (inv.status !== "CANCELLED") {
        outstanding += Number(inv.totalAmount);
        if (inv.dueDate && new Date(inv.dueDate) < now) {
          overdue += Number(inv.totalAmount);
        }
      }
    }

    const successRate = invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0;

    res.json({ success: true, data: { billed, outstanding, overdue, successRate, total: invoices.length } });
  } catch (err) {
    logger.error("[invoices] GET /stats failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── GET /invoices/:id ──────────────────────────────────────────────────────────
invoicesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: String(req.params.id) },
      include: { items: true },
    });
    if (!invoice) return res.status(404).json({ success: false, error: "Invoice not found" });
    res.json({ success: true, invoice });
  } catch (err) {
    logger.error("[invoices] GET /:id failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /invoices ─────────────────────────────────────────────────────────────
invoicesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId =
      (req.headers["x-company-id"] as string | undefined) || req.body.companyId;
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createInvoiceSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice payload",
        details: parsed.error.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
      });
    }

    const data = parsed.data;
    const invoiceNumber = `FAC-${Date.now().toString().slice(-8)}`;

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          companyId,
          clientName: data.clientName,
          clientNit: data.clientNit,
          clientAddress: data.clientAddress,
          clientCity: data.clientCity,
          clientPhone: data.clientPhone,
          subtotalAmount: data.subtotalAmount,
          taxAmount: data.taxAmount,
          discountAmount: data.discountAmount,
          totalAmount: data.totalAmount,
          advanceAmount: data.advanceAmount,
          finalAmount: data.finalAmount ?? data.totalAmount,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          notes: data.notes,
          terms: data.terms,
          leadId: data.leadId,
          dealId: data.dealId,
          isElectronic: data.isElectronic,
          currency: data.currency,
          status: "DRAFT_AWAITING_PAYMENT",
          items: {
            create: (data.items || []).map((item) => ({
              title: item.title,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              totalAmount: item.totalAmount,
            })),
          },
        },
        include: { items: true },
      });

      await eventBus.publish("invoice.created", {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        companyId,
        totalAmount: Number(inv.totalAmount),
        currency: data.currency,
        timestamp: new Date().toISOString(),
      });

      return inv;
    });

    res.status(201).json({ success: true, invoice });
  } catch (err) {
    logger.error("[invoices] POST / failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── PATCH /invoices/:id ────────────────────────────────────────────────────────
invoicesRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = patchInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid patch payload",
        details: parsed.error.errors,
      });
    }
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(parsed.data.paymentUrl !== undefined && { paymentUrl: parsed.data.paymentUrl }),
        ...(parsed.data.stripeInvoiceId !== undefined && { stripeInvoiceId: parsed.data.stripeInvoiceId }),
      },
    });
    res.json({ success: true, invoice });
  } catch (err) {
    logger.error("[invoices] PATCH /:id failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── PATCH /invoices/:id/pay — Fix A-4: require payment metadata ────────────────
invoicesRouter.patch("/:id/pay", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    // A-4 Fix: validate real payment metadata before marking PAID
    const parsed = markPaidSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Payment metadata required to mark invoice as PAID",
        details: parsed.error.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
        hint: "Provide: paidAmount, paymentMethod, transactionId",
      });
    }

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: "Invoice not found" });
    if (existing.status === "PAID") {
      return res.status(409).json({ success: false, error: "Invoice already marked as PAID" });
    }
    if (existing.status === "CANCELLED") {
      return res.status(409).json({ success: false, error: "Cannot pay a CANCELLED invoice" });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: "PAID",
        paymentMethod: parsed.data.paymentMethod,
        paidAmount: parsed.data.paidAmount,
        paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : new Date(),
        notes: parsed.data.notes
          ? `${existing.notes || ""}\n[PAID] ${parsed.data.notes}`
          : existing.notes,
      },
    });

    await eventBus.publish("invoice.paid", {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      companyId: invoice.companyId,
      dealId: invoice.dealId ?? undefined,
      amount: Number(invoice.totalAmount),
      paidAmount: parsed.data.paidAmount,
      paymentMethod: parsed.data.paymentMethod,
      transactionId: parsed.data.transactionId,
      gateway: parsed.data.paymentMethod,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, invoice });
  } catch (err) {
    logger.error("[invoices] PATCH /:id/pay failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── DELETE /invoices/:id — Fix A-3: DIAN compliance check ─────────────────────
invoicesRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice) return res.status(404).json({ success: false, error: "Invoice not found" });

    // A-3 Fix: DIAN Decreto 2242/2015 — facturas pagadas o enviadas a DIAN
    // no pueden eliminarse, deben anularse con nota crédito
    if (NON_DELETABLE_STATUSES.has(invoice.status)) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete invoice with status "${invoice.status}"`,
        reason: "Colombian tax regulation (Decreto 2242/2015) requires a Credit Note (Nota Crédito) instead of deletion for paid or DIAN-submitted invoices.",
        requiredAction: "POST /api/invoices/:id/credit-note",
        currentStatus: invoice.status,
      });
    }

    if (!DELETABLE_STATUSES.has(invoice.status)) {
      return res.status(409).json({
        success: false,
        error: `Invoice in status "${invoice.status}" cannot be deleted`,
        deletableStatuses: [...DELETABLE_STATUSES],
      });
    }

    await prisma.invoice.delete({ where: { id } });

    await eventBus.publish("invoice.cancelled" as any, {
      invoiceId: id,
      companyId: invoice.companyId,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (err) {
    logger.error("[invoices] DELETE /:id failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
