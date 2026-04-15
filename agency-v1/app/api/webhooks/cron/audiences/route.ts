import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLTVTiers } from "@/actions/audiences";
import { syncAudiencesToPlatforms } from "@/lib/services/audiences/sync";

// Vercel Cron Jobs Endpoint
export async function GET(req: Request) {
  // 1. Verify Vercel Cron Authentication (optional but recommended in prod)
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Fetch all active companies
    const companies = await prisma.company.findMany({
      select: { id: true, name: true }
    });

    console.log(`[Cron] Starting Audience Sync for ${companies.length} companies...`);

    // 3. Process each company's LTV and API Syncs
    // We run them sequentially to avoid hammering DB or External APIs excessively,
    // though Promise.all could be used for speed if the timeout is strict.
    for (const company of companies) {
      console.log(`[Cron] Processing Company: ${company.name}`);
      
      const ltvTiers = await calculateLTVTiers(company.id);
      
      // Async sync to Meta, Google, LinkedIn
      await syncAudiencesToPlatforms(company.id, ltvTiers);
    }

    console.log(`[Cron] Audience Sync Completed Successfully.`);
    return NextResponse.json({ success: true, message: "Audienge Sync Cycle Completed" });

  } catch (error) {
    console.error("[Cron Error] Audience Sync Failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
