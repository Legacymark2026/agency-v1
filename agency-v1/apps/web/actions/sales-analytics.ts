"use server";

import { auth } from "@/lib/auth";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function getSalesForecast(period: string) {
  try {
    const user = await requireAuth();
    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) throw new Error("No company linked");
    const companyId = cuData.data.companyId;

    const res = await fetch(`${GATEWAY_URL}/api/crm/sales/forecast?companyId=${companyId}`);
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to fetch sales forecast");

    const openDeals = resData.data || [];
    let weightedPipeline = 0;
    let totalPipeline = 0;

    openDeals.forEach((deal: any) => {
      totalPipeline += deal.value;
      weightedPipeline += (deal.value * ((deal.probability || 0) / 100));
    });

    return { success: true, totalPipeline, weightedPipeline, deals: openDeals };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getLeaderboard(period: string) {
  try {
    const user = await requireAuth();
    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) throw new Error("No company linked");
    const companyId = cuData.data.companyId;

    const res = await fetch(`${GATEWAY_URL}/api/crm/sales/leaderboard?companyId=${companyId}&period=${period}`);
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || "Failed to fetch leaderboard");

    const leaderboard = resData.data || [];

    // Sort descending by total sold
    leaderboard.sort((a: any, b: any) => b.totalSold - a.totalSold);

    // Give badges
    const ranked = leaderboard.map((item: any, index: number) => {
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
