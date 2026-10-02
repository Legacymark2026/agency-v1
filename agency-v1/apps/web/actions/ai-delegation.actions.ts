"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/tenant";

export async function createAgentDelegationAction(data: {
    agentId: string;
    role: string;
    allowedActions: string[];
    maxBudgetUsd: number;
    requireApproval: boolean;
}) {
    const { companyId } = await requireTenant(false);
    
    // UPSERT: Create or update the delegation profile for the given agent in this company
    await prisma.agentDelegation.upsert({
        where: {
            agentId_companyId: {
                agentId: data.agentId,
                companyId: companyId
            }
        },
        update: {
            role: data.role,
            allowedActions: data.allowedActions,
            maxBudgetUsd: data.maxBudgetUsd,
            requireApproval: data.requireApproval,
        },
        create: {
            companyId,
            agentId: data.agentId,
            role: data.role,
            allowedActions: data.allowedActions,
            maxBudgetUsd: data.maxBudgetUsd,
            requireApproval: data.requireApproval,
        }
    });

    revalidatePath("/dashboard/settings/agents/delegation");
}
