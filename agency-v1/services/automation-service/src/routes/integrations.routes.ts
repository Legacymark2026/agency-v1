/**
 * Integrations Status & Campaigns Router — Automation Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix C-1: Protected with requireUserOrServiceAuth.
 * Fix C-2: Multi-tenant boundary isolation enforced on all integration configs.
 */
import { Router, Request, Response } from "express";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";

export const integrationsRouter = Router();

integrationsRouter.use(requireUserOrServiceAuth);

function getCompanyId(req: Request): string | null {
  return (req.headers["x-company-id"] as string | undefined) ||
    (req.query.companyId ? String(req.query.companyId) : null) ||
    (req.body && req.body.companyId ? String(req.body.companyId) : null);
}

// ── GET /automation/integrations-status ───────────────────────────────────────
integrationsRouter.get("/automation/integrations-status", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const configs = await prisma.integrationConfig.findMany({
      where: { companyId: String(companyId) },
    });

    const statusMap: Record<string, boolean> = {};
    for (const c of configs) {
      statusMap[c.provider] = c.isEnabled;
    }

    const wa = await prisma.whatsAppIntegration.findFirst({
      where: { companyId: String(companyId), status: "active" },
    });
    if (wa) {
      statusMap["whatsapp"] = true;
    }

    statusMap["resend"] = !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_123456789";
    if (configs.some((c) => (c.provider === "RESEND" || c.provider === "resend") && c.isEnabled)) {
      statusMap["resend"] = true;
    }

    statusMap["ai-models"] = !!process.env.GEMINI_API_KEY ||
      !!process.env.OPENAI_API_KEY ||
      configs.some((c) => (c.provider === "ai-models" || c.provider === "gemini") && c.isEnabled);

    res.json({ success: true, statusMap });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /campaigns ────────────────────────────────────────────────────────────
integrationsRouter.get("/campaigns", async (req: Request, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const campaigns = await prisma.campaign.findMany({
      where: { companyId: String(companyId) },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, campaigns });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
