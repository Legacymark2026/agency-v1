/**
 * @agency/events — High-Throughput Realtime Redis Pub/Sub Hub
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides sub-50ms event broadcasting, tenant-scoped pub/sub channels,
 * and live updates for Multi-Channel Inbox and Video Render Studio.
 */
export interface RealtimeEventPayload<T = any> {
    channel: string;
    tenantId: string;
    eventType: string;
    timestamp: string;
    data: T;
    traceId?: string;
}
export declare class RedisPubSubHub {
    private publisher;
    private subscriber;
    private handlers;
    private isListening;
    constructor(redisUrl?: string);
    /**
     * Broadcast an event to all connected listeners in < 50ms
     */
    broadcast<T = any>(tenantId: string, eventType: string, data: T, traceId?: string): Promise<{
        success: boolean;
        dispatchLatencyMs: number;
        channel: string;
    }>;
    /**
     * Subscribe to real-time events for a specific tenant
     */
    subscribeTenant(tenantId: string, handler: (payload: RealtimeEventPayload) => void): Promise<() => void>;
    private startMessageListener;
    close(): Promise<void>;
}
export declare const realtimeHub: RedisPubSubHub;
//# sourceMappingURL=redis-pubsub-hub.d.ts.map