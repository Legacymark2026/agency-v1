import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runWorkflow } from "@/lib/workflow-executor";

export async function GET() {
    try {
        const triageWorkflow = await prisma.workflow.findFirst({
            where: { name: "🚨 Triage Omnicanal Inmediato" },
            include: { company: true }
        });

        if (!triageWorkflow) {
            return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
        }

        const simulatedTriggerData = {
            source: "WHATSAPP",
            content: "¡Hola! Estoy súper interesado, lo necesito de URGENCIA para hoy mismo. Mi presupuesto es alto y quiero empezar.",
            email: "test_urgente@placeholder.com"
        };

        const simulatedContactData = {
            name: "Test User Urgente",
            first_name: "Test",
            email: "test_urgente@placeholder.com",
            phone: "+1234567890"
        };

        const result = await runWorkflow(
            triageWorkflow.id,
            {
                ...simulatedTriggerData,
                contact: simulatedContactData
            }
        );

        if (!result.success || !result.executionId) {
            return NextResponse.json({ error: "Failed to start execution", details: result.error }, { status: 500 });
        }

        // Wait a bit to let it process
        await new Promise(resolve => setTimeout(resolve, 5000));

        const execution = await prisma.workflowExecution.findUnique({
            where: { id: result.executionId }
        });

        return NextResponse.json({
            workflowId: triageWorkflow.id,
            executionId: result.executionId,
            status: execution?.status,
            logs: execution?.logs
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
