import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import { validateRequest } from "../middlewares/notification.middleware.js";
import { z } from "zod";

const dispatchSchema = z.object({
  type: z.string().min(1, "Notification type is required"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  channel: z.enum(["IN_APP", "EMAIL", "PUSH"]).optional().default("IN_APP"),
});

export const notificationRouter = Router();

notificationRouter.get("/notifications", NotificationController.getUserNotifications);
notificationRouter.post("/notifications/dispatch", validateRequest(dispatchSchema), NotificationController.dispatchNotification);

import { NotificationExtController } from "../controllers/notification-ext.controller.js";
notificationRouter.post("/notifications/enqueue", NotificationExtController.enqueue);
