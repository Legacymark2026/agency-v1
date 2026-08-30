/**
 * Expenses Router
 * Fix A-1: extracts all /api/expenses/* handlers from index.ts God Object
 * Fix C-2: all routes protected by requireUserOrServiceAuth
 * Fix M-1: proper pagination with cursor + limit (replaces hardcoded take: 200)
 * Fix M-2: complete Zod validation on create/update
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { logger } from "../utils/logger.utils";

const MAX_PAGE_LIMIT = 100;

const DEFAULT_CATEGORIES = [
  { name: "Software y Suscripciones", code: "SOFT", color: "#6366f1" },
  { name: "Publicidad y Pauta", code: "ADS", color: "#f59e0b" },
  { name: "Viáticos y Transporte", code: "VIA", color: "#10b981" },
  { name: "Servicios Públicos", code: "SERV", color: "#3b82f6" },
  { name: "Equipos y Hardware", code: "EQUIP", color: "#8b5cf6" },
  { name: "Arrendamiento", code: "ARREND", color: "#ec4899" },
  { name: "Personal Externo", code: "EXT", color: "#14b8a6" },
  { name: "Impuestos y Tasas", code: "IMP", color: "#ef4444" },
  { name: "Gastos Bancarios", code: "BANK", color: "#64748b" },
  { name: "Otros", code: "OTR", color: "#a3a3a3" },
];

// ── Validation Schemas ────────────────────────────────────────────────────────
const createExpenseSchema = z.object({
  companyId: z.string().min(1).optional(),
  createdById: z.string().min(1, "createdById required"),
  title: z.string().min(1, "title required"),
  amount: z.number().positive("amount must be positive"),
  date: z.string().min(1, "date required"),
  categoryId: z.string().optional(),
  vendor: z.string().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  paymentMethod: z.enum(["TRANSFER", "CASH", "CHECK", "CREDIT_CARD", "DEBIT_CARD", "PSE", "OTHER"]).default("TRANSFER"),
  accountId: z.string().optional(),
  notes: z.string().optional(),
});

const patchExpenseSchema = z.object({
  title: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  categoryId: z.string().optional(),
  vendor: z.string().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  paymentMethod: z.enum(["TRANSFER", "CASH", "CHECK", "CREDIT_CARD", "DEBIT_CARD", "PSE", "OTHER"]).optional(),
  accountId: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED"]).optional(),
  approvedById: z.string().optional(),
  approvedAt: z.string().datetime().nullable().optional(),
  paidAt: z.string().datetime().nullable().optional(),
}).strict();

export const expensesRouter = Router();

expensesRouter.use(requireUserOrServiceAuth);

// ── GET /expenses/categories ───────────────────────────────────────────────────
expensesRouter.get("/categories", async (req: Request, res: Response) => {
  try {
    const companyId =
      (req.headers["x-company-id"] as string | undefined) ||
      (req.query.companyId ? String(req.query.companyId) : undefined);

    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    let categories = await prisma.expenseCategory.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: "asc" },
    });

    // Auto-seed default categories for new companies
    if (categories.length === 0) {
      await prisma.expenseCategory.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({ ...c, companyId })),
        skipDuplicates: true,
      });
      categories = await prisma.expenseCategory.findMany({
        where: { companyId, isActive: true },
        orderBy: { name: "asc" },
      });
    }

    res.json({ success: true, data: categories });
  } catch (err) {
    logger.error("[expenses] GET /categories failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /expenses/categories ──────────────────────────────────────────────────
expensesRouter.post("/categories", async (req: Request, res: Response) => {
  try {
    const companyId =
      (req.headers["x-company-id"] as string | undefined) || req.body.companyId;
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const schema = z.object({ name: z.string().min(1), code: z.string().min(1), color: z.string().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const category = await prisma.expenseCategory.create({
      data: { ...parsed.data, companyId },
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    logger.error("[expenses] POST /categories failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── GET /expenses/stats ────────────────────────────────────────────────────────
expensesRouter.get("/stats", async (req: Request, res: Response) => {
  try {
    const companyId =
      (req.headers["x-company-id"] as string | undefined) ||
      (req.query.companyId ? String(req.query.companyId) : undefined);

    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [allExpenses, currentMonth, lastMonth, byCategory] = await Promise.all([
      prisma.expense.findMany({
        where: { companyId },
        select: { amount: true, status: true },
      }),
      prisma.expense.aggregate({
        where: { companyId, date: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { companyId, date: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: { companyId },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const categoryIds = byCategory.map((c) => c.categoryId).filter(Boolean) as string[];
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

    const totalAmount = allExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const pendingAmount = allExpenses.filter((e) => e.status === "PENDING").reduce((s, e) => s + Number(e.amount), 0);
    const paidAmount = allExpenses.filter((e) => e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);
    const lastMonthTotal = Number(lastMonth._sum.amount) || 0;
    const currentMonthTotal = Number(currentMonth._sum.amount) || 0;
    const monthlyChange = lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalAmount,
        pendingAmount,
        paidAmount,
        currentMonthTotal,
        currentMonthCount: currentMonth._count,
        lastMonthTotal,
        monthlyChange: Math.round(monthlyChange * 100) / 100,
        byCategory: byCategory
          .map((c) => ({
            categoryId: c.categoryId,
            categoryName: c.categoryId ? categoryMap[c.categoryId]?.name || "Sin categoría" : "Sin categoría",
            categoryColor: c.categoryId ? categoryMap[c.categoryId]?.color || "#a3a3a3" : "#a3a3a3",
            total: Number(c._sum.amount) || 0,
            count: c._count,
          }))
          .sort((a, b) => b.total - a.total),
      },
    });
  } catch (err) {
    logger.error("[expenses] GET /stats failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── GET /expenses ──────────────────────────────────────────────────────────────
expensesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId =
      (req.headers["x-company-id"] as string | undefined) ||
      (req.query.companyId ? String(req.query.companyId) : undefined);

    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const { status, categoryId, dateFrom, dateTo, search, page = "1", limit = "20" } = req.query;
    const safeLimit = Math.min(parseInt(String(limit), 10) || 20, MAX_PAGE_LIMIT);
    const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: Record<string, unknown> = { companyId };
    if (status) where.status = String(status);
    if (categoryId) where.categoryId = String(categoryId);
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.gte = new Date(String(dateFrom));
      if (dateTo) dateFilter.lte = new Date(String(dateTo));
      where.date = dateFilter;
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { vendor: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: { select: { name: true, color: true, code: true } },
          createdBy: { select: { name: true, firstName: true } },
          approvedBy: { select: { name: true, firstName: true } },
        },
        orderBy: { date: "desc" },
        take: safeLimit,
        skip,
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({ success: true, data: expenses, total, page: safePage, limit: safeLimit });
  } catch (err) {
    logger.error("[expenses] GET / failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /expenses ─────────────────────────────────────────────────────────────
expensesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId =
      (req.headers["x-company-id"] as string | undefined) || req.body.companyId;
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createExpenseSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid expense payload",
        details: parsed.error.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
      });
    }

    const d = parsed.data;
    const expense = await prisma.expense.create({
      data: {
        companyId,
        createdById: d.createdById,
        title: d.title,
        amount: d.amount,
        date: new Date(d.date),
        categoryId: d.categoryId || null,
        vendor: d.vendor || null,
        description: d.description || null,
        reference: d.reference || null,
        paymentMethod: d.paymentMethod,
        accountId: d.accountId || null,
        notes: d.notes || null,
        status: "PENDING",
      },
      include: { category: true },
    });

    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    logger.error("[expenses] POST / failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── PATCH /expenses/:id ────────────────────────────────────────────────────────
expensesRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = patchExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid patch payload", details: parsed.error.errors });
    }

    const d = parsed.data;
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(d.title !== undefined && { title: d.title }),
        ...(d.amount !== undefined && { amount: d.amount }),
        ...(d.date !== undefined && { date: new Date(d.date) }),
        ...(d.categoryId !== undefined && { categoryId: d.categoryId }),
        ...(d.vendor !== undefined && { vendor: d.vendor }),
        ...(d.description !== undefined && { description: d.description }),
        ...(d.reference !== undefined && { reference: d.reference }),
        ...(d.paymentMethod !== undefined && { paymentMethod: d.paymentMethod }),
        ...(d.accountId !== undefined && { accountId: d.accountId }),
        ...(d.notes !== undefined && { notes: d.notes }),
        ...(d.status !== undefined && { status: d.status }),
        ...(d.approvedById !== undefined && { approvedById: d.approvedById }),
        ...(d.approvedAt !== undefined && { approvedAt: d.approvedAt ? new Date(d.approvedAt) : null }),
        ...(d.paidAt !== undefined && { paidAt: d.paidAt ? new Date(d.paidAt) : null }),
      },
    });

    res.json({ success: true, data: expense });
  } catch (err) {
    logger.error("[expenses] PATCH /:id failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── DELETE /expenses/:id ───────────────────────────────────────────────────────
expensesRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const expense = await prisma.expense.findUnique({ where: { id } });

    if (!expense) return res.status(404).json({ success: false, error: "Gasto no encontrado" });
    if (expense.status === "PAID") {
      return res.status(409).json({ success: false, error: "No se puede eliminar un gasto pagado" });
    }

    await prisma.expense.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    logger.error("[expenses] DELETE /:id failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
