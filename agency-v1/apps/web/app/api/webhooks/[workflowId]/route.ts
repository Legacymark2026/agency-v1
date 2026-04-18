import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ workflowId: string }> }
) {
    try {
        const { workflowId } = await params;
        const body = await req.json();



        // Validate workflow exists and is active
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId },
        });

        if (!workflow) {
            return NextResponse.json(
                { error: "Workflow not found" },
                { status: 404 }
            );
        }

        if (!workflow.isActive) {
            return NextResponse.json(
                { error: "Workflow is inactive" },
                { status: 400 }
            );
        }

        // Trigger the workflow directly using the specific ID
        // We reuse the existing logic but bypass the "find many by trigger type" part
        // actually, our triggerWorkflow finds many. Let's create a direct execute if possible,
        // or we can misuse 'triggerWorkflow' if we modify it to accept ID.
        // For now, let's just use executeWorkflow directly from actions if exported, 
        // but better yet, let's call the 'executeWorkflow' function directly if we can import it.

        // Importing Server Action from route handler might be tricky with Next.js specific build context sometimes,
        // but usually works. Let's try importing executeWorkflow directly.

        const { executeWorkflow } = await import("@/actions/automation");

        // We treat the body as the trigger data
        await executeWorkflow(workflowId, body);

        return NextResponse.json({ success: true, message: "Workflow triggered" });
    } catch (error: unknown) {
        console.error("Webhook Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: (error as Error).message },
            { status: 500 }
        );
    }
}
