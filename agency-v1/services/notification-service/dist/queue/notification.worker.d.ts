/**
 * services/notification-service/src/queue/notification.worker.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Next-Gen Multi-Channel Asynchronous Worker Processor for BullMQ
 * Features:
 *   - OpenTelemetry Spans for distributed tracing of job execution
 *   - Cached user profiles from Redis to reduce PostgreSQL round-trips
 *   - Instant invalidation of unread_count cache upon IN_APP delivery
 *   - Circuit Breaker execution for Resend (Email) and Push/SMS
 *   - Automatic transfer to DLQ after 5 failed retries
 */
import { Worker } from "bullmq";
import { NotificationJobData } from "./notification.queue";
export declare function startNotificationWorker(): Worker<NotificationJobData, any, string>;
//# sourceMappingURL=notification.worker.d.ts.map