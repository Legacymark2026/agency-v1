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
import { verifyPermissionOrFail, isSuperAdmin } from "@/lib/security";
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

export async function createRole(data: CreateRoleInput) {
  const { companyId } = await requireManageRoles();

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
  const { companyId } = await requireManageRoles();

  const existingRole = await fetchGateway(`/api/auth/roles/${roleId}/detail`);
  if (!existingRole || existingRole.companyId !== companyId) {
    throw new Error("Rol no encontrado");
  }

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
  const { companyId } = await requireManageRoles();

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