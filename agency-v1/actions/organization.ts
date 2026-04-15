"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Tipo esperado por el Canvas Frontend (Adaptable a nodos de React Flow)
export type OrgNode = {
    id: string;
    name: string;
    description: string | null;
    level: number;
    parentId: string | null;
    companyId: string;
    memberCount: number;
    maxHeadcount: number | null;
    monthlyBudget: number | null;
    activeBounties: number;
};

/**
 * Obtiene todos los equipos de la compañía listos para graficarse en el Canvas
 */
export async function getOrganizationChart(companyId: string): Promise<{ success: boolean; data?: OrgNode[]; error?: string }> {
    try {
        const teams = await prisma.team.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: { 
                        members: true,
                        bounties: { where: { status: 'OPEN' } }
                    }
                }
            },
            orderBy: [{ level: 'asc' }, { name: 'asc' }]
        });

        const nodes: OrgNode[] = teams.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            level: t.level,
            parentId: t.parentId,
            companyId: t.companyId,
            memberCount: t._count.members,
            maxHeadcount: t.maxHeadcount,
            monthlyBudget: t.monthlyBudget,
            activeBounties: t._count.bounties
        }));

        return { success: true, data: nodes };
    } catch (error: any) {
        console.error("Error fetching organization chart:", error);
        return { success: false, error: "Error interno al cargar la arquitectura" };
    }
}

/**
 * Mueve un nodo en la jerarquía (Drag & Drop support)
 */
export async function updateTeamParent(teamId: string, newParentId: string | null, companyId: string) {
    try {
        // Evitar referencias circulares básicas
        if (teamId === newParentId) {
            return { success: false, error: "Un equipo no puede ser su propio padre." };
        }

        let newLevel = 0;
        let newPath = "/";

        if (newParentId) {
            const parent = await prisma.team.findUnique({ where: { id: newParentId } });
            if (!parent) return { success: false, error: "El equipo destino no existe." };
            
            // Validar que el nuevo padre pertenezca a la misma compañía
            if (parent.companyId !== companyId) {
                return { success: false, error: "El equipo destino pertenece a otra compañía." };
            }

            // Validar ciclo profundo: ¿es el nuevo padre un hijo o descendiente de este equipo?
            if (parent.path.includes(`/${teamId}/`)) {
                return { success: false, error: "Referencia circular: No puedes asignar un equipo dentro de sus propios sub-equipos." };
            }

            newLevel = parent.level + 1;
            newPath = `${parent.path}${parent.id}/`;
        }

        // 1. Actualizar el equipo movido
        await prisma.team.update({
            where: { id: teamId },
            data: {
                parentId: newParentId,
                level: newLevel,
                path: newPath
            }
        });

        // 2. Cascade update paths and levels for ALL descendants
        // (This is tricky in Prisma, usually done via raw query or recursive function)
        // For standard small-medium orgs, a nested recursive fix is viable.
        await updateDescendantsPathAndLevel(teamId, newLevel, newPath);

        revalidatePath('/dashboard/admin/architecture');
        return { success: true };
    } catch (error: any) {
        console.error("Error re-parenting team:", error);
        return { success: false, error: "Error interno al mover el equipo." };
    }
}

async function updateDescendantsPathAndLevel(parentId: string, parentLevel: number, parentPath: string) {
    const children = await prisma.team.findMany({ where: { parentId } });
    for (const child of children) {
        const childLevel = parentLevel + 1;
        const childPath = `${parentPath}${parentId}/`;
        
        await prisma.team.update({
            where: { id: child.id },
            data: { level: childLevel, path: childPath }
        });
        
        // Recursive
        await updateDescendantsPathAndLevel(child.id, childLevel, childPath);
    }
}

/**
 * Retorna detalles operacionales de un equipo y sus miembros activos (Panel Lateral)
 */
export async function getTeamDetails(teamId: string) {
    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, image: true }
                        }
                    }
                },
                bounties: {
                    where: { status: 'OPEN' },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!team) return { success: false, error: "Equipo no encontrado" };
        
        return { success: true, data: team };
    } catch (error) {
        return { success: false, error: "Error cargando los detalles del equipo" };
    }
}

/**
 * Crea un equipo en el lienzo
 */
export async function createTeamInteractive(name: string, description: string, companyId: string, parentId: string | null) {
    try {
        let level = 0;
        let path = "/";

        if (parentId) {
            const parent = await prisma.team.findUnique({ where: { id: parentId } });
            if (parent) {
                level = parent.level + 1;
                path = `${parent.path}${parent.id}/`;
            }
        }

        const team = await prisma.team.create({
            data: {
                name,
                description,
                companyId,
                parentId,
                level,
                path
            }
        });

        revalidatePath('/dashboard/admin/architecture');
        return { success: true, data: team };
    } catch (error) {
        return { success: false, error: "Error creando el nodo del equipo" };
    }
}

export async function deleteTeamInteractive(teamId: string) {
    try {
        const hasChildren = await prisma.team.count({ where: { parentId: teamId } });
        if (hasChildren > 0) {
            return { success: false, error: "No puedes borrar un área o equipo que contiene sub-departamentos. Reasígnalos primero." };
        }

        const hasMembers = await prisma.companyUser.count({ where: { teamId: teamId } });
         if (hasMembers > 0) {
            return { success: false, error: "No puedes borrar un equipo que tiene miembros asignados. Retíralos primero." };
        }

        await prisma.team.delete({ where: { id: teamId } });
        revalidatePath('/dashboard/admin/architecture');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error interno al borrar el equipo" };
    }
}

/**
 * Actualiza la configuración de eficiencia y presupuesto de un equipo.
 */
export async function updateTeamConfig(
    teamId: string, 
    data: { name?: string, description?: string, maxHeadcount?: number | null, monthlyBudget?: number | null }
) {
    try {
        await prisma.team.update({
            where: { id: teamId },
            data: {
                name: data.name,
                description: data.description,
                maxHeadcount: data.maxHeadcount,
                monthlyBudget: data.monthlyBudget
            }
        });
        
        revalidatePath('/dashboard/admin/architecture');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error actualizando la configuración del equipo." };
    }
}

/**
 * Gamificación: Lanza un Bounty (Recompensa) para motivar al departamento.
 */
export async function createTeamBounty(teamId: string, title: string, rewardAmount: number, userId: string) {
    try {
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return { success: false, error: "El departamento no existe." };

        const bounty = await prisma.bounty.create({
            data: {
                title,
                rewardAmount,
                teamId,
                createdBy: userId
            }
        });

        revalidatePath('/dashboard/admin/architecture');
        return { success: true, data: bounty };
    } catch (error) {
        return { success: false, error: "Error al publicar la oferta de recompensa (Bounty)." };
    }
}

/**
 * Cierra o elimina un Bounty activo.
 */
export async function deleteTeamBounty(bountyId: string) {
    try {
        await prisma.bounty.delete({ where: { id: bountyId } });
        revalidatePath('/dashboard/admin/architecture');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error interno al eliminar el bounty." };
    }
}

/**
 * Reubica gráficamente a un usuario de un equipo a otro (Drag and Drop Support)
 */
export async function reassignUserToTeam(companyUserId: string, newTeamId: string) {
    try {
        await prisma.companyUser.update({
            where: { id: companyUserId },
            data: { teamId: newTeamId }
        });
        
        revalidatePath('/dashboard/admin/architecture');
        return { success: true };
    } catch (error) {
        return { success: false, error: "No se pudo reasignar al usuario al nuevo equipo." };
    }
}
