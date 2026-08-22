"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsExtController = void 0;
const predictive_service_js_1 = require("../services/predictive.service.js");
class AnalyticsExtController {
    /**
     * GET /api/v1/analytics/predict-sales
     */
    static async predictSales(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "company-default");
            const prediction = await predictive_service_js_1.PredictiveService.predictNextWeekSales(companyId);
            res.json({ success: true, prediction });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/analytics/report/pdf
     */
    static async getPdfReport(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "company-default");
            const reportBase64 = await predictive_service_js_1.PredictiveService.generateReportHtml(companyId);
            res.json({ success: true, companyId, format: "pdf/html-base64", pdfReportData: reportBase64 });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AnalyticsExtController = AnalyticsExtController;
//# sourceMappingURL=analytics-ext.controller.js.map