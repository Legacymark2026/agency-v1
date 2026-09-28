"use strict";
/**
 * @agency/events — High-Throughput Realtime Redis Pub/Sub Hub
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides sub-50ms event broadcasting, tenant-scoped pub/sub channels,
 * and live updates for Multi-Channel Inbox and Video Render Studio.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeHub = exports.RedisPubSubHub = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class RedisPubSubHub {
    publisher;
    subscriber;
    handlers = new Map();
    isListening = false;
    constructor(redisUrl) {
        const url = redisUrl || process.env.REDIS_URL || "redis://127.0.0.1:6379";
        this.publisher = new ioredis_1.default(url, { maxRetriesPerRequest: 3, enableReadyCheck: true });
        this.subscriber = new ioredis_1.default(url, { maxRetriesPerRequest: 3, enableReadyCheck: true });
        this.publisher.on("error", (err) => console.warn("[RedisPubSubHub] Publisher notice:", err.message));
        this.subscriber.on("error", (err) => console.warn("[RedisPubSubHub] Subscriber notice:", err.message));
    }
    /**
     * Broadcast an event to all connected listeners in < 50ms
     */
    async broadcast(tenantId, eventType, data, traceId) {
        const startTime = Date.now();
        const channel = `tenant:${tenantId}:realtime`;
        const payload = {
            channel,
            tenantId,
            eventType,
            timestamp: new Date().toISOString(),
            data,
            traceId: traceId || `rt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        };
        try {
            await this.publisher.publish(channel, JSON.stringify(payload));
            const latency = Date.now() - startTime;
            return { success: true, dispatchLatencyMs: latency, channel };
        }
        catch (err) {
            console.error(`[RedisPubSubHub] Broadcast failed for ${eventType}:`, err.message);
            return { success: false, dispatchLatencyMs: Date.now() - startTime, channel };
        }
    }
    /**
     * Subscribe to real-time events for a specific tenant
     */
    async subscribeTenant(tenantId, handler) {
        const channel = `tenant:${tenantId}:realtime`;
        if (!this.handlers.has(channel)) {
            this.handlers.set(channel, new Set());
            await this.subscriber.subscribe(channel);
        }
        this.handlers.get(channel).add(handler);
        if (!this.isListening) {
            this.startMessageListener();
        }
        // Return unsubscribe callback
        return async () => {
            const set = this.handlers.get(channel);
            if (set) {
                set.delete(handler);
                if (set.size === 0) {
                    this.handlers.delete(channel);
                    await this.subscriber.unsubscribe(channel).catch(() => { });
                }
            }
        };
    }
    startMessageListener() {
        this.isListening = true;
        this.subscriber.on("message", (channel, message) => {
            try {
                const payload = JSON.parse(message);
                const listeners = this.handlers.get(channel);
                if (listeners) {
                    for (const fn of listeners) {
                        try {
                            fn(payload);
                        }
                        catch (err) {
                            console.error(`[RedisPubSubHub] Error in tenant listener for ${channel}:`, err);
                        }
                    }
                }
            }
            catch (err) {
                console.error(`[RedisPubSubHub] Failed to parse message on ${channel}:`, err);
            }
        });
    }
    async close() {
        await this.publisher.quit().catch(() => { });
        await this.subscriber.quit().catch(() => { });
        this.handlers.clear();
    }
}
exports.RedisPubSubHub = RedisPubSubHub;
exports.realtimeHub = new RedisPubSubHub();
//# sourceMappingURL=redis-pubsub-hub.js.map