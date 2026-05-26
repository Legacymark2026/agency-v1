"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Blocks, Bell, Palette, ArrowLeft, Building2, Users, Bot, Wand2 } from "lucide-react";

const NAV_ITEMS = [
    { name: "Perfil y Cuenta", href: "/dashboard/settings/profile", icon: User },
    { name: "Apariencia", href: "/dashboard/settings/appearance", icon: Palette },
    { name: "Compañía y Marca Blanca", href: "/dashboard/settings/company", icon: Building2 },
    { name: "Seguridad y Accesos", href: "/dashboard/settings/security", icon: Shield },
    { name: "Roles y Permisos", href: "/dashboard/settings/roles", icon: Shield },
    { name: "Equipo y Roles", href: "/dashboard/settings/members", icon: Users },
    { name: "Agentes de IA", href: "/dashboard/settings/agents", icon: Bot },
    { name: "Macros de Inbox", href: "/dashboard/settings/inbox/macros", icon: Wand2 },
    { name: "Notificaciones", href: "/dashboard/settings/notifications", icon: Bell },
    { name: "Integraciones", href: "/dashboard/settings/integrations", icon: Blocks },
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

            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-[0.15rem] border font-medium text-sm transition-all whitespace-nowrap ${isActive
                                ? "bg-[var(--ds-teal-dim)] text-[var(--ds-teal)] border-[var(--ds-border-glow)] shadow-sm"
                                : "border-transparent text-[var(--ds-text-secondary)] hover:bg-[var(--ds-surface-2)] hover:text-[var(--ds-text-primary)]"
                                }`}
                        >
                            <item.icon className={`w-4 h-4 ${isActive ? "text-[var(--ds-teal)]" : "text-[var(--ds-text-muted)]"}`} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    );
}
