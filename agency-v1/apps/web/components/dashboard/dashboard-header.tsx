"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useTransition, useMemo } from "react";
import {
    ChevronRight, Palette, Check, Share2, Shield, Settings,
    LogOut, User, Sparkles, Activity, Bell, Search, Home
} from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { signOutAction } from "@/app/actions/auth";
import { useUIStore } from "@/lib/stores/ui-store";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
        badge?: { label: string; color: string };
    };
    companyLogoUrl?: string | null;
}

const ROUTE_LABELS: Record<string, { module: string; sub?: string; icon?: string }> = {
    "/dashboard": { module: "Dashboard", sub: "Vista General" },
    "/dashboard/feed": { module: "Comunidad", sub: "Muro Corporativo" },
    "/dashboard/chat": { module: "Comunicaciones", sub: "Chat Empresarial" },
    "/dashboard/accounting": { module: "Finanzas", sub: "Contabilidad General & NIIF" },
    "/dashboard/invoicing": { module: "Finanzas", sub: "Facturación DIAN & RADIAN" },
    "/dashboard/invoicing/ocr-scanner": { module: "Finanzas", sub: "Escáner OCR Recibos" },
    "/dashboard/invoicing/fraud-guard": { module: "Finanzas", sub: "Guardián Anti-Fraude" },
    "/dashboard/pos": { module: "Operaciones", sub: "Terminal POS (Caja)" },
    "/dashboard/catalog": { module: "Operaciones", sub: "Catálogo & Productos" },
    "/dashboard/promotions": { module: "Operaciones", sub: "Promociones & Cupones" },
    "/dashboard/calendar": { module: "Operaciones", sub: "Agendación & Citas" },
    "/dashboard/admin/crm": { module: "CRM", sub: "Command Center" },
    "/dashboard/admin/crm/leads": { module: "CRM", sub: "Gestión de Leads" },
    "/dashboard/admin/crm/pipeline": { module: "CRM", sub: "Pipeline & Deals" },
    "/dashboard/admin/crm/scoring": { module: "CRM", sub: "Scoring Predictivo" },
    "/dashboard/admin/sales": { module: "Ventas", sub: "Hub Comercial CPQ" },
    "/dashboard/admin/proposals": { module: "Ventas", sub: "Cotizaciones (e-Sign)" },
    "/dashboard/marketing": { module: "Marketing", sub: "CMO Dashboard" },
    "/dashboard/marketing/campaigns": { module: "Marketing", sub: "Campañas & Anuncios" },
    "/dashboard/posts": { module: "Contenido", sub: "Gestor de Publicaciones" },
    "/dashboard/projects": { module: "Proyectos", sub: "Gestión & Entregables" },
    "/dashboard/tools/video-editor": { module: "Herramientas", sub: "Editor de Video IA" },
    "/dashboard/video": { module: "Herramientas", sub: "Estudio de Video" },
    "/dashboard/voice": { module: "Herramientas", sub: "Voicebox & Síntesis" },
    "/dashboard/admin/payroll": { module: "RRHH", sub: "Nómina Electrónica" },
    "/dashboard/admin/hr": { module: "RRHH", sub: "Gestión de Personal" },
    "/dashboard/users": { module: "Administración", sub: "Usuarios del Sistema" },
    "/dashboard/roles": { module: "Administración", sub: "Roles y Permisos (RBAC)" },
    "/dashboard/security": { module: "Seguridad", sub: "Auditoría & Logs" },
    "/dashboard/settings": { module: "Configuración", sub: "Ajustes Generales" },
    "/dashboard/settings/notifications": { module: "Configuración", sub: "Preferencias de Notificación" },
    "/dashboard/client": { module: "Portal Cliente", sub: "Mi Resumen" },
    "/dashboard/client/projects": { module: "Portal Cliente", sub: "Mis Proyectos" },
    "/dashboard/client/proposals": { module: "Portal Cliente", sub: "Mis Propuestas" },
};

export function DashboardHeader({ user, companyLogoUrl }: DashboardHeaderProps) {
    const pathname = usePathname();
    const { accent, setAccent } = useUIStore();
    const [isPending, startTransition] = useTransition();
    const [showColorPicker, setShowColorPicker] = useState(false);

    const ACCENT_COLORS = [
        { key: 'teal', bg: 'bg-teal-500', label: 'Verde Cuántico' },
        { key: 'cyan', bg: 'bg-cyan-500', label: 'Cian Neón' },
        { key: 'indigo', bg: 'bg-indigo-500', label: 'Índigo Profundo' },
        { key: 'violet', bg: 'bg-violet-500', label: 'Violeta Eléctrico' },
        { key: 'amber', bg: 'bg-amber-500', label: 'Ámbar Cálido' },
        { key: 'rose', bg: 'bg-rose-500', label: 'Rosa Futurista' },
        { key: 'emerald', bg: 'bg-emerald-500', label: 'Esmeralda Puro' },
    ];

    // Compute dynamic breadcrumbs
    const breadcrumb = useMemo(() => {
        if (ROUTE_LABELS[pathname]) {
            return ROUTE_LABELS[pathname];
        }
        // Fallback: match longest prefix
        const matching = Object.keys(ROUTE_LABELS)
            .filter(route => route !== "/dashboard" && pathname.startsWith(route))
            .sort((a, b) => b.length - a.length)[0];

        if (matching) {
            return ROUTE_LABELS[matching];
        }

        const segments = pathname.split("/").filter(Boolean);
        if (segments.length <= 1) return { module: "Dashboard", sub: "Inicio" };
        const last = segments[segments.length - 1];
        return {
            module: segments[1]?.toUpperCase() || "Dashboard",
            sub: last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " "),
        };
    }, [pathname]);

    const userName = user?.name || "Usuario";
    const userEmail = user?.email || "";
    const userInitial = (userName?.[0] || "U").toUpperCase();
    const badgeLabel = user?.badge?.label || user?.role?.toUpperCase() || "USUARIO";
    const badgeColor = user?.badge?.color || "border-teal-500/30 text-teal-400 bg-teal-500/10";

    return (
        <header className="h-16 w-full border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between z-20 shrink-0 select-none">
            {/* ── Left: Breadcrumbs & Context ────────────────────────────── */}
            <div className="flex items-center gap-2.5 min-w-0">
                <Link
                    href="/dashboard"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-900/60 transition-colors shrink-0"
                    title="Inicio Dashboard"
                >
                    <Home className="h-4 w-4" />
                </Link>

                <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />

                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-slate-400 tracking-wide truncate">
                        {breadcrumb.module}
                    </span>

                    {breadcrumb.sub && (
                        <>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                            <span className="text-xs font-bold text-slate-100 tracking-tight truncate flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
                                {breadcrumb.sub}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* ── Right: Utilities, Alerts, Bell & User Profile ───────────── */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* System Status Pill (Desktop only) */}
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium tracking-wide">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>En Línea</span>
                </div>

                {/* Muro Corporativo Quick Link */}
                <Link
                    href="/dashboard/feed"
                    className={`p-2 rounded-xl border transition-all text-xs font-medium flex items-center gap-1.5 ${
                        pathname === "/dashboard/feed"
                            ? "bg-teal-500/15 border-teal-500/40 text-teal-300 shadow-[0_0_15px_-3px_rgba(20,184,166,0.3)]"
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                    title="Muro de Publicaciones Corporativo"
                >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Muro</span>
                </Link>

                {/* Theme Color Picker */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className={`p-2 rounded-xl border transition-all ${
                            showColorPicker
                                ? "bg-slate-800 text-teal-400 border-teal-500/40"
                                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 hover:border-slate-700"
                        }`}
                        title="Cambiar Color de Acento"
                    >
                        <Palette className="h-4 w-4" />
                    </button>

                    {showColorPicker && (
                        <div
                            className="absolute right-0 top-full mt-2 p-3 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-2 min-w-[180px]"
                            style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(13,148,136,0.15)' }}
                        >
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-1">
                                Color de Acento
                            </span>
                            <div className="grid grid-cols-4 gap-2 pt-1">
                                {ACCENT_COLORS.map((c) => {
                                    const isSelected = accent === c.key;
                                    return (
                                        <button
                                            key={c.key}
                                            type="button"
                                            onClick={() => {
                                                startTransition(() => {
                                                    setAccent(c.key as any);
                                                });
                                                setShowColorPicker(false);
                                            }}
                                            className={`w-7 h-7 rounded-full ${c.bg} hover:scale-110 active:scale-95 transition-all duration-200 relative flex items-center justify-center cursor-pointer shadow-md ${
                                                isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-105' : 'hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                                            }`}
                                            title={c.label}
                                        >
                                            {isSelected && <Check size={12} className="text-white font-bold stroke-[3]" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── NOTIFICATION BELL ────────────────────────────────────── */}
                <div className="relative">
                    <NotificationBell />
                </div>

                {/* Vertical Divider */}
                <div className="h-6 w-px bg-slate-800/80 mx-0.5" />

                {/* ── USER PROFILE MENU ────────────────────────────────────── */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center gap-2.5 p-1 md:pr-2.5 rounded-xl border border-transparent hover:border-slate-800 hover:bg-slate-900/60 transition-all focus:outline-none group cursor-pointer"
                            id="user-profile-menu-button"
                        >
                            <div className="relative">
                                {user?.image ? (
                                    <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-700/80 group-hover:border-teal-500/60 transition-colors relative">
                                        <Image src={user.image} alt={userName} fill className="object-cover" />
                                    </div>
                                ) : (
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500/20 to-teal-900/40 border border-teal-500/40 flex items-center justify-center text-xs font-black text-teal-400 group-hover:border-teal-400 transition-colors shadow-inner">
                                        {userInitial}
                                    </div>
                                )}
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                            </div>

                            <div className="hidden md:flex flex-col text-left">
                                <span className="text-xs font-bold text-slate-200 group-hover:text-teal-300 transition-colors truncate max-w-[130px]">
                                    {userName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight truncate max-w-[130px]">
                                    {badgeLabel}
                                </span>
                            </div>
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        className="w-64 bg-slate-950/95 border-slate-800/90 p-2 shadow-2xl rounded-2xl backdrop-blur-xl"
                        sideOffset={8}
                    >
                        <DropdownMenuLabel className="font-normal px-2.5 py-2">
                            <div className="flex flex-col gap-1">
                                <p className="text-xs font-bold text-slate-100">{userName}</p>
                                <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                                <div className="pt-1">
                                    <Badge variant="outline" className={`text-[10px] font-mono tracking-wider px-2 py-0.5 ${badgeColor}`}>
                                        {badgeLabel}
                                    </Badge>
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator className="bg-slate-800/60 my-1" />

                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/dashboard/settings"
                                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-300 hover:text-white rounded-xl hover:bg-slate-900/80 cursor-pointer transition-colors"
                                >
                                    <Settings className="h-4 w-4 text-slate-400" />
                                    <span>Configuración del Sistema</span>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link
                                    href="/dashboard/settings/notifications"
                                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-300 hover:text-white rounded-xl hover:bg-slate-900/80 cursor-pointer transition-colors"
                                >
                                    <Bell className="h-4 w-4 text-teal-400" />
                                    <span>Preferencias de Alertas</span>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link
                                    href="/dashboard/security"
                                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-300 hover:text-white rounded-xl hover:bg-slate-900/80 cursor-pointer transition-colors"
                                >
                                    <Shield className="h-4 w-4 text-amber-400" />
                                    <span>Seguridad & Logs</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator className="bg-slate-800/60 my-1" />

                        <DropdownMenuItem asChild>
                            <button
                                type="button"
                                onClick={() => signOutAction()}
                                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-red-400 hover:text-red-300 rounded-xl hover:bg-red-500/10 cursor-pointer transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Cerrar Sesión</span>
                            </button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
