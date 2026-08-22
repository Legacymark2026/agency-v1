"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRouter = void 0;
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const analytics_middleware_1 = require("../middlewares/analytics.middleware");
const zod_1 = require("zod");
const trackActivitySchema = zod_1.z.object({
    action: zod_1.z.string().optional(),
    eventType: zod_1.z.string().optional(),
    eventName: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
    details: zod_1.z.record(zod_1.z.any()).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.analyticsRouter = (0, express_1.Router)();
// Activity logs
exports.analyticsRouter.get("/analytics/activity", analytics_controller_1.AnalyticsController.getUserActivityLogs);
exports.analyticsRouter.get("/activity", analytics_controller_1.AnalyticsController.getUserActivityLogs);
// Metered usage
exports.analyticsRouter.get("/analytics/metered-usage", analytics_controller_1.AnalyticsController.getMeteredUsage);
exports.analyticsRouter.get("/metered-usage", analytics_controller_1.AnalyticsController.getMeteredUsage);
// Track
exports.analyticsRouter.post("/track", (0, analytics_middleware_1.validateRequest)(trackActivitySchema), analytics_controller_1.AnalyticsController.trackActivity);
exports.analyticsRouter.post("/analytics/track", (0, analytics_middleware_1.validateRequest)(trackActivitySchema), analytics_controller_1.AnalyticsController.trackActivity);
// Heartbeat
exports.analyticsRouter.post("/heartbeat", analytics_controller_1.AnalyticsController.heartbeat);
exports.analyticsRouter.post("/analytics/heartbeat", analytics_controller_1.AnalyticsController.heartbeat);
// End Session
exports.analyticsRouter.post("/end-session", analytics_controller_1.AnalyticsController.endSession);
exports.analyticsRouter.post("/analytics/end-session", analytics_controller_1.AnalyticsController.endSession);
//# sourceMappingURL=analytics.routes.js.map