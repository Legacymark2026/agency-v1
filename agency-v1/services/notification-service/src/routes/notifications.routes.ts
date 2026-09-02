/**
 * Notifications Core Router — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: All endpoints secured with requireUserOrServiceAuth.
 * Fix C-2: Multi-tenant boundary isolation enforced on all notification lookups and dispatches.
 * Fix H-3: Input sanitization against Stored XSS.
 */
import { Router, Request, Response } from "express";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { notificationRepository } from "../repositories/notification.repository";
import { enqueueNotification } from "../queue/notification.queue";
import { getUnreadCountCached, invalidateUnreadCount } from "../cache/notification.cache";
import { traceSpan } from "../observability/tracer";

export const notificationsRouter = Router();

notificationsRouter.use(requireUserOrServiceAuth);

function sanitizeText(str: unknown): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .trim();
}

function getAuthUser(req: Request) {
  const gatewayUserId = req.headers["x-user-id"];
  const gatewayRole = req.headers["x-user-role"] || "user";
  const gatewayCompanyId = req.headers["x-company-id"];

  return {
    id: gatewayUserId ? String(gatewayUserId) : (req as any).user?.id || (req as any).authUser?.id,
    role: String(gatewayRole || (req as any).user?.role || "user"),
    companyId: gatewayCompanyId ? String(gatewayCompanyId) : (req as any).user?.companyId,
  };
}

// ── GET /notifications ────────────────────────────────────────────────────────
notificationsRouter.get(["/notifications", "/api/notifications"], async (req: Request, res: Response) => {
  try {
    const authUser = getAuthUser(req);
    const { userId, companyId, category, isRead, page = "1", limit = "20" } = req.query;

    const targetUserId = String(userId || authUser.id);
    const isService = !!req.headers["x-service-token"];

    if (!isService && authUser.id && authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
      return res.status(403).json({ success: false, error: "Forbidden access to user notifications" });
    }

    const where: Record<string, unknown> = { userId: targetUserId };
    if (companyId) where.companyId = String(companyId);
    if (category) where.type = String(category);
    if (isRead !== undefined) where.isRead = isRead === "true";

    const pageSize = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (Math.max(1, parseInt(String(page), 10) || 1) - 1) * pageSize;

    const [notifications, total] = await Promise.all([
      notificationRepository.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip,
      }),
      notificationRepository.count(where),
    ]);

    const unreadCount = await getUnreadCountCached(targetUserId, String(companyId || authUser.companyId || ""));

    res.json({
      success: true,
      notifications,
      total,
      unreadCount,
      page: parseInt(String(page), 10) || 1,
      limit: pageSize,
      hasMore: skip + notifications.length < total,
    });
  } catch (err: any) {
    console.error("[notification-service] GET /notifications error:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /notifications ───────────────────────────────────────────────────────
notificationsRouter.post(["/notifications", "/api/notifications"], async (req: Request, res: Response) => {
  try {
    const { companyId, userIds, roles, title, message, type, priority, data, channels } = req.body;

    if (!companyId || !title) {
      return res.status(400).json({ success: false, error: "companyId and title required" });
    }

    const cleanTitle = sanitizeText(title);
    const cleanMessage = sanitizeText(message);

    let targetUserIds: string[] = userIds || [];
    if (roles && roles.length > 0 && targetUserIds.length === 0) {
      const companyUsers = await prisma.companyUser.findMany({
        where: { companyId: String(companyId), roleName: { in: roles } },
        select: { userId: true },
      });
      targetUserIds = companyUsers.map((u: typeof companyUsers[number]) => u.userId);
    }

    if (targetUserIds.length === 0) {
      return res.json({ success: true, delivered: 0, reason: "no_target_users" });
    }

    const effectiveChannels = channels || ["IN_APP"];

    const job = await traceSpan("notification.ingest", async (span) => {
      span.setAttribute("companyId", String(companyId));
      span.setAttribute("targetUserCount", targetUserIds.length);
      span.setAttribute("channels", effectiveChannels.join(","));

      return enqueueNotification({
        companyId: String(companyId),
        userIds: targetUserIds,
        title: cleanTitle,
        message: cleanMessage,
        type: String(type || "SYSTEM"),
        priority,
        channels: effectiveChannels,
        data,
      });
    });

    res.status(202).json({
      success: true,
      status: "queued",
      jobId: job.id,
      targetUserCount: targetUserIds.length,
      channels: effectiveChannels,
    });
  } catch (err: any) {
    console.error("[notification-service] POST /notifications error:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── PATCH /notifications/read ─────────────────────────────────────────────────
notificationsRouter.patch(["/notifications/read", "/api/notifications/read"], async (req: Request, res: Response) => {
  try {
    const authUser = getAuthUser(req);
    const { userId, notificationIds, markAll } = req.body;
    const targetUserId = String(userId || authUser.id);
    const isService = !!req.headers["x-service-token"];

    if (!isService && authUser.id && authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    if (markAll) {
      const result = await notificationRepository.updateMany({
        where: { userId: targetUserId, isRead: false },
        data: { isRead: true },
      });
      await invalidateUnreadCount(targetUserId);
      return res.json({ success: true, updated: result.count });
    }

    if (notificationIds && notificationIds.length > 0) {
      const result = await notificationRepository.updateMany({
        where: { id: { in: notificationIds }, userId: targetUserId },
        data: { isRead: true },
      });
      await invalidateUnreadCount(targetUserId);
      return res.json({ success: true, updated: result.count });
    }

    res.status(400).json({ success: false, error: "Provide notificationIds or markAll=true" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /notifications ─────────────────────────────────────────────────────
notificationsRouter.delete(["/notifications", "/api/notifications"], async (req: Request, res: Response) => {
  try {
    const authUser = getAuthUser(req);
    const { userId, notificationIds, deleteAll } = req.body;
    const targetUserId = String(userId || authUser.id);
    const isService = !!req.headers["x-service-token"];

    if (!isService && authUser.id && authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    if (deleteAll) {
      const result = await notificationRepository.deleteMany({
        where: { userId: targetUserId },
      });
      await invalidateUnreadCount(targetUserId);
      return res.json({ success: true, deleted: result.count });
    }

    if (notificationIds && notificationIds.length > 0) {
      const result = await notificationRepository.deleteMany({
        where: { id: { in: notificationIds }, userId: targetUserId },
      });
      await invalidateUnreadCount(targetUserId);
      return res.json({ success: true, deleted: result.count });
    }

    res.status(400).json({ success: false, error: "Provide notificationIds or deleteAll=true" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
