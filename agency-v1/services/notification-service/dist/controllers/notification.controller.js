"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_service_1 = require("../services/notification.service");
class NotificationController {
    /**
     * GET /api/notifications
     */
    static async getUserNotifications(req, res, next) {
        try {
            const userId = String(req.headers["x-user-id"] || req.query.userId || "");
            if (!userId) {
                return res.status(400).json({ success: false, error: "userId is required" });
            }
            const notifications = await notification_service_1.NotificationService.getUserNotifications(userId, req.query.unreadOnly === "true", req.query.limit ? parseInt(req.query.limit, 10) : 20);
            res.json({ success: true, notifications });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/notifications/dispatch
     */
    static async dispatchNotification(req, res, next) {
        try {
            const userId = String(req.headers["x-user-id"] || req.body.userId || "");
            if (!userId) {
                return res.status(400).json({ success: false, error: "userId is required" });
            }
            const notification = await notification_service_1.NotificationService.dispatchNotification({
                ...req.body,
                userId
            });
            res.status(201).json({ success: true, notification });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=notification.controller.js.map