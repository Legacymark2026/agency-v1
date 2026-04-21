"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * actions/ai-agents.ts — ULTRA-PRO Edition
 * Server Actions para gestionar Agentes de IA y Bases de Conocimiento.
 */

const REVALIDATE = "/dashboard/settings/agents";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado.");
    return session;
}

// ══════════════════════════════════════════════════════════════
// AI AGENT CRUD
// ══════════════════════════════════════════════════════════════

export async function getAIAgents(companyId: string) {
    if (!companyId) throw new Error("companyId requerido");
    return prisma.aIAgent.findMany({
        where: { companyId },
        include: { knowledgeBases: { select: { id: true, name: true } }, conversations: { select: { id: true, status: true } } },
        orderBy: { createdAt: "desc" }
    });
}


export async function getAIAgentById(id: string) {
    return prisma.aIAgent.findUnique({
        where: { id },
        include: { knowledgeBases: true, conversations: { orderBy: { createdAt: "desc" }, take: 10 } }
    });
}

export async function upsertAIAgent(data: {
    id?: string;
    companyId: string;
    name: string;
    description?: string;
    agentType?: string;
    systemPrompt: string;
    llmModel: string;
    temperature: number;
    maxTokens: number;
    enabledTools: string[];
    isActive: boolean;
    knowledgeBaseIds?: string[];
    strictRagMode?: boolean;
    humanTransferWebhook?: string;
    suspensionDurationMinutes?: number;
    priorityAlpha?: boolean;
    frustrationThreshold?: number;
    enforceTempClamp?: boolean;
    enforceTokenLimit?: boolean;
    simulateLatency?: boolean;
    filterRoboticLists?: boolean;
    voiceId?: string;
    stability?: number;
    similarityBoost?: number;
    accentRegion?: string;
    gender?: string;
    isInboxAgent?: boolean;
}) {
    await getSession();

    // --- SaaS B2B AI Quota Enforcer (Limit on Creation) ---
    if (!data.id) {
        const company = await prisma.company.findUnique({ where: { id: data.companyId }, select: { subscriptionTier: true } });
        if (!company) throw new Error("Tenant no definido.");
        
        const { enforceQuota } = await import("@/lib/quotas");
        const quota = await enforceQuota(data.companyId, "ai_agents", company.subscriptionTier);
        if (!quota.allowed) {
            return { error: `SaaS Limit: Tu plan comercial ${company.subscriptionTier.toUpperCase()} te permite máximo ${quota.limit} Agente(s). Sube tu plan en Facturación.` };
        }
    }
    // --------------------------------------------------------

    const payload = {
        companyId: data.companyId,
        name: data.name,
        description: data.description || null,
        agentType: data.agentType || "CUSTOM",
        systemPrompt: data.systemPrompt,
        llmModel: data.llmModel || "gemini-2.0-flash",
        temperature: data.temperature ?? 0.4,
        maxTokens: data.maxTokens ?? 400,
        enabledTools: data.enabledTools || [],
        isActive: data.isActive ?? true,
        strictRagMode: data.strictRagMode ?? false,
        humanTransferWebhook: data.humanTransferWebhook || null,
        suspensionDurationMinutes: data.suspensionDurationMinutes ?? 30,
        priorityAlpha: data.priorityAlpha ?? true,
        frustrationThreshold: data.frustrationThreshold ?? 0.8,
        enforceTempClamp: data.enforceTempClamp ?? false,
        enforceTokenLimit: data.enforceTokenLimit ?? true,
        simulateLatency: data.simulateLatency ?? true,
        filterRoboticLists: data.filterRoboticLists ?? true,
        voiceId: data.voiceId || null,
        stability: data.stability ?? 0.5,
        similarityBoost: data.similarityBoost ?? 0.75,
        accentRegion: data.accentRegion || null,
        gender: data.gender || null,
        isInboxAgent: data.isInboxAgent ?? false,
    };

    const knowledgeConnect = data.knowledgeBaseIds?.map(id => ({ id })) || [];

    // If this agent is being set as the Inbox Agent, unset it for all others in the company
    if (payload.isInboxAgent) {
        await prisma.aIAgent.updateMany({
            where: { companyId: data.companyId, isInboxAgent: true, id: { not: data.id } },
            data: { isInboxAgent: false }
        });
    }

    let agent;
    if (data.id) {
        agent = await prisma.aIAgent.update({
            where: { id: data.id },
            data: { ...payload, knowledgeBases: { set: knowledgeConnect } }
        });
    } else {
        agent = await prisma.aIAgent.create({
            data: { ...payload, knowledgeBases: { connect: knowledgeConnect } }
        });
    }

    revalidatePath(REVALIDATE);
    return { success: true, agent };
}

export async function deleteAIAgent(id: string) {
    await getSession();
    await prisma.aIAgent.delete({ where: { id } });
    revalidatePath(REVALIDATE);
    return { success: true };
}

// ══════════════════════════════════════════════════════════════
// KNOWLEDGE BASE CRUD
// ══════════════════════════════════════════════════════════════

export async function getKnowledgeBases(companyId: string) {
    return prisma.knowledgeBase.findMany({
        where: { companyId },
        include: { _count: { select: { agents: true } } },
        orderBy: { createdAt: "desc" }
    });
}

export async function upsertKnowledgeBase(data: {
    id?: string;
    companyId: string;
    name: string;
    description?: string;
    sourceType?: string;
    sourceUrl?: string;
    content: string;
}) {
    await getSession();
    const payload = {
        companyId: data.companyId,
        name: data.name,
        description: data.description || null,
        sourceType: data.sourceType || "TEXT",
        sourceUrl: data.sourceUrl || null,
        content: data.content,
    };
    const kb = data.id
        ? await prisma.knowledgeBase.update({ where: { id: data.id }, data: payload })
        : await prisma.knowledgeBase.create({ data: payload });
    revalidatePath(REVALIDATE);
    return { success: true, kb };
}

export async function deleteKnowledgeBase(id: string) {
    await getSession();
    await prisma.knowledgeBase.delete({ where: { id } });
    revalidatePath(REVALIDATE);
    return { success: true };
}

// ══════════════════════════════════════════════════════════════
// CONVERSATIONS & HUMAN-IN-THE-LOOP
// ══════════════════════════════════════════════════════════════

export async function getAgentConversations(agentId: string) {
    return prisma.agentConversation.findMany({
        where: { agentId },
        include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { updatedAt: "desc" }
    });
}

export async function createAgentConversation(agentId: string, companyId: string, contactId?: string) {
    const conversation = await prisma.agentConversation.create({
        data: { agentId, companyId, contactId, status: "ACTIVE" }
    });
    return { success: true, conversationId: conversation.id };
}

export async function triggerHumanIntervention(conversationId: string) {
    await getSession();
    const conversation = await prisma.agentConversation.findUnique({
        where: { id: conversationId },
        include: { agent: true }
    });
    if (!conversation) throw new Error("Conversación no encontrada.");
    if (!conversation.agent) throw new Error("Agente no encontrado.");

    const suspendedUntil = new Date(Date.now() + conversation.agent.suspensionDurationMinutes * 60 * 1000);
    await prisma.agentConversation.update({
        where: { id: conversationId },
        data: { status: "SUSPENDED", suspendedUntil, suspendedReason: "MANUAL" }
    });

    revalidatePath(REVALIDATE);
    return { success: true, suspendedUntil };
}

export async function resumeAgentConversation(conversationId: string) {
    await getSession();
    await prisma.agentConversation.update({
        where: { id: conversationId },
        data: { status: "ACTIVE", suspendedUntil: null, suspendedReason: null }
    });
    revalidatePath(REVALIDATE);
    return { success: true };
}

// ══════════════════════════════════════════════════════════════
// INVOKE AGENT (for UI use)
// ══════════════════════════════════════════════════════════════

export async function invokeAgentAction(
    agentId: string,
    userMessage: string,
    conversationId?: string,
    contactData?: Record<string, any>
) {
    const session = await getSession();
    const companyId = session.user.companyId!;

    // --- SaaS B2B AI Interactions Enforcer (Metered usage) ---
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { subscriptionTier: true } });
    const { enforceQuota } = await import("@/lib/quotas");
    const quota = await enforceQuota(companyId, "ai_interactions", company?.subscriptionTier || "free");

    if (!quota.allowed) {
        return { success: false, error: `SaaS Limit Reached: Tienes un límite de ${quota.limit} interacciones (API calls) al mes en el plan actual.` };
    }
    // ---------------------------------------------------------

    const { runAIAgent } = await import("@/lib/agent-runner");

    const result = await runAIAgent({
        agentId,
        companyId: session.user.companyId!,
        userMessage,
        conversationId,
        senderUserId: session.user.id,
        contactData
    });

    return { success: true, ...result };
}
