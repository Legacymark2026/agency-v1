"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("../services/analytics.service");
class AnalyticsController {
    /**
     * GET /api/analytics/activity
     */
    static async getUserActivityLogs(req, res, next) {
        try {
            const userId = String(req.headers["x-user-id"] || req.query.userId || "");
            if (!userId) {
                return res.status(400).json({ success: false, error: "userId is required" });
            }
            const logs = await analytics_service_1.AnalyticsService.getUserActivityLogs(userId, req.query.limit ? parseInt(req.query.limit, 10) : 50);
            res.json({ success: true, logs });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/track
     */
    static async trackActivity(req, res, next) {
        try {
            const action = req.body.action || req.body.eventType || req.body.eventName || "TRACK";
            const details = req.body.details || req.body.metadata || req.body;
            const log = await analytics_service_1.AnalyticsService.trackActivity({
                userId: req.body.userId || null,
                action,
                details,
                ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
                userAgent: req.headers["user-agent"]
            });
            res.status(201).json({ success: true, eventId: log.id, log });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/heartbeat
     */
    static async heartbeat(req, res, next) {
        try {
            const log = await analytics_service_1.AnalyticsService.trackActivity({
                action: "SESSION_HEARTBEAT",
                details: req.body || {},
                ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
                userAgent: req.headers["user-agent"]
            });
            res.status(200).json({ success: true, eventId: log.id });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/end-session
     */
    static async endSession(req, res, next) {
        try {
            const log = await analytics_service_1.AnalyticsService.trackActivity({
                action: "SESSION_END",
                details: req.body || {},
                ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
                userAgent: req.headers["user-agent"]
            });
            res.status(200).json({ success: true, eventId: log.id });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/analytics/metered-usage
     */
    static async getMeteredUsage(req, res, next) {
        try {
            const raw = req.headers["x-company-id"] || req.query.companyId || "company-default";
            const companyId = Array.isArray(raw) ? String(raw[0]) : String(raw);
            const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
            const { MeteringAggregatorService } = await Promise.resolve().then(() => __importStar(require("../services/metering-aggregator.service")));
            const stats = await MeteringAggregatorService.getCompanyUsageStats(companyId, days);
            res.json({ success: true, ...stats });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AnalyticsController = AnalyticsController;
//# sourceMappingURL=analytics.controller.js.map