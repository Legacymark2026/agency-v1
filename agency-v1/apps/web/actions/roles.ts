"use server";
/**
 * actions/roles.ts
 * ─────────────────────────────────────────────────────────────
 * Server Actions para gestionar Roles y Permisos (RBAC Multi-Tenant).
 * Conectado directamente a los motores de base de datos PostgreSQL y Auth Service.
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma, getPrismaAuth, getPrismaCore } from "@/lib/prisma";
import { verifyPermissionOrFail, isSuperAdmin, isCompanyAdmin, isCompanyOwner, canManageCompanyUsers } from "@/lib/security";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { CreateRoleInput, UpdateRoleInput, RoleWithPermissions } from "@/types/rbac";
import { MASTER_PERMISSIONS } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { generateTenantUserId } from "@/lib/tenant-user";

const USER_MANAGE_PERM_NAMES = ["users.manage", "settings.users.manage", "iam.manage_users"];

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

/**
 * Valida la regla estricta SaaS:
 * 1. Solo el Propietario (Owner) de la empresa puede delegar el permiso de creación de usuarios/contraseñas.
 * 2. Dicho permiso solo puede ser otorgado a un ÚNICO rol adicional en la empresa a la vez.
 */
async function validateSingleRoleUserManagement(
  userId: string,
  companyId: string,
  targetRoleId: string | null,
  permissionIds?: string[]
) {
  if (!permissionIds || permissionIds.length === 0) return;

  const matchingPerms = await prisma.permission.findMany({
    where: {
      name: { in: USER_MANAGE_PERM_NAMES },
      id: { in: permissionIds },
    },
  });

  if (matchingPerms.length === 0) return;

  const isOwner = await isCompanyOwner(userId, companyId);
  if (!isOwner) {
    throw new ForbiddenError(
      "Solo el Propietario del plan (Owner de la empresa) tiene la facultad exclusiva de delegar la acción de gestión de usuarios y contraseñas a un rol personalizado."
    );
  }

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

/** Obtiene los roles de la empresa directamente desde el motor de datos */
export async function getCompanyRoles(): Promise<RoleWithPermissions[]> {
  const { companyId } = await requireManageRoles();
  const roles = await prisma.role.findMany({
    where: { companyId },
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: {
        select: { users: true },
      },
    },
    orderBy: { priority: "desc" },
  });

  return roles as unknown as RoleWithPermissions[];
}

export async function getRoleById(roleId: string): Promise<RoleWithPermissions | null> {
  const { companyId } = await requireManageRoles();
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: {
        select: { users: true },
      },
    },
  });

  if (!role || role.companyId !== companyId) {
    return null;
  }
  return role as unknown as RoleWithPermissions;
}

/** Crea un nuevo rol en la base de datos */
export async function createRole(data: CreateRoleInput) {
  const { userId, companyId } = await requireManageRoles();

  await validateSingleRoleUserManagement(userId, companyId, null, data.permissionIds);

  const role = await prisma.role.create({
    data: {
      companyId,
      name: data.name,
      description: data.description || null,
      isDefault: data.isDefault || false,
      priority: data.priority ?? 50,
      permissions: {
        create: (data.permissionIds || []).map((permId) => ({
          permission: { connect: { id: permId } },
        })),
      },
    },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });

  revalidatePath("/settings/roles");
  return role;
}

/** Actualiza un rol existente */
export async function updateRole(roleId: string, data: UpdateRoleInput) {
  const { userId, companyId } = await requireManageRoles();

  const existingRole = await prisma.role.findUnique({ where: { id: roleId } });
  if (!existingRole || existingRole.companyId !== companyId) {
    throw new Error("Rol no encontrado");
  }

  await validateSingleRoleUserManagement(userId, companyId, roleId, data.permissionIds);

  // Si se envían permisos, sincronizamos limpiando e insertando
  if (data.permissionIds) {
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });
  }

  const role = await prisma.role.update({
    where: { id: roleId },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.permissionIds
        ? {
            permissions: {
              create: data.permissionIds.map((pId) => ({
                permission: { connect: { id: pId } },
              })),
            },
          }
        : {}),
    },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });

  revalidatePath("/settings/roles");
  return role;
}

/** Elimina un rol custom */
export async function deleteRole(roleId: string) {
  const { companyId } = await requireManageRoles();

  const existingRole = await prisma.role.findUnique({
    where: { id: roleId },
    include: { _count: { select: { users: true } } },
  });

  if (!existingRole || existingRole.companyId !== companyId) {
    throw new Error("Rol no encontrado");
  }

  if (existingRole._count.users > 0) {
    throw new Error("No es posible eliminar un rol que tiene usuarios asignados. Reasigna los usuarios primero.");
  }

  await prisma.rolePermission.deleteMany({ where: { roleId } });
  const result = await prisma.role.delete({ where: { id: roleId } });

  revalidatePath("/settings/roles");
  return result;
}

/** Asigna o reasigna un rol a un colaborador de la empresa */
export async function assignUserRole(userId: string, roleId: string | null) {
  const { userId: executorId, companyId } = await requireManageRoles();

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

  // Actualizar CompanyUser
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId, companyId },
  });

  if (!companyUser) {
    throw new Error("El colaborador no pertenece a esta empresa");
  }

  const roleRecord = roleId ? await prisma.role.findUnique({ where: { id: roleId } }) : null;

  const result = await prisma.companyUser.update({
    where: { id: companyUser.id },
    data: {
      roleId: roleId || null,
      roleName: roleRecord?.name || "member",
    },
  });

  revalidatePath("/settings/roles");
  revalidatePath("/settings/members");
  return result;
}

/**
 * Obtiene el directorio de usuarios de la empresa con sus roles y credenciales asignadas
 */
export async function getCompanyUsersWithRoles() {
  const { companyId } = await requireManageRoles();

  const companyUsers = await prisma.companyUser.findMany({
    where: { companyId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return companyUsers.map((cu) => ({
    id: cu.id,
    userId: cu.userId,
    tenantUserId: cu.tenantUserId,
    user: cu.user,
    role: cu.role,
    roleName: cu.roleName,
    joinedAt: cu.joinedAt,
  }));
}

/**
 * Obtiene el catálogo de permisos disponibles en el sistema agrupados por módulo
 */
export async function getPermissionsGroupedByModule() {
  await requireManageRoles();
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });

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

/**
 * CREACIÓN DE USUARIO CON CREDENCIALES & CONTRASEÑA DIRECTA
 * ────────────────────────────────────────────────────────
 * Implementa la facultad exclusiva de crear usuario y contraseña
 * verificando si el solicitante es Administrador/Owner o posee el rol delegado.
 */
export async function createCompanyUserWithCredentials(data: {
  name: string;
  email: string;
  password?: string;
  roleId?: string | null;
  adminVerificationPassword?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();

  const companyId = await getSessionCompanyId();
  const executorId = session.user.id;

  // 1. Verificación de permisos de seguridad estricta
  const hasPermission = await canManageCompanyUsers(executorId, companyId);
  if (!hasPermission) {
    throw new ForbiddenError(
      "Acceso denegado: Solo el Administrador de la empresa o el rol asignado para gestión de usuarios puede crear y configurar usuarios y contraseñas."
    );
  }

  // 1.1 Verificación obligatoria de identidad del administrador/operador que ejecuta la acción
  const authDb = getPrismaAuth();
  const coreDb = getPrismaCore();

  const executor = await authDb.user.findUnique({
    where: { id: executorId },
    select: { passwordHash: true, email: true },
  });

  if (executor?.passwordHash) {
    if (!data.adminVerificationPassword?.trim()) {
      throw new ForbiddenError(
        "Verificación de seguridad requerida: Debes ingresar tu contraseña de usuario actual para confirmar esta operación."
      );
    }
    const isPasswordValid = await bcrypt.compare(
      data.adminVerificationPassword.trim(),
      executor.passwordHash
    );
    if (!isPasswordValid) {
      throw new ForbiddenError(
        "Verificación de identidad fallida: Tu contraseña actual es incorrecta. Operación cancelada por seguridad."
      );
    }
  }

  const cleanEmail = data.email.trim().toLowerCase();
  if (!cleanEmail) throw new Error("El correo electrónico es requerido");

  // 2. Comprobar y sincronizar el usuario en Auth DB y Core DB
  let user = await authDb.user.findUnique({
    where: { email: cleanEmail },
  });

  const passwordPlain = data.password?.trim();
  const passwordHash = passwordPlain ? await bcrypt.hash(passwordPlain, 12) : null;

  const userData = {
    name: data.name.trim() || cleanEmail.split("@")[0],
    email: cleanEmail,
    ...(passwordHash ? { passwordHash } : {}),
    role: "user",
  };

  if (!user) {
    user = await authDb.user.create({
      data: userData,
    });
  } else if (passwordHash || data.name) {
    user = await authDb.user.update({
      where: { id: user.id },
      data: {
        ...(passwordHash ? { passwordHash } : {}),
        name: data.name.trim() || user.name,
      },
    });
  }

  // Replicar en Core DB para garantizar que tbl_company_users cumpla la Foreign Key tbl_company_users_user_id_fkey
  await coreDb.user.upsert({
    where: { email: cleanEmail },
    update: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...(passwordHash ? { passwordHash } : {}),
    },
    create: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...(passwordHash ? { passwordHash } : {}),
    },
  }).catch((err: any) => {
    console.warn("[Roles] Replicación de usuario a Core DB:", err.message);
  });

  // 3. Comprobar membresía en CompanyUser (Core DB)
  const existingMember = await prisma.companyUser.findFirst({
    where: { userId: user.id, companyId },
  });

  const targetRole = data.roleId ? await prisma.role.findUnique({ where: { id: data.roleId } }) : null;
  const roleName = targetRole?.name || "member";

  if (existingMember) {
    await prisma.companyUser.update({
      where: { id: existingMember.id },
      data: {
        roleId: data.roleId || null,
        roleName,
      },
    });
  } else {
    const tenantUserId = await generateTenantUserId(companyId);
    await prisma.companyUser.create({
      data: {
        userId: user.id,
        companyId,
        roleId: data.roleId || null,
        roleName,
        tenantUserId,
        invitedBy: executorId,
      },
    });
  }

  revalidatePath("/settings/roles");
  revalidatePath("/settings/members");
  return { success: true, user: { id: user.id, email: user.email, name: user.name } };
}

/**
 * RESET O ASIGNACIÓN DIRECTA DE CONTRASEÑA A UN USUARIO
 */
export async function setUserPassword(
  userId: string,
  newPassword: string,
  adminVerificationPassword?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();

  const companyId = await getSessionCompanyId();
  const executorId = session.user.id;

  const hasPermission = await canManageCompanyUsers(executorId, companyId);
  if (!hasPermission) {
    throw new ForbiddenError(
      "Solo el Administrador de la empresa o el rol delegado pueden cambiar contraseñas de usuarios."
    );
  }

  // Verificación obligatoria de identidad del administrador que cambia la contraseña
  const authDb = getPrismaAuth();
  const coreDb = getPrismaCore();

  const executor = await authDb.user.findUnique({
    where: { id: executorId },
    select: { passwordHash: true },
  });

  if (executor?.passwordHash) {
    if (!adminVerificationPassword?.trim()) {
      throw new ForbiddenError(
        "Verificación de seguridad requerida: Debes ingresar tu contraseña de administrador para autorizar el cambio de credenciales."
      );
    }
    const isPasswordValid = await bcrypt.compare(
      adminVerificationPassword.trim(),
      executor.passwordHash
    );
    if (!isPasswordValid) {
      throw new ForbiddenError(
        "Verificación de identidad fallida: Tu contraseña actual es incorrecta. Operación cancelada por seguridad."
      );
    }
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  // Verificar que el usuario pertenece a la empresa
  const membership = await prisma.companyUser.findFirst({
    where: { userId, companyId },
  });

  if (!membership) {
    throw new Error("El usuario no pertenece a la empresa actual.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await authDb.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await coreDb.user.update({
    where: { id: userId },
    data: { passwordHash },
  }).catch((err: any) => {
    console.warn("[Roles] Password sync to Core DB note:", err.message);
  });

  return { success: true };
}

/** Métricas de roles y distribución */
export async function getRoleStats() {
  const { companyId } = await requireManageRoles();

  const [roles, companyUsers] = await Promise.all([
    prisma.role.findMany({
      where: { companyId },
      include: { _count: { select: { users: true } } },
    }),
    prisma.companyUser.findMany({
      where: { companyId },
      select: { id: true, roleId: true },
    }),
  ]);

  const totalRoles = roles.length;
  const totalUsers = companyUsers.length;
  const usersWithRoles = companyUsers.filter((u) => u.roleId !== null).length;

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

/** Consulta de rol delegado exclusivo */
export async function getDelegatedUserManagementRole() {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();

  const companyId = await getSessionCompanyId();
  const userId = session.user.id;

  const isOwner = await isCompanyOwner(userId, companyId);

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

/** Acción exclusiva para delegar o revocar la facultad de crear usuarios y contraseñas */
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

  const perms = await prisma.permission.findMany({
    where: { name: { in: USER_MANAGE_PERM_NAMES } },
    select: { id: true },
  });

  if (perms.length === 0) {
    throw new Error("Permisos de gestión de usuarios no configurados en la plataforma.");
  }

  const permIds = perms.map((p) => p.id);

  const syncRolePermissions = async (client: any) => {
    const companyRoles = await client.role.findMany({
      where: { companyId },
      select: { id: true },
    });
    const companyRoleIds = companyRoles.map((r: any) => r.id);

    if (companyRoleIds.length > 0) {
      await client.rolePermission.deleteMany({
        where: {
          roleId: { in: companyRoleIds },
          permissionId: { in: permIds },
        },
      });
    }

    if (targetRoleId) {
      await client.rolePermission.createMany({
        data: permIds.map((pId) => ({
          roleId: targetRoleId,
          permissionId: pId,
        })),
        skipDuplicates: true,
      });
    }
  };

  const authClient = getPrismaAuth();
  const coreClient = getPrismaCore();

  await syncRolePermissions(authClient);
  await syncRolePermissions(coreClient).catch((err: any) => {
    console.warn("[Roles] Sync to Core DB note:", err.message);
  });

  revalidatePath("/settings/roles");
  revalidatePath("/settings/members");
  return { success: true };
}