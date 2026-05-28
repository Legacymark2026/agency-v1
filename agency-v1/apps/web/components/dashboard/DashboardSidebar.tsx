"use client";

import Link from "next/link";
import {
    LayoutDashboard, Users, Settings, FileText, LogOut,
    Shield, BookOpen, Briefcase, BarChart2, Workflow,
    MessageSquare, Target, TrendingUp, Link2, Building2,
    Lock, UserCog, DollarSign, CheckSquare, Zap, Mail, Calendar, Wand2,
    Activity, Wifi, Bot, Trello, CreditCard, Landmark, ChevronLeft, ChevronRight,
    PanelLeftClose, PanelLeft, Image as ImageIcon
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
        title: "Operaciones", code: "OPS_CRM",
        accent: "amber", icon: <Briefcase size={20} />,
        items: [
            { href: "/dashboard/admin/crm", label: "Command Center", icon: <TrendingUp size={14} />, code: "OVW" },
            { href: "/dashboard/admin/crm/leads", label: "Leads", icon: <Users size={14} />, code: "LDS" },
            { href: "/dashboard/admin/crm/pipeline", label: "Pipeline & Deals", icon: <Briefcase size={14} />, code: "PIP" },
            { href: "/dashboard/admin/proposals", label: "Cotizaciones (e-Sign)", icon: <FileText size={14} />, code: "QOT" },
            { href: "/dashboard/admin/sales/goals", label: "Metas de Ventas", icon: <Target size={14} />, code: "GLS" },
            { href: "/dashboard/admin/crm/commissions", label: "Comisiones", icon: <DollarSign size={14} />, code: "COM" },
            { href: "/dashboard/admin/crm/tasks", label: "Tareas del Equipo", icon: <CheckSquare size={14} />, code: "TSK" },
        ],
    },
    {
        title: "Marketing y Contenidos", code: "MKT_CONTENT",
        accent: "teal", icon: <Target size={20} />,
        items: [
            { href: "/dashboard/admin/marketing", label: "CMO Dashboard", icon: <BarChart2 size={14} />, code: "CMO" },
            { href: "/dashboard/admin/marketing/campaigns", label: "Campañas (Live)", icon: <Target size={14} />, code: "LIV" },
            { href: "/dashboard/marketing/calendar", label: "Planificador", icon: <Calendar size={14} />, code: "PUB" },
            { href: "/dashboard/marketing/email-blast", label: "Email Masivo", icon: <Mail size={14} />, code: "EML" },
            { href: "/dashboard/posts", label: "Blog", icon: <BookOpen size={14} />, code: "BLG" },
            { href: "/dashboard/posts/comments", label: "Comentarios", icon: <MessageSquare size={14} />, code: "CMT" },
            { href: "/dashboard/posts/categories", label: "Categorías", icon: <FileText size={14} />, code: "CAT" },
            { href: "/dashboard/projects", label: "Portafolio", icon: <Briefcase size={14} />, code: "PRJ" },
            { href: "/dashboard/media", label: "Media", icon: <ImageIcon size={14} />, code: "MED" },
            { href: "/dashboard/marketing/pricing", label: "Tarifario", icon: <Building2 size={14} />, code: "PRC" },
            { href: "/dashboard/admin/marketing/links", label: "Link Tracker", icon: <Link2 size={14} />, code: "TRK" },
        ],
    },
    {
        title: "IA y Herramientas Creativas", code: "AI_CREATIVE",
        accent: "cyan", icon: <Wand2 size={20} />,
        items: [
            { href: "/dashboard/admin/marketing/creative-studio", label: "Creative Studio", icon: <Wand2 size={14} />, code: "CRE" },
            { href: "/dashboard/tools/video-editor", label: "Video Editor IA", icon: <Wand2 size={14} />, code: "VED" },
            { href: "/dashboard/settings/agents", label: "Agentes IA", icon: <Bot size={14} />, code: "AGT" },
        ],
    },
    {
        title: "Analítica", code: "ANALYTICS_HUB",
        accent: "blue", icon: <BarChart2 size={20} />,
        items: [
            { href: "/dashboard/analytics", label: "Analítica Web", icon: <BarChart2 size={14} />, code: "ANL" },
            { href: "/dashboard/seo", label: "Monitor SEO", icon: <Wifi size={14} />, code: "SEO" },
            { href: "/dashboard/admin/ai-insights", label: "AI Insights", icon: <Zap size={14} />, code: "INS" },
            { href: "/dashboard/admin/crm/reports", label: "Reportes CRM", icon: <BarChart2 size={14} />, code: "RPT" },
        ],
    },
    {
        title: "Soporte", code: "SUPPORT_SYS",
        accent: "rose", icon: <MessageSquare size={20} />,
        items: [
            { href: "/dashboard/inbox", label: "Inbox Omnicanal", icon: <MessageSquare size={14} />, code: "BCX" },
            { href: "/dashboard/kanban", label: "Gestión Operativa", icon: <Trello size={14} />, code: "KBN" },
            { href: "/dashboard/events", label: "Calendario", icon: <Calendar size={14} />, code: "CAL" },
        ],
    },
    {
        title: "Recursos Humanos", code: "HR_MANAGEMENT",
        accent: "violet", icon: <Users size={20} />,
        items: [
            { href: "/dashboard/admin/team", label: "Equipo", icon: <UserCog size={14} />, code: "TEAM" },
            { href: "/dashboard/admin/payroll", label: "Nómina", icon: <DollarSign size={14} />, code: "PAY" },
            { href: "/dashboard/admin/hr", label: "Time Tracking / RRHH", icon: <Activity size={14} />, code: "HR" },
        ],
    },
    {
        title: "Integraciones", code: "INTEGRATIONS_SYS",
        accent: "emerald", icon: <Workflow size={20} />,
        items: [
            { href: "/dashboard/admin/automation", label: "Automatización", icon: <Workflow size={14} />, code: "BOT" },
            { href: "/dashboard/admin/marketing/settings", label: "APIs & Config", icon: <Settings size={14} />, code: "API" },
            { href: "/dashboard/admin/marketing/spend", label: "Ad Spend (ROI)", icon: <DollarSign size={14} />, code: "ROI" },
        ],
    },
    {
        title: "Administración y Finanzas", code: "ADMIN_FIN",
        accent: "violet", icon: <Settings size={20} />,
        items: [
            { href: "/dashboard/settings", label: "Configuración", icon: <Settings size={14} />, code: "CFG" },
            { href: "/dashboard/admin/invoices", label: "Facturación B2B", icon: <CreditCard size={14} />, code: "INV" },
            { href: "/dashboard/admin/treasury", label: "Tesorería", icon: <Landmark size={14} />, code: "TRS" },
            { href: "/dashboard/users", label: "Usuarios", icon: <Users size={14} />, code: "USR" },
            { href: "/dashboard/security", label: "Security Log", icon: <Lock size={14} />, code: "SEC" },
        ],
    },
];

interface DashboardSidebarProps {
    role: string;
    name: string | null | undefined;
    email: string | null | undefined;
    image?: string | null | undefined;
    accessibleRoutes: string[];
    badge: { label: string; color: string };
}

export function DashboardSidebar({ role, name, email, image, accessibleRoutes, badge }: DashboardSidebarProps) {
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
                userInfo={{ name, email, image, badge }}
            />

            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
        </aside>
    );
}