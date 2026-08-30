/**
 * Payroll Router
 * Fix A-1: extracted from index.ts God Object
 * Fix C-2: protected by requireUserOrServiceAuth
 * Fix M-2: pagination support added
 */
import { Router, Request, Response } from "express";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { logger } from "../utils/logger.utils";

const MAX_PAGE_LIMIT = 100;

export const payrollRouter = Router();

payrollRouter.use(requireUserOrServiceAuth);

// ── GET /payroll ───────────────────────────────────────────────────────────────
payrollRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId =
      (req.headers["x-company-id"] as string | undefined) ||
      (req.query.companyId ? String(req.query.companyId) : undefined);

    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const { page = "1", limit = "20" } = req.query;
    const safeLimit = Math.min(parseInt(String(limit), 10) || 20, MAX_PAGE_LIMIT);
    const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where: { companyId },
        orderBy: { periodEnd: "desc" },
        include: { employee: true },
        take: safeLimit,
        skip,
      }),
      prisma.payroll.count({ where: { companyId } }),
    ]);

    res.json({ success: true, payrolls, total, page: safePage, limit: safeLimit });
  } catch (err) {
    logger.error("[payroll] GET / failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
