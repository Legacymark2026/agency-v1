"use server";
/**
 * actions/roles.ts
 * ─────────────────────────────────────────────────────────────
 * Server Actions para gestionar Roles personalizados por empresa.
 * 
 * Permite a los Admin de empresa crear y gestionar roles con
 * permisos granulares específicos para su organización.
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPermissionOrFail, isSuperAdmin, isCompanyAdmin, isCompanyOwner } from "@/lib/security";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { CreateRoleInput, UpdateRoleInput, RoleWithPermissions } from "@/types/rbac";
import { MASTER_PERMISSIONS } from "@/lib/rbac";

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

async function getSessionCompanyId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  
  const companyId = session.user.companyId as string;
  if (!companyId) {
    throw new Error("No tienes una empresa asignada");
  }
  
  return companyId;
}

async function requireManageRoles() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const userId = session.user.id;
  const companyId = await getSessionCompanyId();
  const isSA = await isSuperAdmin(userId);

  if (isSA) {
    return { userId, companyId, isSuperAdmin: true };
  }

  await verifyPermissionOrFail(userId, companyId, "settings.roles.manage");

  return { userId, companyId, isSuperAdmin: false };
}

export async function getCompanyRoles(): Promise<RoleWithPermissions[]> {
  const { companyId } = await requireManageRoles();
  return fetchGateway(`/api/auth/roles/full/${companyId}`);
}

export async function getRoleById(roleId: string): Promise<RoleWithPermissions | null> {
  const { companyId } = await requireManageRoles();
  const role = await fetchGateway(`/api/auth/roles/${roleId}/detail`);
  if (!role || role.companyId !== companyId) {
    return null;
  }
  return role as RoleWithPermissions;
}

const USER_MANAGE_PERM_NAMES = ["users.manage", "settings.users.manage", "iam.manage_users"];

/**
 * Valida la regla estricta SaaS:
 * 1. Solo el Administrador de la empresa puede delegar el permiso de creación de usuarios/contraseñas.
 * 2. Dicho permiso solo puede ser otorgado a un ÚNICO rol adicional en la empresa a la vez.
 */
async function validateSingleRoleUserManagement(
  userId: string,
  companyId: string,
  targetRoleId: string | null,
  permissionIds?: string[]
) {
  if (!permissionIds || permissionIds.length === 0) return;

  // Consultar permisos correspondientes a gestión de usuarios
  const matchingPerms = await prisma.permission.findMany({
    where: {
      name: { in: USER_MANAGE_PERM_NAMES },
      id: { in: permissionIds },
    },
  });

  if (matchingPerms.length === 0) return;

  // 1. Verificar si el usuario que ejecuta la acción es el Propietario del plan/empresa
  const isOwner = await isCompanyOwner(userId, companyId);
  if (!isOwner) {
    throw new ForbiddenError(
      "Solo el Propietario del plan (Owner de la empresa) tiene la facultad exclusiva de delegar la acción de gestión de usuarios y contraseñas a un rol personalizado."
    );
  }

  // 2. Verificar si ya existe otro rol en la empresa con permisos de gestión de usuarios
  const otherRolesWithPerm = await prisma.role.findMany({
    where: {
      companyId,
      ...(targetRoleId ? { id: { not: targetRoleId } } : {}),
      permissions: {
        some: {
          permission: {
            name: { in: USER_MANAGE_PERM_NAMES },
          },
        },
      },
    },
    select: { id: true, name: true },
  });

  if (otherRolesWithPerm.length > 0) {
    const existingNames = otherRolesWithPerm.map((r) => `"${r.name}"`).join(", ");
    throw new Error(
      `Solo se permite asignar la creación de usuarios y contraseñas a UN SOLO rol personalizado en la empresa. El rol ${existingNames} ya posee esta facultad delegada. Desasígnela de ese rol o use la acción de transferencia directa.`
    );
  }
}

export async function createRole(data: CreateRoleInput) {
  const { userId, companyId } = await requireManageRoles();

  await validateSingleRoleUserManagement(userId, companyId, null, data.permissionIds);

  const role = await fetchGateway(`/api/auth/roles`, {
    method: 'POST',
    body: JSON.stringify({
      companyId,
      name: data.name,
      description: data.description,
      isDefault: data.isDefault,
      priority: data.priority,
      permissionIds: data.permissionIds,
    }),
  });

  revalidatePath("/settings/roles");
  return role;
}

export async function updateRole(roleId: string, data: UpdateRoleInput) {
  const { userId, companyId } = await requireManageRoles();

  const existingRole = await fetchGateway(`/api/auth/roles/${roleId}/detail`);
  if (!existingRole || existingRole.companyId !== companyId) {
    throw new Error("Rol no encontrado");
  }

  await validateSingleRoleUserManagement(userId, companyId, roleId, data.permissionIds);

  const role = await fetchGateway(`/api/auth/roles/${roleId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      companyId,
      name: data.name,
      description: data.description,
      isDefault: data.isDefault,
      isActive: data.isActive,
      priority: data.priority,
      permissionIds: data.permissionIds,
    }),
  });

  revalidatePath("/settings/roles");
  return role;
}

export async function deleteRole(roleId: string) {
  const { companyId } = await requireManageRoles();

  const existingRole = await fetchGateway(`/api/auth/roles/${roleId}/detail`);
  if (!existingRole || existingRole.companyId !== companyId) {
    throw new Error("Rol no encontrado");
  }

  const result = await fetchGateway(`/api/auth/roles/${roleId}`, {
    method: 'DELETE',
  });

  revalidatePath("/settings/roles");
  return result;
}

export async function assignUserRole(userId: string, roleId: string | null) {
  const { userId: executorId, companyId } = await requireManageRoles();

  // Si se asigna un rol que confiere facultad de crear usuarios y contraseñas, solo el Administrador puede asignarlo
  if (roleId) {
    const targetRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    const hasUserMgmt = targetRole?.permissions.some((p) =>
      USER_MANAGE_PERM_NAMES.includes(p.permission.name)
    );

    if (hasUserMgmt) {
      const isAdmin = await isCompanyAdmin(executorId, companyId);
      if (!isAdmin) {
        throw new ForbiddenError(
          "Solo el Administrador de la empresa puede asignar un rol con facultades de creación de usuarios y contraseñas."
        );
      }
    }
  }

  const result = await fetchGateway(`/api/auth/assign-role`, {
    method: 'PATCH',
    body: JSON.stringify({ userId, companyId, roleId }),
  });

  revalidatePath("/settings/members");
  return result;
}

export async function getCompanyUsersWithRoles() {
  const { companyId } = await requireManageRoles();
  return fetchGateway(`/api/auth/users-with-roles/${companyId}`);
}

export async function getAvailablePermissions() {
  await requireManageRoles();
  return fetchGateway(`/api/auth/permissions`);
}

export async function getPermissionsGroupedByModule() {
  await requireManageRoles();
  const permissions = await getAvailablePermissions();
  const grouped = permissions.reduce((acc: any, perm: any) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {});

  return Object.entries(grouped).map(([module, perms]) => ({
    module,
    permissions: perms as any[],
  }));
}

export async function duplicateRole(sourceRoleId: string, newName: string) {
  const { companyId } = await requireManageRoles();

  const sourceRole = await fetchGateway(`/api/auth/roles/${sourceRoleId}/detail`);
  if (!sourceRole || sourceRole.companyId !== companyId) {
    throw new Error("Rol origen no encontrado");
  }

  const role = await fetchGateway(`/api/auth/roles`, {
    method: 'POST',
    body: JSON.stringify({
      companyId,
      name: newName,
      description: sourceRole.description,
      priority: sourceRole.priority,
      permissionIds: sourceRole.permissions.map((p: any) => p.permission.id),
    }),
  });

  return role;
}

export async function setDefaultRole(roleId: string) {
  const { companyId } = await requireManageRoles();

  const existingRole = await fetchGateway(`/api/auth/roles/${roleId}/detail`);
  if (!existingRole || existingRole.companyId !== companyId) {
    throw new Error("Rol no encontrado");
  }

  const role = await fetchGateway(`/api/auth/roles/${roleId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      isDefault: true,
    }),
  });

  revalidatePath("/settings/roles");
  return role;
}

export async function getRoleStats() {
  const { companyId } = await requireManageRoles();

  const [roles, users] = await Promise.all([
    getCompanyRoles(),
    getCompanyUsersWithRoles()
  ]);

  const totalRoles = roles.length;
  const totalUsers = users.length;
  const usersWithRoles = roles.reduce(
    (sum, r) => sum + (r._count?.users || 0),
    0
  );

  return {
    totalRoles,
    totalUsers,
    usersWithRoles,
    usersWithoutRole: Math.max(0, totalUsers - usersWithRoles),
    roleDistribution: roles.map((r) => ({
      roleName: r.name,
      userCount: r._count?.users || 0,
    })),
  };
}

export async function syncPermissionsWithPlatform() {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();

  const isSA = await isSuperAdmin(session.user.id);
  if (!isSA) throw new ForbiddenError("Solo Super Admin puede sincronizar permisos");

  const existing = await fetchGateway(`/api/auth/permissions`);
  const existingNames = new Set(existing.map((p: any) => p.name));

  const response = await fetchGateway(`/api/auth/permissions/sync`, {
    method: 'POST',
    body: JSON.stringify({ permissions: MASTER_PERMISSIONS }),
  });

  const newPerms = MASTER_PERMISSIONS.filter(p => !existingNames.has(p.name)).map(p => p.name);

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/settings");

  return {
    success: true,
    created: response.created,
    total: existingNames.size + response.created,
    newPermissions: newPerms,
    masterTotal: MASTER_PERMISSIONS.length,
  };
}

export async function getAvailablePermissionsByModule() {
  await getSessionCompanyId();

  const permissions = await fetchGateway(`/api/auth/permissions`);

  const grouped: Record<string, { id: string; name: string; description: string | null }[]> = {};

  for (const perm of permissions) {
    if (!grouped[perm.module]) grouped[perm.module] = [];
    grouped[perm.module].push({
      id: perm.id,
      name: perm.name,
      description: perm.description,
    });
  }

  return { success: true, modules: grouped, total: permissions.length };
}

/**
 * Consulta cuál rol personalizado tiene actualmente asignada la delegación de gestión de usuarios en la empresa,
 * y verifica si el usuario actual es el Propietario del plan (Owner).
 */
export async function getDelegatedUserManagementRole() {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();

  const companyId = await getSessionCompanyId();
  const userId = session.user.id;

  const isOwner = await isCompanyOwner(userId, companyId);

  // Buscar rol que tiene activo alguno de los permisos de gestión de usuarios
  const roleWithPerm = await prisma.role.findFirst({
    where: {
      companyId,
      permissions: {
        some: {
          permission: {
            name: { in: USER_MANAGE_PERM_NAMES },
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      priority: true,
      _count: { select: { users: true } },
    },
  });

  return {
    isOwner,
    delegatedRole: roleWithPerm,
  };
}

/**
 * Acción exclusiva para el Propietario del plan (Owner):
 * Asigna la delegación de gestión de usuarios a un rol personalizado específico
 * o revoca la delegación si roleId es null.
 */
export async function delegateUserManagementRole(targetRoleId: string | null) {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();

  const companyId = await getSessionCompanyId();
  const userId = session.user.id;

  const isOwner = await isCompanyOwner(userId, companyId);
  if (!isOwner) {
    throw new ForbiddenError(
      "Operación no autorizada: Solo el Propietario del plan puede delegar o revocar la gestión de usuarios."
    );
  }

  // 1. Obtener los IDs de permisos de gestión de usuarios
  const perms = await prisma.permission.findMany({
    where: { name: { in: USER_MANAGE_PERM_NAMES } },
    select: { id: true },
  });

  if (perms.length === 0) {
    throw new Error("Permisos de gestión de usuarios no configurados en la plataforma.");
  }

  const permIds = perms.map((p) => p.id);

  // 2. Transacción atómica:
  // - Remover los permisos de cualquier otro rol en la empresa
  // - Si targetRoleId está provisto, asignarlos al rol destino
  await prisma.$transaction(async (tx) => {
    // Buscar todos los roles de la empresa
    const companyRoles = await tx.role.findMany({
      where: { companyId },
      select: { id: true },
    });
    const companyRoleIds = companyRoles.map((r) => r.id);

    if (companyRoleIds.length > 0) {
      await tx.rolePermission.deleteMany({
        where: {
          roleId: { in: companyRoleIds },
          permissionId: { in: permIds },
        },
      });
    }

    if (targetRoleId) {
      // Validar que el rol pertenezca a la empresa
      const targetRole = await tx.role.findUnique({
        where: { id: targetRoleId },
      });

      if (!targetRole || targetRole.companyId !== companyId) {
        throw new Error("El rol seleccionado no pertenece a la empresa.");
      }

      await tx.rolePermission.createMany({
        data: permIds.map((pId) => ({
          roleId: targetRoleId,
          permissionId: pId,
        })),
        skipDuplicates: true,
      });
    }
  });

  revalidatePath("/settings/roles");
  revalidatePath("/settings/members");
  return { success: true };
}