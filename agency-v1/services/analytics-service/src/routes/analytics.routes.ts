import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { validateRequest } from "../middlewares/analytics.middleware";
import { z } from "zod";

const trackActivitySchema = z.object({
  action: z.string().min(1, "Action is required"),
  userId: z.string().optional(),
  details: z.record(z.any()).optional(),
});

export const analyticsRouter = Router();

analyticsRouter.get("/analytics/activity", AnalyticsController.getUserActivityLogs);
analyticsRouter.get("/analytics/metered-usage", AnalyticsController.getMeteredUsage);
analyticsRouter.post("/track", validateRequest(trackActivitySchema), AnalyticsController.trackActivity);
