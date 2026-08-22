/**
 * services/notification-service/src/queue/notification.queue.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Resilient BullMQ Queue System for Notification Delivery
 * Features:
 *   - Priority Queues (URGENT = 1, HIGH = 2, NORMAL = 3, LOW = 4)
 *   - Exponential Backoff Retries (5 attempts: 5s, 15s, 45s, 135s, 405s)
 *   - Dead Letter Queue (DLQ) for job inspection and replay
 */
import { Queue } from "bullmq";
import Redis from "ioredis";
export declare const redisConnection: Redis;
export interface NotificationJobData {
    id?: string;
    companyId: string;
    userIds: string[];
    title: string;
    message: string;
    type: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    channels: ("IN_APP" | "EMAIL" | "PUSH" | "SMS")[];
    data?: Record<string, unknown>;
    traceparent?: string;
    createdAt?: string;
}
export declare const dispatchQueue: Queue<NotificationJobData, any, string, NotificationJobData, any, string>;
export declare const emailQueue: Queue<NotificationJobData, any, string, NotificationJobData, any, string>;
export declare const smsQueue: Queue<NotificationJobData, any, string, NotificationJobData, any, string>;
export declare const pushQueue: Queue<NotificationJobData, any, string, NotificationJobData, any, string>;
export declare const dlqQueue: Queue<NotificationJobData & {
    errorReason?: string;
    failedAt?: string;
}, any, string, NotificationJobData & {
    errorReason?: string;
    failedAt?: string;
}, any, string>;
export declare function getPriorityValue(priority?: string): number;
export declare function enqueueNotification(jobData: NotificationJobData): Promise<import("bullmq").Job<NotificationJobData, any, string>>;
export declare function getDLQStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    total: number;
}>;
export declare function getDLQJobs(start?: number, end?: number): Promise<{
    id: string | undefined;
    name: string;
    data: NotificationJobData & {
        errorReason?: string;
        failedAt?: string;
    };
    failedReason: string;
    timestamp: number;
    processedOn: number | undefined;
    finishedOn: number | undefined;
}[]>;
export declare function replayDLQJob(jobId: string): Promise<{
    success: boolean;
    error: string;
    jobId?: undefined;
} | {
    success: boolean;
    jobId: string;
    error?: undefined;
}>;
export declare function purgeDLQ(): Promise<{
    success: boolean;
}>;
//# sourceMappingURL=notification.queue.d.ts.map