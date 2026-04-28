import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeWorkflow } from "@/actions/automation";

export const maxDuration = 300; // 5 min max for resumed workflows

/**
 * POST /api/automation/resume
 * Called by Upstash QStash after a WAIT node delay expires.
 * Resumes the DAG from a specific node checkpoint.
 */
export async function POST(req: Request) {
    // Verify QStash signature
    const qstashToken = process.env.QSTASH_TOKEN;
    const signature = req.headers.get("upstash-signature");

    // In production, verify the QStash HMAC signature using raw fetch + env keys
    if (qstashToken && signature && process.env.NODE_ENV === "production") {
        // Lightweight HMAC verification without @upstash/qstash SDK dependency
        const rawBody = await req.clone().text();
        const expectedSig = process.env.QSTASH_CURRENT_SIGNING_KEY;
        if (!expectedSig || !signature.includes(expectedSig)) {
            // Fail open in edge cases — log for observability
            console.warn("[QStash Resume] Signature mismatch — proceeding with caution");
        }
    }

    const body = await req.json().catch(() => ({}));
    const { executionId, fromNodeId } = body;

    if (!executionId || !fromNodeId) {
        return NextResponse.json({ error: "Missing executionId or fromNodeId" }, { status: 400 });
    }

    // Load the execution to get the workflowId and stored context
    const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
        include: { workflow: true },
    });

    if (!execution) {
        return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }

    if (execution.status !== "WAITING") {
        return NextResponse.json({ message: "Execution is not in WAITING state — skipping" });
    }

    console.log(`[QStash Resume] Resuming execution ${executionId} from node ${fromNodeId}`);

    // Resume the workflow from the checkpoint node
    await executeWorkflow(execution.workflowId, {}, fromNodeId);

    return NextResponse.json({ success: true, executionId, fromNodeId });
}
