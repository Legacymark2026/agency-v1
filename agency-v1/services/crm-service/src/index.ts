/**
 * CRM Service — Customer Relationship Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Leads, Deals, Pipeline, Scoring, Sequences, Commissions
 * Port: 4002
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const app = express();
const PORT = parseInt(process.env.PORT || "4002", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Health Checks ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "crm-service", timestamp: new Date().toISOString() });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

// ── Leads ────────────────────────────────────────────────────────────────────

app.get("/api/leads", async (req, res) => {
  try {
    const { companyId, status, page = "1", limit = "20" } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const where: Record<string, unknown> = { companyId: String(companyId) };
    if (status) where.status = String(status);

    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: parseInt(String(limit)),
        skip,
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({ leads, total, page: parseInt(String(page)), limit: parseInt(String(limit)) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/leads", async (req, res) => {
  try {
    const lead = await prisma.lead.create({ data: req.body });
    await eventBus.publish("lead.created", { leadId: lead.id, companyId: lead.companyId });
    res.status(201).json({ lead });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Deals ────────────────────────────────────────────────────────────────────

app.get("/api/deals", async (req, res) => {
  try {
    const { companyId, stage } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const where: Record<string, unknown> = { companyId: String(companyId) };
    if (stage) where.stage = String(stage);

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { assignedUser: { select: { id: true, name: true, image: true } } },
    });

    res.json({ deals });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.patch("/api/deals/:id/stage", async (req, res) => {
  try {
    const { stage, changedBy, note } = req.body;
    const deal = await prisma.deal.findUnique({ where: { id: req.params.id } });
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const updated = await prisma.deal.update({
      where: { id: req.params.id },
      data: { stage, lastActivity: new Date() },
    });

    await prisma.dealStageHistory.create({
      data: {
        dealId: deal.id,
        fromStage: deal.stage,
        toStage: stage,
        changedBy,
        note,
      },
    });

    await eventBus.publish("deal.stage_changed", {
      dealId: deal.id,
      companyId: deal.companyId,
      fromStage: deal.stage,
      toStage: stage,
    });

    if (stage === "WON") {
      await eventBus.publish("deal.won", { dealId: deal.id, value: deal.value, companyId: deal.companyId });
    }

    res.json({ deal: updated });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Pipeline Analytics ───────────────────────────────────────────────────────

app.get("/api/crm/funnel/:companyId", async (req, res) => {
  try {
    const stages = await prisma.deal.groupBy({
      by: ["stage"],
      where: { companyId: req.params.companyId },
      _count: true,
      _sum: { value: true },
    });
    res.json({ funnel: stages });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Event Bus Setup ──────────────────────────────────────────────────────────
const eventBus = new EventBus(REDIS_URL, "crm-service");

// Subscribe to relevant events from other services
eventBus.subscribe("invoice.paid", async (payload) => {
  const { dealId } = payload.data;
  if (dealId) {
    console.log(`[crm-service] Invoice paid for deal ${dealId}`);
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`📊 CRM Service running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  await eventBus.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
