"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Settings as SettingsIcon } from "lucide-react";

export interface NavSubmodule {
    href: string;
    label: string;
    icon?: React.ReactNode;
    code?: string;
}

export interface NavModule {
    title: string;
    code: string;
    icon?: React.ReactNode;
    href?: string;
    submodules?: NavSubmodule[];
}

export interface NavArea {
    title: string;
    code: string;
    accent?: string;
    icon: React.ReactNode;
    modules: NavModule[];
    settingsHref: string;
    settingsLabel?: string;
}

interface AreaModulesAccordionProps {
    area: NavArea;
    accessibleRoutesSet: Set<string>;
    pathname: string;
}

export function AreaModulesAccordion({ area, accessibleRoutesSet, pathname }: AreaModulesAccordionProps) {
    // Determine active module from pathname
    const activeModuleIndex = area.modules.findIndex((mod) => {
        if (mod.href && (pathname === mod.href || (mod.href !== "/dashboard" && pathname.startsWith(mod.href + "/")))) {
            return true;
        }
        if (mod.submodules) {
            return mod.submodules.some(
                (sub) => pathname === sub.href || (sub.href !== "/dashboard" && pathname.startsWith(sub.href + "/"))
            );
        }
        return false;
    });

    // Keep an accordion state: open states for each module code
    const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        area.modules.forEach((mod, idx) => {
            // Open if contains current route or if it's the first module by default
            const isMatch =
                (mod.href && (pathname === mod.href || (mod.href !== "/dashboard" && pathname.startsWith(mod.href + "/")))) ||
                (mod.submodules &&
                    mod.submodules.some(
                        (sub) => pathname === sub.href || (sub.href !== "/dashboard" && pathname.startsWith(sub.href + "/"))
                    ));
            initial[mod.code] = Boolean(isMatch || (activeModuleIndex === -1 && idx === 0));
        });
        return initial;
    });

    const toggleModule = (code: string) => {
        setOpenModules((prev) => ({
            ...prev,
            [code]: !prev[code],
        }));
    };

    const isAreaSettingsActive =
        pathname === area.settingsHref || (area.settingsHref !== "/dashboard" && pathname.startsWith(area.settingsHref + "/"));

    return (
        <div className="flex flex-col h-full justify-between">
            {/* Scrollable Modules and Submodules Tree */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2 no-scrollbar">
                {area.modules.map((mod) => {
                    const hasSubmodules = Boolean(mod.submodules && mod.submodules.length > 0);
                    const isOpen = Boolean(openModules[mod.code]);

                    // Check if current module or its submodules are active
                    const isDirectActive =
                        mod.href &&
                        (pathname === mod.href || (mod.href !== "/dashboard" && pathname.startsWith(mod.href + "/")));
                    const hasActiveChild =
                        mod.submodules &&
                        mod.submodules.some(
                            (sub) => pathname === sub.href || (sub.href !== "/dashboard" && pathname.startsWith(sub.href + "/"))
                        );
                    const isModuleHighlighted = isDirectActive || hasActiveChild;

                    return (
                        <div key={mod.code} className="rounded-xl overflow-hidden bg-slate-950/40 border border-slate-800/40">
                            {/* Module Header / Trigger */}
                            {hasSubmodules ? (
                                <button
                                    type="button"
                                    onClick={() => toggleModule(mod.code)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-lg transition-all text-left ${
                                        isModuleHighlighted
                                            ? "text-teal-300 font-bold bg-teal-500/10"
                                            : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`shrink-0 ${isModuleHighlighted ? "text-teal-400" : "text-slate-400"}`}>
                                            {mod.icon}
                                        </span>
                                        <span className="truncate leading-tight">{mod.title}</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 ml-1">
                                        {mod.code && (
                                            <span className="text-[9px] font-mono text-slate-500 px-1 py-0.2 rounded bg-slate-900 border border-slate-800">
                                                {mod.code}
                                            </span>
                                        )}
                                        {isOpen ? (
                                            <ChevronDown size={13} className="text-slate-400" />
                                        ) : (
                                            <ChevronRight size={13} className="text-slate-500" />
                                        )}
                                    </div>
                                </button>
                            ) : mod.href ? (
                                <Link
                                    href={mod.href}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                                        isDirectActive
                                            ? "bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30 shadow-sm"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`shrink-0 ${isDirectActive ? "text-teal-400" : "text-slate-500"}`}>
                                            {mod.icon}
                                        </span>
                                        <span className="truncate leading-tight">{mod.title}</span>
                                    </div>
                                    {mod.code && (
                                        <span className="text-[9px] font-mono text-slate-500 px-1 py-0.2 rounded bg-slate-900 border border-slate-800">
                                            {mod.code}
                                        </span>
                                    )}
                                </Link>
                            ) : null}

                            {/* Submodules Nested Section */}
                            {hasSubmodules && isOpen && (
                                <div className="pl-4 pr-1.5 py-1 space-y-0.5 border-l-2 border-teal-500/20 ml-3.5 mb-1.5 my-1">
                                    {mod.submodules!.map((sub) => {
                                        const isSubActive =
                                            pathname === sub.href ||
                                            (sub.href !== "/dashboard" && pathname.startsWith(sub.href + "/"));

                                        return (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                                                    isSubActive
                                                        ? "bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40"
                                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {sub.icon ? (
                                                        <span className="shrink-0 text-slate-500">{sub.icon}</span>
                                                    ) : (
                                                        <span
                                                            className={`w-1 h-1 rounded-full shrink-0 ${
                                                                isSubActive ? "bg-teal-400" : "bg-slate-600"
                                                            }`}
                                                        />
                                                    )}
                                                    <span className="truncate">{sub.label}</span>
                                                </div>
                                                {sub.code && (
                                                    <span className="text-[8.5px] font-mono opacity-50 ml-1">
                                                        {sub.code}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Pinned Dedicated Area Configuration Footer */}
            <div className="p-3 border-t border-slate-800/70 bg-slate-950/60 shrink-0">
                <Link
                    href={area.settingsHref}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isAreaSettingsActive
                            ? "bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm"
                            : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800/80 border-slate-800 hover:border-slate-700"
                    }`}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <SettingsIcon
                            size={14}
                            className={isAreaSettingsActive ? "text-teal-400" : "text-slate-400"}
                        />
                        <span className="truncate">
                            {area.settingsLabel || `Configurar Área`}
                        </span>
                    </div>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-950/80 text-teal-400/90 border border-slate-800">
                        AJUSTES
                    </span>
                </Link>
            </div>
        </div>
    );
}
