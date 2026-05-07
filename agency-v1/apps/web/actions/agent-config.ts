"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REVALIDATE = "/dashboard/settings/agents";

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado.");
    return session;
}

async function checkAdminAccess(companyId: string) {
    const session = await getSession();
    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id, companyId }
    });
    
    if (!companyUser) throw new Error("No tienes acceso a esta empresa.");
    
    const userRoleName = companyUser.roleName?.toUpperCase() || "MEMBER";
    
    if (!["ADMIN", "OWNER", "MANAGER"].includes(userRoleName)) {
        throw new Error("Solo administradores pueden gestionar configuraciones de agentes.");
    }
    
    return { session, companyUser };
}

// ══════════════════════════════════════════════════════════════
// AGENT SPECIALIZATIONS
// ══════════════════════════════════════════════════════════════

export async function getSpecializations(companyId: string, includeGlobal = true) {
    await getSession();
    
    const where = includeGlobal 
        ? { OR: [{ companyId }, { companyId: null, isGlobal: true }, { isSystem: true }] }
        : { companyId };

    return prisma.agentSpecialization.findMany({
        where,
        orderBy: [{ isSystem: "desc" }, { order: "asc" }, { name: "asc" }]
    });
}

export async function getSpecializationById(id: string) {
    return prisma.agentSpecialization.findUnique({
        where: { id },
        include: { skills: true }
    });
}

export async function createSpecialization(data: {
    name: string;
    description?: string;
    category?: string;
    icon?: string;
    color?: string;
    companyId: string;
}) {
    const { session } = await checkAdminAccess(data.companyId);

    const maxOrder = await prisma.agentSpecialization.findFirst({
        where: { companyId: data.companyId },
        orderBy: { order: "desc" },
        select: { order: true }
    });

    return prisma.agentSpecialization.create({
        data: {
            ...data,
            order: (maxOrder?.order ?? 0) + 1,
            isSystem: false
        }
    });
}

export async function updateSpecialization(id: string, data: {
    name?: string;
    description?: string;
    category?: string;
    icon?: string;
    color?: string;
    isActive?: boolean;
    order?: number;
}) {
    await getSession();
    
    const existing = await prisma.agentSpecialization.findUnique({ where: { id } });
    if (!existing) throw new Error("Especialización no encontrada.");
    
    if (existing.isSystem) {
        throw new Error("No puedes modificar especializaciones del sistema.");
    }

    return prisma.agentSpecialization.update({
        where: { id },
        data
    });
}

export async function deleteSpecialization(id: string) {
    await getSession();
    
    const existing = await prisma.agentSpecialization.findUnique({ where: { id } });
    if (!existing) throw new Error("Especialización no encontrada.");
    
    if (existing.isSystem) {
        throw new Error("No puedes eliminar especializaciones del sistema.");
    }

    const skillsCount = await prisma.agentSkill.count({ where: { specializationId: id } });
    if (skillsCount > 0) {
        throw new Error(`Hay ${skillsCount} habilidades asociadas. Elimínalas primero.`);
    }

    await prisma.agentSpecialization.delete({ where: { id } });
    revalidatePath(REVALIDATE);
}

// ══════════════════════════════════════════════════════════════
// AGENT SKILLS
// ══════════════════════════════════════════════════════════════

export async function getSkills(companyId: string, specializationId?: string) {
    await getSession();
    
    return prisma.agentSkill.findMany({
        where: {
            companyId,
            ...(specializationId && { specializationId })
        },
        include: { specialization: true },
        orderBy: { priority: "asc" }
    });
}

export async function getSkillById(id: string) {
    return prisma.agentSkill.findUnique({
        where: { id },
        include: { specialization: true }
    });
}

export async function createSkill(data: {
    name: string;
    description?: string;
    category?: string;
    parameters?: Record<string, any>;
    specializationId: string;
    priority?: number;
    companyId: string;
    agentId?: string;
}) {
    const { session } = await checkAdminAccess(data.companyId);

    return prisma.agentSkill.create({
        data: {
            ...data,
            parameters: data.parameters ?? {}
        }
    });
}

export async function updateSkill(id: string, data: {
    name?: string;
    description?: string;
    category?: string;
    parameters?: Record<string, any>;
    isActive?: boolean;
    priority?: number;
}) {
    await getSession();
    return prisma.agentSkill.update({
        where: { id },
        data: {
            ...data,
            ...(data.parameters && { parameters: data.parameters })
        }
    });
}

export async function deleteSkill(id: string) {
    await getSession();
    await prisma.agentSkill.delete({ where: { id } });
    revalidatePath(REVALIDATE);
}

export async function assignSkillToAgent(skillId: string, agentId: string) {
    await getSession();
    return prisma.agentSkill.update({
        where: { id: skillId },
        data: { agentId }
    });
}

export async function unassignSkillFromAgent(skillId: string) {
    await getSession();
    return prisma.agentSkill.update({
        where: { id: skillId },
        data: { agentId: null }
    });
}

// ══════════════════════════════════════════════════════════════
// SKILL TEMPLATES
// ══════════════════════════════════════════════════════════════

export async function getSkillTemplates(companyId: string, category?: string) {
    await getSession();
    
    return prisma.skillTemplate.findMany({
        where: {
            OR: [
                { isGlobal: true },
                { companyId }
            ],
            ...(category && { category })
        },
        orderBy: { downloads: "desc" }
    });
}

export async function getSkillTemplateById(id: string) {
    return prisma.skillTemplate.findUnique({ where: { id } });
}

export async function createSkillTemplate(data: {
    name: string;
    description?: string;
    category?: string;
    content: Record<string, any>;
    parameters?: Record<string, any>;
    tags?: string[];
    companyId: string;
    isGlobal?: boolean;
}) {
    const { session } = await checkAdminAccess(data.companyId);

    return prisma.skillTemplate.create({
        data: {
            ...data,
            createdBy: session.user.id,
            parameters: data.parameters ?? {},
            tags: data.tags ?? []
        }
    });
}

export async function importSkillFromTemplate(templateId: string, companyId: string, agentId?: string) {
    const { session } = await checkAdminAccess(companyId);
    
    const template = await prisma.skillTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new Error("Template no encontrado.");
    
    // Increment download count
    await prisma.skillTemplate.update({
        where: { id: templateId },
        data: { downloads: { increment: 1 } }
    });

    // Create skill from template content
    const content = template.content as any;
    
    return prisma.agentSkill.create({
        data: {
            name: content.name || template.name,
            description: content.description || template.description,
            category: content.category || template.category,
            parameters: content.parameters || template.parameters,
            specializationId: content.specializationId,
            agentId,
            companyId,
            priority: 0
        }
    });
}

export async function deleteSkillTemplate(id: string) {
    const { session } = await getSession();
    
    const template = await prisma.skillTemplate.findUnique({ where: { id } });
    if (!template) throw new Error("Template no encontrado.");
    
    if (template.companyId && template.createdBy !== session.user.id) {
        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id, companyId: template.companyId }
        });
        
        if (!companyUser) throw new Error("No tienes acceso.");
        
        const userRoleName = companyUser.roleName?.toUpperCase() || "MEMBER";
        
        if (!["ADMIN", "OWNER"].includes(userRoleName)) {
            throw new Error("Solo el propietario puede eliminar este template.");
        }
    }

    await prisma.skillTemplate.delete({ where: { id } });
    revalidatePath(REVALIDATE);
}

export async function exportSkillTemplate(id: string) {
    await getSession();
    
    const template = await prisma.skillTemplate.findUnique({ where: { id } });
    if (!template) throw new Error("Template no encontrado.");
    
    return {
        name: template.name,
        description: template.description,
        category: template.category,
        content: template.content,
        parameters: template.parameters,
        tags: template.tags
    };
}

// ══════════════════════════════════════════════════════════════
// AGENT CONFIGURATION PRESETS
// ══════════════════════════════════════════════════════════════

export async function getPresets(companyId: string, specializationId?: string) {
    await getSession();
    
    return prisma.agentConfigurationPreset.findMany({
        where: {
            OR: [
                { isGlobal: true },
                { companyId }
            ],
            ...(specializationId && { specializationId })
        },
        include: { specialization: true },
        orderBy: { isDefault: "desc" }
    });
}

export async function getPresetById(id: string) {
    return prisma.agentConfigurationPreset.findUnique({
        where: { id },
        include: { specialization: true }
    });
}

export async function createPreset(data: {
    name: string;
    description?: string;
    config: Record<string, any>;
    specializationId?: string;
    isDefault?: boolean;
    isGlobal?: boolean;
    companyId: string;
}) {
    const { session } = await checkAdminAccess(data.companyId);

    // If setting as default, unset other defaults for this specialization/company
    if (data.isDefault) {
        await prisma.agentConfigurationPreset.updateMany({
            where: {
                companyId: data.companyId,
                specializationId: data.specializationId,
                isDefault: true
            },
            data: { isDefault: false }
        });
    }

    return prisma.agentConfigurationPreset.create({
        data: {
            ...data,
            companyId: data.companyId
        }
    });
}

export async function updatePreset(id: string, data: {
    name?: string;
    description?: string;
    config?: Record<string, any>;
    isDefault?: boolean;
    isActive?: boolean;
}) {
    await getSession();
    
    if (data.isDefault) {
        const existing = await prisma.agentConfigurationPreset.findUnique({ where: { id } });
        if (existing) {
            await prisma.agentConfigurationPreset.updateMany({
                where: {
                    companyId: existing.companyId,
                    specializationId: existing.specializationId,
                    isDefault: true,
                    id: { not: id }
                },
                data: { isDefault: false }
            });
        }
    }

    return prisma.agentConfigurationPreset.update({
        where: { id },
        data: {
            ...data,
            ...(data.config && { config: data.config })
        }
    });
}

export async function deletePreset(id: string) {
    await getSession();
    await prisma.agentConfigurationPreset.delete({ where: { id } });
    revalidatePath(REVALIDATE);
}

export async function applyPresetToAgent(presetId: string, agentId: string) {
    await getSession();
    
    const preset = await prisma.agentConfigurationPreset.findUnique({ where: { id: presetId } });
    if (!preset) throw new Error("Preset no encontrado.");
    
    const config = preset.config as any;
    
    // Apply preset configuration to agent
    return prisma.aIAgent.update({
        where: { id: agentId },
        data: {
            systemPrompt: config.systemPrompt,
            llmModel: config.llmModel,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            enabledTools: config.enabledTools,
            strictRagMode: config.strictRagMode,
            humanTransferWebhook: config.humanTransferWebhook,
            suspensionDurationMinutes: config.suspensionDurationMinutes
        }
    });
}

// ══════════════════════════════════════════════════════════════
// SYNC AGENT CONFIGURATION
// ══════════════════════════════════════════════════════════════

export async function syncAgentConfiguration(agentId: string, companyId: string) {
    const { session } = await checkAdminAccess(companyId);
    
    const agent = await prisma.aIAgent.findUnique({
        where: { id: agentId },
        include: { knowledgeBases: true }
    });
    
    if (!agent) throw new Error("Agente no encontrado.");
    
    // Get all skills assigned to this agent
    const skills = await prisma.agentSkill.findMany({
        where: { agentId },
        orderBy: { priority: "asc" }
    });
    
    // Get specializations for assigned skills
    const specializationIds = [...new Set(skills.map(s => s.specializationId))];
    const specializations = await prisma.agentSpecialization.findMany({
        where: { id: { in: specializationIds } }
    });
    
    // Build configuration sync report
    return {
        agentId: agent.id,
        agentName: agent.name,
        skillCount: skills.length,
        specializationCount: specializations.length,
        specializations: specializations.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category
        })),
        skills: skills.map(s => ({
            id: s.id,
            name: s.name,
            category: s.category,
            parameters: s.parameters
        })),
        syncedAt: new Date().toISOString()
    };
}

// ══════════════════════════════════════════════════════════════
// GLOBAL CONFIGURATION SYNC
// ══════════════════════════════════════════════════════════════

export async function getGlobalConfiguration(companyId: string) {
    await getSession();
    
    const [specializations, skills, presets, templates] = await Promise.all([
        prisma.agentSpecialization.findMany({
            where: { OR: [{ companyId }, { isSystem: true }], isActive: true },
            orderBy: { order: "asc" }
        }),
        prisma.agentSkill.findMany({
            where: { companyId },
            include: { specialization: true },
            orderBy: { priority: "asc" }
        }),
        prisma.agentConfigurationPreset.findMany({
            where: { OR: [{ companyId }, { isGlobal: true }] },
            include: { specialization: true }
        }),
        prisma.skillTemplate.findMany({
            where: { OR: [{ isGlobal: true }, { companyId }] },
            orderBy: { downloads: "desc" }
        })
    ]);

    return {
        specializations,
        skills,
        presets,
        templates,
        stats: {
            totalSpecializations: specializations.length,
            totalSkills: skills.length,
            totalPresets: presets.length,
            totalTemplates: templates.length
        }
    };
}

// ══════════════════════════════════════════════════════════════
// SEED DEFAULT DATA (System Specializations)
// ══════════════════════════════════════════════════════════════

export async function seedSystemSpecializations() {
    const existingCount = await prisma.agentSpecialization.count({
        where: { isSystem: true }
    });
    
    if (existingCount > 0) return; // Already seeded

    const systemSpecializations = [
        { name: "Ventas", description: "Especialista en cierre de ventas y captación de clientes", category: "SALES", icon: "target", color: "#0d9488" },
        { name: "Soporte", description: "Atención al cliente y resolución de problemas", category: "SUPPORT", icon: "headset", color: "#6366f1" },
        { name: "Marketing", description: "Gestión de campañas y generación de leads", category: "MARKETING", icon: "megaphone", color: "#f59e0b" },
        { name: "Operaciones", description: "Automatización de procesos internos", category: "OPERATIONS", icon: "settings", color: "#8b5cf6" },
        { name: "CRM", description: "Gestión de relaciones con clientes", category: "CRM", icon: "users", color: "#ec4899" },
        { name: "Finanzas", description: "Asesoría financiera y gestión de cobros", category: "FINANCE", icon: "dollar", color: "#10b981" },
        { name: "Legal", description: "Consultas jurídicas y cumplimiento normativo", category: "LEGAL", icon: "scale", color: "#64748b" }
    ];

    for (let i = 0; i < systemSpecializations.length; i++) {
        const spec = systemSpecializations[i];
        await prisma.agentSpecialization.create({
            data: {
                name: spec.name,
                description: spec.description,
                category: spec.category,
                icon: spec.icon,
                color: spec.color,
                isSystem: true,
                isActive: true,
                order: i + 1,
                companyId: null
            }
        });
    }
}