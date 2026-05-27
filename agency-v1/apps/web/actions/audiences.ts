"use server";

import { auth } from "@/lib/auth";
import { syncAudiencesToPlatforms } from "@/lib/services/audiences/sync";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

export interface LTVTier {
  tier: "HIGH" | "MEDIUM" | "LOW";
  leads: any[]; // The structured Lead objects ready for sync
}

export async function calculateLTVTiers(companyId: string): Promise<LTVTier[]> {
  const res = await fetch(`${GATEWAY_URL}/api/crm/audiences/calculate-ltv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId })
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || "Failed to calculate LTV tiers");
  return resData.data;
}

export async function triggerManualAudienceSync() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${session.user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) return { success: false, error: "No company found" };
    const companyId = cuData.data.companyId;

    const tiers = await calculateLTVTiers(companyId);
    await syncAudiencesToPlatforms(companyId, tiers);

    return { success: true, message: "Audiences synchronized successfully across active platforms." };
  } catch (error: any) {
    console.error("Manual Audience Sync Failed:", error);
    return { success: false, error: error.message || "Failed to sync audiences" };
  }
}
