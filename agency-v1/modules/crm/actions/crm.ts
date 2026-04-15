'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type Deal = {
    id: string;
    title: string;
    value: number;
    currency: string;
    stage: string;
    companyId: string;
    contactName: string | null;
    contactEmail: string | null;
    priority: string;
    probability: number;
    notes: string | null;
    lostReason: string | null;
    lastActivity: Date;
    tags: string[];
    source: string | null;
    expectedClose: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export async function getDeals(companyId: string) {
    try {
        const deals = await prisma.deal.findMany({
            where: { companyId },
            orderBy: { updatedAt: 'desc' }
        });
        return { success: true, data: deals };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error("Error fetching deals:", error);
        return { success: false, error: error.message };
    }
}

export async function createDeal(data: {
    title: string;
    value: number;
    stage?: string;
    companyId: string;
    contactName?: string;
    contactEmail?: string;
    priority?: string;
}) {
    try {
        const deal = await prisma.deal.create({
            data: {
                title: data.title,
                value: data.value,
                stage: data.stage || 'NEW',
                companyId: data.companyId,
                contactName: data.contactName,
                contactEmail: data.contactEmail,
                priority: data.priority || 'MEDIUM',
                probability: data.stage === 'WON' ? 100 : 10
            }
        });
        revalidatePath('/dashboard/admin/crm/pipeline');
        return { success: true, data: deal };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error("Error creating deal:", error);
        return { success: false, error: error.message };
    }
}

export async function updateDeal(dealId: string, data: Partial<Deal>) {
    try {
        // If stage is changing, update probability too
        const updateData: any = { ...data };

        if (data.stage) {
            const probabilities: Record<string, number> = {
                'NEW': 10,
                'CONTACTED': 30,
                'PROPOSAL': 60,
                'NEGOTIATION': 80,
                'WON': 100,
                'LOST': 0
            };
            updateData.probability = probabilities[data.stage] || 10;
        }

        const deal = await prisma.deal.update({
            where: { id: dealId },
            data: updateData
        });

        // ─── SYNC: Pipeline Stage → Lead Status ─────────────────────────
        // When a deal stage changes, update the corresponding Lead status
        if (data.stage) {
            const leadStatusMap: Record<string, string> = {
                'NEW': 'NEW',
                'CONTACTED': 'CONTACTED',
                'QUALIFIED': 'QUALIFIED',
                'PROPOSAL': 'QUALIFIED',
                'NEGOTIATION': 'QUALIFIED',
                'WON': 'CONVERTED',
                'LOST': 'LOST',
            };
            const newLeadStatus = leadStatusMap[data.stage];
            console.log(`[Pipeline Sync] Deal "${deal.title}" → stage: ${data.stage}, contactEmail: ${deal.contactEmail}, companyId: ${deal.companyId}, newLeadStatus: ${newLeadStatus}`);
            
            if (newLeadStatus) {
                // Strategy 1: Link by contactEmail (primary)
                // Strategy 2: Extract email from deal title "Lead: email@example.com"
                const emailFromTitle = deal.title?.match(/^Lead:\s+(.+@.+\..+)$/i)?.[1]?.trim();
                const emailToSearch = deal.contactEmail || emailFromTitle;
                
                console.log(`[Pipeline Sync] Searching lead by email: "${emailToSearch}"`);
                
                if (emailToSearch) {
                    const linkedLeads = await prisma.lead.findMany({
                        where: {
                            email: { equals: emailToSearch, mode: 'insensitive' },
                            companyId: deal.companyId,
                        },
                        select: { id: true, status: true, email: true }
                    });
                    console.log(`[Pipeline Sync] Found ${linkedLeads.length} linked leads:`, linkedLeads.map(l => `${l.email} (${l.status})`));
                    
                    const leadsToUpdate = linkedLeads.filter(l => l.status !== newLeadStatus);
                    if (leadsToUpdate.length > 0) {
                        await prisma.lead.updateMany({
                            where: { id: { in: leadsToUpdate.map(l => l.id) } },
                            data: {
                                status: newLeadStatus,
                                ...(newLeadStatus === 'CONVERTED' ? { convertedAt: new Date() } : {}),
                                updatedAt: new Date(),
                            }
                        });
                        console.log(`[Pipeline Sync] ✅ Updated ${leadsToUpdate.length} lead(s) to status: ${newLeadStatus}`);
                    } else {
                        console.log(`[Pipeline Sync] ℹ️ No leads needed update (already at ${newLeadStatus} or no leads found)`);
                    }
                } else {
                    console.log(`[Pipeline Sync] ⚠️ No email found for deal "${deal.title}" — cannot sync lead status`);
                }
            }
        }
        // ─────────────────────────────────────────────────────────────────

        revalidatePath('/dashboard/admin/crm/pipeline');
        revalidatePath('/dashboard/admin/crm/leads');
        return { success: true, data: deal };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error("Error updating deal:", error);
        return { success: false, error: error.message };
    }
}

export async function updateDealStage(dealId: string, newStage: string) {
    return updateDeal(dealId, { stage: newStage });
}

export async function deleteDeal(dealId: string) {
    try {
        await prisma.deal.delete({ where: { id: dealId } });
        revalidatePath('/dashboard/admin/crm/pipeline');
        return { success: true };
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        return { success: false, error: error.message };
    }
}

// Team hierarchy types and functions
export type TeamNode = {
    id: string;
    name: string;
    description: string | null;
    level: number;
    parentId: string | null;
    children: TeamNode[];
};

export async function getHierarchy(): Promise<TeamNode[]> {
    try {
        const teams = await prisma.team.findMany({
            orderBy: [{ level: 'asc' }, { name: 'asc' }]
        });

        // Build tree structure from flat list
        const teamMap = new Map<string, TeamNode>();
        const roots: TeamNode[] = [];

        // First pass: create all nodes
        for (const team of teams) {
            const pathParts = team.path.split('/').filter(Boolean);
            const parentId = pathParts.length > 1 ? pathParts[pathParts.length - 2] : null;

            teamMap.set(team.id, {
                id: team.id,
                name: team.name,
                description: team.description,
                level: team.level,
                parentId: parentId,
                children: []
            });
        }

        // Second pass: build tree using path
        for (const team of teams) {
            const node = teamMap.get(team.id)!;

            // Parse parent from path (e.g. "/parent-id/" means parent-id is parent)
            const pathParts = team.path.split('/').filter(Boolean);

            if (pathParts.length === 0 || team.level === 0) {
                // Root node
                roots.push(node);
            } else {
                // Find parent (second to last in path, or first if only one)
                const parentId = pathParts[pathParts.length - 1];
                const parent = teamMap.get(parentId);
                if (parent) {
                    parent.children.push(node);
                } else {
                    // Orphan, add to roots
                    roots.push(node);
                }
            }
        }

        return roots;
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error("Error fetching hierarchy:", error);
        return [];
    }
}

export async function getCustomObjectDefinitions() {
    try {
        const definitions = await prisma.customObjectDefinition.findMany({
            include: {
                fields: true
            },
            orderBy: { name: 'asc' }
        });
        return definitions;
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error("Error fetching custom object definitions:", error);
        return [];
    }
}
