"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dlqRouter = void 0;
/**
 * Dead Letter Queue (DLQ) Management Router — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: Secured with requireUserOrServiceAuth and admin role guard.
 * Allows operations teams to inspect, replay, and purge failed BullMQ notification jobs.
 */
const express_1 = require("express");
const service_auth_1 = require("@agency/service-auth");
const notification_queue_1 = require("../queue/notification.queue");
exports.dlqRouter = (0, express_1.Router)();
exports.dlqRouter.use(service_auth_1.requireUserOrServiceAuth);
function requireAdmin(req, res, next) {
    const isService = !!req.headers["x-service-token"];
    if (isService)
        return next();
    const gatewayRole = req.headers["x-user-role"];
    const role = String(gatewayRole || req.user?.role || req.authUser?.role || "user");
    if (role !== "admin" && role !== "super_admin") {
        return res.status(403).json({ success: false, error: "Admin access required" });
    }
    next();
}
exports.dlqRouter.use(requireAdmin);
// ── GET /notifications/dlq ────────────────────────────────────────────────────
exports.dlqRouter.get(["/notifications/dlq", "/api/v1/notifications/dlq"], async (req, res) => {
    try {
        const { start = "0", end = "20" } = req.query;
        const stats = await (0, notification_queue_1.getDLQStats)();
        const jobs = await (0, notification_queue_1.getDLQJobs)(parseInt(String(start), 10), parseInt(String(end), 10));
        res.json({ success: true, stats, jobs });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// ── POST /notifications/dlq/replay ────────────────────────────────────────────
exports.dlqRouter.post(["/notifications/dlq/replay", "/api/v1/notifications/dlq/replay"], async (req, res) => {
    try {
        const { jobId } = req.body;
        if (!jobId)
            return res.status(400).json({ success: false, error: "jobId is required" });
        const result = await (0, notification_queue_1.replayDLQJob)(String(jobId));
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// ── DELETE /notifications/dlq ─────────────────────────────────────────────────
exports.dlqRouter.delete(["/notifications/dlq", "/api/v1/notifications/dlq"], async (_req, res) => {
    try {
        const result = await (0, notification_queue_1.purgeDLQ)();
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
//# sourceMappingURL=dlq.routes.js.map