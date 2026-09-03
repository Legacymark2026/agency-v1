"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchMicroserviceRequest } from "@/lib/microservices-client";
import { Campaign } from "@prisma/client";

/**
 * Returns aggregated campaigns for the user's company.
 * Uses marketing-service via API Gateway, with transparent Prisma fallback.
 */
export async function getCampaignsList(): Promise<Campaign[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const companyId = session.user.companyId || (await prisma.companyUser.findFirst({
    where: { userId: session.user.id },
    select: { companyId: true },
  }))?.companyId;

  if (!companyId) throw new Error("Company not found");

  const res = await dispatchMicroserviceRequest<Campaign[]>({
    service: "marketing-service",
    path: `/api/campaigns?companyId=${companyId}`,
    companyId,
    fallback: async () => {
      // Direct Prisma fallback if marketing microservice is offline
      const campaigns = await prisma.campaign.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
      });
      return campaigns;
    },
  });

  return res.data || [];
}

/**
 * Gets real analytics for a specific campaign or aggregated for all campaigns.
 */
export async function getCampaignAnalytics(campaignId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const companyId = session.user.companyId || (await prisma.companyUser.findFirst({
    where: { userId: session.user.id },
    select: { companyId: true },
  }))?.companyId;

  if (!companyId) throw new Error("Company not found");

  const res = await dispatchMicroserviceRequest({
    service: "marketing-service",
    path: campaignId ? `/api/campaigns/${campaignId}/metrics` : `/api/campaigns?companyId=${companyId}`,
    companyId,
    fallback: async () => {
      const campaigns = await prisma.campaign.findMany({
        where: {
          companyId,
          ...(campaignId ? { id: campaignId } : {}),
        },
      });

      const totals = campaigns.reduce(
        (acc: any, c: any) => ({
          impressions: acc.impressions + (c.impressions || 0),
          clicks: acc.clicks + (c.clicks || 0),
          conversions: acc.conversions + (c.conversions || 0),
          spend: acc.spend + (c.spend || 0),
        }),
        { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
      );

      return {
        ...totals,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
        roas: totals.spend > 0 ? (totals.conversions * 50) / totals.spend : 0,
        conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0,
        campaignCount: campaigns.length,
      };
    },
  });

  return res.data || {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    spend: 0,
    cpc: 0,
    cpm: 0,
    roas: 0,
    conversionRate: 0,
    campaignCount: 0,
  };
}
