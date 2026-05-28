"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Blocks, Bell, Palette, ArrowLeft, Building2, Users, Bot, Wand2, CreditCard, Code2 } from "lucide-react";

interface NavGroup {
    title: string;
    items: { name: string; href: string; icon: any }[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        title: "Ajustes Personales",
        items: [
            { name: "Perfil y Cuenta", href: "/dashboard/settings/profile", icon: User },
            { name: "Apariencia", href: "/dashboard/settings/appearance", icon: Palette },
            { name: "Notificaciones", href: "/dashboard/settings/notifications", icon: Bell },
        ]
    },
    {
        title: "Configuración de Empresa",
        items: [
            { name: "Compañía y Marca", href: "/dashboard/settings/company", icon: Building2 },
            { name: "Equipo y Roles", href: "/dashboard/settings/members", icon: Users },
            { name: "Roles y Permisos", href: "/dashboard/settings/roles", icon: Shield },
            { name: "Integraciones", href: "/dashboard/admin/marketing/settings", icon: Blocks },
            { name: "Facturación B2B", href: "/dashboard/settings/billing", icon: CreditCard },
            { name: "Developer & API", href: "/dashboard/settings/developer", icon: Code2 },
        ]
    },
    {
        title: "IA & Canales",
        items: [
            { name: "Agentes de IA", href: "/dashboard/settings/agents", icon: Bot },
            { name: "Macros de Inbox", href: "/dashboard/settings/inbox/macros", icon: Wand2 },
            { name: "Seguridad y Accesos", href: "/dashboard/settings/security", icon: Shield },
        ]
    }
];

export function SettingsSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-full lg:w-64 shrink-0 flex flex-col space-y-6">
            <div className="flex items-center gap-2 mb-2 lg:mb-4 lg:hidden">
                <Link href="/dashboard" className="p-2 -ml-2 text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h2 className="text-xl font-bold tracking-tight text-[var(--ds-text-primary)]">Configuración</h2>
            </div>

            <nav className="flex lg:flex-col gap-6 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
                {NAV_GROUPS.map((group) => (
                    <div key={group.title} className="flex lg:flex-col gap-1 shrink-0">
                        <h4 className="hidden lg:block text-[10px] font-mono font-bold text-[var(--ds-text-muted)] uppercase tracking-wider px-3 mb-1.5 mt-2">
                            {group.title}
                        </h4>
                        <div className="flex lg:flex-col gap-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-[0.15rem] border font-medium text-xs transition-all whitespace-nowrap ${isActive
                                            ? "bg-[var(--ds-teal-dim)] text-[var(--ds-teal)] border-[var(--ds-border-glow)] shadow-sm"
                                            : "border-transparent text-[var(--ds-text-secondary)] hover:bg-[var(--ds-surface-2)] hover:text-[var(--ds-text-primary)]"
                                            }`}
                                    >
                                        <item.icon className={`w-3.5 h-3.5 ${isActive ? "text-[var(--ds-teal)]" : "text-[var(--ds-text-muted)]"}`} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}
