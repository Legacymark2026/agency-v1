"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preferencesRouter = void 0;
/**
 * User Notification Preferences Router — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: Secured with requireUserOrServiceAuth.
 * Manages user multi-channel preferences per notification category with Redis caching.
 */
const express_1 = require("express");
const service_auth_1 = require("@agency/service-auth");
const redis_singleton_1 = require("../lib/redis.singleton");
const events_1 = require("@agency/events");
const NOTIFICATION_CATEGORIES = [
    "CRM", "INBOX", "AUTOMATION", "AI_ENGINE", "FINANCE",
    "MARKETING", "CALENDAR", "CONTENT", "IAM", "SYSTEM",
    "HR", "PROJECTS",
];
exports.preferencesRouter = (0, express_1.Router)();
exports.preferencesRouter.use(service_auth_1.requireUserOrServiceAuth);
function getAuthUser(req) {
    const gatewayUserId = req.headers["x-user-id"];
    const gatewayRole = req.headers["x-user-role"] || "user";
    return {
        id: gatewayUserId ? String(gatewayUserId) : req.user?.id || req.authUser?.id,
        role: String(gatewayRole || req.user?.role || "user"),
    };
}
// ── GET /notification-preferences ─────────────────────────────────────────────
exports.preferencesRouter.get(["/notification-preferences", "/api/notification-preferences"], async (req, res) => {
    try {
        const authUser = getAuthUser(req);
        const targetUserId = String(req.query.userId || authUser.id);
        const isService = !!req.headers["x-service-token"];
        if (!isService && authUser.id && authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
            return res.status(403).json({ success: false, error: "Forbidden" });
        }
        const cached = await redis_singleton_1.redisClient.get(`notif_prefs:${targetUserId}`);
        if (cached) {
            return res.json({ success: true, preferences: JSON.parse(cached), source: "cache" });
        }
        const defaults = {};
        NOTIFICATION_CATEGORIES.forEach((cat) => {
            defaults[cat] = ["IN_APP"];
        });
        await redis_singleton_1.redisClient.setex(`notif_prefs:${targetUserId}`, 300, JSON.stringify(defaults));
        res.json({ success: true, preferences: defaults, source: "defaults" });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// ── PUT /notification-preferences ─────────────────────────────────────────────
exports.preferencesRouter.put(["/notification-preferences", "/api/notification-preferences"], async (req, res) => {
    try {
        const authUser = getAuthUser(req);
        const { userId, preferences } = req.body;
        const targetUserId = String(userId || authUser.id);
        const isService = !!req.headers["x-service-token"];
        if (!isService && authUser.id && authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
            return res.status(403).json({ success: false, error: "Forbidden" });
        }
        if (!preferences) {
            return res.status(400).json({ success: false, error: "preferences required" });
        }
        await redis_singleton_1.redisClient.setex(`notif_prefs:${targetUserId}`, 86400, JSON.stringify(preferences));
        const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
        const eventBus = new events_1.EventBus(REDIS_URL, "notification-service");
        await eventBus.publish("notification.preferences_updated", { userId: targetUserId, preferences }).catch(() => { });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
//# sourceMappingURL=preferences.routes.js.map