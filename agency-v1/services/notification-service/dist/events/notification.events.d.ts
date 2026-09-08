/**
 * Platform Event Subscriptions — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Subscribes to 32 enterprise events across CRM, Finance, Automation, AI, and IAM
 * and automatically notifies admins and target roles in-app and via configured channels.
 */
import { EventBus } from "@agency/events";
export declare const EVENT_MAPPINGS: Record<string, {
    type: string;
    titleFn: (data: any) => string;
    roles?: string[];
}>;
export declare function subscribePlatformEvents(eventBus: EventBus): void;
//# sourceMappingURL=notification.events.d.ts.map