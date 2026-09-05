"use client";

import { useUIStore } from "@/lib/stores/ui-store";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import {
    LogOut, PanelLeftClose, PanelLeft, Palette, Check, Share2
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef, useMemo, useTransition } from "react";
import { NotificationBell } from "./notification-bell";
import { PLATFORM_VERSION } from "@/lib/version";

interface NavItem { href: string; label: string; icon: React.ReactNode; code?: string; }
interface NavGroup { title: string; code: string; accent?: string; icon?: React.ReactNode; items: NavItem[]; }

interface SidebarContentProps {
    navGroups: NavGroup[];
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
    const { navGroups, accessibleRoutes, companyLogoUrl, name, email, image, role, badge, userInfo } = props;

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

    // Memoize accessible groups to prevent referential churn
    const accessibleGroups = useMemo(() => {
        const accessibleSet = new Set(accessibleRoutes);
        return navGroups.map(group => ({
            ...group,
            items: group.items.filter(item => accessibleSet.has(item.href))
        })).filter(group => group.items.length > 0);
    }, [navGroups, accessibleRoutes]);

    // Initial group resolution
    const [activeGroupId, setActiveGroupId] = useState<string>(() => {
        const currentGroup = accessibleGroups.find(g => 
            g.items.some(i => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href + '/')))
        );
        return currentGroup?.code || accessibleGroups[0]?.code || "DB_MAIN";
    });

    // Track pathname changes ONLY when the URL actually changes (do NOT override user clicks)
    const prevPathnameRef = useRef(pathname);
    useEffect(() => {
        if (prevPathnameRef.current !== pathname) {
            prevPathnameRef.current = pathname;
            const currentGroup = accessibleGroups.find(g => 
                g.items.some(i => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href + '/')))
            );
            if (currentGroup) {
                setActiveGroupId(currentGroup.code);
            }
        }
    }, [pathname, accessibleGroups]);

    const activeGroup = accessibleGroups.find(g => g.code === activeGroupId) || accessibleGroups[0];

    const ACCENT_COLORS = [
        { key: 'teal', bg: 'bg-teal-500', label: 'Verde Cuántico' },
        { key: 'cyan', bg: 'bg-cyan-500', label: 'Cian Neón' },
        { key: 'indigo', bg: 'bg-indigo-500', label: 'Índigo Profundo' },
        { key: 'violet', bg: 'bg-violet-500', label: 'Violeta Eléctrico' },
        { key: 'amber', bg: 'bg-amber-500', label: 'Ámbar Cálido' },
        { key: 'rose', bg: 'bg-rose-500', label: 'Rosa Futurista' },
        { key: 'emerald', bg: 'bg-emerald-500', label: 'Esmeralda Puro' },
    ];

    return (
        <div className="flex flex-row h-full">
            {/* Leftmost Slim Rail (Icons for Domains) */}
            <div 
                className="w-16 flex flex-col items-center py-4 border-r border-slate-800/60 bg-slate-950/80 shrink-0 select-none z-10"
                style={{ backdropFilter: 'blur(12px)' }}
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

                {/* Main Domain Navigation Icons */}
                <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto overflow-x-hidden no-scrollbar w-full px-2">
                    {accessibleGroups.map((group) => {
                        const isActive = activeGroupId === group.code;
                        return (
                            <button
                                key={group.code}
                                type="button"
                                onClick={() => {
                                    setActiveGroupId(group.code);
                                    if (sidebarCollapsed) {
                                        toggleSidebar();
                                    }
                                }}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 relative group cursor-pointer ${
                                    isActive
                                        ? 'bg-teal-500/15 text-teal-400 border border-teal-500/40 shadow-[0_0_15px_-3px_rgba(20,184,166,0.3)]'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                                }`}
                                title={group.title}
                            >
                                {group.icon}
                                {isActive && (
                                    <div className="absolute left-0 w-1 h-5 bg-teal-400 rounded-r-full" />
                                )}
                                
                                {/* Tooltip */}
                                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 border border-slate-800 text-xs text-white rounded-md shadow-xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                                    {group.title}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Bottom Actions (Palette, Bell, User Profile) */}
                <div className="flex flex-col items-center gap-3 mt-auto pt-4 border-t border-slate-800/60 w-full">
                    {/* Theme Picker Trigger */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-all ${
                                showColorPicker ? 'bg-slate-800 text-teal-400 border-teal-500/40' : ''
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
                                    boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(13,148,136,0.15)'
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
                                                    isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-105' : 'hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]'
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

                        <NotificationBell />
                    <div className="group relative">
                        {currentUser.image ? (
                            <div className="relative h-8 w-8 rounded-full overflow-hidden border border-slate-700 cursor-pointer group-hover:border-teal-500 transition-colors">
                                <Image src={currentUser.image} alt={currentUser.name ?? "Avatar"} fill className="object-cover" />
                            </div>
                        ) : (
                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black bg-slate-800 text-teal-400 border border-slate-700 cursor-pointer group-hover:border-teal-500 transition-colors">
                                {currentUser.name?.[0]?.toUpperCase() ?? "U"}
                            </div>
                        )}
                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none">
                            {currentUser.name}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Pane: Sub-menu (Collapsible) */}
            <div 
                className={`flex flex-col shrink-0 bg-slate-900/50 backdrop-blur-md transition-all duration-300 ease-in-out overflow-hidden z-0 ${
                    sidebarCollapsed ? 'w-0 opacity-0' : 'w-[224px] opacity-100'
                }`}
            >
                {activeGroup && (
                    <div className="flex flex-col h-full w-[224px]">
                        {/* Group Header */}
                        <div className="px-4 py-5 flex items-center justify-between border-b border-slate-800/60">
                            <div>
                                <h2 className="text-xs font-black text-slate-200 tracking-wider uppercase">
                                    {activeGroup.title}
                                </h2>
                                <span className="font-mono text-[9px] text-slate-500 tracking-widest">
                                    [{activeGroup.code}]
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

                        {/* Navigation Items List */}
                        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 no-scrollbar">
                            {activeGroup.items.map((item) => {
                                const isCurrent = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group ${
                                            isCurrent
                                                ? 'bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30 shadow-sm'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className={`shrink-0 ${isCurrent ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                                {item.icon}
                                            </span>
                                            <span className="truncate">{item.label}</span>
                                        </div>
                                        {item.code && (
                                            <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded tracking-tighter shrink-0 ${
                                                isCurrent ? 'bg-teal-950 text-teal-400 border border-teal-800/50' : 'text-slate-600 bg-slate-900/60'
                                            }`}>
                                                {item.code}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Footer Info & Logout */}
                        <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(30,41,59,0.4)' }}>
                            <div className="flex flex-col mb-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Sesión Actual</span>
                                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/90 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50" title={`Build: ${PLATFORM_VERSION.buildNumber} (${PLATFORM_VERSION.buildDate})`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        {PLATFORM_VERSION.version}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-300 truncate">{currentUser.email}</span>
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
                                <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors group">
                                    <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
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