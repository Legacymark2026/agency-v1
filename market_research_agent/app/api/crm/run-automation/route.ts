import { NextRequest, NextResponse } from "next/server";
import { runAutomationEngine } from "@/actions/crm-automation";
import { prisma } from "@/lib/prisma";
import { processEmailSequences } from "@/actions/crm-sequences";

/**
 * Cron endpoint — llamado desde la plataforma de deployment (Vercel Cron / Railway)
 * cada hora: GET /api/crm/run-automation?secret=CRON_SECRET
 */
export async function GET(request: NextRequest) {
    const secret = request.nextUrl.searchParams.get("secret");
    if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Obtener todas las empresas activas
        const companies = await prisma.company.findMany({ select: { id: true, name: true } });
        const allResults: Record<string, any> = {};

        for (const company of companies) {
            const [automationResult, sequenceResult] = await Promise.allSettled([
                runAutomationEngine(company.id),
                processEmailSequences(company.id),
            ]);

            allResults[company.id] = {
                companyName: company.name,
                automation: automationResult.status === "fulfilled" ? automationResult.value : { error: (automationResult as PromiseRejectedResult).reason?.message },
                sequences: sequenceResult.status === "fulfilled" ? sequenceResult.value : { error: (sequenceResult as PromiseRejectedResult).reason?.message },
            };
        }

        return NextResponse.json({
            success: true,
            processedAt: new Date().toISOString(),
            companies: companies.length,
            results: allResults,
        });
    } catch (error) {
        console.error("[CRM CRON] Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
