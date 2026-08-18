/**
 * services/crm-service/src/cqrs/commands.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CQRS — Command Side (Write Operations & Event Sourcing)
 * Executes ACID mutations against PostgreSQL Primary and publishes events.
 */

import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import Redis from "ioredis";
import { routeLead } from "../assignment-engine";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "crm-service");
const redisClient = new Redis(REDIS_URL);

// Helper to invalidate CQRS Read View cache in Redis
async function invalidateCqrsReadView(companyId: string, resource: string) {
  try {
    const keys = await redisClient.keys(`crm:view:${resource}:${companyId}:*`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (err: any) {
    console.error("[CQRS:Command] Read view invalidation error:", err.message);
  }
}

// ── Command: Create Lead ─────────────────────────────────────────────────────

export interface CreateLeadCommandInput {
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  score?: number;
  value?: number;
  customFields?: Record<string, unknown>;
}

export async function executeCreateLeadCommand(input: CreateLeadCommandInput) {
  const { companyId, name, email, phone, source, status, score, value, customFields } = input;

  // Perform ACID write transaction on PostgreSQL Primary
  const lead = await prisma.lead.create({
    data: {
      companyId,
      name,
      email: email || null,
      phone: phone || null,
      source: source || "MANUAL",
      status: status || "NEW",
      score: score ?? 50,
      value: value ?? 0,
      customFields: customFields ? JSON.stringify(customFields) : undefined,
    },
  });

  // Automated Routing / Assignment
  try {
    const assignedUserId = await routeLead(lead.id);
    if (assignedUserId) {
      await (eventBus as any).publish("lead.assigned", {
        leadId: lead.id,
        leadName: lead.name,
        companyId,
        assignedToUserId: String(assignedUserId),
      });
    }
  } catch {}

  // Publish EventBus Event
  await eventBus.publish("lead.created", {
    leadId: lead.id,
    companyId,
    name: lead.name,
    email: lead.email,
    source: lead.source,
    score: lead.score,
  });

  // Invalidate Query Read View Cache in Redis
  await invalidateCqrsReadView(companyId, "leads");

  return lead;
}

// ── Command: Update Deal Stage ────────────────────────────────────────────────

export interface UpdateDealStageCommandInput {
  dealId: string;
  companyId: string;
  toStage: string;
  userId?: string;
}

export async function executeUpdateDealStageCommand(input: UpdateDealStageCommandInput) {
  const { dealId, companyId, toStage } = input;

  const existingDeal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!existingDeal) throw new Error("Deal not found");

  const fromStage = existingDeal.stage;

  const updatedDeal = await prisma.deal.update({
    where: { id: dealId },
    data: {
      stage: toStage,
      ...(toStage === "CLOSED_WON" ? { wonAt: new Date() } : {}),
      ...(toStage === "CLOSED_LOST" ? { lostAt: new Date() } : {}),
    },
  });

  // Publish Stage Changed Event
  await eventBus.publish("deal.stage_changed", {
    dealId,
    companyId,
    title: updatedDeal.title,
    fromStage,
    toStage,
    value: updatedDeal.value,
  });

  if (toStage === "CLOSED_WON") {
    await eventBus.publish("deal.won", {
      dealId,
      companyId,
      title: updatedDeal.title,
      value: updatedDeal.value,
    });
  } else if (toStage === "CLOSED_LOST") {
    await eventBus.publish("deal.lost", {
      dealId,
      companyId,
      title: updatedDeal.title,
    });
  }

  // Invalidate Query Read View Cache
  await invalidateCqrsReadView(companyId, "pipeline");

  return updatedDeal;
}
