"use client";

import { usePathname } from "next/navigation";
import { 
    User, Shield, Blocks, Bell, Palette, ArrowLeft, Building2, Users, Bot, 
    Wand2, CreditCard, Code2, Sliders, TrendingUp, Boxes, Lock, Sparkles, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export interface SettingsNavSubItem {
    name: string;
    href: string;
    icon: any;
    desc?: string;
    badge?: string;
}

export interface SettingsNavGroup {
    title: string;
    code: string;
    icon: any;
    items: SettingsNavSubItem[];
}

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
    {
        title: "Ajustes Personales",
        code: "PERSONAL",
        icon: User,
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
        icon: Building2,
        items: [
            { name: "Compañía & Marca Blanca", href: "/dashboard/settings/company", icon: Building2, desc: "RUT, NIT, logos y dominio CNAME" },
            { name: "Miembros del Equipo", href: "/dashboard/settings/members", icon: Users, desc: "Invitaciones y asignación de puestos" },
            { name: "Roles y Permisos (RBAC)", href: "/dashboard/settings/roles", icon: Shield, desc: "Matriz de control de acceso y delegación" },
            { name: "Facturación & Plan B2B", href: "/dashboard/settings/billing", icon: CreditCard, desc: "Consumo de cuotas, plan e historial" },
            { name: "Pasarelas de Pago (BYOG)", href: "/dashboard/settings/billing/gateways", icon: CreditCard, desc: "Stripe, Wompi, MercadoPago y KMS" },
        ]
    },
    {
        title: "Configuraciones por Área",
        code: "AREAS",
        icon: Sparkles,
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
        icon: Bot,
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
        icon: Code2,
        items: [
            { name: "Developer & API Keys", href: "/dashboard/settings/developer", icon: Code2, desc: "Claves de API, webhooks y tokens" },
            { name: "Parámetros del Sistema", href: "/dashboard/settings/system-parameters", icon: Sliders, desc: "Parámetros globales y variables CRUD" },
            { name: "Bitácora de Auditoría", href: "/dashboard/settings/audit-logs", icon: Shield, desc: "Logs inalterables forenses de actividad" },
            { name: "Privacidad & Habeas Data", href: "/dashboard/settings/privacy", icon: Lock, desc: "GDPR, retención de datos y SSO" },
        ]
    }
];

export function SettingsSidebar() {
    const pathname = usePathname();

    // Active item resolution
    const activeItem = useMemo(() => {
        for (const group of SETTINGS_NAV_GROUPS) {
            for (const item of group.items) {
                if (pathname === item.href || (item.href !== "/dashboard" && item.href !== "/dashboard/settings" && pathname.startsWith(item.href + "/"))) {
                    return item;
                }
            }
        }
        return null;
    }, [pathname]);

    return (
        <aside className="w-full lg:w-72 shrink-0 flex flex-col space-y-6">
            {/* Mobile Top Header */}
            <div className="flex items-center justify-between mb-1 lg:hidden">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver al Dashboard</span>
                </Link>
                {activeItem && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {activeItem.name}
                    </span>
                )}
            </div>

            {/* Hub root quick link */}
            <div className="hidden lg:block pb-2 border-b border-slate-800/80">
                <Link
                    href="/dashboard/settings"
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        pathname === "/dashboard/settings"
                            ? "bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-sm"
                            : "bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800/60 border-slate-800"
                    }`}
                >
                    <div className="flex items-center gap-2.5">
                        <Sliders className="w-4 h-4 text-teal-400" />
                        <span>Vista General de Ajustes</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-950">
                        HUB
                    </span>
                </Link>
            </div>

            {/* Navigation Groups List */}
            <nav className="flex lg:flex-col gap-6 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
                {SETTINGS_NAV_GROUPS.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                        <div key={group.code} className="flex lg:flex-col gap-1 shrink-0 w-64 lg:w-full">
                            <div className="hidden lg:flex items-center gap-1.5 px-3 mb-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                                <GroupIcon className="w-3.5 h-3.5 text-slate-500" />
                                <span>{group.title}</span>
                            </div>

                            <div className="flex lg:flex-col gap-1 w-full">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isExactActive = pathname === item.href;
                                    const isPrefixActive = item.href !== "/dashboard/settings" && item.href !== "/dashboard" && pathname.startsWith(item.href + "/");
                                    const isActive = isExactActive || isPrefixActive;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                                                isActive
                                                    ? "bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-[0_0_15px_-3px_rgba(20,184,166,0.25)] font-bold"
                                                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-800"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className={`shrink-0 transition-colors ${isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                                                    <Icon className="w-4 h-4" />
                                                </span>
                                                <span className="truncate leading-tight">
                                                    {item.name}
                                                </span>
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
                            </div>
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
