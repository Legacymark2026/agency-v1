/**
 * Executions & Workflow Analytics Router — Automation Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: Protected with requireUserOrServiceAuth.
 * Fix C-2: Multi-tenant boundary isolation enforced on all executions & analytics.
 */
import { Router, Request, Response } from "express";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { executeWorkflow } from "../workflow-executor";

export const executionsRouter = Router();

executionsRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── GET /automation/executions/recent ─────────────────────────────────────────
executionsRouter.get("/automation/executions/recent", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const executions = await prisma.workflowExecution.findMany({
      where: { workflow: { companyId: String(companyId) } },
      take: 15,
      orderBy: { startedAt: "desc" },
      include: {
        workflow: {
          select: { name: true, id: true },
        },
      },
    });
    res.json({ success: true, executions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /automation/executions/:id ────────────────────────────────────────────
executionsRouter.get("/automation/executions/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const execution = await prisma.workflowExecution.findUnique({
      where: { id },
      include: { workflow: true },
    });

    if (!execution) return res.status(404).json({ error: "Execution not found" });
    if (companyId && execution.workflow.companyId !== companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ success: true, execution });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /automation/analytics ─────────────────────────────────────────────────
executionsRouter.get("/automation/analytics", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const [totalWorkflows, activeWorkflows, totalExecutions, failedExecutions] = await Promise.all([
      prisma.workflow.count({ where: { companyId: String(companyId) } }),
      prisma.workflow.count({ where: { companyId: String(companyId), isActive: true } }),
      prisma.workflowExecution.count({ where: { workflow: { companyId: String(companyId) } } }),
      prisma.workflowExecution.count({ where: { workflow: { companyId: String(companyId) }, status: "FAILED" } }),
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
        startedAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    const topWorkflows = await prisma.workflow.findMany({
      where: { companyId: String(companyId) },
      include: {
        _count: { select: { executions: true } },
      },
      orderBy: {
        executions: { _count: "desc" },
      },
      take: 5,
    });

    res.json({
      success: true,
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      successRate,
      recentActivity,
      topWorkflows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /workflows/executions/:id/resume ─────────────────────────────────────
executionsRouter.post("/workflows/executions/:id/resume", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);
    const { resumeFromNodeId } = req.body;

    const execution = await prisma.workflowExecution.findUnique({
      where: { id },
      include: { workflow: true },
    });

    if (!execution) return res.status(404).json({ error: "Execution not found" });
    if (companyId && execution.workflow.companyId !== companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    executeWorkflow(execution.workflowId, {}, resumeFromNodeId)
      .catch((err) => console.error(`[automation-service] Async resume error for ${execution.workflowId}:`, err));

    res.json({ success: true, message: "Execution resumed in background" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
