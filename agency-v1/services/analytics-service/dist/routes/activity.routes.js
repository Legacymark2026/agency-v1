"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityRouter = void 0;
/**
 * User Activity & Telemetry Router — Analytics Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: All endpoints secured with requireUserOrServiceAuth.
 * Fix C-2: Multi-tenant boundary isolation enforced on user audit logs.
 * Fix 8: Strict pagination capping at MAX_LIMIT=100.
 */
const express_1 = require("express");
const zod_1 = require("zod");
const service_auth_1 = require("@agency/service-auth");
const analytics_service_1 = require("../services/analytics.service");
const trackActivitySchema = zod_1.z.object({
    action: zod_1.z.string().min(1).optional(),
    eventType: zod_1.z.string().optional(),
    eventName: zod_1.z.string().optional(),
    details: zod_1.z.record(zod_1.z.any()).optional().default({}),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.activityRouter = (0, express_1.Router)();
exports.activityRouter.use(service_auth_1.requireUserOrServiceAuth);
function getAuthenticatedUserId(req) {
    return req.headers["x-user-id"] ||
        (req.body && req.body.userId ? String(req.body.userId) : undefined);
}
// ── GET /analytics/activity ───────────────────────────────────────────────────
exports.activityRouter.get(["/analytics/activity", "/activity"], async (req, res, next) => {
    try {
        const authUserId = getAuthenticatedUserId(req);
        const requestedUserId = req.query.userId ? String(req.query.userId) : authUserId;
        // Security check: Only allow querying own logs unless caller is a service
        const isService = !!req.headers["x-service-token"];
        if (!isService && requestedUserId !== authUserId) {
            return res.status(403).json({ success: false, error: "Cannot access audit logs of other users" });
        }
        if (!requestedUserId) {
            return res.status(400).json({ success: false, error: "userId is required" });
        }
        const rawLimit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
        const limit = Math.min(Math.max(1, rawLimit || 50), 100);
        const logs = await analytics_service_1.AnalyticsService.getUserActivityLogs(requestedUserId, limit);
        res.json({ success: true, count: logs.length, logs });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /track ───────────────────────────────────────────────────────────────
exports.activityRouter.post(["/track", "/analytics/track"], async (req, res, next) => {
    try {
        const parsed = trackActivitySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, error: "Invalid tracking payload", details: parsed.error.errors });
        }
        const action = parsed.data.action || parsed.data.eventType || parsed.data.eventName || "USER_ACTION";
        const details = parsed.data.details || parsed.data.metadata || {};
        const userId = getAuthenticatedUserId(req);
        const log = await analytics_service_1.AnalyticsService.trackActivity({
            userId,
            action,
            details,
            ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
            userAgent: req.headers["user-agent"],
        });
        res.status(201).json({ success: true, eventId: log.id, log });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /heartbeat ───────────────────────────────────────────────────────────
exports.activityRouter.post(["/heartbeat", "/analytics/heartbeat"], async (req, res, next) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const log = await analytics_service_1.AnalyticsService.trackActivity({
            userId,
            action: "SESSION_HEARTBEAT",
            details: req.body || {},
            ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
            userAgent: req.headers["user-agent"],
        });
        res.status(200).json({ success: true, eventId: log.id });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /end-session ─────────────────────────────────────────────────────────
exports.activityRouter.post(["/end-session", "/analytics/end-session"], async (req, res, next) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const log = await analytics_service_1.AnalyticsService.trackActivity({
            userId,
            action: "SESSION_END",
            details: req.body || {},
            ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
            userAgent: req.headers["user-agent"],
        });
        res.status(200).json({ success: true, eventId: log.id });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=activity.routes.js.map