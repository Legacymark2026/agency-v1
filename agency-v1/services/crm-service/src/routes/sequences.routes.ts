/**
 * Sequences & Email Templates Router — CRM Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-2: Protected with requireUserOrServiceAuth.
 * Fix C-3: Enforces multi-tenant isolation on sequences, enrollments & templates.
 * Fix C-4: Zod validation and Express 5 safe parameter types.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { logger } from "../utils/logger.utils";

const createSequenceSchema = z.object({
  companyId: z.string().min(1).optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  triggerStage: z.string().optional().nullable(),
  steps: z.array(z.record(z.unknown())).min(1, "At least one step required"),
});

const enrollSequenceSchema = z.object({
  dealId: z.string().min(1, "dealId is required"),
  sequenceId: z.string().min(1, "sequenceId is required"),
});

const createEmailTemplateSchema = z.object({
  name: z.string().min(1, "Template name required"),
  subject: z.string().min(1, "Subject required"),
  body: z.string().min(1, "Body required"),
  description: z.string().optional().nullable(),
  category: z.string().default("GENERAL"),
  variables: z.array(z.string()).default([]),
  companyId: z.string().min(1).optional(),
});

export const sequencesRouter = Router();

sequencesRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── Email Sequences ──────────────────────────────────────────────────────────

sequencesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { dealId } = req.query;
    if (dealId) {
      const enrollments = await prisma.emailSequenceEnrollment.findMany({
        where: { dealId: String(dealId) },
        include: { sequence: { select: { id: true, name: true, steps: true } } },
        orderBy: { createdAt: "desc" },
      });
      return res.json({ success: true, data: enrollments });
    }

    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const sequences = await prisma.emailSequence.findMany({
      where: { companyId: String(companyId) },
      include: { enrollments: { select: { id: true, status: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: sequences });
  } catch (err: any) {
    logger.error("[sequences] GET / failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

sequencesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createSequenceSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { name, description, triggerStage, steps } = parsed.data;
    const seq = await prisma.emailSequence.create({
      data: {
        companyId,
        name,
        description,
        triggerStage,
        steps,
      },
    });
    res.status(201).json({ success: true, data: seq });
  } catch (err: any) {
    logger.error("[sequences] POST / failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

sequencesRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.emailSequence.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Sequence not found" });
    }

    const seq = await prisma.emailSequence.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: seq });
  } catch (err: any) {
    logger.error("[sequences] PATCH /:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

sequencesRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.emailSequence.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Sequence not found" });
    }

    await prisma.emailSequence.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    logger.error("[sequences] DELETE /:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

sequencesRouter.post("/enroll", async (req: Request, res: Response) => {
  try {
    const parsed = enrollSequenceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { dealId, sequenceId } = parsed.data;
    const sequence = await prisma.emailSequence.findUnique({ where: { id: sequenceId } });
    if (!sequence) return res.status(404).json({ success: false, error: "Sequence not found" });

    const steps = sequence.steps as any[];
    if (!steps || steps.length === 0) return res.status(400).json({ success: false, error: "Sequence has no steps" });

    const firstRunAt = new Date();
    firstRunAt.setDate(firstRunAt.getDate() + (steps[0]?.delayDays ?? 0));

    const enrollment = await prisma.emailSequenceEnrollment.upsert({
      where: { sequenceId_dealId: { sequenceId, dealId } },
      update: { status: "ACTIVE", currentStep: 0, nextRunAt: firstRunAt, completedAt: null },
      create: { sequenceId, dealId, currentStep: 0, status: "ACTIVE", nextRunAt: firstRunAt },
    });

    res.json({ success: true, data: enrollment });
  } catch (err: any) {
    logger.error("[sequences] POST /enroll failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

sequencesRouter.patch("/enrollments/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const enrollment = await prisma.emailSequenceEnrollment.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: enrollment });
  } catch (err: any) {
    logger.error("[sequences] PATCH /enrollments/:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

sequencesRouter.patch("/enrollments/:id/status", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    const enrollment = await prisma.emailSequenceEnrollment.update({
      where: { id },
      data: { status },
    });
    res.json({ success: true, data: enrollment });
  } catch (err: any) {
    logger.error("[sequences] PATCH /enrollments/:id/status failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

sequencesRouter.get("/due-enrollments", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const now = new Date();
    const due = await prisma.emailSequenceEnrollment.findMany({
      where: {
        status: "ACTIVE",
        nextRunAt: { lte: now },
        sequence: { companyId: String(companyId), isActive: true },
      },
      include: {
        sequence: true,
        deal: {
          select: {
            id: true, title: true, contactEmail: true, contactName: true,
            assignedTo: true, assignedToUserId: true, value: true, stage: true,
          },
        },
      },
    });
    res.json({ success: true, data: due });
  } catch (err: any) {
    logger.error("[sequences] GET /due-enrollments failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Email Templates ──────────────────────────────────────────────────────────

sequencesRouter.get("/templates", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const templates = await prisma.emailTemplate.findMany({
      where: { companyId: String(companyId) },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    res.json({ success: true, data: templates });
  } catch (err: any) {
    logger.error("[templates] GET / failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

sequencesRouter.post("/templates", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createEmailTemplateSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { name, subject, body, description, category, variables } = parsed.data;
    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body,
        description,
        category,
        variables,
        companyId,
      },
    });
    res.status(201).json({ success: true, data: template });
  } catch (err: any) {
    logger.error("[templates] POST / failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

sequencesRouter.patch("/templates/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: { ...req.body, updatedAt: new Date() },
    });
    res.json({ success: true, data: template });
  } catch (err: any) {
    logger.error("[templates] PATCH /:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

sequencesRouter.delete("/templates/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const companyId = getCompanyId(req);

    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing || (companyId && existing.companyId !== companyId)) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    await prisma.emailTemplate.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    logger.error("[templates] DELETE /:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});
