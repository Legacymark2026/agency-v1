import { Request, Response, NextFunction } from "express";
import { PredictiveService } from "../services/predictive.service.js";

export class AnalyticsExtController {
  /**
   * GET /api/v1/analytics/predict-sales
   */
  static async predictSales(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "company-default");
      const prediction = await PredictiveService.predictNextWeekSales(companyId);
      res.json({ success: true, prediction });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/analytics/report/pdf
   */
  static async getPdfReport(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = String(req.headers["x-company-id"] || req.query.companyId || "company-default");
      const reportBase64 = await PredictiveService.generateReportHtml(companyId);
      res.json({ success: true, companyId, format: "pdf/html-base64", pdfReportData: reportBase64 });
    } catch (err) {
      next(err);
    }
  }
}
