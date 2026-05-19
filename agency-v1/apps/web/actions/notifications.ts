'use server';

/**
 * actions/notifications.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Enterprise Notification Server Actions
 *
 * Provides CRUD operations for notifications and user preference management.
 * All actions are session-gated and company-scoped.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  NOTIFICATION_EVENTS,
  CATEGORY_META,
  type NotificationEventType,
  type NotificationCategory,
  type DeliveryChannel,
} from "@/lib/notifications/notification-types";
import { notifyUsers } from "@/lib/notifications/notification-engine";

// ─── Session Helper ──────────────────────────────────────────────────────────

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.companyId) {
    throw new Error("No autorizado");
  }
  return { userId: session.user.id, companyId: session.user.companyId as string, role: session.user.role as string };
}

// ─── Core: Get Notifications ─────────────────────────────────────────────────

export async function getNotifications(params?: {
  category?: NotificationCategory;
  onlyUnread?: boolean;
  take?: number;
  cursor?: string;
}) {
  try {
    const { userId, companyId } = await requireSession();
    const take = params?.take || 30;

    const where: any = {
      userId,
      companyId,
      ...(params?.category ? { type: params.category } : {}),
      ...(params?.onlyUnread ? { isRead: false } : {}),
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: take + 1, // Fetch one extra to detect hasMore
      ...(params?.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });

    const hasMore = notifications.length > take;
    const data = hasMore ? notifications.slice(0, take) : notifications;

    const unreadCount = await prisma.notification.count({
      where: { userId, companyId, isRead: false },
    });

    // Group by date for UI rendering
    const grouped = groupNotificationsByDate(data);

    return {
      success: true,
      data,
      grouped,
      unreadCount,
      hasMore,
      nextCursor: hasMore ? data[data.length - 1]?.id : undefined,
    };
  } catch (error) {
    console.error("[notifications] Fetch failed:", error);
    return { success: false, data: [], grouped: {}, unreadCount: 0, hasMore: false };
  }
}

// ─── Get Unread Count Only (lightweight) ─────────────────────────────────────

export async function getUnreadNotificationCount() {
  try {
    const { userId, companyId } = await requireSession();
    const count = await prisma.notification.count({
      where: { userId, companyId, isRead: false },
    });
    return { success: true, count };
  } catch {
    return { success: false, count: 0 };
  }
}

// ─── Mark Single as Read ─────────────────────────────────────────────────────

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { userId } = await requireSession();

    await prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ─── Mark All as Read ────────────────────────────────────────────────────────

export async function markAllNotificationsAsRead(category?: NotificationCategory) {
  try {
    const { userId, companyId } = await requireSession();

    await prisma.notification.updateMany({
      where: {
        userId,
        companyId,
        isRead: false,
        ...(category ? { type: category } : {}),
      },
      data: { isRead: true, readAt: new Date() },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ─── Delete Notification ─────────────────────────────────────────────────────

export async function deleteNotification(notificationId: string) {
  try {
    const { userId } = await requireSession();

    await prisma.notification.delete({
      where: { id: notificationId, userId },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ─── Delete All Read Notifications ───────────────────────────────────────────

export async function clearReadNotifications() {
  try {
    const { userId, companyId } = await requireSession();

    const result = await prisma.notification.deleteMany({
      where: { userId, companyId, isRead: true },
    });

    revalidatePath("/", "layout");
    return { success: true, deleted: result.count };
  } catch {
    return { success: false, deleted: 0 };
  }
}

// ─── Notification Preferences ────────────────────────────────────────────────

export async function getNotificationPreferences() {
  try {
    const { userId, companyId } = await requireSession();

    const prefs = await prisma.notificationPreference.findMany({
      where: { userId, companyId },
    });

    // Build a complete matrix: every event × every channel
    const matrix: Record<string, Record<string, boolean>> = {};

    for (const [eventType, meta] of Object.entries(NOTIFICATION_EVENTS)) {
      if (!meta.userConfigurable) continue;

      matrix[eventType] = {};
      for (const channel of ["IN_APP", "EMAIL"] as const) {
        const pref = prefs.find((p) => p.event === eventType && p.channel === channel);
        matrix[eventType][channel] = pref ? pref.enabled : (meta.defaultChannels as readonly string[]).includes(channel);
      }
    }

    return { success: true, preferences: matrix, categories: CATEGORY_META };
  } catch (error) {
    return { success: false, preferences: {}, categories: {} };
  }
}

export async function updateNotificationPreference(
  eventType: string,
  channel: string,
  enabled: boolean
) {
  try {
    const { userId, companyId } = await requireSession();

    // Validate event type
    if (!(eventType in NOTIFICATION_EVENTS)) {
      return { success: false, error: "Tipo de evento inválido" };
    }

    const meta = NOTIFICATION_EVENTS[eventType as NotificationEventType];
    if (!meta.userConfigurable) {
      return { success: false, error: "Este tipo de notificación no se puede configurar" };
    }

    await prisma.notificationPreference.upsert({
      where: {
        userId_companyId_channel_event: {
          userId,
          companyId,
          channel,
          event: eventType,
        },
      },
      create: {
        userId,
        companyId,
        channel,
        event: eventType,
        enabled,
      },
      update: { enabled },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar preferencia" };
  }
}

// ─── Admin: Bulk Notification ────────────────────────────────────────────────

export async function sendBulkNotification(params: {
  title: string;
  message: string;
  targetRoles?: string[];
  targetUserIds?: string[];
  link?: string;
}) {
  try {
    const { companyId, role } = await requireSession();

    // Only admins can send bulk notifications
    if (!["super_admin", "admin"].includes(role?.toLowerCase())) {
      return { success: false, error: "Solo administradores pueden enviar notificaciones masivas" };
    }

    const delivered = await notifyUsers("SYSTEM.MAINTENANCE", {
      companyId,
      title: params.title,
      message: params.message,
      roles: params.targetRoles,
      userIds: params.targetUserIds,
      link: params.link,
    });

    return { success: true, delivered };
  } catch (error) {
    return { success: false, error: "Error al enviar notificaciones" };
  }
}

// ─── Internal: Create Local Notification (backward compat) ───────────────────

export async function createLocalNotification(params: {
  companyId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

// ─── Utility: Group by Date ──────────────────────────────────────────────────

function groupNotificationsByDate(notifications: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const notif of notifications) {
    const date = new Date(notif.createdAt);
    let key: string;

    if (date.toDateString() === today.toDateString()) {
      key = "Hoy";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "Ayer";
    } else {
      key = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(notif);
  }

  return groups;
}
