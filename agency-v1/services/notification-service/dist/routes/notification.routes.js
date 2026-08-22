"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = require("express");
const notification_controller_js_1 = require("../controllers/notification.controller.js");
const notification_middleware_js_1 = require("../middlewares/notification.middleware.js");
const zod_1 = require("zod");
const dispatchSchema = zod_1.z.object({
    type: zod_1.z.string().min(1, "Notification type is required"),
    title: zod_1.z.string().min(1, "Title is required"),
    body: zod_1.z.string().min(1, "Body is required"),
    channel: zod_1.z.enum(["IN_APP", "EMAIL", "PUSH"]).optional().default("IN_APP"),
});
exports.notificationRouter = (0, express_1.Router)();
exports.notificationRouter.get("/notifications", notification_controller_js_1.NotificationController.getUserNotifications);
exports.notificationRouter.post("/notifications/dispatch", (0, notification_middleware_js_1.validateRequest)(dispatchSchema), notification_controller_js_1.NotificationController.dispatchNotification);
const notification_ext_controller_js_1 = require("../controllers/notification-ext.controller.js");
exports.notificationRouter.post("/notifications/enqueue", notification_ext_controller_js_1.NotificationExtController.enqueue);
//# sourceMappingURL=notification.routes.js.map