/**
 * services/crm-service/src/cqrs/queries.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CQRS — Query Side (Read Views & High-Speed Cache Projections)
 * Queries high-traffic read views from Redis cache projections with instant fallback.
 */

import { prisma } from "@agency/database";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = new Redis(REDIS_URL);

// ── Query: Get Leads Read View ───────────────────────────────────────────────

export interface GetLeadsQueryInput {
  companyId: string;
  status?: string;
  source?: string;
  page?: number;
  pageSize?: number;
}

export async function executeGetLeadsQuery(input: GetLeadsQueryInput) {
  const { companyId, status, source, page = 1, pageSize = 20 } = input;
  const cacheKey = `crm:view:leads:${companyId}:${status || "ALL"}:${source || "ALL"}:${page}:${pageSize}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  const where: any = { companyId };
  if (status) where.status = status;
  if (source) where.source = source;

  const skip = (page - 1) * pageSize;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.lead.count({ where }),
  ]);

  const result = {
    leads,
    total,
    pages: Math.ceil(total / pageSize),
    page,
  };

  try {
    // Cache projection view for 3 minutes (180s)
    await redisClient.setex(cacheKey, 180, JSON.stringify(result));
  } catch {}

  return result;
}

// ── Query: Get Pipeline Analytics Read View ─────────────────────────────────

export async function executeGetPipelineQuery(companyId: string) {
  const cacheKey = `crm:view:pipeline:${companyId}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  const deals = await prisma.deal.groupBy({
    by: ["stage"],
    where: { companyId },
    _count: { id: true },
    _sum: { value: true },
  });

  const stages = deals.map((d: any) => ({
    stage: d.stage,
    count: d._count.id,
    totalValue: Number(d._sum.value || 0),
  }));

  const totalDeals = stages.reduce((acc, s) => acc + s.count, 0);
  const totalValue = stages.reduce((acc, s) => acc + s.totalValue, 0);

  const result = {
    companyId,
    stages,
    totalDeals,
    totalValue,
  };

  try {
    await redisClient.setex(cacheKey, 300, JSON.stringify(result));
  } catch {}

  return result;
}
