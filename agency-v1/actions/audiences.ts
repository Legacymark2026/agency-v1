"use server";

import { prisma } from "@/lib/prisma";

export interface LTVTier {
  tier: "HIGH" | "MEDIUM" | "LOW";
  leads: any[]; // The structured Lead objects ready for sync
}

export async function calculateLTVTiers(companyId: string): Promise<LTVTier[]> {
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

  // 2. Aggregate Value by Email
  const ltvMap = new Map<string, number>();
  for (const deal of wonDeals) {
    const email = deal.contactEmail!.toLowerCase().trim();
    if (!email) continue;
    const current = ltvMap.get(email) || 0;
    ltvMap.set(email, current + deal.value);
  }

  // If no won deals, return early
  if (ltvMap.size === 0) {
    return [
      { tier: "HIGH", leads: [] },
      { tier: "MEDIUM", leads: [] },
      { tier: "LOW", leads: [] }
    ];
  }

  // 3. Sort emails by LTV descending
  const sortedLTV = Array.from(ltvMap.entries()).sort((a, b) => b[1] - a[1]);

  // 4. Calculate Thresholds (20% High, 50% Medium, 30% Low)
  const totalProfiles = sortedLTV.length;
  const highCutoff = Math.ceil(totalProfiles * 0.20);
  const midCutoff = Math.ceil(totalProfiles * 0.70); // 20% + 50%

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

  // 5. Fetch all Leads corresponding to these emails
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

  // Group leads and optionally update tags in DB
  const updatePromises = allRelatedLeads.map(lead => {
    const email = lead.email.toLowerCase().trim();
    let tier: "HIGH" | "MEDIUM" | "LOW" = "LOW";
    
    if (highEmails.has(email)) tier = "HIGH";
    else if (midEmails.has(email)) tier = "MEDIUM";

    // Prepare for return
    const leadData = { ...lead, ltvTier: tier };
    if (tier === "HIGH") highLeads.push(leadData);
    if (tier === "MEDIUM") midLeads.push(leadData);
    if (tier === "LOW") lowLeads.push(leadData);

    // Filter out old LTV tags and add new one
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

  return [
    { tier: "HIGH", leads: highLeads },
    { tier: "MEDIUM", leads: midLeads },
    { tier: "LOW", leads: lowLeads }
  ];
}

import { syncAudiencesToPlatforms } from "@/lib/services/audiences/sync";
import { auth } from "@/lib/auth";

export async function triggerManualAudienceSync() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companies: { select: { companyId: true } } }
    });

    const companyId = user?.companies[0]?.companyId;
    if (!companyId) return { success: false, error: "No company found" };

    const tiers = await calculateLTVTiers(companyId);
    await syncAudiencesToPlatforms(companyId, tiers);

    return { success: true, message: "Audiences synchronized successfully across active platforms." };
  } catch (error: any) {
    console.error("Manual Audience Sync Failed:", error);
    return { success: false, error: error.message || "Failed to sync audiences" };
  }
}
