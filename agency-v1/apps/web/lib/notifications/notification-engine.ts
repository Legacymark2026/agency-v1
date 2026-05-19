/**
 * lib/notifications/notification-engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Enterprise Notification Engine — Central Emission & Delivery Hub
 *
 * ARCHITECTURE:
 *   Server Action → notifyEvent() → DB Write → Preference Check → Delivery
 *
 * USAGE:
 *   import { notifyEvent, notifyUsers } from "@/lib/notifications/notification-engine";
 *
 *   // Single user notification
 *   await notifyEvent("CRM.DEAL_WON", {
 *     companyId, userId, title: "Deal cerrado!",
 *     message: "Acme Corp - $50,000", data: { dealId: "..." }
 *   });
 *
 *   // Notify all admins of a company
 *   await notifyUsers("FINANCE.INVOICE_OVERDUE", {
 *     companyId, title: "Factura vencida",
 *     message: "INV-2026-001", roles: ["super_admin", "admin"],
 *     data: { invoiceId: "..." }
 *   });
 */

import { prisma } from "@/lib/prisma";
import {
  NOTIFICATION_EVENTS,
  type NotificationEventType,
  type NotificationCategory,
  type NotificationPriority,
  type DeliveryChannel,
} from "./notification-types";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface NotifyEventParams {
  companyId: string;
  userId: string;
  title: string;
  message: string;
  /** Arbitrary metadata (dealId, invoiceId, etc.) used for link resolution */
  data?: Record<string, string | number | boolean>;
  /** Override default priority */
  priority?: NotificationPriority;
  /** Override default link template */
  link?: string;
}

interface NotifyUsersParams {
  companyId: string;
  title: string;
  message: string;
  data?: Record<string, string | number | boolean>;
  priority?: NotificationPriority;
  link?: string;
  /** Notify users with these standard roles (e.g. ["super_admin", "admin"]) */
  roles?: string[];
  /** Notify specific user IDs */
  userIds?: string[];
  /** Notify users with these CompanyUser role names */
  roleNames?: string[];
}

// ─── Link Template Resolution ────────────────────────────────────────────────

function resolveLink(template: string | undefined, data?: Record<string, string | number | boolean>): string | undefined {
  if (!template || !data) return template;
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(`{${key}}`, String(value));
  }
  return result;
}

// ─── Preference Check ────────────────────────────────────────────────────────

async function shouldDeliver(
  userId: string,
  companyId: string,
  eventType: NotificationEventType,
  channel: DeliveryChannel
): Promise<boolean> {
  const eventMeta = NOTIFICATION_EVENTS[eventType];

  // Non-configurable events always deliver
  if (!eventMeta.userConfigurable) return true;

  try {
    const pref = await prisma.notificationPreference.findUnique({
      where: {
        userId_companyId_channel_event: {
          userId,
          companyId,
          channel,
          event: eventType,
        },
      },
    });

    // No preference → use defaults
    if (!pref) return eventMeta.defaultChannels.includes(channel);

    return pref.enabled;
  } catch {
    // DB error → deliver by default (fail-open for notifications)
    return true;
  }
}

// ─── Core: Emit Notification ─────────────────────────────────────────────────

/**
 * Emit a notification to a single user.
 * Checks user preferences, creates DB record, and logs delivery.
 */
export async function notifyEvent(
  eventType: NotificationEventType,
  params: NotifyEventParams
): Promise<string | null> {
  const eventMeta = NOTIFICATION_EVENTS[eventType];
  if (!eventMeta) {
    console.error(`[NotificationEngine] Unknown event type: ${eventType}`);
    return null;
  }

  const { companyId, userId, title, message, data, priority, link } = params;

  // Check if user wants IN_APP notifications for this event
  const shouldSendInApp = await shouldDeliver(userId, companyId, eventType, "IN_APP");
  if (!shouldSendInApp) return null;

  try {
    const resolvedLink = link || resolveLink(eventMeta.linkTemplate, data);

    const notification = await prisma.notification.create({
      data: {
        companyId,
        userId,
        type: eventMeta.category,
        title,
        message,
        link: resolvedLink,
        metadata: {
          eventType,
          icon: eventMeta.icon,
          color: eventMeta.color,
          priority: priority || eventMeta.defaultPriority,
          ...data,
        },
      },
    });

    // Log delivery
    await prisma.notificationDeliveryLog.create({
      data: {
        notificationId: notification.id,
        companyId,
        userId,
        channel: "IN_APP",
        status: "DELIVERED",
      },
    }).catch(() => {}); // Non-blocking

    // Email delivery (async, non-blocking)
    const shouldSendEmail = await shouldDeliver(userId, companyId, eventType, "EMAIL");
    if (shouldSendEmail && eventMeta.defaultChannels.includes("EMAIL")) {
      // Queue email delivery (non-blocking)
      queueEmailNotification(userId, companyId, notification.id, title, message, resolvedLink).catch(() => {});
    }

    return notification.id;
  } catch (error) {
    console.error(`[NotificationEngine] Failed to emit ${eventType}:`, error);
    return null;
  }
}

// ─── Bulk: Notify Multiple Users ─────────────────────────────────────────────

/**
 * Emit a notification to multiple users based on roles, role names, or explicit IDs.
 * Each user's preferences are checked individually.
 */
export async function notifyUsers(
  eventType: NotificationEventType,
  params: NotifyUsersParams
): Promise<number> {
  const { companyId, title, message, data, priority, link, roles, userIds, roleNames } = params;

  let targetUserIds: string[] = [];

  // Resolve user IDs from roles (User.role field — standard roles)
  if (roles && roles.length > 0) {
    const users = await prisma.user.findMany({
      where: {
        role: { in: roles },
        companies: { some: { companyId } },
        deactivatedAt: null,
      },
      select: { id: true },
    });
    targetUserIds.push(...users.map((u) => u.id));
  }

  // Resolve user IDs from CompanyUser.roleName (custom roles)
  if (roleNames && roleNames.length > 0) {
    const companyUsers = await prisma.companyUser.findMany({
      where: {
        companyId,
        roleName: { in: roleNames },
      },
      select: { userId: true },
    });
    targetUserIds.push(...companyUsers.map((cu) => cu.userId));
  }

  // Merge explicit user IDs
  if (userIds && userIds.length > 0) {
    targetUserIds.push(...userIds);
  }

  // Deduplicate
  targetUserIds = [...new Set(targetUserIds)];

  if (targetUserIds.length === 0) return 0;

  // Emit to each user (respecting individual preferences)
  let delivered = 0;
  await Promise.allSettled(
    targetUserIds.map(async (userId) => {
      const result = await notifyEvent(eventType, {
        companyId,
        userId,
        title,
        message,
        data,
        priority,
        link,
      });
      if (result) delivered++;
    })
  );

  return delivered;
}

// ─── Email Delivery (Stub) ───────────────────────────────────────────────────

/**
 * Queue an email notification.
 * In production, this would integrate with SendGrid/Resend/SES.
 * For now, logs the intent and creates a delivery record.
 */
async function queueEmailNotification(
  userId: string,
  companyId: string,
  notificationId: string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) return;

    // Create delivery log (QUEUED → would be updated to SENT by email service)
    await prisma.notificationDeliveryLog.create({
      data: {
        notificationId,
        companyId,
        userId,
        channel: "EMAIL",
        status: "QUEUED",
        providerInfo: {
          to: user.email,
          subject: title,
          body: message,
          link,
        },
      },
    });

    // TODO: Integrate with email provider (Resend, SendGrid, etc.)
    // await resend.emails.send({ to: user.email, subject: title, html: renderEmailTemplate(title, message, link) });

    console.log(`[NotificationEngine] 📧 Email queued for ${user.email}: ${title}`);
  } catch (error) {
    console.error(`[NotificationEngine] Email queue failed:`, error);
  }
}

// ─── Utility: Cleanup Old Notifications ──────────────────────────────────────

/**
 * Delete notifications older than `days` for a company.
 * Should be called by a cron job.
 */
export async function cleanupOldNotifications(companyId: string, days: number = 90): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await prisma.notification.deleteMany({
    where: {
      companyId,
      createdAt: { lt: cutoff },
      isRead: true,
    },
  });

  return result.count;
}

// ─── Utility: Get Unread Count ───────────────────────────────────────────────

export async function getUnreadCount(userId: string, companyId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, companyId, isRead: false },
  });
}

// ─── Utility: Get Notifications by Category ──────────────────────────────────

export async function getNotificationsByCategory(
  userId: string,
  companyId: string,
  category?: NotificationCategory,
  take: number = 30
) {
  return prisma.notification.findMany({
    where: {
      userId,
      companyId,
      ...(category ? { type: category } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
