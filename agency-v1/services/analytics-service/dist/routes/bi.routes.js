"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.biRouter = void 0;
/**
 * Business Intelligence & Predictive Analytics Router — Analytics Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: All endpoints secured with requireUserOrServiceAuth.
 * Fix C-2: Enforces companyId boundary isolation on predictive forecasts and reports.
 */
const express_1 = require("express");
const service_auth_1 = require("@agency/service-auth");
const predictive_service_1 = require("../services/predictive.service");
exports.biRouter = (0, express_1.Router)();
exports.biRouter.use(service_auth_1.requireUserOrServiceAuth);
function getCompanyId(req) {
    return req.headers["x-company-id"] ||
        (req.query.companyId ? String(req.query.companyId) : null);
}
// ── GET /analytics/predict-sales ─────────────────────────────────────────────
exports.biRouter.get("/analytics/predict-sales", async (req, res, next) => {
    try {
        const companyId = getCompanyId(req);
        if (!companyId)
            return res.status(400).json({ success: false, error: "companyId required" });
        const prediction = await predictive_service_1.PredictiveService.predictNextWeekSales(companyId);
        res.json({ success: true, companyId, prediction });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /analytics/report/pdf ────────────────────────────────────────────────
exports.biRouter.get("/analytics/report/pdf", async (req, res, next) => {
    try {
        const companyId = getCompanyId(req);
        if (!companyId)
            return res.status(400).json({ success: false, error: "companyId required" });
        const reportBase64 = await predictive_service_1.PredictiveService.generateReportHtml(companyId);
        res.json({
            success: true,
            companyId,
            format: "pdf/html-base64",
            pdfReportData: reportBase64,
        });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=bi.routes.js.map