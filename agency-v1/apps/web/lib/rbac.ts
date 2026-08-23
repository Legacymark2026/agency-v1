/**
 * lib/rbac.ts
 * ─────────────────────────────────────────────────────
 * Matriz de Control de Acceso Basado en Roles (RBAC).
 * Define qué roles estándar pueden acceder a cada ruta del dashboard.
 *
 * Esta es la ÚNICA fuente de verdad para los roles ESTÁNDAR.
 * El middleware, el sidebar y los guards leen de aquí.
 *
 * Para roles CUSTOM → los permisos se guardan en la tabla `role_configs`
 * de la BD y se embeben en el JWT al hacer login.
 * Ver: lib/role-config.ts para la lógica de BD.
 */
import { UserRole } from "@/types/auth";

// ── Rutas que nunca requieren autenticación ───────────────
export const PUBLIC_ROUTES = [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/recuperar",
    "/auth/nueva-contrasena",
    "/blog",
    "/contacto",
    "/nosotros",
    "/servicios",
    "/portfolio",
    "/soluciones",
    "/politica-privacidad",
    "/politica-cookies",
    "/terms",
    "/flyering",
    "/vip",
    "/data-deletion",
    "/sitemap.xml",
    "/robots.txt",
    "/rss",
];

// Prefijos de rutas que siempre son públicas
export const PUBLIC_PREFIXES = [
    "/blog/",
    "/portfolio/",
    "/soluciones/",
    "/api/leads/",
    "/api/analytics/",
    "/api/integrations/",
    "/api/webhooks/",
];

// ── Roles estándar del sistema ────────────────────────────
export const STANDARD_ROLES = Object.values(UserRole);

// ── Matriz de permisos para roles ESTÁNDAR ─────────────────
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
    // ── Acceso universal autenticado ──────────────────────
    "/dashboard": [
        UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER,
        UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER,
    ],

    // ── Administración de usuarios y roles ────────────────
    "/dashboard/users": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/security": [UserRole.SUPER_ADMIN],
    "/dashboard/settings": [UserRole.SUPER_ADMIN, UserRole.ADMIN],

    // ── Equipo / Expertos ─────────────────────────────────
    "/dashboard/experts": [UserRole.SUPER_ADMIN, UserRole.ADMIN],

    // ── Analítica ─────────────────────────────────────────
    "/dashboard/analytics": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/seo": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/admin/ai-insights": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN],

    // ── Contenido / Blog ──────────────────────────────────
    "/dashboard/posts": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_USER],
    "/dashboard/posts/create": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_USER],

    // ── Proyectos / Portafolio ────────────────────────────
    "/dashboard/projects": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_USER],

    // ── Inbox Omnicanal ───────────────────────────────────
    "/dashboard/inbox": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],

    // ── Marketing Hub ─────────────────────────────────────
    "/dashboard/marketing": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/marketing/pricing": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/marketing/campaigns": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/marketing/spend": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/marketing/links": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/marketing/automation": [UserRole.SUPER_ADMIN, UserRole.ADMIN],

    // ── Admin / Arquitectura ──────────────────────────────
    "/dashboard/admin/architecture": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/admin/automation": [UserRole.SUPER_ADMIN, UserRole.ADMIN],

    // ── CRM / Ventas ──────────────────────────────────────
    "/dashboard/admin/crm": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/leads": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/pipeline": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/campaigns": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/admin/crm/deals": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/sales/goals": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/commissions": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/automation": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/sequences": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/assignment": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],

    // ── Finanzas y Operaciones ────────────────────────────
    "/dashboard/pos": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/invoicing": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/accounting": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/calendar": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_USER],
    "/dashboard/catalog": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/promotions": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/admin/treasury": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/admin/invoices": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/payroll": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/admin/payroll/employees": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/admin/payroll/employees/new": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/admin/payroll/expenses": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/admin/operations": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EXTERNAL_CLIENT],
    "/dashboard/admin/proposals": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],

    // ── Calendario / Eventos ──────────────────────────────
    "/dashboard/events": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],

    // ── Agentes de IA ─────────────────────────────────────
    "/dashboard/settings/agents": [UserRole.SUPER_ADMIN, UserRole.ADMIN],

    // ── Video & Tools Master Hub ──────────────────────────
    "/dashboard/tools/master-hub": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/tools/webhooks": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/tools/api-docs": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER],
    "/dashboard/tools/video-editor": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/video": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/voice": [
        UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER,
        UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER,
    ],
    "/dashboard/invoicing/ocr-scanner": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/invoicing/fraud-guard": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/security/sla": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],

    // ── Preferencias de Notificaciones ────────────────────
    "/dashboard/settings/notifications": [
        UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER,
        UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER,
    ],
    "/dashboard/settings/audit-logs": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/settings/privacy": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/settings/system-parameters": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/booking": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER],

    // ── RRHH / Time Tracking ──────────────────────────────
    "/dashboard/admin/hr": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/admin/hr/time-tracking": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/roles": [UserRole.SUPER_ADMIN, UserRole.ADMIN],

    // ── Creative Studio ───────────────────────────────────
    "/dashboard/admin/marketing/creative-studio": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],

    // ── Portal del Cliente ────────────────────────────────
    "/dashboard/client": [UserRole.EXTERNAL_CLIENT],
};

// ── Helpers ───────────────────────────────────────────────

/**
 * Verifica si una ruta es pública (no requiere autenticación).
 */
export function isPublicRoute(pathname: string): boolean {
    if (PUBLIC_ROUTES.includes(pathname)) return true;
    return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Verifica si un rol es estándar del sistema.
 */
export function isStandardRole(role: string): boolean {
    return STANDARD_ROLES.includes(role as UserRole);
}

/**
 * Verifica si un rol CUSTOM puede acceder a una ruta.
 * allowedRoutes viene del JWT (leído de la BD al hacer login).
 *
 * REGLA: exact match O prefix match con '/' separador,
 *        EXCEPTO /dashboard que solo es exact match.
 */
export function canCustomRoleAccess(allowedRoutes: string[], pathname: string): boolean {
    for (const allowed of allowedRoutes) {
        if (pathname === allowed) return true;
        // CRÍTICO: /dashboard no hace prefix match (sería prefix de TODAS las rutas)
        if (allowed !== '/dashboard' && pathname.startsWith(allowed + '/')) return true;
    }
    return false;
}

/**
 * Dado un pathname y un rol, verifica si tiene acceso.
 *
 * @param pathname   - La ruta a verificar
 * @param role       - El rol del usuario (estándar o custom)
 * @param allowedRoutes - Para roles custom: las rutas permitidas del JWT/BD
 */
export function canAccessRoute(
    pathname: string,
    role: UserRole | string,
    allowedRoutes: string[] = []
): boolean {
    // SuperAdmin accede a todo
    if (role === UserRole.SUPER_ADMIN || role === 'super_admin') return true;

    // GUEST siempre bloqueado
    if (role === UserRole.GUEST || role === 'guest') return false;

    // ── Roles CUSTOM → usar allowedRoutes del JWT ─────────
    if (!isStandardRole(role)) {
        if (allowedRoutes.length === 0) return false; // sin configuración → acceso denegado
        return canCustomRoleAccess(allowedRoutes, pathname);
    }

    // ── Roles ESTÁNDAR → usar ROUTE_PERMISSIONS ───────────
    // Buscar match exacto primero
    if (ROUTE_PERMISSIONS[pathname]) {
        return ROUTE_PERMISSIONS[pathname].includes(role as UserRole);
    }

    // Buscar el prefijo más específico
    const matchingPrefixes = Object.keys(ROUTE_PERMISSIONS)
        .filter((route) => route !== '/dashboard' && pathname.startsWith(route + '/'))
        .sort((a, b) => b.length - a.length);

    if (matchingPrefixes.length > 0) {
        return ROUTE_PERMISSIONS[matchingPrefixes[0]].includes(role as UserRole);
    }

    // Ruta bajo /dashboard no listada → cualquier rol autenticado
    if (pathname.startsWith("/dashboard")) {
        return role !== UserRole.GUEST;
    }

    return true;
}

/**
 * Devuelve la lista de rutas accesibles por un rol estándar.
 * Para roles custom usar allowedRoutes del JWT directamente.
 */
export function getAccessibleRoutes(role: UserRole): string[] {
    if (role === UserRole.SUPER_ADMIN) return Object.keys(ROUTE_PERMISSIONS);
    return Object.entries(ROUTE_PERMISSIONS)
        .filter(([, roles]) => roles.includes(role))
        .map(([route]) => route);
}

// ── Mapa de permisos → rutas del sidebar ──────────────────────────────
// Cada permiso del editor de roles controla la visibilidad de las rutas.
// Los permisos están en formato 'scope.action' (ej. crm.view_all, mkt.view)
export const PERMISSION_ROUTE_MAP: { perm: string; routes: string[] }[] = [
    // Dashboard base
    { perm: "dashboard.view", routes: ["/dashboard", "/dashboard/pos"] },
    // POS Terminal & Catalog & Promotions
    { perm: "pos.view", routes: ["/dashboard/pos", "/dashboard/catalog", "/dashboard/promotions"] },
    { perm: "pos.manage", routes: ["/dashboard/pos", "/dashboard/catalog", "/dashboard/promotions"] },
    // IAM / Admin
    { perm: "iam.view_users", routes: ["/dashboard/users"] },
    { perm: "iam.manage_users", routes: ["/dashboard/users", "/dashboard/experts"] },
    { perm: "iam.manage_roles", routes: ["/dashboard/users"] },
    { perm: "iam.view_security", routes: ["/dashboard/security"] },
    { perm: "manage_settings", routes: ["/dashboard/settings"] },
    // Calendario
    { perm: "calendar.view", routes: ["/dashboard/events"] },
    { perm: "calendar.create", routes: ["/dashboard/events"] },
    { perm: "calendar.delete", routes: ["/dashboard/events"] },
    // CRM
    { perm: "crm.view_own", routes: ["/dashboard/pos", "/dashboard/admin/crm", "/dashboard/admin/crm/leads", "/dashboard/admin/crm/deals", "/dashboard/admin/sales/goals", "/dashboard/admin/crm/commissions", "/dashboard/admin/crm/automation", "/dashboard/admin/crm/sequences", "/dashboard/admin/crm/assignment"] },
    { perm: "crm.view_all", routes: ["/dashboard/pos", "/dashboard/admin/crm", "/dashboard/admin/crm/leads", "/dashboard/admin/crm/deals", "/dashboard/admin/sales/goals", "/dashboard/admin/crm/commissions", "/dashboard/admin/crm/automation", "/dashboard/admin/crm/sequences", "/dashboard/admin/crm/assignment"] },
    { perm: "crm.edit", routes: ["/dashboard/pos", "/dashboard/admin/crm", "/dashboard/admin/crm/leads", "/dashboard/admin/crm/deals", "/dashboard/admin/sales/goals", "/dashboard/admin/crm/commissions", "/dashboard/admin/crm/automation", "/dashboard/admin/crm/sequences", "/dashboard/admin/crm/assignment"] },
    { perm: "crm.delete", routes: ["/dashboard/admin/crm/leads"] },
    { perm: "crm.export", routes: ["/dashboard/admin/crm"] },
    { perm: "crm.pipeline", routes: ["/dashboard/admin/crm/pipeline"] },
    { perm: "crm.tasks", routes: ["/dashboard/admin/crm/tasks"] },
    { perm: "crm.reports", routes: ["/dashboard/admin/crm/reports"] },
    { perm: "crm.templates", routes: ["/dashboard/admin/crm/templates"] },
    { perm: "crm.scoring", routes: ["/dashboard/admin/crm/scoring"] },
    // Marketing
    { perm: "mkt.view", routes: ["/dashboard/admin/marketing"] },
    { perm: "mkt.campaigns", routes: ["/dashboard/admin/marketing/campaigns"] },
    { perm: "mkt.spend", routes: ["/dashboard/admin/marketing/spend"] },
    { perm: "mkt.links", routes: ["/dashboard/admin/marketing/links"] },
    { perm: "mkt.edit", routes: ["/dashboard/admin/marketing"] },
    { perm: "mkt.send", routes: ["/dashboard/admin/marketing/campaigns"] },
    { perm: "mkt.integrations", routes: ["/dashboard/admin/marketing/settings"] },
    { perm: "mkt.creative", routes: ["/dashboard/admin/marketing/creative-studio"] },
    // Automatización
    { perm: "automation.view", routes: ["/dashboard/admin/automation", "/dashboard/admin/architecture"] },
    { perm: "automation.manage", routes: ["/dashboard/admin/automation"] },
    // Inbox
    { perm: "inbox.view", routes: ["/dashboard/inbox"] },
    { perm: "inbox.send", routes: ["/dashboard/inbox"] },
    { perm: "inbox.manage", routes: ["/dashboard/inbox"] },
    // Contenido
    { perm: "content.view", routes: ["/dashboard/posts", "/dashboard/posts/categories"] },
    { perm: "content.create", routes: ["/dashboard/posts", "/dashboard/posts/create"] },
    { perm: "content.publish", routes: ["/dashboard/posts"] },
    { perm: "content.delete", routes: ["/dashboard/posts"] },
    // Proyectos
    { perm: "projects.view", routes: ["/dashboard/projects"] },
    { perm: "projects.create", routes: ["/dashboard/projects"] },
    { perm: "projects.manage", routes: ["/dashboard/projects"] },
    // Analítica
    { perm: "analytics.view", routes: ["/dashboard/analytics", "/dashboard/admin/ai-insights", "/dashboard/seo"] },
    { perm: "analytics.reports", routes: ["/dashboard/analytics", "/dashboard/admin/ai-insights", "/dashboard/seo"] },
    { perm: "analytics.export", routes: ["/dashboard/analytics"] },
    // Assets
    { perm: "assets.upload", routes: ["/dashboard/posts"] },
    { perm: "assets.delete", routes: ["/dashboard/posts"] },
    // Equipo
    { perm: "team.view", routes: ["/dashboard/experts"] },
    { perm: "team.invite", routes: ["/dashboard/users", "/dashboard/experts"] },
    { perm: "team.roles", routes: ["/dashboard/users", "/dashboard/settings"] },
    // Finanzas y Tesorería
    { perm: "treasury.view", routes: ["/dashboard/admin/treasury", "/dashboard/admin/invoices"] },
    { perm: "treasury.manage", routes: ["/dashboard/admin/treasury", "/dashboard/admin/invoices"] },
    { perm: "treasury.export", routes: ["/dashboard/admin/treasury"] },
    // Nómina y Operaciones
    { perm: "payroll.view", routes: ["/dashboard/admin/payroll", "/dashboard/admin/payroll/employees", "/dashboard/admin/payroll/employees/new", "/dashboard/admin/payroll/expenses", "/dashboard/admin/operations"] },
    { perm: "payroll.manage", routes: ["/dashboard/admin/payroll", "/dashboard/admin/payroll/employees", "/dashboard/admin/payroll/employees/new", "/dashboard/admin/payroll/expenses", "/dashboard/admin/operations"] },
    { perm: "payroll.approve", routes: ["/dashboard/admin/payroll", "/dashboard/admin/payroll/employees", "/dashboard/admin/payroll/expenses"] },
    // Propuestas comerciales
    { perm: "proposals.view", routes: ["/dashboard/admin/proposals"] },
    { perm: "proposals.manage", routes: ["/dashboard/admin/proposals"] },
    // Agentes de IA
    { perm: "agents.view", routes: ["/dashboard/settings/agents"] },
    { perm: "agents.manage", routes: ["/dashboard/settings/agents"] },
    { perm: "agents.deploy", routes: ["/dashboard/settings/agents"] },
    // Video Editor
    { perm: "video.view", routes: ["/dashboard/tools/video-editor", "/dashboard/video"] },
    { perm: "video.manage", routes: ["/dashboard/tools/video-editor", "/dashboard/video"] },
    // Notificaciones
    { perm: "notifications.view", routes: ["/dashboard/settings/notifications"] },
    { perm: "notifications.manage", routes: ["/dashboard/settings/notifications"] },
    // HR — Time Tracking
    { perm: "hr.view", routes: ["/dashboard/admin/hr", "/dashboard/admin/hr/time-tracking"] },
    { perm: "hr.manage", routes: ["/dashboard/admin/hr", "/dashboard/admin/hr/time-tracking"] },
    // Marketing — Creative Studio
    { perm: "mkt.creative", routes: ["/dashboard/admin/marketing/creative-studio"] },
    { perm: "mkt.ab_testing", routes: ["/dashboard/admin/marketing/campaigns"] },
    // CRM — Advanced
    { perm: "crm.scoring", routes: ["/dashboard/admin/crm/scoring"] },
    { perm: "crm.templates", routes: ["/dashboard/admin/crm/templates"] },
    { perm: "crm.commissions", routes: ["/dashboard/admin/crm/commissions"] },
    { perm: "crm.sequences", routes: ["/dashboard/admin/crm/sequences"] },
    { perm: "crm.automation", routes: ["/dashboard/admin/crm/automation", "/dashboard/admin/crm/assignment"] },
];

// ─── Master Permission List (for seed scripts) ──────────────────────────────
// Every permission in the platform, grouped by module. Used by the seed script
// to ensure the Permission table is always in sync with the codebase.

export const MASTER_PERMISSIONS: { module: string; name: string; description: string }[] = [
    // Dashboard
    { module: "dashboard", name: "dashboard.view", description: "Ver el dashboard principal" },
    // IAM
    { module: "iam", name: "iam.view_users", description: "Ver lista de usuarios" },
    { module: "iam", name: "iam.manage_users", description: "Gestionar usuarios (invitar, desactivar)" },
    { module: "iam", name: "iam.manage_roles", description: "Gestionar roles y permisos" },
    { module: "iam", name: "iam.view_security", description: "Ver configuración de seguridad" },
    { module: "iam", name: "manage_settings", description: "Gestionar configuración general" },
    // Calendar
    { module: "calendar", name: "calendar.view", description: "Ver eventos del calendario" },
    { module: "calendar", name: "calendar.create", description: "Crear eventos" },
    { module: "calendar", name: "calendar.delete", description: "Eliminar eventos" },
    // CRM
    { module: "crm", name: "crm.view_own", description: "Ver leads propios" },
    { module: "crm", name: "crm.view_all", description: "Ver todos los leads" },
    { module: "crm", name: "crm.edit", description: "Editar leads y deals" },
    { module: "crm", name: "crm.delete", description: "Eliminar leads" },
    { module: "crm", name: "crm.export", description: "Exportar datos del CRM" },
    { module: "crm", name: "crm.pipeline", description: "Gestionar pipeline de ventas" },
    { module: "crm", name: "crm.tasks", description: "Gestionar tareas del CRM" },
    { module: "crm", name: "crm.reports", description: "Ver reportes del CRM" },
    { module: "crm", name: "crm.templates", description: "Gestionar plantillas del CRM" },
    { module: "crm", name: "crm.scoring", description: "Configurar Lead Scoring" },
    { module: "crm", name: "crm.commissions", description: "Ver y gestionar comisiones" },
    { module: "crm", name: "crm.sequences", description: "Gestionar secuencias de email" },
    { module: "crm", name: "crm.automation", description: "Configurar reglas de automatización CRM" },
    // Marketing
    { module: "marketing", name: "mkt.view", description: "Ver módulo de marketing" },
    { module: "marketing", name: "mkt.campaigns", description: "Gestionar campañas" },
    { module: "marketing", name: "mkt.spend", description: "Ver presupuesto publicitario" },
    { module: "marketing", name: "mkt.links", description: "Gestionar links de tracking" },
    { module: "marketing", name: "mkt.edit", description: "Editar contenido de marketing" },
    { module: "marketing", name: "mkt.send", description: "Enviar campañas" },
    { module: "marketing", name: "mkt.integrations", description: "Configurar integraciones de marketing" },
    { module: "marketing", name: "mkt.creative", description: "Acceder al Creative Studio" },
    { module: "marketing", name: "mkt.ab_testing", description: "Gestionar A/B testing" },
    // Automation
    { module: "automation", name: "automation.view", description: "Ver workflows" },
    { module: "automation", name: "automation.manage", description: "Crear y editar workflows" },
    // Inbox
    { module: "inbox", name: "inbox.view", description: "Ver conversaciones del inbox" },
    { module: "inbox", name: "inbox.send", description: "Enviar mensajes" },
    { module: "inbox", name: "inbox.manage", description: "Gestionar conversaciones y asignaciones" },
    // Content
    { module: "content", name: "content.view", description: "Ver posts y contenido" },
    { module: "content", name: "content.create", description: "Crear contenido" },
    { module: "content", name: "content.publish", description: "Publicar contenido" },
    { module: "content", name: "content.delete", description: "Eliminar contenido" },
    // Projects
    { module: "projects", name: "projects.view", description: "Ver proyectos" },
    { module: "projects", name: "projects.create", description: "Crear proyectos" },
    { module: "projects", name: "projects.manage", description: "Gestionar proyectos" },
    // Analytics
    { module: "analytics", name: "analytics.view", description: "Ver analítica" },
    { module: "analytics", name: "analytics.reports", description: "Ver reportes avanzados" },
    { module: "analytics", name: "analytics.export", description: "Exportar datos analíticos" },
    // Assets
    { module: "assets", name: "assets.upload", description: "Subir archivos y medios" },
    { module: "assets", name: "assets.delete", description: "Eliminar archivos y medios" },
    // Team
    { module: "team", name: "team.view", description: "Ver miembros del equipo" },
    { module: "team", name: "team.invite", description: "Invitar miembros" },
    { module: "team", name: "team.roles", description: "Asignar roles a miembros" },
    // Finance — Treasury
    { module: "finance", name: "treasury.view", description: "Ver tesorería y facturas" },
    { module: "finance", name: "treasury.manage", description: "Gestionar tesorería" },
    { module: "finance", name: "treasury.export", description: "Exportar datos financieros" },
    // Finance — Payroll
    { module: "finance", name: "payroll.view", description: "Ver nómina y operaciones" },
    { module: "finance", name: "payroll.manage", description: "Procesar nómina" },
    { module: "finance", name: "payroll.approve", description: "Aprobar pagos de nómina" },
    // Proposals
    { module: "proposals", name: "proposals.view", description: "Ver propuestas comerciales" },
    { module: "proposals", name: "proposals.manage", description: "Crear y gestionar propuestas" },
    // AI Agents
    { module: "agents", name: "agents.view", description: "Ver agentes de IA configurados" },
    { module: "agents", name: "agents.manage", description: "Crear y editar agentes de IA" },
    { module: "agents", name: "agents.deploy", description: "Desplegar agentes en producción" },
    // Video Editor
    { module: "video", name: "video.view", description: "Ver contenido de video" },
    { module: "video", name: "video.manage", description: "Crear y editar videos" },
    // Notifications
    { module: "notifications", name: "notifications.view", description: "Ver configuración de notificaciones" },
    { module: "notifications", name: "notifications.manage", description: "Gestionar preferencias de notificaciones" },
    // HR
    { module: "hr", name: "hr.view", description: "Ver módulo de RRHH" },
    { module: "hr", name: "hr.manage", description: "Gestionar RRHH y time tracking" },
];

