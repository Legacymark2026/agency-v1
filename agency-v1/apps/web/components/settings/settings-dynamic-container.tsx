"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { SETTINGS_NAV_GROUPS } from "@/components/settings/settings-sidebar";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SettingsDynamicContainerProps {
    children: React.ReactNode;
}

export function SettingsDynamicContainer({ children }: SettingsDynamicContainerProps) {
    const pathname = usePathname();

    // Find current module information
    const currentModule = useMemo(() => {
        if (pathname === "/dashboard/settings") {
            return {
                title: "Vista General de Configuración",
                desc: "Centro neurálgico de gestión de perfiles, gobernanza empresarial y arquitecturas de microservicios.",
                groupTitle: "Panel Global",
                badge: "HUB",
            };
        }

        for (const group of SETTINGS_NAV_GROUPS) {
            for (const item of group.items) {
                if (pathname === item.href || (item.href !== "/dashboard" && item.href !== "/dashboard/settings" && pathname.startsWith(item.href + "/"))) {
                    return {
                        title: item.name,
                        desc: item.desc || "Ajustes y parámetros específicos para este módulo de la organización.",
                        groupTitle: group.title,
                        badge: item.badge || group.code,
                    };
                }
            }
        }

        return {
            title: "Módulo de Configuración",
            desc: "Administración de parámetros del sistema y políticas de acceso.",
            groupTitle: "Configuración",
            badge: "SISTEMA",
        };
    }, [pathname]);

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Dynamic Breadcrumbs & Section Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 bg-slate-950/40 p-4 rounded-2xl border">
                <div>
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        <Link href="/dashboard/settings" className="hover:text-teal-400 transition-colors">
                            Configuración
                        </Link>
                        <span>/</span>
                        <span className="text-slate-400">{currentModule.groupTitle}</span>
                        <span>/</span>
                        <span className="text-teal-400 font-bold">{currentModule.title}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                        {currentModule.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                        {currentModule.desc}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        <Sparkles className="w-3 h-3 text-teal-400" />
                        {currentModule.badge}
                    </span>
                </div>
            </div>

            {/* Exclusive Module Content Render Container */}
            <div
                key={pathname}
                className="flex-1 rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 md:p-8 backdrop-blur-sm animate-in fade-in-50 duration-200"
            >
                {children}
            </div>
        </div>
    );
}
