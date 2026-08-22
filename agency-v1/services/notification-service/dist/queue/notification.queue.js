"use strict";
/**
 * services/notification-service/src/queue/notification.queue.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Resilient BullMQ Queue System for Notification Delivery
 * Features:
 *   - Priority Queues (URGENT = 1, HIGH = 2, NORMAL = 3, LOW = 4)
 *   - Exponential Backoff Retries (5 attempts: 5s, 15s, 45s, 135s, 405s)
 *   - Dead Letter Queue (DLQ) for job inspection and replay
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dlqQueue = exports.pushQueue = exports.smsQueue = exports.emailQueue = exports.dispatchQueue = exports.redisConnection = void 0;
exports.getPriorityValue = getPriorityValue;
exports.enqueueNotification = enqueueNotification;
exports.getDLQStats = getDLQStats;
exports.getDLQJobs = getDLQJobs;
exports.replayDLQJob = replayDLQJob;
exports.purgeDLQ = purgeDLQ;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
exports.redisConnection = new ioredis_1.default(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
});
// ── Main Dispatch Queue ──────────────────────────────────────────────────────
exports.dispatchQueue = new bullmq_1.Queue("notification-dispatch", {
    connection: exports.redisConnection,
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
exports.emailQueue = new bullmq_1.Queue("notification-email", {
    connection: exports.redisConnection,
    defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 5000 } },
});
// SMS Queue: 10 SMS / sec (Twilio API Rate Compliance)
exports.smsQueue = new bullmq_1.Queue("notification-sms", {
    connection: exports.redisConnection,
    defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 5000 } },
});
// Push Queue: 500 push / sec (WebPush/FCM Rate Compliance)
exports.pushQueue = new bullmq_1.Queue("notification-push", {
    connection: exports.redisConnection,
    defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 5000 } },
});
// ── Dead Letter Queue (DLQ) ──────────────────────────────────────────────────
exports.dlqQueue = new bullmq_1.Queue("notification-dlq", {
    connection: exports.redisConnection,
    defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
    },
});
// Priority Mapping for BullMQ (lower integer = higher priority)
function getPriorityValue(priority) {
    switch (priority) {
        case "URGENT": return 1;
        case "HIGH": return 2;
        case "NORMAL": return 3;
        case "LOW": return 4;
        default: return 3;
    }
}
// ── Helper: Enqueue Notification Job ──────────────────────────────────────────
async function enqueueNotification(jobData) {
    const priorityNum = getPriorityValue(jobData.priority);
    const job = await exports.dispatchQueue.add("dispatch", {
        ...jobData,
        createdAt: new Date().toISOString(),
    }, {
        priority: priorityNum,
    });
    return job;
}
// ── DLQ Helper Functions ─────────────────────────────────────────────────────
async function getDLQStats() {
    const [waiting, active, completed, failed] = await Promise.all([
        exports.dlqQueue.getWaitingCount(),
        exports.dlqQueue.getActiveCount(),
        exports.dlqQueue.getCompletedCount(),
        exports.dlqQueue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed, total: waiting + active + completed + failed };
}
async function getDLQJobs(start = 0, end = 20) {
    const jobs = await exports.dlqQueue.getJobs(["waiting", "completed", "failed"], start, end, true);
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
async function replayDLQJob(jobId) {
    const job = await exports.dlqQueue.getJob(jobId);
    if (!job)
        return { success: false, error: "Job not found in DLQ" };
    // Re-enqueue to dispatch queue
    await enqueueNotification(job.data);
    // Remove from DLQ
    await job.remove();
    return { success: true, jobId };
}
async function purgeDLQ() {
    await exports.dlqQueue.drain(true);
    return { success: true };
}
//# sourceMappingURL=notification.queue.js.map