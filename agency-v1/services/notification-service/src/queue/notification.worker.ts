/**
 * services/notification-service/src/queue/notification.worker.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-Channel Asynchronous Worker Processor for BullMQ
 * Processes In-App, Email (via Resend Circuit Breaker), and Push delivery.
 * On persistent failure (all 5 retries exhausted), transfers job to DLQ.
 */

import { Worker, Job } from "bullmq";
import { prisma } from "@agency/database";
import { NotificationJobData, redisConnection, dlqQueue } from "./notification.queue";
import { emailCircuitBreaker, pushCircuitBreaker } from "../circuit-breaker/provider.breaker";

export function startNotificationWorker() {
  const worker = new Worker<NotificationJobData>(
    "notification:dispatch",
    async (job: Job<NotificationJobData>) => {
      const { companyId, userIds, title, message, type, channels, data } = job.data;
      const cleanTitle = title;
      const cleanMessage = message;

      // 1. IN_APP Channel Processing
      if (channels.includes("IN_APP")) {
        await prisma.notification.createMany({
          data: userIds.map((userId) => ({
            userId,
            companyId: String(companyId),
            title: cleanTitle,
            message: cleanMessage,
            type: String(type || "SYSTEM"),
            isRead: false,
            data: data ? JSON.stringify(data) : undefined,
          })),
        });
      }

      // 2. EMAIL Channel Processing (protected by Circuit Breaker)
      if (channels.includes("EMAIL")) {
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true },
        });

        for (const user of users) {
          if (user.email) {
            // Execute email sending through Opossum Circuit Breaker
            await emailCircuitBreaker.fire({
              to: user.email,
              subject: cleanTitle,
              html: `<div style="font-family:sans-serif;padding:20px;background:#0f172a;color:#fff;"><h2 style="color:#14b8a6;">${cleanTitle}</h2><p>${cleanMessage}</p></div>`,
            });
          }
        }
      }

      // 3. PUSH / SMS Channel Processing (protected by Circuit Breaker)
      if (channels.includes("PUSH") || channels.includes("SMS")) {
        for (const userId of userIds) {
          await pushCircuitBreaker.fire({
            userId,
            title: cleanTitle,
            message: cleanMessage,
          });
        }
      }

      return { processed: userIds.length, channels };
    },
    {
      connection: redisConnection as any,
      concurrency: 5, // Process 5 concurrent jobs
    }
  );

  // ── Handle Job Failures & DLQ Transfers ─────────────────────────────────────

  worker.on("failed", async (job, err) => {
    if (!job) return;

    console.warn(`⚠️ [NotificationWorker] Job #${job.id} failed (Attempt ${job.attemptsMade}/${job.opts.attempts}): ${err.message}`);

    // If max retries exhausted, transfer job to Dead Letter Queue (DLQ)
    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      console.error(`🚨 [NotificationWorker] Max retries reached for Job #${job.id}. Transferring to DLQ!`);
      await dlqQueue.add("dead_letter", {
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
