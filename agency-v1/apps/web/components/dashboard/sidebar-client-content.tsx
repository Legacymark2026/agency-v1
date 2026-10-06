"use client";

import { useUIStore } from "@/lib/stores/ui-store";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import {
    LogOut, PanelLeftClose, Palette, Check, Share2
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef, useMemo, useTransition } from "react";
import { PLATFORM_VERSION } from "@/lib/version";
import { AreaModulesAccordion, NavArea } from "./AreaModulesAccordion";

interface SidebarContentProps {
    navAreas: NavArea[];
    accessibleRoutes: string[];
    companyLogoUrl?: string | null;
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
    role?: string;
    badge?: { label: string; color: string };
    userInfo?: {
        name: string | null | undefined;
        email: string | null | undefined;
        image?: string | null | undefined;
        badge: { label: string; color: string };
    };
}

export function SidebarClientContent(props: SidebarContentProps) {
    const { navAreas, accessibleRoutes, companyLogoUrl, name, email, image, role, badge, userInfo } = props;

    const currentUser = {
        name: userInfo?.name ?? name ?? "Usuario",
        email: userInfo?.email ?? email ?? "usuario@legacymarksas.com",
        image: userInfo?.image ?? image ?? null,
        badge: userInfo?.badge ?? badge ?? { label: role || "SUPER_ADMIN", color: "text-teal-400 border-teal-800/60 bg-teal-950/40" },
    };

    const { sidebarCollapsed, toggleSidebar, accent, setAccent } = useUIStore();
    const [isPending, startTransition] = useTransition();
    const [showColorPicker, setShowColorPicker] = useState(false);
    const pathname = usePathname();

    // Memoize accessible areas, filtering modules and submodules based on accessibleRoutes
    const accessibleAreas = useMemo(() => {
        const accessibleSet = new Set(accessibleRoutes);

        return navAreas
            .map((area) => {
                const filteredModules = area.modules
                    .map((mod) => {
                        const filteredSubmodules = mod.submodules
                            ? mod.submodules.filter((sub) => accessibleSet.has(sub.href))
                            : [];

                        // If direct module href is specified
                        const isDirectAccessible = mod.href ? accessibleSet.has(mod.href) : false;

                        return {
                            ...mod,
                            submodules: filteredSubmodules,
                            isAccessible: isDirectAccessible || filteredSubmodules.length > 0,
                        };
                    })
                    .filter((mod) => mod.isAccessible);

                const isSettingsAccessible = accessibleSet.has(area.settingsHref);

                return {
                    ...area,
                    modules: filteredModules,
                    isAccessible: filteredModules.length > 0 || isSettingsAccessible,
                };
            })
            .filter((area) => area.isAccessible);
    }, [navAreas, accessibleRoutes]);

    // Initial Area resolution
    const [activeAreaCode, setActiveAreaCode] = useState<string>(() => {
        const currentArea = accessibleAreas.find((area) => {
            if (pathname === area.settingsHref || (area.settingsHref !== "/dashboard" && pathname.startsWith(area.settingsHref + "/"))) {
                return true;
            }
            return area.modules.some((mod) => {
                if (mod.href && (pathname === mod.href || (mod.href !== "/dashboard" && pathname.startsWith(mod.href + "/")))) {
                    return true;
                }
                return mod.submodules?.some(
                    (sub) => pathname === sub.href || (sub.href !== "/dashboard" && pathname.startsWith(sub.href + "/"))
                );
            });
        });
        return currentArea?.code || accessibleAreas[0]?.code || "SYSTEM";
    });

    // Track pathname changes ONLY when the URL actually changes (do NOT override user clicks)
    const prevPathnameRef = useRef(pathname);
    useEffect(() => {
        if (prevPathnameRef.current !== pathname) {
            prevPathnameRef.current = pathname;
            const currentArea = accessibleAreas.find((area) => {
                if (pathname === area.settingsHref || (area.settingsHref !== "/dashboard" && pathname.startsWith(area.settingsHref + "/"))) {
                    return true;
                }
                return area.modules.some((mod) => {
                    if (mod.href && (pathname === mod.href || (mod.href !== "/dashboard" && pathname.startsWith(mod.href + "/")))) {
                        return true;
                    }
                    return mod.submodules?.some(
                        (sub) => pathname === sub.href || (sub.href !== "/dashboard" && pathname.startsWith(sub.href + "/"))
                    );
                });
            });
            if (currentArea) {
                setActiveAreaCode(currentArea.code);
            }
        }
    }, [pathname, accessibleAreas]);

    const activeArea = accessibleAreas.find((a) => a.code === activeAreaCode) || accessibleAreas[0];
    const accessibleRoutesSet = useMemo(() => new Set(accessibleRoutes), [accessibleRoutes]);

    const ACCENT_COLORS = [
        { key: "teal", bg: "bg-teal-500", label: "Verde Cuántico" },
        { key: "cyan", bg: "bg-cyan-500", label: "Cian Neón" },
        { key: "indigo", bg: "bg-indigo-500", label: "Índigo Profundo" },
        { key: "violet", bg: "bg-violet-500", label: "Violeta Eléctrico" },
        { key: "amber", bg: "bg-amber-500", label: "Ámbar Cálido" },
        { key: "rose", bg: "bg-rose-500", label: "Rosa Futurista" },
        { key: "emerald", bg: "bg-emerald-500", label: "Esmeralda Puro" },
    ];

    return (
        <div className="flex flex-row h-full">
            {/* Leftmost Rail: Áreas Principales de la Plataforma */}
            <div
                className="w-16 flex flex-col items-center py-4 border-r border-slate-800/60 bg-slate-950/80 shrink-0 select-none z-10"
                style={{ backdropFilter: "blur(12px)" }}
            >
                {/* Logo top */}
                <Link href="/dashboard" className="mb-6 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-900/40 border border-teal-500/30 flex items-center justify-center p-1.5 transition-all group-hover:scale-105 group-hover:border-teal-400">
                        {companyLogoUrl ? (
                            <Image src={companyLogoUrl} alt="Logo" width={28} height={28} className="object-contain" />
                        ) : (
                            <span className="font-black text-teal-400 font-mono text-base tracking-tighter">LM</span>
                        )}
                    </div>
                </Link>

                {/* Main Áreas Navigation Icons */}
                <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto overflow-x-hidden no-scrollbar w-full px-2">
                    {accessibleAreas.map((area) => {
                        const isActive = activeAreaCode === area.code;
                        return (
                            <button
                                key={area.code}
                                type="button"
                                onClick={() => {
                                    setActiveAreaCode(area.code);
                                    if (sidebarCollapsed) {
                                        toggleSidebar();
                                    }
                                }}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer ${
                                    isActive
                                        ? "bg-teal-500/15 text-teal-400 border border-teal-500/40 shadow-[0_0_15px_-3px_rgba(20,184,166,0.3)]"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                                }`}
                                title={area.title}
                            >
                                {area.icon}
                                {isActive && (
                                    <div className="absolute left-0 w-1 h-5 bg-teal-400 rounded-r-full" />
                                )}

                                {/* Hover Tooltip */}
                                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 border border-slate-800 text-xs text-white rounded-md shadow-xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                                    <span className="font-bold">{area.title}</span>
                                    <span className="text-[10px] text-teal-400 block font-mono">[{area.code}]</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Bottom Actions (Palette, Feed, Settings quick) */}
                <div className="flex flex-col items-center gap-3 mt-auto pt-4 border-t border-slate-800/60 w-full">
                    {/* Theme Picker Trigger */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-all ${
                                showColorPicker ? "bg-slate-800 text-teal-400 border-teal-500/40" : ""
                            }`}
                            title="Cambiar Color de Acento"
                        >
                            <Palette size={16} />
                        </button>

                        {/* Floating Color Palette Modal */}
                        {showColorPicker && (
                            <div
                                className="absolute left-full ml-3 bottom-0 p-3 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-2 min-w-[170px]"
                                style={{
                                    boxShadow: "0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(13,148,136,0.15)",
                                }}
                            >
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-1">
                                    Acento de Interfaz
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
                                                    isSelected
                                                        ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-105"
                                                        : "hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                                }`}
                                                title={c.label}
                                            >
                                                {isSelected && (
                                                    <Check size={12} className="text-white font-bold stroke-[3]" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Direct link to Muro Corporativo */}
                    <Link
                        href="/dashboard/feed"
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                            pathname === "/dashboard/feed"
                                ? "bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-[0_0_15px_-3px_rgba(20,184,166,0.3)]"
                                : "text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
                        }`}
                        title="Muro de Publicaciones Corporativo"
                    >
                        <Share2 size={16} />
                    </Link>
                </div>
            </div>

            {/* Right Pane: Módulos, Sub-módulos y Configuración del Área */}
            <div
                className={`flex flex-col shrink-0 bg-slate-900/50 backdrop-blur-md transition-all duration-300 ease-in-out overflow-hidden z-0 ${
                    sidebarCollapsed ? "w-0 opacity-0" : "w-[240px] opacity-100"
                }`}
            >
                {activeArea && (
                    <div className="flex flex-col h-full w-[240px]">
                        {/* Area Header */}
                        <div className="px-4 py-4 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/40">
                            <div>
                                <h2 className="text-xs font-black text-slate-100 tracking-wider uppercase flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                    {activeArea.title}
                                </h2>
                                <span className="font-mono text-[9px] text-teal-400/80 tracking-widest block mt-0.5">
                                    ÁREA: [{activeArea.code}]
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={toggleSidebar}
                                className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-800/60"
                                title="Ocultar Menú Lateral"
                            >
                                <PanelLeftClose size={14} />
                            </button>
                        </div>

                        {/* Hierarchical Accordion for Modules & Submodules */}
                        <div className="flex-1 overflow-hidden">
                            <AreaModulesAccordion
                                area={activeArea}
                                accessibleRoutesSet={accessibleRoutesSet}
                                pathname={pathname}
                            />
                        </div>

                        {/* User Profile & Session Footer */}
                        <div className="p-3 shrink-0" style={{ borderTop: "1px solid rgba(30,41,59,0.4)" }}>
                            <div className="flex flex-col mb-2.5">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Sesión Actual</span>
                                    <span
                                        className="flex items-center gap-1 text-[9px] font-mono text-emerald-400/90 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50"
                                        title={`Build: ${PLATFORM_VERSION.buildNumber} (${PLATFORM_VERSION.buildDate})`}
                                    >
                                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                        {PLATFORM_VERSION.version}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-300 truncate font-medium">{currentUser.email}</span>
                                <div className="mt-1 flex items-center justify-between">
                                    <span className={`inline-block px-1.5 py-0.5 text-[9px] font-mono rounded-sm border ${currentUser.badge.color}`}>
                                        {currentUser.badge.label}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-mono" title={PLATFORM_VERSION.releaseName}>
                                        {PLATFORM_VERSION.buildNumber.slice(0, 10)}
                                    </span>
                                </div>
                            </div>

                            <form action={signOutAction}>
                                <button
                                    type="submit"
                                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors group cursor-pointer"
                                >
                                    <LogOut size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                                    Cerrar Sesión
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}