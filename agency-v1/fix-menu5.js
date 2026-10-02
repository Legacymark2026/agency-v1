const fs = require('fs');
const path = 'apps/web/components/dashboard/DashboardSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

const newNavGroups = 'const NAV_GROUPS: NavGroup[] = [\n' +
'    {\n' +
'        title: "Portal del Cliente", code: "CLIENT_PORTAL",\n' +
'        accent: "teal", icon: <Briefcase size={20} />,\n' +
'        items: [\n' +
'            { href: "/dashboard/client", label: "Mi Resumen", icon: <LayoutDashboard size={14} />, code: "C_OVW" },\n' +
'            { href: "/dashboard/client/proposals", label: "Mis Propuestas", icon: <FileText size={14} />, code: "C_QOT" },\n' +
'            { href: "/dashboard/client/projects", label: "Mis Proyectos", icon: <Briefcase size={14} />, code: "C_PRJ" },\n' +
'        ],\n' +
'    },\n' +
'    {\n' +
'        title: "Ventas & Finanzas", code: "SALES_FIN",\n' +
'        accent: "emerald", icon: <DollarSign size={20} />,\n' +
'        items: [\n' +
'            { href: "/dashboard", label: "Panel Principal", icon: <LayoutDashboard size={14} />, code: "DB_OVER" },\n' +
'            { href: "/dashboard/pos", label: "Punto de Venta B2C", icon: <Scan size={14} />, code: "POS" },\n' +
'            { href: "/dashboard/invoicing", label: "Facturación & DIAN", icon: <FileCheck size={14} />, code: "INV" },\n' +
'            { href: "/dashboard/catalog", label: "Catálogo e Inventario", icon: <ShoppingBag size={14} />, code: "CAT" },\n' +
'            { href: "/dashboard/admin/treasury", label: "Tesorería & Cuentas", icon: <Landmark size={14} />, code: "TRS" },\n' +
'            { href: "/dashboard/sales-forecast", label: "Predicción de Ventas", icon: <TrendingUp size={14} />, code: "SIA" },\n' +
'        ],\n' +
'    },\n' +
'    {\n' +
'        title: "Marketing & CRM", code: "MKT_CRM",\n' +
'        accent: "rose", icon: <Target size={20} />,\n' +
'        items: [\n' +
'            { href: "/dashboard/admin/crm/leads", label: "CRM B2B", icon: <Users size={14} />, code: "CRM" },\n' +
'            { href: "/dashboard/marketing/campaigns", label: "Campañas y Ads", icon: <Target size={14} />, code: "CMP" },\n' +
'            { href: "/dashboard/marketing/email-blast", label: "Email Blast", icon: <Mail size={14} />, code: "EML" },\n' +
'            { href: "/dashboard/promotions", label: "Promociones B2C", icon: <Sparkles size={14} />, code: "PRM" },\n' +
'            { href: "/dashboard/seo", label: "Monitor SEO", icon: <Search size={14} />, code: "SEO" },\n' +
'            { href: "/dashboard/affiliate", label: "Programa Afiliados", icon: <Share2 size={14} />, code: "AFF" },\n' +
'        ],\n' +
'    },\n' +
'    {\n' +
'        title: "Operaciones & RRHH", code: "OPS_HR",\n' +
'        accent: "blue", icon: <Layers size={20} />,\n' +
'        items: [\n' +
'            { href: "/dashboard/kanban", label: "Kanban Operativo", icon: <Trello size={14} />, code: "KBN" },\n' +
'            { href: "/dashboard/projects", label: "Proyectos", icon: <Boxes size={14} />, code: "PRJ" },\n' +
'            { href: "/dashboard/events", label: "Calendario", icon: <Calendar size={14} />, code: "CAL" },\n' +
'            { href: "/dashboard/admin/payroll", label: "Nómina y RRHH", icon: <CreditCard size={14} />, code: "PAY" },\n' +
'            { href: "/dashboard/admin/team", label: "Gestión de Equipo", icon: <UserCog size={14} />, code: "TEAM" },\n' +
'        ],\n' +
'    },\n' +
'    {\n' +
'        title: "Comunicación & Media", code: "COM_MED",\n' +
'        accent: "violet", icon: <MessageSquare size={20} />,\n' +
'        items: [\n' +
'            { href: "/dashboard/inbox", label: "Inbox Omnicanal", icon: <MessageSquare size={14} />, code: "IBX" },\n' +
'            { href: "/dashboard/chat", label: "Chat Empresarial", icon: <MessageSquare size={14} />, code: "CHT" },\n' +
'            { href: "/dashboard/feed", label: "Muro Social", icon: <Share2 size={14} />, code: "FED" },\n' +
'            { href: "/dashboard/posts", label: "Artículos & CMS", icon: <FileText size={14} />, code: "CMS" },\n' +
'            { href: "/dashboard/video", label: "Video Studio Pro", icon: <Wand2 size={14} />, code: "VID" },\n' +
'            { href: "/dashboard/media", label: "Multimedia", icon: <ImageIcon size={14} />, code: "MED" },\n' +
'        ],\n' +
'    },\n' +
'    {\n' +
'        title: "Sistema & IA", code: "SYS_AI",\n' +
'        accent: "cyan", icon: <Settings size={20} />,\n' +
'        items: [\n' +
'            { href: "/dashboard/analytics", label: "Analítica General", icon: <BarChart2 size={14} />, code: "ANL" },\n' +
'            { href: "/dashboard/tools/master-hub", label: "Consola Maestra IA", icon: <Terminal size={14} />, code: "HUB" },\n' +
'            { href: "/dashboard/settings/agents", label: "Agentes Autónomos", icon: <Bot size={14} />, code: "AGT" },\n' +
'            { href: "/dashboard/users", label: "Usuarios y Permisos", icon: <Shield size={14} />, code: "USR" },\n' +
'            { href: "/dashboard/settings", label: "Configuración Sistema", icon: <Settings size={14} />, code: "CFG" },\n' +
'            { href: "/dashboard/security", label: "Seguridad y Auditoría", icon: <Lock size={14} />, code: "SEC" },\n' +
'            { href: "/dashboard/privacy-portal", label: "Portal GDPR", icon: <ShieldCheck size={14} />, code: "PRV" },\n' +
'        ],\n' +
'    },\n' +
'];';

const startIdx = content.indexOf('const NAV_GROUPS: NavGroup[] = [');
const endIdx = content.indexOf('];', startIdx) + 2;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newNavGroups + content.substring(endIdx);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Replaced successfully!");
} else {
  console.log("Could not find NAV_GROUPS");
}
