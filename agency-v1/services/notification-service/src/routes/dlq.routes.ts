/**
 * Dead Letter Queue (DLQ) Management Router — Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: Secured with requireUserOrServiceAuth and admin role guard.
 * Allows operations teams to inspect, replay, and purge failed BullMQ notification jobs.
 */
import { Router, Request, Response } from "express";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { getDLQStats, getDLQJobs, replayDLQJob, purgeDLQ } from "../queue/notification.queue";

export const dlqRouter = Router();

dlqRouter.use(requireUserOrServiceAuth);

function requireAdmin(req: Request, res: Response, next: () => void) {
  const isService = !!req.headers["x-service-token"];
  if (isService) return next();

  const gatewayRole = req.headers["x-user-role"];
  const role = String(gatewayRole || (req as any).user?.role || (req as any).authUser?.role || "user");

  if (role !== "admin" && role !== "super_admin") {
    return res.status(403).json({ success: false, error: "Admin access required" });
  }

  next();
}

dlqRouter.use(requireAdmin);

// ── GET /notifications/dlq ────────────────────────────────────────────────────
dlqRouter.get(["/notifications/dlq", "/api/v1/notifications/dlq"], async (req: Request, res: Response) => {
  try {
    const { start = "0", end = "20" } = req.query;
    const stats = await getDLQStats();
    const jobs = await getDLQJobs(parseInt(String(start), 10), parseInt(String(end), 10));
    res.json({ success: true, stats, jobs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /notifications/dlq/replay ────────────────────────────────────────────
dlqRouter.post(["/notifications/dlq/replay", "/api/v1/notifications/dlq/replay"], async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ success: false, error: "jobId is required" });

    const result = await replayDLQJob(String(jobId));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /notifications/dlq ─────────────────────────────────────────────────
dlqRouter.delete(["/notifications/dlq", "/api/v1/notifications/dlq"], async (_req: Request, res: Response) => {
  try {
    const result = await purgeDLQ();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
