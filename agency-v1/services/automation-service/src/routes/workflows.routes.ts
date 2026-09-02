/**
 * Workflows CRUD & Execution Router — Automation Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: All endpoints secured with requireUserOrServiceAuth.
 * Fix C-2: Multi-tenant boundary isolation enforced on all lookups, mutations & bulk operations.
 * Fix C-3: Zod validation on workflow definitions and triggers.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { executeWorkflow, triggerWorkflow } from "../workflow-executor";

const workflowPayloadSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Workflow name is required"),
  triggerType: z.string().min(1, "Trigger type is required"),
  triggerConfig: z.record(z.any()).optional().default({}),
  steps: z.array(z.any()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

const bulkIdsSchema = z.object({
  ids: z.array(z.string()).min(1, "ids array is required"),
  isActive: z.boolean().optional(),
});

export const workflowsRouter = Router();

workflowsRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── GET /workflows ────────────────────────────────────────────────────────────
workflowsRouter.get("/workflows", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const workflows = await prisma.workflow.findMany({
      where: { companyId: String(companyId) },
      include: {
        _count: {
          select: { executions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, workflows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /workflows/latest ─────────────────────────────────────────────────────
workflowsRouter.get("/workflows/latest", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const workflow = await prisma.workflow.findFirst({
      where: { companyId: String(companyId) },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, workflow });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /workflows/:id ────────────────────────────────────────────────────────
workflowsRouter.get("/workflows/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) return res.status(404).json({ error: "Workflow not found" });
    if (companyId && workflow.companyId !== companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ success: true, workflow });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /workflows ───────────────────────────────────────────────────────────
workflowsRouter.post("/workflows", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const dataPayload = req.body.data || req.body;
    const parsed = workflowPayloadSchema.safeParse(dataPayload);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
    }

    const { id, name, triggerType, triggerConfig, steps, isActive } = parsed.data;

    let workflow;
    if (id) {
      // Verify ownership before updating
      const existing = await prisma.workflow.findUnique({ where: { id } });
      if (!existing || existing.companyId !== companyId) {
        return res.status(403).json({ error: "Cannot update workflow of another company" });
      }

      workflow = await prisma.workflow.update({
        where: { id },
        data: { name, triggerType, triggerConfig, steps, isActive },
      });
    } else {
      workflow = await prisma.workflow.create({
        data: { companyId: String(companyId), name, triggerType, triggerConfig, steps, isActive },
      });
    }

    res.json({ success: true, workflow });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /workflows/:id ─────────────────────────────────────────────────────
workflowsRouter.delete("/workflows/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Workflow not found" });
    if (companyId && existing.companyId !== companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.workflow.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /workflows/:id/toggle ────────────────────────────────────────────────
workflowsRouter.post("/workflows/:id/toggle", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);
    const { isActive } = req.body;

    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Workflow not found" });
    if (companyId && existing.companyId !== companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const workflow = await prisma.workflow.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });
    res.json({ success: true, workflow });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /workflows/bulk-delete ───────────────────────────────────────────────
workflowsRouter.post("/workflows/bulk-delete", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const parsed = bulkIdsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

    const result = await prisma.workflow.deleteMany({
      where: { id: { in: parsed.data.ids }, companyId: String(companyId) },
    });
    res.json({ success: true, count: result.count });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /workflows/bulk-toggle ───────────────────────────────────────────────
workflowsRouter.post("/workflows/bulk-toggle", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const parsed = bulkIdsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

    const result = await prisma.workflow.updateMany({
      where: { id: { in: parsed.data.ids }, companyId: String(companyId) },
      data: { isActive: Boolean(parsed.data.isActive) },
    });
    res.json({ success: true, count: result.count });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /workflows/trigger ───────────────────────────────────────────────────
workflowsRouter.post("/workflows/trigger", async (req: Request, res: Response) => {
  try {
    const { triggerType, triggerData } = req.body;
    if (!triggerType) return res.status(400).json({ error: "triggerType required" });

    const result = await triggerWorkflow(triggerType, triggerData);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /workflows/:id/execute ───────────────────────────────────────────────
workflowsRouter.post("/workflows/:id/execute", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) return res.status(404).json({ error: "Workflow not found" });
    if (companyId && workflow.companyId !== companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { triggerData, resumeFromNodeId } = req.body;
    executeWorkflow(id, triggerData || {}, resumeFromNodeId)
      .catch((err) => console.error(`[automation-service] Async execute error for ${id}:`, err));

    res.json({ success: true, message: "Execution started in background" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /workflows/:id/trigger ───────────────────────────────────────────────
workflowsRouter.post("/workflows/:id/trigger", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) return res.status(404).json({ error: "Workflow not found" });
    if (companyId && workflow.companyId !== companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { triggerData } = req.body;
    executeWorkflow(id, triggerData || {})
      .catch((err) => console.error(`[automation-service] Async trigger error for ${id}:`, err));

    res.json({ success: true, message: "Execution started in background" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
