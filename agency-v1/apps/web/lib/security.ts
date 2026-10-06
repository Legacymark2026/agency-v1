"use server";

/**
 * lib/security.ts
 * ─────────────────────────────────────────────────────
 * Funciones de verificación de permisos para RBAC Multi-Tenant.
 * 
 * USO:
 *   import { verifyPermission, canManageLeads } from "@/lib/security";
 * 
 *   export async function updateLead(leadId: string, data: LeadInput) {
 *     const hasPermission = await verifyPermission(
 *       session.user.id,
 *       session.user.companyId,
 *       'crm.leads.edit'
 *     );
 *     if (!hasPermission) throw new ForbiddenError();
 *   }
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { logger } from "@/lib/logger";
import { GLOBAL_SUPERADMIN_EMAILS } from "@/auth.config";

export interface PermissionCheckOptions {
  resourceType?: string;
  resourceId?: string;
}

// ── Permission Cache (2.2) ────────────────────────────────────────────────────
// Cache de permisos en Redis con TTL de 60s para reducir queries DB en dashboards
const PERM_CACHE_TTL_SEC = 60;

async function getCachedPermissions(
  userId: string,
  companyId: string
): Promise<string[] | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const key = `perms:${userId}:${companyId}`;
    const res = await fetch(`${url}/get/${key}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { result: string | null };
    if (!data.result) return null;
    return JSON.parse(data.result) as string[];
  } catch {
    return null;
  }
}

async function setCachedPermissions(
  userId: string,
  companyId: string,
  permissions: string[]
): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try {
    const key = `perms:${userId}:${companyId}`;
    await fetch(`${url}/set/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: JSON.stringify(permissions), ex: PERM_CACHE_TTL_SEC }),
    });
  } catch (err) {
    logger.warn('[Security] Failed to set permission cache', { error: String(err) });
  }
}

/** Invalida la cache de permisos para un usuario (llamar después de cambiar roles). */
export async function invalidatePermissionCache(
  userId: string,
  companyId: string
): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try {
    const key = `perms:${userId}:${companyId}`;
    await fetch(`${url}/del/${key}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch { /* non-fatal */ }
}

import { executeSecurityPipeline, executeSecurityPipelineOrFail } from "./security-pipeline";
export { executeSecurityPipeline, executeSecurityPipelineOrFail } from "./security-pipeline";

export async function verifyPermission(
  userId: string,
  companyId: string,
  permission: string,
  options?: PermissionCheckOptions
): Promise<boolean> {
  try {
    // Evaluación a través del pipeline secuencial de 5 motores:
    // 1. Auth -> 2. Subscription -> 3. Billing -> 4. Policy PDP -> 5. Authorization
    const pipelineResult = await executeSecurityPipeline({
      userId,
      companyId,
      permission,
      resourceType: options?.resourceType,
      resourceId: options?.resourceId,
    });

    return pipelineResult.allowed;
  } catch (error) {
    console.error("[Security] Error verifying permission via security pipeline:", error);
    return false;
  }
}

export async function verifyPermissionOrFail(
  userId: string,
  companyId: string,
  permission: string,
  options?: PermissionCheckOptions
): Promise<void> {
  const hasPermission = await verifyPermission(
    userId,
    companyId,
    permission,
    options
  );

  if (!hasPermission) {
    throw new ForbiddenError(
      `No tienes el permiso requerido: ${permission}`
    );
  }
}

/**
 * Verifica si el usuario tiene AL MENOS UNO de los permisos dados.
 * FIX: Usa una sola query con IN en lugar de N queries secuenciales.
 */
export async function hasAnyPermission(
  userId: string,
  companyId: string,
  permissions: string[]
): Promise<boolean> {
  if (permissions.length === 0) return false;
  try {
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId, companyId },
      include: {
        role: {
          include: {
            permissions: {
              where: { permission: { name: { in: permissions } } },
              include: { permission: true },
            },
          },
        },
      },
    });
    return (companyUser?.role?.permissions.length ?? 0) > 0;
  } catch (error) {
    console.error("[Security] Error in hasAnyPermission:", error);
    return false;
  }
}

/**
 * Verifica si el usuario tiene TODOS los permisos dados.
 * FIX: Usa una sola query con IN en lugar de N queries secuenciales.
 */
export async function hasAllPermissions(
  userId: string,
  companyId: string,
  permissions: string[]
): Promise<boolean> {
  if (permissions.length === 0) return true;
  try {
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId, companyId },
      include: {
        role: {
          include: {
            permissions: {
              where: { permission: { name: { in: permissions } } },
              include: { permission: true },
            },
          },
        },
      },
    });
    const grantedNames = new Set(
      companyUser?.role?.permissions.map((p) => p.permission.name) ?? []
    );
    return permissions.every((perm) => grantedNames.has(perm));
  } catch (error) {
    console.error("[Security] Error in hasAllPermissions:", error);
    return false;
  }
}

export async function getUserPermissions(
  userId: string,
  companyId: string
): Promise<string[]> {
  // 2.2: Check cache first
  const cached = await getCachedPermissions(userId, companyId);
  if (cached) return cached;

  try {
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId, companyId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const permissions = companyUser?.role?.permissions.map((p) => p.permission.name) || [];

    // Cache the result
    await setCachedPermissions(userId, companyId, permissions);

    return permissions;
  } catch (error) {
    console.error("[Security] Error getting user permissions:", error);
    return [];
  }
}

export async function getUserRole(
  userId: string,
  companyId: string
): Promise<{ id: string; name: string; priority: number } | null> {
  try {
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId, companyId },
      include: { role: true },
    });

    if (!companyUser?.role) return null;

    return {
      id: companyUser.role.id,
      name: companyUser.role.name,
      priority: companyUser.role.priority,
    };
  } catch (error) {
    console.error("[Security] Error getting user role:", error);
    return null;
  }
}

/**
 * Determina si el usuario es el Propietario (Owner) de la cuenta / plan de la empresa.
 * El Propietario del plan es la autoridad máxima del Tenant que posee el rol 'owner' o 'agency_owner'.
 */
export async function isCompanyOwner(
  userId: string,
  companyId: string
): Promise<boolean> {
  try {
    if (await isSuperAdmin(userId)) return true;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, globalRole: true },
    });
    if (user?.globalRole === "agency_owner" || user?.role === "super_admin" || user?.role === "SUPER_ADMIN") {
      return true;
    }

    const companyUser = await prisma.companyUser.findFirst({
      where: { userId, companyId },
      include: { role: true },
    });

    if (!companyUser) return false;

    if (["owner", "OWNER"].includes(companyUser.roleName)) {
      return true;
    }

    if (companyUser.role?.name?.toLowerCase() === "owner") {
      return true;
    }

    return (companyUser.role?.priority ?? 0) >= 100;
  } catch (error) {
    console.error("[Security] Error checking company owner:", error);
    return false;
  }
}

export async function isCompanyAdmin(
  userId: string,
  companyId: string
): Promise<boolean> {
  try {
    // SuperAdmin de la plataforma siempre tiene facultades de administración
    if (await isSuperAdmin(userId)) return true;

    // Verificar en User global
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === "admin" || user?.role === "ADMIN" || user?.role === "super_admin" || user?.role === "SUPER_ADMIN") {
      return true;
    }

    const companyUser = await prisma.companyUser.findFirst({
      where: { userId, companyId },
      include: { role: true },
    });

    if (!companyUser) return false;

    // Propietario o Administrador operativo de la empresa
    if (["owner", "admin", "ADMIN", "OWNER"].includes(companyUser.roleName)) {
      return true;
    }

    return (companyUser.role?.priority ?? 0) >= 80;
  } catch (error) {
    console.error("[Security] Error checking company admin:", error);
    return false;
  }
}

/**
 * Valida si un usuario tiene la facultad exclusiva o delegada para crear usuarios y credenciales.
 * REGLA ESTRICTA SAAS:
 * 1. El Administrador/Owner de la empresa siempre tiene esta facultad.
 * 2. Un usuario regular SOLO puede si pertenece a la empresa y tiene asignado el rol
 *    específico al cual el administrador le otorgó el permiso 'users.manage' o 'settings.users.manage'.
 */
export async function canManageCompanyUsers(
  userId: string,
  companyId: string
): Promise<boolean> {
  try {
    if (await isCompanyAdmin(userId, companyId)) {
      return true;
    }

    // Verificar si tiene el permiso asignado a su rol
    const hasUsersManage = await verifyPermission(userId, companyId, "users.manage");
    if (hasUsersManage) return true;

    const hasIamManage = await verifyPermission(userId, companyId, "iam.manage_users");
    if (hasIamManage) return true;

    return await verifyPermission(userId, companyId, "settings.users.manage");
  } catch (error) {
    console.error("[Security] Error checking canManageCompanyUsers:", error);
    return false;
  }
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });

    if (!user) return false;
    if (user.role === "super_admin" || user.role === "SUPER_ADMIN") return true;
    if (user.email && GLOBAL_SUPERADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
    return false;
  } catch (error) {
    console.error("[Security] Error checking super admin:", error);
    return false;
  }
}

export async function requireCompanyPermission(
  permission: string,
  options?: PermissionCheckOptions
): Promise<{ userId: string; companyId: string }> {
  const session = await auth();
  if (!session?.user?.id || !session.user.companyId) {
    throw new UnauthorizedError();
  }

  const companyId = session.user.companyId as string;
  const userId = session.user.id;

  await verifyPermissionOrFail(userId, companyId, permission, options);

  return { userId, companyId };
}

export async function requireCompanyRole(
  minPriority: number
): Promise<{ userId: string; companyId: string; rolePriority: number }> {
  const session = await auth();
  if (!session?.user?.id || !session.user.companyId) {
    throw new UnauthorizedError();
  }

  const companyId = session.user.companyId as string;
  const userId = session.user.id;

  const userRole = await getUserRole(userId, companyId);
  if (!userRole) {
    throw new ForbiddenError("No tienes un rol asignado en esta empresa");
  }

  if (userRole.priority < minPriority) {
    throw new ForbiddenError(
      `Se requiere un rol con prioridad mínima de ${minPriority}`
    );
  }

  return { userId, companyId, rolePriority: userRole.priority };
}

export async function createResourcePermission(
  data: {
    userId: string;
    companyId: string;
    resourceType: string;
    resourceId: string;
    permission: string;
    access: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  await verifyPermissionOrFail(
    session.user.id,
    data.companyId,
    "settings.users.manage"
  );

  return prisma.resourcePermission.upsert({
    where: {
      userId_companyId_resourceType_resourceId_permission: {
        userId: data.userId,
        companyId: data.companyId,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        permission: data.permission,
      },
    },
    update: { access: data.access },
    create: data,
  });
}

export async function deleteResourcePermission(id: string, companyId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  await verifyPermissionOrFail(
    session.user.id,
    companyId,
    "settings.users.manage"
  );

  return prisma.resourcePermission.delete({
    where: { id },
  });
}

export async function getResourcePermissions(
  userId: string,
  companyId: string,
  resourceType?: string,
  resourceId?: string
) {
  return prisma.resourcePermission.findMany({
    where: {
      userId,
      companyId,
      ...(resourceType && { resourceType }),
      ...(resourceId && { resourceId }),
    },
  });
}

export async function clearResourcePermissions(
  userId: string,
  companyId: string,
  resourceType: string,
  resourceId: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  await verifyPermissionOrFail(
    session.user.id,
    companyId,
    "settings.users.manage"
  );

  return prisma.resourcePermission.deleteMany({
    where: {
      userId,
      companyId,
      resourceType,
      resourceId,
    },
  });
}

export async function copyRolePermissions(
  fromRoleId: string,
  toRoleId: string,
  companyId: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  await verifyPermissionOrFail(
    session.user.id,
    companyId,
    "settings.roles.manage"
  );

  const sourcePermissions = await prisma.rolePermission.findMany({
    where: { roleId: fromRoleId },
  });

  const targetRole = await prisma.role.findUnique({
    where: { id: toRoleId },
  });

  if (!targetRole || targetRole.companyId !== companyId) {
    throw new ForbiddenError("Rol no encontrado en esta empresa");
  }

  await prisma.rolePermission.deleteMany({
    where: { roleId: toRoleId },
  });

  if (sourcePermissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: sourcePermissions.map((p) => ({
        roleId: toRoleId,
        permissionId: p.permissionId,
      })),
    });
  }

  revalidatePath("/settings/roles");
}

export async function getAllPermissions(companyId?: string) {
  return prisma.permission.findMany({
    where: {
      isActive: true,
      ...(companyId && {
        rolePermissions: {
          some: {
            role: { companyId },
          },
        },
      }),
    },
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });
}