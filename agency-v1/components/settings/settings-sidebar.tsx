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
                <Link href="/dashboard" className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Configuración</h2>
            </div>

            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${isActive
                                ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                        >
                            <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    );
}
