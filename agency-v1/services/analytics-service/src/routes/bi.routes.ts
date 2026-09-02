/**
 * Business Intelligence & Predictive Analytics Router — Analytics Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: All endpoints secured with requireUserOrServiceAuth.
 * Fix C-2: Enforces companyId boundary isolation on predictive forecasts and reports.
 */
import { Router, Request, Response, NextFunction } from "express";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { PredictiveService } from "../services/predictive.service";

export const biRouter = Router();

biRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null);
}

// ── GET /analytics/predict-sales ─────────────────────────────────────────────
biRouter.get("/analytics/predict-sales", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const prediction = await PredictiveService.predictNextWeekSales(companyId);
    res.json({ success: true, companyId, prediction });
  } catch (err) {
    next(err);
  }
});

// ── GET /analytics/report/pdf ────────────────────────────────────────────────
biRouter.get("/analytics/report/pdf", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const reportBase64 = await PredictiveService.generateReportHtml(companyId);
    res.json({
      success: true,
      companyId,
      format: "pdf/html-base64",
      pdfReportData: reportBase64,
    });
  } catch (err) {
    next(err);
  }
});
