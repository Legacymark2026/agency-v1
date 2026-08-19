/**
 * services/notification-service/src/repositories/notification.repository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Notification Repository Implementation
 */

import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "notification-repository");

export interface NotificationEntity {
  id: string;
  userId: string;
  companyId?: string | null;
  title: string;
  message?: string | null;
  type?: string | null;
  isRead: boolean;
  data?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationRepository {
  findMany(params: {
    where: any;
    orderBy?: any;
    take?: number;
    skip?: number;
  }): Promise<NotificationEntity[]>;
  count(where: any): Promise<number>;
  createMany(data: Array<{
    userId: string;
    companyId: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    data?: string;
  }>): Promise<{ count: number }>;
  updateMany(params: {
    where: any;
    data: any;
  }): Promise<{ count: number }>;
  deleteMany(params: {
    where: any;
  }): Promise<{ count: number }>;
}

export class PrismaNotificationRepository implements INotificationRepository {
  async findMany(params: {
    where: any;
    orderBy?: any;
    take?: number;
    skip?: number;
  }): Promise<NotificationEntity[]> {
    try {
      const notifications = await prisma.notification.findMany(params);
      return notifications as NotificationEntity[];
    } catch (err: any) {
      console.error(`[PrismaNotificationRepository] findMany error: ${err.message}`);
      throw err;
    }
  }

  async count(where: any): Promise<number> {
    try {
      return await prisma.notification.count({ where });
    } catch (err: any) {
      console.error(`[PrismaNotificationRepository] count error: ${err.message}`);
      throw err;
    }
  }

  async createMany(data: Array<{
    userId: string;
    companyId: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    data?: string;
  }>): Promise<{ count: number }> {
    try {
      const result = await prisma.notification.createMany({ data });
      
      // Dual-Write/CDC synchronization
      for (const item of data) {
        await eventBus.publish("invoice.created", {
          id: item.userId,
          companyId: item.companyId,
          amount: 0,
          status: "notification-sent"
        }).catch(() => {});
      }

      return result;
    } catch (err: any) {
      console.error(`[PrismaNotificationRepository] createMany error: ${err.message}`);
      throw err;
    }
  }

  async updateMany(params: { where: any; data: any }): Promise<{ count: number }> {
    try {
      return await prisma.notification.updateMany(params);
    } catch (err: any) {
      console.error(`[PrismaNotificationRepository] updateMany error: ${err.message}`);
      throw err;
    }
  }

  async deleteMany(params: { where: any }): Promise<{ count: number }> {
    try {
      return await prisma.notification.deleteMany(params);
    } catch (err: any) {
      console.error(`[PrismaNotificationRepository] deleteMany error: ${err.message}`);
      throw err;
    }
  }
}

export const notificationRepository = new PrismaNotificationRepository();
