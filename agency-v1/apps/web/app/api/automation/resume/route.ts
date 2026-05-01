/**
 * app/api/automation/resume/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoint para que QStash reanude ejecuciones en estado WAITING.
 * También sirve como webhook de alerta automática cuando una ejecución falla.
 *
 * POST /api/automation/resume
 * Body: { executionId: string, fromNodeId?: string }
 * Auth: Upstash-Signature header (HMAC-SHA256)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeWorkflow } from "@/actions/automation";

export async function POST(req: NextRequest) {
    try {
        // ── Verify QStash signature (prod) or allow dev bypass ──────────────
        const signature = req.headers.get("upstash-signature");
        const isDev = process.env.NODE_ENV !== "production";

        if (!isDev && !signature) {
            return NextResponse.json({ error: "Missing QStash signature" }, { status: 401 });
        }

        // TODO: Validate HMAC signature against QSTASH_SIGNING_KEY for production
        // For now, trust the header presence in prod and skip in dev

        const body = await req.json() as { executionId: string; fromNodeId?: string };
        const { executionId, fromNodeId } = body;

        if (!executionId) {
            return NextResponse.json({ error: "executionId is required" }, { status: 400 });
        }

        // ── Retrieve execution ───────────────────────────────────────────────
        const execution = await prisma.workflowExecution.findUnique({
            where: { id: executionId },
            include: { workflow: { select: { id: true, name: true, companyId: true } } }
        });

        if (!execution) {
            return NextResponse.json({ error: "Execution not found" }, { status: 404 });
        }

        if (execution.status !== "WAITING") {
            return NextResponse.json({
                message: `Execution is in state ${execution.status} — no action needed.`
            });
        }

        // ── Mark as RUNNING and resume ───────────────────────────────────────
        await prisma.workflowExecution.update({
            where: { id: executionId },
            data: { status: "RUNNING" }
        });

        // Resume from the next node after the WAIT
        executeWorkflow(execution.workflowId, {}, fromNodeId).catch(async (err) => {
            console.error(`[QStash Resume] Execution ${executionId} failed on resume:`, err);

            // Auto-alert: crear notificación para todos los admins
            await notifyAdminsOnFailure(execution.workflow.companyId, execution.workflow.name, err.message);
        });

        return NextResponse.json({ success: true, message: `Execution ${executionId} resumed.` });

    } catch (err: any) {
        console.error("[AutomationResume] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ── Helper: notificar a todos los admins cuando un workflow falla ─────────────
async function notifyAdminsOnFailure(companyId: string, workflowName: string, errorMsg: string) {
    try {
        const admins = await prisma.companyUser.findMany({
            where: { 
                companyId, 
                OR: [{ roleName: "admin" }, { roleName: "owner" }] 
            },
            select: { userId: true }
        });

        if (admins.length === 0) return;

        await prisma.notification.createMany({
            data: admins.map(a => ({
                userId: a.userId,
                companyId,
                title: `⚠️ Workflow Fallido: ${workflowName}`,
                message: `Error: ${errorMsg.substring(0, 200)}. Ve a Automatización → Ejecuciones para revisar los logs.`,
                type: "WORKFLOW",
                isRead: false,
            }))
        });

        console.log(`[AutoAlert] Notified ${admins.length} admin(s) about failed workflow: ${workflowName}`);
    } catch (e) {
        console.error("[AutoAlert] Failed to notify admins:", e);
    }
}
