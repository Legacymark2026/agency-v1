"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REVALIDATE = "/dashboard/settings/agents/skillchains";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado.");
    return session;
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function getSkillChains(companyId: string) {
    return prisma.agentSkillChain.findMany({
        where: { companyId },
        include: { agent: { select: { id: true, name: true, agentType: true } } },
        orderBy: { createdAt: "desc" }
    });
}

export async function upsertSkillChain(data: {
    id?: string;
    companyId: string;
    agentId: string;
    name: string;
    description?: string;
    tools: string[]; // max 5
    isActive?: boolean;
}) {
    await getSession();

    const toolsLimited = data.tools.slice(0, 5); // Enforce 5x max

    const payload = {
        companyId: data.companyId,
        agentId: data.agentId,
        name: data.name,
        description: data.description || null,
        tools: toolsLimited,
        isActive: data.isActive ?? true,
    };

    const chain = data.id
        ? await prisma.agentSkillChain.update({ where: { id: data.id }, data: payload })
        : await prisma.agentSkillChain.create({ data: payload });

    revalidatePath(REVALIDATE);
    return { success: true, chain };
}

export async function deleteSkillChain(id: string) {
    await getSession();
    await prisma.agentSkillChain.delete({ where: { id } });
    revalidatePath(REVALIDATE);
    return { success: true };
}

export async function toggleSkillChain(id: string, isActive: boolean) {
    await getSession();
    await prisma.agentSkillChain.update({ where: { id }, data: { isActive } });
    revalidatePath(REVALIDATE);
    return { success: true };
}
