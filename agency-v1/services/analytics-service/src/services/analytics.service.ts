import { getPrismaAnalytics } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "analytics-service");

export interface TrackActivityInput {
  userId?: string;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AnalyticsService {
  /**
   * Obtener métricas y logs de uso por usuario
   */
  static async getUserActivityLogs(userId: string, limit = 50) {
    const prisma = getPrismaAnalytics();
    return (prisma as any).userActivityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  /**
   * Registrar evento de actividad en la base de datos segregada analytics
   */
  static async trackActivity(input: TrackActivityInput) {
    const prisma = getPrismaAnalytics();
    return prisma.$transaction(async (tx: any) => {
      const log = await tx.userActivityLog.create({
        data: {
          userId: input.userId || null,
          action: input.action,
          details: input.details || {},
          ipAddress: input.ipAddress || "127.0.0.1",
          userAgent: input.userAgent || "Internal"
        }
      });

      return log;
    });
  }
}
