/**
 * SLA & Audit Router
 * Handles /api/inbox/conversations/:id/sla, /api/inbox/sla/*, /api/inbox/audit/*
 */
import { Router, Request, Response } from "express";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import {
  initializeSLA,
  getSLAWarning,
  getBreachedSLAs,
  pauseSLA,
  resumeSLA,
} from "../lib/inbox/sla";
import {
  logAuditEvent,
  getAuditTrail,
  searchAuditLogs,
  generateAuditReport,
} from "../lib/inbox/audit";
import { logger } from "../lib/inbox/logger";

export function createSlaRouter(): Router {
  const router = Router();

  router.use(requireUserOrServiceAuth);

  // ── POST /conversations/:id/sla ─────────────────────────────────────────────
  router.post("/conversations/:id/sla", async (req: Request, res: Response) => {
    try {
      const conversationId = String(req.params.id);
      const { companyId } = req.body;
      if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });
      const sla = await initializeSLA(conversationId, companyId);
      res.json({ success: true, data: sla });
    } catch (err) {
      logger.error("[sla] POST /sla failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── GET /conversations/:id/sla ──────────────────────────────────────────────
  router.get("/conversations/:id/sla", async (req: Request, res: Response) => {
    try {
      const conversationId = String(req.params.id);
      const [warning, sla] = await Promise.all([
        getSLAWarning(conversationId),
        prisma.conversationSLA.findUnique({ where: { conversationId } }),
      ]);
      res.json({ success: true, data: { sla, warning } });
    } catch (err) {
      logger.error("[sla] GET /sla failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /conversations/:id/sla/pause ───────────────────────────────────────
  router.post("/conversations/:id/sla/pause", async (req: Request, res: Response) => {
    try {
      await pauseSLA(String(req.params.id));
      res.json({ success: true });
    } catch (err) {
      logger.error("[sla] POST /sla/pause failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /conversations/:id/sla/resume ──────────────────────────────────────
  router.post("/conversations/:id/sla/resume", async (req: Request, res: Response) => {
    try {
      await resumeSLA(String(req.params.id));
      res.json({ success: true });
    } catch (err) {
      logger.error("[sla] POST /sla/resume failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── GET /sla/breached ───────────────────────────────────────────────────────
  router.get("/sla/breached", async (req: Request, res: Response) => {
    try {
      const companyId =
        (req.headers["x-company-id"] as string | undefined) ||
        (req.query.companyId ? String(req.query.companyId) : undefined);

      if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });
      const breached = await getBreachedSLAs(companyId);
      res.json({ success: true, data: breached });
    } catch (err) {
      logger.error("[sla] GET /sla/breached failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── GET /conversations/:id/audit ────────────────────────────────────────────
  router.get("/conversations/:id/audit", async (req: Request, res: Response) => {
    try {
      const conversationId = String(req.params.id);
      const limit = Math.min(parseInt(String(req.query.limit || "100"), 10), 500);
      const auditTrail = await getAuditTrail(conversationId, limit);
      res.json({ success: true, data: auditTrail });
    } catch (err) {
      logger.error("[sla] GET /audit failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── POST /audit ─────────────────────────────────────────────────────────────
  router.post("/audit", async (req: Request, res: Response) => {
    try {
      const { action, payload } = req.body;
      if (!action || !payload) {
        return res.status(400).json({ success: false, error: "action and payload required" });
      }
      await logAuditEvent(action, payload);
      res.json({ success: true });
    } catch (err) {
      logger.error("[sla] POST /audit failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // ── GET /audit/report ───────────────────────────────────────────────────────
  router.get("/audit/report", async (req: Request, res: Response) => {
    try {
      const { companyId, startDate, endDate } = req.query;
      if (!companyId || !startDate || !endDate) {
        return res.status(400).json({ success: false, error: "companyId, startDate, and endDate required" });
      }
      const report = await generateAuditReport(
        String(companyId),
        new Date(String(startDate)),
        new Date(String(endDate))
      );
      res.json({ success: true, data: report });
    } catch (err) {
      logger.error("[sla] GET /audit/report failed", { error: String(err) });
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  return router;
}
