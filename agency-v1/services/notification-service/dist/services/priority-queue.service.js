"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityQueueService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
class PriorityQueueService {
    static redis = null;
    static getRedisClient() {
        if (!this.redis) {
            this.redis = new ioredis_1.default(REDIS_URL, {
                maxRetriesPerRequest: 3,
                enableReadyCheck: false
            });
            this.redis.on("error", (err) => {
                console.warn("[PriorityQueueService] Redis connection error:", err.message);
            });
        }
        return this.redis;
    }
    /**
     * Encola una notificación en una cola con prioridad.
     * Mensajes HIGH prioridad van a una cola preferente procesada antes que la cola LOW.
     */
    static async enqueueNotification(payload, priority = "LOW") {
        console.log(`[PriorityQueueService] Enqueuing notification with priority [${priority}]`);
        const queueName = priority === "HIGH" ? "notifications:queue:high" : "notifications:queue:low";
        const serializedPayload = JSON.stringify({
            ...payload,
            priority,
            enqueuedAt: new Date().toISOString()
        });
        let success = false;
        try {
            const client = this.getRedisClient();
            await client.rpush(queueName, serializedPayload);
            success = true;
        }
        catch (err) {
            console.warn(`[PriorityQueueService] Failed to enqueue on Redis:`, err.message);
        }
        return {
            success,
            queueName,
            priority,
            messageId: payload.messageId || `msg-${Math.random().toString(36).substring(2, 7)}`,
            status: success ? "ENQUEUED" : "FAILED_FALLBACK_STUB"
        };
    }
}
exports.PriorityQueueService = PriorityQueueService;
//# sourceMappingURL=priority-queue.service.js.map