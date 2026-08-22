"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "notification-service");
class NotificationService {
    /**
     * Obtener notificaciones del usuario
     */
    static async getUserNotifications(userId, unreadOnly = false, limit = 20) {
        const where = { userId };
        if (unreadOnly)
            where.isRead = false;
        return database_1.prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit
        });
    }
    /**
     * Enviar notificación con transacción atómica
     */
    static async dispatchNotification(input) {
        return database_1.prisma.$transaction(async (tx) => {
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
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map