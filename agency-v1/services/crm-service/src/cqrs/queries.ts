/**
 * services/crm-service/src/cqrs/queries.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CQRS — Query Side (Read Views & High-Speed Cache Projections)
 * Queries high-traffic read views from Redis cache projections with instant fallback.
 */

import { prisma } from "@agency/database";
import { redisClient } from "../lib/event-bus.singleton";

// ── Query: Get Leads Read View ───────────────────────────────────────────────

export interface GetLeadsQueryInput {
  companyId: string;
  status?: string;
  source?: string;
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export async function executeGetLeadsQuery(input: GetLeadsQueryInput) {
  const { companyId, status, source, page = 1, pageSize = 20, cursor } = input;
  const cacheKey = `crm:view:leads:${companyId}:${status || "ALL"}:${source || "ALL"}:${page}:${pageSize}:${cursor || "none"}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  const where: any = { companyId };
  if (status) where.status = status;
  if (source) where.source = source;

  const queryOptions: any = {
    where,
    orderBy: { createdAt: "desc" },
    take: pageSize,
  };

  if (cursor) {
    queryOptions.cursor = { id: cursor };
    queryOptions.skip = 1;
  } else {
    queryOptions.skip = (page - 1) * pageSize;
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany(queryOptions),
    prisma.lead.count({ where }),
  ]);

  const nextCursor = leads.length > 0 ? leads[leads.length - 1].id : undefined;

  const result = {
    leads,
    total,
    pages: Math.ceil(total / pageSize),
    page,
    nextCursor,
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
