/**
 * User Activity & Telemetry Router — Analytics Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: All endpoints secured with requireUserOrServiceAuth.
 * Fix C-2: Multi-tenant boundary isolation enforced on user audit logs.
 * Fix 8: Strict pagination capping at MAX_LIMIT=100.
 */
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { AnalyticsService } from "../services/analytics.service";

const trackActivitySchema = z.object({
  action: z.string().min(1).optional(),
  eventType: z.string().optional(),
  eventName: z.string().optional(),
  details: z.record(z.any()).optional().default({}),
  metadata: z.record(z.any()).optional(),
});

export const activityRouter = Router();

activityRouter.use(requireUserOrServiceAuth);

function getAuthenticatedUserId(req: Request): string | undefined {
  return (req.headers["x-user-id"] as string | undefined) ||
    (req.body && req.body.userId ? String(req.body.userId) : undefined);
}

// ── GET /analytics/activity ───────────────────────────────────────────────────
activityRouter.get(["/analytics/activity", "/activity"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUserId = getAuthenticatedUserId(req);
    const requestedUserId = req.query.userId ? String(req.query.userId) : authUserId;

    // Security check: Only allow querying own logs unless caller is a service
    const isService = !!req.headers["x-service-token"];
    if (!isService && requestedUserId !== authUserId) {
      return res.status(403).json({ success: false, error: "Cannot access audit logs of other users" });
    }

    if (!requestedUserId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const rawLimit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const limit = Math.min(Math.max(1, rawLimit || 50), 100);

    const logs = await AnalyticsService.getUserActivityLogs(requestedUserId, limit);
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
});

// ── POST /track ───────────────────────────────────────────────────────────────
activityRouter.post(["/track", "/analytics/track"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = trackActivitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid tracking payload", details: parsed.error.errors });
    }

    const action = parsed.data.action || parsed.data.eventType || parsed.data.eventName || "USER_ACTION";
    const details = parsed.data.details || parsed.data.metadata || {};
    const userId = getAuthenticatedUserId(req);

    const log = await AnalyticsService.trackActivity({
      userId,
      action,
      details,
      ipAddress: req.ip || (req.headers["x-forwarded-for"] as string) || "127.0.0.1",
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({ success: true, eventId: log.id, log });
  } catch (err) {
    next(err);
  }
});

// ── POST /heartbeat ───────────────────────────────────────────────────────────
activityRouter.post(["/heartbeat", "/analytics/heartbeat"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const log = await AnalyticsService.trackActivity({
      userId,
      action: "SESSION_HEARTBEAT",
      details: req.body || {},
      ipAddress: req.ip || (req.headers["x-forwarded-for"] as string) || "127.0.0.1",
      userAgent: req.headers["user-agent"],
    });
    res.status(200).json({ success: true, eventId: log.id });
  } catch (err) {
    next(err);
  }
});

// ── POST /end-session ─────────────────────────────────────────────────────────
activityRouter.post(["/end-session", "/analytics/end-session"], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const log = await AnalyticsService.trackActivity({
      userId,
      action: "SESSION_END",
      details: req.body || {},
      ipAddress: req.ip || (req.headers["x-forwarded-for"] as string) || "127.0.0.1",
      userAgent: req.headers["user-agent"],
    });
    res.status(200).json({ success: true, eventId: log.id });
  } catch (err) {
    next(err);
  }
});
