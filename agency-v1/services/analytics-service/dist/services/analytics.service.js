"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "analytics-service");
class AnalyticsService {
    /**
     * Obtener métricas y logs de uso por usuario
     */
    static async getUserActivityLogs(userId, limit = 50) {
        const prisma = (0, database_1.getPrismaAnalytics)();
        return prisma.userActivityLog.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit
        });
    }
    /**
     * Registrar evento de actividad en la base de datos segregada analytics
     */
    static async trackActivity(input) {
        const prisma = (0, database_1.getPrismaAnalytics)();
        return prisma.$transaction(async (tx) => {
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
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map