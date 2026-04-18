"use server";

import { prisma } from "@/lib/prisma";

export interface RFMTier {
  segment: string;
  leads: any[];
}

export async function calculateRFMTiers(companyId: string): Promise<RFMTier[]> {
  const wonDeals = await prisma.deal.findMany({
    where: { companyId, stage: "WON", contactEmail: { not: null } },
    select: { contactEmail: true, value: true, updatedAt: true }
  });

  const rfmMap = new Map<string, { r: number, f: number, m: number, lastDate: Date }>();
  const now = new Date();

  // 1. Group Raw RFM metrics
  for (const deal of wonDeals) {
    const email = deal.contactEmail!.toLowerCase().trim();
    const current = rfmMap.get(email) || { r: 0, f: 0, m: 0, lastDate: new Date(0) };
    
    current.f += 1;
    current.m += deal.value;
    if (deal.updatedAt > current.lastDate) {
      current.lastDate = deal.updatedAt;
    }
    
    // Recency in days
    current.r = Math.floor((now.getTime() - current.lastDate.getTime()) / (1000 * 3600 * 24));
    rfmMap.set(email, current);
  }

  if (rfmMap.size === 0) return [];

  // 2. Arrays for Percentile Calculation
  // We need distinct arrays to sort and find quintiles
  const rValues = Array.from(rfmMap.values()).map(x => x.r).sort((a, b) => a - b); // Ascending: lower R is better (fewer days)
  const fValues = Array.from(rfmMap.values()).map(x => x.f).sort((a, b) => a - b); // Ascending: higher F is better
  const mValues = Array.from(rfmMap.values()).map(x => x.m).sort((a, b) => a - b); // Ascending: higher M is better

  const getQuintile = (val: number, sortedArray: number[], reverse: boolean = false) => {
    // Exact quintile logic (20% steps)
    const percentile = sortedArray.findIndex(x => x === val) / sortedArray.length;
    let score = Math.floor(percentile * 5) + 1; 
    if (score > 5) score = 5;
    // For R, lower days is BETTER -> so it should be reversed. 
    // Wait, the sorting was ascending. Lowest R (days) = index 0 (0-20%). If reverse is false, index 0 -> Score 1.
    // We want Lowest R (recent) to be Score 5.
    return reverse ? (6 - score) : score;
  };

  // 3. Assign 1-5 Scores
  const rfmScores = new Map<string, { rScore: number, fScore: number, mScore: number, code: string }>();
  for (const [email, data] of rfmMap.entries()) {
    const rScore = getQuintile(data.r, rValues, true); // Inverse: less days = higher score
    const fScore = getQuintile(data.f, fValues);
    const mScore = getQuintile(data.m, mValues);
    const code = `${rScore}${fScore}${mScore}`;
    rfmScores.set(email, { rScore, fScore, mScore, code });
  }

  // 4. Segmentation Logic
  const getSegment = (r: number, f: number, m: number, code: string) => {
    if (["555", "554", "544", "545", "454", "455", "445"].includes(code)) return "Champions";
    if (f >= 4) return "Loyal Customers"; // Includes X5X, X4X (but not caught by Champions)
    if (r >= 4 && f >= 4) return "Potential Loyalist"; // 45X, 55X...
    if (r >= 4 && f <= 2) return "New Customers"; // 51X, 41X...
    if (r <= 2 && f >= 4) return "At Risk"; // 25X, 15X...
    if (r <= 2 && f <= 2) return "Hibernating"; // 11X, 21X...
    return "Standard Users"; // Catch-all
  };

  const segmentsMap = new Map<string, string[]>(); // Segment -> Array of Emails
  for (const [email, scores] of rfmScores.entries()) {
    const segment = getSegment(scores.rScore, scores.fScore, scores.mScore, scores.code);
    const existing = segmentsMap.get(segment) || [];
    existing.push(email);
    segmentsMap.set(segment, existing);
  }

  // 5. Fetch Leads and build response
  const allLeads = await prisma.lead.findMany({
    where: { companyId, email: { in: Array.from(rfmMap.keys()) } }
  });

  const results: RFMTier[] = [];
  const updatePromises: Promise<any>[] = [];

  for (const [segment, emails] of segmentsMap.entries()) {
    const segmentLeads = allLeads.filter(l => emails.includes(l.email.toLowerCase().trim()));
    results.push({ segment, leads: segmentLeads });

    for (const lead of segmentLeads) {
      const newTag = `[Audience: RFM ${segment}]`;
      const cleanedTags = lead.tags.filter((t: string) => !t.startsWith("[Audience: RFM"));
      if (!cleanedTags.includes(newTag)) {
        cleanedTags.push(newTag);
        updatePromises.push(prisma.lead.update({ where: { id: lead.id }, data: { tags: cleanedTags } }));
      }
    }
  }

  await Promise.all(updatePromises);
  return results;
}
