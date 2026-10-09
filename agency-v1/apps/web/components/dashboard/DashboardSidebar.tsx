"use client";

import React from "react";
import {
    LayoutDashboard, Users, Settings, FileText,
    Shield, ShieldCheck, BookOpen, Briefcase, BarChart2, Workflow,
    MessageSquare, Target, TrendingUp, Link2, Building2, ShoppingCart,
    Lock, Scale, DollarSign, CheckSquare, Zap, Mail, Calendar, Wand2,
    Activity, Wifi, Bot, Trello, CreditCard, Landmark,
    Image as ImageIcon, Share2, Percent, ShoppingBag, Package,
    Scan, AlertTriangle, Key, Terminal, Network, Layers, Sparkles,
    Boxes, Truck, Clock, Sliders, FileSpreadsheet, UserCheck
} from "lucide-react";
import { AreaModulesAccordion, NavArea, NavModule, NavSubmodule } from "./AreaModulesAccordion";
import { SidebarClientContent } from "./sidebar-client-content";

export type { NavArea, NavModule, NavSubmodule };

export const NAV_AREAS: NavArea[] = [
    {
        title: "Portal del Cliente",
        code: "CLIENT",
        accent: "teal",
        icon: <Briefcase size={20} />,
        settingsHref: "/dashboard/client",
        settingsLabel: "Ajustes de Portal",
        modules: [
            {
                title: "Resumen y Proyectos",
                code: "PRJ",
                icon: <LayoutDashboard size={15} />,
                submodules: [
                    { href: "/dashboard/client", label: "Mi Resumen Ejecutivo", icon: <LayoutDashboard size={13} />, code: "OVW" },
                    { href: "/dashboard/client/projects", label: "Mis Proyectos Activos", icon: <Briefcase size={13} />, code: "ACT" },
                ]
            },
            {
                title: "Propuestas & Acuerdos",
                code: "DOC",
                icon: <FileText size={15} />,
                submodules: [
                    { href: "/dashboard/client/proposals", label: "Mis Propuestas (e-Sign)", icon: <FileText size={13} />, code: "QOT" },
                ]
            }
        ]
    },
    {
        title: "Comercial & Ventas",
        code: "SALES",
        accent: "emerald",
        icon: <TrendingUp size={20} />,
        settingsHref: "/dashboard/settings/sales",
        settingsLabel: "Configuración de Ventas",
        modules: [
            {
                title: "Terminal POS y Caja",
                code: "POS_MOD",
                icon: <ShoppingBag size={15} />,
                submodules: [
                    { href: "/dashboard/pos", label: "Terminal de Caja POS", icon: <ShoppingBag size={13} />, code: "POS" },
                    { href: "/dashboard/sales-forecast", label: "Tabulación & Proyección", icon: <TrendingUp size={13} />, code: "FCT" },
                    { href: "/dashboard/catalog", label: "Catálogo & Productos", icon: <Package size={13} />, code: "CAT" },
                ]
            },
            {
                title: "CRM & Prospección",
                code: "CRM_MOD",
                icon: <Users size={15} />,
                submodules: [
                    { href: "/dashboard/admin/crm", label: "Command Center CRM", icon: <TrendingUp size={13} />, code: "OVW" },
                    { href: "/dashboard/admin/crm/leads", label: "Gestión de Leads", icon: <Users size={13} />, code: "LDS" },
                    { href: "/dashboard/admin/crm/scoring", label: "Scoring Predictivo", icon: <Zap size={13} />, code: "SCR" },
                    { href: "/dashboard/admin/crm/assignment", label: "Enrutamiento & Asignación", icon: <Workflow size={13} />, code: "RUT" },
                    { href: "/dashboard/admin/crm/pipeline", label: "Pipeline & Deals", icon: <Briefcase size={13} />, code: "PIP" },
                    { href: "/dashboard/admin/crm/tasks", label: "Tareas Comerciales", icon: <CheckSquare size={13} />, code: "TSK" },
                ]
            },
            {
                title: "CPQ & Cotizaciones",
                code: "CPQ_MOD",
                icon: <Layers size={15} />,
                submodules: [
                    { href: "/dashboard/admin/proposals", label: "Cotizaciones (e-Sign)", icon: <FileText size={13} />, code: "QOT" },
                    { href: "/dashboard/admin/sales", label: "Hub CPQ Enterprise", icon: <Layers size={13} />, code: "CPQ" },
                    { href: "/dashboard/admin/sales/goals", label: "Metas de Ventas", icon: <Target size={13} />, code: "GLS" },
                    { href: "/dashboard/admin/crm/commissions", label: "Comisiones de Venta", icon: <DollarSign size={13} />, code: "COM" },
                    { href: "/dashboard/admin/crm/reports", label: "Reportes Comerciales", icon: <BarChart2 size={13} />, code: "RPT" },
                ]
            },
            {
                title: "Secuencias y Plantillas",
                code: "SEQ_MOD",
                icon: <Workflow size={15} />,
                submodules: [
                    { href: "/dashboard/admin/crm/sequences", label: "Secuencias Automatizadas", icon: <Workflow size={13} />, code: "SEQ" },
                    { href: "/dashboard/admin/crm/templates", label: "Plantillas de Correo", icon: <FileText size={13} />, code: "TMP" },
                ]
            }
        ]
    },
    {
        title: "Finanzas & Contabilidad",
        code: "FINANCE",
        accent: "emerald",
        icon: <DollarSign size={20} />,
        settingsHref: "/dashboard/settings/billing",
        settingsLabel: "Configuración Financiera",
        modules: [
            {
                title: "Facturación Electrónica DIAN",
                code: "DIAN_MOD",
                icon: <ShieldCheck size={15} />,
                submodules: [
                    { href: "/dashboard/invoicing", label: "Facturas DIAN & B2B", icon: <ShieldCheck size={13} />, code: "FAC" },
                    { href: "/dashboard/invoicing/ocr-scanner", label: "Escáner OCR Recibos", icon: <Scan size={13} />, code: "OCR" },
                    { href: "/dashboard/invoicing/fraud-guard", label: "Guardián Anti-Fraude", icon: <AlertTriangle size={13} />, code: "FRD" },
                ]
            },
            {
                title: "Contabilidad & Libros",
                code: "ACC_MOD",
                icon: <BookOpen size={15} />,
                submodules: [
                    { href: "/dashboard/accounting", label: "Contabilidad & PUC", icon: <BookOpen size={13} />, code: "ACC" },
                    { href: "/dashboard/accounting/costs", label: "Centro de Costos", icon: <BarChart2 size={13} />, code: "CST" },
                ]
            },
            {
                title: "Tesorería & Pasarelas",
                code: "TRS_MOD",
                icon: <Landmark size={15} />,
                submodules: [
                    { href: "/dashboard/admin/treasury", label: "Control de Tesorería", icon: <Landmark size={13} />, code: "TRS" },
                    { href: "/dashboard/settings/billing/gateways", label: "Pasarelas de Pago (BYOG)", icon: <CreditCard size={13} />, code: "GWY" },
                    { href: "/dashboard/settings/billing", label: "Suscripción & Plan", icon: <CreditCard size={13} />, code: "PLN" },
                ]
            }
        ]
    },
    {
        title: "Marketing & Growth",
        code: "MARKETING",
        accent: "rose",
        icon: <Target size={20} />,
        settingsHref: "/dashboard/admin/marketing/settings",
        settingsLabel: "Configuración de Marketing",
        modules: [
            {
                title: "Estrategia & Campañas",
                code: "CMP_MOD",
                icon: <Target size={15} />,
                submodules: [
                    { href: "/dashboard/marketing", label: "CMO Dashboard", icon: <BarChart2 size={13} />, code: "CMO" },
                    { href: "/dashboard/marketing/enterprise", label: "Suite Enterprise", icon: <Sparkles size={13} />, code: "ENT" },
                    { href: "/dashboard/marketing/campaigns", label: "Campañas en Vivo", icon: <Target size={13} />, code: "LIV" },
                    { href: "/dashboard/admin/marketing/approvals", label: "Aprobaciones", icon: <CheckSquare size={13} />, code: "APP" },
                    { href: "/dashboard/marketing/calendar", label: "Calendario de Publicación", icon: <Calendar size={13} />, code: "CAL" },
                ]
            },
            {
                title: "Automatización & Tráfico",
                code: "TRF_MOD",
                icon: <Zap size={15} />,
                submodules: [
                    { href: "/dashboard/marketing/automation", label: "Automatización de Flujos", icon: <Zap size={13} />, code: "AUT" },
                    { href: "/dashboard/marketing/email-blast", label: "Email Masivo & Broadcast", icon: <Mail size={13} />, code: "EML" },
                    { href: "/dashboard/marketing/listening", label: "Social Listening & Radar", icon: <Wifi size={13} />, code: "LST" },
                    { href: "/dashboard/marketing/spend", label: "Ad Spend & ROAS", icon: <DollarSign size={13} />, code: "ROI" },
                    { href: "/dashboard/marketing/links", label: "Link Tracker", icon: <Link2 size={13} />, code: "TRK" },
                    { href: "/dashboard/seo", label: "Monitor SEO Orgánico", icon: <Wifi size={13} />, code: "SEO" },
                ]
            },
            {
                title: "Promociones & Afiliados",
                code: "AFL_MOD",
                icon: <Share2 size={15} />,
                submodules: [
                    { href: "/dashboard/promotions", label: "Promociones & Cupones", icon: <Percent size={13} />, code: "PRM" },
                    { href: "/dashboard/affiliate", label: "Overview Afiliados", icon: <Share2 size={13} />, code: "OVW" },
                    { href: "/dashboard/affiliate/referrals", label: "Referidos y Clientes", icon: <Users size={13} />, code: "REF" },
                    { href: "/dashboard/affiliate/payouts", label: "Pagos de Comisiones", icon: <Landmark size={13} />, code: "PAY" },
                    { href: "/dashboard/affiliate/plans", label: "Planes de Afiliación", icon: <Percent size={13} />, code: "PLN" },
                ]
            }
        ]
    },
    {
        title: "Operaciones & Logística",
        code: "OPS",
        accent: "blue",
        icon: <Boxes size={20} />,
        settingsHref: "/dashboard/settings/operations",
        settingsLabel: "Configuración Operativa",
        modules: [
            {
                title: "Inventario y Canales",
                code: "INV_MOD",
                icon: <Boxes size={15} />,
                submodules: [
                    { href: "/dashboard/inventory", label: "Inventario & Bodegas", icon: <Boxes size={13} />, code: "INV" },
                    { href: "/dashboard/purchases", label: "Compras & Órdenes", icon: <ShoppingCart size={13} />, code: "PUR" },
                    { href: "/dashboard/suppliers", label: "Proveedores & SRM", icon: <Building2 size={13} />, code: "SUP" },
                    { href: "/dashboard/channels", label: "Canales y Logística", icon: <Building2 size={13} />, code: "CHL" },
                ]
            },
            {
                title: "Servicios y Citas",
                code: "SVC_MOD",
                icon: <Calendar size={15} />,
                submodules: [
                    { href: "/dashboard/booking", label: "Políticas de Citas", icon: <Clock size={13} />, code: "BKG" },
                    { href: "/dashboard/calendar", label: "Agendación & Reuniones", icon: <Calendar size={13} />, code: "CAL" },
                    { href: "/dashboard/events", label: "Calendario de Eventos", icon: <Calendar size={13} />, code: "EVT" },
                ]
            },
            {
                title: "Gestión de Portafolio",
                code: "PRJ_MOD",
                icon: <Briefcase size={15} />,
                submodules: [
                    { href: "/dashboard/projects", label: "Portafolio de Proyectos", icon: <Briefcase size={13} />, code: "PRJ" },
                    { href: "/dashboard/kanban", label: "Tableros Operativos", icon: <Trello size={13} />, code: "KBN" },
                ]
            }
        ]
    },
    {
        title: "Talento Humano & Nómina",
        code: "HR",
        accent: "indigo",
        icon: <Users size={20} />,
        settingsHref: "/dashboard/settings/hr",
        settingsLabel: "Configuración de RRHH",
        modules: [
            {
                title: "Nómina Electrónica & PILA",
                code: "PAY_MOD",
                icon: <DollarSign size={15} />,
                submodules: [
                    { href: "/dashboard/admin/payroll", label: "Nómina Electrónica DIAN", icon: <DollarSign size={13} />, code: "PAY" },
                    { href: "/dashboard/admin/payroll/expenses", label: "Gestión de Egresos & Viáticos", icon: <CreditCard size={13} />, code: "EXP" },
                    { href: "/dashboard/admin/payroll/reports", label: "Reportes & Certificados", icon: <BarChart2 size={13} />, code: "REP" },
                ]
            },
            {
                title: "Colaboradores y Personal",
                code: "EMP_MOD",
                icon: <Users size={15} />,
                submodules: [
                    { href: "/dashboard/admin/payroll/employees", label: "Personal y Contratistas", icon: <Users size={13} />, code: "EMP" },
                    { href: "/dashboard/admin/hr", label: "Gestión RRHH & Turnos", icon: <Activity size={13} />, code: "HR" },
                    { href: "/dashboard/settings/members", label: "Miembros de Plataforma", icon: <UserCheck size={13} />, code: "MBR" },
                ]
            }
        ]
    },
    {
        title: "Soporte & Comunicaciones",
        code: "SUPPORT",
        accent: "violet",
        icon: <MessageSquare size={20} />,
        settingsHref: "/dashboard/settings/support",
        settingsLabel: "Configuración de Soporte",
        modules: [
            {
                title: "Bandejas Omnicanal",
                code: "INB_MOD",
                icon: <Mail size={15} />,
                submodules: [
                    { href: "/dashboard/inbox", label: "Inbox Unificado", icon: <Mail size={13} />, code: "INB" },
                    { href: "/dashboard/chat", label: "Chat Empresarial", icon: <MessageSquare size={13} />, code: "CHT" },
                ]
            },
            {
                title: "Herramientas de Agentes",
                code: "MAC_MOD",
                icon: <Sliders size={15} />,
                submodules: [
                    { href: "/dashboard/settings/inbox/macros", label: "Macros de Inbox", icon: <Sliders size={13} />, code: "MAC" },
                    { href: "/dashboard/settings/agents/teams", label: "Swarms de Soporte", icon: <Users size={13} />, code: "SWM" },
                ]
            }
        ]
    },
    {
        title: "Contenido & Media",
        code: "MEDIA",
        accent: "violet",
        icon: <Wand2 size={20} />,
        settingsHref: "/dashboard/settings/media",
        settingsLabel: "Configuración de Media",
        modules: [
            {
                title: "Publicaciones & Blog",
                code: "BLG_MOD",
                icon: <Share2 size={15} />,
                submodules: [
                    { href: "/dashboard/feed", label: "Muro de Publicaciones", icon: <Share2 size={13} />, code: "FED" },
                    { href: "/dashboard/posts", label: "Artículos & Noticias", icon: <BookOpen size={13} />, code: "BLG" },
                    { href: "/dashboard/posts/comments", label: "Moderación Comentarios", icon: <MessageSquare size={13} />, code: "CMT" },
                    { href: "/dashboard/posts/categories", label: "Categorías de Contenido", icon: <FileText size={13} />, code: "CAT" },
                ]
            },
            {
                title: "Creative Studios IA",
                code: "STU_MOD",
                icon: <Wand2 size={15} />,
                submodules: [
                    { href: "/dashboard/media", label: "Bóveda Multimedia", icon: <ImageIcon size={13} />, code: "MED" },
                    { href: "/dashboard/video", label: "Video Studio Pro (9:16)", icon: <Wand2 size={13} />, code: "VED" },
                    { href: "/dashboard/voice", label: "Voice Studio (Voicebox)", icon: <Wand2 size={13} />, code: "VOX" },
                    { href: "/dashboard/admin/marketing/creative-studio", label: "Creative Studio IA", icon: <Sparkles size={13} />, code: "CRE" },
                ]
            }
        ]
    },
    {
        title: "Inteligencia Artificial",
        code: "AI",
        accent: "cyan",
        icon: <Bot size={20} />,
        settingsHref: "/dashboard/settings/agents",
        settingsLabel: "Configuración de Modelos IA",
        modules: [
            {
                title: "Agentes Cognitivos",
                code: "AGT_MOD",
                icon: <Bot size={15} />,
                submodules: [
                    { href: "/dashboard/settings/agents", label: "Directorio de Agentes", icon: <Bot size={13} />, code: "AGT" },
                    { href: "/dashboard/settings/agents/teams", label: "Equipos Autónomos (Swarms)", icon: <Users size={13} />, code: "SWM" },
                    { href: "/dashboard/settings/agents/delegation", label: "Delegación & Permisos", icon: <ShieldCheck size={13} />, code: "DEL" },
                ]
            },
            {
                title: "Conocimiento & RAG",
                code: "RAG_MOD",
                icon: <BookOpen size={15} />,
                submodules: [
                    { href: "/dashboard/settings/agents/knowledge", label: "Bases de Conocimiento RAG", icon: <BookOpen size={13} />, code: "RAG" },
                    { href: "/dashboard/settings/agents/skillchains", label: "Cadenas de Habilidades", icon: <Workflow size={13} />, code: "SKL" },
                    { href: "/dashboard/admin/ai-insights", label: "Insights Predictivos IA", icon: <Zap size={13} />, code: "INS" },
                ]
            },
            {
                title: "Herramientas de IA",
                code: "HUB_MOD",
                icon: <Terminal size={15} />,
                submodules: [
                    { href: "/dashboard/tools/master-hub", label: "Consola de Herramientas", icon: <Terminal size={13} />, code: "HUB" },
                ]
            }
        ]
    },
    {
        title: "Desarrollo & APIs",
        code: "DEV",
        accent: "cyan",
        icon: <Terminal size={20} />,
        settingsHref: "/dashboard/settings/developer",
        settingsLabel: "Configuración de Developer",
        modules: [
            {
                title: "Conectores y Webhooks",
                code: "WBH_MOD",
                icon: <Workflow size={15} />,
                submodules: [
                    { href: "/dashboard/tools/webhooks", label: "Constructor de Webhooks", icon: <Workflow size={13} />, code: "WBH" },
                    { href: "/dashboard/tools/api-docs", label: "Explorador API Pública", icon: <Key size={13} />, code: "API" },
                    { href: "/dashboard/settings/developer", label: "Claves de API y Tokens", icon: <Key size={13} />, code: "KEY" },
                ]
            },
            {
                title: "Workflows y Arquitectura",
                code: "ARC_MOD",
                icon: <Network size={15} />,
                submodules: [
                    { href: "/dashboard/admin/automation", label: "Automatización de Workflows", icon: <Workflow size={13} />, code: "BOT" },
                    { href: "/dashboard/admin/architecture", label: "Arquitectura Microservicios", icon: <Network size={13} />, code: "ARC" },
                ]
            }
        ]
    },
    {
        title: "Organización & Gobernanza",
        code: "SYSTEM",
        accent: "slate",
        icon: <Building2 size={20} />,
        settingsHref: "/dashboard/settings?category=org",
        settingsLabel: "Configuración de Gobernanza",
        modules: [
            {
                title: "Gobernanza & Políticas",
                code: "GOV_MOD",
                icon: <Scale size={15} />,
                submodules: [
                    { href: "/dashboard/settings/financial-policies", label: "Políticas de Aprobación & Umbrales de Compra", icon: <Scale size={13} />, code: "POL" },
                    { href: "/dashboard/settings/company", label: "Compañía & Organización", icon: <Building2 size={13} />, code: "ORG" },
                    { href: "/dashboard/settings/roles", label: "Control de Roles & RBAC", icon: <Shield size={13} />, code: "ROL" },
                    { href: "/dashboard/settings/system-parameters", label: "Parámetros del Sistema", icon: <Sliders size={13} />, code: "PAR" },
                ]
            },
            {
                title: "Supervisión de Plataforma",
                code: "OPS_SYS",
                icon: <LayoutDashboard size={15} />,
                submodules: [
                    { href: "/dashboard", label: "Tablero General", icon: <LayoutDashboard size={13} />, code: "OVW" },
                    { href: "/dashboard/analytics", label: "Analítica Web Global", icon: <BarChart2 size={13} />, code: "ANL" },
                    { href: "/dashboard/security/sla", label: "Monitor de SLA 99.99%", icon: <Activity size={13} />, code: "SLA" },
                ]
            },
            {
                title: "Identidad y Accesos",
                code: "IAM_SYS",
                icon: <Users size={15} />,
                submodules: [
                    { href: "/dashboard/users", label: "Directorio de Usuarios", icon: <Users size={13} />, code: "USR" },
                    { href: "/dashboard/settings/roles", label: "Roles y Permisos (RBAC)", icon: <Shield size={13} />, code: "ROL" },
                ]
            },
            {
                title: "Seguridad y Compliance",
                code: "SEC_SYS",
                icon: <Lock size={15} />,
                submodules: [
                    { href: "/dashboard/security", label: "Auditoría Forense & Logs", icon: <Lock size={13} />, code: "SEC" },
                    { href: "/dashboard/privacy-portal", label: "Portal Privacidad & GDPR", icon: <ShieldCheck size={13} />, code: "PRV" },
                    { href: "/dashboard/settings/pos", label: "Terminal POS Enterprise", icon: <ShoppingBag size={13} />, code: "POS" },
                ]
            }
        ]
    }
];

interface DashboardSidebarProps {
    role: string;
    name: string | null | undefined;
    email: string | null | undefined;
    image?: string | null | undefined;
    companyLogoUrl?: string | null;
    accessibleRoutes: string[];
    badge: { label: string; color: string };
}

export function DashboardSidebar({ role, name, email, image, companyLogoUrl, accessibleRoutes, badge }: DashboardSidebarProps) {
    const isSuperAdmin = role === "super_admin" || role === "SUPER_ADMIN";

    // Dynamic adaptation for super_admin vs company admin on roles route
    const dynamicNavAreas = NAV_AREAS.map((area) => {
        if (area.code !== "SYSTEM") return area;
        return {
            ...area,
            modules: area.modules.map((mod) => {
                if (mod.code !== "IAM_SYS") return mod;
                return {
                    ...mod,
                    submodules: mod.submodules?.map((sub) => {
                        if (sub.code === "ROL") {
                            return {
                                ...sub,
                                href: "/dashboard/settings/roles",
                                label: "Roles y Permisos (RBAC)",
                            };
                        }
                        return sub;
                    })
                };
            })
        };
    });

    return (
        <aside
            className="flex flex-row h-full shrink-0 relative transition-all duration-300 ease-in-out"
            style={{
                background: "rgba(2,6,23,0.97)",
                borderRight: "1px solid rgba(30,41,59,0.6)",
            }}
        >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

            <SidebarClientContent
                navAreas={dynamicNavAreas}
                accessibleRoutes={accessibleRoutes}
                companyLogoUrl={companyLogoUrl}
                name={name}
                email={email}
                role={role}
                badge={badge}
            />
        </aside>
    );
}
