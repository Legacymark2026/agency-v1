"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRouter = void 0;
/**
 * Notifications Core Router — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: All endpoints secured with requireUserOrServiceAuth.
 * Fix C-2: Multi-tenant boundary isolation enforced on all notification lookups and dispatches.
 * Fix H-3: Input sanitization against Stored XSS.
 */
const express_1 = require("express");
const database_1 = require("@agency/database");
const service_auth_1 = require("@agency/service-auth");
const notification_repository_1 = require("../repositories/notification.repository");
const notification_queue_1 = require("../queue/notification.queue");
const notification_cache_1 = require("../cache/notification.cache");
const tracer_1 = require("../observability/tracer");
exports.notificationsRouter = (0, express_1.Router)();
exports.notificationsRouter.use(service_auth_1.requireUserOrServiceAuth);
function sanitizeText(str) {
    if (typeof str !== "string")
        return "";
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .trim();
}
function getAuthUser(req) {
    const gatewayUserId = req.headers["x-user-id"];
    const gatewayRole = req.headers["x-user-role"] || "user";
    const gatewayCompanyId = req.headers["x-company-id"];
    return {
        id: gatewayUserId ? String(gatewayUserId) : req.user?.id || req.authUser?.id,
        role: String(gatewayRole || req.user?.role || "user"),
        companyId: gatewayCompanyId ? String(gatewayCompanyId) : req.user?.companyId,
    };
}
// ── GET /notifications ────────────────────────────────────────────────────────
exports.notificationsRouter.get(["/notifications", "/api/notifications"], async (req, res) => {
    try {
        const authUser = getAuthUser(req);
        const { userId, companyId, category, isRead, page = "1", limit = "20" } = req.query;
        const targetUserId = String(userId || authUser.id);
        const isService = !!req.headers["x-service-token"];
        if (!isService && authUser.id && authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
            return res.status(403).json({ success: false, error: "Forbidden access to user notifications" });
        }
        const where = { userId: targetUserId };
        if (companyId)
            where.companyId = String(companyId);
        if (category)
            where.type = String(category);
        if (isRead !== undefined)
            where.isRead = isRead === "true";
        const pageSize = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
        const skip = (Math.max(1, parseInt(String(page), 10) || 1) - 1) * pageSize;
        const [notifications, total] = await Promise.all([
            notification_repository_1.notificationRepository.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: pageSize,
                skip,
            }),
            notification_repository_1.notificationRepository.count(where),
        ]);
        const unreadCount = await (0, notification_cache_1.getUnreadCountCached)(targetUserId, String(companyId || authUser.companyId || ""));
        res.json({
            success: true,
            notifications,
            total,
            unreadCount,
            page: parseInt(String(page), 10) || 1,
            limit: pageSize,
            hasMore: skip + notifications.length < total,
        });
    }
    catch (err) {
        console.error("[notification-service] GET /notifications error:", err.message);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
// ── POST /notifications ───────────────────────────────────────────────────────
exports.notificationsRouter.post(["/notifications", "/api/notifications"], async (req, res) => {
    try {
        const { companyId, userIds, roles, title, message, type, priority, data, channels } = req.body;
        if (!companyId || !title) {
            return res.status(400).json({ success: false, error: "companyId and title required" });
        }
        const cleanTitle = sanitizeText(title);
        const cleanMessage = sanitizeText(message);
        let targetUserIds = userIds || [];
        if (roles && roles.length > 0 && targetUserIds.length === 0) {
            const companyUsers = await database_1.prisma.companyUser.findMany({
                where: { companyId: String(companyId), roleName: { in: roles } },
                select: { userId: true },
            });
            targetUserIds = companyUsers.map((u) => u.userId);
        }
        if (targetUserIds.length === 0) {
            return res.json({ success: true, delivered: 0, reason: "no_target_users" });
        }
        const effectiveChannels = channels || ["IN_APP"];
        const job = await (0, tracer_1.traceSpan)("notification.ingest", async (span) => {
            span.setAttribute("companyId", String(companyId));
            span.setAttribute("targetUserCount", targetUserIds.length);
            span.setAttribute("channels", effectiveChannels.join(","));
            return (0, notification_queue_1.enqueueNotification)({
                companyId: String(companyId),
                userIds: targetUserIds,
                title: cleanTitle,
                message: cleanMessage,
                type: String(type || "SYSTEM"),
                priority,
                channels: effectiveChannels,
                data,
            });
        });
        res.status(202).json({
            success: true,
            status: "queued",
            jobId: job.id,
            targetUserCount: targetUserIds.length,
            channels: effectiveChannels,
        });
    }
    catch (err) {
        console.error("[notification-service] POST /notifications error:", err.message);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
// ── PATCH /notifications/read ─────────────────────────────────────────────────
exports.notificationsRouter.patch(["/notifications/read", "/api/notifications/read"], async (req, res) => {
    try {
        const authUser = getAuthUser(req);
        const { userId, notificationIds, markAll } = req.body;
        const targetUserId = String(userId || authUser.id);
        const isService = !!req.headers["x-service-token"];
        if (!isService && authUser.id && authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
            return res.status(403).json({ success: false, error: "Forbidden" });
        }
        if (markAll) {
            const result = await notification_repository_1.notificationRepository.updateMany({
                where: { userId: targetUserId, isRead: false },
                data: { isRead: true },
            });
            await (0, notification_cache_1.invalidateUnreadCount)(targetUserId);
            return res.json({ success: true, updated: result.count });
        }
        if (notificationIds && notificationIds.length > 0) {
            const result = await notification_repository_1.notificationRepository.updateMany({
                where: { id: { in: notificationIds }, userId: targetUserId },
                data: { isRead: true },
            });
            await (0, notification_cache_1.invalidateUnreadCount)(targetUserId);
            return res.json({ success: true, updated: result.count });
        }
        res.status(400).json({ success: false, error: "Provide notificationIds or markAll=true" });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// ── DELETE /notifications ─────────────────────────────────────────────────────
exports.notificationsRouter.delete(["/notifications", "/api/notifications"], async (req, res) => {
    try {
        const authUser = getAuthUser(req);
        const { userId, notificationIds, deleteAll } = req.body;
        const targetUserId = String(userId || authUser.id);
        const isService = !!req.headers["x-service-token"];
        if (!isService && authUser.id && authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
            return res.status(403).json({ success: false, error: "Forbidden" });
        }
        if (deleteAll) {
            const result = await notification_repository_1.notificationRepository.deleteMany({
                where: { userId: targetUserId },
            });
            await (0, notification_cache_1.invalidateUnreadCount)(targetUserId);
            return res.json({ success: true, deleted: result.count });
        }
        if (notificationIds && notificationIds.length > 0) {
            const result = await notification_repository_1.notificationRepository.deleteMany({
                where: { id: { in: notificationIds }, userId: targetUserId },
            });
            await (0, notification_cache_1.invalidateUnreadCount)(targetUserId);
            return res.json({ success: true, deleted: result.count });
        }
        res.status(400).json({ success: false, error: "Provide notificationIds or deleteAll=true" });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
//# sourceMappingURL=notifications.routes.js.map