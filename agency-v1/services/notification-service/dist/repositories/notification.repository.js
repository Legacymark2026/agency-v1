"use strict";
/**
 * services/notification-service/src/repositories/notification.repository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Notification Repository Implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepository = exports.PrismaNotificationRepository = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "notification-repository");
class PrismaNotificationRepository {
    async findMany(params) {
        try {
            const notifications = await database_1.prisma.notification.findMany(params);
            return notifications;
        }
        catch (err) {
            console.error(`[PrismaNotificationRepository] findMany error: ${err.message}`);
            throw err;
        }
    }
    async count(where) {
        try {
            return await database_1.prisma.notification.count({ where });
        }
        catch (err) {
            console.error(`[PrismaNotificationRepository] count error: ${err.message}`);
            throw err;
        }
    }
    async createMany(data) {
        try {
            const result = await database_1.prisma.notification.createMany({ data });
            // Dual-Write/CDC synchronization
            for (const item of data) {
                await eventBus.publish("invoice.created", {
                    id: item.userId,
                    companyId: item.companyId,
                    amount: 0,
                    status: "notification-sent"
                }).catch(() => { });
            }
            return result;
        }
        catch (err) {
            console.error(`[PrismaNotificationRepository] createMany error: ${err.message}`);
            throw err;
        }
    }
    async updateMany(params) {
        try {
            return await database_1.prisma.notification.updateMany(params);
        }
        catch (err) {
            console.error(`[PrismaNotificationRepository] updateMany error: ${err.message}`);
            throw err;
        }
    }
    async deleteMany(params) {
        try {
            return await database_1.prisma.notification.deleteMany(params);
        }
        catch (err) {
            console.error(`[PrismaNotificationRepository] deleteMany error: ${err.message}`);
            throw err;
        }
    }
}
exports.PrismaNotificationRepository = PrismaNotificationRepository;
exports.notificationRepository = new PrismaNotificationRepository();
//# sourceMappingURL=notification.repository.js.map