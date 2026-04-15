// Tipos para el sistema RBAC Multi-Tenant

// ── Catálogo de módulos del sistema ─────────────────────────────────────────
export const MODULES = {
  CRM: 'crm',
  MARKETING: 'marketing',
  CONTENT: 'content',
  FINANCE: 'finance',
  KANBAN: 'kanban',
  HR: 'hr',
  SOCIAL: 'social',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
  INBOX: 'inbox',
  MEDIA: 'media',
  EVENTS: 'events',
  AI: 'ai',
} as const;

export type Module = typeof MODULES[keyof typeof MODULES];

// ── Permisos del sistema organizados por módulo ───────────────────────────
export const SYSTEM_PERMISSIONS = {
  // CRM
  'crm.leads.view': { module: MODULES.CRM, description: 'Ver leads' },
  'crm.leads.create': { module: MODULES.CRM, description: 'Crear leads' },
  'crm.leads.edit': { module: MODULES.CRM, description: 'Editar leads' },
  'crm.leads.delete': { module: MODULES.CRM, description: 'Eliminar leads' },
  'crm.leads.convert': { module: MODULES.CRM, description: 'Convertir leads a deals' },
  'crm.leads.import': { module: MODULES.CRM, description: 'Importar leads' },
  'crm.leads.export': { module: MODULES.CRM, description: 'Exportar leads' },
  'crm.leads.assign': { module: MODULES.CRM, description: 'Asignar leads' },
  
  'crm.deals.view': { module: MODULES.CRM, description: 'Ver deals' },
  'crm.deals.create': { module: MODULES.CRM, description: 'Crear deals' },
  'crm.deals.edit': { module: MODULES.CRM, description: 'Editar deals' },
  'crm.deals.delete': { module: MODULES.CRM, description: 'Eliminar deals' },
  'crm.deals.move_stage': { module: MODULES.CRM, description: 'Mover deal entre stages' },
  'crm.deals.win': { module: MODULES.CRM, description: 'Marcar deal como ganado' },
  'crm.deals.lose': { module: MODULES.CRM, description: 'Marcar deal como perdido' },
  
  'crm.activities.view': { module: MODULES.CRM, description: 'Ver actividades' },
  'crm.activities.create': { module: MODULES.CRM, description: 'Crear actividades' },
  'crm.activities.edit': { module: MODULES.CRM, description: 'Editar actividades' },
  'crm.activities.delete': { module: MODULES.CRM, description: 'Eliminar actividades' },
  
  'crm.tasks.view': { module: MODULES.CRM, description: 'Ver tareas CRM' },
  'crm.tasks.create': { module: MODULES.CRM, description: 'Crear tareas CRM' },
  'crm.tasks.edit': { module: MODULES.CRM, description: 'Editar tareas CRM' },
  'crm.tasks.complete': { module: MODULES.CRM, description: 'Completar tareas' },
  
  'crm.goals.view': { module: MODULES.CRM, description: 'Ver metas de ventas' },
  'crm.goals.create': { module: MODULES.CRM, description: 'Crear metas' },
  'crm.goals.edit': { module: MODULES.CRM, description: 'Editar metas' },
  'crm.goals.approve': { module: MODULES.CRM, description: 'Aprobar metas' },
  
  // Marketing
  'marketing.campaigns.view': { module: MODULES.MARKETING, description: 'Ver campañas' },
  'marketing.campaigns.create': { module: MODULES.MARKETING, description: 'Crear campañas' },
  'marketing.campaigns.edit': { module: MODULES.MARKETING, description: 'Editar campañas' },
  'marketing.campaigns.delete': { module: MODULES.MARKETING, description: 'Eliminar campañas' },
  'marketing.campaigns.publish': { module: MODULES.MARKETING, description: 'Publicar campañas' },
  'marketing.campaigns.archive': { module: MODULES.MARKETING, description: 'Archivar campañas' },
  
  'marketing.automation.view': { module: MODULES.MARKETING, description: 'Ver automatizaciones' },
  'marketing.automation.create': { module: MODULES.MARKETING, description: 'Crear automatizaciones' },
  'marketing.automation.edit': { module: MODULES.MARKETING, description: 'Editar automatizaciones' },
  'marketing.automation.execute': { module: MODULES.MARKETING, description: 'Ejecutar automatizaciones' },
  
  'marketing.adspend.import': { module: MODULES.MARKETING, description: 'Importar gasto en ads' },
  'marketing.adspend.view': { module: MODULES.MARKETING, description: 'Ver gasto en ads' },
  
  'marketing.email.create': { module: MODULES.MARKETING, description: 'Crear emails' },
  'marketing.email.send': { module: MODULES.MARKETING, description: 'Enviar emails' },
  'marketing.email.edit': { module: MODULES.MARKETING, description: 'Editar emails' },
  
  // Content
  'content.posts.view': { module: MODULES.CONTENT, description: 'Ver posts' },
  'content.posts.create': { module: MODULES.CONTENT, description: 'Crear posts' },
  'content.posts.edit': { module: MODULES.CONTENT, description: 'Editar posts' },
  'content.posts.delete': { module: MODULES.CONTENT, description: 'Eliminar posts' },
  'content.posts.publish': { module: MODULES.CONTENT, description: 'Publicar posts' },
  'content.posts.schedule': { module: MODULES.CONTENT, description: 'Agendar posts' },
  
  'content.projects.view': { module: MODULES.CONTENT, description: 'Ver proyectos' },
  'content.projects.create': { module: MODULES.CONTENT, description: 'Crear proyectos' },
  'content.projects.edit': { module: MODULES.CONTENT, description: 'Editar proyectos' },
  'content.projects.delete': { module: MODULES.CONTENT, description: 'Eliminar proyectos' },
  'content.projects.publish': { module: MODULES.CONTENT, description: 'Publicar proyectos' },
  
  'content.categories.manage': { module: MODULES.CONTENT, description: 'Gestionar categorías' },
  
  // Finance
  'finance.invoices.view': { module: MODULES.FINANCE, description: 'Ver facturas' },
  'finance.invoices.create': { module: MODULES.FINANCE, description: 'Crear facturas' },
  'finance.invoices.edit': { module: MODULES.FINANCE, description: 'Editar facturas' },
  'finance.invoices.send': { module: MODULES.FINANCE, description: 'Enviar facturas' },
  'finance.invoices.pay': { module: MODULES.FINANCE, description: 'Registrar pago' },
  'finance.invoices.delete': { module: MODULES.FINANCE, description: 'Eliminar facturas' },
  
  'finance.proposals.view': { module: MODULES.FINANCE, description: 'Ver propuestas' },
  'finance.proposals.create': { module: MODULES.FINANCE, description: 'Crear propuestas' },
  'finance.proposals.edit': { module: MODULES.FINANCE, description: 'Editar propuestas' },
  'finance.proposals.send': { module: MODULES.FINANCE, description: 'Enviar propuestas' },
  'finance.proposals.sign': { module: MODULES.FINANCE, description: 'Firmar propuestas' },
  'finance.proposals.delete': { module: MODULES.FINANCE, description: 'Eliminar propuestas' },
  
  'finance.commissions.view': { module: MODULES.FINANCE, description: 'Ver comisiones' },
  'finance.commissions.approve': { module: MODULES.FINANCE, description: 'Aprobar comisiones' },
  'finance.commissions.pay': { module: MODULES.FINANCE, description: 'Pagar comisiones' },
  
  // Kanban
  'kanban.projects.view': { module: MODULES.KANBAN, description: 'Ver proyectos kanban' },
  'kanban.projects.create': { module: MODULES.KANBAN, description: 'Crear proyectos kanban' },
  'kanban.projects.edit': { module: MODULES.KANBAN, description: 'Editar proyectos kanban' },
  'kanban.projects.archive': { module: MODULES.KANBAN, description: 'Archivar proyectos kanban' },
  
  'kanban.tasks.view': { module: MODULES.KANBAN, description: 'Ver tareas kanban' },
  'kanban.tasks.create': { module: MODULES.KANBAN, description: 'Crear tareas kanban' },
  'kanban.tasks.edit': { module: MODULES.KANBAN, description: 'Editar tareas kanban' },
  'kanban.tasks.delete': { module: MODULES.KANBAN, description: 'Eliminar tareas kanban' },
  'kanban.tasks.move': { module: MODULES.KANBAN, description: 'Mover tareas' },
  'kanban.tasks.assign': { module: MODULES.KANBAN, description: 'Asignar tareas' },
  
  'kanban.time.view': { module: MODULES.KANBAN, description: 'Ver time entries' },
  'kanban.time.create': { module: MODULES.KANBAN, description: 'Crear time entries' },
  'kanban.time.edit': { module: MODULES.KANBAN, description: 'Editar time entries' },
  
  // HR
  'hr.employees.view': { module: MODULES.HR, description: 'Ver empleados' },
  'hr.employees.manage': { module: MODULES.HR, description: 'Gestionar empleados' },
  'hr.payroll.view': { module: MODULES.HR, description: 'Ver nómina' },
  'hr.payroll.manage': { module: MODULES.HR, description: 'Gestionar nómina' },
  'hr.timesheets.approve': { module: MODULES.HR, description: 'Aprobar timesheets' },
  'hr.expenses.approve': { module: MODULES.HR, description: 'Aprobar gastos' },
  'hr.timeoff.approve': { module: MODULES.HR, description: 'Aprobar permisos' },
  
  // Social
  'social.posts.view': { module: MODULES.SOCIAL, description: 'Ver posts sociales' },
  'social.posts.create': { module: MODULES.SOCIAL, description: 'Crear posts sociales' },
  'social.posts.edit': { module: MODULES.SOCIAL, description: 'Editar posts sociales' },
  'social.posts.delete': { module: MODULES.SOCIAL, description: 'Eliminar posts sociales' },
  'social.posts.publish': { module: MODULES.SOCIAL, description: 'Publicar posts sociales' },
  'social.posts.approve': { module: MODULES.SOCIAL, description: 'Aprobar posts sociales' },
  
  // Settings
  'settings.users.manage': { module: MODULES.SETTINGS, description: 'Gestionar usuarios' },
  'settings.roles.manage': { module: MODULES.SETTINGS, description: 'Gestionar roles' },
  'settings.company.manage': { module: MODULES.SETTINGS, description: 'Gestionar empresa' },
  'settings.integrations.manage': { module: MODULES.SETTINGS, description: 'Gestionar integraciones' },
  'settings.billing.manage': { module: MODULES.SETTINGS, description: 'Gestionar facturación' },
  'settings.team.manage': { module: MODULES.SETTINGS, description: 'Gestionar equipos' },
  'settings.security.manage': { module: MODULES.SETTINGS, description: 'Gestionar seguridad' },
  
  // Analytics
  'analytics.reports.view': { module: MODULES.ANALYTICS, description: 'Ver reportes' },
  'analytics.data.view': { module: MODULES.ANALYTICS, description: 'Ver datos analíticos' },
  'analytics.exports.create': { module: MODULES.ANALYTICS, description: 'Exportar datos' },
  
  // Inbox
  'inbox.view': { module: MODULES.INBOX, description: 'Ver bandeja' },
  'inbox.send': { module: MODULES.INBOX, description: 'Enviar mensajes' },
  'inbox.manage': { module: MODULES.INBOX, description: 'Gestionar inbox' },
  
  // Media
  'media.view': { module: MODULES.MEDIA, description: 'Ver biblioteca de medios' },
  'media.upload': { module: MODULES.MEDIA, description: 'Subir medios' },
  'media.delete': { module: MODULES.MEDIA, description: 'Eliminar medios' },
  
  // Events
  'events.view': { module: MODULES.EVENTS, description: 'Ver eventos' },
  'events.create': { module: MODULES.EVENTS, description: 'Crear eventos' },
  'events.edit': { module: MODULES.EVENTS, description: 'Editar eventos' },
  'events.delete': { module: MODULES.EVENTS, description: 'Eliminar eventos' },
  'events.approve': { module: MODULES.EVENTS, description: 'Aprobar eventos' },
  
  // AI
  'ai.agents.view': { module: MODULES.AI, description: 'Ver agentes' },
  'ai.agents.manage': { module: MODULES.AI, description: 'Gestionar agentes' },
  'ai.workflows.view': { module: MODULES.AI, description: 'Ver workflows' },
  'ai.workflows.manage': { module: MODULES.AI, description: 'Gestionar workflows' },
};

export type PermissionKey = keyof typeof SYSTEM_PERMISSIONS;

// ── Tipos para respuestas de API ─────────────────────────────────────────
export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  isDefault: boolean;
  isActive: boolean;
  priority: number;
  permissions: Array<{
    id: string;
    permission: {
      id: string;
      name: string;
      module: string;
      description: string | null;
    };
  }>;
  _count: {
    users: number;
  };
}

export interface PermissionGroupedByModule {
  module: string;
  permissions: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  isDefault?: boolean;
  permissionIds: string[];
  priority?: number;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  permissionIds?: string[];
  priority?: number;
}

export interface AssignRoleInput {
  userId: string;
  roleId: string;
}

export interface ResourcePermissionInput {
  userId: string;
  resourceType: string;
  resourceId: string;
  permission: string;
  access: boolean;
}