"use strict";
/**
 * @agency/events — Redis Streams Event Bus
 * ─────────────────────────────────────────────────────────────────────────────
 * Pub/Sub inter-service communication via Redis Streams.
 *
 * Usage:
 *   import { EventBus, EVENTS } from "@agency/events";
 *   const bus = new EventBus(process.env.REDIS_URL!);
 *   await bus.publish("lead.created", { leadId: "...", companyId: "..." });
 *   await bus.subscribe("lead.created", "crm-service", handler);
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = exports.EVENTS = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
// ─────────────────────────────────────────────────────────────────────────────
// Event Definitions — Single Source of Truth
// ─────────────────────────────────────────────────────────────────────────────
exports.EVENTS = {
    // Auth Service Events
    "user.created": { source: "auth-service" },
    "user.role_changed": { source: "auth-service" },
    "user.deactivated": { source: "auth-service" },
    // CRM Service Events
    "lead.created": { source: "crm-service" },
    "lead.scored": { source: "crm-service" },
    "lead.converted": { source: "crm-service" },
    "deal.created": { source: "crm-service" },
    "deal.stage_changed": { source: "crm-service" },
    "deal.won": { source: "crm-service" },
    "deal.lost": { source: "crm-service" },
    // Automation Service Events
    "workflow.started": { source: "automation-service" },
    "workflow.completed": { source: "automation-service" },
    "workflow.failed": { source: "automation-service" },
    "workflow.ai_step": { source: "automation-service" },
    "campaign.launched": { source: "automation-service" },
    "social.published": { source: "automation-service" },
    // AI Engine Events
    "agent.response_ready": { source: "ai-engine" },
    "agent.suspended": { source: "ai-engine" },
    "agent.human_transfer": { source: "ai-engine" },
    "agent.memory_saved": { source: "ai-engine" },
    // Inbox Service Events
    "message.received": { source: "inbox-service" },
    "message.sent": { source: "inbox-service" },
    "conversation.assigned": { source: "inbox-service" },
    "conversation.resolved": { source: "inbox-service" },
    "sla.breached": { source: "inbox-service" },
    // Finance Service Events
    "invoice.created": { source: "finance-service" },
    "invoice.paid": { source: "finance-service" },
    "payroll.processed": { source: "finance-service" },
    "expense.approved": { source: "finance-service" },
    "order.completed": { source: "finance-service" },
    "order.refunded": { source: "finance-service" },
    // Affiliate Service Events
    "affiliate.click_registered": { source: "affiliate-service" },
    // Notification Service Events
    "notification.dispatched": { source: "notification-service" },
    "notification.preferences_updated": { source: "notification-service" },
    // HR Service Events  
    "employee.created": { source: "hr-service" },
    "employee.updated": { source: "hr-service" },
    "employee.terminated": { source: "hr-service" },
    "payroll.generated": { source: "hr-service" },
    "payroll.paid": { source: "hr-service" },
    "timesheet.submitted": { source: "hr-service" },
    // Project Service Events
    "project.created": { source: "project-service" },
    "project.completed": { source: "project-service" },
    "task.created": { source: "project-service" },
    "task.moved": { source: "project-service" },
    "task.completed": { source: "project-service" },
};
// ─────────────────────────────────────────────────────────────────────────────
// Event Bus — Redis Streams Implementation
// ─────────────────────────────────────────────────────────────────────────────
class EventBus {
    redisUrl;
    publisher;
    subscriber;
    localSubscribers = [];
    serviceName;
    constructor(redisUrl, serviceName) {
        this.redisUrl = redisUrl;
        this.publisher = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: 3 });
        this.subscriber = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: 3 });
        this.serviceName = serviceName;
        this.publisher.on("error", (err) => console.error(`[EventBus:${serviceName}] Publisher error:`, err.message));
        this.subscriber.on("error", (err) => console.error(`[EventBus:${serviceName}] Subscriber error:`, err.message));
    }
    /**
     * Validate schemas natively
     */
    validateEventSchema(event, data) {
        switch (event) {
            case "lead.created":
                if (!data.companyId) {
                    throw new Error(`[SchemaRegistry] Validation failed for 'lead.created': companyId is required`);
                }
                break;
            case "user.created":
                if (!data.email) {
                    throw new Error(`[SchemaRegistry] Validation failed for 'user.created': email is required`);
                }
                break;
            case "invoice.created":
                if (!data.invoiceId && !data.id) {
                    throw new Error(`[SchemaRegistry] Validation failed for 'invoice.created': invoiceId/id is required`);
                }
                break;
            case "order.completed":
                if (!data.orderId && !data.id) {
                    throw new Error(`[SchemaRegistry] Validation failed for 'order.completed': orderId is required`);
                }
                if (!data.userId) {
                    throw new Error(`[SchemaRegistry] Validation failed for 'order.completed': userId is required`);
                }
                break;
            case "order.refunded":
                if (!data.orderId && !data.id) {
                    throw new Error(`[SchemaRegistry] Validation failed for 'order.refunded': orderId is required`);
                }
                break;
            case "affiliate.click_registered":
                if (!data.code) {
                    throw new Error(`[SchemaRegistry] Validation failed for 'affiliate.click_registered': code is required`);
                }
                break;
        }
    }
    /**
     * Publish an event to a Redis Stream
     */
    async publish(event, data, correlationId) {
        // Validate schema before publishing
        this.validateEventSchema(event, data);
        const payload = {
            eventId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: new Date().toISOString(),
            source: this.serviceName,
            correlationId: correlationId || `trace-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            data,
        };
        const streamKey = `events:${event}`;
        const messageId = await this.publisher.xadd(streamKey, "*", "payload", JSON.stringify(payload));
        console.log(`[EventBus:${this.serviceName}] Published ${event} → ${messageId} (trace: ${payload.correlationId})`);
        return messageId;
    }
    /**
     * Subscribe to an event stream using Consumer Groups
     * Each service gets its own consumer group to ensure at-least-once delivery
     */
    async subscribe(event, handler) {
        const streamKey = `events:${event}`;
        const groupName = `group:${this.serviceName}`;
        const consumerName = `${this.serviceName}-${process.pid}`;
        // Create a dedicated Redis subscriber client for this subscription's blocking loop
        const localSubscriber = new ioredis_1.default(this.redisUrl, { maxRetriesPerRequest: 3 });
        localSubscriber.on("error", (err) => console.error(`[EventBus:${this.serviceName}] Local subscriber error for ${event}:`, err.message));
        this.localSubscribers.push(localSubscriber);
        // Create consumer group if it doesn't exist
        try {
            await this.subscriber.xgroup("CREATE", streamKey, groupName, "0", "MKSTREAM");
        }
        catch {
            // Group already exists — safe to continue
        }
        // Start polling loop
        const poll = async () => {
            while (true) {
                try {
                    const results = await localSubscriber.xreadgroup("GROUP", groupName, consumerName, "COUNT", 10, "BLOCK", 5000, "STREAMS", streamKey, ">");
                    if (!results)
                        continue;
                    for (const entry of results) {
                        const [, messages] = entry;
                        for (const [messageId, fields] of messages) {
                            const attemptKey = `dlq:attempts:${groupName}:${messageId}`;
                            try {
                                const payload = JSON.parse(fields[1]);
                                try {
                                    await handler(payload);
                                    // Acknowledge successful processing
                                    await this.subscriber.xack(streamKey, groupName, messageId);
                                    // Cleanup attempts counter if it was created
                                    await this.publisher.del(attemptKey).catch(() => { });
                                }
                                catch (err) {
                                    console.error(`[EventBus:${this.serviceName}] Error processing ${event}:${messageId}:`, err);
                                    // Increment attempts
                                    const attempts = await this.subscriber.incr(attemptKey);
                                    await this.subscriber.expire(attemptKey, 86400); // 1 day TTL
                                    if (attempts >= 3) {
                                        console.error(`[EventBus:${this.serviceName}] Message ${messageId} exceeded max attempts (3). Moving to DLQ.`);
                                        const dlqPayload = {
                                            originalEvent: event,
                                            originalMessageId: messageId,
                                            consumerGroup: groupName,
                                            payload,
                                            error: err instanceof Error ? err.message : String(err),
                                            timestamp: new Date().toISOString()
                                        };
                                        // Move to dead letter stream
                                        await this.publisher.xadd("events:dead-letter", "*", "payload", JSON.stringify(dlqPayload));
                                        // Acknowledge to stop retry cycle
                                        await this.subscriber.xack(streamKey, groupName, messageId);
                                        await this.publisher.del(attemptKey).catch(() => { });
                                    }
                                }
                            }
                            catch (parseErr) {
                                console.error(`[EventBus:${this.serviceName}] Error parsing message payload ${messageId}:`, parseErr);
                                // Corrupt payload, acknowledge immediately to prevent blocking the stream
                                await this.subscriber.xack(streamKey, groupName, messageId);
                            }
                        }
                    }
                }
                catch (err) {
                    console.error(`[EventBus:${this.serviceName}] Poll error:`, err);
                    await new Promise((r) => setTimeout(r, 2000)); // backoff
                }
            }
        };
        // Start in background
        poll().catch((err) => console.error(`[EventBus:${this.serviceName}] Fatal poll error:`, err));
        console.log(`[EventBus:${this.serviceName}] Subscribed to ${event}`);
    }
    /**
     * Graceful shutdown
     */
    async disconnect() {
        await this.publisher.quit();
        await this.subscriber.quit();
        for (const sub of this.localSubscribers) {
            await sub.quit().catch(() => { });
        }
        console.log(`[EventBus:${this.serviceName}] Disconnected`);
    }
}
exports.EventBus = EventBus;
exports.default = EventBus;
//# sourceMappingURL=index.js.map