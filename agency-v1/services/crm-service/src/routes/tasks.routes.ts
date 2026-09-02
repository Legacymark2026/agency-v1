/**
 * Tasks Router — CRM Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-2: Protected with requireUserOrServiceAuth.
 * Fix C-3: Enforces multi-tenant isolation on tasks.
 * Fix C-4: Strict Zod validation and safe type casting.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { logger } from "../utils/logger.utils";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dealId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  companyId: z.string().min(1).optional(),
  createdBy: z.string().optional().nullable(),
});

export const tasksRouter = Router();

tasksRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── GET /api/crm/tasks ────────────────────────────────────────────────────────
tasksRouter.get("/", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const { completed, dealId, assignedTo } = req.query;
    const tasks = await prisma.task.findMany({
      where: {
        companyId: String(companyId),
        ...(completed !== undefined && { completed: completed === "true" }),
        ...(dealId && { dealId: String(dealId) }),
        ...(assignedTo && { assignedTo: String(assignedTo) }),
      },
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: tasks });
  } catch (err: any) {
    logger.error("[tasks] GET / failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/crm/tasks ───────────────────────────────────────────────────────
tasksRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createTaskSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { title, description, dueDate, priority, dealId, leadId, assignedTo, createdBy } = parsed.data;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "MEDIUM",
        dealId: dealId || null,
        leadId: leadId || null,
        assignedTo: assignedTo || null,
        companyId,
        createdBy: createdBy || "system",
      },
    });

    res.status(201).json({ success: true, data: task });
  } catch (err: any) {
    logger.error("[tasks] POST / failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/crm/tasks/:id ────────────────────────────────────────────────────
tasksRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || (companyId && task.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    res.json({ success: true, data: task });
  } catch (err: any) {
    logger.error("[tasks] GET /:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/crm/tasks/:id ──────────────────────────────────────────────────
tasksRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    const task = await prisma.task.update({
      where: { id },
      data: { ...req.body, updatedAt: new Date() },
    });

    res.json({ success: true, data: task });
  } catch (err: any) {
    logger.error("[tasks] PATCH /:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/crm/tasks/:id ─────────────────────────────────────────────────
tasksRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    await prisma.task.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    logger.error("[tasks] DELETE /:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});
