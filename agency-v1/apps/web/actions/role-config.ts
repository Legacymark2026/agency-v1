"use server";
/**
 * actions/role-config.ts
 * ─────────────────────────────────────────────────────────────
 * Server Actions para gestionar RoleConfig desde la UI.
 * Solo accesible por SUPER_ADMIN.
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateRoleCache } from "@/lib/role-config";

/** Verifica que el usuario actual es SUPER_ADMIN */
async function requireSuperAdmin() {
    const session = await auth();
    const role = (session?.user?.role as string)?.toLowerCase();
    if (!session || role !== 'super_admin') {
        throw new Error("Acceso denegado: Solo SUPER_ADMIN puede gestionar roles.");
    }
    return session;
}

/** Crea o actualiza un RoleConfig */
export async function upsertRoleConfig(data: {
    roleName: string;
    allowedRoutes: string[];
    description?: string;
    isActive?: boolean;
}) {
    await requireSuperAdmin();

    const roleName = data.roleName.trim().toLowerCase();
    if (!roleName) throw new Error("El nombre del rol no puede estar vacío.");

    const config = await prisma.roleConfig.upsert({
        where: { roleName },
        create: {
            roleName,
            allowedRoutes: data.allowedRoutes,
            description: data.description ?? null,
            isActive: data.isActive ?? true,
        },
        update: {
            allowedRoutes: data.allowedRoutes,
            description: data.description ?? null,
            isActive: data.isActive ?? true,
        },
    });

    // Invalidar cache para que el cambio tome efecto inmediatamente
    invalidateRoleCache(roleName);

    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/security");

    return { success: true, config };
}

/** Elimina un RoleConfig */
export async function deleteRoleConfig(roleName: string) {
    await requireSuperAdmin();

    const name = roleName.trim().toLowerCase();
    await prisma.roleConfig.delete({ where: { roleName: name } });

    invalidateRoleCache(name);
    revalidatePath("/dashboard/users");

    return { success: true };
}

/** Obtiene todos los RoleConfigs (para la UI) */
export async function getRoleConfigs() {
    await requireSuperAdmin();
    return prisma.roleConfig.findMany({ orderBy: { roleName: 'asc' } });
}

/** Obtiene todos los usuarios con sus roles (para la UI de asignación) */
export async function getUsersWithRoles() {
    await requireSuperAdmin();
    return prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            deactivatedAt: true,
        },
        orderBy: { role: 'asc' },
    });
}

/** Actualiza el rol de un usuario */
export async function updateUserRole(userId: string, newRole: string) {
    await requireSuperAdmin();

    const role = newRole.trim().toLowerCase();
    if (!role) throw new Error("El rol no puede estar vacío.");

    await prisma.user.update({
        where: { id: userId },
        data: { role },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
}
