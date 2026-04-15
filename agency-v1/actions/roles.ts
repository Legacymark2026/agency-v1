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
import { verifyPermissionOrFail, isSuperAdmin } from "@/lib/security";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { CreateRoleInput, UpdateRoleInput, RoleWithPermissions } from "@/types/rbac";

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

  return prisma.role.findMany({
    where: { companyId, isActive: true },
    include: {
      permissions: {
        include: {
          permission: {
            select: { id: true, name: true, module: true, description: true },
          },
        },
      },
      _count: {
        select: { users: true },
      },
    },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
  }) as Promise<RoleWithPermissions[]>;
}

export async function getRoleById(roleId: string): Promise<RoleWithPermissions | null> {
  const { companyId } = await requireManageRoles();

const role = await prisma.role.findFirst({
      where: { id: roleId, companyId },
      include: {
        permissions: {
          include: {
            permission: {
              select: { id: true, name: true, module: true, description: true },
            },
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

  return role as RoleWithPermissions | null;
}

export async function createRole(data: CreateRoleInput) {
  const { userId, companyId } = await requireManageRoles();

  const existingRole = await prisma.role.findFirst({
    where: { companyId, name: data.name },
  });

  if (existingRole) {
    throw new Error("Ya existe un rol con este nombre en la empresa");
  }

  if (data.isDefault) {
    await prisma.role.updateMany({
      where: { companyId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const role = await prisma.role.create({
    data: {
      companyId,
      name: data.name,
      description: data.description,
      isDefault: data.isDefault ?? false,
      priority: data.priority ?? 0,
      permissions: {
        create: data.permissionIds.map((permissionId) => ({
          permissionId,
        })),
      },
    },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  revalidatePath("/settings/roles");
  return role;
}

export async function updateRole(roleId: string, data: UpdateRoleInput) {
  const { companyId } = await requireManageRoles();

  const existingRole = await prisma.role.findFirst({
    where: { id: roleId, companyId },
  });

  if (!existingRole) {
    throw new Error("Rol no encontrado");
  }

  if (data.isDefault && !existingRole.isDefault) {
    await prisma.role.updateMany({
      where: { companyId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.priority !== undefined) updateData.priority = data.priority;

  const role = await prisma.role.update({
    where: { id: roleId },
    data: updateData,
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  if (data.permissionIds !== undefined) {
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    if (data.permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: data.permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    }
  }

  revalidatePath("/settings/roles");
  return role;
}

export async function deleteRole(roleId: string) {
  const { companyId } = await requireManageRoles();

  const role = await prisma.role.findFirst({
    where: { id: roleId, companyId },
    include: { users: true },
  });

  if (!role) {
    throw new Error("Rol no encontrado");
  }

  if (role.users.length > 0) {
    throw new Error(
      `No se puede eliminar el rol porque tiene ${role.users.length} usuario(s) asignado(s). Primero reasigna los usuarios a otro rol.`
    );
  }

  await prisma.rolePermission.deleteMany({
    where: { roleId },
  });

  await prisma.role.delete({
    where: { id: roleId },
  });

  revalidatePath("/settings/roles");
  return { success: true };
}

export async function assignUserRole(userId: string, roleId: string | null) {
  const { companyId } = await requireManageRoles();

  const targetUser = await prisma.companyUser.findFirst({
    where: { userId, companyId },
  });

  if (!targetUser) {
    throw new Error("El usuario no pertenece a esta empresa");
  }

  if (roleId) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, companyId },
    });

    if (!role) {
      throw new Error("Rol no encontrado en esta empresa");
    }
  }

  await prisma.companyUser.update({
    where: { id: targetUser.id },
    data: { roleId },
  });

  revalidatePath("/settings/members");
  return { success: true };
}

export async function getCompanyUsersWithRoles() {
  const { companyId } = await requireManageRoles();

  return prisma.companyUser.findMany({
    where: { companyId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      role: {
        select: { id: true, name: true, priority: true },
      },
      team: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ joinedAt: "desc" }],
  });
}

export async function getAvailablePermissions() {
  const { companyId } = await requireManageRoles();

  return prisma.permission.findMany({
    where: { isActive: true },
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });
}

export async function getPermissionsGroupedByModule() {
  const { companyId } = await requireManageRoles();

  const permissions = await prisma.permission.findMany({
    where: { isActive: true },
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });

  const grouped = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  return Object.entries(grouped).map(([module, perms]) => ({
    module,
    permissions: perms,
  }));
}

export async function duplicateRole(sourceRoleId: string, newName: string) {
  const { companyId } = await requireManageRoles();

  const sourceRole = await prisma.role.findFirst({
    where: { id: sourceRoleId, companyId },
    include: { permissions: true },
  });

  if (!sourceRole) {
    throw new Error("Rol origen no encontrado");
  }

  const existing = await prisma.role.findFirst({
    where: { companyId, name: newName },
  });

  if (existing) {
    throw new Error("Ya existe un rol con ese nombre");
  }

  return prisma.role.create({
    data: {
      companyId,
      name: newName,
      description: sourceRole.description,
      priority: sourceRole.priority,
      permissions: {
        create: sourceRole.permissions.map((p) => ({
          permissionId: p.permissionId,
        })),
      },
    },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });
}

export async function setDefaultRole(roleId: string) {
  const { companyId } = await requireManageRoles();

  await prisma.role.updateMany({
    where: { companyId, isDefault: true },
    data: { isDefault: false },
  });

  const role = await prisma.role.update({
    where: { id: roleId },
    data: { isDefault: true },
  });

  revalidatePath("/settings/roles");
  return role;
}

export async function getRoleStats() {
  const { companyId } = await requireManageRoles();

  const [totalRoles, totalUsers, rolesWithUsers] = await Promise.all([
    prisma.role.count({ where: { companyId, isActive: true } }),
    prisma.companyUser.count({ where: { companyId } }),
    prisma.role.findMany({
      where: { companyId, isActive: true },
      include: {
        _count: { select: { users: true } },
      },
    }),
  ]);

  const usersWithRoles = rolesWithUsers.reduce(
    (sum, r) => sum + r._count.users,
    0
  );

  return {
    totalRoles,
    totalUsers,
    usersWithRoles,
    usersWithoutRole: totalUsers - usersWithRoles,
    roleDistribution: rolesWithUsers.map((r) => ({
      roleName: r.name,
      userCount: r._count.users,
    })),
  };
}