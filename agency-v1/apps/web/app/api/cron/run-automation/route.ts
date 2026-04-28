import { NextResponse } from "next/server";

export const maxDuration = 300;

/**
 * GET /api/cron/run-automation
 * Runs hourly via Vercel Cron. Executes all CRM automation rules
 * (STAGE_STUCK_X_DAYS, DEAL_CREATED, etc.) across ALL active companies.
 */
export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (
        process.env.CRON_SECRET &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
        process.env.NODE_ENV !== "development"
    ) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { prisma } = await import("@/lib/prisma");

    // Find all companies that have active automation rules
    const companies = await prisma.dealAutomationRule.findMany({
        where: { isActive: true },
        select: { companyId: true },
        distinct: ["companyId"],
    });

    if (companies.length === 0) {
        return NextResponse.json({ success: true, message: "No active automation rules." });
    }

    const { runAutomationEngine } = await import("@/actions/crm-automation");

    const results: { companyId: string; success: boolean; error?: string }[] = [];

    for (const { companyId } of companies) {
        try {
            await runAutomationEngine(companyId);
            results.push({ companyId, success: true });
        } catch (err: any) {
            results.push({ companyId, success: false, error: err.message });
            console.error(`[Automation Cron] Error for company ${companyId}:`, err.message);
        }
    }

    const failed = results.filter((r) => !r.success);
    return NextResponse.json({
        success: true,
        companies: results.length,
        failed: failed.length > 0 ? failed : undefined,
    });
}
