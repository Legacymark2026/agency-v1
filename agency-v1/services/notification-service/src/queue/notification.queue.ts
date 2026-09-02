/**
 * services/notification-service/src/queue/notification.queue.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Resilient BullMQ Queue System for Notification Delivery
 * Features:
 *   - Priority Queues (URGENT = 1, HIGH = 2, NORMAL = 3, LOW = 4)
 *   - Exponential Backoff Retries (5 attempts: 5s, 15s, 45s, 135s, 405s)
 *   - Dead Letter Queue (DLQ) for job inspection and replay
 */

import { Queue, QueueEvents } from "bullmq";
import { redisBullConnection as redisConnection } from "../lib/redis.singleton";

export { redisConnection };

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

// ── Main Dispatch Queue ──────────────────────────────────────────────────────

export const dispatchQueue = new Queue<NotificationJobData>("notification-dispatch", {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000, // Initial 5s delay -> 15s -> 45s -> 135s -> 405s
    },
    removeOnComplete: { age: 86400, count: 5000 },
    removeOnFail: false,
  },
});

// ── Per-Channel Rate-Limited Queues ──────────────────────────────────────────

// Email Queue: 100 emails / sec (Resend API Rate Compliance)
export const emailQueue = new Queue<NotificationJobData>("notification-email", {
  connection: redisConnection as any,
  defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 5000 } },
});

// SMS Queue: 10 SMS / sec (Twilio API Rate Compliance)
export const smsQueue = new Queue<NotificationJobData>("notification-sms", {
  connection: redisConnection as any,
  defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 5000 } },
});

// Push Queue: 500 push / sec (WebPush/FCM Rate Compliance)
export const pushQueue = new Queue<NotificationJobData>("notification-push", {
  connection: redisConnection as any,
  defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 5000 } },
});

// ── Dead Letter Queue (DLQ) ──────────────────────────────────────────────────

export const dlqQueue = new Queue<NotificationJobData & { errorReason?: string; failedAt?: string }>(
  "notification-dlq",
  {
    connection: redisConnection as any,
    defaultJobOptions: {
      removeOnComplete: false,
      removeOnFail: false,
    },
  }
);

// Priority Mapping for BullMQ (lower integer = higher priority)
export function getPriorityValue(priority?: string): number {
  switch (priority) {
    case "URGENT": return 1;
    case "HIGH": return 2;
    case "NORMAL": return 3;
    case "LOW": return 4;
    default: return 3;
  }
}

// ── Helper: Enqueue Notification Job ──────────────────────────────────────────

export async function enqueueNotification(jobData: NotificationJobData) {
  const priorityNum = getPriorityValue(jobData.priority);
  const job = await dispatchQueue.add("dispatch", {
    ...jobData,
    createdAt: new Date().toISOString(),
  }, {
    priority: priorityNum,
  });

  return job;
}

// ── DLQ Helper Functions ─────────────────────────────────────────────────────

export async function getDLQStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    dlqQueue.getWaitingCount(),
    dlqQueue.getActiveCount(),
    dlqQueue.getCompletedCount(),
    dlqQueue.getFailedCount(),
  ]);
  return { waiting, active, completed, failed, total: waiting + active + completed + failed };
}

export async function getDLQJobs(start: number = 0, end: number = 20) {
  const jobs = await dlqQueue.getJobs(["waiting", "completed", "failed"], start, end, true);
  return jobs.map(j => ({
    id: j.id,
    name: j.name,
    data: j.data,
    failedReason: j.failedReason,
    timestamp: j.timestamp,
    processedOn: j.processedOn,
    finishedOn: j.finishedOn,
  }));
}

export async function replayDLQJob(jobId: string) {
  const job = await dlqQueue.getJob(jobId);
  if (!job) return { success: false, error: "Job not found in DLQ" };

  // Re-enqueue to dispatch queue
  await enqueueNotification(job.data);
  // Remove from DLQ
  await job.remove();
  return { success: true, jobId };
}

export async function purgeDLQ() {
  await dlqQueue.drain(true);
  return { success: true };
}
