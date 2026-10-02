const fs = require('fs');
const path = 'apps/web/components/dashboard/DashboardSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

const newNavGroups = `const NAV_GROUPS: NavGroup[] = [
    {
        title: "Portal del Cliente", code: "CLIENT_PORTAL",
        accent: "teal", icon: <Briefcase size={20} />,
        items: [
            { href: "/dashboard/client", label: "Mi Resumen", icon: <LayoutDashboard size={14} />, code: "C_OVW" },
            { href: "/dashboard/client/proposals", label: "Mis Propuestas", icon: <FileText size={14} />, code: "C_QOT" },
            { href: "/dashboard/client/projects", label: "Mis Proyectos", icon: <Briefcase size={14} />, code: "C_PRJ" },
        ],
    },
    {
        title: "Ventas & Finanzas", code: "SALES_FIN",
        accent: "emerald", icon: <DollarSign size={20} />,
        items: [
            { href: "/dashboard", label: "Panel Principal", icon: <LayoutDashboard size={14} />, code: "DB_OVER" },
            { href: "/dashboard/sales-forecast", label: "Predicción de Ventas", icon: <TrendingUp size={14} />, code: "SIA" },
        ],
        subGroups: [
            {
                title: "Comercial & POS",
                items: [
                    { href: "/dashboard/pos", label: "Punto de Venta B2C", icon: <Scan size={14} />, code: "POS" },
                    { href: "/dashboard/catalog", label: "Catálogo e Inventario", icon: <ShoppingBag size={14} />, code: "CAT" },
                ]
            },
            {
                title: "Facturación & Contabilidad",
                items: [
                    { href: "/dashboard/invoicing", label: "Facturación B2B", icon: <FileCheck size={14} />, code: "INV" },
                    { href: "/dashboard/dian", label: "Cumplimiento DIAN", icon: <CheckSquare size={14} />, code: "DIAN" },
                    { href: "/dashboard/admin/treasury", label: "Tesorería & Cuentas", icon: <Landmark size={14} />, code: "TRS" },
                ]
            }
        ]
    },
    {
        title: "Marketing & CRM", code: "MKT_CRM",
        accent: "rose", icon: <Target size={20} />,
        items: [
            { href: "/dashboard/admin/crm/leads", label: "CRM Pipeline B2B", icon: <Users size={14} />, code: "CRM" },
        ],
        subGroups: [
            {
                title: "Campañas & Promociones",
                items: [
                    { href: "/dashboard/marketing/campaigns", label: "Campañas y Ads", icon: <Target size={14} />, code: "CMP" },
                    { href: "/dashboard/marketing/email-blast", label: "Email Blast", icon: <Mail size={14} />, code: "EML" },
                    { href: "/dashboard/promotions", label: "Promociones B2C", icon: <Sparkles size={14} />, code: "PRM" },
                ]
            },
            {
                title: "Growth & Rendimiento",
                items: [
                    { href: "/dashboard/seo", label: "Monitor SEO", icon: <Search size={14} />, code: "SEO" },
                    { href: "/dashboard/marketing/spend", label: "Ad Spend & ROAS", icon: <DollarSign size={14} />, code: "ROI" },
                ]
            },
            {
                title: "Red de Afiliados",
                items: [
                    { href: "/dashboard/affiliate", label: "Overview Afiliados", icon: <Share2 size={14} />, code: "AFF" },
                    { href: "/dashboard/affiliate/referrals", label: "Mis Referidos", icon: <Users size={14} />, code: "REF" },
                    { href: "/dashboard/affiliate/payouts", label: "Mis Pagos", icon: <Landmark size={14} />, code: "PAY" },
                    { href: "/dashboard/affiliate/plans", label: "Planes de Comisión", icon: <Percent size={14} />, code: "PLN" },
                ]
            }
        ]
    },
    {
        title: "Operaciones & RRHH", code: "OPS_HR",
        accent: "blue", icon: <Layers size={20} />,
        subGroups: [
            {
                title: "Operaciones",
                items: [
                    { href: "/dashboard/kanban", label: "Kanban Operativo", icon: <Trello size={14} />, code: "KBN" },
                    { href: "/dashboard/projects", label: "Gestión de Proyectos", icon: <Boxes size={14} />, code: "PRJ" },
                    { href: "/dashboard/events", label: "Calendario", icon: <Calendar size={14} />, code: "CAL" },
                ]
            },
            {
                title: "Recursos Humanos",
                items: [
                    { href: "/dashboard/admin/team", label: "Gestión de Equipo", icon: <UserCog size={14} />, code: "TEAM" },
                    { href: "/dashboard/admin/hr", label: "Time Tracking", icon: <Activity size={14} />, code: "HR" },
                    { href: "/dashboard/admin/payroll", label: "Nómina y PILA", icon: <CreditCard size={14} />, code: "PAY" },
                    { href: "/dashboard/admin/payroll/employees", label: "Personal y Contratistas", icon: <Users size={14} />, code: "EMP" },
                    { href: "/dashboard/admin/payroll/time-off", label: "Permisos y Vacaciones", icon: <Calendar size={14} />, code: "OFF" },
                    { href: "/dashboard/admin/payroll/expenses", label: "Gestión de Egresos", icon: <CreditCard size={14} />, code: "EXP" },
                    { href: "/dashboard/admin/payroll/reports", label: "Reportes RRHH", icon: <BarChart2 size={14} />, code: "REP" },
                ]
            }
        ]
    },
    {
        title: "Comunicación & Media", code: "COM_MED",
        accent: "violet", icon: <MessageSquare size={20} />,
        subGroups: [
            {
                title: "Atención y Soporte",
                items: [
                    { href: "/dashboard/inbox", label: "Inbox Omnicanal", icon: <MessageSquare size={14} />, code: "IBX" },
                    { href: "/dashboard/chat", label: "Chat Empresarial", icon: <MessageSquare size={14} />, code: "CHT" },
                ]
            },
            {
                title: "Contenido y Media",
                items: [
                    { href: "/dashboard/feed", label: "Muro Social", icon: <Share2 size={14} />, code: "FED" },
                    { href: "/dashboard/posts", label: "Artículos & CMS", icon: <FileText size={14} />, code: "CMS" },
                    { href: "/dashboard/video", label: "Video Studio Pro", icon: <Wand2 size={14} />, code: "VID" },
                    { href: "/dashboard/admin/marketing/creative-studio", label: "Creative Studio IA", icon: <Wand2 size={14} />, code: "CRE" },
                    { href: "/dashboard/voice", label: "Voice Studio", icon: <Wand2 size={14} />, code: "VOX" },
                    { href: "/dashboard/media", label: "Multimedia", icon: <ImageIcon size={14} />, code: "MED" },
                ]
            }
        ]
    },
    {
        title: "Sistema, IA & Seguridad", code: "SYS_AI",
        accent: "cyan", icon: <Settings size={20} />,
        items: [
            { href: "/dashboard/analytics", label: "Analítica General", icon: <BarChart2 size={14} />, code: "ANL" },
            { href: "/dashboard/admin/ai-insights", label: "AI Insights", icon: <Zap size={14} />, code: "INS" },
        ],
        subGroups: [
            {
                title: "Inteligencia Artificial",
                items: [
                    { href: "/dashboard/tools/master-hub", label: "Consola Maestra IA", icon: <Terminal size={14} />, code: "HUB" },
                    { href: "/dashboard/settings/agents", label: "Agentes Autónomos", icon: <Bot size={14} />, code: "AGT" },
                    { href: "/dashboard/settings/agents/teams", label: "Equipos de Agentes", icon: <Users size={14} />, code: "SWM" },
                    { href: "/dashboard/settings/agents/skillchains", label: "Cadenas Habilidades", icon: <Workflow size={14} />, code: "SKL" },
                    { href: "/dashboard/settings/agents/knowledge", label: "Bases Conocimiento", icon: <BookOpen size={14} />, code: "RAG" },
                ]
            },
            {
                title: "Desarrollo y APIs",
                items: [
                    { href: "/dashboard/admin/architecture", label: "Arquitectura Cloud", icon: <Network size={14} />, code: "ARC" },
                    { href: "/dashboard/admin/automation", label: "Automatización (RPA)", icon: <Workflow size={14} />, code: "BOT" },
                    { href: "/dashboard/tools/webhooks", label: "Webhooks", icon: <Workflow size={14} />, code: "WBH" },
                    { href: "/dashboard/tools/api-docs", label: "API Pública", icon: <Key size={14} />, code: "API" },
                    { href: "/dashboard/admin/marketing/settings", label: "Integraciones API", icon: <Settings size={14} />, code: "API" },
                ]
            },
            {
                title: "Seguridad y Auditoría",
                items: [
                    { href: "/dashboard/users", label: "Usuarios y Permisos", icon: <Shield size={14} />, code: "USR" },
                    { href: "/dashboard/roles", label: "Control de Roles", icon: <Shield size={14} />, code: "ROL" },
                    { href: "/dashboard/settings", label: "Configuración Sistema", icon: <Settings size={14} />, code: "CFG" },
                    { href: "/dashboard/security", label: "Seguridad y Auditoría", icon: <Lock size={14} />, code: "SEC" },
                    { href: "/dashboard/admin/audit-logs", label: "Logs Auditoría", icon: <FileText size={14} />, code: "LOG" },
                    { href: "/dashboard/security/audit-ledger", label: "Ledger Forense WORM", icon: <ShieldCheck size={14} />, code: "WRM" },
                    { href: "/dashboard/privacy-portal", label: "Portal GDPR", icon: <ShieldCheck size={14} />, code: "PRV" },
                    { href: "/dashboard/security/sla", label: "Monitor SLA 99.99%", icon: <Activity size={14} />, code: "SLA" },
                ]
            }
        ]
    },
];`;

const startIdx = content.indexOf('const NAV_GROUPS: NavGroup[] = [');
const endIdx = content.indexOf('];', startIdx) + 2;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newNavGroups + content.substring(endIdx);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Replaced successfully!");
} else {
  console.log("Could not find NAV_GROUPS");
}
