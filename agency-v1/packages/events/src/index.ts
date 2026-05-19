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

import Redis from "ioredis";

// ─────────────────────────────────────────────────────────────────────────────
// Event Definitions — Single Source of Truth
// ─────────────────────────────────────────────────────────────────────────────

export const EVENTS = {
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
} as const;

export type EventName = keyof typeof EVENTS;

export interface EventPayload {
  eventId: string;
  timestamp: string;
  source: string;
  data: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Bus — Redis Streams Implementation
// ─────────────────────────────────────────────────────────────────────────────

export class EventBus {
  private publisher: Redis;
  private subscriber: Redis;
  private serviceName: string;

  constructor(redisUrl: string, serviceName: string) {
    this.publisher = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
    this.subscriber = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
    this.serviceName = serviceName;

    this.publisher.on("error", (err) =>
      console.error(`[EventBus:${serviceName}] Publisher error:`, err.message)
    );
    this.subscriber.on("error", (err) =>
      console.error(`[EventBus:${serviceName}] Subscriber error:`, err.message)
    );
  }

  /**
   * Publish an event to a Redis Stream
   */
  async publish(event: EventName, data: Record<string, unknown>): Promise<string | null> {
    const payload: EventPayload = {
      eventId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
      source: this.serviceName,
      data,
    };

    const streamKey = `events:${event}`;
    const messageId = await this.publisher.xadd(
      streamKey,
      "*",
      "payload",
      JSON.stringify(payload)
    );

    console.log(`[EventBus:${this.serviceName}] Published ${event} → ${messageId}`);
    return messageId;
  }

  /**
   * Subscribe to an event stream using Consumer Groups
   * Each service gets its own consumer group to ensure at-least-once delivery
   */
  async subscribe(
    event: EventName,
    handler: (payload: EventPayload) => Promise<void>
  ): Promise<void> {
    const streamKey = `events:${event}`;
    const groupName = `group:${this.serviceName}`;
    const consumerName = `${this.serviceName}-${process.pid}`;

    // Create consumer group if it doesn't exist
    try {
      await this.subscriber.xgroup("CREATE", streamKey, groupName, "0", "MKSTREAM");
    } catch {
      // Group already exists — safe to continue
    }

    // Start polling loop
    const poll = async () => {
      while (true) {
        try {
          const results = await this.subscriber.xreadgroup(
            "GROUP",
            groupName,
            consumerName,
            "COUNT",
            10,
            "BLOCK",
            5000,
            "STREAMS",
            streamKey,
            ">"
          ) as [string, [string, string[]][]][] | null;

          if (!results) continue;

          for (const entry of results) {
            const [, messages] = entry;
            for (const [messageId, fields] of messages) {
              try {
                const payload: EventPayload = JSON.parse(fields[1]);
                await handler(payload);
                // Acknowledge successful processing
                await this.subscriber.xack(streamKey, groupName, messageId);
              } catch (err) {
                console.error(
                  `[EventBus:${this.serviceName}] Error processing ${event}:${messageId}:`,
                  err
                );
                // Message will be re-delivered on next XREADGROUP with pending entries
              }
            }
          }
        } catch (err) {
          console.error(`[EventBus:${this.serviceName}] Poll error:`, err);
          await new Promise((r) => setTimeout(r, 2000)); // backoff
        }
      }
    };

    // Start in background
    poll().catch((err) =>
      console.error(`[EventBus:${this.serviceName}] Fatal poll error:`, err)
    );

    console.log(`[EventBus:${this.serviceName}] Subscribed to ${event}`);
  }

  /**
   * Graceful shutdown
   */
  async disconnect(): Promise<void> {
    await this.publisher.quit();
    await this.subscriber.quit();
    console.log(`[EventBus:${this.serviceName}] Disconnected`);
  }
}

export default EventBus;
