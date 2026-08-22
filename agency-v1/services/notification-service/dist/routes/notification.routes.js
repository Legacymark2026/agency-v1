"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const notification_middleware_1 = require("../middlewares/notification.middleware");
const zod_1 = require("zod");
const dispatchSchema = zod_1.z.object({
    type: zod_1.z.string().min(1, "Notification type is required"),
    title: zod_1.z.string().min(1, "Title is required"),
    body: zod_1.z.string().min(1, "Body is required"),
    channel: zod_1.z.enum(["IN_APP", "EMAIL", "PUSH"]).optional().default("IN_APP"),
});
exports.notificationRouter = (0, express_1.Router)();
exports.notificationRouter.get("/notifications", notification_controller_1.NotificationController.getUserNotifications);
exports.notificationRouter.post("/notifications/dispatch", (0, notification_middleware_1.validateRequest)(dispatchSchema), notification_controller_1.NotificationController.dispatchNotification);
//# sourceMappingURL=notification.routes.js.map