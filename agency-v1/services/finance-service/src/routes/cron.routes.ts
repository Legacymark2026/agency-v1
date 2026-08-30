/**
 * Cron Router — Internal subscription renewal job
 * Fix M-5: endpoint is protected by CRON_SECRET header to prevent unauthorized triggering
 *          from the public internet. Only trusted internal callers (cron job, k8s CronJob,
 *          or ECS Scheduled Task) should know the secret.
 * Fix A-1: extracted from index.ts God Object
 */
import { Router, Request, Response } from "express";
import { prisma } from "@agency/database";
import { logger } from "../utils/logger.utils";

const CRON_SECRET = process.env.CRON_SECRET || "";

/** Simple shared-secret middleware for cron endpoints */
function requireCronSecret(req: Request, res: Response, next: () => void): void {
  if (!CRON_SECRET) {
    logger.warn("[cron] CRON_SECRET not configured — cron endpoint is OPEN (set CRON_SECRET in env)");
    // In production, reject if secret is not configured
    if (process.env.NODE_ENV === "production") {
      res.status(503).json({ success: false, error: "CRON_SECRET not configured" });
      return;
    }
    // In dev allow through with warning
    next();
    return;
  }

  const provided = req.headers["x-cron-secret"] || req.headers["authorization"]?.replace("Bearer ", "");
  if (!provided || provided !== CRON_SECRET) {
    res.status(401).json({ success: false, error: "Invalid cron secret" });
    return;
  }

  next();
}

const SUB_PREFIX = "SUB-";

export const cronRouter = Router();

cronRouter.use(requireCronSecret as any);

// ── POST /cron/subscriptions ───────────────────────────────────────────────────
cronRouter.post("/subscriptions", async (_req: Request, res: Response) => {
  const startTime = Date.now();
  logger.info("[cron] Processing subscription renewals");

  try {
    const now = new Date();

    // Find subscriptions that are PAID and have passed their due date (ready for renewal)
    const dueSubscriptions = await prisma.invoice.findMany({
      where: {
        invoiceNumber: { startsWith: SUB_PREFIX },
        dueDate: { lte: now },
        status: "PAID",
      },
    });

    logger.info("[cron] Found subscriptions due for renewal", { count: dueSubscriptions.length });

    let renewedCount = 0;
    const errors: string[] = [];

    for (const sub of dueSubscriptions) {
      try {
        // Parse interval from notes (e.g. "Interval: MONTHLY")
        const intervalMatch = sub.notes?.match(/Interval:\s*(MONTHLY|QUARTERLY|YEARLY)/);
        const interval = intervalMatch?.[1] ?? "MONTHLY";

        const nextDueDate = new Date();
        if (interval === "YEARLY") nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        else if (interval === "QUARTERLY") nextDueDate.setMonth(nextDueDate.getMonth() + 3);
        else nextDueDate.setMonth(nextDueDate.getMonth() + 1);

        const renewalId = `${SUB_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

        await prisma.invoice.create({
          data: {
            companyId: sub.companyId,
            invoiceNumber: renewalId,
            clientName: sub.clientName,
            clientNit: sub.clientNit,
            subtotalAmount: sub.subtotalAmount,
            taxAmount: sub.taxAmount,
            discountAmount: sub.discountAmount,
            totalAmount: sub.totalAmount,
            advanceAmount: 0,
            finalAmount: sub.totalAmount,
            currency: sub.currency,
            dueDate: nextDueDate,
            notes: sub.notes,
            isElectronic: false,
            status: "DRAFT_AWAITING_PAYMENT",
          },
        });

        renewedCount++;
      } catch (err) {
        const msg = `Failed to renew subscription ${sub.id}: ${String(err)}`;
        errors.push(msg);
        logger.error("[cron]", { error: msg });
      }
    }

    const durationMs = Date.now() - startTime;
    logger.info("[cron] Renewal complete", { renewedCount, errors: errors.length, durationMs });

    res.json({
      success: true,
      processed: renewedCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      durationMs,
    });
  } catch (err) {
    logger.error("[cron] POST /subscriptions failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
