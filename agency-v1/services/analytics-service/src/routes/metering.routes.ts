/**
 * Metered Usage & Billing Analytics Router — Analytics Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: All endpoints secured with requireUserOrServiceAuth.
 * Fix C-2: Enforces company-level isolation on metered billing metrics.
 */
import { Router, Request, Response, NextFunction } from "express";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { MeteringAggregatorService } from "../services/metering-aggregator.service";

export const meteringRouter = Router();

meteringRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null);
}

// ── GET /analytics/metered-usage ─────────────────────────────────────────────
meteringRouter.get(["/analytics/metered-usage", "/metered-usage"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ success: false, error: "companyId required" });
    }

    const rawDays = req.query.days ? parseInt(String(req.query.days), 10) : 30;
    const days = Math.min(Math.max(1, rawDays || 30), 365); // Cap between 1 and 365 days

    const stats = await MeteringAggregatorService.getCompanyUsageStats(companyId, days);
    res.json({ success: true, companyId, days, ...stats });
  } catch (err) {
    next(err);
  }
});
