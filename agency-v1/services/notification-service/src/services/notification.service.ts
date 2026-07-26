import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "notification-service");

export interface DispatchNotificationInput {
  userId: string;
  companyId?: string;
  type: string;
  title: string;
  body: string;
  channel?: "IN_APP" | "EMAIL" | "PUSH";
  metadata?: any;
}

export class NotificationService {
  /**
   * Obtener notificaciones del usuario
   */
  static async getUserNotifications(userId: string, unreadOnly = false, limit = 20) {
    const where: Record<string, unknown> = { userId };
    if (unreadOnly) where.isRead = false;

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  /**
   * Enviar notificación con transacción atómica
   */
  static async dispatchNotification(input: DispatchNotificationInput) {
    return prisma.$transaction(async (tx: any) => {
      const notification = await tx.notification.create({
        data: {
          userId: input.userId,
          companyId: input.companyId,
          type: input.type,
          title: input.title,
          body: input.body,
          channel: input.channel || "IN_APP",
          metadata: input.metadata || {},
          isRead: false
        }
      });

      await eventBus.publish("notification.dispatched", {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        channel: notification.channel,
        timestamp: new Date().toISOString()
      });

      return notification;
    });
  }
}
