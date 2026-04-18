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
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ForbiddenError, UnauthorizedError } from "./errors";

export interface PermissionCheckOptions {
  resourceType?: string;
  resourceId?: string;
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

export async function hasAnyPermission(
  userId: string,
  companyId: string,
  permissions: string[]
): Promise<boolean> {
  for (const perm of permissions) {
    const has = await verifyPermission(userId, companyId, perm);
    if (has) return true;
  }
  return false;
}

export async function hasAllPermissions(
  userId: string,
  companyId: string,
  permissions: string[]
): Promise<boolean> {
  for (const perm of permissions) {
    const has = await verifyPermission(userId, companyId, perm);
    if (!has) return false;
  }
  return true;
}

export async function getUserPermissions(
  userId: string,
  companyId: string
): Promise<string[]> {
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

    return (
      companyUser?.role?.permissions.map((p) => p.permission.name) || []
    );
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