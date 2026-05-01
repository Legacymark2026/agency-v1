/**
 * app/api/workflows/resume/[executionId]/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Reanuda una ejecución de workflow que está en estado WAITING.
 *
 * POST /api/workflows/resume/:executionId
 * Body: { resumeData?: Record<string, unknown> }
 *
 * Casos de uso:
 *  - Un step WAIT con delayMinutes finaliza → cron job llama este endpoint.
 *  - Un humano aprueba una acción → UI llama este endpoint con los datos de aprobación.
 *  - Un webhook externo entrega datos esperados → el gateway llama este endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resumeWorkflow } from "@/lib/workflow-executor";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ executionId: string }> }
) {
    try {
        const { executionId } = await params;

        // ── Auth ──────────────────────────────────────────────────────────────
        const session = await auth();
        if (!session?.user?.id) {
            // Also allow internal calls via shared secret (for cron/automated resume)
            const internalSecret = req.headers.get("x-internal-secret");
            if (internalSecret !== process.env.INTERNAL_API_SECRET) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        // ── Validate execution exists and is WAITING ──────────────────────────
        const execution = await prisma.workflowExecution.findUnique({
            where: { id: executionId },
            select: { id: true, status: true, resumeAt: true, workflow: { select: { companyId: true, name: true } } },
        });

        if (!execution) {
            return NextResponse.json({ error: "Execution not found" }, { status: 404 });
        }
        if (execution.status !== "WAITING") {
            return NextResponse.json(
                { error: `Execution is in status '${execution.status}', cannot resume.` },
                { status: 400 }
            );
        }

        // If resumeAt is in the future, only allow forced resume from internal secret
        if (execution.resumeAt && execution.resumeAt > new Date()) {
            const internalSecret = req.headers.get("x-internal-secret");
            if (internalSecret !== process.env.INTERNAL_API_SECRET) {
                return NextResponse.json(
                    { error: `Execution is scheduled to resume at ${execution.resumeAt.toISOString()}` },
                    { status: 400 }
                );
            }
        }

        const body = await req.json().catch(() => ({})) as { resumeData?: Record<string, unknown> };

        // ── Resume ────────────────────────────────────────────────────────────
        const result = await resumeWorkflow(executionId, {
            ...body.resumeData,
            _resumedAt: new Date().toISOString(),
            _resumedBy: session?.user?.id ?? "system",
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            executionId,
            workflow: execution.workflow.name,
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[Workflows API] Resume error:", err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
