"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
    User, Shield, Blocks, Bell, Palette, ArrowLeft, Building2, Users, Bot, 
    Wand2, CreditCard, Code2, Sliders, TrendingUp, Boxes, Lock, Sparkles, ChevronRight,
    ChevronDown, Check, Layers, ExternalLink, ShoppingBag, Scale
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface SettingsNavSubItem {
    name: string;
    href: string;
    icon: any;
    desc?: string;
    badge?: string;
}

export interface SettingsCategoryDef {
    title: string;
    code: string;
    slug: string;
    icon: any;
    color: string;
    badge: string;
    description: string;
    items: SettingsNavSubItem[];
}

export const SETTINGS_CATEGORIES: SettingsCategoryDef[] = [
    {
        title: "Ajustes Personales",
        code: "PERSONAL",
        slug: "personal",
        icon: User,
        color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
        badge: "NIVEL USUARIO",
        description: "Preferencias de tu cuenta individual, credenciales y seguridad personal.",
        items: [
            { name: "Perfil y Cuenta", href: "/dashboard/settings/profile", icon: User, desc: "Datos personales, avatar y credenciales" },
            { name: "Apariencia & UI", href: "/dashboard/settings/appearance", icon: Palette, desc: "Tema, acentos y ergonomía visual" },
            { name: "Notificaciones", href: "/dashboard/settings/notifications", icon: Bell, desc: "Alertas Email, WhatsApp y Push" },
            { name: "Seguridad Personal", href: "/dashboard/settings/security", icon: Shield, desc: "2FA, contraseñas y sesiones activas" },
        ]
    },
    {
        title: "Organización & Gobernanza",
        code: "ORG",
        slug: "org",
        icon: Building2,
        color: "text-teal-400 bg-teal-500/10 border-teal-500/30",
        badge: "NIVEL TENANT",
        description: "Gestión de la empresa, marca blanca, colaboradores, suscripción y facturación.",
        items: [
            { name: "Compañía & Marca Blanca", href: "/dashboard/settings/company", icon: Building2, desc: "RUT, NIT, logos y dominio CNAME" },
            { name: "Miembros del Equipo", href: "/dashboard/settings/members", icon: Users, desc: "Invitaciones y asignación de puestos" },
            { name: "Roles y Permisos (RBAC)", href: "/dashboard/settings/roles", icon: Shield, desc: "Matriz de control de acceso y delegación" },
            { name: "Políticas de Aprobación & Umbrales de Compra", href: "/dashboard/settings/financial-policies", icon: Scale, desc: "Flujos multinivel, topes financieros y reglas SRM", badge: "POL" },
            { name: "Terminal POS Enterprise", href: "/dashboard/settings/pos", icon: ShoppingBag, desc: "Gobernanza de turnos, arqueo de caja y periféricos", badge: "POS" },
            { name: "Facturación & Plan B2B", href: "/dashboard/settings/billing", icon: CreditCard, desc: "Consumo de cuotas, plan e historial" },
            { name: "Pasarelas de Pago (BYOG)", href: "/dashboard/settings/billing/gateways", icon: CreditCard, desc: "Stripe, Wompi, MercadoPago y KMS" },
        ]
    },
    {
        title: "Configuraciones por Área",
        code: "AREAS",
        slug: "areas",
        icon: Sparkles,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        badge: "ÁREAS DE NEGOCIO",
        description: "Parámetros operativos de cada departamento (Ventas, Operaciones, RRHH, Soporte, Media).",
        items: [
            { name: "Configuración de Ventas", href: "/dashboard/settings/sales", icon: TrendingUp, desc: "Metas comerciales, comisiones y CPQ", badge: "Ventas" },
            { name: "Configuración de Operaciones", href: "/dashboard/settings/operations", icon: Boxes, desc: "Bodegas, logística y políticas de citas", badge: "Ops" },
            { name: "Configuración de RRHH", href: "/dashboard/settings/hr", icon: Users, desc: "Nómina DIAN, novedades y ausencias", badge: "RRHH" },
            { name: "Configuración de Soporte", href: "/dashboard/settings/support", icon: Wand2, desc: "Macros, colas y canales en tiempo real", badge: "Soporte" },
            { name: "Configuración de Media", href: "/dashboard/settings/media", icon: Palette, desc: "Perfiles sociales, CDN y video 9:16", badge: "Media" },
        ]
    },
    {
        title: "Inteligencia Artificial & Canales",
        code: "AI",
        slug: "ai",
        icon: Bot,
        color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
        badge: "TECNOLOGÍA IA",
        description: "Directorio de agentes autónomos, clonación de voz, macros de inbox e integraciones de marketing.",
        items: [
            { name: "Agentes Cognitivos IA", href: "/dashboard/settings/agents", icon: Bot, desc: "Directorio de agentes autónomos" },
            { name: "Voice Studio (Voicebox)", href: "/dashboard/voice", icon: Wand2, desc: "Clonación y síntesis de voz neuronal" },
            { name: "Macros de Inbox", href: "/dashboard/settings/inbox/macros", icon: Sliders, desc: "Respuestas automáticas de 1 clic" },
            { name: "Integraciones de Marketing", href: "/dashboard/admin/marketing/settings", icon: Blocks, desc: "Meta, Google, WhatsApp y Twilio" },
        ]
    },
    {
        title: "Enterprise, APIs & Compliance",
        code: "DEV",
        slug: "dev",
        icon: Code2,
        color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
        badge: "INFRA & APIS",
        description: "Claves de API, webhooks, variables del sistema, logs forenses y normativas GDPR.",
        items: [
            { name: "Developer & API Keys", href: "/dashboard/settings/developer", icon: Code2, desc: "Claves de API, webhooks y tokens" },
            { name: "Parámetros del Sistema", href: "/dashboard/settings/system-parameters", icon: Sliders, desc: "Parámetros globales y variables CRUD" },
            { name: "Bitácora de Auditoría", href: "/dashboard/settings/audit-logs", icon: Shield, desc: "Logs inalterables forenses de actividad" },
            { name: "Privacidad & Habeas Data", href: "/dashboard/settings/privacy", icon: Lock, desc: "GDPR, retención de datos y SSO" },
        ]
    }
];

// Helper to determine the active category based on pathname and searchParams
export function resolveActiveSettingsCategory(pathname: string, categoryParam?: string | null): SettingsCategoryDef | null {
    // 1. Check if pathname matches any item href in a category
    for (const cat of SETTINGS_CATEGORIES) {
        for (const item of cat.items) {
            if (pathname === item.href || (item.href !== "/dashboard" && item.href !== "/dashboard/settings" && pathname.startsWith(item.href + "/"))) {
                return cat;
            }
        }
    }

    // 2. If at root /dashboard/settings, inspect query param ?category=...
    if (pathname === "/dashboard/settings" && categoryParam) {
        const found = SETTINGS_CATEGORIES.find(c => c.slug === categoryParam.toLowerCase() || c.code.toLowerCase() === categoryParam.toLowerCase());
        if (found) return found;
    }

    return null;
}

export function SettingsSidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [selectorOpen, setSelectorOpen] = useState(false);

    const categoryParam = searchParams.get("category");
    const activeCategory = useMemo(() => {
        return resolveActiveSettingsCategory(pathname, categoryParam);
    }, [pathname, categoryParam]);

    // Active item resolution
    const activeItem = useMemo(() => {
        if (!activeCategory) return null;
        for (const item of activeCategory.items) {
            if (pathname === item.href || (item.href !== "/dashboard" && item.href !== "/dashboard/settings" && pathname.startsWith(item.href + "/"))) {
                return item;
            }
        }
        return null;
    }, [pathname, activeCategory]);

    const isHubRoot = pathname === "/dashboard/settings" && !activeCategory;

    return (
        <aside className="w-full lg:w-72 shrink-0 flex flex-col space-y-5">
            {/* Mobile Top Header */}
            <div className="flex items-center justify-between mb-1 lg:hidden">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver al Dashboard</span>
                </Link>
                {activeCategory && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {activeCategory.title}
                    </span>
                )}
            </div>

            {/* CATEGORY SELECTOR HEADER (ISOLATION SWITCH) */}
            <div className="relative">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-3 shadow-lg backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
                            Entorno de Configuración
                        </span>
                        <Link
                            href="/dashboard/settings"
                            className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                                isHubRoot 
                                    ? "bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40"
                                    : "text-slate-400 hover:text-teal-400 hover:bg-slate-900 border border-transparent"
                            }`}
                            title="Ver vista general de todas las categorías"
                        >
                            Ver Hub
                        </Link>
                    </div>

                    {/* Active Category Display & Dropdown trigger */}
                    <button
                        type="button"
                        onClick={() => setSelectorOpen(!selectorOpen)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                            activeCategory
                                ? "bg-slate-900/90 border-slate-700/80 hover:border-slate-600"
                                : "bg-teal-950/30 border-teal-500/40 hover:bg-teal-950/50"
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            {activeCategory ? (
                                <>
                                    <div className={`p-1.5 rounded-lg border shrink-0 ${activeCategory.color}`}>
                                        <activeCategory.icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-white truncate leading-tight">
                                            {activeCategory.title}
                                        </div>
                                        <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                                            {activeCategory.badge}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-400 shrink-0">
                                        <Layers className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-white truncate leading-tight">
                                            Hub Central Global
                                        </div>
                                        <div className="text-[9px] font-mono text-teal-400/80">
                                            TODAS LAS CATEGORÍAS
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${selectorOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown Menu of Categories */}
                    {selectorOpen && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-1 animate-in fade-in-50 duration-150">
                            <Link
                                href="/dashboard/settings"
                                onClick={() => setSelectorOpen(false)}
                                className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                                    isHubRoot
                                        ? "bg-teal-500/15 text-teal-300 font-bold"
                                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Layers className="w-3.5 h-3.5 text-teal-400" />
                                    <span>Vista General (Todas)</span>
                                </div>
                                {isHubRoot && <Check className="w-3.5 h-3.5 text-teal-400" />}
                            </Link>

                            {SETTINGS_CATEGORIES.map((cat) => {
                                const CatIcon = cat.icon;
                                const isCurrent = activeCategory?.code === cat.code;
                                const firstItemHref = cat.items[0]?.href || `/dashboard/settings?category=${cat.slug}`;

                                return (
                                    <Link
                                        key={cat.code}
                                        href={firstItemHref}
                                        onClick={() => setSelectorOpen(false)}
                                        className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                                            isCurrent
                                                ? "bg-slate-800/80 text-white font-bold border border-slate-700"
                                                : "text-slate-400 hover:text-white hover:bg-slate-900"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <CatIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                            <span className="truncate">{cat.title}</span>
                                        </div>
                                        {isCurrent && <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ISOLATED NAVIGATION LIST */}
            {activeCategory ? (
                // 1. STRICT CATEGORY ISOLATION: Show ONLY the items of the active category
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between px-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                            Módulos de {activeCategory.title}
                        </span>
                        <span className="text-slate-600">[{activeCategory.items.length}]</span>
                    </div>

                    <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                        {activeCategory.items.map((item) => {
                            const Icon = item.icon;
                            const isExactActive = pathname === item.href;
                            const isPrefixActive = item.href !== "/dashboard/settings" && item.href !== "/dashboard" && pathname.startsWith(item.href + "/");
                            const isActive = isExactActive || isPrefixActive;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                                        isActive
                                            ? "bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-[0_0_15px_-3px_rgba(20,184,166,0.25)] font-bold"
                                            : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 hover:border-slate-800"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={`shrink-0 transition-colors ${isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                                            <Icon className="w-4 h-4" />
                                        </span>
                                        <div className="truncate min-w-0">
                                            <div className="truncate leading-tight font-medium">
                                                {item.name}
                                            </div>
                                            {item.desc && (
                                                <div className="text-[10px] text-slate-500 font-normal truncate mt-0.5 hidden lg:block">
                                                    {item.desc}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                        {item.badge && (
                                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                                {item.badge}
                                            </span>
                                        )}
                                        {isActive && (
                                            <ChevronRight className="w-3.5 h-3.5 text-teal-400" />
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Category Scope Info Card */}
                    <div className="hidden lg:block mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
                        <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-teal-400" />
                            Aislamiento de Categoría
                        </div>
                        <p className="text-[10px] leading-relaxed text-slate-500">
                            Estás navegando con acceso exclusivo a los módulos de <strong className="text-slate-300">{activeCategory.title}</strong>.
                        </p>
                    </div>
                </div>
            ) : (
                // 2. ROOT HUB OVERVIEW: When at /dashboard/settings with no specific category, provide category entry points
                <div className="flex flex-col space-y-3">
                    <div className="px-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Selecciona una Categoría
                    </div>

                    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                        {SETTINGS_CATEGORIES.map((cat) => {
                            const CatIcon = cat.icon;
                            const firstItemHref = cat.items[0]?.href || `/dashboard/settings?category=${cat.slug}`;

                            return (
                                <Link
                                    key={cat.code}
                                    href={firstItemHref}
                                    className="p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all group flex items-start gap-3"
                                >
                                    <div className={`p-2 rounded-lg border shrink-0 ${cat.color}`}>
                                        <CatIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-bold text-slate-200 group-hover:text-teal-300 transition-colors">
                                            {cat.title}
                                        </div>
                                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                            {cat.items.length} módulos disponibles
                                        </div>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-400 transition-colors mt-1" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </aside>
    );
}
