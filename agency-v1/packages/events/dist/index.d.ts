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
import { z } from "zod";
export declare const leadCreatedSchema: z.ZodObject<{
    companyId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    companyId: string;
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    source?: string | undefined;
    status?: string | undefined;
}, {
    companyId: string;
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    source?: string | undefined;
    status?: string | undefined;
}>;
export declare const userCreatedSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name?: string | undefined;
}, {
    email: string;
    name?: string | undefined;
}>;
export declare const invoiceCreatedSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    invoiceId: z.ZodOptional<z.ZodString>;
    companyId: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    companyId?: string | undefined;
    status?: string | undefined;
    id?: string | undefined;
    invoiceId?: string | undefined;
    amount?: number | undefined;
}, {
    companyId?: string | undefined;
    status?: string | undefined;
    id?: string | undefined;
    invoiceId?: string | undefined;
    amount?: number | undefined;
}>, {
    companyId?: string | undefined;
    status?: string | undefined;
    id?: string | undefined;
    invoiceId?: string | undefined;
    amount?: number | undefined;
}, {
    companyId?: string | undefined;
    status?: string | undefined;
    id?: string | undefined;
    invoiceId?: string | undefined;
    amount?: number | undefined;
}>;
export declare const orderCompletedSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    id?: string | undefined;
    orderId?: string | undefined;
}, {
    userId: string;
    id?: string | undefined;
    orderId?: string | undefined;
}>, {
    userId: string;
    id?: string | undefined;
    orderId?: string | undefined;
}, {
    userId: string;
    id?: string | undefined;
    orderId?: string | undefined;
}>;
export declare const orderRefundedSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string | undefined;
    orderId?: string | undefined;
}, {
    id?: string | undefined;
    orderId?: string | undefined;
}>, {
    id?: string | undefined;
    orderId?: string | undefined;
}, {
    id?: string | undefined;
    orderId?: string | undefined;
}>;
export declare const affiliateClickRegisteredSchema: z.ZodObject<{
    code: z.ZodString;
    ip: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
    referer: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    ip?: string | undefined;
    userAgent?: string | undefined;
    referer?: string | undefined;
}, {
    code: string;
    ip?: string | undefined;
    userAgent?: string | undefined;
    referer?: string | undefined;
}>;
export declare const EVENT_SCHEMAS: Record<string, z.ZodSchema>;
export type LeadCreatedPayload = z.infer<typeof leadCreatedSchema>;
export type UserCreatedPayload = z.infer<typeof userCreatedSchema>;
export type InvoiceCreatedPayload = z.infer<typeof invoiceCreatedSchema>;
export type OrderCompletedPayload = z.infer<typeof orderCompletedSchema>;
export type OrderRefundedPayload = z.infer<typeof orderRefundedSchema>;
export type AffiliateClickRegisteredPayload = z.infer<typeof affiliateClickRegisteredSchema>;
export declare const EVENTS: {
    readonly "user.created": {
        readonly source: "auth-service";
    };
    readonly "user.role_changed": {
        readonly source: "auth-service";
    };
    readonly "user.deactivated": {
        readonly source: "auth-service";
    };
    readonly "lead.created": {
        readonly source: "crm-service";
    };
    readonly "lead.scored": {
        readonly source: "crm-service";
    };
    readonly "lead.converted": {
        readonly source: "crm-service";
    };
    readonly "deal.created": {
        readonly source: "crm-service";
    };
    readonly "deal.stage_changed": {
        readonly source: "crm-service";
    };
    readonly "deal.won": {
        readonly source: "crm-service";
    };
    readonly "deal.lost": {
        readonly source: "crm-service";
    };
    readonly "workflow.started": {
        readonly source: "automation-service";
    };
    readonly "workflow.completed": {
        readonly source: "automation-service";
    };
    readonly "workflow.failed": {
        readonly source: "automation-service";
    };
    readonly "workflow.ai_step": {
        readonly source: "automation-service";
    };
    readonly "campaign.launched": {
        readonly source: "automation-service";
    };
    readonly "social.published": {
        readonly source: "automation-service";
    };
    readonly "agent.response_ready": {
        readonly source: "ai-engine";
    };
    readonly "agent.suspended": {
        readonly source: "ai-engine";
    };
    readonly "agent.human_transfer": {
        readonly source: "ai-engine";
    };
    readonly "agent.memory_saved": {
        readonly source: "ai-engine";
    };
    readonly "message.received": {
        readonly source: "inbox-service";
    };
    readonly "message.sent": {
        readonly source: "inbox-service";
    };
    readonly "conversation.assigned": {
        readonly source: "inbox-service";
    };
    readonly "conversation.resolved": {
        readonly source: "inbox-service";
    };
    readonly "sla.breached": {
        readonly source: "inbox-service";
    };
    readonly "invoice.created": {
        readonly source: "finance-service";
    };
    readonly "invoice.paid": {
        readonly source: "finance-service";
    };
    readonly "payroll.processed": {
        readonly source: "finance-service";
    };
    readonly "expense.approved": {
        readonly source: "finance-service";
    };
    readonly "order.completed": {
        readonly source: "finance-service";
    };
    readonly "order.refunded": {
        readonly source: "finance-service";
    };
    readonly "affiliate.click_registered": {
        readonly source: "affiliate-service";
    };
    readonly "notification.dispatched": {
        readonly source: "notification-service";
    };
    readonly "notification.preferences_updated": {
        readonly source: "notification-service";
    };
    readonly "employee.created": {
        readonly source: "hr-service";
    };
    readonly "employee.updated": {
        readonly source: "hr-service";
    };
    readonly "employee.terminated": {
        readonly source: "hr-service";
    };
    readonly "payroll.generated": {
        readonly source: "hr-service";
    };
    readonly "payroll.paid": {
        readonly source: "hr-service";
    };
    readonly "timesheet.submitted": {
        readonly source: "hr-service";
    };
    readonly "project.created": {
        readonly source: "project-service";
    };
    readonly "project.completed": {
        readonly source: "project-service";
    };
    readonly "task.created": {
        readonly source: "project-service";
    };
    readonly "task.moved": {
        readonly source: "project-service";
    };
    readonly "task.completed": {
        readonly source: "project-service";
    };
};
export type EventName = keyof typeof EVENTS;
export interface EventPayload {
    eventId: string;
    timestamp: string;
    source: string;
    correlationId: string;
    data: Record<string, unknown>;
}
export declare class EventBus {
    private driver;
    private serviceName;
    private redisUrl?;
    private publisher?;
    private subscriber?;
    private localSubscribers;
    private kafkaClient?;
    private kafkaProducer?;
    private kafkaConsumers;
    constructor(redisUrl: string, serviceName: string);
    /**
     * Validate schemas using Zod
     */
    private validateEventSchema;
    /**
     * Publish an event to a Redis Stream or Kafka Topic
     */
    publish(event: EventName, data: Record<string, unknown>, correlationId?: string): Promise<string | null>;
    /**
     * Subscribe to an event stream using Consumer Groups (Redis) or Consumer Groups (Kafka)
     */
    subscribe(event: EventName, handler: (payload: EventPayload) => Promise<void>): Promise<void>;
    /**
     * Graceful shutdown
     */
    disconnect(): Promise<void>;
}
export default EventBus;
//# sourceMappingURL=index.d.ts.map