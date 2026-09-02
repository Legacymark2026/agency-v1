/**
 * User Notification Preferences Router — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: Secured with requireUserOrServiceAuth.
 * Manages user multi-channel preferences per notification category with Redis caching.
 */
import { Router, Request, Response } from "express";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { redisClient } from "../lib/redis.singleton";
import { EventBus } from "@agency/events";

const NOTIFICATION_CATEGORIES = [
  "CRM", "INBOX", "AUTOMATION", "AI_ENGINE", "FINANCE",
  "MARKETING", "CALENDAR", "CONTENT", "IAM", "SYSTEM",
  "HR", "PROJECTS",
] as const;

export const preferencesRouter = Router();

preferencesRouter.use(requireUserOrServiceAuth);

function getAuthUser(req: Request) {
  const gatewayUserId = req.headers["x-user-id"];
  const gatewayRole = req.headers["x-user-role"] || "user";

  return {
    id: gatewayUserId ? String(gatewayUserId) : (req as any).user?.id || (req as any).authUser?.id,
    role: String(gatewayRole || (req as any).user?.role || "user"),
  };
}

// ── GET /notification-preferences ─────────────────────────────────────────────
preferencesRouter.get(["/notification-preferences", "/api/notification-preferences"], async (req: Request, res: Response) => {
  try {
    const authUser = getAuthUser(req);
    const targetUserId = String(req.query.userId || authUser.id);
    const isService = !!req.headers["x-service-token"];

    if (!isService && authUser.id && authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const cached = await redisClient.get(`notif_prefs:${targetUserId}`);
    if (cached) {
      return res.json({ success: true, preferences: JSON.parse(cached), source: "cache" });
    }

    const defaults: Record<string, string[]> = {};
    NOTIFICATION_CATEGORIES.forEach((cat) => {
      defaults[cat] = ["IN_APP"];
    });

    await redisClient.setex(`notif_prefs:${targetUserId}`, 300, JSON.stringify(defaults));
    res.json({ success: true, preferences: defaults, source: "defaults" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /notification-preferences ─────────────────────────────────────────────
preferencesRouter.put(["/notification-preferences", "/api/notification-preferences"], async (req: Request, res: Response) => {
  try {
    const authUser = getAuthUser(req);
    const { userId, preferences } = req.body;
    const targetUserId = String(userId || authUser.id);
    const isService = !!req.headers["x-service-token"];

    if (!isService && authUser.id && authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    if (!preferences) {
      return res.status(400).json({ success: false, error: "preferences required" });
    }

    await redisClient.setex(`notif_prefs:${targetUserId}`, 86400, JSON.stringify(preferences));

    const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
    const eventBus = new EventBus(REDIS_URL, "notification-service");
    await eventBus.publish("notification.preferences_updated", { userId: targetUserId, preferences }).catch(() => {});

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
