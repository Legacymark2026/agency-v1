"use server";

/**
 * lib/guard.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Enterprise Authorization Guards for Server Actions.
 *
 * Provides multiple layers of access control:
 *   1. requireAuth()           — Any authenticated user
 *   2. requireRole()           — Specific standard roles
 *   3. requirePermission()     — Specific permissions (from ROLE_PERMISSIONS matrix)
 *   4. requireCompanyPermission() — CompanyUser-level granular permissions
 *   5. requireModuleAccess()   — Module-level access via PERMISSION_ROUTE_MAP
 *   6. withRbac()              — Safe wrapper with standardized error responses
 *
 * USAGE:
 *   import { requireRole, requireCompanyPermission } from "@/lib/guard";
 *
 *   export async function deleteUser(userId: string) {
 *     await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
 *     // ... lógica segura
 *   }
 *
 *   export async function updateLead(leadId: string) {
 *     await requireCompanyPermission(["crm.edit"]);
 *     // ... lógica segura
 *   }
 */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, Permission, ROLE_PERMISSIONS } from "@/types/auth";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { PERMISSION_ROUTE_MAP } from "./rbac";

// ─── Context Type ─────────────────────────────────────────────────────────────

interface AuthContext {
    userId: string;
    role: UserRole;
    permissions: string[];
    companyId?: string;
}

// ─── Internal Session Resolver ────────────────────────────────────────────────

async function getSessionRole(): Promise<AuthContext> {
    const session = await auth();

    if (!session?.user?.id) {
        throw new UnauthorizedError();
    }

    const role = (session.user.role as UserRole) || UserRole.GUEST;
    const permissions = (session.user.permissions as string[]) || [];
    const companyId = session.user.companyId as string | undefined;
    return { userId: session.user.id, role, permissions, companyId };
}

// ─── Guards ───────────────────────────────────────────────────────────────────

/**
 * Verifica solo que el usuario está autenticado (cualquier rol).
 */
export async function requireAuth(): Promise<AuthContext> {
    return getSessionRole();
}

/**
 * Verifica que el usuario tiene al menos uno de los roles indicados.
 * Lanza ForbiddenError (403) si no tiene autorización.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthContext> {
    const ctx = await getSessionRole();

    if (!allowedRoles.includes(ctx.role)) {
        throw new ForbiddenError(
            `Se requiere uno de los siguientes roles: ${allowedRoles.join(", ")}. Tu rol actual es: ${ctx.role}`
        );
    }

    return ctx;
}

/**
 * Verifica que el usuario tiene todos los permisos indicados,
 * según la matriz ROLE_PERMISSIONS (roles estándar).
 */
export async function requirePermission(required: (Permission | string)[]): Promise<AuthContext> {
    const ctx = await getSessionRole();

    const rolePermissions = ROLE_PERMISSIONS[ctx.role] || [];

    const missingPermissions = required.filter(
        (p) => !ctx.permissions.includes(p as string) && !rolePermissions.includes(p as Permission)
    );

    if (missingPermissions.length > 0) {
        throw new ForbiddenError(
            `Permisos insuficientes. Faltan: ${missingPermissions.join(", ")}`
        );
    }

    return ctx;
}

/**
 * Verifica permisos a nivel de CompanyUser — para roles custom con permisos IAM.
 * Busca en CompanyUser.permissions (JSON array) y en Role.permissions (tabla M2M).
 *
 * Jerarquía de resolución:
 *   1. SuperAdmin → acceso total
 *   2. CompanyUser.permissions → permisos directos del usuario
 *   3. CompanyUser.role.permissions → permisos heredados del rol custom
 */
export async function requireCompanyPermission(
    requiredPerms: string[]
): Promise<AuthContext & { companyId: string }> {
    const ctx = await getSessionRole();

    if (!ctx.companyId) {
        throw new ForbiddenError("No tienes una empresa asignada");
    }

    // SuperAdmin bypasses all checks
    if (ctx.role === UserRole.SUPER_ADMIN || ctx.role === ("super_admin" as UserRole)) {
        return { ...ctx, companyId: ctx.companyId };
    }

    // Fetch CompanyUser with role permissions
    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: ctx.userId, companyId: ctx.companyId },
        include: {
            role: {
                include: {
                    permissions: {
                        include: { permission: { select: { name: true } } },
                    },
                },
            },
        },
    });

    if (!companyUser) {
        throw new ForbiddenError("No perteneces a esta empresa");
    }

    // Collect all user permissions from both sources
    const userPerms = new Set<string>();

    // Source 1: Direct permissions (CompanyUser.permissions JSON)
    const directPerms = (companyUser.permissions as string[]) || [];
    directPerms.forEach((p) => userPerms.add(p));

    // Source 2: Role-inherited permissions
    if (companyUser.role?.permissions) {
        companyUser.role.permissions.forEach((rp) => {
            userPerms.add(rp.permission.name);
        });
    }

    // Source 3: Session permissions (from JWT)
    ctx.permissions.forEach((p) => userPerms.add(p));

    // Check all required permissions are present
    const missing = requiredPerms.filter((p) => !userPerms.has(p));

    if (missing.length > 0) {
        throw new ForbiddenError(
            `Permisos insuficientes para esta operación. Faltan: ${missing.join(", ")}`
        );
    }

    return { ...ctx, companyId: ctx.companyId };
}

/**
 * Verifica acceso a un módulo completo basándose en PERMISSION_ROUTE_MAP.
 * Útil para verificar acceso a una sección antes de ejecutar lógica.
 *
 * @param module - El prefijo del módulo (ej: "crm", "treasury", "inbox")
 */
export async function requireModuleAccess(module: string): Promise<AuthContext> {
    const ctx = await getSessionRole();

    // SuperAdmin bypasses
    if (ctx.role === UserRole.SUPER_ADMIN) return ctx;

    // Find all permissions for this module
    const modulePerms = PERMISSION_ROUTE_MAP
        .filter((entry) => entry.perm.startsWith(module + "."))
        .map((entry) => entry.perm);

    if (modulePerms.length === 0) {
        // Module not in permission map — allow by default
        return ctx;
    }

    // User needs at least ONE permission from the module
    const hasAccess = modulePerms.some(
        (perm) => ctx.permissions.includes(perm)
    );

    if (!hasAccess) {
        // Check ROLE_PERMISSIONS fallback
        const rolePermissions = ROLE_PERMISSIONS[ctx.role] || [];
        const hasRoleAccess = modulePerms.some((perm) =>
            rolePermissions.includes(perm as Permission)
        );

        if (!hasRoleAccess) {
            throw new ForbiddenError(
                `No tienes acceso al módulo "${module}". Contacta al administrador.`
            );
        }
    }

    return ctx;
}

// ─── Safe Wrapper ─────────────────────────────────────────────────────────────

/**
 * Wrapper que convierte errores de autorización en respuestas estandarizadas.
 */
export async function withRbac<T>(
    allowedRoles: UserRole[],
    fn: (ctx: AuthContext) => Promise<T>
): Promise<T | { success: false; error: string; status: 401 | 403 }> {
    try {
        const ctx = await requireRole(allowedRoles);
        return await fn(ctx);
    } catch (err) {
        if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
            return { success: false, error: err.message, status: err.status as 401 | 403 };
        }
        throw err;
    }
}

/**
 * Wrapper para permisos de CompanyUser — mismo patrón que withRbac
 * pero usando permisos granulares.
 */
export async function withCompanyPermission<T>(
    requiredPerms: string[],
    fn: (ctx: AuthContext & { companyId: string }) => Promise<T>
): Promise<T | { success: false; error: string; status: 401 | 403 }> {
    try {
        const ctx = await requireCompanyPermission(requiredPerms);
        return await fn(ctx);
    } catch (err) {
        if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
            return { success: false, error: err.message, status: err.status as 401 | 403 };
        }
        throw err;
    }
}
