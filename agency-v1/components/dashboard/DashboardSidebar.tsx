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
interface NavGroup { title: string; code: string; accent?: string; items: NavItem[]; }

const NAV_GROUPS: NavGroup[] = [
    {
        title: "Portal del Cliente", code: "CLIENT_PORTAL",
        accent: "teal",
        items: [
            { href: "/dashboard/client", label: "Mi Resumen", icon: <LayoutDashboard size={14} />, code: "C_OVW" },
            { href: "/dashboard/client/proposals", label: "Mis Propuestas", icon: <FileText size={14} />, code: "C_QOT" },
            { href: "/dashboard/client/projects", label: "Mis Proyectos", icon: <Briefcase size={14} />, code: "C_PRJ" },
        ],
    },
    {
        title: "Panel General", code: "SYS_CORE",
        items: [
            { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={14} />, code: "OVW" },
            { href: "/dashboard/kanban", label: "Gestión Operativa", icon: <Trello size={14} />, code: "KBN" },
            { href: "/dashboard/inbox", label: "Inbox Omnicanal", icon: <MessageSquare size={14} />, code: "BCX" },
            { href: "/dashboard/events", label: "Calendario", icon: <Calendar size={14} />, code: "CAL" },
            { href: "/dashboard/analytics", label: "Analítica Web", icon: <BarChart2 size={14} />, code: "ANL" },
        ],
    },
    {
        title: "Marketing Hub", code: "MKT_SYS",
        accent: "teal",
        items: [
            { href: "/dashboard/admin/marketing", label: "CMO Dashboard", icon: <BarChart2 size={14} />, code: "CMO" },
            { href: "/dashboard/admin/marketing/campaigns", label: "Campañas (Live)", icon: <Target size={14} />, code: "LIV" },
            { href: "/dashboard/marketing/calendar", label: "Planificador", icon: <Calendar size={14} />, code: "PUB" },
            { href: "/dashboard/marketing/email-blast", label: "Email Masivo", icon: <Mail size={14} />, code: "EML" },
            { href: "/dashboard/admin/marketing/creative-studio", label: "Creative Studio", icon: <Wand2 size={14} />, code: "CRE" },
            { href: "/dashboard/marketing/pricing", label: "Tarifario", icon: <Building2 size={14} />, code: "PRC" },
            { href: "/dashboard/admin/automation", label: "Automatización", icon: <Workflow size={14} />, code: "BOT" },
            { href: "/dashboard/admin/marketing/spend", label: "Ad Spend (ROI)", icon: <DollarSign size={14} />, code: "ROI" },
            { href: "/dashboard/admin/marketing/links", label: "Link Tracker", icon: <Link2 size={14} />, code: "TRK" },
            { href: "/dashboard/admin/marketing/settings", label: "APIs & Config", icon: <Settings size={14} />, code: "API" },
        ],
    },
    {
        title: "CRM & Ventas", code: "CRM_CORE",
        accent: "amber",
        items: [
            { href: "/dashboard/admin/crm", label: "CRM Overview", icon: <TrendingUp size={14} />, code: "OVW" },
            { href: "/dashboard/admin/crm/leads", label: "Leads", icon: <Users size={14} />, code: "LDS" },
            { href: "/dashboard/admin/crm/pipeline", label: "Pipeline", icon: <Briefcase size={14} />, code: "PIP" },
            { href: "/dashboard/admin/proposals", label: "Cotizaciones (e-Sign)", icon: <FileText size={14} />, code: "QOT" },
            { href: "/dashboard/admin/invoices", label: "Facturación B2B", icon: <CreditCard size={14} />, code: "INV" },
            { href: "/dashboard/admin/crm/tasks", label: "Tareas", icon: <CheckSquare size={14} />, code: "TSK" },
            { href: "/dashboard/admin/crm/reports", label: "Reportes CRM", icon: <BarChart2 size={14} />, code: "RPT" },
            { href: "/dashboard/admin/crm/templates", label: "Templates Email", icon: <Mail size={14} />, code: "TPL" },
            { href: "/dashboard/admin/crm/scoring", label: "Lead Scoring", icon: <Zap size={14} />, code: "SCR" },
            { href: "/dashboard/admin/sales/goals", label: "Metas Ventas", icon: <Target size={14} />, code: "GLS" },
            { href: "/dashboard/admin/crm/commissions", label: "Comisiones", icon: <DollarSign size={14} />, code: "COM" },
            { href: "/dashboard/admin/crm/automation", label: "Reglas CRM", icon: <Workflow size={14} />, code: "AUT" },
            { href: "/dashboard/admin/crm/sequences", label: "Sequences", icon: <Mail size={14} />, code: "SEQ" },
        ],
    },
    {
        title: "Contenido & Web", code: "CNT_MGR",
        items: [
            { href: "/dashboard/posts", label: "Blog", icon: <BookOpen size={14} />, code: "BLG" },
            { href: "/dashboard/posts/comments", label: "Comentarios", icon: <MessageSquare size={14} />, code: "CMT" },
            { href: "/dashboard/posts/categories", label: "Categorías", icon: <FileText size={14} />, code: "CAT" },
            { href: "/dashboard/projects", label: "Portafolio", icon: <Briefcase size={14} />, code: "PRJ" },
            { href: "/dashboard/media", label: "Media", icon: <ImageIcon size={14} />, code: "MED" },
        ],
    },
    {
        title: "Administración", code: "ADMIN_SYS",
        accent: "violet",
        items: [
            { href: "/dashboard/users", label: "Usuarios", icon: <Users size={14} />, code: "USR" },
            { href: "/dashboard/admin/team", label: "Equipo", icon: <UserCog size={14} />, code: "TEAM" },
            { href: "/dashboard/security", label: "Security Log", icon: <Lock size={14} />, code: "SEC" },
            { href: "/dashboard/admin/payroll", label: "Nómina", icon: <DollarSign size={14} />, code: "PAY" },
            { href: "/dashboard/admin/treasury", label: "Tesorería", icon: <Landmark size={14} />, code: "TRS" },
            { href: "/dashboard/settings", label: "Settings", icon: <Settings size={14} />, code: "CFG" },
        ],
    },
    {
        title: "IA & Automations", code: "AI_CORE",
        accent: "cyan",
        items: [
            { href: "/dashboard/settings/agents", label: "Agentes IA", icon: <Bot size={14} />, code: "AGT" },
            { href: "/dashboard/admin/ai-insights", label: "AI Insights", icon: <Zap size={14} />, code: "INS" },
            { href: "/dashboard/experts", label: "Expert Network", icon: <Users size={14} />, code: "XPN" },
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
            className="flex flex-col h-full shrink-0 relative transition-all duration-300 ease-in-out"
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