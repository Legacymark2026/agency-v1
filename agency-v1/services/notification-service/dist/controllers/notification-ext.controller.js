"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationExtController = void 0;
const priority_queue_service_js_1 = require("../services/priority-queue.service.js");
class NotificationExtController {
    /**
     * POST /api/v1/notifications/enqueue
     */
    static async enqueue(req, res, next) {
        try {
            const { payload, priority } = req.body;
            if (!payload) {
                return res.status(400).json({ success: false, error: "payload is required" });
            }
            const result = await priority_queue_service_js_1.PriorityQueueService.enqueueNotification(payload, priority);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationExtController = NotificationExtController;
//# sourceMappingURL=notification-ext.controller.js.map