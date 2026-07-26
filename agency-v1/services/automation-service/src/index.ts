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
import { executeWorkflow, triggerWorkflow } from "./workflow-executor";

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

import { automationRouter } from "./routes/automation.routes";
import { errorHandler } from "./middlewares/automation.middleware";

app.use("/api", automationRouter);
app.use(errorHandler);

// ── Workflows CRUD ───────────────────────────────────────────────────────────

app.get("/api/workflows", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const workflows = await prisma.workflow.findMany({
      where: { companyId: String(companyId) },
      include: {
        _count: {
          select: { executions: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ workflows });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/workflows/latest", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const workflow = await prisma.workflow.findFirst({
      where: { companyId: String(companyId) },
      orderBy: { createdAt: "desc" },
    });
    res.json({ workflow });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/workflows/:id", async (req, res) => {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id },
    });
    res.json({ workflow });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/workflows", async (req, res) => {
  try {
    const { companyId, data } = req.body;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    if (!data) return res.status(400).json({ error: "data required" });

    let workflow;
    if (data.id) {
      workflow = await prisma.workflow.update({
        where: { id: data.id },
        data: {
          name: data.name,
          triggerType: data.triggerType,
          triggerConfig: data.triggerConfig || {},
          steps: data.steps,
          isActive: data.isActive
        }
      });
    } else {
      workflow = await prisma.workflow.create({
        data: {
          companyId,
          name: data.name,
          triggerType: data.triggerType,
          triggerConfig: data.triggerConfig || {},
          steps: data.steps,
          isActive: data.isActive
        }
      });
    }
    res.json({ success: true, workflow });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/workflows/:id", async (req, res) => {
  try {
    await prisma.workflow.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/workflows/:id/toggle", async (req, res) => {
  try {
    const { isActive } = req.body;
    const workflow = await prisma.workflow.update({
      where: { id: req.params.id },
      data: { isActive: Boolean(isActive) },
    });
    res.json({ success: true, workflow });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/workflows/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: "ids must be an array" });

    await prisma.workflow.deleteMany({
      where: { id: { in: ids } },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/workflows/bulk-toggle", async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: "ids must be an array" });

    await prisma.workflow.updateMany({
      where: { id: { in: ids } },
      data: { isActive: Boolean(isActive) },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Executions & Analytics Endpoints ─────────────────────────────────────────

app.get("/api/automation/executions/recent", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const executions = await prisma.workflowExecution.findMany({
      where: { workflow: { companyId: String(companyId) } },
      take: 10,
      orderBy: { startedAt: "desc" },
      include: {
        workflow: {
          select: { name: true, id: true }
        }
      }
    });
    res.json({ executions });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/automation/executions/:id", async (req, res) => {
  try {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: req.params.id },
      include: {
        workflow: true
      }
    });
    res.json({ execution });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/automation/analytics", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const [totalWorkflows, activeWorkflows, totalExecutions, failedExecutions] = await Promise.all([
      prisma.workflow.count({ where: { companyId: String(companyId) } }),
      prisma.workflow.count({ where: { companyId: String(companyId), isActive: true } }),
      prisma.workflowExecution.count({ where: { workflow: { companyId: String(companyId) } } }),
      prisma.workflowExecution.count({ where: { workflow: { companyId: String(companyId) }, status: "FAILED" } })
    ]);

    const successRate = totalExecutions > 0
      ? Math.round(((totalExecutions - failedExecutions) / totalExecutions) * 100)
      : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await prisma.workflowExecution.groupBy({
      by: ["status"],
      where: {
        workflow: { companyId: String(companyId) },
        startedAt: { gte: thirtyDaysAgo }
      },
      _count: true
    });

    const topWorkflows = await prisma.workflow.findMany({
      where: { companyId: String(companyId) },
      include: {
        _count: {
          select: { executions: true }
        }
      },
      orderBy: {
        executions: { _count: "desc" }
      },
      take: 5
    });

    res.json({
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      successRate,
      recentActivity,
      topWorkflows
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Integrations Status Endpoint ─────────────────────────────────────────────

app.get("/api/automation/integrations-status", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const configs = await prisma.integrationConfig.findMany({
      where: { companyId: String(companyId) }
    });

    const statusMap: Record<string, boolean> = {};
    for (const c of configs) {
      statusMap[c.provider] = c.isEnabled;
    }

    const wa = await prisma.whatsAppIntegration.findFirst({
      where: { companyId: String(companyId), status: "active" }
    });
    if (wa) {
      statusMap["whatsapp"] = true;
    }

    statusMap["resend"] = !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_123456789";
    if (configs.some(c => (c.provider === "RESEND" || c.provider === "resend") && c.isEnabled)) {
      statusMap["resend"] = true;
    }

    statusMap["ai-models"] = !!process.env.GEMINI_API_KEY || !!process.env.OPENAI_API_KEY || configs.some(c => (c.provider === "ai-models" || c.provider === "gemini") && c.isEnabled);

    res.json({ success: true, statusMap });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Trigger & Execution Endpoints ────────────────────────────────────────────

app.post("/api/workflows/trigger", async (req, res) => {
  try {
    const { triggerType, triggerData } = req.body;
    if (!triggerType) return res.status(400).json({ error: "triggerType required" });

    const result = await triggerWorkflow(triggerType, triggerData);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/workflows/:id/execute", async (req, res) => {
  try {
    const { triggerData, resumeFromNodeId } = req.body;

    executeWorkflow(req.params.id, triggerData || {}, resumeFromNodeId)
      .catch(err => console.error(`[automation-service] Async execute/resume error for ${req.params.id}:`, err));

    res.json({ success: true, message: "Execution started in background" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Keep this route for backwards compatibility with Next.js trigger/resume endpoints if they hit it directly
app.post("/api/workflows/:id/trigger", async (req, res) => {
  try {
    const { triggerData } = req.body;
    executeWorkflow(req.params.id, triggerData || {})
      .catch(err => console.error(`[automation-service] Async execute/resume error for ${req.params.id}:`, err));

    res.json({ success: true, message: "Execution started in background" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/workflows/executions/:id/resume", async (req, res) => {
  try {
    const { resumeFromNodeId } = req.body;
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: req.params.id },
    });
    if (!execution) return res.status(404).json({ error: "Execution not found" });

    executeWorkflow(execution.workflowId, {}, resumeFromNodeId)
      .catch(err => console.error(`[automation-service] Async execute/resume error for ${execution.workflowId}:`, err));

    res.json({ success: true, message: "Execution resumed in background" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Campaigns (legacy placeholder) ───────────────────────────────────────────

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
  const data = payload.data as { dealId: string; stage: string; companyId: string };
  console.log(`[automation-service] Deal stage changed: ${data.dealId} to stage: ${data.stage}`);
  
  try {
    const result = await triggerWorkflow("DEAL_STAGE_CHANGED", {
      id: data.dealId,
      dealId: data.dealId,
      stage: data.stage,
      companyId: data.companyId,
      __dealId: data.dealId,
    });
    console.log(`[automation-service] Event trigger DEAL_STAGE_CHANGED executed: ${result.executed} workflows.`);
  } catch (err) {
    console.error("[automation-service] Failed to trigger workflow on deal.stage_changed:", err);
  }
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
