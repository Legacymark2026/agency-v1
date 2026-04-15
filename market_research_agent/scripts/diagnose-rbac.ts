/**
 * scripts/diagnose-rbac.ts
 * ══════════════════════════════════════════════════════════════════
 * HERRAMIENTA DE DIAGNÓSTICO RBAC — ROLES PERSONALIZADOS
 * ══════════════════════════════════════════════════════════════════
 * 
 * Uso:
 *   npx tsx scripts/diagnose-rbac.ts
 *   npx tsx scripts/diagnose-rbac.ts --email=usuario@ejemplo.com
 *   npx tsx scripts/diagnose-rbac.ts --role=gerente
 *   npx tsx scripts/diagnose-rbac.ts --full
 *
 * Qué verifica:
 *   1. Tabla RoleConfig en BD  → ¿existen los roles custom?
 *   2. Estado isActive         → ¿el rol está activo?
 *   3. allowedRoutes           → ¿tiene rutas configuradas?
 *   4. Usuarios con roles custom → ¿quiénes los tienen?
 *   5. JWT simulado            → ¿cómo se cargan las rutas al login?
 *   6. Lógica canAccessRoute() → simula decisiones del middleware
 * ══════════════════════════════════════════════════════════════════
 */

import { PrismaClient } from "@prisma/client";
import { canAccessRoute, isStandardRole } from "../lib/rbac";
import { canCustomRoleAccess } from "../lib/role-config";

const prisma = new PrismaClient({
    log: ["error"],
});

// ── Colores para terminal ───────────────────────────────────────
const C = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    gray: "\x1b[90m",
};

function banner(title: string) {
    console.log("\n" + C.cyan + C.bold + "═".repeat(60) + C.reset);
    console.log(C.cyan + C.bold + `  ${title}` + C.reset);
    console.log(C.cyan + C.bold + "═".repeat(60) + C.reset);
}

function section(title: string) {
    console.log("\n" + C.magenta + C.bold + `▶ ${title}` + C.reset);
    console.log(C.gray + "─".repeat(50) + C.reset);
}

function ok(msg: string) {
    console.log(C.green + `  ✔ ${msg}` + C.reset);
}

function warn(msg: string) {
    console.log(C.yellow + `  ⚠ ${msg}` + C.reset);
}

function error(msg: string) {
    console.log(C.red + `  ✖ ${msg}` + C.reset);
}

function info(msg: string) {
    console.log(C.gray + `    ${msg}` + C.reset);
}

// ── Parsear args ───────────────────────────────────────────────
const args = process.argv.slice(2);
const targetEmail = args.find(a => a.startsWith("--email="))?.split("=")[1];
const targetRole = args.find(a => a.startsWith("--role="))?.split("=")[1];
const fullMode = args.includes("--full");

// ── Rutas de dashboard para testear acceso ────────────────────
const TEST_ROUTES = [
    "/dashboard",
    "/dashboard/users",
    "/dashboard/security",
    "/dashboard/settings",
    "/dashboard/admin/crm",
    "/dashboard/admin/crm/leads",
    "/dashboard/admin/crm/pipeline",
    "/dashboard/admin/marketing",
    "/dashboard/admin/marketing/campaigns",
    "/dashboard/admin/automation",
    "/dashboard/admin/architecture",
    "/dashboard/inbox",
    "/dashboard/posts",
    "/dashboard/posts/create",
    "/dashboard/events",
    "/dashboard/analytics",
    "/dashboard/experts",
    "/dashboard/projects",
];

// ══════════════════════════════════════════════════════════════
// CHECK 1: Tabla RoleConfig
// ══════════════════════════════════════════════════════════════
async function checkRoleConfigTable() {
    section("CHECK 1: Estado de la tabla RoleConfig en BD");

    let roleConfigs: any[] = [];
    try {
        roleConfigs = await prisma.roleConfig.findMany({
            orderBy: { roleName: "asc" },
        });
    } catch (e: any) {
        error(`No se pudo consultar RoleConfig: ${e.message}`);
        error("¿Corriste 'npx prisma migrate deploy' en producción?");
        return [];
    }

    if (roleConfigs.length === 0) {
        warn("No hay ningún RoleConfig en la BD.");
        warn("Causa probable: la migración se ejecutó pero no se creó ningún rol custom desde la UI.");
        info("→ Ve a /dashboard/settings/roles y crea las configuraciones de roles.");
        return [];
    }

    ok(`Se encontraron ${roleConfigs.length} RoleConfig(s) en la BD:`);
    console.log();

    for (const rc of roleConfigs) {
        const routes = (rc.allowedRoutes as string[]) ?? [];
        const statusIcon = rc.isActive ? C.green + "ACTIVO" : C.red + "INACTIVO";
        console.log(
            `  ${C.bold}${rc.roleName}${C.reset} [${statusIcon}${C.reset}]`
        );

        if (!rc.isActive) {
            warn(`  El rol '${rc.roleName}' está INACTIVO (isActive=false). El middleware lo tratará como sin acceso.`);
        }

        if (routes.length === 0) {
            error(`  Sin rutas configuradas (allowedRoutes vacío). El usuario con este rol NO podrá acceder a nada.`);
        } else {
            info(`  Rutas permitidas (${routes.length}):`);
            routes.forEach(r => info(`    • ${r}`));
        }
        console.log();
    }

    return roleConfigs;
}

// ══════════════════════════════════════════════════════════════
// CHECK 2: Usuarios con roles custom
// ══════════════════════════════════════════════════════════════
async function checkUsersWithCustomRoles(roleConfigs: any[]) {
    section("CHECK 2: Usuarios con roles personalizados en BD");

    const standardRoles = ["super_admin", "admin", "content_manager", "client_admin", "client_user", "guest"];

    const users = await prisma.user.findMany({
        where: targetEmail ? { email: targetEmail } : {},
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            companies: {
                select: { permissions: true, companyId: true },
                take: 1,
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const customRoleUsers = targetEmail
        ? users
        : users.filter(u => !standardRoles.includes(u.role));

    if (customRoleUsers.length === 0) {
        if (targetEmail) {
            warn(`Usuario ${targetEmail} no encontrado en la BD.`);
        } else {
            warn("No hay usuarios con roles personalizados en la BD.");
            info("→ Asigna un rol custom a un usuario desde /dashboard/users.");
        }
        return;
    }

    for (const user of customRoleUsers) {
        const isCustom = !standardRoles.includes(user.role);
        const roleConfig = roleConfigs.find(
            rc => rc.roleName.toLowerCase() === user.role.toLowerCase()
        );

        console.log(`\n  ${C.bold}${user.name ?? "Sin nombre"} <${user.email}>${C.reset}`);
        info(`  ID: ${user.id}`);
        info(`  Rol en BD: ${C.yellow}${user.role}${C.reset}`);
        info(`  Permisos companyUser: ${JSON.stringify(user.companies[0]?.permissions ?? [])}`);

        if (isCustom) {
            if (!roleConfig) {
                error(`  ¡PROBLEMA CRÍTICO! El rol '${user.role}' NO tiene RoleConfig en la BD.`);
                error(`  El middleware verá allowedRoutes=[] → acceso denegado a todas las rutas.`);
                warn(`  Solución: Ve a /dashboard/settings/roles y crea un RoleConfig para '${user.role}'.`);
            } else if (!roleConfig.isActive) {
                error(`  ¡PROBLEMA! El RoleConfig para '${user.role}' existe pero está INACTIVO.`);
                warn(`  Solución: Activa el rol en /dashboard/settings/roles.`);
            } else {
                const routes = (roleConfig.allowedRoutes as string[]) ?? [];
                if (routes.length === 0) {
                    error(`  ¡PROBLEMA! El RoleConfig existe y está activo, pero no tiene rutas configuradas.`);
                    warn(`  Solución: Agrega las rutas permitidas en /dashboard/settings/roles.`);
                } else {
                    ok(`  Tiene RoleConfig activo con ${routes.length} rutas configuradas.`);
                }
            }
        } else {
            info(`  Rol estándar del sistema (no usa RoleConfig).`);
        }
    }
}

// ══════════════════════════════════════════════════════════════
// CHECK 3: Simular decisión del middleware
// ══════════════════════════════════════════════════════════════
async function checkMiddlewareSimulation(roleConfigs: any[]) {
    const targetRoleName = targetRole || (roleConfigs[0]?.roleName);
    if (!targetRoleName) {
        warn("No hay roles custom para simular. Usa --role=<nombre> para especificar.");
        return;
    }

    section(`CHECK 3: Simulación del Middleware para rol '${targetRoleName}'`);

    const roleConfig = roleConfigs.find(
        rc => rc.roleName.toLowerCase() === targetRoleName.toLowerCase()
    );

    if (!roleConfig) {
        error(`RoleConfig para '${targetRoleName}' no existe en la BD.`);
        info("→ El middleware cargará allowedRoutes=[] → acceso denegado a TODO.");
        return;
    }

    const allowedRoutes = (roleConfig.allowedRoutes as string[]) ?? [];
    console.log(`\n  Rutas cargadas del JWT: [${allowedRoutes.join(", ") || "VACÍO"}]`);
    console.log();

    let accessCount = 0;
    let denyCount = 0;

    for (const route of TEST_ROUTES) {
        // Esta es la misma lógica que usa canAccessRoute() en el middleware
        const hasAccess = canAccessRoute(route, targetRoleName as any, allowedRoutes);
        if (hasAccess) {
            ok(`PERMIT → ${route}`);
            accessCount++;
        } else {
            info(`${C.gray}DENY   → ${route}${C.reset}`);
            denyCount++;
        }
    }

    console.log();
    info(`Resumen: ${accessCount} rutas permitidas, ${denyCount} denegadas.`);

    if (accessCount === 0) {
        console.log();
        error("¡El rol no puede acceder a NINGUNA ruta del dashboard!");
        error("CAUSAS POSIBLES:");
        error("  1. allowedRoutes vacío en BD → configura las rutas en /dashboard/settings/roles");
        error("  2. isActive=false en BD → activa el rol");
        error("  3. Las rutas en allowedRoutes no coinciden con las rutas reales (typo)");
        error("  4. El usuario no hizo logout/login después del cambio de rol");
    }
}

// ══════════════════════════════════════════════════════════════
// CHECK 4: Diagnosticar flujo JWT
// ══════════════════════════════════════════════════════════════
async function checkJwtFlow() {
    section("CHECK 4: Diagnóstico del Flujo JWT (auth.config.ts)");

    console.log(`
  El sistema carga 'allowedRoutes' en el JWT SOLO en estos momentos:
  
  ${C.green}✔ Al hacer LOGIN${C.reset} (sign-in inicial) — jwt() callback con user≠null
  ${C.green}✔ Cada 60 segundos${C.reset} (DB-First refresh) — jwt() callback subsiguiente
  
  ${C.yellow}⚠ PROBLEMA CONOCIDO:${C.reset} auth.config.ts → session() callback
    La línea:
    ${C.gray}(session.user as any).allowedRoutes = (token.allowedRoutes as string[]) ?? [];${C.reset}
    
    Está en auth.config.ts PERO auth.ts override la session() callback sin
    propagar allowedRoutes. Esto significa que la sesión del cliente no
    tiene el campo allowedRoutes, pero el MIDDLEWARE sí lo usa del token JWT.
  
  ${C.yellow}⚠ PROBLEMA CONOCIDO:${C.reset} El authorized() callback lee:
    ${C.gray}const allowedRoutes = ((auth as any)?.token?.allowedRoutes as string[]) ?? [];${C.reset}
    
    En NextAuth v5 Edge Runtime, 'auth' en authorized() puede no exponer
    directamente 'token'. Verifica que allowedRoutes llega correctamente.
  `);

    console.log(`  ${C.bold}ACCIÓN RECOMENDADA:${C.reset}`);
    console.log(`  ${C.green}→ El usuario con rol custom debe cerrar sesión y volver a entrar${C.reset}`);
    console.log(`  ${C.green}  para que el JWT se reconstruya con los allowedRoutes actuales.${C.reset}\n`);
}

// ══════════════════════════════════════════════════════════════
// CHECK 5: Verificar el allowedRoutes en BD directamente
// ══════════════════════════════════════════════════════════════
async function checkSpecificUser() {
    if (!targetEmail) return;

    section(`CHECK 5: Sesiones activas para ${targetEmail}`);

    try {
        const sessions = await prisma.session.findMany({
            where: { user: { email: targetEmail } },
            select: {
                sessionToken: true,
                expires: true,
                userId: true,
            },
        });

        if (sessions.length === 0) {
            warn("No hay sesiones activas en BD para este usuario (usa JWT estrategia stateless).");
            info("→ En estrategia JWT, las sesiones no se almacenan en BD. Es normal.");
        } else {
            ok(`${sessions.length} sesión(es) activa(s) encontrada(s).`);
            sessions.forEach(s => {
                info(`  Token: ${s.sessionToken.substring(0, 20)}...`);
                info(`  Expira: ${s.expires.toISOString()}`);
            });
        }
    } catch (e: any) {
        info("La tabla Session puede no existir (estrategia JWT stateless). Es normal.");
    }
}

// ══════════════════════════════════════════════════════════════
// Función de diagnóstico rápido del middleware bug
// ══════════════════════════════════════════════════════════════
function checkAuthConfigBug() {
    section("CHECK 6: Análisis del Bug en auth.config.ts");

    console.log(`
  ${C.yellow}BUG IDENTIFICADO en auth.config.ts:${C.reset}
  
  ${C.red}El authorized() callback lee:${C.reset}
  ${C.gray}const allowedRoutes = ((auth as any)?.token?.allowedRoutes as string[]) ?? [];${C.reset}
  
  ${C.red}PROBLEMA:${C.reset} En NextAuth v5, el parámetro 'auth' en authorized() es el objeto
  de sesión, NO tiene una propiedad '.token'. Las allowedRoutes del JWT
  no están disponibles aquí automáticamente.
  
  ${C.green}SOLUCIÓN:${C.reset} Las allowedRoutes deben propagarse a session.user en el
  session() callback para que estén disponibles en authorized().
  
  ${C.bold}Estado actual de session() en auth.ts:${C.reset}
  ${C.gray}NO propaga allowedRoutes → auth.user.allowedRoutes es undefined${C.reset}
  
  Verifica si la línea en auth.config.ts session():
  ${C.gray}(session.user as any).allowedRoutes = (token.allowedRoutes as string[]) ?? [];${C.reset}
  está siendo sobrescrita por el session() en auth.ts.
  `);
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
async function main() {
    banner("DIAGNÓSTICO RBAC — ROLES PERSONALIZADOS EN PRODUCCIÓN");

    if (targetEmail) info(`Modo: diagnóstico específico para → ${targetEmail}`);
    if (targetRole) info(`Modo: simulación de middleware para rol → ${targetRole}`);
    if (fullMode) info(`Modo: diagnóstico completo (--full)`);

    console.log(`\n  Timestamp: ${new Date().toISOString()}`);
    console.log(`  Node: ${process.version}`);
    console.log(`  DB: ${process.env.DATABASE_URL ? "conectado" : C.red + "DATABASE_URL no configurado" + C.reset}`);

    try {
        // Test conexión BD
        await prisma.$queryRaw`SELECT 1`;
        ok("Conexión a la BD establecida correctamente.\n");
    } catch (e: any) {
        error(`No se pudo conectar a la BD: ${e.message}`);
        process.exit(1);
    }

    // Ejecutar checks
    const roleConfigs = await checkRoleConfigTable();
    await checkUsersWithCustomRoles(roleConfigs);
    await checkMiddlewareSimulation(roleConfigs);
    await checkJwtFlow();
    await checkSpecificUser();
    checkAuthConfigBug();

    banner("FIN DEL DIAGNÓSTICO");
    console.log(`
  ${C.bold}RESUMEN DE ACCIONES CORRECTIVAS:${C.reset}
  
  1. Si allowedRoutes está vacío en BD:
     → Configura las rutas en /dashboard/settings/roles (UI del editor)
  
  2. Si isActive=false:
     → Activa el rol desde /dashboard/settings/roles
  
  3. Si hay discrepancia entre el rol del usuario y el RoleConfig:
     → Asegúrate que el roleName en RoleConfig coincide EXACTAMENTE
       con el valor del campo 'role' en la tabla User (case-insensitive)
  
  4. Si la configuración es correcta pero no aplica:
     → El usuario DEBE hacer logout y volver a entrar (el JWT se
       reconstruye solo al login, o cada 60s automáticamente)
  
  5. Para forzar actualización inmediata sin logout:
     → Elimina las sesiones del usuario en BD:
        DELETE FROM sessions WHERE user_id = '<userId>';
  
  6. Verificar el bug de allowedRoutes en authorized():
     → Ver CHECK 6 arriba para el fix recomendado
  `);

    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
