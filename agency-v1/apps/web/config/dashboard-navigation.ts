/**
 * Centralized Domain Navigation Registry for Next.js Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Organizes 28 dashboard modules into 5 strongly-typed business domain categories.
 */

export interface NavigationItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  serviceKey: string;
}

export interface NavigationCategory {
  categoryName: string;
  categoryKey: string;
  items: NavigationItem[];
}

export const DASHBOARD_DOMAINS_NAVIGATION: NavigationCategory[] = [
  {
    categoryName: "💼 Comercial & CRM",
    categoryKey: "commercial_crm",
    items: [
      { title: "Gestión de Leads & Clientes", href: "/dashboard/client", icon: "👥", serviceKey: "crm-service" },
      { title: "Tablero Kanban de Tratos", href: "/dashboard/kanban", icon: "📊", serviceKey: "crm-service" },
      { title: "Agendación de Citas & Calendario", href: "/dashboard/calendar", icon: "📅", badge: "Nuevo", serviceKey: "calendar-service" },
      { title: "Inbox Multicanal", href: "/dashboard/inbox", icon: "💬", badge: "Live", serviceKey: "inbox-service" },
      { title: "Llamadas & Voz AI", href: "/dashboard/voice", icon: "🎙️", serviceKey: "ai-engine" },
    ],
  },
  {
    categoryName: "💰 Finanzas, POS & Nómina",
    categoryKey: "finance_pos",
    items: [
      { title: "Facturación Electrónica DIAN", href: "/dashboard/invoicing", icon: "📄", serviceKey: "finance-service" },
      { title: "Contabilidad & PUC / Libro Mayor", href: "/dashboard/accounting", icon: "📖", badge: "Nuevo", serviceKey: "finance-service" },
      { title: "Escáner OCR de Recibos", href: "/dashboard/invoicing/ocr-scanner", icon: "🧾", badge: "Nuevo", serviceKey: "finance-service" },
      { title: "Guardián Anti-Fraude AI", href: "/dashboard/invoicing/fraud-guard", icon: "🛡️", badge: "AI", serviceKey: "finance-service" },
      { title: "Punto de Venta POS", href: "/dashboard/pos", icon: "🛒", serviceKey: "pos-service" },
      { title: "Comisiones de Afiliados", href: "/dashboard/affiliate/commissions", icon: "💸", serviceKey: "affiliate-service" },
    ],
  },
  {
    categoryName: "🤖 Inteligencia Artificial & Automatización",
    categoryKey: "ai_automation",
    items: [
      { title: "Agentes Autónomos & RAG", href: "/dashboard/tools", icon: "🧠", serviceKey: "ai-engine" },
      { title: "Constructor de Webhooks", href: "/dashboard/tools/webhooks", icon: "🪝", serviceKey: "integration-service" },
      { title: "Explorador de API Pública", href: "/dashboard/tools/api-docs", icon: "🔑", serviceKey: "public-api-service" },
    ],
  },
  {
    categoryName: "🎥 Media & Marketing",
    categoryKey: "media_marketing",
    items: [
      { title: "Editor de Video & Subtítulos 9:16", href: "/dashboard/video", icon: "🎬", serviceKey: "video-service" },
      { title: "Campañas & Pruebas A/B", href: "/dashboard/marketing", icon: "🚀", serviceKey: "marketing-service" },
      { title: "Publicaciones en Redes", href: "/dashboard/posts", icon: "📱", serviceKey: "automation-service" },
    ],
  },
  {
    categoryName: "🛡️ Seguridad & Administración",
    categoryKey: "security_admin",
    items: [
      { title: "Monitor de SLA 99.99%", href: "/dashboard/security/sla", icon: "📉", badge: "99.99%", serviceKey: "analytics-service" },
      { title: "Seguridad & Auditoría GDPR", href: "/dashboard/security", icon: "🔒", serviceKey: "admin-service" },
      { title: "Roles & Permisos RBAC", href: "/dashboard/roles", icon: "🔑", serviceKey: "auth-service" },
      { title: "Ajustes de Empresa", href: "/dashboard/settings", icon: "⚙️", serviceKey: "admin-service" },
    ],
  },
];
