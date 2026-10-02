"use client";

import Link from "next/link";
import {
    LayoutDashboard, Users, Settings, FileText, LogOut,
    Shield, ShieldCheck, BookOpen, Briefcase, BarChart2, Workflow,
    MessageSquare, Target, TrendingUp, Link2, Building2,
    Lock, UserCog, DollarSign, CheckSquare, Zap, Mail, Calendar, Wand2,
    Activity, Wifi, Bot, Trello, CreditCard, Landmark, ChevronLeft, ChevronRight,
    PanelLeftClose, PanelLeft, Image as ImageIcon, Share2, Percent, MousePointerClick, ShoppingBag, Package,
    Cpu, Scan, AlertTriangle, Key, Terminal, Network, Search, Award, Layers, Sparkles,
    Boxes, FileCheck
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
        title: "Ventas & Finanzas", code: "SALES_FIN",
        accent: "emerald", icon: <DollarSign size={20} />,
        items: [
            { href: "/dashboard", label: "Panel Principal", icon: <LayoutDashboard size={14} />, code: "DB_OVER" },
            { href: "/dashboard/pos", label: "Punto de Venta B2C", icon: <Scan size={14} />, code: "POS" },
            { href: "/dashboard/invoicing", label: "Facturación & DIAN", icon: <FileCheck size={14} />, code: "INV" },
            { href: "/dashboard/catalog", label: "Catálogo e Inventario", icon: <ShoppingBag size={14} />, code: "CAT" },
            { href: "/dashboard/admin/treasury", label: "Tesorería & Cuentas", icon: <Landmark size={14} />, code: "TRS" },
            { href: "/dashboard/sales-forecast", label: "Predicción de Ventas", icon: <TrendingUp size={14} />, code: "SIA" },
        ],
    },
    {
        title: "Marketing & CRM", code: "MKT_CRM",
        accent: "rose", icon: <Target size={20} />,
        items: [
            { href: "/dashboard/admin/crm/leads", label: "CRM B2B", icon: <Users size={14} />, code: "CRM" },
            { href: "/dashboard/marketing/campaigns", label: "Campañas y Ads", icon: <Target size={14} />, code: "CMP" },
            { href: "/dashboard/marketing/email-blast", label: "Email Blast", icon: <Mail size={14} />, code: "EML" },
            { href: "/dashboard/promotions", label: "Promociones B2C", icon: <Sparkles size={14} />, code: "PRM" },
            { href: "/dashboard/seo", label: "Monitor SEO", icon: <Search size={14} />, code: "SEO" },
            { href: "/dashboard/affiliate", label: "Programa Afiliados", icon: <Share2 size={14} />, code: "AFF" },
        ],
    },
    {
        title: "Operaciones & RRHH", code: "OPS_HR",
        accent: "blue", icon: <Layers size={20} />,
        items: [
            { href: "/dashboard/kanban", label: "Kanban Operativo", icon: <Trello size={14} />, code: "KBN" },
            { href: "/dashboard/projects", label: "Proyectos", icon: <Boxes size={14} />, code: "PRJ" },
            { href: "/dashboard/events", label: "Calendario", icon: <Calendar size={14} />, code: "CAL" },
            { href: "/dashboard/admin/payroll", label: "Nómina y RRHH", icon: <CreditCard size={14} />, code: "PAY" },
            { href: "/dashboard/admin/team", label: "Gestión de Equipo", icon: <UserCog size={14} />, code: "TEAM" },
        ],
    },
    {
        title: "Comunicación & Media", code: "COM_MED",
        accent: "violet", icon: <MessageSquare size={20} />,
        items: [
            { href: "/dashboard/inbox", label: "Inbox Omnicanal", icon: <MessageSquare size={14} />, code: "IBX" },
            { href: "/dashboard/chat", label: "Chat Empresarial", icon: <MessageSquare size={14} />, code: "CHT" },
            { href: "/dashboard/feed", label: "Muro Social", icon: <Share2 size={14} />, code: "FED" },
            { href: "/dashboard/posts", label: "Artículos & CMS", icon: <FileText size={14} />, code: "CMS" },
            { href: "/dashboard/video", label: "Video Studio Pro", icon: <Wand2 size={14} />, code: "VID" },
            { href: "/dashboard/media", label: "Multimedia", icon: <ImageIcon size={14} />, code: "MED" },
        ],
    },
    {
        title: "Sistema & IA", code: "SYS_AI",
        accent: "cyan", icon: <Settings size={20} />,
        items: [
            { href: "/dashboard/analytics", label: "Analítica General", icon: <BarChart2 size={14} />, code: "ANL" },
            { href: "/dashboard/tools/master-hub", label: "Consola Maestra IA", icon: <Terminal size={14} />, code: "HUB" },
            { href: "/dashboard/settings/agents", label: "Agentes Autónomos", icon: <Bot size={14} />, code: "AGT" },
            { href: "/dashboard/users", label: "Usuarios y Permisos", icon: <Shield size={14} />, code: "USR" },
            { href: "/dashboard/settings", label: "Configuración Sistema", icon: <Settings size={14} />, code: "CFG" },
            { href: "/dashboard/security", label: "Seguridad y Auditoría", icon: <Lock size={14} />, code: "SEC" },
            { href: "/dashboard/privacy-portal", label: "Portal GDPR", icon: <ShieldCheck size={14} />, code: "PRV" },
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
