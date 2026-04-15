"use server";

/**
 * lib/guard.ts
 * ─────────────────────────────────────────────────────
 * Guards de autorización para Server Actions.
 *
 * USO:
 *   import { requireRole, requirePermission } from "@/lib/guard";
 *
 *   export async function deleteUser(userId: string) {
 *     await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
 *     // ... resto de la lógica
 *   }
 */
import { auth } from "@/lib/auth";
import { UserRole, Permission, ROLE_PERMISSIONS } from "@/types/auth";

// ── Errores tipados ────────────────────────────────────────

export class UnauthorizedError extends Error {
    status = 401;
    constructor() {
        super("No autenticado. Por favor inicia sesión.");
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends Error {
    status = 403;
    constructor(message = "Acceso denegado. No tienes permisos para esta acción.") {
        super(message);
        this.name = "ForbiddenError";
    }
}

// ── Helper interno ─────────────────────────────────────────

async function getSessionRole(): Promise<{ userId: string; role: UserRole; permissions: string[] }> {
    const session = await auth();

    if (!session?.user?.id) {
        throw new UnauthorizedError();
    }

    const role = (session.user.role as UserRole) || UserRole.GUEST;
    const permissions = (session.user.permissions as string[]) || [];
    return { userId: session.user.id, role, permissions };
}

// ── Guards públicos ────────────────────────────────────────

/**
 * Verifica que el usuario tiene al menos uno de los roles indicados.
 * Lanza ForbiddenError (403) si no tiene autorización.
 *
 * @example
 *   await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<{ userId: string; role: UserRole; permissions: string[] }> {
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
 * según la matriz ROLE_PERMISSIONS.
 *
 * @example
 *   await requirePermission([Permission.MANAGE_USERS]);
 */
export async function requirePermission(required: (Permission | string)[]): Promise<{ userId: string; role: UserRole; permissions: string[] }> {
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
 * Verifica solo que el usuario está autenticado (cualquier rol).
 * Útil para server actions que no requieren un rol específico.
 */
export async function requireAuth(): Promise<{ userId: string; role: UserRole; permissions: string[] }> {
    return getSessionRole();
}

/**
 * Wrapper que convierte errores de autorización en respuestas estandarizadas
 * para usarse con try/catch en server actions que devuelven objetos.
 *
 * @example
 *   return withRbac(
 *     [UserRole.ADMIN],
 *     async ({ userId }) => {
 *       // lógica segura
 *       return { success: true };
 *     }
 *   );
 */
export async function withRbac<T>(
    allowedRoles: UserRole[],
    fn: (ctx: { userId: string; role: UserRole; permissions: string[] }) => Promise<T>
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
