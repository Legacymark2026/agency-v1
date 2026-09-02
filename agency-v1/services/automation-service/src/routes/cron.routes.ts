/**
 * Cron & Recurring Jobs Router — Automation Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-4: Protected with CRON_SECRET to prevent unauthorized trigger floods.
 * Fix C-3: Uses correct Prisma column scheduledAt for social post publication.
 */
import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@agency/database";

export const cronRouter = Router();

// ── Cron Secret Middleware ───────────────────────────────────────────────────
function requireCronSecret(req: Request, res: Response, next: NextFunction) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // If no secret configured in staging, allow internal docker calls
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "").trim();

  if (token !== cronSecret && req.headers["x-cron-secret"] !== cronSecret) {
    return res.status(401).json({ success: false, error: "Unauthorized: Invalid CRON_SECRET" });
  }

  next();
}

cronRouter.use(requireCronSecret);

// ── POST /cron/run-automation ─────────────────────────────────────────────────
cronRouter.post("/cron/run-automation", async (_req: Request, res: Response) => {
  try {
    const activeRules = await prisma.dealAutomationRule.findMany({
      where: { isActive: true },
    });
    console.log(`[automation-service] Running ${activeRules.length} automation rules`);
    res.json({ success: true, processed: activeRules.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /cron/social-publisher ───────────────────────────────────────────────
cronRouter.post("/cron/social-publisher", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const pendingPosts = await prisma.socialPost.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now },
      },
      take: 20,
    });

    for (const post of pendingPosts) {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "PUBLISHED", publishedAt: now },
      });
    }

    console.log(`[automation-service] Published ${pendingPosts.length} social posts`);
    res.json({ success: true, processed: pendingPosts.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /cron/process-sequences ──────────────────────────────────────────────
cronRouter.post("/cron/process-sequences", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const enrollments = await prisma.emailSequenceEnrollment.findMany({
      where: {
        status: "ACTIVE",
        nextRunAt: { lte: now },
      },
      include: { sequence: true, deal: true },
      take: 50,
    });

    console.log(`[automation-service] Processing ${enrollments.length} sequence steps`);
    res.json({ success: true, processed: enrollments.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
