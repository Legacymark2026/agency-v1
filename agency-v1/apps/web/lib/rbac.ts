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
    "/dashboard/settings/sales": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/settings/operations": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/settings/hr": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/settings/support": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/settings/media": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/settings/billing": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/settings/billing/gateways": [UserRole.SUPER_ADMIN, UserRole.ADMIN],

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

    // ── Inbox Omnicanal, Chat y Feed Empresarial ─────────
    "/dashboard/inbox": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/chat": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER],
    "/dashboard/feed": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER],

    // ── Marketing Hub ─────────────────────────────────────
    "/dashboard/marketing": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER],
    "/dashboard/marketing/enterprise": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER],
    "/dashboard/marketing/pricing": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER],
    "/dashboard/marketing/campaigns": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER],
    "/dashboard/marketing/listening": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER],
    "/dashboard/admin/marketing/approvals": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN],
    "/dashboard/marketing/spend": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN],
    "/dashboard/marketing/links": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER],
    "/dashboard/marketing/automation": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.CLIENT_ADMIN],

    // ── Admin / Arquitectura ──────────────────────────────
    "/dashboard/admin/architecture": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/admin/automation": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/admin/audit-logs": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/privacy-portal": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CLIENT_USER],

    // ── CRM / Ventas ──────────────────────────────────────
    "/dashboard/admin/crm": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/leads": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/scoring": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/pipeline": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/campaigns": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/admin/crm/deals": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/sales": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/sales/goals": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/commissions": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/automation": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/sequences": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/crm/templates": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/admin/crm/assignment": [UserRole.SUPER_ADMIN, UserRole.CLIENT_ADMIN],

    // ── Finanzas y Operaciones ────────────────────────────
    "/dashboard/pos": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/inventory": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/purchases": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/suppliers": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/sales-forecast": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/dian": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN, UserRole.CONTENT_MANAGER],
    "/dashboard/security/audit-ledger": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
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
    "/dashboard/admin/payroll/time-off": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],
    "/dashboard/admin/payroll/reports": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/admin/payroll/expenses": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/admin/operations": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EXTERNAL_CLIENT],
    "/dashboard/admin/proposals": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],

    // ── Calendario / Eventos ──────────────────────────────
    "/dashboard/events": [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT_ADMIN],

    // ── Agentes de IA ─────────────────────────────────────
    "/dashboard/settings/agents": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/settings/agents/teams": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/settings/agents/skillchains": [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    "/dashboard/settings/agents/knowledge": [UserRole.SUPER_ADMIN, UserRole.ADMIN],

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
    "/dashboard/client": [UserRole.SUPER_ADMIN, UserRole.EXTERNAL_CLIENT],
    "/dashboard/client/proposals": [UserRole.SUPER_ADMIN, UserRole.EXTERNAL_CLIENT],
    "/dashboard/client/projects": [UserRole.SUPER_ADMIN, UserRole.EXTERNAL_CLIENT],
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
    // Dashboard & Analítica General
    { perm: "dashboard.view", routes: ["/dashboard", "/dashboard/pos"] },
    { perm: "dashboard.analytics", routes: ["/dashboard/analytics", "/dashboard/admin/ai-insights", "/dashboard/seo"] },

    // IAM / Identidad y Roles
    { perm: "iam.view_users", routes: ["/dashboard/users", "/dashboard/settings/members"] },
    { perm: "iam.manage_users", routes: ["/dashboard/users", "/dashboard/experts", "/dashboard/settings/members"] },
    { perm: "iam.manage_roles", routes: ["/dashboard/users", "/dashboard/roles", "/dashboard/settings/roles"] },
    { perm: "iam.view_security", routes: ["/dashboard/security", "/dashboard/security/sla"] },
    { perm: "iam.manage_settings", routes: ["/dashboard/settings", "/dashboard/settings/system-parameters"] },
    { perm: "users.manage", routes: ["/dashboard/users", "/dashboard/experts", "/dashboard/settings/members"] },
    { perm: "settings.roles.manage", routes: ["/dashboard/roles", "/dashboard/settings/roles"] },

    // Terminal POS, Catálogo y Promociones
    { perm: "pos.view", routes: ["/dashboard/pos", "/dashboard/catalog", "/dashboard/promotions"] },
    { perm: "pos.orders.create", routes: ["/dashboard/pos"] },
    { perm: "pos.manage", routes: ["/dashboard/pos", "/dashboard/catalog", "/dashboard/promotions"] },
    { perm: "catalog.view", routes: ["/dashboard/catalog"] },
    { perm: "catalog.manage", routes: ["/dashboard/catalog"] },
    { perm: "promotions.manage", routes: ["/dashboard/promotions"] },

    // Facturación DIAN & B2B
    { perm: "invoices.read", routes: ["/dashboard/invoicing", "/dashboard/admin/invoices"] },
    { perm: "invoices.create", routes: ["/dashboard/invoicing", "/dashboard/admin/invoices"] },
    { perm: "invoices.manage", routes: ["/dashboard/invoicing", "/dashboard/admin/invoices"] },
    { perm: "invoicing.dian", routes: ["/dashboard/invoicing", "/dashboard/dian"] },
    { perm: "invoicing.ocr", routes: ["/dashboard/invoicing/ocr-scanner"] },
    { perm: "invoicing.fraud_guard", routes: ["/dashboard/invoicing/fraud-guard"] },

    // Contabilidad & Libros
    { perm: "accounting.view", routes: ["/dashboard/accounting", "/dashboard/accounting/costs"] },
    { perm: "accounting.manage", routes: ["/dashboard/accounting"] },
    { perm: "accounting.costs", routes: ["/dashboard/accounting/costs"] },

    // Tesorería & Pasarelas
    { perm: "treasury.view", routes: ["/dashboard/admin/treasury", "/dashboard/admin/invoices", "/dashboard/settings/billing"] },
    { perm: "treasury.manage", routes: ["/dashboard/admin/treasury", "/dashboard/admin/invoices"] },
    { perm: "treasury.export", routes: ["/dashboard/admin/treasury"] },
    { perm: "gateways.manage", routes: ["/dashboard/settings/billing/gateways"] },

    // CRM / Ventas & Pipeline
    { perm: "crm.view_own", routes: ["/dashboard/admin/crm", "/dashboard/admin/crm/leads", "/dashboard/admin/crm/deals", "/dashboard/admin/sales", "/dashboard/admin/sales/goals", "/dashboard/admin/crm/commissions", "/dashboard/admin/crm/automation", "/dashboard/admin/crm/sequences", "/dashboard/admin/crm/assignment"] },
    { perm: "crm.view_all", routes: ["/dashboard/admin/crm", "/dashboard/admin/crm/leads", "/dashboard/admin/crm/deals", "/dashboard/admin/sales", "/dashboard/admin/sales/goals", "/dashboard/admin/crm/commissions", "/dashboard/admin/crm/automation", "/dashboard/admin/crm/sequences", "/dashboard/admin/crm/assignment"] },
    { perm: "crm.edit", routes: ["/dashboard/admin/crm", "/dashboard/admin/crm/leads", "/dashboard/admin/crm/deals", "/dashboard/admin/sales", "/dashboard/admin/sales/goals", "/dashboard/admin/crm/commissions", "/dashboard/admin/crm/automation", "/dashboard/admin/crm/sequences", "/dashboard/admin/crm/assignment"] },
    { perm: "crm.delete", routes: ["/dashboard/admin/crm/leads"] },
    { perm: "crm.export", routes: ["/dashboard/admin/crm"] },
    { perm: "crm.pipeline", routes: ["/dashboard/admin/crm/pipeline", "/dashboard/admin/sales"] },
    { perm: "crm.tasks", routes: ["/dashboard/admin/crm/tasks"] },
    { perm: "crm.reports", routes: ["/dashboard/admin/crm/reports"] },
    { perm: "crm.templates", routes: ["/dashboard/admin/crm/templates"] },
    { perm: "crm.scoring", routes: ["/dashboard/admin/crm/scoring"] },
    { perm: "crm.commissions", routes: ["/dashboard/admin/crm/commissions"] },
    { perm: "crm.sequences", routes: ["/dashboard/admin/crm/sequences"] },
    { perm: "crm.automation", routes: ["/dashboard/admin/crm/automation", "/dashboard/admin/crm/assignment"] },
    { perm: "crm.assignment", routes: ["/dashboard/admin/crm/assignment"] },

    // Marketing & Growth
    { perm: "mkt.view", routes: ["/dashboard/marketing", "/dashboard/marketing/enterprise", "/dashboard/admin/marketing"] },
    { perm: "mkt.campaigns", routes: ["/dashboard/marketing/campaigns", "/dashboard/admin/marketing/campaigns"] },
    { perm: "mkt.spend", routes: ["/dashboard/marketing/spend", "/dashboard/admin/marketing/spend"] },
    { perm: "mkt.links", routes: ["/dashboard/marketing/links", "/dashboard/admin/marketing/links"] },
    { perm: "mkt.edit", routes: ["/dashboard/marketing", "/dashboard/marketing/enterprise", "/dashboard/admin/marketing"] },
    { perm: "mkt.send", routes: ["/dashboard/admin/marketing/campaigns", "/dashboard/marketing/email-blast"] },
    { perm: "mkt.integrations", routes: ["/dashboard/admin/marketing/settings"] },
    { perm: "mkt.creative", routes: ["/dashboard/admin/marketing/creative-studio"] },
    { perm: "mkt.ab_testing", routes: ["/dashboard/admin/marketing/campaigns"] },
    { perm: "mkt.broadcast", routes: ["/dashboard/marketing/email-blast"] },
    { perm: "mkt.listening", routes: ["/dashboard/marketing/listening"] },
    { perm: "seo.view", routes: ["/dashboard/seo"] },

    // Operaciones & Logística
    { perm: "inventory.view", routes: ["/dashboard/inventory", "/dashboard/purchases", "/dashboard/suppliers", "/dashboard/channels"] },
    { perm: "inventory.manage", routes: ["/dashboard/inventory", "/dashboard/purchases", "/dashboard/suppliers", "/dashboard/channels"] },
    { perm: "purchases.view", routes: ["/dashboard/purchases"] },
    { perm: "purchases.manage", routes: ["/dashboard/purchases"] },
    { perm: "suppliers.view", routes: ["/dashboard/suppliers"] },
    { perm: "suppliers.manage", routes: ["/dashboard/suppliers"] },
    { perm: "booking.view", routes: ["/dashboard/booking", "/dashboard/calendar", "/dashboard/events"] },
    { perm: "booking.manage", routes: ["/dashboard/booking"] },
    { perm: "calendar.view", routes: ["/dashboard/calendar", "/dashboard/events"] },
    { perm: "calendar.create", routes: ["/dashboard/calendar", "/dashboard/events"] },
    { perm: "calendar.delete", routes: ["/dashboard/calendar", "/dashboard/events"] },
    { perm: "projects.view", routes: ["/dashboard/projects", "/dashboard/kanban"] },
    { perm: "projects.create", routes: ["/dashboard/projects"] },
    { perm: "projects.manage", routes: ["/dashboard/projects", "/dashboard/kanban"] },
    { perm: "kanban.view", routes: ["/dashboard/kanban"] },

    // Recursos Humanos & Nómina
    { perm: "hr.view", routes: ["/dashboard/admin/hr", "/dashboard/admin/hr/time-tracking", "/dashboard/settings/hr"] },
    { perm: "hr.manage", routes: ["/dashboard/admin/hr", "/dashboard/admin/hr/time-tracking", "/dashboard/settings/hr"] },
    { perm: "payroll.view", routes: ["/dashboard/admin/payroll", "/dashboard/admin/payroll/employees", "/dashboard/admin/payroll/reports", "/dashboard/admin/payroll/expenses"] },
    { perm: "payroll.manage", routes: ["/dashboard/admin/payroll", "/dashboard/admin/payroll/employees", "/dashboard/admin/payroll/employees/new"] },
    { perm: "payroll.approve", routes: ["/dashboard/admin/payroll", "/dashboard/admin/payroll/expenses"] },
    { perm: "payroll.expenses", routes: ["/dashboard/admin/payroll/expenses"] },

    // Inbox Omnicanal & Chat
    { perm: "inbox.view", routes: ["/dashboard/inbox", "/dashboard/chat", "/dashboard/feed"] },
    { perm: "inbox.send", routes: ["/dashboard/inbox", "/dashboard/chat"] },
    { perm: "inbox.manage", routes: ["/dashboard/inbox", "/dashboard/settings/inbox/macros"] },
    { perm: "chat.view", routes: ["/dashboard/chat"] },
    { perm: "chat.send", routes: ["/dashboard/chat"] },
    { perm: "macros.manage", routes: ["/dashboard/settings/inbox/macros"] },

    // Medios, Contenido & Video
    { perm: "content.view", routes: ["/dashboard/feed", "/dashboard/posts", "/dashboard/posts/categories", "/dashboard/posts/comments"] },
    { perm: "content.create", routes: ["/dashboard/posts", "/dashboard/posts/create"] },
    { perm: "content.publish", routes: ["/dashboard/posts", "/dashboard/feed"] },
    { perm: "content.delete", routes: ["/dashboard/posts"] },
    { perm: "assets.upload", routes: ["/dashboard/media", "/dashboard/posts"] },
    { perm: "assets.delete", routes: ["/dashboard/media", "/dashboard/posts"] },
    { perm: "video.view", routes: ["/dashboard/video", "/dashboard/tools/video-editor"] },
    { perm: "video.manage", routes: ["/dashboard/video", "/dashboard/tools/video-editor"] },
    { perm: "voice.manage", routes: ["/dashboard/voice"] },

    // Agentes de IA & Swarms
    { perm: "agents.view", routes: ["/dashboard/settings/agents", "/dashboard/settings/agents/teams"] },
    { perm: "agents.manage", routes: ["/dashboard/settings/agents", "/dashboard/settings/agents/teams", "/dashboard/settings/agents/delegation"] },
    { perm: "agents.deploy", routes: ["/dashboard/settings/agents"] },
    { perm: "knowledge.manage", routes: ["/dashboard/settings/agents/knowledge"] },
    { perm: "skillchains.manage", routes: ["/dashboard/settings/agents/skillchains"] },

    // Herramientas de Desarrollo & Automatización
    { perm: "api.view", routes: ["/dashboard/tools/api-docs", "/dashboard/settings/developer"] },
    { perm: "api.keys.manage", routes: ["/dashboard/settings/developer"] },
    { perm: "webhooks.manage", routes: ["/dashboard/tools/webhooks"] },
    { perm: "automation.view", routes: ["/dashboard/admin/automation", "/dashboard/admin/architecture"] },
    { perm: "automation.manage", routes: ["/dashboard/admin/automation"] },
    { perm: "architecture.view", routes: ["/dashboard/admin/architecture"] },

    // Seguridad & Compliance
    { perm: "security.view", routes: ["/dashboard/security", "/dashboard/security/audit-ledger", "/dashboard/security/sla"] },
    { perm: "audit.view", routes: ["/dashboard/security/audit-ledger", "/dashboard/admin/audit-logs", "/dashboard/settings/audit-logs"] },
    { perm: "privacy.manage", routes: ["/dashboard/privacy-portal", "/dashboard/settings/privacy"] },
    { perm: "system.parameters", routes: ["/dashboard/settings/system-parameters"] },

    // Propuestas y Clientes
    { perm: "proposals.view", routes: ["/dashboard/admin/proposals", "/dashboard/client/proposals"] },
    { perm: "proposals.manage", routes: ["/dashboard/admin/proposals"] },
    { perm: "team.view", routes: ["/dashboard/experts", "/dashboard/settings/members"] },
    { perm: "team.invite", routes: ["/dashboard/users", "/dashboard/experts", "/dashboard/settings/members"] },
    { perm: "team.roles", routes: ["/dashboard/users", "/dashboard/roles", "/dashboard/settings/roles"] },
    { perm: "notifications.view", routes: ["/dashboard/settings/notifications"] },
    { perm: "notifications.manage", routes: ["/dashboard/settings/notifications"] },
];

// ─── Master Permission List (for seed scripts) ──────────────────────────────
// Every permission in the platform, grouped by module. Used by the seed script
// to ensure the Permission table is always in sync with the codebase.

export const MASTER_PERMISSIONS: { module: string; name: string; description: string }[] = [
    // Dashboard & Analítica
    { module: "dashboard", name: "dashboard.view", description: "Ver el dashboard principal de la plataforma" },
    { module: "dashboard", name: "dashboard.analytics", description: "Consultar métricas y analítica ejecutiva global" },

    // IAM (Identidad y Roles)
    { module: "iam", name: "users.manage", description: "Gestionar miembros del equipo y colaboradores" },
    { module: "iam", name: "settings.roles.manage", description: "Crear, editar y asignar roles y permisos RBAC" },
    { module: "iam", name: "iam.view_users", description: "Ver directorio de usuarios y colaboradores" },
    { module: "iam", name: "iam.manage_users", description: "Invitar, activar y suspender usuarios" },
    { module: "iam", name: "iam.manage_roles", description: "Configurar jerarquías de roles y políticas de acceso" },
    { module: "iam", name: "iam.view_security", description: "Consultar registros de seguridad y autenticación" },
    { module: "iam", name: "iam.manage_settings", description: "Administrar configuración general de la organización" },

    // POS & Terminal de Ventas
    { module: "pos", name: "pos.view", description: "Acceder al terminal de punto de venta (POS)" },
    { module: "pos", name: "pos.orders.create", description: "Crear y cobrar órdenes de venta en caja" },
    { module: "pos", name: "pos.manage", description: "Apertura, cierre de turnos y arqueos de caja" },
    { module: "pos", name: "catalog.view", description: "Consultar catálogo de productos y precios" },
    { module: "pos", name: "catalog.manage", description: "Crear y actualizar artículos, categorías y precios" },
    { module: "pos", name: "promotions.manage", description: "Administrar cupones, promociones y descuentos" },

    // Facturación Electrónica DIAN & B2B
    { module: "invoicing", name: "invoices.read", description: "Ver facturas electrónicas emitidas y recibidas" },
    { module: "invoicing", name: "invoices.create", description: "Emitir facturas electrónicas B2B y notas crédito" },
    { module: "invoicing", name: "invoices.manage", description: "Anular, reenviar y conciliar facturas" },
    { module: "invoicing", name: "invoicing.dian", description: "Gestionar resoluciones, certificados y conexión DIAN" },
    { module: "invoicing", name: "invoicing.ocr", description: "Digitalizar facturas y recibos con escáner OCR" },
    { module: "invoicing", name: "invoicing.fraud_guard", description: "Supervisar alertas y validaciones del guardián anti-fraude" },

    // Contabilidad & Finanzas
    { module: "finance", name: "accounting.view", description: "Consultar balance, plan único de cuentas (PUC) y libros" },
    { module: "finance", name: "accounting.manage", description: "Asentar comprobantes contables y ajustes de periodo" },
    { module: "finance", name: "accounting.costs", description: "Gestionar centros de costos y márgenes de rentabilidad" },
    { module: "finance", name: "treasury.view", description: "Consultar saldos, movimientos y cuentas de tesorería" },
    { module: "finance", name: "treasury.manage", description: "Registrar cobros, transferencias y pagos bancarios" },
    { module: "finance", name: "treasury.export", description: "Exportar extractos e informes financieros para auditoría" },
    { module: "finance", name: "gateways.manage", description: "Configurar pasarelas de pago (Wompi, Stripe, Bold, MercadoPago)" },

    // CRM & Ventas
    { module: "crm", name: "crm.view_own", description: "Ver prospectos y negociaciones asignadas al usuario" },
    { module: "crm", name: "crm.view_all", description: "Ver todos los leads y negociaciones de la empresa" },
    { module: "crm", name: "crm.edit", description: "Crear y editar prospectos, cuentas y oportunidades" },
    { module: "crm", name: "crm.delete", description: "Eliminar prospectos y tratos cerrados o descartados" },
    { module: "crm", name: "crm.export", description: "Exportar base de datos de leads y contactos" },
    { module: "crm", name: "crm.pipeline", description: "Personalizar etapas y embudos de ventas" },
    { module: "crm", name: "crm.tasks", description: "Gestionar llamadas, reuniones y tareas de seguimiento" },
    { module: "crm", name: "crm.reports", description: "Ver informes de conversión, pronósticos y rendimiento comercial" },
    { module: "crm", name: "crm.templates", description: "Administrar plantillas de correo y propuestas" },
    { module: "crm", name: "crm.scoring", description: "Ajustar reglas predictivas de Lead Scoring" },
    { module: "crm", name: "crm.commissions", description: "Calcular y liquidar comisiones de asesores comerciales" },
    { module: "crm", name: "crm.sequences", description: "Diseñar secuencias automatizadas de prospección comercial" },
    { module: "crm", name: "crm.automation", description: "Configurar flujos de trabajo automáticos en el CRM" },
    { module: "crm", name: "crm.assignment", description: "Reglas de round-robin y asignación de prospectos" },

    // Marketing Hub
    { module: "marketing", name: "mkt.view", description: "Acceder al centro de mando de marketing" },
    { module: "marketing", name: "mkt.campaigns", description: "Crear y administrar campañas omnicanal" },
    { module: "marketing", name: "mkt.spend", description: "Supervisar gasto publicitario y retorno de inversión (ROAS)" },
    { module: "marketing", name: "mkt.links", description: "Crear y medir enlaces de atribución y campañas" },
    { module: "marketing", name: "mkt.edit", description: "Editar copys, creativos y recursos de campañas" },
    { module: "marketing", name: "mkt.send", description: "Ejecutar y lanzar transmisiones de campañas activas" },
    { module: "marketing", name: "mkt.integrations", description: "Conectar canales publicitarios (Meta Ads, Google Ads)" },
    { module: "marketing", name: "mkt.creative", description: "Generar piezas creativas en el Creative Studio IA" },
    { module: "marketing", name: "mkt.ab_testing", description: "Configurar experimentos y pruebas A/B de marketing" },
    { module: "marketing", name: "mkt.broadcast", description: "Enviar difusiones masivas por correo electrónico" },
    { module: "marketing", name: "mkt.listening", description: "Monitorear menciones sociales y radar de reputación" },
    { module: "marketing", name: "seo.view", description: "Auditar posicionamiento orgánico, backlinks y SEO técnico" },

    // Operaciones & Logística
    { module: "operations", name: "inventory.view", description: "Consultar existencias de inventario y bodegas" },
    { module: "operations", name: "inventory.manage", description: "Entradas, salidas, traslados y órdenes a proveedores" },
    { module: "operations", name: "purchases.view", description: "Consultar órdenes de compra y aprovisionamiento" },
    { module: "operations", name: "purchases.manage", description: "Crear, emitir y gestionar órdenes de compra a proveedores" },
    { module: "operations", name: "suppliers.view", description: "Consultar directorio de proveedores y acuerdos comerciales" },
    { module: "operations", name: "suppliers.manage", description: "Crear, actualizar y gestionar proveedores y catálogos SRM" },
    { module: "operations", name: "booking.view", description: "Ver calendario de agendamiento y disponibilidad de citas" },
    { module: "operations", name: "booking.manage", description: "Configurar servicios, horarios y políticas de reserva" },
    { module: "operations", name: "calendar.view", description: "Ver calendario corporativo y compromisos" },
    { module: "operations", name: "calendar.create", description: "Crear citas, eventos y reuniones operativas" },
    { module: "operations", name: "calendar.delete", description: "Cancelar o eliminar eventos programados" },
    { module: "operations", name: "projects.view", description: "Consultar portafolio de proyectos y cronogramas" },
    { module: "operations", name: "projects.create", description: "Iniciar nuevos proyectos y fijar hitos de entrega" },
    { module: "operations", name: "projects.manage", description: "Asignar responsables, presupuestos y recursos de proyectos" },
    { module: "operations", name: "kanban.view", description: "Operar tableros kanban de tareas y sprints" },

    // Recursos Humanos & Nómina
    { module: "hr", name: "hr.view", description: "Consultar expedientes de colaboradores y turnos laborales" },
    { module: "hr", name: "hr.manage", description: "Administrar contratos, vacaciones y novedades de personal" },
    { module: "hr", name: "payroll.view", description: "Consultar nómina electrónica, planillas PILA y liquidaciones" },
    { module: "hr", name: "payroll.manage", description: "Calcular y procesar pagos de nómina periódicos" },
    { module: "hr", name: "payroll.approve", description: "Autorizar desembolsos y transmisión DIAN de nómina" },
    { module: "hr", name: "payroll.expenses", description: "Aprobar y legalizar reembolsos de viáticos y gastos de viaje" },

    // Bandeja de Entrada Omnicanal & Soporte
    { module: "inbox", name: "inbox.view", description: "Leer conversaciones entrantes de WhatsApp, Web y Redes" },
    { module: "inbox", name: "inbox.send", description: "Responder y enviar mensajes a clientes en tiempo real" },
    { module: "inbox", name: "inbox.manage", description: "Reasignar tickets, tipificar y cerrar conversaciones" },
    { module: "inbox", name: "chat.view", description: "Acceder a canales de chat corporativo interno" },
    { module: "inbox", name: "chat.send", description: "Publicar en salas de chat departamentales y directos" },
    { module: "inbox", name: "macros.manage", description: "Crear respuestas rápidas y macros de atención" },

    // Medios, Contenido & Video
    { module: "media", name: "content.view", description: "Ver artículos, publicaciones del muro y categorías" },
    { module: "media", name: "content.create", description: "Redactar artículos de blog y comunicados internos" },
    { module: "media", name: "content.publish", description: "Aprobar y publicar contenidos para visualización pública" },
    { module: "media", name: "content.delete", description: "Eliminar contenidos obsoletos o despublicados" },
    { module: "media", name: "assets.upload", description: "Subir imágenes, videos y documentos a la bóveda" },
    { module: "media", name: "assets.delete", description: "Eliminar archivos y recursos multimedia del almacenamiento" },
    { module: "media", name: "video.view", description: "Reproducir y previsualizar proyectos de video editados" },
    { module: "media", name: "video.manage", description: "Producir y renderizar videos en Video Studio Pro" },
    { module: "media", name: "voice.manage", description: "Sintetizar y clonar locuciones en Voice Studio" },

    // Inteligencia Artificial & RAG
    { module: "ai", name: "agents.view", description: "Explorar catálogo de agentes de IA y asistentes configurados" },
    { module: "ai", name: "agents.manage", description: "Modificar prompts, instrucciones y parámetros de agentes" },
    { module: "ai", name: "agents.deploy", description: "Desplegar agentes autónomos y swarms a producción" },
    { module: "ai", name: "knowledge.manage", description: "Subir documentos e indexar bases vectoriales RAG" },
    { module: "ai", name: "skillchains.manage", description: "Encadenar herramientas y flujos de razonamiento cognitivo" },

    // Herramientas de Desarrollo & Automatización
    { module: "developer", name: "api.view", description: "Consultar especificación OpenAPI y documentación interactiva" },
    { module: "developer", name: "api.keys.manage", description: "Generar y revocar API keys y tokens de servicio" },
    { module: "developer", name: "webhooks.manage", description: "Suscribir y probar endpoints de webhooks salientes" },
    { module: "developer", name: "automation.view", description: "Supervisar historial de ejecuciones de flujos automáticos" },
    { module: "developer", name: "automation.manage", description: "Diseñar triggers, condiciones y acciones de automatización" },
    { module: "developer", name: "architecture.view", description: "Ver mapa de salud y topología de microservicios" },

    // Seguridad, Privacidad & Cumplimiento
    { module: "security", name: "security.view", description: "Monitorear métricas de SLA y postura de seguridad global" },
    { module: "security", name: "audit.view", description: "Inspeccionar bitácora forense y trazabilidad inmutable" },
    { module: "security", name: "privacy.manage", description: "Atender solicitudes de derechos ARCO / GDPR y eliminación de datos" },
    { module: "security", name: "system.parameters", description: "Ajustar variables críticas y umbrales operativos del sistema" },

    // Equipo & Propuestas
    { module: "team", name: "team.view", description: "Consultar directorio de expertos y miembros de la agencia" },
    { module: "team", name: "team.invite", description: "Enviar invitaciones de vinculación al equipo" },
    { module: "team", name: "team.roles", description: "Modificar asignación de roles de miembros del equipo" },
    { module: "proposals", name: "proposals.view", description: "Visualizar propuestas comerciales y cotizaciones con firma electrónica" },
    { module: "proposals", name: "proposals.manage", description: "Elaborar, enviar y liquidar cotizaciones contractuales" },
    { module: "notifications", name: "notifications.view", description: "Ver historial y alertas de notificaciones del sistema" },
    { module: "notifications", name: "notifications.manage", description: "Configurar canales y reglas de alerta inmediata" },
];

