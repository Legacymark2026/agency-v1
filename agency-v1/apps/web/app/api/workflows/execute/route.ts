/**
 * app/api/workflows/execute/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * HTTP endpoint para disparar un flujo de trabajo desde cualquier trigger.
 *
 * POST /api/workflows/execute
 * Body: { workflowId: string, triggerData?: Record<string, unknown> }
 * Auth: API Key (x-api-key header) o sesión activa
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runWorkflow } from "@/lib/workflow-executor";

export async function POST(req: NextRequest) {
    try {
        // ── Auth: acepta sesión web o API Key ─────────────────────────────────
        const apiKey = req.headers.get("x-api-key");
        let companyId: string | null = null;

        if (apiKey) {
            const { createHmac } = await import("crypto");
            const keyHash = createHmac("sha256", process.env.API_KEY_SECRET ?? "").update(apiKey).digest("hex");
            const keyRecord = await prisma.apiKey.findFirst({
                where: { keyHash, isActive: true },
                select: { companyId: true, expiresAt: true },
            });

            if (!keyRecord) {
                return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
            }
            if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
                return NextResponse.json({ error: "API Key expired" }, { status: 401 });
            }
            companyId = keyRecord.companyId;
        } else {
            const session = await auth();
            if (!session?.user?.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const cu = await prisma.companyUser.findFirst({
                where: { userId: session.user.id },
                select: { companyId: true },
            });
            companyId = cu?.companyId ?? null;
        }

        if (!companyId) {
            return NextResponse.json({ error: "No company context" }, { status: 403 });
        }

        // ── Validate payload ──────────────────────────────────────────────────
        const body = await req.json() as { workflowId?: string; triggerData?: Record<string, unknown> };
        const { workflowId, triggerData = {} } = body;

        if (!workflowId) {
            return NextResponse.json({ error: "workflowId is required" }, { status: 400 });
        }
        
        // ── Idempotency Check ────────────────────────────────────────────────
        const idempotencyKey = req.headers.get("x-idempotency-key");
        if (idempotencyKey) {
            // Buscamos si ya existe una ejecución para este flujo y empresa con la misma llave
            const existing = await prisma.$queryRaw<{id: string}[]>`
                SELECT id FROM workflow_executions 
                WHERE workflow_id = ${workflowId} 
                AND context_snapshot->'triggerData'->>'_idempotencyKey' = ${idempotencyKey}
                LIMIT 1
            `;
            if (existing && existing.length > 0) {
                console.log(`[Workflows API] Idempotency hit for key ${idempotencyKey}. Ignoring duplicate.`);
                return NextResponse.json({
                    success: true,
                    message: "Execution ignored due to idempotency key",
                    executionId: existing[0].id
                });
            }
        }

        // ── Verify workflow belongs to company ───────────────────────────────
        const workflow = await prisma.workflow.findFirst({
            where: { id: workflowId, companyId },
            select: { id: true, name: true, isActive: true },
        });

        if (!workflow) {
            return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
        }
        if (!workflow.isActive) {
            return NextResponse.json({ error: `Workflow "${workflow.name}" is inactive` }, { status: 400 });
        }

        // ── Execute Asynchronously (Non-blocking) ─────────────────────────────
        const enrichedTriggerData = {
            ...triggerData,
            _companyId: companyId,
            _triggeredAt: new Date().toISOString(),
            _triggeredVia: "api",
            ...(idempotencyKey ? { _idempotencyKey: idempotencyKey } : {})
        };
        
        // Fire and forget (Asynchronous execution to unblock the Event Loop)
        // En entornos serverless estables, se sugiere usar inQueues o Vercel waitUntil.
        runWorkflow(workflowId, enrichedTriggerData).catch(e => {
            console.error("[Workflows API] Background execution failed:", e);
        });

        return NextResponse.json({
            success: true,
            message: "Workflow execution queued asynchronously",
            workflow: { id: workflow.id, name: workflow.name },
        }, { status: 202 });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[Workflows API] Execute error:", err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
