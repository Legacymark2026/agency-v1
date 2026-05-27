"use server";
/**
 * actions/role-config.ts
 * ─────────────────────────────────────────────────────────────
 * Server Actions para gestionar RoleConfig desde la UI.
 * Solo accesible por SUPER_ADMIN.
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { invalidateRoleCache } from "@/lib/role-config";

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

async function fetchGateway(path: string, options?: RequestInit) {
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

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

    const config = await fetchGateway('/api/auth/role-configs', {
        method: 'POST',
        body: JSON.stringify({
            roleName,
            allowedRoutes: data.allowedRoutes,
            description: data.description,
            isActive: data.isActive,
        }),
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
    await fetchGateway(`/api/auth/role-configs/${name}`, {
        method: 'DELETE',
    });

    invalidateRoleCache(name);
    revalidatePath("/dashboard/users");

    return { success: true };
}

/** Obtiene todos los RoleConfigs (para la UI) */
export async function getRoleConfigs() {
    await requireSuperAdmin();
    return fetchGateway('/api/auth/role-configs');
}

/** Obtiene todos los usuarios con sus roles (para la UI de asignación) */
export async function getUsersWithRoles() {
    await requireSuperAdmin();
    return fetchGateway('/api/auth/global-users');
}

/** Actualiza el rol de un usuario */
export async function updateUserRole(userId: string, newRole: string) {
    await requireSuperAdmin();

    const role = newRole.trim().toLowerCase();
    if (!role) throw new Error("El rol no puede estar vacío.");

    await fetchGateway(`/api/auth/global-users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
    });

    revalidatePath("/dashboard/users");
    return { success: true };
}
