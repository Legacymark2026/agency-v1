/**
 * lib/role-config.ts
 * ─────────────────────────────────────────────────────────────
 * Capa de acceso a datos para RoleConfig.
 * Lee los permisos de roles custom desde la BD con un cache
 * en memoria de 60 segundos para evitar queries en cada request.
 *
 * FLUJO:
 *   1. canAccessRoute() en rbac.ts llama getRoleAllowedRoutes(roleName)
 *   2. Esta función revisa el cache (TTL 60s)
 *   3. Si está fresco → devuelve del cache
 *   4. Si expiró → consulta la BD y actualiza el cache
 */

import { prisma } from "@/lib/prisma";

// ── Cache en memoria ──────────────────────────────────────────
interface CacheEntry {
    allowedRoutes: string[];
    fetchedAt: number;
}

const CACHE_TTL_MS = 60 * 1000; // 60 segundos
const roleCache = new Map<string, CacheEntry>();

/**
 * Obtiene las rutas permitidas para un rol custom.
 * Retorna null si el rol no tiene configuración en la BD.
 */
export async function getRoleAllowedRoutes(roleName: string): Promise<string[] | null> {
    const key = roleName.toLowerCase();
    const now = Date.now();

    // Verificar cache
    const cached = roleCache.get(key);
    if (cached && (now - cached.fetchedAt) < CACHE_TTL_MS) {
        return cached.allowedRoutes;
    }

    // Consultar BD
    try {
        const config = await prisma.roleConfig.findUnique({
            where: { roleName: key },
            select: { allowedRoutes: true, isActive: true },
        });

        if (!config || !config.isActive) {
            // Guardar null en cache también (para no golpear la BD en cada request)
            roleCache.set(key, { allowedRoutes: [], fetchedAt: now });
            return null;
        }

        const routes = (config.allowedRoutes as string[]) ?? [];
        roleCache.set(key, { allowedRoutes: routes, fetchedAt: now });
        return routes;

    } catch {
        // En caso de error de BD, retornar null (falla segura → acceso denegado)
        return null;
    }
}

/**
 * Verifica si un rol custom puede acceder a un pathname.
 * Síncrono — usa los datos del JWT (pasados en el token).
 */
export function canCustomRoleAccess(allowedRoutes: string[], pathname: string): boolean {
    for (const allowed of allowedRoutes) {
        // Exact match
        if (pathname === allowed) return true;
        // Prefix match — EXCLUIR /dashboard para evitar acceso total
        if (allowed !== '/dashboard' && pathname.startsWith(allowed + '/')) return true;
    }
    return false;
}

/**
 * Invalida el cache para un rol específico.
 * Llamar después de actualizar un RoleConfig en la BD.
 */
export function invalidateRoleCache(roleName: string): void {
    roleCache.delete(roleName.toLowerCase());
}

/**
 * Invalida todo el cache (por ejemplo, después de un deploy).
 */
export function invalidateAllRoleCache(): void {
    roleCache.clear();
}

/**
 * Obtiene todos los RoleConfigs (para la UI de gestión).
 */
export async function getAllRoleConfigs() {
    return prisma.roleConfig.findMany({
        orderBy: { roleName: 'asc' },
    });
}

/**
 * Lista de rutas del dashboard para la UI de gestión.
 * Re-exportado desde lib/rbac-routes.ts (sin Prisma — seguro para cliente).
 */
export { ALL_DASHBOARD_ROUTES } from "@/lib/rbac-routes";

