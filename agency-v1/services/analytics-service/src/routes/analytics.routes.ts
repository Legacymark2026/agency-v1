import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { validateRequest } from "../middlewares/analytics.middleware";
import { z } from "zod";

const trackActivitySchema = z.object({
  action: z.string().optional(),
  eventType: z.string().optional(),
  eventName: z.string().optional(),
  userId: z.string().optional(),
  details: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const analyticsRouter = Router();

// Activity logs
analyticsRouter.get("/analytics/activity", AnalyticsController.getUserActivityLogs);
analyticsRouter.get("/activity", AnalyticsController.getUserActivityLogs);

// Metered usage
analyticsRouter.get("/analytics/metered-usage", AnalyticsController.getMeteredUsage);
analyticsRouter.get("/metered-usage", AnalyticsController.getMeteredUsage);

// Track
analyticsRouter.post("/track", validateRequest(trackActivitySchema), AnalyticsController.trackActivity);
analyticsRouter.post("/analytics/track", validateRequest(trackActivitySchema), AnalyticsController.trackActivity);

// Heartbeat
analyticsRouter.post("/heartbeat", AnalyticsController.heartbeat);
analyticsRouter.post("/analytics/heartbeat", AnalyticsController.heartbeat);

analyticsRouter.post("/end-session", AnalyticsController.endSession);
analyticsRouter.post("/analytics/end-session", AnalyticsController.endSession);

import { AnalyticsExtController } from "../controllers/analytics-ext.controller.js";
analyticsRouter.get("/analytics/predict-sales", AnalyticsExtController.predictSales);
analyticsRouter.get("/analytics/report/pdf", AnalyticsExtController.getPdfReport);
