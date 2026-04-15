'use server';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getWorkflows(companyId: string) {
    return await db.workflow.findMany({
        where: { companyId },
        orderBy: { updatedAt: 'desc' },
        include: {
            _count: {
                select: { executions: true }
            }
        }
    });
}

export async function createWorkflow(data: {
    name: string;
    description?: string;
    triggerType: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    triggerConfig: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    steps: any[];
    companyId: string;
}) {
    try {
        const workflow = await db.workflow.create({
            data: {
                name: data.name,
                description: data.description,
                triggerType: data.triggerType,
                triggerConfig: data.triggerConfig,
                steps: data.steps,
                companyId: data.companyId,
                isActive: false // Draft by default
            }
        });
        revalidatePath("/dashboard/marketing/automation");
        return { success: true, data: workflow };
    } catch (error) {
        console.error("Error creating workflow:", error);
        return { success: false, error: "Failed to create workflow" };
    }
}

export async function toggleWorkflowStatus(workflowId: string, isActive: boolean) {
    try {
        await db.workflow.update({
            where: { id: workflowId },
            data: { isActive }
        });
        revalidatePath("/dashboard/marketing/automation");
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function deleteWorkflow(workflowId: string) {
    try {
        await db.workflow.delete({ where: { id: workflowId } });
        revalidatePath("/dashboard/marketing/automation");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete workflow:", error);
        return { success: false, error: "Failed to delete workflow" };
    }
}
