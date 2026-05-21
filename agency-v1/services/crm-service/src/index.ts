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
import Redis from "ioredis";

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
    const correlationId = (req.headers["x-correlation-id"] || `trace-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`) as string;

    // Atomically persist Lead and create OutboxEvent in a single transaction
    // Guarantees Transactional Outbox consistency — if Redis is down, data is safe in tbl_outbox_events
    const lead = await prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({ data: req.body });
      await tx.outboxEvent.create({
        data: {
          eventName: "lead.created",
          payload: { leadId: createdLead.id, companyId: createdLead.companyId, data: createdLead },
          correlationId,
        },
      });
      return createdLead;
    });

    res.status(201).json({ lead });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── CQRS: Fast Read DB Endpoint (Redis Materialized View) ────────────────────
app.get("/api/cqrs/leads", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const keys = await redisClient.keys(`cqrs:leads:${companyId}:*`);
    if (keys.length === 0) {
      return res.json({ leads: [], source: "read_db_redis", note: "No leads in materialized view yet" });
    }

    const leads = await Promise.all(keys.map(k => redisClient.get(k)));
    const parsedLeads = leads.filter(Boolean).map(l => JSON.parse(l!));

    res.json({ leads: parsedLeads, source: "read_db_redis", latency: "sub-millisecond" });
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
    });

    res.json({ deals });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.patch("/api/deals/:id/stage", async (req, res) => {
  try {
    const { stage } = req.body;
    const deal = await prisma.deal.findUnique({ where: { id: req.params.id } });
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const updated = await prisma.deal.update({
      where: { id: req.params.id },
      data: { stage },
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

// ── Event Bus Setup & CQRS Worker ────────────────────────────────────────────
const eventBus = new EventBus(REDIS_URL, "crm-service");
const redisClient = new Redis(REDIS_URL);

// CQRS Synchronizer: Listen to Write DB events and update Read DB (Redis)
eventBus.subscribe("lead.created", async (payload) => {
  const { leadId, companyId, data } = payload.data as any;
  if (leadId && companyId && data) {
    console.log(`[CQRS Worker] Synchronizing lead ${leadId} to Read DB (Redis)`);
    await redisClient.set(`cqrs:leads:${companyId}:${leadId}`, JSON.stringify(data));
  }
});

eventBus.subscribe("invoice.paid", async (payload) => {
  const { dealId } = payload.data;
  if (dealId) {
    console.log(`[crm-service] Invoice paid for deal ${dealId}`);
  }
});

// ── Message Relay Worker ─────────────────────────────────────────────────────
/**
 * Polls tbl_outbox_events for PENDING/FAILED events and publishes them to EventBus.
 * This decouples the HTTP request from the Redis publish, guaranteeing
 * at-least-once delivery even if Redis was down when the lead was created.
 */
const startMessageRelayWorker = () => {
  const INTERVAL_MS = 2000;

  const poll = async () => {
    try {
      const pendingEvents = await prisma.outboxEvent.findMany({
        where: {
          status: { in: ["PENDING", "FAILED"] },
          attempts: { lt: 3 },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      });

      for (const event of pendingEvents) {
        try {
          const payloadData = event.payload as Record<string, unknown>;
          await eventBus.publish(event.eventName as any, payloadData, event.correlationId);

          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: "PROCESSED",
              processedAt: new Date(),
              attempts: { increment: 1 },
            },
          });
        } catch (pubErr) {
          console.error(`[MessageRelayWorker] Failed to publish outbox event ${event.id}:`, pubErr);

          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              attempts: { increment: 1 },
              status: "FAILED",
            },
          });
        }
      }
    } catch (err) {
      console.error(`[MessageRelayWorker] Error checking outbox events:`, err);
    } finally {
      setTimeout(poll, INTERVAL_MS);
    }
  };

  setTimeout(poll, INTERVAL_MS);
  console.log("📨 Message Relay Worker started");
};

startMessageRelayWorker();

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
