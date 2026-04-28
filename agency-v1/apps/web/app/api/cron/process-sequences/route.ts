import { NextResponse } from "next/server";

export const maxDuration = 300;

/**
 * GET /api/cron/process-sequences
 * Runs hourly via Vercel Cron. Processes all active email sequence enrollments
 * whose next step is due. Iterates across ALL companies (multi-tenant).
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

    // Get all distinct companyIds with active enrollments
    const activeCompanies = await prisma.emailSequenceEnrollment.findMany({
        where: { status: "ACTIVE", nextRunAt: { lte: new Date() } },
        select: { sequence: { select: { companyId: true } } },
        distinct: ["sequenceId"],
    });

    const companyIds = [...new Set(activeCompanies.map((e) => e.sequence.companyId))];

    if (companyIds.length === 0) {
        return NextResponse.json({ success: true, message: "No sequences due." });
    }

    const { processEmailSequences } = await import("@/actions/crm-sequences");

    let totalProcessed = 0;
    const errors: string[] = [];

    for (const companyId of companyIds) {
        try {
            const result = await processEmailSequences(companyId);
            totalProcessed += result?.processed ?? 0;
        } catch (err: any) {
            errors.push(`${companyId}: ${err.message}`);
            console.error(`[Sequences Cron] Error for company ${companyId}:`, err.message);
        }
    }

    return NextResponse.json({
        success: true,
        companies: companyIds.length,
        processed: totalProcessed,
        errors: errors.length > 0 ? errors : undefined,
    });
}
