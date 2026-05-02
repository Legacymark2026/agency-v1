"use client";

import { useUIStore } from "@/lib/stores/ui-store";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import {
    LogOut, PanelLeftClose, PanelLeft
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { NotificationBell } from "./notification-bell";

interface NavItem { href: string; label: string; icon: React.ReactNode; code?: string; }
interface NavGroup { title: string; code: string; accent?: string; icon?: React.ReactNode; items: NavItem[]; }

interface SidebarContentProps {
    navGroups: NavGroup[];
    accessibleRoutes: string[];
    userInfo: {
        name: string | null | undefined;
        email: string | null | undefined;
        image?: string | null | undefined;
        badge: { label: string; color: string };
    };
}

export function SidebarClientContent({ navGroups, accessibleRoutes, userInfo }: SidebarContentProps) {
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const pathname = usePathname();
    const accessibleSet = new Set(accessibleRoutes);

    // Filter groups to only include accessible ones
    const accessibleGroups = navGroups.map(group => ({
        ...group,
        items: group.items.filter(item => accessibleSet.has(item.href))
    })).filter(group => group.items.length > 0);

    const [activeGroupId, setActiveGroupId] = useState<string>(() => {
        // Find group containing current pathname
        const currentGroup = accessibleGroups.find(g => g.items.some(i => pathname === i.href || pathname.startsWith(i.href + '/')));
        return currentGroup?.code || accessibleGroups[0]?.code;
    });

    // Auto-sync on route change
    useEffect(() => {
        const currentGroup = accessibleGroups.find(g => g.items.some(i => pathname === i.href || pathname.startsWith(i.href + '/')));
        if (currentGroup) setActiveGroupId(currentGroup.code);
    }, [pathname]);

    const activeGroup = accessibleGroups.find(g => g.code === activeGroupId);

    return (
        <div className="flex h-full">
            {/* Left Pane: Primary Icons (Always Visible) */}
            <div className="w-[64px] flex flex-col shrink-0 items-center justify-between py-4 z-10 bg-slate-950" 
                 style={{ borderRight: '1px solid rgba(30,41,59,0.8)' }}>
                
                <div className="flex flex-col items-center w-full gap-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center justify-center w-full group relative mb-2" title="Ir al Inicio">
                        <div className="relative h-8 w-8 transition-opacity group-hover:opacity-80">
                            <Image src="/logo.png" alt="LegacyMark" fill className="object-contain" priority style={{ filter: 'brightness(0) invert(1)' }} />
                        </div>
                    </Link>

                    {/* Nav Icons */}
                    <nav className="flex flex-col items-center gap-3 w-full">
                        {accessibleGroups.map((group) => {
                            const isActive = activeGroupId === group.code;
                            return (
                                <button
                                    key={group.code}
                                    onClick={() => {
                                        setActiveGroupId(group.code);
                                        if (sidebarCollapsed) toggleSidebar();
                                    }}
                                    className={`relative group flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 ${
                                        isActive ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                    }`}
                                    title={group.title}
                                >
                                    {isActive && (
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-teal-500 rounded-r-full" />
                                    )}
                                    {group.icon}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Left Pane: User Avatar */}
                <div className="flex flex-col items-center gap-4 w-full">
                    <NotificationBell />
                    <div className="group relative">
                        {userInfo.image ? (
                            <div className="relative h-8 w-8 rounded-full overflow-hidden border border-slate-700 cursor-pointer group-hover:border-teal-500 transition-colors">
                                <Image src={userInfo.image} alt={userInfo.name ?? "Avatar"} fill className="object-cover" />
                            </div>
                        ) : (
                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black bg-slate-800 text-teal-400 border border-slate-700 cursor-pointer group-hover:border-teal-500 transition-colors">
                                {userInfo.name?.[0]?.toUpperCase() ?? "U"}
                            </div>
                        )}
                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl pointer-events-none">
                            {userInfo.name}
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
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-5 shrink-0" style={{ borderBottom: '1px solid rgba(30,41,59,0.4)' }}>
                            <h2 className="text-sm font-semibold text-slate-200 truncate pr-2">
                                {activeGroup.title}
                            </h2>
                            <button 
                                onClick={toggleSidebar} 
                                className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors shrink-0"
                                title="Ocultar menú"
                            >
                                <PanelLeftClose size={16} />
                            </button>
                        </div>

                        {/* Navigation Items */}
                        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-hide">
                            {activeGroup.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            isActive 
                                                ? 'bg-teal-500/10 text-teal-400' 
                                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                        }`}
                                    >
                                        <span className={`shrink-0 ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                                            {item.icon}
                                        </span>
                                        <span className="truncate">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Footer Right Pane: Logout & User info */}
                        <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(30,41,59,0.4)' }}>
                            <div className="flex flex-col mb-3">
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Sesión Actual</span>
                                <span className="text-xs text-slate-300 truncate">{userInfo.email}</span>
                                <div className="mt-1">
                                    <span className={`inline-block px-1.5 py-0.5 text-[9px] font-mono rounded-sm border ${userInfo.badge.color}`}>
                                        {userInfo.badge.label}
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