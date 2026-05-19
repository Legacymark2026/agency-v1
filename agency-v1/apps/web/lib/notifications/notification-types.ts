/**
 * lib/notifications/notification-types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Enterprise Notification Type Registry — Single Source of Truth
 *
 * Every notification event in the platform MUST be registered here.
 * The registry maps each event to its visual representation, routing,
 * and default delivery preferences.
 *
 * CONVENTION:
 *   Module.ACTION  →  e.g. "CRM.LEAD_CREATED", "INBOX.MESSAGE_RECEIVED"
 */

// ─── Notification Category ──────────────────────────────────────────────────

export type NotificationCategory =
  | "CRM"
  | "INBOX"
  | "AUTOMATION"
  | "AI_ENGINE"
  | "FINANCE"
  | "MARKETING"
  | "CALENDAR"
  | "CONTENT"
  | "IAM"
  | "SYSTEM";

// ─── Notification Priority ─────────────────────────────────────────────────

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

// ─── Delivery Channel ───────────────────────────────────────────────────────

export type DeliveryChannel = "IN_APP" | "EMAIL" | "PUSH" | "WEBHOOK";

// ─── Digest Frequency ───────────────────────────────────────────────────────

export type DigestFrequency = "IMMEDIATE" | "HOURLY" | "DAILY" | "WEEKLY";

// ─── Event Type Registry ────────────────────────────────────────────────────

export interface NotificationEventMeta {
  /** Human-readable label for the event */
  label: string;
  /** Module/category this event belongs to */
  category: NotificationCategory;
  /** Lucide icon name for visual rendering */
  icon: string;
  /** Tailwind color class for the icon badge */
  color: string;
  /** Default priority level */
  defaultPriority: NotificationPriority;
  /** Default delivery channels for new users */
  defaultChannels: DeliveryChannel[];
  /** URL template — {id} placeholders resolved at emission time */
  linkTemplate?: string;
  /** Whether this event can be disabled by users */
  userConfigurable: boolean;
  /** Short description for the preferences UI */
  description: string;
}

/**
 * MASTER REGISTRY — Every notification event in the platform.
 *
 * To add a new event:
 *   1. Add the key here
 *   2. Call `notifyEvent(key, { ... })` from the relevant server action
 *   3. The engine handles DB write, preference check, and delivery
 */
export const NOTIFICATION_EVENTS = {

  // ── CRM ──────────────────────────────────────────────────────────────────
  "CRM.LEAD_CREATED": {
    label: "Nuevo Lead Creado",
    category: "CRM",
    icon: "UserPlus",
    color: "text-blue-400",
    defaultPriority: "NORMAL",
    defaultChannels: ["IN_APP"],
    linkTemplate: "/dashboard/admin/crm/leads?id={leadId}",
    userConfigurable: true,
    description: "Cuando se crea un nuevo lead en el pipeline",
  },
  "CRM.LEAD_ASSIGNED": {
    label: "Lead Asignado",
    category: "CRM",
    icon: "UserCheck",
    color: "text-blue-400",
    defaultPriority: "HIGH",
    defaultChannels: ["IN_APP", "EMAIL"],
    linkTemplate: "/dashboard/admin/crm/leads?id={leadId}",
    userConfigurable: true,
    description: "Cuando te asignan un lead para seguimiento",
  },
  "CRM.STAGE_CHANGED": {
    label: "Etapa del Lead Actualizada",
    category: "CRM",
    icon: "ArrowRightLeft",
    color: "text-indigo-400",
    defaultPriority: "NORMAL",
    defaultChannels: ["IN_APP"],
    linkTemplate: "/dashboard/admin/crm/pipeline",
    userConfigurable: true,
    description: "Cuando un lead avanza o retrocede en el pipeline",
  },
  "CRM.DEAL_WON": {
    label: "¡Deal Cerrado! 🎉",
    category: "CRM",
    icon: "Trophy",
    color: "text-emerald-400",
    defaultPriority: "HIGH",
    defaultChannels: ["IN_APP", "EMAIL"],
    linkTemplate: "/dashboard/admin/crm/deals?id={dealId}",
    userConfigurable: true,
    description: "Cuando un deal se cierra como ganado",
  },
  "CRM.DEAL_LOST": {
    label: "Deal Perdido",
    category: "CRM",
    icon: "XCircle",
    color: "text-red-400",
    defaultPriority: "HIGH",
    defaultChannels: ["IN_APP", "EMAIL"],
    linkTemplate: "/dashboard/admin/crm/deals?id={dealId}",
    userConfigurable: true,
    description: "Cuando un deal se cierra como perdido",
  },
  "CRM.LEAD_SCORED": {
    label: "Lead Score Actualizado",
    category: "CRM",
    icon: "TrendingUp",
    color: "text-amber-400",
    defaultPriority: "LOW",
    defaultChannels: ["IN_APP"],
    linkTemplate: "/dashboard/admin/crm/scoring",
    userConfigurable: true,
    description: "Cuando el score de un lead cambia significativamente",
  },

  // ── INBOX ────────────────────────────────────────────────────────────────
  "INBOX.MESSAGE_RECEIVED": {
    label: "Nuevo Mensaje Recibido",
    category: "INBOX",
    icon: "MessageSquare",
    color: "text-sky-400",
    defaultPriority: "HIGH",
    defaultChannels: ["IN_APP", "PUSH"],
    linkTemplate: "/dashboard/inbox?conversation={conversationId}",
    userConfigurable: true,
    description: "Cuando un contacto envía un mensaje en cualquier canal",
  },
  "INBOX.CONVERSATION_ASSIGNED": {
    label: "Conversación Asignada",
    category: "INBOX",
    icon: "UserCheck",
    color: "text-sky-400",
    defaultPriority: "HIGH",
    defaultChannels: ["IN_APP", "EMAIL"],
    linkTemplate: "/dashboard/inbox?conversation={conversationId}",
    userConfigurable: true,
    description: "Cuando te asignan una conversación del inbox",
  },
  "INBOX.SLA_BREACH": {
    label: "⚠️ SLA Incumplido",
    category: "INBOX",
    icon: "AlertTriangle",
    color: "text-red-500",
    defaultPriority: "URGENT",
    defaultChannels: ["IN_APP", "EMAIL", "PUSH"],
    linkTemplate: "/dashboard/inbox?conversation={conversationId}",
    userConfigurable: false,
    description: "Cuando una conversación supera el tiempo máximo de respuesta",
  },
  "INBOX.HUMAN_TRANSFER": {
    label: "Transferencia a Humano",
    category: "INBOX",
    icon: "PhoneForwarded",
    color: "text-orange-400",
    defaultPriority: "URGENT",
    defaultChannels: ["IN_APP", "EMAIL", "PUSH"],
    linkTemplate: "/dashboard/inbox?conversation={conversationId}",
    userConfigurable: false,
    description: "Cuando un agente AI solicita intervención humana",
  },

  // ── AUTOMATION ───────────────────────────────────────────────────────────
  "AUTOMATION.WORKFLOW_COMPLETED": {
    label: "Workflow Completado",
    category: "AUTOMATION",
    icon: "CheckCircle2",
    color: "text-emerald-400",
    defaultPriority: "NORMAL",
    defaultChannels: ["IN_APP"],
    linkTemplate: "/dashboard/admin/automation",
    userConfigurable: true,
    description: "Cuando un workflow se ejecuta exitosamente",
  },
  "AUTOMATION.WORKFLOW_FAILED": {
    label: "Workflow Fallido",
    category: "AUTOMATION",
    icon: "XOctagon",
    color: "text-red-400",
    defaultPriority: "HIGH",
    defaultChannels: ["IN_APP", "EMAIL"],
    linkTemplate: "/dashboard/admin/automation",
    userConfigurable: true,
    description: "Cuando un workflow falla durante la ejecución",
  },
  "AUTOMATION.CAMPAIGN_LAUNCHED": {
    label: "Campaña Lanzada",
    category: "AUTOMATION",
    icon: "Rocket",
    color: "text-violet-400",
    defaultPriority: "NORMAL",
    defaultChannels: ["IN_APP"],
    linkTemplate: "/dashboard/admin/marketing/campaigns",
    userConfigurable: true,
    description: "Cuando una campaña programada se ejecuta",
  },

  // ── AI ENGINE ────────────────────────────────────────────────────────────
  "AI.AGENT_SUSPENDED": {
    label: "Agente AI Suspendido",
    category: "AI_ENGINE",
    icon: "BotOff",
    color: "text-amber-500",
    defaultPriority: "HIGH",
    defaultChannels: ["IN_APP", "EMAIL"],
    linkTemplate: "/dashboard/settings/agents",
    userConfigurable: true,
    description: "Cuando un agente se suspende por frustración o circuit breaker",
  },
  "AI.CIRCUIT_BREAKER_OPEN": {
    label: "Circuit Breaker Activado",
    category: "AI_ENGINE",
    icon: "ShieldAlert",
    color: "text-red-500",
    defaultPriority: "URGENT",
    defaultChannels: ["IN_APP", "EMAIL"],
    linkTemplate: "/dashboard/settings/agents",
    userConfigurable: false,
    description: "Cuando el circuit breaker se abre por fallos repetidos del proveedor AI",
  },

  // ── FINANCE ──────────────────────────────────────────────────────────────
  "FINANCE.INVOICE_CREATED": {
    label: "Nueva Factura Creada",
    category: "FINANCE",
    icon: "FileText",
    color: "text-emerald-400",
    defaultPriority: "NORMAL",
    defaultChannels: ["IN_APP"],
    linkTemplate: "/dashboard/admin/invoices?id={invoiceId}",
    userConfigurable: true,
    description: "Cuando se genera una nueva factura",
  },
  "FINANCE.INVOICE_PAID": {
    label: "Factura Pagada ✅",
    category: "FINANCE",
    icon: "CircleDollarSign",
    color: "text-emerald-400",
    defaultPriority: "HIGH",
    defaultChannels: ["IN_APP", "EMAIL"],
    linkTemplate: "/dashboard/admin/invoices?id={invoiceId}",
    userConfigurable: true,
    description: "Cuando un cliente paga una factura",
  },
  "FINANCE.INVOICE_OVERDUE": {
    label: "Factura Vencida",
    category: "FINANCE",
    icon: "AlertCircle",
    color: "text-red-400",
    defaultPriority: "HIGH",
    defaultChannels: ["IN_APP", "EMAIL"],
    linkTemplate: "/dashboard/admin/invoices?id={invoiceId}",
    userConfigurable: true,
    description: "Cuando una factura supera la fecha de vencimiento",
  },
  "FINANCE.PAYROLL_PROCESSED": {
    label: "Nómina Procesada",
    category: "FINANCE",
    icon: "Wallet",
    color: "text-purple-400",
    defaultPriority: "HIGH",
    defaultChannels: ["IN_APP", "EMAIL"],
    linkTemplate: "/dashboard/admin/payroll",
    userConfigurable: true,
    description: "Cuando se procesa el ciclo de nómina",
  },
  "FINANCE.EXPENSE_APPROVED": {
    label: "Gasto Aprobado",
    category: "FINANCE",
    icon: "BadgeCheck",
    color: "text-emerald-400",
    defaultPriority: "NORMAL",
    defaultChannels: ["IN_APP"],
    linkTemplate: "/dashboard/admin/treasury",
    userConfigurable: true,
    description: "Cuando un gasto pendiente es aprobado",
  },
  "FINANCE.EXPENSE_REJECTED": {
    label: "Gasto Rechazado",
    category: "FINANCE",
    icon: "Ban",
    color: "text-red-400",
    defaultPriority: "HIGH",
    defaultChannels: ["IN_APP", "EMAIL"],
    linkTemplate: "/dashboard/admin/treasury",
    userConfigurable: true,
    description: "Cuando un gasto es rechazado",
  },

  // ── MARKETING ────────────────────────────────────────────────────────────
  "MARKETING.SOCIAL_PUBLISHED": {
    label: "Post Social Publicado",
    category: "MARKETING",
    icon: "Share2",
    color: "text-pink-400",
    defaultPriority: "LOW",
    defaultChannels: ["IN_APP"],
    linkTemplate: "/dashboard/admin/marketing",
    userConfigurable: true,
    description: "Cuando un post programado se publica en redes sociales",
  },
  "MARKETING.EMAIL_BLAST_SENT": {
    label: "Email Blast Enviado",
    category: "MARKETING",
    icon: "Send",
    color: "text-violet-400",
    defaultPriority: "NORMAL",
    defaultChannels: ["IN_APP"],
    linkTemplate: "/dashboard/admin/marketing/campaigns",
    userConfigurable: true,
    description: "Cuando un email masivo se envía exitosamente",
  },

  // ── CALENDAR ─────────────────────────────────────────────────────────────
  "CALENDAR.EVENT_CREATED": {
    label: "Nuevo Evento",
    category: "CALENDAR",
    icon: "CalendarPlus",
    color: "text-teal-400",
    defaultPriority: "NORMAL",
    defaultChannels: ["IN_APP"],
    linkTemplate: "/dashboard/events?date={date}",
    userConfigurable: true,
    description: "Cuando se crea un evento en el calendario",
  },
  "CALENDAR.REMINDER": {
    label: "Recordatorio de Evento",
    category: "CALENDAR",
    icon: "AlarmClock",
    color: "text-amber-400",
    defaultPriority: "HIGH",
    defaultChannels: ["IN_APP", "EMAIL", "PUSH"],
    linkTemplate: "/dashboard/events?date={date}",
    userConfigurable: true,
    description: "Recordatorio antes de un evento programado",
  },

  // ── CONTENT ──────────────────────────────────────────────────────────────
  "CONTENT.POST_PUBLISHED": {
    label: "Post Publicado",
    category: "CONTENT",
    icon: "BookOpen",
    color: "text-teal-400",
    defaultPriority: "LOW",
    defaultChannels: ["IN_APP"],
    linkTemplate: "/dashboard/posts?id={postId}",
    userConfigurable: true,
    description: "Cuando un artículo del blog se publica",
  },
  "CONTENT.COMMENT_NEW": {
    label: "Nuevo Comentario",
    category: "CONTENT",
    icon: "MessageCircle",
    color: "text-sky-400",
    defaultPriority: "NORMAL",
    defaultChannels: ["IN_APP"],
    linkTemplate: "/dashboard/posts?id={postId}",
    userConfigurable: true,
    description: "Cuando alguien comenta en un post",
  },

  // ── IAM ──────────────────────────────────────────────────────────────────
  "IAM.USER_INVITED": {
    label: "Nuevo Miembro Invitado",
    category: "IAM",
    icon: "UserPlus",
    color: "text-cyan-400",
    defaultPriority: "NORMAL",
    defaultChannels: ["IN_APP"],
    linkTemplate: "/dashboard/users",
    userConfigurable: true,
    description: "Cuando se invita a un nuevo miembro al equipo",
  },
  "IAM.ROLE_CHANGED": {
    label: "Rol Actualizado",
    category: "IAM",
    icon: "Shield",
    color: "text-amber-400",
    defaultPriority: "HIGH",
    defaultChannels: ["IN_APP", "EMAIL"],
    linkTemplate: "/dashboard/users",
    userConfigurable: false,
    description: "Cuando tu rol o permisos son modificados",
  },
  "IAM.SECURITY_ALERT": {
    label: "Alerta de Seguridad",
    category: "IAM",
    icon: "ShieldAlert",
    color: "text-red-500",
    defaultPriority: "URGENT",
    defaultChannels: ["IN_APP", "EMAIL", "PUSH"],
    linkTemplate: "/dashboard/security",
    userConfigurable: false,
    description: "Intentos de acceso sospechosos o cambios de seguridad críticos",
  },

  // ── SYSTEM ───────────────────────────────────────────────────────────────
  "SYSTEM.MAINTENANCE": {
    label: "Mantenimiento Programado",
    category: "SYSTEM",
    icon: "Wrench",
    color: "text-slate-400",
    defaultPriority: "NORMAL",
    defaultChannels: ["IN_APP"],
    userConfigurable: false,
    description: "Avisos de mantenimiento y actualizaciones del sistema",
  },
  "SYSTEM.WELCOME": {
    label: "Bienvenida",
    category: "SYSTEM",
    icon: "Sparkles",
    color: "text-teal-400",
    defaultPriority: "NORMAL",
    defaultChannels: ["IN_APP"],
    userConfigurable: false,
    description: "Mensaje de bienvenida para nuevos usuarios",
  },
} as const;

export type NotificationEventType = keyof typeof NOTIFICATION_EVENTS;

// ─── Helper: Get category icon and color ─────────────────────────────────────

export const CATEGORY_META: Record<NotificationCategory, { label: string; icon: string; color: string }> = {
  CRM:        { label: "CRM & Ventas",     icon: "Users",          color: "text-blue-400" },
  INBOX:      { label: "Inbox",            icon: "MessageSquare",  color: "text-sky-400" },
  AUTOMATION: { label: "Automatización",   icon: "Workflow",       color: "text-violet-400" },
  AI_ENGINE:  { label: "Agentes AI",       icon: "Bot",            color: "text-amber-400" },
  FINANCE:    { label: "Finanzas",         icon: "DollarSign",     color: "text-emerald-400" },
  MARKETING:  { label: "Marketing",        icon: "Megaphone",      color: "text-pink-400" },
  CALENDAR:   { label: "Calendario",       icon: "Calendar",       color: "text-teal-400" },
  CONTENT:    { label: "Contenido",        icon: "FileText",       color: "text-cyan-400" },
  IAM:        { label: "Seguridad & IAM",  icon: "Shield",         color: "text-amber-400" },
  SYSTEM:     { label: "Sistema",          icon: "Settings",       color: "text-slate-400" },
};
