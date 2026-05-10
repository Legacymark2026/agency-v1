"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REVALIDATE = "/dashboard/settings/agents/teams";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado.");
    return session;
}

// ── Team CRUD ────────────────────────────────────────────────────────────────

export async function getAgentTeams(companyId: string) {
    return prisma.agentTeam.findMany({
        where: { companyId },
        include: {
            members: {
                include: { agent: { select: { id: true, name: true, agentType: true, llmModel: true, isActive: true } } },
                orderBy: { priority: "asc" }
            },
            _count: { select: { runs: true } }
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function upsertAgentTeam(data: {
    id?: string;
    companyId: string;
    name: string;
    description?: string;
    objective: string;
    strategy: "PARALLEL" | "SEQUENTIAL" | "VOTE";
    isActive?: boolean;
    members: { agentId: string; role: string; priority: number }[];
}) {
    await getSession();

    const payload = {
        companyId: data.companyId,
        name: data.name,
        description: data.description || null,
        objective: data.objective,
        strategy: data.strategy,
        isActive: data.isActive ?? true,
    };

    if (data.id) {
        // Update team + replace all members
        await prisma.agentTeamMember.deleteMany({ where: { teamId: data.id } });
        const team = await prisma.agentTeam.update({
            where: { id: data.id },
            data: {
                ...payload,
                members: {
                    create: data.members.map(m => ({
                        agentId: m.agentId,
                        role: m.role,
                        priority: m.priority,
                    }))
                }
            }
        });
        revalidatePath(REVALIDATE);
        return { success: true, team };
    } else {
        const team = await prisma.agentTeam.create({
            data: {
                ...payload,
                members: {
                    create: data.members.map(m => ({
                        agentId: m.agentId,
                        role: m.role,
                        priority: m.priority,
                    }))
                }
            }
        });
        revalidatePath(REVALIDATE);
        return { success: true, team };
    }
}

export async function deleteAgentTeam(id: string) {
    await getSession();
    await prisma.agentTeam.delete({ where: { id } });
    revalidatePath(REVALIDATE);
    return { success: true };
}

export async function toggleAgentTeam(id: string, isActive: boolean) {
    await getSession();
    await prisma.agentTeam.update({ where: { id }, data: { isActive } });
    revalidatePath(REVALIDATE);
    return { success: true };
}

// ── Team Execution ────────────────────────────────────────────────────────────

export async function runAgentTeamAction(teamId: string, input: string) {
    const session = await getSession();
    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });
    if (!companyUser) throw new Error("Empresa no encontrada.");

    const { executeAgentTeam } = await import("@/lib/services/agent-team-engine");
    const result = await executeAgentTeam({
        teamId,
        companyId: companyUser.companyId,
        input,
        trigger: "MANUAL",
        userContext: { id: session.user.id, role: session.user.role }
    });
    return { success: true, result };
}

export async function getTeamRunHistory(teamId: string) {
    return prisma.agentTeamRun.findMany({
        where: { teamId },
        orderBy: { createdAt: "desc" },
        take: 20
    });
}
