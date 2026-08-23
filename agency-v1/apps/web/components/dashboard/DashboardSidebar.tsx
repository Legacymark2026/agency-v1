"use client";

import Link from "next/link";
import {
    LayoutDashboard, Users, Settings, FileText, LogOut,
    Shield, ShieldCheck, BookOpen, Briefcase, BarChart2, Workflow,
    MessageSquare, Target, TrendingUp, Link2, Building2,
    Lock, UserCog, DollarSign, CheckSquare, Zap, Mail, Calendar, Wand2,
    Activity, Wifi, Bot, Trello, CreditCard, Landmark, ChevronLeft, ChevronRight,
    PanelLeftClose, PanelLeft, Image as ImageIcon, Share2, Percent, MousePointerClick, ShoppingBag, Package,
    Cpu, Scan, AlertTriangle, Key, Terminal, Network, Search, Award, Layers
} from "lucide-react";
import { signOut } from "@/lib/auth";
import Image from "next/image";
import { NotificationBell } from "./notification-bell";
import { SidebarClientContent } from "./sidebar-client-content";

interface NavItem { href: string; label: string; icon: React.ReactNode; code?: string; }
interface NavGroup { title: string; code: string; accent?: string; icon?: React.ReactNode; items: NavItem[]; }

const NAV_GROUPS: NavGroup[] = [
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
        title: "Dashboard", code: "DB_MAIN",
        accent: "teal", icon: <LayoutDashboard size={20} />,
        items: [
            { href: "/dashboard", label: "Vista General", icon: <LayoutDashboard size={14} />, code: "OVW" },
        ],
    },
    {
        title: "Operaciones & Facturación", code: "OPS_CRM",
        accent: "amber", icon: <Briefcase size={20} />,
        items: [
            { href: "/dashboard/pos", label: "Terminal POS (Caja)", icon: <ShoppingBag size={14} />, code: "POS" },
            { href: "/dashboard/invoicing", label: "Facturación DIAN & RADIAN", icon: <ShieldCheck size={14} />, code: "FAC" },
            { href: "/dashboard/accounting", label: "Contabilidad & PUC / Libro Mayor", icon: <BookOpen size={14} />, code: "ACC" },
            { href: "/dashboard/calendar", label: "Agendación de Citas & Videollamadas", icon: <Calendar size={14} />, code: "CAL" },
            { href: "/dashboard/invoicing/ocr-scanner", label: "Escáner OCR Recibos", icon: <Scan size={14} />, code: "OCR" },
            { href: "/dashboard/invoicing/fraud-guard", label: "Guardián Anti-Fraude", icon: <AlertTriangle size={14} />, code: "FRD" },
            { href: "/dashboard/catalog", label: "Catálogo & Productos", icon: <Package size={14} />, code: "CAT" },
            { href: "/dashboard/promotions", label: "Promociones & Cupones", icon: <Percent size={14} />, code: "PRM" },
            { href: "/dashboard/admin/crm", label: "Command Center CRM", icon: <TrendingUp size={14} />, code: "OVW" },
            { href: "/dashboard/admin/crm/leads", label: "Leads", icon: <Users size={14} />, code: "LDS" },
            { href: "/dashboard/admin/crm/scoring", label: "Scoring Predictivo Leads", icon: <Zap size={14} />, code: "SCR" },
            { href: "/dashboard/admin/crm/assignment", label: "Asignación de Leads", icon: <Workflow size={14} />, code: "RUT" },
            { href: "/dashboard/admin/crm/pipeline", label: "Pipeline & Deals", icon: <Briefcase size={14} />, code: "PIP" },
            { href: "/dashboard/admin/crm/sequences", label: "Secuencias Automatizadas CRM", icon: <Workflow size={14} />, code: "SEQ" },
            { href: "/dashboard/admin/crm/templates", label: "Plantillas de Correo CRM", icon: <FileText size={14} />, code: "TMP" },
            { href: "/dashboard/admin/proposals", label: "Cotizaciones (e-Sign)", icon: <FileText size={14} />, code: "QOT" },
            { href: "/dashboard/admin/sales", label: "Hub Comercial & CPQ Enterprise", icon: <Layers size={14} />, code: "CPQ" },
            { href: "/dashboard/admin/sales/goals", label: "Metas de Ventas", icon: <Target size={14} />, code: "GLS" },
            { href: "/dashboard/admin/crm/commissions", label: "Comisiones", icon: <DollarSign size={14} />, code: "COM" },
            { href: "/dashboard/admin/crm/tasks", label: "Tareas del Equipo", icon: <CheckSquare size={14} />, code: "TSK" },
        ],
    },
    {
        title: "Marketing y Campañas", code: "MKT_CONTENT",
        accent: "teal", icon: <Target size={20} />,
        items: [
            { href: "/dashboard/marketing", label: "CMO Dashboard", icon: <BarChart2 size={14} />, code: "CMO" },
            { href: "/dashboard/marketing/campaigns", label: "Campañas (Live)", icon: <Target size={14} />, code: "LIV" },
            { href: "/dashboard/admin/marketing/approvals", label: "Aprobaciones de Campaña", icon: <CheckSquare size={14} />, code: "APP" },
            { href: "/dashboard/marketing/automation", label: "Automatización Marketing", icon: <Zap size={14} />, code: "AUT" },
            { href: "/dashboard/marketing/calendar", label: "Planificador & Calendario", icon: <Calendar size={14} />, code: "PUB" },
            { href: "/dashboard/marketing/email-blast", label: "Email Masivo & Broadcast", icon: <Mail size={14} />, code: "EML" },
            { href: "/dashboard/marketing/listening", label: "Social Listening & Radar", icon: <Wifi size={14} />, code: "LST" },
            { href: "/dashboard/posts", label: "Blog & Contenidos", icon: <BookOpen size={14} />, code: "BLG" },
            { href: "/dashboard/posts/comments", label: "Comentarios", icon: <MessageSquare size={14} />, code: "CMT" },
            { href: "/dashboard/posts/categories", label: "Categorías", icon: <FileText size={14} />, code: "CAT" },
            { href: "/dashboard/projects", label: "Portafolio", icon: <Briefcase size={14} />, code: "PRJ" },
            { href: "/dashboard/media", label: "Bóveda Media", icon: <ImageIcon size={14} />, code: "MED" },
            { href: "/dashboard/marketing/pricing", label: "Tarifario", icon: <Building2 size={14} />, code: "PRC" },
            { href: "/dashboard/marketing/links", label: "Link Tracker", icon: <Link2 size={14} />, code: "TRK" },
        ],
    },
    {
        title: "IA, Video & Herramientas", code: "AI_CREATIVE",
        accent: "cyan", icon: <Wand2 size={20} />,
        items: [
            { href: "/dashboard/tools/master-hub", label: "Consola Maestra de Herramientas", icon: <Terminal size={14} />, code: "HUB" },
            { href: "/dashboard/video", label: "Video Studio Pro (9:16)", icon: <Wand2 size={14} />, code: "VED" },
            { href: "/dashboard/admin/marketing/creative-studio", label: "Creative Studio IA", icon: <Wand2 size={14} />, code: "CRE" },
            { href: "/dashboard/voice", label: "Voice Studio (Voicebox)", icon: <Wand2 size={14} />, code: "VOX" },
            { href: "/dashboard/settings/agents", label: "Agentes Autónomos IA", icon: <Bot size={14} />, code: "AGT" },
            { href: "/dashboard/settings/agents/teams", label: "Equipos de Agentes (Swarm)", icon: <Users size={14} />, code: "SWM" },
            { href: "/dashboard/settings/agents/skillchains", label: "Cadenas de Habilidades", icon: <Workflow size={14} />, code: "SKL" },
            { href: "/dashboard/settings/agents/knowledge", label: "Bases de Conocimiento RAG", icon: <BookOpen size={14} />, code: "RAG" },
            { href: "/dashboard/tools/webhooks", label: "Constructor de Webhooks", icon: <Workflow size={14} />, code: "WBH" },
            { href: "/dashboard/tools/api-docs", label: "Explorador API Pública", icon: <Key size={14} />, code: "API" },
        ],
    },
    {
        title: "Analítica & Rendimiento", code: "ANALYTICS_HUB",
        accent: "blue", icon: <BarChart2 size={20} />,
        items: [
            { href: "/dashboard/analytics", label: "Analítica Web", icon: <BarChart2 size={14} />, code: "ANL" },
            { href: "/dashboard/seo", label: "Monitor SEO", icon: <Wifi size={14} />, code: "SEO" },
            { href: "/dashboard/security/sla", label: "Monitor SLA 99.99%", icon: <Activity size={14} />, code: "SLA" },
            { href: "/dashboard/admin/ai-insights", label: "AI Insights", icon: <Zap size={14} />, code: "INS" },
            { href: "/dashboard/admin/crm/reports", label: "Reportes CRM", icon: <BarChart2 size={14} />, code: "RPT" },
        ],
    },
    {
        title: "Soporte & Comunicación", code: "SUPPORT_SYS",
        accent: "rose", icon: <MessageSquare size={20} />,
        items: [
            { href: "/dashboard/inbox", label: "Inbox Omnicanal", icon: <MessageSquare size={14} />, code: "BCX" },
            { href: "/dashboard/kanban", label: "Gestión Operativa", icon: <Trello size={14} />, code: "KBN" },
            { href: "/dashboard/events", label: "Calendario de Eventos", icon: <Calendar size={14} />, code: "CAL" },
        ],
    },
    {
        title: "Recursos Humanos & Nómina", code: "HR_MANAGEMENT",
        accent: "violet", icon: <Users size={20} />,
        items: [
            { href: "/dashboard/admin/payroll", label: "Nómina Electrónica & PILA", icon: <DollarSign size={14} />, code: "PAY" },
            { href: "/dashboard/admin/payroll/employees", label: "Personal y Contratistas", icon: <Users size={14} />, code: "EMP" },
            { href: "/dashboard/admin/payroll/time-off", label: "Permisos y Vacaciones", icon: <Calendar size={14} />, code: "OFF" },
            { href: "/dashboard/admin/payroll/expenses", label: "Gestión de Egresos", icon: <CreditCard size={14} />, code: "EXP" },
            { href: "/dashboard/admin/payroll/reports", label: "Reportes & Certificados", icon: <BarChart2 size={14} />, code: "REP" },
            { href: "/dashboard/admin/team", label: "Gestión de Equipo", icon: <UserCog size={14} />, code: "TEAM" },
            { href: "/dashboard/admin/hr", label: "Time Tracking / RRHH", icon: <Activity size={14} />, code: "HR" },
        ],
    },
    {
        title: "Arquitectura & Automatización", code: "INTEGRATIONS_SYS",
        accent: "emerald", icon: <Workflow size={20} />,
        items: [
            { href: "/dashboard/admin/architecture", label: "Arquitectura de Microservicios", icon: <Network size={14} />, code: "ARC" },
            { href: "/dashboard/admin/automation", label: "Automatización de Workflows", icon: <Workflow size={14} />, code: "BOT" },
            { href: "/dashboard/admin/marketing/settings", label: "Integraciones de Marketing", icon: <Settings size={14} />, code: "API" },
            { href: "/dashboard/marketing/spend", label: "Ad Spend & ROAS", icon: <DollarSign size={14} />, code: "ROI" },
        ],
    },
    {
        title: "Administración y Seguridad", code: "ADMIN_FIN",
        accent: "violet", icon: <Settings size={20} />,
        items: [
            { href: "/dashboard/settings", label: "Configuración DIAN & Sistema", icon: <Settings size={14} />, code: "CFG" },
            { href: "/dashboard/admin/invoices", label: "Facturación B2B", icon: <CreditCard size={14} />, code: "INV" },
            { href: "/dashboard/admin/treasury", label: "Tesorería", icon: <Landmark size={14} />, code: "TRS" },
            { href: "/dashboard/admin/audit-logs", label: "Logs de Auditoría Forense", icon: <FileText size={14} />, code: "LOG" },
            { href: "/dashboard/privacy-portal", label: "Portal Privacidad & GDPR", icon: <Shield size={14} />, code: "PRV" },
            { href: "/dashboard/users", label: "Gestión de Usuarios", icon: <Users size={14} />, code: "USR" },
            { href: "/dashboard/roles", label: "Control de Roles & Permisos", icon: <Shield size={14} />, code: "ROL" },
            { href: "/dashboard/security", label: "Bóveda de Seguridad & Logs", icon: <Lock size={14} />, code: "SEC" },
        ],
    },
    {
        title: "Programa de Afiliados", code: "AFFILIATE_SYS",
        accent: "teal", icon: <Share2 size={20} />,
        items: [
            { href: "/dashboard/affiliate", label: "Overview de Afiliados", icon: <Share2 size={14} />, code: "OVW" },
            { href: "/dashboard/affiliate/referrals", label: "Mis Referidos", icon: <Users size={14} />, code: "REF" },
            { href: "/dashboard/affiliate/payouts", label: "Mis Pagos", icon: <Landmark size={14} />, code: "PAY" },
            { href: "/dashboard/affiliate/plans", label: "Planes de Comisión", icon: <Percent size={14} />, code: "PLN" },
        ],
    },
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
    return (
        <aside
            className="flex flex-row h-full shrink-0 relative transition-all duration-300 ease-in-out"
            style={{
                background: 'rgba(2,6,23,0.97)',
                borderRight: '1px solid rgba(30,41,59,0.6)',
            }}
        >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

            <SidebarClientContent 
                navGroups={NAV_GROUPS}
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