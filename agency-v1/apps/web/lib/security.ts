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

export async function verifyPermission(
  userId: string,
  companyId: string,
  permission: string,
  options?: PermissionCheckOptions
): Promise<boolean> {
  try {
    const [resourcePerm, companyUser] = await Promise.all([
      options?.resourceType && options?.resourceId
        ? prisma.resourcePermission.findFirst({
            where: {
              userId,
              companyId,
              resourceType: options.resourceType,
              resourceId: options.resourceId,
              permission,
            },
          })
        : Promise.resolve(null),
      prisma.companyUser.findFirst({
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
      }),
    ]);

    if (resourcePerm !== null) {
      return resourcePerm.access;
    }

    const hasPermission = companyUser?.role?.permissions.some(
      (p) => p.permission.name === permission
    );

    return hasPermission || false;
  } catch (error) {
    console.error("[Security] Error verifying permission:", error);
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

export async function isCompanyAdmin(
  userId: string,
  companyId: string
): Promise<boolean> {
  try {
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId, companyId },
      include: { role: true },
    });

    return companyUser?.role?.priority === 100;
  } catch (error) {
    console.error("[Security] Error checking company admin:", error);
    return false;
  }
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === "super_admin";
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