/**
 * Notification Service — Enterprise Notification & Delivery Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized notification hub for the entire LegacyMark platform.
 * Handles: In-App, Email (Resend), Push, SMS delivery channels.
 *
 * Features:
 * - Multi-channel dispatch (IN_APP, EMAIL, PUSH)
 * - User preference-aware delivery
 * - Event-driven architecture (subscribes to all platform events)
 * - Batch notification processing
 * - Read/unread state management
 * - Rate limiting per user per channel
 *
 * Port: 4016 (internal)
 */

import express from "express";
// Observability registration — must be first
try {
  require("@agency/observability/register");
} catch { /* observability optional */ }
import { setupGracefulShutdown } from "@agency/service-auth";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import Redis from "ioredis";

const app = express();
const PORT = parseInt(process.env.PORT || "4016", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

app.use(helmet());
// H-1 FIX: Require explicit ALLOWED_ORIGINS, never default to wildcard
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));

// ── C-1 FIX: Authentication middleware for notification endpoints ─────────
import jwt from "jsonwebtoken";

const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const gatewayUserId = req.headers["x-user-id"];
    
    if (gatewayUserId) {
      (req as any).authUser = { id: String(gatewayUserId) };
      return next();
    }

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = authHeader.slice(7);
    const verifyKey = process.env.JWT_SECRET;
    if (!verifyKey) return res.status(500).json({ error: "Service misconfigured" });

    const decoded = jwt.verify(token, verifyKey) as any;
    (req as any).authUser = { id: decoded.sub, role: decoded.role, companyId: decoded.companyId };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// H-3 FIX: Input sanitization helper to prevent Stored XSS
function sanitizeText(str: unknown): string {
  if (typeof str !== "string") return "";
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/on\w+="[^"]*"/gi, "")
            .trim();
}

// ── Health & Readiness ───────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "notification-service",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    channels: ["IN_APP", "EMAIL", "PUSH"],
  });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redisClient.ping();
    res.json({ status: "ready", db: "connected", cache: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

import { notificationRouter } from "./routes/notification.routes";
import { errorHandler } from "./middlewares/notification.middleware";

app.use("/api/v1", notificationRouter);
app.use(errorHandler);

// ── Notification Types Registry ──────────────────────────────────────────────

const NOTIFICATION_CATEGORIES = [
  "CRM", "INBOX", "AUTOMATION", "AI_ENGINE", "FINANCE",
  "MARKETING", "CALENDAR", "CONTENT", "IAM", "SYSTEM",
  "HR", "PROJECTS",
] as const;

type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH" | "SMS";
type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

// ── GET /api/notifications — Paginated list ──────────────────────────────────

app.get("/api/notifications", requireAuth, async (req, res) => {
  try {
    const authUser = (req as any).authUser;
    const { userId, companyId, category, isRead, page = "1", limit = "20" } = req.query;

    const targetUserId = String(userId || authUser.id);
    // C-1 FIX: Ensure user can only read their own notifications unless admin
    if (authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
      return res.status(403).json({ error: "Forbidden access to user notifications" });
    }

    const where: Record<string, unknown> = {
      userId: targetUserId,
    };
    if (companyId) where.companyId = String(companyId);
    if (category) where.type = String(category);
    if (isRead !== undefined) where.isRead = isRead === "true";

    // L-3 FIX: Cap max page size to 100 to prevent DoS
    const pageSize = Math.min(100, Math.max(1, parseInt(String(limit)) || 20));
    const skip = (Math.max(1, parseInt(String(page)) || 1) - 1) * pageSize;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { ...where, isRead: false },
      }),
    ]);

    res.json({
      notifications,
      total,
      unreadCount,
      page: parseInt(String(page)) || 1,
      limit: pageSize,
      hasMore: skip + notifications.length < total,
    });
  } catch (err) {
    console.error("[notification-service] GET /api/notifications error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /api/notifications — Create & dispatch ─────────────────────────────

app.post("/api/notifications", requireAuth, async (req, res) => {
  try {
    const { companyId, userIds, roles, title, message, type, priority, data, channels } = req.body;

    if (!companyId || !title) {
      return res.status(400).json({ error: "companyId and title required" });
    }

    // H-3 FIX: Sanitize input title and message against Stored XSS
    const cleanTitle = sanitizeText(title);
    const cleanMessage = sanitizeText(message);

    // Resolve target users
    let targetUserIds: string[] = userIds || [];

    if (roles && roles.length > 0 && targetUserIds.length === 0) {
      const companyUsers = await prisma.companyUser.findMany({
        where: {
          companyId: String(companyId),
          roleName: { in: roles },
        },
        select: { userId: true },
      });
      targetUserIds = companyUsers.map((u: typeof companyUsers[number]) => u.userId);
    }

    if (targetUserIds.length === 0) {
      return res.json({ success: true, delivered: 0, reason: "no_target_users" });
    }

    const effectiveChannels: NotificationChannel[] = channels || ["IN_APP"];

    // Batch create IN_APP notifications
    if (effectiveChannels.includes("IN_APP")) {
      await prisma.notification.createMany({
        data: targetUserIds.map((userId) => ({
          userId,
          companyId: String(companyId),
          title: cleanTitle,
          message: cleanMessage,
          type: String(type || "SYSTEM"),
          isRead: false,
          data: data ? JSON.stringify(data) : undefined,
        })),
      });
    }

    // Queue email delivery (async, non-blocking)
    if (effectiveChannels.includes("EMAIL")) {
      for (const userId of targetUserIds) {
        await redisClient.lpush(
          "notification:email_queue",
          JSON.stringify({ userId, companyId, title: cleanTitle, message: cleanMessage, type, priority, ts: Date.now() })
        );
      }
    }

    // Publish event for real-time delivery
    await eventBus.publish("notification.dispatched", {
      companyId,
      userIds: targetUserIds,
      type,
      title: cleanTitle,
      channelsUsed: effectiveChannels,
    });

    res.status(201).json({
      success: true,
      delivered: targetUserIds.length,
      channels: effectiveChannels,
    });
  } catch (err) {
    console.error("[notification-service] POST /api/notifications error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /api/notifications/read — Mark as read ─────────────────────────────

app.patch("/api/notifications/read", requireAuth, async (req, res) => {
  try {
    const authUser = (req as any).authUser;
    const { userId, notificationIds, markAll } = req.body;
    const targetUserId = String(userId || authUser.id);

    if (authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (markAll) {
      const result = await prisma.notification.updateMany({
        where: { userId: targetUserId, isRead: false },
        data: { isRead: true },
      });
      return res.json({ success: true, updated: result.count });
    }

    if (notificationIds && notificationIds.length > 0) {
      const result = await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, userId: targetUserId },
        data: { isRead: true },
      });
      return res.json({ success: true, updated: result.count });
    }

    res.status(400).json({ error: "Provide notificationIds or markAll=true" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── DELETE /api/notifications — Bulk delete ──────────────────────────────────

app.delete("/api/notifications", requireAuth, async (req, res) => {
  try {
    const authUser = (req as any).authUser;
    const { userId, notificationIds, deleteAll } = req.body;
    const targetUserId = String(userId || authUser.id);

    if (authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (deleteAll) {
      const result = await prisma.notification.deleteMany({
        where: { userId: targetUserId },
      });
      return res.json({ success: true, deleted: result.count });
    }

    if (notificationIds && notificationIds.length > 0) {
      const result = await prisma.notification.deleteMany({
        where: { id: { in: notificationIds }, userId: targetUserId },
      });
      return res.json({ success: true, deleted: result.count });
    }

    res.status(400).json({ error: "Provide notificationIds or deleteAll=true" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/notification-preferences — User channel preferences ─────────────

app.get("/api/notification-preferences", requireAuth, async (req, res) => {
  try {
    const authUser = (req as any).authUser;
    const targetUserId = String(req.query.userId || authUser.id);

    if (authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const cached = await redisClient.get(`notif_prefs:${targetUserId}`);
    if (cached) {
      return res.json({ preferences: JSON.parse(cached), source: "cache" });
    }

    const defaults: Record<string, NotificationChannel[]> = {};
    NOTIFICATION_CATEGORIES.forEach((cat) => {
      defaults[cat] = ["IN_APP"];
    });

    await redisClient.setex(`notif_prefs:${targetUserId}`, 300, JSON.stringify(defaults));
    res.json({ preferences: defaults, source: "defaults" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PUT /api/notification-preferences — Update preferences ───────────────────

app.put("/api/notification-preferences", requireAuth, async (req, res) => {
  try {
    const authUser = (req as any).authUser;
    const { userId, preferences } = req.body;
    const targetUserId = String(userId || authUser.id);

    if (authUser.id !== targetUserId && authUser.role !== "admin" && authUser.role !== "super_admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!preferences) {
      return res.status(400).json({ error: "preferences required" });
    }

    await redisClient.setex(`notif_prefs:${targetUserId}`, 86400, JSON.stringify(preferences));
    await eventBus.publish("notification.preferences_updated", { userId: targetUserId, preferences });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/notifications/stats — Dashboard metrics ─────────────────────────

app.get("/api/notifications/stats", async (req, res) => {
  try {
    const { companyId, period = "7d" } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const periodDays = period === "30d" ? 30 : period === "24h" ? 1 : 7;
    const since = new Date(Date.now() - periodDays * 86400000);

    const [total, unread, byType] = await Promise.all([
      prisma.notification.count({
        where: { companyId: String(companyId), createdAt: { gte: since } },
      }),
      prisma.notification.count({
        where: { companyId: String(companyId), isRead: false, createdAt: { gte: since } },
      }),
      prisma.notification.groupBy({
        by: ["type"],
        where: { companyId: String(companyId), createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    const emailQueueLength = await redisClient.llen("notification:email_queue");

    res.json({
      period,
      total,
      unread,
      readRate: total > 0 ? ((total - unread) / total * 100).toFixed(1) + "%" : "0%",
      byType: byType.map((t: typeof byType[number]) => ({ type: t.type, count: t._count })),
      emailQueueLength,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── C-3 FIX: Production-Ready Email Queue Worker ──────────────────────────────
import { Resend } from "resend";

async function processEmailQueue() {
  try {
    const item = await redisClient.rpop("notification:email_queue");
    if (!item) return;

    const { userId, title, message } = JSON.parse(item);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey && apiKey !== "re_123456789") {
        const resend = new Resend(apiKey);
        const canonicalEmail = process.env.ADMIN_CANONICAL_EMAIL || "no-reply@legacymarksas.com";
        await resend.emails.send({
          from: `LegacyMark <${canonicalEmail}>`,
          to: [user.email],
          subject: title,
          html: `<div style="font-family:sans-serif;padding:20px;background:#0f172a;color:#fff;"><h2 style="color:#14b8a6;">${title}</h2><p>${message}</p></div>`,
        });
        console.log(`[notification-service] 📧 Email sent via Resend → ${user.email}`);
      } else {
        console.log(`[notification-service] 📧 Email queued (Mock/Dev) → ${user.email}: ${title}`);
      }
    }
  } catch (err) {
    console.error("[notification-service] Email worker error:", err);
  }
}

// Process email queue every 5 seconds
setInterval(processEmailQueue, 5000);

// ── Event Bus: Subscribe to platform events ──────────────────────────────────

const eventBus = new EventBus(REDIS_URL, "notification-service");
const redisClient = new Redis(REDIS_URL);
redisClient.on("error", (err) => console.error("[notification-service] Redis client error:", err.message));

// Auto-generate notifications from platform events
const EVENT_MAPPINGS: Record<string, { type: string; titleFn: (data: any) => string }> = {
  "lead.created": {
    type: "CRM",
    titleFn: (d) => `Nuevo Lead: ${d.data?.name || "Sin nombre"}`,
  },
  "deal.won": {
    type: "CRM",
    titleFn: (d) => `🎉 Deal Ganado — $${d.value?.toLocaleString() || "0"}`,
  },
  "deal.stage_changed": {
    type: "CRM",
    titleFn: (d) => `Deal movido: ${d.fromStage} → ${d.toStage}`,
  },
  "invoice.paid": {
    type: "FINANCE",
    titleFn: (d) => `💰 Factura Pagada — $${d.amount?.toLocaleString() || "0"}`,
  },
  "workflow.failed": {
    type: "AUTOMATION",
    titleFn: (d) => `⚠️ Workflow Fallido: ${d.workflowName || "Desconocido"}`,
  },
  "workflow.completed": {
    type: "AUTOMATION",
    titleFn: (d) => `✅ Workflow Completado: ${d.workflowName || ""}`,
  },
};

for (const [eventName, mapping] of Object.entries(EVENT_MAPPINGS)) {
  eventBus.subscribe(eventName as any, async (payload) => {
    try {
      const companyId = payload.data?.companyId as string;
      if (!companyId) return;

      const admins = await prisma.companyUser.findMany({
        where: { companyId, roleName: { in: ["admin", "owner"] } },
        select: { userId: true },
      });

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((a: typeof admins[number]) => ({
            userId: a.userId,
            companyId,
            title: mapping.titleFn(payload.data),
            message: JSON.stringify(payload.data).substring(0, 200),
            type: mapping.type,
            isRead: false,
          })),
        });
        console.log(`[notification-service] 🔔 ${eventName} → ${admins.length} users notified`);
      }
    } catch (err) {
      console.error(`[notification-service] Event ${eventName} handler error:`, err);
    }
  });
}

// ── High-Speed Synchronous gRPC Server & Client Setup ─────────────────────────
import { GrpcServerHelper, GrpcClientHelper, PROTO_PATHS } from "@agency/grpc";

const NOTIF_GRPC_PORT = parseInt(process.env.GRPC_PORT || "50055", 10);
const AUTH_GRPC_URL = process.env.AUTH_GRPC_URL || "auth-service:50051";

const notifGrpcServer = new GrpcServerHelper();
notifGrpcServer.addService(
  PROTO_PATHS.notification,
  "notification",
  "NotificationService",
  {
    SendDirectNotification: async (call: any, callback: any) => {
      try {
        const { userId, title, message, type } = call.request;
        const notification = await prisma.notification.create({
          data: {
            userId,
            companyId: "default",
            title,
            message,
            type: type || "SYSTEM",
            isRead: false,
          },
        });
        callback(null, {
          success: true,
          notificationId: notification.id,
          error: "",
        });
      } catch (err: any) {
        callback(null, { success: false, notificationId: "", error: err.message || "Error" });
      }
    },
    CheckHealth: async (_call: any, callback: any) => {
      callback(null, {
        status: "healthy",
        service: "notification-service",
        timestamp: Date.now(),
      });
    },
  }
);

notifGrpcServer.start(NOTIF_GRPC_PORT).catch(err => {
  console.error("[notification-service] Failed to start gRPC server:", err.message);
});

export const authGrpcClient = GrpcClientHelper.getClient(
  "auth-service",
  PROTO_PATHS.auth,
  "auth",
  "AuthService",
  AUTH_GRPC_URL,
  { failureThreshold: 3, resetTimeoutMs: 5000, timeoutMs: 3000 }
);

// ── Start ────────────────────────────────────────────────────────────────────

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔔 Notification Service running on port ${PORT} (HTTP) and port ${NOTIF_GRPC_PORT} (gRPC Sync)`);
  console.log(`   Channels: IN_APP, EMAIL, PUSH`);
  console.log(`   Categories: ${NOTIFICATION_CATEGORIES.join(", ")}`);
  console.log(`   Event mappings: ${Object.keys(EVENT_MAPPINGS).join(", ")}`);
});
setupGracefulShutdown(server);

process.on("SIGTERM", async () => {
  console.log("[notification-service] Graceful shutdown...");
  await notifGrpcServer.forceShutdown();
  await eventBus.disconnect();
  await redisClient.quit();
  await prisma.$disconnect();
  process.exit(0);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
