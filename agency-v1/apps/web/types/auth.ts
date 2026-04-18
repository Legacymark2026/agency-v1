export enum UserRole {
    SUPER_ADMIN = 'super_admin',      // SuperAdmin: acceso total
    ADMIN = 'admin',            // ProjectManager: gestión general
    CONTENT_MANAGER = 'content_manager',  // Marketing_SEO / Creativo senior
    CLIENT_ADMIN = 'client_admin',     // Ventas: CRM y leads
    CLIENT_USER = 'client_user',      // Creativo junior: tareas asignadas
    EXTERNAL_CLIENT = 'external_client',// Cliente final (Dashboard restringido)
    GUEST = 'guest'             // Sin acceso al panel
}

/**
 * Mapeo nombre agencia → código sistema (para onboarding del equipo)
 * SuperAdmin      → super_admin
 * ProjectManager  → admin
 * Marketing_SEO   → content_manager
 * Creativo        → client_user
 * Ventas          → client_admin
 */

export enum Permission {
    // ── Administración ──────────────────────────────────
    MANAGE_USERS = 'manage_users',
    MANAGE_ROLES = 'manage_roles',
    MANAGE_SETTINGS = 'manage_settings',
    VIEW_SECURITY = 'view_security',

    // ── Analítica ─────────────────────────────────────
    VIEW_ANALYTICS = 'view_analytics',
    VIEW_REPORTS = 'view_reports',

    // ── Contenido / Blog ──────────────────────────────
    CREATE_CONTENT = 'create_content',
    EDIT_CONTENT = 'edit_content',
    DELETE_CONTENT = 'delete_content',
    PUBLISH_CONTENT = 'publish_content',

    // ── Proyectos / Portafolio ────────────────────────
    VIEW_PROJECTS = 'view_projects',
    MANAGE_PROJECTS = 'manage_projects',

    // ── CRM / Ventas ──────────────────────────────────
    VIEW_LEADS = 'view_leads',
    MANAGE_LEADS = 'manage_leads',
    VIEW_CRM = 'view_crm',
    MANAGE_CRM = 'manage_crm',

    // ── Marketing Hub ─────────────────────────────────
    VIEW_MARKETING = 'view_marketing',
    MANAGE_MARKETING = 'manage_marketing',
    VIEW_CAMPAIGNS = 'view_campaigns',
    MANAGE_CAMPAIGNS = 'manage_campaigns',

    // ── Inbox Omnicanal ───────────────────────────────
    VIEW_INBOX = 'view_inbox',
    SEND_MESSAGES = 'send_messages',

    // ── Equipo ────────────────────────────────────────
    VIEW_TEAM = 'view_team',
    MANAGE_TEAM = 'manage_team',

    // ── Assets ────────────────────────────────────────
    UPLOAD_ASSETS = 'upload_assets',
    VIEW_CLIENT_DASHBOARD = 'view_client_dashboard',

    // ── Automatización ────────────────────────────────
    VIEW_AUTOMATION = 'view_automation',
    MANAGE_AUTOMATION = 'manage_automation',
}

/** Permisos completos por rol — fuente única de verdad */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.SUPER_ADMIN]: Object.values(Permission),   // Todos los permisos

    [UserRole.ADMIN]: [
        Permission.MANAGE_USERS,
        Permission.VIEW_ANALYTICS, Permission.VIEW_REPORTS,
        Permission.CREATE_CONTENT, Permission.EDIT_CONTENT,
        Permission.DELETE_CONTENT, Permission.PUBLISH_CONTENT,
        Permission.VIEW_PROJECTS, Permission.MANAGE_PROJECTS,
        Permission.VIEW_INBOX, Permission.SEND_MESSAGES,
        Permission.VIEW_TEAM, Permission.MANAGE_TEAM,
        Permission.VIEW_MARKETING, Permission.VIEW_CAMPAIGNS,
        Permission.UPLOAD_ASSETS,
        Permission.VIEW_AUTOMATION,
    ],

    [UserRole.CONTENT_MANAGER]: [
        Permission.VIEW_ANALYTICS, Permission.VIEW_REPORTS,
        Permission.CREATE_CONTENT, Permission.EDIT_CONTENT,
        Permission.PUBLISH_CONTENT,
        Permission.VIEW_PROJECTS,
        Permission.UPLOAD_ASSETS,
        Permission.VIEW_MARKETING, Permission.VIEW_CAMPAIGNS,
        Permission.MANAGE_CAMPAIGNS,
        Permission.VIEW_TEAM,
    ],

    [UserRole.CLIENT_ADMIN]: [
        Permission.VIEW_LEADS, Permission.MANAGE_LEADS,
        Permission.VIEW_CRM, Permission.MANAGE_CRM,
        Permission.VIEW_INBOX, Permission.SEND_MESSAGES,
        Permission.VIEW_REPORTS,
        Permission.VIEW_TEAM,
    ],

    [UserRole.CLIENT_USER]: [
        Permission.VIEW_PROJECTS,
        Permission.CREATE_CONTENT, Permission.EDIT_CONTENT,
        Permission.UPLOAD_ASSETS,
    ],

    [UserRole.EXTERNAL_CLIENT]: [
        Permission.VIEW_CLIENT_DASHBOARD,
    ],

    [UserRole.GUEST]: [],
};
