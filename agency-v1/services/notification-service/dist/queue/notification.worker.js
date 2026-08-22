"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNotificationWorker = startNotificationWorker;
const bullmq_1 = require("bullmq");
const notification_queue_1 = require("./notification.queue");
const provider_breaker_1 = require("../circuit-breaker/provider.breaker");
const tracer_1 = require("../observability/tracer");
const notification_cache_1 = require("../cache/notification.cache");
const notification_repository_1 = require("@repositories/notification.repository");
function startNotificationWorker() {
    const worker = new bullmq_1.Worker("notification-dispatch", async (job) => {
        return (0, tracer_1.traceSpan)("notification.worker_process", async (span) => {
            const { companyId, userIds, title, message, type, channels, data, id } = job.data;
            span.setAttribute("job.id", String(job.id || id || ""));
            span.setAttribute("job.companyId", String(companyId));
            span.setAttribute("job.targetUsers", userIds.length);
            span.setAttribute("job.channels", channels.join(","));
            const cleanTitle = title;
            const cleanMessage = message;
            // 1. IN_APP Channel Processing
            if (channels.includes("IN_APP")) {
                await (0, tracer_1.traceSpan)("notification.channel_in_app", async () => {
                    await notification_repository_1.notificationRepository.createMany(userIds.map((userId) => ({
                        userId,
                        companyId: String(companyId),
                        title: cleanTitle,
                        message: cleanMessage,
                        type: String(type || "SYSTEM"),
                        isRead: false,
                        data: data ? JSON.stringify(data) : undefined,
                    })));
                    // Invalidate Redis unread count cache for all target users
                    for (const userId of userIds) {
                        await (0, notification_cache_1.invalidateUnreadCount)(userId, String(companyId));
                    }
                });
            }
            // 2. EMAIL Channel Processing (protected by Circuit Breaker & User Profile Cache)
            if (channels.includes("EMAIL")) {
                await (0, tracer_1.traceSpan)("notification.channel_email", async () => {
                    for (const userId of userIds) {
                        const user = await (0, notification_cache_1.getUserProfileCached)(userId);
                        if (user?.email) {
                            // Execute email sending through Opossum Circuit Breaker
                            await provider_breaker_1.emailCircuitBreaker.fire({
                                to: user.email,
                                subject: cleanTitle,
                                html: `<div style="font-family:sans-serif;padding:20px;background:#0f172a;color:#fff;"><h2 style="color:#14b8a6;">${cleanTitle}</h2><p>${cleanMessage}</p></div>`,
                            });
                        }
                    }
                });
            }
            // 3. PUSH / SMS Channel Processing (protected by Circuit Breaker)
            if (channels.includes("PUSH") || channels.includes("SMS")) {
                await (0, tracer_1.traceSpan)("notification.channel_push_sms", async () => {
                    for (const userId of userIds) {
                        await provider_breaker_1.pushCircuitBreaker.fire({
                            userId,
                            title: cleanTitle,
                            message: cleanMessage,
                        });
                    }
                });
            }
            return { processed: userIds.length, channels };
        });
    }, {
        connection: notification_queue_1.redisConnection,
        concurrency: 5,
        limiter: {
            max: 100,
            duration: 1000,
        },
    });
    // ── Handle Job Failures & DLQ Transfers ─────────────────────────────────────
    worker.on("failed", async (job, err) => {
        if (!job)
            return;
        console.warn(`⚠️ [NotificationWorker] Job #${job.id} failed (Attempt ${job.attemptsMade}/${job.opts.attempts}): ${err.message}`);
        // If max retries exhausted, transfer job to Dead Letter Queue (DLQ)
        if (job.attemptsMade >= (job.opts.attempts || 5)) {
            console.error(`🚨 [NotificationWorker] Max retries reached for Job #${job.id}. Transferring to DLQ!`);
            await notification_queue_1.dlqQueue.add("dead_letter", {
                ...job.data,
                errorReason: err.message,
                failedAt: new Date().toISOString(),
            });
        }
    });
    worker.on("completed", (job) => {
        console.log(`✅ [NotificationWorker] Job #${job.id} processed successfully`);
    });
    return worker;
}
//# sourceMappingURL=notification.worker.js.map