/**
 * Production Email Queue Worker — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-5: Drains queued emails in high-throughput batches (up to 50 per cycle)
 *          avoiding head-of-line blocking and delivers them via Resend API.
 */
import { Resend } from "resend";
import { prisma } from "@agency/database";
import { redisClient } from "../lib/redis.singleton";

let emailWorkerTimer: NodeJS.Timeout | null = null;

async function processEmailQueueBatch(): Promise<void> {
  try {
    const BATCH_SIZE = 50;
    const apiKey = process.env.RESEND_API_KEY;
    const hasValidKey = apiKey && apiKey !== "re_123456789";
    const resend = hasValidKey ? new Resend(apiKey) : null;
    const canonicalEmail = process.env.ADMIN_CANONICAL_EMAIL || "no-reply@legacymarksas.com";

    for (let i = 0; i < BATCH_SIZE; i++) {
      const item = await redisClient.rpop("notification:email_queue");
      if (!item) break; // Queue drained

      let payload: { userId: string; title: string; message: string };
      try {
        payload = JSON.parse(item);
      } catch {
        continue;
      }

      const { userId, title, message } = payload;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (!user?.email) continue;

      if (resend) {
        await resend.emails.send({
          from: `LegacyMark <${canonicalEmail}>`,
          to: [user.email],
          subject: title,
          html: `<div style="font-family:sans-serif;padding:20px;background:#0f172a;color:#fff;"><h2 style="color:#14b8a6;">${title}</h2><p>${message}</p></div>`,
        }).catch((err) => {
          console.error(`[email-worker] Failed to send email to ${user.email}:`, err.message);
        });
        console.log(`[notification-service] 📧 Email sent via Resend → ${user.email}`);
      } else {
        console.log(`[notification-service] 📧 Email queued (Mock/Dev) → ${user.email}: ${title}`);
      }
    }
  } catch (err: any) {
    console.error("[notification-service] Email worker batch error:", err.message);
  }
}

export function startEmailWorker(): void {
  if (emailWorkerTimer) return;
  emailWorkerTimer = setInterval(processEmailQueueBatch, 3000);
}

export function stopEmailWorker(): void {
  if (emailWorkerTimer) {
    clearInterval(emailWorkerTimer);
    emailWorkerTimer = null;
  }
}
