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
exports.EventBus = exports.EVENTS = exports.EVENT_SCHEMAS = exports.affiliateClickRegisteredSchema = exports.orderRefundedSchema = exports.orderCompletedSchema = exports.invoiceCreatedSchema = exports.userCreatedSchema = exports.leadCreatedSchema = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const zod_1 = require("zod");
// ─────────────────────────────────────────────────────────────────────────────
// Event Schemas using Zod
// ─────────────────────────────────────────────────────────────────────────────
exports.leadCreatedSchema = zod_1.z.object({
    companyId: zod_1.z.string({ required_error: "companyId is required" }),
    name: zod_1.z.string().optional(),
    email: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    source: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
});
exports.userCreatedSchema = zod_1.z.object({
    email: zod_1.z.string({ required_error: "email is required" }),
    name: zod_1.z.string().optional(),
});
exports.invoiceCreatedSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    invoiceId: zod_1.z.string().optional(),
    companyId: zod_1.z.string().optional(),
    amount: zod_1.z.number().optional(),
    status: zod_1.z.string().optional(),
}).refine(data => data.id || data.invoiceId, {
    message: "Either id or invoiceId is required",
    path: ["id"],
});
exports.orderCompletedSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    orderId: zod_1.z.string().optional(),
    userId: zod_1.z.string({ required_error: "userId is required" }),
}).refine(data => data.id || data.orderId, {
    message: "Either id or orderId is required",
    path: ["id"],
});
exports.orderRefundedSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    orderId: zod_1.z.string().optional(),
}).refine(data => data.id || data.orderId, {
    message: "Either id or orderId is required",
    path: ["id"],
});
exports.affiliateClickRegisteredSchema = zod_1.z.object({
    code: zod_1.z.string({ required_error: "code is required" }),
    ip: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional(),
    referer: zod_1.z.string().optional(),
});
// Mapping of EventNames to their Zod Schema
exports.EVENT_SCHEMAS = {
    "lead.created": exports.leadCreatedSchema,
    "user.created": exports.userCreatedSchema,
    "invoice.created": exports.invoiceCreatedSchema,
    "order.completed": exports.orderCompletedSchema,
    "order.refunded": exports.orderRefundedSchema,
    "affiliate.click_registered": exports.affiliateClickRegisteredSchema,
};
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
    // POS & Catalog Service Events
    "pos.session.opened": { source: "pos-service" },
    "pos.session.closed": { source: "pos-service" },
    "pos.order.created": { source: "pos-service" },
    "catalog.product.created": { source: "pos-service" },
    "catalog.product.updated": { source: "pos-service" },
    "catalog.stock.updated": { source: "pos-service" },
    "catalog.product.deleted": { source: "pos-service" },
};
// ─────────────────────────────────────────────────────────────────────────────
// Event Bus — Redis Streams Implementation
// ─────────────────────────────────────────────────────────────────────────────
class EventBus {
    driver;
    serviceName;
    // Redis fields
    redisUrl;
    publisher;
    subscriber;
    localSubscribers = [];
    // Kafka fields
    kafkaClient;
    kafkaProducer;
    kafkaConsumers = [];
    constructor(redisUrl, serviceName) {
        this.serviceName = serviceName;
        const driverEnv = process.env.EVENT_BUS_DRIVER || "redis";
        this.driver = driverEnv === "kafka" ? "kafka" : "redis";
        if (this.driver === "kafka") {
            try {
                const { Kafka } = require("kafkajs");
                const kafkaBrokers = (process.env.KAFKA_BROKERS || "redpanda:9092").split(",");
                this.kafkaClient = new Kafka({
                    clientId: serviceName,
                    brokers: kafkaBrokers,
                    retry: {
                        retries: 3
                    }
                });
                this.kafkaProducer = this.kafkaClient.producer();
                console.log(`[EventBus:${serviceName}] Initialized in Kafka mode.`);
            }
            catch (err) {
                console.error(`[EventBus:${serviceName}] Failed to initialize Kafka client, falling back to Redis:`, err.message);
                this.driver = "redis";
            }
        }
        if (this.driver === "redis") {
            this.redisUrl = redisUrl;
            this.publisher = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: 3 });
            this.subscriber = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: 3 });
            this.publisher.on("error", (err) => console.error(`[EventBus:${serviceName}] Publisher error:`, err.message));
            this.subscriber.on("error", (err) => console.error(`[EventBus:${serviceName}] Subscriber error:`, err.message));
            console.log(`[EventBus:${serviceName}] Initialized in Redis Streams mode.`);
        }
    }
    /**
     * Validate schemas using Zod
     */
    validateEventSchema(event, data) {
        const schema = exports.EVENT_SCHEMAS[event];
        if (schema) {
            const result = schema.safeParse(data);
            if (!result.success) {
                const errorMsg = result.error.errors
                    .map((err) => `${err.path.join(".")}: ${err.message}`)
                    .join(", ");
                throw new Error(`[SchemaRegistry] Validation failed for '${event}': ${errorMsg}`);
            }
        }
    }
    /**
     * Publish an event to a Redis Stream or Kafka Topic
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
        if (this.driver === "kafka" && this.kafkaProducer) {
            try {
                await this.kafkaProducer.connect();
                const topic = `events.${event}`;
                await this.kafkaProducer.send({
                    topic,
                    messages: [
                        { key: payload.correlationId, value: JSON.stringify(payload) }
                    ],
                });
                console.log(`[EventBus:${this.serviceName}] Published ${event} to Kafka topic ${topic} (trace: ${payload.correlationId})`);
                return payload.eventId;
            }
            catch (err) {
                console.error(`[EventBus:${this.serviceName}] Failed to publish to Kafka, falling back to Redis:`, err.message);
                if (!this.publisher) {
                    this.redisUrl = this.redisUrl || process.env.REDIS_URL || "redis://redis:6379";
                    this.publisher = new ioredis_1.default(this.redisUrl, { maxRetriesPerRequest: 3 });
                }
            }
        }
        if (this.publisher) {
            const streamKey = `events:${event}`;
            const messageId = await this.publisher.xadd(streamKey, "*", "payload", JSON.stringify(payload));
            console.log(`[EventBus:${this.serviceName}] Published ${event} to Redis Stream → ${messageId} (trace: ${payload.correlationId})`);
            return messageId;
        }
        return null;
    }
    /**
     * Subscribe to an event stream using Consumer Groups (Redis) or Consumer Groups (Kafka)
     */
    async subscribe(event, handler) {
        if (this.driver === "kafka" && this.kafkaClient) {
            try {
                const topic = `events.${event}`;
                const consumer = this.kafkaClient.consumer({ groupId: `group:${this.serviceName}` });
                await consumer.connect();
                await consumer.subscribe({ topic, fromBeginning: true });
                await consumer.run({
                    eachMessage: async ({ message }) => {
                        if (!message.value)
                            return;
                        const payload = JSON.parse(message.value.toString());
                        await handler(payload);
                    }
                });
                this.kafkaConsumers.push(consumer);
                console.log(`[EventBus:${this.serviceName}] Subscribed to Kafka topic ${topic}`);
                return;
            }
            catch (err) {
                console.error(`[EventBus:${this.serviceName}] Failed to subscribe to Kafka, falling back to Redis:`, err.message);
            }
        }
        const streamKey = `events:${event}`;
        const groupName = `group:${this.serviceName}`;
        const consumerName = `${this.serviceName}-${process.pid}`;
        if (!this.redisUrl) {
            this.redisUrl = process.env.REDIS_URL || "redis://redis:6379";
        }
        if (!this.subscriber) {
            this.subscriber = new ioredis_1.default(this.redisUrl, { maxRetriesPerRequest: 3 });
        }
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
                                    await this.publisher?.del(attemptKey).catch(() => { });
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
                                        await this.publisher?.xadd("events:dead-letter", "*", "payload", JSON.stringify(dlqPayload));
                                        // Acknowledge to stop retry cycle
                                        await this.subscriber.xack(streamKey, groupName, messageId);
                                        await this.publisher?.del(attemptKey).catch(() => { });
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
        console.log(`[EventBus:${this.serviceName}] Subscribed to ${event} via Redis Streams`);
    }
    /**
     * Graceful shutdown
     */
    async disconnect() {
        if (this.publisher)
            await this.publisher.quit();
        if (this.subscriber)
            await this.subscriber.quit();
        for (const sub of this.localSubscribers) {
            await sub.quit().catch(() => { });
        }
        if (this.kafkaProducer) {
            await this.kafkaProducer.disconnect().catch(() => { });
        }
        for (const consumer of this.kafkaConsumers) {
            await consumer.disconnect().catch(() => { });
        }
        console.log(`[EventBus:${this.serviceName}] Disconnected`);
    }
}
exports.EventBus = EventBus;
exports.default = EventBus;
//# sourceMappingURL=index.js.map