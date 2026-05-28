'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function getAssignmentRules(companyId: string) {
    try {
        const rules = await (prisma as any).leadAssignmentRule.findMany({
            where: { companyId },
            orderBy: { priority: 'asc' }
        });
        return rules;
    } catch (error) {
        console.error("Error getting rules:", error);
        return [];
    }
}

export async function getTeamsAndAgents(companyId: string) {
    try {
        const teams = await prisma.team.findMany({
            where: { companyId },
            select: { id: true, name: true }
        });

        const companyUsers = await prisma.companyUser.findMany({
            where: { companyId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, deactivatedAt: true }
                }
            }
        });

        const agents = companyUsers
            .map(cu => cu.user)
            .filter(u => u && !u.deactivatedAt)
            .map(u => ({ id: u.id, name: u.name || u.email || "Agente sin nombre" }));

        return { teams, agents };
    } catch (error) {
        console.error("Error getting teams/agents:", error);
        return { teams: [], agents: [] };
    }
}

export async function createAssignmentRule(companyId: string, data: {
  name: string;
  conditions: any;
  assignedUserId?: string | null;
  teamId?: string | null;
  roundRobinEnabled?: boolean;
}) {
  try {
    const rulesCount = await (prisma as any).leadAssignmentRule.count({
      where: { companyId }
    });

    const rule = await (prisma as any).leadAssignmentRule.create({
      data: {
        companyId,
        name: data.name,
        priority: rulesCount,
        isActive: true,
        conditions: data.conditions,
        assignedUserId: data.assignedUserId || null,
        teamId: data.teamId || null,
        roundRobinEnabled: data.roundRobinEnabled || false,
      }
    });

    revalidatePath("/dashboard/admin/crm/assignment");
    return { success: true, rule };
  } catch (error: any) {
    console.error("Error creating rule:", error);
    return { success: false, error: error.message };
  }
}

export async function updateAssignmentRule(ruleId: string, data: {
  name: string;
  conditions: any;
  assignedUserId?: string | null;
  teamId?: string | null;
  roundRobinEnabled?: boolean;
  isActive?: boolean;
}) {
  try {
    const rule = await (prisma as any).leadAssignmentRule.update({
      where: { id: ruleId },
      data: {
        name: data.name,
        conditions: data.conditions,
        assignedUserId: data.assignedUserId || null,
        teamId: data.teamId || null,
        roundRobinEnabled: data.roundRobinEnabled || false,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });

    revalidatePath("/dashboard/admin/crm/assignment");
    return { success: true, rule };
  } catch (error: any) {
    console.error("Error updating rule:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAssignmentRule(ruleId: string) {
  try {
    await (prisma as any).leadAssignmentRule.delete({
      where: { id: ruleId }
    });
    revalidatePath("/dashboard/admin/crm/assignment");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting rule:", error);
    return { success: false, error: error.message };
  }
}

export async function reorderAssignmentRules(companyId: string, ruleIds: string[]) {
  try {
    const updates = ruleIds.map((id, index) => 
      (prisma as any).leadAssignmentRule.update({
        where: { id, companyId },
        data: { priority: index }
      })
    );
    await prisma.$transaction(updates);
    revalidatePath("/dashboard/admin/crm/assignment");
    return { success: true };
  } catch (error: any) {
     console.error("Error reordering rules:", error);
     return { success: false, error: error.message };
  }
}
