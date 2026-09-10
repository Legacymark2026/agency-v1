/**
 * Notification Service — Prisma Infrastructure Adapter (Driven Outbound Port)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { prisma } from "@agency/database";
import { INotificationRepositoryPort } from "../core/ports/notification.ports";
import { NotificationDomain } from "../core/domain/notification.domain";

export class PrismaNotificationAdapter implements INotificationRepositoryPort {
  public async save(notif: NotificationDomain): Promise<NotificationDomain> {
    try {
      await (prisma as any).notification.upsert({
        where: { id: notif.id },
        update: {
          isRead: notif.isRead,
          title: notif.title,
          message: notif.message,
        },
        create: {
          id: notif.id,
          userId: notif.userId,
          companyId: notif.companyId,
          title: notif.title,
          message: notif.message,
          channel: notif.channel,
          priority: notif.priority,
          isRead: notif.isRead,
          metadata: notif.metadata,
        },
      });
    } catch {}
    return notif;
  }

  public async findById(id: string): Promise<NotificationDomain | null> {
    try {
      const row = await (prisma as any).notification.findUnique({ where: { id } });
      if (!row) return null;
      return new NotificationDomain(
        row.id,
        row.userId,
        row.companyId,
        row.title,
        row.message,
        row.channel,
        row.priority,
        row.isRead,
        typeof row.metadata === "string" ? JSON.parse(row.metadata) : (row.metadata || {}),
        row.createdAt
      );
    } catch {
      return null;
    }
  }

  public async countByUser(userId: string): Promise<{ total: number; read: number }> {
    try {
      const [total, read] = await Promise.all([
        (prisma as any).notification.count({ where: { userId } }),
        (prisma as any).notification.count({ where: { userId, isRead: true } }),
      ]);
      return { total, read };
    } catch {
      return { total: 0, read: 0 };
    }
  }
}
