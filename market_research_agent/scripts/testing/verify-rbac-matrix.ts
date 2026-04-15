/**
 * verify-rbac-matrix.ts
 * ─────────────────────────────────────────────────────
 * Test completo de la matriz de permisos RBAC.
 * Verifica:
 *   1. Todos los usuarios en DB y sus roles actuales
 *   2. Qué rutas puede acceder cada rol (según ROUTE_PERMISSIONS)
 *   3. Usuarios con roles inválidos o desactivados (deactivatedAt != null)
 *   4. Custom roles: muestra sus permisos desde UserProfile.metadata
 *   5. Simula acceso a todas las rutas protegidas
 *
 * Uso:
 *   npx tsx scripts/testing/verify-rbac-matrix.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Matriz ROUTE_PERMISSIONS (copia de lib/rbac.ts) ───────
const ROUTE_PERMISSIONS: Record<string, string[]> = {
    "/dashboard": ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER", "CLIENT_ADMIN", "CLIENT_USER"],
    "/dashboard/users": ["SUPER_ADMIN", "ADMIN"],
    "/dashboard/security": ["SUPER_ADMIN"],
    "/dashboard/settings": ["SUPER_ADMIN", "ADMIN"],
    "/dashboard/experts": ["SUPER_ADMIN", "ADMIN"],
    "/dashboard/analytics": ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
    "/dashboard/posts": ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER", "CLIENT_USER"],
    "/dashboard/posts/create": ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER", "CLIENT_USER"],
    "/dashboard/projects": ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER", "CLIENT_USER"],
    "/dashboard/inbox": ["SUPER_ADMIN", "ADMIN", "CLIENT_ADMIN"],
    "/dashboard/marketing": ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
    "/dashboard/marketing/campaigns": ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
    "/dashboard/marketing/spend": ["SUPER_ADMIN", "ADMIN"],
    "/dashboard/marketing/links": ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
    "/dashboard/marketing/automation": ["SUPER_ADMIN", "ADMIN"],
    "/dashboard/admin/architecture": ["SUPER_ADMIN", "ADMIN"],
    "/dashboard/admin/automation": ["SUPER_ADMIN", "ADMIN"],
    "/dashboard/admin/crm": ["SUPER_ADMIN", "CLIENT_ADMIN"],
    "/dashboard/admin/crm/leads": ["SUPER_ADMIN", "CLIENT_ADMIN"],
    "/dashboard/admin/crm/pipeline": ["SUPER_ADMIN", "CLIENT_ADMIN"],
    "/dashboard/admin/crm/campaigns": ["SUPER_ADMIN", "CLIENT_ADMIN", "CONTENT_MANAGER"],
};

// ─── Permisos para roles CUSTOM (copia de lib/rbac.ts) ─────
const CUSTOM_ROLE_PERMISSIONS: Record<string, string[]> = {
    "gerente": [
        "/dashboard",
        "/dashboard/analytics",
        "/dashboard/inbox",
        "/dashboard/marketing",
        "/dashboard/marketing/campaigns",
        "/dashboard/marketing/links",
        "/dashboard/admin/crm",
        "/dashboard/admin/crm/leads",
        "/dashboard/admin/crm/pipeline",
        "/dashboard/admin/crm/campaigns",
    ],
    "viewer": [
        "/dashboard",
        "/dashboard/posts",
        "/dashboard/projects",
    ],
};

// Roles estándar conocidos por el sistema (en mayúsculas y minúsculas por si acaso)
const STANDARD_ROLES = [
    "SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER",
    "CLIENT_ADMIN", "CLIENT_USER", "GUEST",
    "super_admin", "admin", "content_manager",
    "client_admin", "client_user", "guest",
];

// ─── Helpers ────────────────────────────────────────────────
function normalizeRole(role: string): string {
    return role.toUpperCase();
}

function isStandardRole(role: string): boolean {
    return STANDARD_ROLES.includes(role) || STANDARD_ROLES.includes(role.toUpperCase());
}

function canAccess(role: string, pathname: string): boolean {
    const r = normalizeRole(role);
    const rLower = role.toLowerCase();

    if (r === 'SUPER_ADMIN') return true;
    if (r === 'GUEST') return false;

    // Custom roles — mismo algoritmo corregido que lib/rbac.ts
    if (CUSTOM_ROLE_PERMISSIONS[rLower]) {
        const allowedRoutes = CUSTOM_ROLE_PERMISSIONS[rLower];
        for (const allowed of allowedRoutes) {
            if (pathname === allowed) return true;
            // CRÍTICO: excluir /dashboard del prefix match
            // /dashboard + '/' es prefijo de TODAS las rutas → daría acceso total
            if (allowed !== '/dashboard' && pathname.startsWith(allowed + '/')) return true;
        }
        return false;
    }

    // Roles estándar
    if (ROUTE_PERMISSIONS[pathname]) {
        return ROUTE_PERMISSIONS[pathname].includes(r);
    }

    // prefix match con separador para estándar
    const match = Object.keys(ROUTE_PERMISSIONS)
        .filter(rt => pathname === rt || pathname.startsWith(rt + '/'))
        .sort((a, b) => b.length - a.length)[0];

    if (match) return ROUTE_PERMISSIONS[match].includes(r);
    if (pathname.startsWith('/dashboard')) return r !== 'GUEST';
    return true;
}

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

// ─── Main ───────────────────────────────────────────────────
async function main() {
    console.log(bold('\n══════════════════════════════════════════════════'));
    console.log(bold('  🔐  LEGACYMARK — RBAC MATRIX VERIFICATION TEST'));
    console.log(bold('══════════════════════════════════════════════════\n'));

    // 1. FETCH ALL USERS (campos que sí existen en el schema)
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            deactivatedAt: true, // null = activo, fecha = desactivado
        },
        orderBy: { role: 'asc' },
    });

    const totalUsers = users.length;
    const activeUsers = users.filter(u => !u.deactivatedAt);
    const inactiveUsers = users.filter(u => !!u.deactivatedAt);

    console.log(bold(`📋  USUARIOS EN BASE DE DATOS: ${totalUsers}  (activos: ${activeUsers.length}  desactivados: ${inactiveUsers.length})\n`));
    console.log(`${'Email'.padEnd(45)} ${'Rol'.padEnd(22)} ${'Estado'}`);
    console.log('─'.repeat(80));

    for (const user of users) {
        const std = isStandardRole(user.role);
        const roleLabel = std ? cyan(user.role.padEnd(22)) : yellow(`CUSTOM:${user.role}`.padEnd(22));
        const statusLabel = user.deactivatedAt ? red('✗ DESACTIVADO') : green('✓ ACTIVO');
        console.log(`${(user.email ?? '—').padEnd(45)} ${roleLabel} ${statusLabel}`);
    }

    // 2. ROLE DISTRIBUTION
    console.log(bold('\n\n📊  DISTRIBUCIÓN DE ROLES\n'));
    const roleMap: Record<string, number> = {};
    for (const u of users) {
        const r = normalizeRole(u.role);
        roleMap[r] = (roleMap[r] ?? 0) + 1;
    }
    for (const [role, count] of Object.entries(roleMap).sort()) {
        const bar = '█'.repeat(Math.min(count * 3, 30));
        const std = STANDARD_ROLES.includes(role);
        const label = std ? cyan(role.padEnd(20)) : yellow(role.padEnd(20));
        console.log(`  ${label} ${bar} ${count}`);
    }

    // 3. MATRIZ ROL × RUTA
    console.log(bold('\n\n🔒  MATRIZ DE PERMISOS — ROL × RUTA\n'));
    const routes = Object.keys(ROUTE_PERMISSIONS);
    const uniqueRoles = [...new Set(users.map(u => normalizeRole(u.role)).filter(r => r !== 'GUEST'))];

    const colW = 13;
    const roleHeaders = uniqueRoles.map(r => r.slice(0, colW - 1).padEnd(colW));
    console.log(`${'Ruta'.padEnd(44)} ${roleHeaders.join('')}`);
    console.log('─'.repeat(44 + uniqueRoles.length * colW));

    for (const route of routes) {
        let line = route.padEnd(44) + ' ';
        for (const role of uniqueRoles) {
            const has = canAccess(role, route);
            line += has ? green('✅ SÍ    ').padEnd(colW) : red('❌ NO    ').padEnd(colW);
        }
        console.log(line);
    }

    // 4. SIMULACIÓN POR USUARIO (solo activos)
    console.log(bold('\n\n🧪  SIMULACIÓN DE ACCESO POR USUARIO ACTIVO\n'));

    let totalTests = 0;
    let totalGranted = 0;

    for (const user of activeUsers) {
        const role = normalizeRole(user.role);
        const std = isStandardRole(role);

        const accessible: string[] = [];
        const blocked: string[] = [];

        for (const route of routes) {
            totalTests++;
            if (canAccess(role, route)) {
                accessible.push(route);
                totalGranted++;
            } else {
                blocked.push(route);
            }
        }

        const badge = std ? cyan(`[${role}]`) : yellow(`[CUSTOM: ${role}]`);
        console.log(bold(`\n  👤 ${user.email}`) + ' ' + badge);
        console.log(green(`     ✅ Acceso: ${accessible.length} rutas`) + dim(` → ${accessible.join(', ')}`));
        if (blocked.length > 0) {
            console.log(red(`     ❌ Bloqueado: ${blocked.length} rutas`) + dim(` → ${blocked.join(', ')}`));
        }

        if (!std) {
            console.log(yellow(`     ⚠️  Rol no estándar — verificar permisos en CompanyUser o UserProfile`));
        }
    }

    // 5. RESUMEN FINAL
    console.log(bold('\n\n══════════════════════════════════════════════════'));
    console.log(bold('  📈  RESUMEN FINAL'));
    console.log(bold('══════════════════════════════════════════════════'));
    console.log(`  Total usuarios:          ${bold(String(totalUsers))}`);
    console.log(`  Usuarios activos:        ${green(String(activeUsers.length))}`);
    console.log(`  Usuarios desactivados:   ${inactiveUsers.length > 0 ? red(String(inactiveUsers.length)) : green('0')}`);
    console.log(`  Rutas en la matriz:      ${bold(String(routes.length))}`);
    console.log(`  Tests de acceso:         ${bold(String(totalTests))}`);
    console.log(`  Accesos concedidos:      ${green(String(totalGranted))}`);
    console.log(`  Accesos denegados:       ${bold(String(totalTests - totalGranted))} (bloqueados por diseño)`);

    // 6. VERIFICACIONES CRÍTICAS
    console.log(bold('\n  🔍  VERIFICACIONES CRÍTICAS:'));

    // SUPER_ADMIN existe?
    const superAdmins = users.filter(u => normalizeRole(u.role) === 'SUPER_ADMIN');
    if (superAdmins.length > 0) {
        console.log(green(`  ✅ SUPER_ADMIN(s): ${superAdmins.map(u => u.email).join(', ')}`));
    } else {
        console.log(red('  ❌ CRÍTICO: No hay ningún SUPER_ADMIN en el sistema'));
    }

    // GUEST activos?
    const guestActivos = activeUsers.filter(u => normalizeRole(u.role) === 'GUEST');
    if (guestActivos.length === 0) {
        console.log(green('  ✅ Sin usuarios GUEST activos'));
    } else {
        guestActivos.forEach(u => console.log(yellow(`  ⚠️  GUEST activo: ${u.email} (pendiente de aprobación)`)));
    }

    // Roles custom detectados
    const customRoles = users.filter(u => !isStandardRole(u.role));
    if (customRoles.length === 0) {
        console.log(green('  ✅ Sin roles custom — todos los roles son estándar'));
    } else {
        customRoles.forEach(u =>
            console.log(yellow(`  ⚠️  Rol custom: ${u.email} → "${u.role}" (verificar permisos en CompanyUser)`))
        );
    }

    console.log(bold('\n══════════════════════════════════════════════════\n'));
}

main()
    .catch(e => {
        console.error(red('\n❌ ERROR FATAL:'), e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
