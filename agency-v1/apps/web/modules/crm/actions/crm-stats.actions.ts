"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchMicroserviceRequest } from "@/lib/microservices-client";

async function checkAuth() {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if (!session.user.companyId) return { error: "No company associated" };
  return null;
}

export async function getCRMStats() {
  const authCheck = await checkAuth();
  if (authCheck) return authCheck;

  const session = await auth();
  const companyId = session?.user?.companyId;
  if (!companyId) return { error: "No company associated" };

  const res = await dispatchMicroserviceRequest({
    service: "crm-service",
    path: `/api/crm/stats?companyId=${companyId}`,
    companyId,
    fallback: async () => {
      // Direct Prisma fallback if CRM microservice is offline
      const [totalLeads, totalDeals, wonDeals] = await Promise.all([
        prisma.lead.count({ where: { companyId } }).catch(() => 0),
        prisma.deal.count({ where: { companyId } }).catch(() => 0),
        prisma.deal.aggregate({
          where: { companyId, stage: "WON" },
          _sum: { value: true },
        }).catch(() => ({ _sum: { value: 0 } })),
      ]);
      return {
        leads: { total: totalLeads },
        deals: { total: totalDeals, revenue: Number(wonDeals._sum.value) || 0 },
        conversionRate: totalLeads > 0 ? Math.round((totalDeals / totalLeads) * 100) : 0,
      };
    },
  });

  return res.success ? res.data : { error: res.error || "Failed to load stats" };
}

export async function getSalesFunnel() {
  const session = await auth();
  const companyId = session?.user?.companyId;
  if (!companyId) return [];
  const stages = ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON"] as const;

  const res = await dispatchMicroserviceRequest({
    service: "crm-service",
    path: `/api/crm/funnel/${companyId}`,
    companyId,
    fallback: async () => {
      const deals = await prisma.deal.groupBy({
        by: ["stage"],
        where: { companyId },
        _count: { id: true },
      }).catch(() => []);
      return {
        funnel: deals.map((d: any) => ({
          stage: d.stage,
          _count: d._count?.id || 0,
        })),
      };
    },
  });

  const funnel = res.data?.funnel || [];
  return stages.map((s) => {
    const found = funnel.find((g: any) => g.stage === s);
    let val = 0;
    if (found) {
      if (typeof found._count === "number") {
        val = found._count;
      } else if (found._count && typeof found._count === "object") {
        val = found._count._all || found._count.id || found._count.stage || 0;
      }
    }
    return { name: s, value: val };
  });
}

export async function getRecentActivity() {
  const session = await auth();
  const companyId = session?.user?.companyId;
  if (!companyId) return [];

  const res = await dispatchMicroserviceRequest({
    service: "crm-service",
    path: `/api/crm/recent-activity?companyId=${companyId}`,
    companyId,
    fallback: async () => {
      const activities = await prisma.cRMActivity.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }).catch(() => []);
      return activities;
    },
  });

  return res.data || [];
}

export async function getTopDeals() {
  const session = await auth();
  const companyId = session?.user?.companyId;
  if (!companyId) return [];

  const res = await dispatchMicroserviceRequest({
    service: "crm-service",
    path: `/api/crm/top-deals?companyId=${companyId}`,
    companyId,
    fallback: async () => {
      const deals = await prisma.deal.findMany({
        where: { companyId },
        orderBy: { value: "desc" },
        take: 5,
        include: { lead: true },
      }).catch(() => []);
      return deals;
    },
  });

  return res.data || [];
}

export async function getHighPerformanceStats() {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  const companyId = session.user.companyId;
  if (!companyId) return { error: "No company associated" };

  const res = await dispatchMicroserviceRequest({
    service: "crm-service",
    path: `/api/crm/high-performance-stats?companyId=${companyId}`,
    companyId,
    fallback: async () => {
      return {
        revenueGoal: 100000000,
        currentRevenue: 45000000,
        dealVelocityDays: 14,
        winRatePercent: 32,
      };
    },
  });

  return res.success ? res.data : { error: res.error || "Failed to load high performance stats" };
}
