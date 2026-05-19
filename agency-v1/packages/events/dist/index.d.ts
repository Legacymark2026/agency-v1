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
    data: Record<string, unknown>;
}
export declare class EventBus {
    private publisher;
    private subscriber;
    private serviceName;
    constructor(redisUrl: string, serviceName: string);
    /**
     * Publish an event to a Redis Stream
     */
    publish(event: EventName, data: Record<string, unknown>): Promise<string | null>;
    /**
     * Subscribe to an event stream using Consumer Groups
     * Each service gets its own consumer group to ensure at-least-once delivery
     */
    subscribe(event: EventName, handler: (payload: EventPayload) => Promise<void>): Promise<void>;
    /**
     * Graceful shutdown
     */
    disconnect(): Promise<void>;
}
export default EventBus;
//# sourceMappingURL=index.d.ts.map