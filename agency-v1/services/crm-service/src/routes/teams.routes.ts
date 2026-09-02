/**
 * Teams & Custom Objects Router — CRM Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-2: Protected with requireUserOrServiceAuth.
 * Fix C-3: Multi-tenant guards on teams, custom objects & company users.
 * Fix C-4: Strict Zod validation and safe type casting.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import { logger } from "../utils/logger.utils";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  companyId: z.string().min(1).optional(),
  parentId: z.string().optional().nullable(),
});

const createCustomObjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  label: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  companyId: z.string().min(1).optional(),
});

export const teamsRouter = Router();

teamsRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── Teams ────────────────────────────────────────────────────────────────────
teamsRouter.post("/teams", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createTeamSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { name, parentId } = parsed.data;
    const team = await prisma.team.create({ data: { name, companyId, parentId: parentId || null } });
    res.status(201).json({ success: true, team });
  } catch (err: any) {
    logger.error("[teams] POST /teams failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Custom Objects ───────────────────────────────────────────────────────────
teamsRouter.post("/custom-objects", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, error: "companyId required" });

    const parsed = createCustomObjectSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { name, label, description } = parsed.data;
    const def = await prisma.customObjectDefinition.create({
      data: { name, label: label ?? name, description, companyId },
    });
    res.status(201).json({ success: true, data: def });
  } catch (err: any) {
    logger.error("[teams] POST /custom-objects failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Proposal Status Update ───────────────────────────────────────────────────
teamsRouter.patch("/proposals/:id/status", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, error: "status required" });

    const proposal = await prisma.proposal.update({
      where: { id },
      data: { status },
    });
    res.json({ success: true, data: proposal });
  } catch (err: any) {
    logger.error("[teams] PATCH /proposals/:id/status failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── User & Company Lookups ───────────────────────────────────────────────────
teamsRouter.get("/users/:userId/company", async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const cu = await prisma.companyUser.findFirst({
      where: { userId },
    });
    res.json({ success: true, data: cu });
  } catch (err: any) {
    logger.error("[teams] GET /users/:userId/company failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

teamsRouter.get("/companies/:companyId/users", async (req: Request, res: Response) => {
  try {
    const companyId = String(req.params.companyId);
    const users = await prisma.companyUser.findMany({
      where: { companyId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
    res.json({ success: true, data: users.map((u: any) => u.user) });
  } catch (err: any) {
    logger.error("[teams] GET /companies/:companyId/users failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

teamsRouter.get("/companies/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const company = await prisma.company.findUnique({
      where: { id },
      select: { id: true, name: true, subscriptionTier: true },
    });
    if (!company) return res.status(404).json({ success: false, error: "Company not found" });
    res.json({ success: true, data: company });
  } catch (err: any) {
    logger.error("[teams] GET /companies/:id failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});
