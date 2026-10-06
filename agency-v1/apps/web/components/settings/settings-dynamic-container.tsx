"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { SETTINGS_CATEGORIES, resolveActiveSettingsCategory } from "@/components/settings/settings-sidebar";
import { Sparkles, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

interface SettingsDynamicContainerProps {
    children: React.ReactNode;
}

export function SettingsDynamicContainer({ children }: SettingsDynamicContainerProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get("category");

    // Resolve active category
    const activeCategory = useMemo(() => {
        return resolveActiveSettingsCategory(pathname, categoryParam);
    }, [pathname, categoryParam]);

    // Find current module information
    const currentModule = useMemo(() => {
        if (pathname === "/dashboard/settings" && !activeCategory) {
            return {
                title: "Centro de Control de Ajustes",
                desc: "Directorio global de gobernanza SaaS, ajustes personales, áreas y motores de IA.",
                categoryTitle: "Hub Central",
                badge: "HUB GLOBAL",
                color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
            };
        }

        if (activeCategory) {
            for (const item of activeCategory.items) {
                if (pathname === item.href || (item.href !== "/dashboard" && item.href !== "/dashboard/settings" && pathname.startsWith(item.href + "/"))) {
                    return {
                        title: item.name,
                        desc: item.desc || "Ajustes y parámetros específicos para este módulo de la organización.",
                        categoryTitle: activeCategory.title,
                        badge: item.badge || activeCategory.badge,
                        color: activeCategory.color,
                    };
                }
            }

            // At category root (e.g., /dashboard/settings?category=org)
            return {
                title: activeCategory.title,
                desc: activeCategory.description,
                categoryTitle: activeCategory.title,
                badge: activeCategory.badge,
                color: activeCategory.color,
            };
        }

        return {
            title: "Módulo de Configuración",
            desc: "Administración de parámetros del sistema y políticas de acceso.",
            categoryTitle: "Configuración",
            badge: "SISTEMA",
            color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
        };
    }, [pathname, activeCategory]);

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Dynamic Breadcrumbs & Section Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 bg-slate-950/40 p-4 sm:p-5 rounded-2xl border">
                <div>
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex-wrap">
                        <Link href="/dashboard/settings" className="hover:text-teal-400 transition-colors flex items-center gap-1">
                            <ArrowLeft className="w-3 h-3 lg:hidden" />
                            <span>Configuración</span>
                        </Link>
                        <span>/</span>
                        {activeCategory ? (
                            <Link 
                                href={activeCategory.items[0]?.href || `/dashboard/settings?category=${activeCategory.slug}`}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                {activeCategory.title}
                            </Link>
                        ) : (
                            <span className="text-slate-400">{currentModule.categoryTitle}</span>
                        )}
                        <span>/</span>
                        <span className="text-teal-400 font-bold truncate">{currentModule.title}</span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                        {currentModule.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                        {currentModule.desc}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-900 border border-slate-700/80 text-slate-300">
                        <Shield className="w-3 h-3 text-teal-400" />
                        {currentModule.badge}
                    </span>
                </div>
            </div>

            {/* Exclusive Module Content Render Container */}
            <div
                key={pathname + (categoryParam || "")}
                className="flex-1 rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 md:p-8 backdrop-blur-sm animate-in fade-in-50 duration-200"
            >
                {children}
            </div>
        </div>
    );
}
