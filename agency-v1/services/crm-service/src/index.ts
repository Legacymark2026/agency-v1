/**
 * CRM Service — Customer Relationship Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Leads, Deals, Pipeline, Scoring, Sequences, Commissions
 * Port: 4002
 */

try { require("@agency/observability/register"); } catch { /* optional */ }
import { setupGracefulShutdown } from "@agency/service-auth";
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import Redis from "ioredis";
import { Client } from "pg";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { routeLead } from "./assignment-engine";

import { leadRepository } from "@repositories/lead.repository";

import { leadRouter } from "./routes/lead.routes";
import { errorHandler } from "./middlewares/crm.middleware";
import { startCrmGrpcServer } from "./grpc/crm-grpc.server";
import { serveServiceDocs } from "@agency/scant";
import * as path from "path";
import { executeCreateLeadCommand, executeUpdateDealStageCommand } from "./cqrs/commands";
import { executeGetLeadsQuery, executeGetPipelineQuery } from "./cqrs/queries";

const app = express();
app.use(metricsMiddleware("crm-service"));
const PORT = parseInt(process.env.PORT || "4002", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Start High-Speed Synchronous gRPC Server (Port 50052)
const crmGrpcServer = startCrmGrpcServer();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/api/v1", leadRouter);

// ── Interactive API Documentation (Swagger via Scant) ───────────────────────────
app.use("/api/docs", serveServiceDocs(path.resolve(__dirname, "..")));

// ── Health Checks ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "crm-service", timestamp: new Date().toISOString() });
});

app.get("/metrics", metricsEndpoint);

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
    const {
      companyId,
      status,
      source,
      scoreMin,
      scoreMax,
      search,
      page = "1",
      pageSize = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
      syncDealId,
      syncEmail,
    } = req.query;

    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const where: any = {
      companyId: String(companyId),
    };

    if (status) where.status = String(status);
    if (source) where.source = String(source);

    if (scoreMin || scoreMax) {
      where.score = {
        gte: scoreMin ? parseInt(String(scoreMin), 10) : 0,
        lte: scoreMax ? parseInt(String(scoreMax), 10) : 100,
      };
    }

    if (syncDealId || syncEmail) {
      const orConditions: any[] = [];
      if (syncDealId) orConditions.push({ convertedToDealId: String(syncDealId) });
      if (syncEmail) orConditions.push({ email: { equals: String(syncEmail), mode: "insensitive" } });
      where.OR = orConditions;
    } else if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { email: { contains: String(search), mode: "insensitive" } },
        { company: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const p = parseInt(String(page), 10);
    const limit = parseInt(String(pageSize), 10);
    const skip = (p - 1) * limit;

    const [leads, total] = await Promise.all([
      leadRepository.findMany({
        where,
        orderBy: { [String(sortBy)]: String(sortOrder) as any },
        skip,
        take: limit,
      }),
      leadRepository.count(where),
    ]);

    res.json({
      leads,
      total,
      pages: Math.ceil(total / limit),
      page: p,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/leads/analytics/source", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const analytics = await leadRepository.groupBySource(String(companyId));

    const result = analytics.map((a: any) => ({
      source: a.source,
      count: a._count.id,
      avgScore: Math.round(a._avg.score || 0),
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/leads/:id", async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        campaign: { select: { id: true, name: true, platform: true, code: true } },
      },
    });

    if (!lead) return res.status(404).json({ error: "Lead not found" });

    // Fetch optional relations independently
    let conversations: any[] = [];
    let marketingEvents: any[] = [];

    try {
      conversations = await prisma.conversation.findMany({
        where: { leadId: req.params.id },
        take: 5,
        orderBy: { updatedAt: "desc" },
        select: { id: true, channel: true, status: true, lastMessageAt: true, lastMessagePreview: true },
      });
    } catch {}

    try {
      marketingEvents = await prisma.marketingEvent.findMany({
        where: { leadId: req.params.id },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { id: true, eventType: true, eventName: true, url: true, createdAt: true },
      });
    } catch {}

    res.json({ lead: { ...lead, conversations, marketingEvents } });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/leads", async (req, res) => {
  try {
    const correlationId = (req.headers["x-correlation-id"] || `trace-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`) as string;

    // Run rule assignment and round-robin distribution
    const assigneeId = await routeLead(req.body);
    const leadData = {
      ...req.body,
      assignedTo: assigneeId || req.body.assignedTo || null,
    };

    const lead = await prisma.$transaction(async (tx: any) => {
      const createdLead = await tx.lead.create({ data: leadData });
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

app.patch("/api/leads/:id", async (req, res) => {
  try {
    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        updatedAt: new Date(),
      },
    });

    res.json({ lead: updated });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete("/api/leads/:id", async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      select: { email: true, companyId: true }
    });

    if (lead) {
      if (lead.email) {
        await prisma.deal.deleteMany({
          where: {
            companyId: lead.companyId,
            contactEmail: lead.email,
          }
        });
      }
      await prisma.lead.delete({
        where: { id: req.params.id }
      });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Lead not found" });
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/leads/bulk-update", async (req, res) => {
  try {
    const { ids, data, companyId } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: "ids array required" });

    const result = await prisma.lead.updateMany({
      where: {
        id: { in: ids },
        ...(companyId && { companyId }),
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, count: result.count });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/leads/bulk-delete", async (req, res) => {
  try {
    const { ids, companyId } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: "ids array required" });

    const leads = await prisma.lead.findMany({
      where: {
        id: { in: ids },
        ...(companyId && { companyId }),
      },
      select: { email: true, companyId: true },
    });

    const emails = leads.map((l: any) => l.email).filter(Boolean);

    await prisma.$transaction([
      prisma.deal.deleteMany({
        where: {
          companyId: { in: leads.map((l: any) => l.companyId) },
          contactEmail: { in: emails },
        },
      }),
      prisma.lead.deleteMany({
        where: {
          id: { in: ids },
          ...(companyId && { companyId }),
        },
      }),
    ]);

    res.json({ success: true, count: ids.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/leads/convert-to-deal", async (req, res) => {
  try {
    const { leadId, dealData } = req.body;
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { name: true, email: true, phone: true }
    });

    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const [deal] = await prisma.$transaction([
      prisma.deal.create({
        data: {
          title: dealData.title,
          value: dealData.value,
          stage: "QUALIFIED",
          probability: dealData.probability ?? 30,
          contactName: lead.name ?? undefined,
          contactEmail: lead.email,
          companyId: dealData.companyId,
          source: "LEAD_CONVERTED",
          expectedClose: dealData.expectedClose ? new Date(dealData.expectedClose) : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      prisma.lead.update({
        where: { id: leadId },
        data: { status: "CONVERTED", convertedAt: new Date(), updatedAt: new Date() },
      }),
    ]);

    res.status(201).json({ success: true, dealId: deal.id });
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

app.get("/api/deals/:id", async (req, res) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id },
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, image: true } } },
        },
        assignedUser: { select: { id: true, name: true, image: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    res.json({ deal });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});


app.post("/api/deals", async (req, res) => {
  try {
    const deal = await prisma.deal.create({
      data: {
        title: req.body.title,
        value: req.body.value || 0,
        stage: req.body.stage || "NEW",
        priority: req.body.priority || "MEDIUM",
        probability: req.body.probability || 10,
        contactName: req.body.contactName,
        contactEmail: req.body.contactEmail,
        companyId: req.body.companyId,
        notes: req.body.notes,
        expectedClose: req.body.expectedClose ? new Date(req.body.expectedClose) : undefined,
        source: req.body.source || "MANUAL",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    if (req.body.contactEmail) {
      const existingLead = await prisma.lead.findFirst({
        where: {
          email: req.body.contactEmail.toLowerCase(),
          companyId: req.body.companyId
        }
      });

      if (!existingLead) {
        await prisma.lead.create({
          data: {
            name: req.body.contactName || null,
            email: req.body.contactEmail.toLowerCase(),
            phone: req.body.contactPhone || null,
            company: req.body.contactCompany || null,
            message: req.body.notes || `Creado automáticamente desde Pipeline para el Deal: ${deal.title}`,
            source: req.body.source || "DIRECT",
            utmSource: req.body.utmSource || null,
            utmMedium: req.body.utmMedium || null,
            utmCampaign: req.body.utmCampaign || null,
            companyId: req.body.companyId,
            status: "NEW",
          }
        });
      }
    }

    res.status(201).json({ success: true, id: deal.id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.patch("/api/deals/:id", async (req, res) => {
  try {
    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        updatedAt: new Date(),
      },
    });
    res.json({ success: true, deal });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete("/api/deals/:id", async (req, res) => {
  try {
    await prisma.deal.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/deals/:id/activities", async (req, res) => {
  try {
    const { type, content, userId } = req.body;
    const activity = await prisma.cRMActivity.create({
      data: {
        dealId: req.params.id,
        type,
        content,
        userId: userId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
    res.status(201).json({ success: true, activity });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/deals/:id/activities", async (req, res) => {
  try {
    const activities = await prisma.cRMActivity.findMany({
      where: { dealId: req.params.id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, image: true } } },
    });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.patch("/api/deals/:id/stage", async (req, res) => {
  try {
    const { stage, userId } = req.body;
    const deal = await prisma.deal.findUnique({ where: { id: req.params.id } });
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const updated = await prisma.deal.update({
      where: { id: req.params.id },
      data: { stage, lastActivity: new Date(), updatedAt: new Date() },
    });

    if (deal.stage !== stage) {
      await prisma.dealStageHistory.create({
        data: {
          dealId: deal.id,
          fromStage: deal.stage,
          toStage: stage,
          changedBy: userId || undefined,
        }
      }).catch(() => {});
    }

    await eventBus.publish("deal.stage_changed", {
      dealId: deal.id,
      companyId: deal.companyId,
      fromStage: deal.stage,
      toStage: stage,
    });

    if (stage === "WON") {
      await eventBus.publish("deal.won", { dealId: deal.id, value: deal.value, companyId: deal.companyId });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);
      await prisma.task.create({
        data: {
          title: `[Automatizado] Iniciar Onboarding para Deal: ${deal.title}`,
          description: `Reunir requisitos iniciales y enviar contrato/factura. Valor Ganado: $${deal.value}.`,
          completed: false,
          priority: deal.value > 10000 ? "HIGH" : "MEDIUM",
          dueDate: dueDate,
          dealId: deal.id,
          companyId: deal.companyId,
          assignedTo: deal.assignedToUserId,
          createdBy: userId || "SYSTEM",
        }
      });

      await prisma.cRMActivity.create({
        data: {
          dealId: deal.id,
          userId: userId || null,
          type: "SYSTEM",
          content: "El deal ha pasado a GANADO y se generó la tarea de Onboarding automáticamente.",
          createdAt: new Date(),
        }
      }).catch((e: any) => console.error("Error creating system CRM activity:", e));
    }

    res.json({ deal: updated });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});


// ── CRM Dashboard & Performance Analytics ───────────────────────────────────────

app.get("/api/crm/stats", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const [pipelineValue, activeDeals, wonDeals, lostDeals] = await Promise.all([
      prisma.deal.aggregate({ _sum: { value: true }, where: { companyId: String(companyId), stage: { notIn: ["WON", "LOST"] } } }),
      prisma.deal.count({ where: { companyId: String(companyId), stage: { notIn: ["WON", "LOST"] } } }),
      prisma.deal.count({ where: { companyId: String(companyId), stage: "WON" } }),
      prisma.deal.count({ where: { companyId: String(companyId), stage: "LOST" } }),
    ]);

    const totalClosed = wonDeals + lostDeals;
    const winRate = totalClosed > 0 ? (wonDeals / totalClosed) * 100 : 0;

    const wonValue = await prisma.deal.aggregate({ _sum: { value: true }, where: { companyId: String(companyId), stage: "WON" } });
    const avgDealSize = wonDeals > 0 ? (wonValue._sum.value || 0) / wonDeals : 0;

    res.json({
      pipelineValue: pipelineValue._sum.value || 0,
      activeDeals,
      winRate: Math.round(winRate),
      avgDealSize: Math.round(avgDealSize),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

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

app.get("/api/crm/recent-activity", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const [recentLeads, recentDeals] = await Promise.all([
      prisma.lead.findMany({
        where: { companyId: String(companyId) },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, status: true, createdAt: true }
      }),
      prisma.deal.findMany({
        where: { companyId: String(companyId) },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, name: true, title: true, stage: true, updatedAt: true, value: true }
      }),
    ]);

    const activity = [
      ...recentLeads.map((l: any) => ({ id: l.id, type: "LEAD", title: `Nuevo lead: ${l.name}`, desc: `Estado: ${l.status}`, date: l.createdAt })),
      ...recentDeals.map((d: any) => ({ id: d.id, type: "DEAL", title: `Deal actualizado: ${d.title || d.name}`, desc: `Etapa: ${d.stage} - $${d.value}`, date: d.updatedAt })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/crm/top-deals", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const deals = await prisma.deal.findMany({
      where: {
        companyId: String(companyId),
        stage: { notIn: ["WON", "LOST"] }
      },
      orderBy: { value: "desc" },
      take: 5,
      select: { id: true, name: true, title: true, value: true, stage: true, probability: true, expectedClose: true },
    });

    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/crm/high-performance-stats", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const cid = String(companyId);
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const lastMonthStart = startOfMonth(subDays(today, 30));
    const lastMonthEnd = endOfMonth(subDays(today, 30));

    const forecastMonths = [
      { start: startOfMonth(today),               end: endOfMonth(today),               name: format(today, "MMM") },
      { start: startOfMonth(subDays(today, -30)), end: endOfMonth(subDays(today, -30)), name: format(subDays(today, -30), "MMM") },
      { start: startOfMonth(subDays(today, -60)), end: endOfMonth(subDays(today, -60)), name: format(subDays(today, -60), "MMM") },
    ];
    const forecastWindowStart = forecastMonths[0].start;
    const forecastWindowEnd   = forecastMonths[forecastMonths.length - 1].end;

    const [
      wonDealsCount,
      lostDealsCount,
      wonDealsData,
      stagnantDealsCount,
      leadSources,
      lostReasons,
      currentPipeline,
      lastMonthPipeline,
      recentActivitiesCount,
      leaderboardRaw,
      allForecastDeals,
    ] = await Promise.all([
      prisma.deal.count({ where: { companyId: cid, stage: "WON" } }),
      prisma.deal.count({ where: { companyId: cid, stage: "LOST" } }),
      prisma.deal.findMany({
        where: { companyId: cid, stage: "WON" },
        select: { createdAt: true, updatedAt: true, value: true },
      }),
      prisma.deal.count({
        where: { companyId: cid, stage: { notIn: ["WON", "LOST"] }, updatedAt: { lt: thirtyDaysAgo } },
      }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { companyId: cid },
        _count: { source: true },
        orderBy: { _count: { source: "desc" } },
        take: 5,
      }),
      prisma.deal.groupBy({
        by: ["lostReason"],
        where: { companyId: cid, stage: "LOST", lostReason: { not: null } },
        _count: { lostReason: true },
        orderBy: { _count: { lostReason: "desc" } },
      }),
      prisma.deal.aggregate({
        _sum: { value: true },
        where: { companyId: cid, createdAt: { gte: startOfMonth(today) } },
      }),
      prisma.deal.aggregate({
        _sum: { value: true },
        where: { companyId: cid, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      prisma.cRMActivity.count({ where: { createdAt: { gte: subDays(today, 7) } } }),
      prisma.deal.groupBy({
        by: ["assignedToUserId"],
        where: {
          companyId: cid,
          stage: "WON",
          assignedToUserId: { not: null },
        },
        _sum: { value: true },
        orderBy: { _sum: { value: "desc" } },
        take: 5,
      }),
      prisma.deal.findMany({
        where: {
          companyId: cid,
          stage: { notIn: ["WON", "LOST"] },
          expectedClose: { gte: forecastWindowStart, lte: forecastWindowEnd },
        },
        select: { value: true, probability: true, expectedClose: true },
      }),
    ]);

    const assignedUserIds = leaderboardRaw
      .map((r: any) => r.assignedToUserId)
      .filter((id): id is string => !!id);

    const userNames = assignedUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: assignedUserIds } },
          select: { id: true, name: true },
        })
      : [];
    const nameMap = new Map(userNames.map((u: any) => [u.id, u.name]));

    const rankedLeaderboard = leaderboardRaw.map((r: any) => ({
      name: nameMap.get(r.assignedToUserId!) || r.assignedToUserId || "Sin asignar",
      wonValue: r._sum.value || 0,
    }));

    const forecastData = forecastMonths.map((month) => {
      const monthDeals = allForecastDeals.filter((d: any) => {
        const ec = d.expectedClose;
        return ec && ec >= month.start && ec <= month.end;
      });
      const weighted = monthDeals.reduce((acc: any, d: any) => acc + d.value * (d.probability / 100), 0);
      const total    = monthDeals.reduce((acc: any, d: any) => acc + d.value, 0);
      return { name: month.name, weighted: Math.round(weighted), total: Math.round(total) };
    });

    const forecastValue   = forecastData.reduce((acc, d) => acc + d.weighted, 0);
    const currentVal      = currentPipeline._sum.value || 0;
    const lastVal         = lastMonthPipeline._sum.value || 0;
    const momGrowth       = lastVal === 0 ? 100 : ((currentVal - lastVal) / lastVal) * 100;
    const totalDays       = wonDealsData.reduce((acc, deal) => {
      const diff = Math.abs(deal.updatedAt.getTime() - deal.createdAt.getTime());
      return acc + Math.ceil(diff / 86400000);
    }, 0);
    const avgDaysToClose  = wonDealsData.length > 0 ? Math.round(totalDays / wonDealsData.length) : 0;
    const wonValue        = wonDealsData.reduce((acc, deal) => acc + deal.value, 0);
    const monthlyTarget   = parseInt(process.env.MONTHLY_SALES_TARGET ?? "50000", 10);
    const goalProgress    = (wonValue / monthlyTarget) * 100;

    res.json({
      forecastValue: Math.round(forecastValue),
      forecastData,
      leadSources:   leadSources.map((ls: any) => ({ name: ls.source, value: ls._count.source })),
      lostReasons:   lostReasons.map((lr: any) => ({ reason: lr.lostReason || "Other", count: lr._count.lostReason })),
      stagnantDealsCount,
      momGrowth:     Math.round(momGrowth),
      avgDaysToClose,
      wonValue:      Math.round(wonValue),
      monthlyTarget,
      goalProgress:  Math.min(100, Math.round(goalProgress)),
      activityIntensity: recentActivitiesCount,
      winRate: wonDealsCount + lostDealsCount > 0
          ? Math.round((wonDealsCount / (wonDealsCount + lostDealsCount)) * 100)
          : 0,
      leaderboard: rankedLeaderboard,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Event Bus Setup & CQRS Worker ────────────────────────────────────────────
const eventBus = new EventBus(REDIS_URL, "crm-service");
const redisClient = new Redis(REDIS_URL);
redisClient.on("error", (err) => console.error("[crm-service] Redis client error:", err.message));

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
const startMessageRelayWorker = async () => {
  let isPolling = false;
  let pendingPoll = false;

  const poll = async () => {
    if (isPolling) {
      pendingPoll = true;
      return;
    }
    isPolling = true;
    pendingPoll = false;

    try {
      let hasMore = true;
      while (hasMore) {
        const pendingEvents = await prisma.outboxEvent.findMany({
          where: {
            status: { in: ["PENDING", "FAILED"] },
            attempts: { lt: 3 },
          },
          orderBy: { createdAt: "asc" },
          take: 20,
        });

        if (pendingEvents.length === 0) {
          hasMore = false;
          break;
        }

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
      }
    } catch (err) {
      console.error(`[MessageRelayWorker] Error checking outbox events:`, err);
    } finally {
      isPolling = false;
      if (pendingPoll) {
        setTimeout(poll, 0);
      }
    }
  };

  // Setup Postgres client to LISTEN for notifications directly from postgres (port 5432)
  let connectionString = process.env.CORE_DATABASE_URL || process.env.DATABASE_URL || "postgresql://legacymark:legacymark_dev@postgres:5432/legacymark_core";
  connectionString = connectionString
    .replace("pgbouncer:6432", "postgres:5432")
    .replace("pgbouncer=true", "pgbouncer=false");

  const pgClient = new Client({ connectionString });

  const connectAndListen = async () => {
    try {
      await pgClient.connect();
      await pgClient.query("LISTEN outbox_event_inserted");
      console.log("🔔 Message Relay Worker: Pg LISTEN connected & listening on 'outbox_event_inserted'");

      pgClient.on("notification", (msg) => {
        console.log(`🔔 Notification received for outbox event: ${msg.payload}`);
        poll();
      });

      pgClient.on("error", async (err) => {
        console.error("🔔 PG Listener Client error:", err);
        try {
          await pgClient.end();
        } catch {}
        setTimeout(connectAndListen, 5000);
      });
    } catch (err) {
      console.error("🔔 Failed to connect PG Listener client, retrying in 5s:", err);
      setTimeout(connectAndListen, 5000);
    }
  };

  await connectAndListen();

  // Fallback passive check every 30 seconds
  setInterval(poll, 30000);

  // Initial run
  poll();
  console.log("📨 Message Relay Worker started");
};

startMessageRelayWorker();

// ── Campaigns ────────────────────────────────────────────────────────────────

app.get('/api/campaigns', async (req, res) => {
  try {
    const { companyId, status } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const campaigns = await prisma.campaign.findMany({
      where: {
        companyId: String(companyId),
        ...(status && { status: String(status) })
      },
      include: { _count: { select: { leads: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const data = campaigns.map(c => {
      const cpl = c.conversions > 0 && c.spend > 0 ? c.spend / c.conversions : 0;
      const revenue = c._count.leads * 150;
      const roas = c.spend > 0 ? revenue / c.spend : 0;
      const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
      return {
        ...c,
        leadCount: c._count.leads,
        cpl: Math.round(cpl),
        roas: parseFloat(roas.toFixed(2)),
        ctr: parseFloat(ctr.toFixed(2))
      };
    });
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const { name, code, platform, budget, startDate, endDate, description, companyId, status } = req.body;
    const campaign = await prisma.campaign.create({
      data: {
        name,
        code: code.toUpperCase().replace(/\s+/g, '-'),
        platform,
        budget: budget ? Number(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description,
        companyId,
        status: status || 'ACTIVE'
      }
    });
    res.status(201).json({ success: true, data: campaign });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/campaigns/:id/metrics', async (req, res) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { leads: { select: { id: true, status: true, score: true, createdAt: true } } }
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const leadCount = campaign.leads.length;
    const convertedLeads = campaign.leads.filter(l => l.status === 'CONVERTED').length;
    const avgLeadScore = leadCount > 0 ? Math.round(campaign.leads.reduce((sum, l) => sum + l.score, 0) / leadCount) : 0;
    const costPerLead = campaign.spend > 0 && leadCount > 0 ? (campaign.spend / leadCount).toFixed(2) : null;
    res.json({
      success: true,
      data: { ...campaign, leadCount, convertedLeads, avgLeadScore, costPerLead }
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/campaigns/:id', async (req, res) => {
  try {
    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: campaign });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/campaigns/:id/metrics', async (req, res) => {
  try {
    const { impressions, clicks, conversions, spend } = req.body;
    const data: any = { updatedAt: new Date() };
    if (impressions !== undefined) data.impressions = impressions;
    if (clicks !== undefined) data.clicks = clicks;
    if (conversions !== undefined) data.conversions = conversions;
    if (spend !== undefined) data.spend = spend;
    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data
    });
    res.json({ success: true, data: campaign });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/campaigns/:id/status', async (req, res) => {
  try {
    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: { status: req.body.status, updatedAt: new Date() }
    });
    res.json({ success: true, data: campaign });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/campaigns/:id', async (req, res) => {
  try {
    await prisma.campaign.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});


app.post('/api/campaigns/sync', async (req, res) => {
  try {
    const { companyId, platform, campaigns } = req.body;
    if (!companyId || !platform || !Array.isArray(campaigns)) {
      return res.status(400).json({ error: 'companyId, platform, and campaigns array required' });
    }
    const results: any[] = [];
    for (const c of campaigns) {
      const code = c.code || c.id;
      const name = c.name;
      const status = c.status || 'ACTIVE';
      const budget = c.budget ? Number(c.budget) : null;
      const spend = c.spend ? Number(c.spend) : undefined;
      const impressions = c.impressions ? Number(c.impressions) : undefined;
      const clicks = c.clicks ? Number(c.clicks) : undefined;
      const conversions = c.conversions ? Number(c.conversions) : undefined;

      const campaign = await prisma.campaign.upsert({
        where: { code: String(code) },
        update: {
          name,
          status,
          budget,
          ...(spend !== undefined && { spend }),
          ...(impressions !== undefined && { impressions }),
          ...(clicks !== undefined && { clicks }),
          ...(conversions !== undefined && { conversions }),
          updatedAt: new Date()
        },
        create: {
          companyId: String(companyId),
          code: String(code),
          name,
          platform,
          status,
          budget,
          spend: spend || 0,
          impressions: impressions || 0,
          clicks: clicks || 0,
          conversions: conversions || 0
        }
      });
      results.push(campaign);
    }
    res.json({ success: true, data: results });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/campaigns/spend-stats', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const stats = await prisma.campaign.aggregate({
      where: { companyId: String(companyId) },
      _sum: {
        spend: true,
        impressions: true,
        clicks: true,
        conversions: true
      }
    });
    res.json({ success: true, data: stats._sum });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/campaigns/chart-data', async (req, res) => {
  try {
    const { companyId, days } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const limitDays = days ? Number(days) : 7;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - limitDays);

    const spends = await prisma.adSpend.groupBy({
      by: ['date'],
      where: {
        companyId: String(companyId),
        date: { gte: cutoff }
      },
      _sum: {
        amount: true,
        conversions: true
      },
      orderBy: {
        date: 'asc'
      }
    });
    res.json({ success: true, data: spends });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Teams & Custom Objects ───────────────────────────────────────────────────

app.post('/api/crm/teams', async (req, res) => {
  try {
    const { name, companyId, parentId } = req.body;
    const team = await prisma.team.create({ data: { name, companyId, parentId: parentId || null } });
    res.status(201).json({ success: true, team });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/custom-objects', async (req, res) => {
  try {
    const { name, label, description, companyId } = req.body;
    const def = await prisma.customObjectDefinition.create({
      data: { name, label: label ?? name, description, companyId }
    });
    res.status(201).json({ success: true, data: def });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Automation Rules ─────────────────────────────────────────────────────────

app.get('/api/crm/automations/rules', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const rules = await prisma.dealAutomationRule.findMany({
      where: { companyId: String(companyId) },
      include: { logs: { orderBy: { createdAt: 'desc' }, take: 3 } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: rules });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/automations/rules', async (req, res) => {
  try {
    const { companyId, name, description, triggerType, triggerStage, triggerDays, actionType, actionPayload } = req.body;
    const rule = await prisma.dealAutomationRule.create({
      data: {
        companyId,
        name,
        description,
        triggerType,
        triggerStage,
        triggerDays,
        actionType,
        actionPayload: actionPayload || {},
      }
    });
    res.status(201).json({ success: true, data: rule });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/crm/automations/rules/:id', async (req, res) => {
  try {
    const rule = await prisma.dealAutomationRule.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: rule });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/crm/automations/rules/:id', async (req, res) => {
  try {
    await prisma.dealAutomationRule.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/automations/logs', async (req, res) => {
  try {
    const { ruleId, take } = req.query;
    if (!ruleId) return res.status(400).json({ error: 'ruleId required' });
    const logs = await prisma.automationLog.findMany({
      where: { ruleId: String(ruleId) },
      orderBy: { createdAt: 'desc' },
      take: take ? parseInt(String(take), 10) : 50
    });
    res.json({ success: true, data: logs });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/automations/logs', async (req, res) => {
  try {
    const log = await prisma.automationLog.create({
      data: req.body
    });
    res.status(201).json({ success: true, data: log });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Proposals & Invoices (Closing) ───────────────────────────────────────────

app.get('/api/crm/deals/:dealId/proposals', async (req, res) => {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { dealId: req.params.dealId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: proposals });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/deals/:dealId/proposals', async (req, res) => {
  try {
    const { title, validUntil, notes, lineItems, creatorId } = req.body;
    const deal = await prisma.deal.findUnique({ where: { id: req.params.dealId }, select: { companyId: true } });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    const total = lineItems.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);
    const proposal = await prisma.proposal.create({
      data: {
        title,
        dealId: req.params.dealId,
        companyId: deal.companyId,
        status: 'DRAFT',
        value: total,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes,
        items: {
          create: lineItems.map((item: any) => ({
            title: item.description,
            quantity: item.quantity,
            price: item.unitPrice
          }))
        },
        creatorId
      } as any
    });
    res.status(201).json({ success: true, data: proposal });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/crm/proposals/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const proposal = await prisma.proposal.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true, data: proposal });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/deals/:dealId/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { dealId: req.params.dealId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, serviceDescription: true, status: true, totalAmount: true, dueDate: true, createdAt: true }
    });
    res.json({ success: true, data: invoices });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/deals/:dealId/invoices', async (req, res) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.dealId },
      select: { id: true, title: true, value: true, companyId: true, contactName: true }
    });
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    const invoice = await prisma.invoice.create({
      data: {
        clientName: deal.contactName || 'Cliente',
        serviceDescription: deal.title,
        subtotalAmount: deal.value,
        taxAmount: 0,
        totalAmount: deal.value,
        advanceAmount: 0,
        finalAmount: deal.value,
        status: 'DRAFT_AWAITING_PAYMENT',
        companyId: deal.companyId,
        dealId: deal.id,
        currency: 'USD',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: {
          create: [{
            title: deal.title,
            quantity: 1,
            unitPrice: deal.value,
            totalAmount: deal.value
          }]
        }
      }
    });
    res.status(201).json({ success: true, data: invoice });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Commissions ──────────────────────────────────────────────────────────────

app.get('/api/crm/commissions/rules', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const rules = await prisma.commissionRule.findMany({
      where: { companyId: String(companyId) },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { rate: 'desc' }
    });
    res.json({ success: true, data: rules });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/commissions/rules', async (req, res) => {
  try {
    const { companyId, userId, rate, minDealValue, capAmount, label } = req.body;
    const rule = await prisma.commissionRule.create({
      data: {
        companyId,
        userId: userId || null,
        rate: Number(rate),
        minDealValue: minDealValue ? Number(minDealValue) : 0,
        capAmount: capAmount ? Number(capAmount) : null,
        label
      }
    });
    res.status(201).json({ success: true, data: rule });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/crm/commissions/rules/:id', async (req, res) => {
  try {
    const rule = await prisma.commissionRule.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: rule });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/crm/commissions/rules/:id', async (req, res) => {
  try {
    await prisma.commissionRule.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/commissions/payments', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const payments = await prisma.commissionPayment.findMany({
      where: { companyId: String(companyId) },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        deal: { select: { id: true, title: true, value: true, stage: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: payments });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/commissions/payments', async (req, res) => {
  try {
    const { companyId, dealId, userId, ruleId, amount, rate, status } = req.body;
    const payment = await prisma.commissionPayment.create({
      data: {
        companyId,
        dealId,
        userId,
        ruleId,
        amount: Number(amount),
        rate: Number(rate),
        status: status || 'PENDING'
      }
    });
    res.status(201).json({ success: true, data: payment });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/crm/commissions/payments/:id', async (req, res) => {
  try {
    const payment = await prisma.commissionPayment.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: payment });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Sales Goals ──────────────────────────────────────────────────────────────

app.get('/api/crm/goals', async (req, res) => {
  try {
    const { companyId, period } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const where: any = { companyId: String(companyId) };
    if (period) where.period = String(period);
    const goals = await prisma.salesGoal.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { targetAmount: 'desc' }
    });
    res.json({ success: true, data: goals });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/goals', async (req, res) => {
  try {
    const { companyId, userId, period, targetAmount, label, currency, level, departmentId } = req.body;
    let goal;
    if (level) {
      goal = await prisma.salesGoal.create({
        data: {
          companyId,
          level,
          period,
          targetAmount: Number(targetAmount),
          departmentId: departmentId || null,
          userId: userId || null
        }
      });
    } else {
      goal = await prisma.salesGoal.upsert({
        where: {
          companyId_userId_period: {
            companyId,
            userId: userId ?? '',
            period
          }
        },
        update: { targetAmount: Number(targetAmount), label },
        create: {
          companyId,
          userId: userId || '',
          period,
          targetAmount: Number(targetAmount),
          currency: currency ?? 'USD',
          label
        }
      });
    }
    res.status(201).json({ success: true, data: goal });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/crm/goals/:id', async (req, res) => {
  try {
    await prisma.salesGoal.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});




app.post('/api/crm/sales/commissions/calculate', async (req, res) => {
  try {
    const { companyId, dealId } = req.body;
    if (!companyId || !dealId) return res.status(400).json({ error: 'companyId and dealId required' });

    // Get Deal
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { assignedUser: true }
    });

    if (!deal || !deal.assignedTo) return res.status(404).json({ error: "Deal or owner not found" });
    if (deal.probability < 100) return res.json({ success: true, message: "Deal not WON yet" });

    // Get Commission Rule for the user (or global)
    const rule = await (prisma as any).commissionRule.findFirst({
      where: { 
        companyId, 
        isActive: true,
        OR: [{ userId: deal.assignedTo }, { userId: null }] 
      },
      orderBy: { userId: "desc" }
    });

    if (!rule) return res.status(400).json({ error: "No active commission rule found" });

    let rate = rule.rate;
    let type = "STANDARD";

    // Accelerator check
    const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const userGoal = await (prisma as any).salesGoal.findFirst({
      where: { companyId, userId: deal.assignedTo, period }
    });

    if (userGoal && userGoal.targetAmount > 0) {
      const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

      const wonDealsAgg = await prisma.deal.aggregate({
        where: {
          companyId,
          assignedTo: deal.assignedTo,
          probability: 100,
          updatedAt: { gte: start, lte: end }
        },
        _sum: { value: true }
      });

      const currentTotal = wonDealsAgg._sum.value || 0;
      if (currentTotal > userGoal.targetAmount) {
        rate = rate * 1.5;
        type = "ACCELERATOR";
      }
    }

    let amount = deal.value * rate;
    if (rule.capAmount && amount > rule.capAmount) {
      amount = rule.capAmount;
    }

    const commission = await (prisma as any).commissionPayment.create({
      data: {
        companyId,
        dealId: deal.id,
        userId: deal.assignedTo,
        ruleId: rule.id,
        amount: Math.round(amount * 100) / 100,
        rate,
        type,
        status: "PENDING"
      }
    });

    res.json({ success: true, commission });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/sales/commissions/clawback', async (req, res) => {
  try {
    const { companyId, dealId, reason } = req.body;
    if (!companyId || !dealId || !reason) return res.status(400).json({ error: 'companyId, dealId, and reason required' });

    const existing = await (prisma as any).commissionPayment.findFirst({
      where: { dealId, companyId, status: { not: "CANCELLED" } }
    });

    if (!existing) return res.status(404).json({ error: "No commission found to clawback" });

    const clawback = await (prisma as any).commissionPayment.create({
      data: {
        companyId,
        dealId,
        userId: existing.userId,
        ruleId: existing.ruleId,
        amount: -Math.abs(existing.amount), 
        rate: existing.rate,
        type: "CLAWBACK",
        status: "APPROVED",
        notes: `Clawback: ${reason}`
      }
    });

    if (existing.status === "PENDING") {
      await (prisma as any).commissionPayment.update({
        where: { id: existing.id },
        data: { status: "CANCELLED" }
      });
    }

    res.json({ success: true, clawback });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});


app.post('/api/crm/audiences/calculate-ltv', async (req, res) => {
  try {
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });

    // 1. Fetch all WON deals for the company
    const wonDeals = await prisma.deal.findMany({
      where: {
        companyId,
        stage: "WON",
        contactEmail: { not: null }
      },
      select: {
        contactEmail: true,
        value: true
      }
    });

    const ltvMap = new Map<string, number>();
    for (const deal of wonDeals) {
      const email = deal.contactEmail!.toLowerCase().trim();
      if (!email) continue;
      const current = ltvMap.get(email) || 0;
      ltvMap.set(email, current + deal.value);
    }

    if (ltvMap.size === 0) {
      return res.json({
        success: true,
        data: [
          { tier: "HIGH", leads: [] },
          { tier: "MEDIUM", leads: [] },
          { tier: "LOW", leads: [] }
        ]
      });
    }

    const sortedLTV = Array.from(ltvMap.entries()).sort((a, b) => b[1] - a[1]);
    const totalProfiles = sortedLTV.length;
    const highCutoff = Math.ceil(totalProfiles * 0.20);
    const midCutoff = Math.ceil(totalProfiles * 0.70);

    const highEmails = new Set<string>();
    const midEmails = new Set<string>();
    const lowEmails = new Set<string>();

    sortedLTV.forEach(([email, value], index) => {
      if (index < highCutoff) {
        highEmails.add(email);
      } else if (index < midCutoff) {
        midEmails.add(email);
      } else {
        lowEmails.add(email);
      }
    });

    const allRelatedLeads = await prisma.lead.findMany({
      where: {
        companyId,
        email: { in: Array.from(ltvMap.keys()) }
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        tags: true
      }
    });

    const highLeads: any[] = [];
    const midLeads: any[] = [];
    const lowLeads: any[] = [];

    const updatePromises = allRelatedLeads.map(lead => {
      const email = lead.email.toLowerCase().trim();
      let tier: "HIGH" | "MEDIUM" | "LOW" = "LOW";
      
      if (highEmails.has(email)) tier = "HIGH";
      else if (midEmails.has(email)) tier = "MEDIUM";

      const leadData = { ...lead, ltvTier: tier };
      if (tier === "HIGH") highLeads.push(leadData);
      else if (tier === "MEDIUM") midLeads.push(leadData);
      else if (tier === "LOW") lowLeads.push(leadData);

      const newTag = `[Audience: LTV ${tier}]`;
      const cleanedTags = lead.tags.filter(t => !t.startsWith("[Audience: LTV"));
      if (!cleanedTags.includes(newTag)) {
         cleanedTags.push(newTag);
         return prisma.lead.update({
           where: { id: lead.id },
           data: { tags: cleanedTags }
         });
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      data: [
        { tier: "HIGH", leads: highLeads },
        { tier: "MEDIUM", leads: midLeads },
        { tier: "LOW", leads: lowLeads }
      ]
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/sales/forecast', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const openDeals = await prisma.deal.findMany({
      where: {
        companyId: String(companyId),
        probability: { lt: 100, gt: 0 }
      },
      select: {
        id: true, title: true, value: true, probability: true, stage: true, assignedTo: true
      }
    });
    res.json({ success: true, data: openDeals });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/sales/leaderboard', async (req, res) => {
  try {
    const { companyId, period } = req.query;
    if (!companyId || !period) return res.status(400).json({ error: 'companyId and period required' });
    const [year, month] = String(period).split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const aggs = await prisma.deal.groupBy({
      by: ['assignedTo'],
      where: {
        companyId: String(companyId),
        stage: "WON",
        updatedAt: { gte: start, lte: end }
      },
      _sum: { value: true }
    });

    const leaderboard = await Promise.all(
      aggs.filter(a => a.assignedTo).map(async (agg) => {
        const u = await prisma.user.findUnique({
          where: { id: agg.assignedTo! },
          select: { id: true, name: true, image: true, firstName: true, lastName: true }
        });
        return {
          user: u,
          totalSold: agg._sum.value || 0
        };
      })
    );

    res.json({ success: true, data: leaderboard });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/users/:userId/company', async (req, res) => {
  try {
    const cu = await prisma.companyUser.findFirst({
      where: { userId: req.params.userId }
    });
    res.json({ success: true, data: cu });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/goals/hierarchical', async (req, res) => {
  try {
    const { companyId, period } = req.query;
    if (!companyId || !period) return res.status(400).json({ error: 'companyId and period required' });
    const goals = await prisma.salesGoal.findMany({
      where: { companyId: String(companyId), period: String(period) },
      include: {
        user: { select: { id: true, name: true, image: true, firstName: true, lastName: true } }
      },
      orderBy: [
        { level: "asc" },
        { targetAmount: "desc" }
      ]
    });

    const [year, month] = String(period).split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const wonDeals = await prisma.deal.findMany({
      where: {
        companyId: String(companyId),
        stage: "WON",
        updatedAt: { gte: start, lte: end }
      },
      select: {
        id: true, value: true, assignedTo: true, probability: true
      }
    });

    res.json({ success: true, data: { goals, wonDeals } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/companies/:companyId/users', async (req, res) => {
  try {
    const users = await prisma.companyUser.findMany({
      where: { companyId: req.params.companyId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } }
    });
    res.json({ success: true, data: users.map((u: any) => u.user) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/companies/:id', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, subscriptionTier: true }
    });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});



// ── Email Sequences ──────────────────────────────────────────────────────────

app.get('/api/crm/sequences', async (req, res) => {
  try {
    const { companyId, dealId } = req.query;
    if (dealId) {
      const enrollments = await prisma.emailSequenceEnrollment.findMany({
        where: { dealId: String(dealId) },
        include: { sequence: { select: { id: true, name: true, steps: true } } },
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ success: true, data: enrollments });
    }
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const sequences = await prisma.emailSequence.findMany({
      where: { companyId: String(companyId) },
      include: { enrollments: { select: { id: true, status: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: sequences });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/sequences', async (req, res) => {
  try {
    const { companyId, name, description, triggerStage, steps } = req.body;
    const seq = await prisma.emailSequence.create({
      data: {
        companyId,
        name,
        description,
        triggerStage,
        steps
      }
    });
    res.status(201).json({ success: true, data: seq });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/crm/sequences/:id', async (req, res) => {
  try {
    const seq = await prisma.emailSequence.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: seq });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/crm/sequences/:id', async (req, res) => {
  try {
    await prisma.emailSequence.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/sequences/enroll', async (req, res) => {
  try {
    const { dealId, sequenceId } = req.body;
    const sequence = await prisma.emailSequence.findUnique({ where: { id: sequenceId } });
    if (!sequence) return res.status(404).json({ error: 'Sequence not found' });
    const steps = sequence.steps as any[];
    if (!steps || steps.length === 0) return res.status(400).json({ error: 'Sequence has no steps' });
    const firstRunAt = new Date();
    firstRunAt.setDate(firstRunAt.getDate() + (steps[0]?.delayDays ?? 0));
    const enrollment = await prisma.emailSequenceEnrollment.upsert({
      where: { sequenceId_dealId: { sequenceId, dealId } },
      update: { status: 'ACTIVE', currentStep: 0, nextRunAt: firstRunAt, completedAt: null },
      create: { sequenceId, dealId, currentStep: 0, status: 'ACTIVE', nextRunAt: firstRunAt }
    });
    res.json({ success: true, data: enrollment });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/crm/sequences/enrollments/:id', async (req, res) => {
  try {
    const enrollment = await prisma.emailSequenceEnrollment.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: enrollment });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/crm/sequences/enrollments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const enrollment = await prisma.emailSequenceEnrollment.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true, data: enrollment });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/sequences/due-enrollments', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const now = new Date();
    const due = await prisma.emailSequenceEnrollment.findMany({
      where: {
        status: 'ACTIVE',
        nextRunAt: { lte: now },
        sequence: { companyId: String(companyId), isActive: true }
      },
      include: {
        sequence: true,
        deal: {
          select: {
            id: true, title: true, contactEmail: true, contactName: true,
            assignedTo: true, assignedToUserId: true, value: true, stage: true
          }
        }
      }
    });
    res.json({ success: true, data: due });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});



// ── Tasks ────────────────────────────────────────────────────────────────────
app.get('/api/crm/tasks', async (req, res) => {
  try {
    const { companyId, completed, dealId, assignedTo } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const tasks = await prisma.task.findMany({
      where: {
        companyId: String(companyId),
        ...(completed !== undefined && { completed: completed === 'true' }),
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
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/tasks', async (req, res) => {
  try {
    const { title, description, dueDate, priority, dealId, leadId, assignedTo, companyId, createdBy } = req.body;
    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        dealId: dealId || null,
        leadId: leadId || null,
        assignedTo: assignedTo || null,
        companyId,
        createdBy: createdBy || 'system'
      }
    });
    res.status(201).json({ success: true, data: task });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/tasks/:id', async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/crm/tasks/:id', async (req, res) => {
  try {
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { ...req.body, updatedAt: new Date() }
    });
    res.json({ success: true, data: task });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/crm/tasks/:id', async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Email Templates ──────────────────────────────────────────────────────────
app.get('/api/crm/email-templates', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const templates = await prisma.emailTemplate.findMany({
      where: { companyId: String(companyId) },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    res.json({ success: true, data: templates });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/email-templates', async (req, res) => {
  try {
    const { name, subject, body, description, category, variables, companyId } = req.body;
    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body,
        description,
        category: category || 'GENERAL',
        variables: variables || [],
        companyId
      }
    });
    res.status(201).json({ success: true, data: template });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/crm/email-templates/:id', async (req, res) => {
  try {
    const template = await prisma.emailTemplate.update({
      where: { id: req.params.id },
      data: { ...req.body, updatedAt: new Date() }
    });
    res.json({ success: true, data: template });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/crm/email-templates/:id', async (req, res) => {
  try {
    await prisma.emailTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Lead Scoring Rules ────────────────────────────────────────────────────────
app.get('/api/crm/scoring-rules', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const rules = await prisma.leadScoringRule.findMany({
      where: { companyId: String(companyId) },
      orderBy: { createdAt: "asc" },
    });
    res.json({ success: true, data: rules });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/scoring-rules', async (req, res) => {
  try {
    const { name, field, operator, value, points, companyId } = req.body;
    const rule = await prisma.leadScoringRule.create({
      data: { name, field, operator, value, points: Number(points), companyId }
    });
    res.status(201).json({ success: true, data: rule });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/scoring-rules/:id', async (req, res) => {
  try {
    const rule = await prisma.leadScoringRule.findUnique({ where: { id: req.params.id } });
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json({ success: true, data: rule });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/crm/scoring-rules/:id', async (req, res) => {
  try {
    const rule = await prisma.leadScoringRule.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: rule });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/crm/scoring-rules/:id', async (req, res) => {
  try {
    await prisma.leadScoringRule.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Scoring logic helpers
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function evaluateRule(value: unknown, operator: string, ruleValue: string | null): boolean {
  switch (operator) {
    case "exists": return value !== null && value !== undefined && value !== "";
    case "equals": return String(value) === ruleValue;
    case "contains": return typeof value === "string" && value.toLowerCase().includes((ruleValue ?? "").toLowerCase());
    case "greaterThan": return typeof value === "number" && value > Number(ruleValue);
    case "lessThan": return typeof value === "number" && value < Number(ruleValue);
    case "in": return (ruleValue ?? "").split(",").map((s) => s.trim()).includes(String(value));
    default: return false;
  }
}

async function computeLeadScore(lead: Record<string, unknown>, companyId: string): Promise<number> {
  const rules = await prisma.leadScoringRule.findMany({ where: { companyId, active: true } });
  let score = 0;
  for (const rule of rules) {
    const fieldVal = rule.field.includes(".") ? getNestedValue(lead, rule.field) : lead[rule.field];
    const match = evaluateRule(fieldVal, rule.operator, rule.value ?? null);
    if (match) score += rule.points;
  }
  return Math.max(0, Math.min(100, score));
}

function enrichLeadWithEvents(lead: any) {
  const events = lead.marketingEvents || [];
  const aggregatedEvents = {
    website_visits: events.filter((e: any) => e.eventType === 'PAGE_VIEW').length,
    email_opens: events.filter((e: any) => e.eventType === 'EMAIL_OPEN').length,
    downloads: events.filter((e: any) => e.eventType === 'DOWNLOAD' || (e.eventName && e.eventName.toLowerCase().includes('descarga'))).length,
    webinars: events.filter((e: any) => e.eventType === 'WEBINAR' || (e.eventName && e.eventName.toLowerCase().includes('webinar'))).length,
    quote_requests: events.filter((e: any) => e.eventType === 'FORM_SUBMIT' && e.eventName && (e.eventName.toLowerCase().includes('cotiza') || e.eventName.toLowerCase().includes('presupuesto'))).length,
    demos: events.filter((e: any) => e.eventType === 'FORM_SUBMIT' && e.eventName && e.eventName.toLowerCase().includes('demo')).length,
    pricing_visits: events.filter((e: any) => e.eventType === 'PAGE_VIEW' && e.url && e.url.toLowerCase().includes('precio')).length,
  };
  return { ...lead, events: aggregatedEvents };
}

app.post('/api/crm/scoring/recalculate-all', async (req, res) => {
  try {
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const leads = await prisma.lead.findMany({
      where: { companyId },
      include: { marketingEvents: true }
    });
    let updated = 0;
    for (const lead of leads) {
      const enrichedLead = enrichLeadWithEvents(lead);
      const score = await computeLeadScore(enrichedLead as unknown as Record<string, unknown>, companyId);
      await prisma.lead.update({ where: { id: lead.id }, data: { score } });
      updated++;
    }
    res.json({ success: true, updated });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/scoring/recalculate-lead', async (req, res) => {
  try {
    const { leadId, companyId } = req.body;
    if (!leadId || !companyId) return res.status(400).json({ error: 'leadId and companyId required' });
    const lead = await prisma.lead.findUnique({
      where: { id: leadId, companyId },
      include: { marketingEvents: true }
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    const enrichedLead = enrichLeadWithEvents(lead);
    const score = await computeLeadScore(enrichedLead as unknown as Record<string, unknown>, companyId);
    await prisma.lead.update({ where: { id: leadId }, data: { score } });
    res.json({ success: true, score });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── CRM Reports ──────────────────────────────────────────────────────────────
app.get('/api/crm/reports', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
        label: d.toLocaleString("es", { month: "short" })
      };
    });

    const [wonDeals, lostDeals, allLeads, allDeals, sourceStats] = await Promise.all([
      prisma.deal.findMany({ where: { companyId: String(companyId), stage: "WON" }, select: { value: true, createdAt: true, updatedAt: true } }),
      prisma.deal.findMany({ where: { companyId: String(companyId), stage: "LOST" }, select: { value: true, createdAt: true } }),
      prisma.lead.findMany({ where: { companyId: String(companyId) }, select: { source: true, status: true, score: true, createdAt: true } }),
      prisma.deal.findMany({ where: { companyId: String(companyId) }, select: { id: true, value: true, stage: true, source: true, createdAt: true, assignedUser: { select: { name: true } } } }),
      prisma.lead.groupBy({ by: ["source"], where: { companyId: String(companyId) }, _count: { source: true }, orderBy: { _count: { source: "desc" } } }),
    ]);

    // Revenue by month
    const revenueByMonth = months.map((m) => ({
      month: m.label,
      revenue: wonDeals.filter((d) => d.updatedAt >= m.start && d.updatedAt <= m.end).reduce((a, d) => a + d.value, 0),
      leads: allLeads.filter((l) => l.createdAt >= m.start && l.createdAt <= m.end).length,
    }));

    // Win rate trend by month
    const winRateByMonth = months.map((m) => {
      const won = wonDeals.filter((d) => d.updatedAt >= m.start && d.updatedAt <= m.end).length;
      const lost = lostDeals.filter((d) => d.createdAt >= m.start && d.createdAt <= m.end).length;
      const total = won + lost;
      return { month: m.label, winRate: total > 0 ? Math.round((won / total) * 100) : 0 };
    });

    // Lead-to-deal conversion by source
    const conversionBySource = sourceStats.slice(0, 6).map((s) => {
      const converted = allLeads.filter((l) => l.source === s.source && l.status === "CONVERTED").length;
      const total = s._count.source;
      return { source: s.source, total, converted, rate: total > 0 ? Math.round((converted / total) * 100) : 0 };
    });

    // Revenue by stage
    const stageRevenue: Record<string, number> = {};
    allDeals.forEach((d) => { stageRevenue[d.stage] = (stageRevenue[d.stage] ?? 0) + d.value; });

    // Sales rep leaderboard
    const repMap: Record<string, { name: string; won: number; value: number }> = {};
    allDeals.filter((d) => d.stage === "WON").forEach((d) => {
      const name = d.assignedUser?.name ?? "Sin asignar";
      repMap[name] = { name, won: (repMap[name]?.won ?? 0) + 1, value: (repMap[name]?.value ?? 0) + d.value };
    });
    const salesReps = Object.values(repMap).sort((a, b) => b.value - a.value).slice(0, 5);

    // Avg time to close (days)
    const closedDeals = wonDeals.filter((d) => d.createdAt && d.updatedAt);
    const avgDaysToClose = closedDeals.length > 0
      ? Math.round(closedDeals.reduce((a, d) => a + (d.updatedAt.getTime() - d.createdAt.getTime()) / 86400000, 0) / closedDeals.length)
      : 0;

    const totalRevenue = wonDeals.reduce((a, d) => a + d.value, 0);
    const totalLeads = allLeads.length;
    const totalDeals = allDeals.length;
    const winRate = wonDeals.length + lostDeals.length > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0;

    res.json({
      success: true,
      data: { revenueByMonth, winRateByMonth, conversionBySource, stageRevenue, salesReps, avgDaysToClose, totalRevenue, totalLeads, totalDeals, winRate }
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});


// ── Automation ───────────────────────────────────────────────────────────────
app.get('/api/crm/automation/rules', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const rules = await prisma.dealAutomationRule.findMany({
      where: { companyId: String(companyId) },
      include: { logs: { orderBy: { createdAt: "desc" }, take: 3 } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: rules });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/automation/rules', async (req, res) => {
  try {
    const { companyId, name, description, triggerType, triggerStage, triggerDays, actionType, actionPayload } = req.body;
    const rule = await prisma.dealAutomationRule.create({
      data: {
        companyId,
        name,
        description,
        triggerType,
        triggerStage,
        triggerDays: triggerDays ? Number(triggerDays) : null,
        actionType,
        actionPayload: actionPayload || {},
      }
    });
    res.status(201).json({ success: true, data: rule });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/crm/automation/rules/:id', async (req, res) => {
  try {
    const rule = await prisma.dealAutomationRule.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: rule });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/crm/automation/rules/:id', async (req, res) => {
  try {
    await prisma.dealAutomationRule.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/automation/rules/:id/logs', async (req, res) => {
  try {
    const take = req.query.take ? Number(req.query.take) : 50;
    const logs = await prisma.automationLog.findMany({
      where: { ruleId: req.params.id },
      orderBy: { createdAt: "desc" },
      take,
    });
    res.json({ success: true, data: logs });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/automation/logs', async (req, res) => {
  try {
    const { ruleId, dealId, result, message } = req.body;
    const log = await prisma.automationLog.create({
      data: { ruleId, dealId, result, message }
    });
    res.status(201).json({ success: true, data: log });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/automation/stagnant-deals', async (req, res) => {
  try {
    const { companyId, triggerStage, cutoffDate } = req.query;
    if (!companyId || !triggerStage || !cutoffDate) {
      return res.status(400).json({ error: 'companyId, triggerStage, and cutoffDate required' });
    }
    const stagnantDeals = await prisma.deal.findMany({
      where: {
        companyId: String(companyId),
        stage: String(triggerStage),
        lastActivity: { lte: new Date(String(cutoffDate)) },
        stage_not: "WON" as any,
      } as any,
      include: { assignedUser: { select: { id: true, email: true, name: true } } },
    });
    res.json({ success: true, data: stagnantDeals });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/crm/notifications', async (req, res) => {
  try {
    const { userId, companyId, title, message, type } = req.body;
    const notification = await prisma.notification.create({
      data: { userId, companyId, title, message, type }
    });
    res.status(201).json({ success: true, data: notification });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});


// ── Closing ──────────────────────────────────────────────────────────────────
app.get('/api/crm/deals/:dealId/stage-history', async (req, res) => {
  try {
    const history = await prisma.dealStageHistory.findMany({
      where: { dealId: req.params.dealId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, image: true } } }
    });
    res.json({ success: true, data: history });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/closing/stagnant-deals', async (req, res) => {
  try {
    const { companyId, thresholdDays } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const limitDays = thresholdDays ? Number(thresholdDays) : 7;
    const cutoff = new Date(Date.now() - limitDays * 24 * 60 * 60 * 1000);
    const stagnant = await prisma.deal.findMany({
      where: {
        companyId: String(companyId),
        stage: { notIn: ['WON', 'LOST'] },
        lastActivity: { lt: cutoff }
      },
      select: { id: true, title: true, value: true, stage: true, lastActivity: true, contactName: true, assignedUser: { select: { name: true } } },
      orderBy: { lastActivity: 'asc' }
    });
    res.json({ success: true, data: stagnant });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/crm/closing/funnel-conversion-report', async (req, res) => {
  try {
    const { companyId, stages } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const stageList = stages ? String(stages).split(',') : [];

    // Count deals per stage
    const stageCounts = await prisma.deal.groupBy({
      by: ['stage'],
      where: { companyId: String(companyId) },
      _count: { stage: true },
      _sum: { value: true },
    });

    // Avg days in each stage from stage history
    let avgDaysByStage: Record<string, number> = {};
    try {
      const historyData = await prisma.dealStageHistory.groupBy({
        by: ['toStage'],
        where: { deal: { companyId: String(companyId) } },
        _count: { toStage: true },
      });
      avgDaysByStage = Object.fromEntries(stageList.map(s => [s, 0]));
    } catch {
      avgDaysByStage = Object.fromEntries(stageList.map(s => [s, 0]));
    }

    const stageData = stageList.map((stage, i) => {
      const row = stageCounts.find(r => r.stage === stage);
      const count = row?._count.stage ?? 0;
      const value = row?._sum.value ?? 0;
      const prevCount = i > 0 ? (stageCounts.find(r => r.stage === stageList[i - 1])?._count.stage ?? 0) : count;
      const conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
      return { stage, count, value, conversionRate, avgDays: avgDaysByStage[stage] ?? 0 };
    });

    res.json({ success: true, data: stageData });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── High-Speed Synchronous gRPC Server & Client Setup ─────────────────────────
import { GrpcServerHelper, GrpcClientHelper, PROTO_PATHS } from "@agency/grpc";

const CRM_GRPC_PORT = parseInt(process.env.GRPC_PORT || "50052", 10);
const AUTH_GRPC_URL = process.env.AUTH_GRPC_URL || "auth-service:50051";

// 1. gRPC Server for CRM Service (Handled by startCrmGrpcServer() at startup)

// 2. gRPC Client to Auth Service (with Circuit Breaker)
export const authGrpcClient = GrpcClientHelper.getClient(
  "auth-service",
  PROTO_PATHS.auth,
  "auth",
  "AuthService",
  AUTH_GRPC_URL,
  { failureThreshold: 3, resetTimeoutMs: 5000, timeoutMs: 3000 }
);

app.use(errorHandler as any);

// ── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`📊 CRM Service running on port ${PORT} (HTTP) and port ${CRM_GRPC_PORT} (gRPC Sync)`);
});
setupGracefulShutdown(server);

process.on("SIGTERM", async () => {
  await crmGrpcServer.forceShutdown();
  await eventBus.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;

