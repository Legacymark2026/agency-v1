/**
 * app/api/workflows/executions/[id]/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  /api/workflows/executions/:id  → Estado e historial de una ejecución
 * DELETE /api/workflows/executions/:id → Cancelar ejecución WAITING o RUNNING
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const execution = await prisma.workflowExecution.findUnique({
            where: { id },
            include: {
                workflow: {
                    select: { id: true, name: true, companyId: true, triggerType: true },
                },
            },
        });

        if (!execution) {
            return NextResponse.json({ error: "Execution not found" }, { status: 404 });
        }

        // Verify company access
        const cu = await prisma.companyUser.findFirst({
            where: { userId: session.user.id, companyId: execution.workflow.companyId },
        });
        if (!cu) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            execution: {
                id: execution.id,
                status: execution.status,
                currentStep: execution.currentStep,
                startedAt: execution.startedAt,
                completedAt: execution.completedAt,
                resumeAt: execution.resumeAt,
                logs: execution.logs,
                workflow: execution.workflow,
            },
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const execution = await prisma.workflowExecution.findUnique({
            where: { id },
            include: { workflow: { select: { companyId: true } } },
        });

        if (!execution) {
            return NextResponse.json({ error: "Execution not found" }, { status: 404 });
        }

        // Verify company access
        const cu = await prisma.companyUser.findFirst({
            where: { userId: session.user.id, companyId: execution.workflow.companyId },
        });
        if (!cu) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!["WAITING", "RUNNING"].includes(execution.status)) {
            return NextResponse.json(
                { error: `Cannot cancel execution in status '${execution.status}'` },
                { status: 400 }
            );
        }

        await prisma.workflowExecution.update({
            where: { id },
            data: { status: "FAILED", completedAt: new Date() },
        });

        return NextResponse.json({ success: true, message: "Execution cancelled" });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
