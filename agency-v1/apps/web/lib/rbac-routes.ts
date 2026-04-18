/**
 * lib/rbac-routes.ts
 * ─────────────────────────────────────────────────────────────
 * Lista de todas las rutas del dashboard.
 * Archivo separado SIN imports de Prisma — seguro para usar en cliente.
 */

export const ALL_DASHBOARD_ROUTES: { route: string; label: string }[] = [
    { route: "/dashboard", label: "Dashboard (inicio)" },
    { route: "/dashboard/users", label: "Gestión de Usuarios" },
    { route: "/dashboard/security", label: "Seguridad y Logs" },
    { route: "/dashboard/settings", label: "Configuración del Sistema" },
    { route: "/dashboard/experts", label: "Equipo / Expertos" },
    { route: "/dashboard/analytics", label: "Analítica" },
    { route: "/dashboard/posts", label: "Posts / Blog" },
    { route: "/dashboard/projects", label: "Proyectos / Portafolio" },
    { route: "/dashboard/inbox", label: "Inbox Omnicanal" },
    { route: "/dashboard/marketing", label: "Marketing Hub" },
    { route: "/dashboard/marketing/campaigns", label: "Marketing → Campañas" },
    { route: "/dashboard/marketing/spend", label: "Marketing → Gasto" },
    { route: "/dashboard/marketing/links", label: "Marketing → Links" },
    { route: "/dashboard/marketing/automation", label: "Marketing → Automatización" },
    { route: "/dashboard/admin/architecture", label: "Admin → Arquitectura" },
    { route: "/dashboard/admin/automation", label: "Admin → Automatización" },
    { route: "/dashboard/admin/crm", label: "CRM" },
    { route: "/dashboard/admin/crm/leads", label: "CRM → Leads" },
    { route: "/dashboard/admin/crm/pipeline", label: "CRM → Pipeline" },
    { route: "/dashboard/admin/crm/campaigns", label: "CRM → Campañas" },
    { route: "/dashboard/events", label: "Calendario / Eventos" },
    { route: "/dashboard/roles", label: "Gestión de Roles" },
];
