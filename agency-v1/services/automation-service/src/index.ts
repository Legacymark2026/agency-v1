/**
 * Automation Service — Workflow Engine & Marketing Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Workflows, Campaigns, Social Publishing, Email Blasts, CAPI
 * Port: 4003
 * 
 * CRITICAL SERVICE — Most CPU-intensive, needs aggressive auto-scaling (3→15 pods)
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { EventBus, EventPayload } from "@agency/events";
import { runWorkflow, resumeWorkflow } from "./workflow-executor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const app = express();
const PORT = parseInt(process.env.PORT || "4003", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Health Checks ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "automation-service", timestamp: new Date().toISOString() });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

// ── Workflows ────────────────────────────────────────────────────────────────

app.get("/api/workflows", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const workflows = await prisma.workflow.findMany({
      where: { companyId: String(companyId) },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ workflows });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/workflows/:id/trigger", async (req, res) => {
  try {
    const workflow = await prisma.workflow.findUnique({ where: { id: req.params.id } });
    if (!workflow) return res.status(404).json({ error: "Workflow not found" });
    if (!workflow.isActive) return res.status(400).json({ error: "Workflow is inactive" });

    // Execute asynchronously using the full workflow engine
    const triggerData = req.body.triggerData || {};
    
    // Respond immediately, execute in background
    res.status(202).json({ status: "ACCEPTED", workflowId: workflow.id });

    setImmediate(async () => {
      try {
        const result = await runWorkflow(workflow.id, triggerData);
        await eventBus.publish(result.success ? "workflow.completed" : "workflow.failed", {
          workflowId: workflow.id, executionId: result.executionId, error: result.error,
        });
      } catch (err) {
        console.error("[automation-service] Workflow execution error:", err);
      }
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/workflows/executions/:id/resume — Resume a WAITING workflow
app.post("/api/workflows/executions/:id/resume", async (req, res) => {
  try {
    const result = await resumeWorkflow(req.params.id, req.body.resumeData);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Campaigns ────────────────────────────────────────────────────────────────

app.get("/api/campaigns", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const campaigns = await prisma.campaign.findMany({
      where: { companyId: String(companyId) },
      orderBy: { createdAt: "desc" },
    });
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Cron Endpoints (migrated from vercel.json crons) ─────────────────────────

app.post("/api/cron/run-automation", async (_req, res) => {
  try {
    const activeRules = await prisma.dealAutomationRule.findMany({
      where: { isActive: true },
    });
    console.log(`[automation-service] Running ${activeRules.length} automation rules`);
    // TODO: Execute each rule
    res.json({ processed: activeRules.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/cron/social-publisher", async (_req, res) => {
  try {
    const pendingPosts = await prisma.socialPost.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: new Date() },
      },
    });
    console.log(`[automation-service] Publishing ${pendingPosts.length} social posts`);
    // TODO: Publish each post via platform APIs
    res.json({ processed: pendingPosts.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/cron/process-sequences", async (_req, res) => {
  try {
    const enrollments = await prisma.emailSequenceEnrollment.findMany({
      where: {
        status: "ACTIVE",
        nextRunAt: { lte: new Date() },
      },
      include: { sequence: true, deal: true },
    });
    console.log(`[automation-service] Processing ${enrollments.length} sequence steps`);
    res.json({ processed: enrollments.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Event Bus ────────────────────────────────────────────────────────────────
const eventBus = new EventBus(REDIS_URL, "automation-service");

// React to CRM events
eventBus.subscribe("lead.created", async (payload: EventPayload) => {
  console.log(`[automation-service] New lead created: ${payload.data.leadId}`);
});

eventBus.subscribe("deal.stage_changed", async (payload: EventPayload) => {
  console.log(`[automation-service] Deal stage changed: ${payload.data.dealId}`);
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`⚡ Automation Service running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  await eventBus.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
