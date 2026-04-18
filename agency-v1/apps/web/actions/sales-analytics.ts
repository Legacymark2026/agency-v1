"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function getSalesForecast(period: string) {
  try {
    const user = await requireAuth();
    const cu = await prisma.companyUser.findFirst({ where: { userId: user.id }});
    if (!cu) throw new Error("No company linked");

    const [year, month] = period.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const openDeals = await prisma.deal.findMany({
      where: {
        companyId: cu.companyId,
        probability: { lt: 100, gt: 0 }
      },
      select: {
        id: true, title: true, value: true, probability: true, stage: true, assignedTo: true
      }
    });

    let weightedPipeline = 0;
    let totalPipeline = 0;

    openDeals.forEach(deal => {
      totalPipeline += deal.value;
      weightedPipeline += (deal.value * (deal.probability / 100));
    });

    return { success: true, totalPipeline, weightedPipeline, deals: openDeals };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getLeaderboard(period: string) {
  try {
    const user = await requireAuth();
    const cu = await prisma.companyUser.findFirst({ where: { userId: user.id }});
    if (!cu) throw new Error("No company linked");

    const [year, month] = period.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    // Sum won deals by User
    const aggs = await prisma.deal.groupBy({
      by: ['assignedTo'],
      where: {
        companyId: cu.companyId,
        probability: 100, // WON
        updatedAt: { gte: start, lte: end }
      },
      _sum: { value: true }
    });

    // Populate user info
    const leaderboard = await Promise.all(
      aggs.filter(a => a.assignedTo).map(async (agg) => {
        const u = await prisma.user.findUnique({ where: { id: agg.assignedTo! }, select: { id: true, name: true, image: true, firstName: true, lastName: true } });
        return {
          user: u,
          totalSold: agg._sum.value || 0
        };
      })
    );

    // Sort descending by total sold
    leaderboard.sort((a, b) => b.totalSold - a.totalSold);

    // Give badges
    const ranked = leaderboard.map((item, index) => {
      let badge = null;
      if (index === 0) badge = "🥇 Top Closer";
      else if (item.totalSold > 100000) badge = "💎 Rainmaker";
      else if (index === 1) badge = "🥈 Runner Up";

      return { ...item, rank: index + 1, badge };
    });

    return { success: true, leaderboard: ranked };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

