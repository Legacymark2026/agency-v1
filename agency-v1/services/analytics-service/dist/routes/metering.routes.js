"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meteringRouter = void 0;
/**
 * Metered Usage & Billing Analytics Router — Analytics Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: All endpoints secured with requireUserOrServiceAuth.
 * Fix C-2: Enforces company-level isolation on metered billing metrics.
 */
const express_1 = require("express");
const service_auth_1 = require("@agency/service-auth");
const metering_aggregator_service_1 = require("../services/metering-aggregator.service");
exports.meteringRouter = (0, express_1.Router)();
exports.meteringRouter.use(service_auth_1.requireUserOrServiceAuth);
function getCompanyId(req) {
    return req.headers["x-company-id"] ||
        (req.query.companyId ? String(req.query.companyId) : null);
}
// ── GET /analytics/metered-usage ─────────────────────────────────────────────
exports.meteringRouter.get(["/analytics/metered-usage", "/metered-usage"], async (req, res, next) => {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) {
            return res.status(400).json({ success: false, error: "companyId required" });
        }
        const rawDays = req.query.days ? parseInt(String(req.query.days), 10) : 30;
        const days = Math.min(Math.max(1, rawDays || 30), 365); // Cap between 1 and 365 days
        const stats = await metering_aggregator_service_1.MeteringAggregatorService.getCompanyUsageStats(companyId, days);
        res.json({ success: true, companyId, days, ...stats });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=metering.routes.js.map