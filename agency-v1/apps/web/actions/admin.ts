"use server";

import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/auth";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PERMISSION_ROUTE_MAP } from "@/lib/rbac";
import { invalidateRoleCache } from "@/lib/role-config";
import { z } from "zod";

// Verifica acceso de admin y retorna la sesión
async function checkAdmin(): Promise<{ error: string } | null> {
    const session = await auth();
    const userRole = (session?.user as { role?: string })?.role;

    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
        return { error: "No autorizado. Se requiere rol de Administrador o SuperAdmin." };
    }
    return null;
}

export async function getUsers() {
    const authCheck = await checkAdmin();
    if (authCheck) return authCheck;

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                jobTitle: true,
                adminNotes: true,
                customTag: true,
                createdAt: true,
                deactivatedAt: true,
                mfaEnabled: true,
                emailVerified: true, // For visual check
                _count: {
                    select: { 
                        activityLogs: {
                            where: { action: { startsWith: "LOGIN" } }
                        }
                    }
                }
            }
        });
        return { users };
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return { error: "Failed to fetch users" };
    }
}

const UpdateUserMetaSchema = z.object({
    phone: z.string().optional().nullable(),
    jobTitle: z.string().optional().nullable(),
    adminNotes: z.string().optional().nullable(),
    customTag: z.string().optional().nullable()
});

export async function updateUserMeta(
    userId: string,
    data: { phone?: string; jobTitle?: string; adminNotes?: string; customTag?: string }
) {
    const authCheck = await checkAdmin();
    if (authCheck) return { success: false, error: authCheck.error };

    const parsed = UpdateUserMetaSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Datos de usuario inválidos." };
    }

    try {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: parsed.data,
        });
        revalidatePath("/dashboard/users");
        return { success: true, user: updated };
    } catch (error) {
        console.error("Failed to update user meta:", error);
        return { success: false, error: "Failed to update user notes" };
    }
}

export async function forcePasswordReset(userId: string) {
    const authCheck = await checkAdmin();
    if (authCheck) return { success: false, error: authCheck.error };

    try {
        await prisma.passwordResetToken.create({
            data: {
                token: `admin-forced-${Math.random().toString(36).substring(7)}`,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
                email: (await prisma.user.findUnique({ where: { id: userId } }))?.email || ""
            }
        });

        await prisma.userActivityLog.create({
            data: {
                userId,
                action: "ADMIN_FORCED_PASSWORD_RESET",
                ipAddress: "System",
                userAgent: "Admin Dashboard",
            }
        });

        return { success: true, message: "Enlace de reseteo enviado" };
    } catch (error) {
        console.error("Failed to force reset:", error);
        return { success: false, error: "Error forzando reseteo" };
    }
}

export async function revokeAllSessions(userId: string) {
    const authCheck = await checkAdmin();
    if (authCheck) return { success: false, error: authCheck.error };

    try {
        await prisma.session.deleteMany({
            where: { userId }
        });
        return { success: true, message: "Todas las sesiones revocadas" };
    } catch (error) {
        console.error("Failed to revoke sessions:", error);
        return { success: false, error: "Error revocando sesiones" };
    }
}


export async function toggleUserStatus(userId: string) {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const authCheck = await checkAdmin();
    if (authCheck) return { success: false, error: authCheck.error };

    if (currentUserId === userId) {
        return { success: false, error: "No puedes suspender tu propia cuenta." };
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { success: false, error: "Usuario no encontrado" };

        const newStatus = user.deactivatedAt ? null : new Date();

        await prisma.user.update({
            where: { id: userId },
            data: { deactivatedAt: newStatus },
        });

        revalidatePath("/dashboard/users");
        return { success: true, isDeactivated: !!newStatus };
    } catch (error) {
        console.error("Failed to toggle user status:", error);
        return { success: false, error: "Error al actualizar estado" };
    }
}

export async function deleteUser(userId: string) {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const authCheck = await checkAdmin();
    if (authCheck) return { success: false, error: authCheck.error };

    if (currentUserId === userId) {
        return { success: false, error: "No puedes eliminarte a ti mismo." };
    }

    try {
        await prisma.$transaction([
            // SET NULL en campos opcionales que referencian al usuario
            prisma.campaign.updateMany({ where: { approvedById: userId }, data: { approvedById: null } }),
            prisma.companyUser.updateMany({ where: { invitedBy: userId }, data: { invitedBy: null } }),
            prisma.conversation.updateMany({ where: { assignedTo: userId }, data: { assignedTo: null } }),
            // DELETE en registros cuya FK al usuario es NOT NULL (sin onDelete:Cascade)
            prisma.annotation.deleteMany({ where: { authorId: userId } }),
            prisma.event.deleteMany({ where: { organizerId: userId } }),
            // DELETE en registros propios del usuario
            prisma.userActivityLog.deleteMany({ where: { userId } }),
            prisma.readingListItem.deleteMany({ where: { userId } }),
            prisma.eventParticipant.deleteMany({ where: { userId } }),
            prisma.cRMActivity.deleteMany({ where: { userId } }),
            prisma.task.deleteMany({ where: { assignedTo: userId } }),
            prisma.task.deleteMany({ where: { createdBy: userId } }),
            prisma.deal.deleteMany({ where: { assignedTo: userId } }),
            prisma.marketingEvent.deleteMany({ where: { userId } }),
            prisma.post.deleteMany({ where: { authorId: userId } }),
            prisma.apiKey.deleteMany({ where: { userId } }),
            prisma.companyUser.deleteMany({ where: { userId } }),
            // Cascade automático (onDelete:Cascade en schema) pero incluimos para orden
            prisma.account.deleteMany({ where: { userId } }),
            prisma.session.deleteMany({ where: { userId } }),
            prisma.userProfile.deleteMany({ where: { userId } }),
            // Último: el registro del usuario
            prisma.user.delete({ where: { id: userId } }),
        ]);

        revalidatePath("/dashboard/users");
        revalidatePath("/dashboard", "layout");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        const msg = error instanceof Error ? error.message : "Error desconocido";
        return { success: false, error: `Error al eliminar usuario: ${msg}` };
    }
}

export async function bulkDeleteUsers(userIds: string[]) {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const authCheck = await checkAdmin();
    if (authCheck) return { success: false, error: authCheck.error };

    if (currentUserId && userIds.includes(currentUserId)) {
        return { success: false, error: "No puedes auto-eliminarte en una acción masiva." };
    }

    try {
        await prisma.$transaction([
            // SET NULL en campos opcionales que apuntan al usuario
            prisma.campaign.updateMany({ where: { approvedById: { in: userIds } }, data: { approvedById: null } }),
            prisma.companyUser.updateMany({ where: { invitedBy: { in: userIds } }, data: { invitedBy: null } }),
            prisma.conversation.updateMany({ where: { assignedTo: { in: userIds } }, data: { assignedTo: null } }),
            // DELETE registros con FK NOT NULL al usuario
            prisma.annotation.deleteMany({ where: { authorId: { in: userIds } } }),
            prisma.event.deleteMany({ where: { organizerId: { in: userIds } } }),
            // DELETE registros propios del usuario
            prisma.userActivityLog.deleteMany({ where: { userId: { in: userIds } } }),
            prisma.readingListItem.deleteMany({ where: { userId: { in: userIds } } }),
            prisma.eventParticipant.deleteMany({ where: { userId: { in: userIds } } }),
            prisma.cRMActivity.deleteMany({ where: { userId: { in: userIds } } }),
            prisma.task.deleteMany({ where: { assignedTo: { in: userIds } } }),
            prisma.task.deleteMany({ where: { createdBy: { in: userIds } } }),
            prisma.deal.deleteMany({ where: { assignedTo: { in: userIds } } }),
            prisma.marketingEvent.deleteMany({ where: { userId: { in: userIds } } }),
            prisma.post.deleteMany({ where: { authorId: { in: userIds } } }),
            prisma.apiKey.deleteMany({ where: { userId: { in: userIds } } }),
            prisma.companyUser.deleteMany({ where: { userId: { in: userIds } } }),
            prisma.account.deleteMany({ where: { userId: { in: userIds } } }),
            prisma.session.deleteMany({ where: { userId: { in: userIds } } }),
            prisma.userProfile.deleteMany({ where: { userId: { in: userIds } } }),
            prisma.user.deleteMany({ where: { id: { in: userIds } } }),
        ]);
        revalidatePath("/dashboard/users");
        revalidatePath("/dashboard", "layout");
        return { success: true, count: userIds.length };
    } catch (error) {
        console.error("Failed to bulk delete users:", error);
        return { success: false, error: "Error al eliminar múltiples usuarios" };
    }
}

export async function bulkToggleUsersStatus(userIds: string[], deactivate: boolean) {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const authCheck = await checkAdmin();
    if (authCheck) return { success: false, error: authCheck.error };

    const targetUserIds = userIds.filter(id => id !== currentUserId);

    if (targetUserIds.length === 0) {
        return { success: false, error: "Selección no válida o intentaste afectar tu propia cuenta." };
    }

    try {
        const res = await prisma.user.updateMany({
            where: { id: { in: targetUserIds } },
            data: { deactivatedAt: deactivate ? new Date() : null },
        });
        revalidatePath("/dashboard/users");
        return { success: true, count: res.count };
    } catch (error) {
        console.error("Failed to bulk toggle users:", error);
        return { success: false, error: "Error al actualizar múltiples usuarios" };
    }
}

export async function updateUserRole(
    userId: string,
    newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const authCheck = await checkAdmin();
    if (authCheck) return { success: false, error: authCheck.error };

    // Protección: un usuario no puede cambiarse su propio rol
    if (currentUserId === userId) {
        return { success: false, error: "No puedes cambiar tu propio rol." };
    }

    // Solo el SuperAdmin puede asignar el rol super_admin
    const callerRole = (session?.user as { role?: string })?.role;
    if (newRole === UserRole.SUPER_ADMIN && callerRole !== UserRole.SUPER_ADMIN) {
        return { success: false, error: "Solo el SuperAdmin puede asignar ese rol." };
    }

    try {
        // Obtenemos los custom roles para saber qué permisos asignarle ahora al usuario
        let companyUserCheck = await prisma.companyUser.findFirst({
            where: { userId }
        });

        // FIX PARA USUARIOS ANTIGUOS: Si el usuario no tiene relación con la compañía,
        // se la creamos usando la compañía del admin que está realizando el cambio.
        if (!companyUserCheck && currentUserId) {
            const adminCompanyUser = await prisma.companyUser.findFirst({
                where: { userId: currentUserId }
            });
            const fallbackCompanyId = adminCompanyUser?.companyId || (await prisma.company.findFirst())?.id;

            if (fallbackCompanyId) {
                companyUserCheck = await prisma.companyUser.create({
                    data: {
                        userId: userId,
                        companyId: fallbackCompanyId,
                        permissions: []
                    }
                });
            }
        }

        if (companyUserCheck) {
            const company = await prisma.company.findUnique({
                where: { id: companyUserCheck.companyId },
                select: { defaultCompanySettings: true }
            });
            const settings = (company?.defaultCompanySettings as any) || {};
            const rolesArray = settings.customRoles || [];

            const selectedCustomRole = rolesArray.find((r: any) => r.id === newRole);
            let newPermissions: string[] = [];

            if (selectedCustomRole) {
                newPermissions = selectedCustomRole.permissions || [];
            } else if (newRole === UserRole.SUPER_ADMIN || newRole === UserRole.ADMIN) {
                // If standard admin fallback
                newPermissions = ["admin.all"];
            }

            // Aplicar los permisos a la relación user-company
            await prisma.companyUser.updateMany({
                where: { userId, companyId: companyUserCheck.companyId },
                data: { permissions: newPermissions }
            });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });

        // ── Revocar sesiones activas del usuario ──────────────────────────────
        // Esto garantiza que el próximo request del usuario haga un nuevo sign-in
        // y el JWT callback DB-First lea el rol correcto desde la DB.
        await prisma.session.deleteMany({ where: { userId } });

        await prisma.userActivityLog.create({
            data: {
                userId: userId, // The user whose role was updated
                action: `ROLE_UPDATED_TO_${newRole.toUpperCase().replace(/\s+/g, "_")}`,
                ipAddress: "System", // Depending on where this is called, we don't have request IP readily in server actions unless passed
                userAgent: "Admin Dashboard",
            }
        });

        // ── Cache Invalidation ─────────────────────────────────────────
        // Revalidar el layout raíz del dashboard invalida el Server Component
        // del sidebar y el layout para TODOS los segmentos hijos.
        // Esto garantiza que el usuario afectado vea el nuevo rol en el
        // próximo request sin necesidad de cerrar sesión ("layout revalidation").
        revalidatePath("/dashboard", "layout");
        revalidatePath("/dashboard/users");
        revalidatePath("/dashboard/settings/members");
        return { success: true };
    } catch (error) {
        console.error("Failed to update user role:", error);
        return { success: false, error: "Error al actualizar el rol. Inténtalo de nuevo." };
    }
}

export async function getSecurityLogs({
    page = 1,
    limit = 20,
    search,
    type
}: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
} = {}) {
    const authCheck = await checkAdmin();
    if (authCheck) return authCheck;

    try {
        const skip = (page - 1) * limit;
        const where: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = {};

        if (search) {
            where.OR = [
                { user: { name: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
                { action: { contains: search, mode: "insensitive" } },
                { ipAddress: { contains: search, mode: "insensitive" } },
            ];
        }

        if (type && type !== "all") {
            if (type === "login") {
                where.action = { contains: "LOGIN", mode: "insensitive" };
            } else if (type === "error") {
                where.OR = [
                    { action: { contains: "ERROR", mode: "insensitive" } },
                    { action: { contains: "FAIL", mode: "insensitive" } }
                ];
            }
        }

        const [logs, total] = await Promise.all([
            prisma.userActivityLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    action: true,
                    ipAddress: true,
                    userAgent: true,
                    createdAt: true,
                    user: {
                        select: { name: true, email: true }
                    }
                },
                skip,
                take: limit
            }),
            prisma.userActivityLog.count({ where })
        ]);

        return {
            logs,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        };
    } catch (error) {
        console.error("Failed to fetch security logs:", error);
        return { error: "Failed to fetch logs" };
    }
}

export async function getSecurityStats() {
    const authCheck = await checkAdmin();
    if (authCheck) return { totalEvents: 0, failedLogins: 0, uniqueUsers: 0 };

    try {
        const [totalEvents, failedLogins, uniqueUsersGroup] = await Promise.all([
            prisma.userActivityLog.count(),
            prisma.userActivityLog.count({
                where: {
                    OR: [
                        { action: { contains: "ERROR", mode: "insensitive" } },
                        { action: { contains: "FAIL", mode: "insensitive" } }
                    ]
                }
            }),
            prisma.userActivityLog.groupBy({
                by: ['userId'],
            })
        ]);

        return {
            totalEvents,
            failedLogins,
            uniqueUsers: uniqueUsersGroup.length
        };
    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return { totalEvents: 0, failedLogins: 0, uniqueUsers: 0 };
    }
}

export async function getCustomRoles() {
    const authCheck = await checkAdmin();
    if (authCheck) return { success: false, error: authCheck.error, roles: [] };

    try {
        const session = await auth();
        // Obtener el companyId del admin actual
        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session?.user?.id }
        });

        if (!companyUser) return { success: false, error: "No company tied to user.", roles: [] };

        const company = await prisma.company.findUnique({
            where: { id: companyUser.companyId },
            select: { defaultCompanySettings: true }
        });

        const settings = (company?.defaultCompanySettings as any) || {};
        return { success: true, roles: settings.customRoles || [] };
    } catch (error) {
        console.error("Error fetching custom roles:", error);
        return { success: false, error: "Failed to fetch roles.", roles: [] };
    }
}

export async function saveCustomRoles(customRoles: any[]) {
    const authCheck = await checkAdmin();
    if (authCheck) return { success: false, error: authCheck.error };

    try {
        const session = await auth();
        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session?.user?.id }
        });

        if (!companyUser) return { success: false, error: "No company tied to user." };

        const company = await prisma.company.findUnique({
            where: { id: companyUser.companyId },
            select: { defaultCompanySettings: true }
        });

        const settings = (company?.defaultCompanySettings as any) || {};
        settings.customRoles = customRoles;

        await prisma.company.update({
            where: { id: companyUser.companyId },
            data: { defaultCompanySettings: settings }
        });

        // Cascading the updated permissions to all existing users that hold these custom roles
        const usersInCompany = await prisma.companyUser.findMany({
            where: { companyId: companyUser.companyId },
            include: { user: { select: { role: true } } }
        });

        for (const cu of usersInCompany) {
            const matchedCustomRole = customRoles.find(r => r.id === cu.user.role);
            if (matchedCustomRole) {
                await prisma.companyUser.update({
                    where: { id: cu.id },
                    data: { permissions: matchedCustomRole.permissions || [] }
                });
            }
        }

        // ── UNIFICACIÓN: Sincronizar con RoleConfig (rutas) ──
        for (const role of customRoles) {
            const roleId = role.id.toLowerCase();
            const perms = (role.permissions || []) as string[];
            const allowedRoutes = new Set<string>();

            // Convertir permisos granulares a rutas usando el mapa unificado
            if (perms.length > 0) allowedRoutes.add("/dashboard");
            for (const mapItem of PERMISSION_ROUTE_MAP) {
                if (perms.includes(mapItem.perm)) {
                    mapItem.routes.forEach(r => allowedRoutes.add(r));
                }
            }

            // Sync con la tabla que usa NextAuth JWT
            await prisma.roleConfig.upsert({
                where: { roleName: roleId },
                update: { allowedRoutes: Array.from(allowedRoutes), isActive: true },
                create: { roleName: roleId, allowedRoutes: Array.from(allowedRoutes), isActive: true, description: role.name },
            });
            invalidateRoleCache(roleId);
        }

        revalidatePath("/dashboard", "layout");
        revalidatePath("/dashboard/settings/members");
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        console.error("Error saving custom roles:", error);
        return { success: false, error: "Failed to save custom roles." };
    }
}

export async function getUserAuditLogs(userId: string) {
    const authCheck = await checkAdmin();
    if (authCheck) return { success: false, error: authCheck.error, logs: [] };

    try {
        const logs = await prisma.userActivityLog.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 5
        });

        return {
            success: true,
            logs: logs.map(log => ({
                id: log.id,
                action: log.action,
                ipAddress: log.ipAddress || "Unknown",
                userAgent: log.userAgent || "Unknown",
                createdAt: log.createdAt.toISOString()
            }))
        };
    } catch (error) {
        console.error("Error fetching user audit logs:", error);
        return { success: false, error: "Failed to fetch logs.", logs: [] };
    }
}


