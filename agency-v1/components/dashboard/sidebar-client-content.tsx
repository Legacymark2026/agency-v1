"use client";

import { useUIStore } from "@/lib/stores/ui-store";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import {
    LayoutDashboard, Users, Settings, FileText, LogOut,
    BookOpen, Briefcase, BarChart2, Workflow,
    MessageSquare, Target, TrendingUp, Link2, Building2,
    Lock, UserCog, DollarSign, CheckSquare, Zap, Mail, Calendar, Wand2,
    Activity, Bot, Trello, CreditCard, Landmark,
    PanelLeftClose, PanelLeft, Image as ImageIcon, ChevronDown, ChevronRight
} from "lucide-react";
import Image from "next/image";
import { NotificationBell } from "./notification-bell";
import { useState } from "react";

interface NavItem { href: string; label: string; icon: React.ReactNode; code?: string; }
interface NavGroup { title: string; code: string; accent?: string; items: NavItem[]; }

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

const ACCENT_COLORS: Record<string, { label: string; dot: string }> = {
    default: { label: "text-slate-500", dot: "bg-slate-600" },
    teal: { label: "text-teal-500", dot: "bg-teal-500" },
    amber: { label: "text-amber-500", dot: "bg-amber-500" },
    violet: { label: "text-violet-500", dot: "bg-violet-500" },
    cyan: { label: "text-cyan-500", dot: "bg-cyan-500" },
};

const DEFAULT_EXPANDED_GROUPS = new Set(['CLIENT_PORTAL', 'SYS_CORE']);

export function SidebarClientContent({ navGroups, accessibleRoutes, userInfo }: SidebarContentProps) {
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const pathname = usePathname();
    const accessibleSet = new Set(accessibleRoutes);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(DEFAULT_EXPANDED_GROUPS);

    const toggleGroup = (code: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code);
            else next.add(code);
            return next;
        });
    };

    if (sidebarCollapsed) {
        // Mini mode - simplified
        return (
            <>
                <div className="flex items-center justify-between shrink-0 px-3 py-4"
                    style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                    <Link href="/" className="flex items-center justify-center w-full group">
                        <div className="relative h-10 w-10 transition-opacity group-hover:opacity-80">
                            <Image src="/logo.png" alt="LegacyMark" fill className="object-contain" priority style={{ filter: 'brightness(0) invert(1)' }} />
                        </div>
                    </Link>
                </div>
                <div className="flex justify-center py-2" style={{ borderBottom: '1px solid rgba(30,41,59,0.4)' }}>
                    <button onClick={toggleSidebar} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-teal-400 transition-all">
                        <PanelLeft size={16} />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto py-2 space-y-0 scrollbar-hide">
                    {navGroups.map((group) => {
                        const accessible = group.items.filter(item => accessibleSet.has(item.href));
                        if (accessible.length === 0) return null;
                        return (
                            <div key={group.title} className="mb-1">
                                {accessible.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link key={item.href} href={item.href}
                                            className={`group flex items-center justify-center p-2 mx-2 text-[11.5px] font-medium transition-all duration-200 relative rounded-md hover:bg-slate-800 ${isActive ? 'bg-teal-500/20' : ''}`}
                                            style={{ color: isActive ? '#14b8a6' : 'rgba(148,163,184,0.9)' }}
                                            title={item.label}
                                        >
                                            <span className={`shrink-0 opacity-60 group-hover:opacity-100 group-hover:text-teal-400 transition-all ${isActive ? 'text-teal-400' : ''}`}>
                                                {item.icon}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>
                <div className="shrink-0 p-2 flex flex-col items-center gap-2" style={{ borderTop: '1px solid rgba(30,41,59,0.6)' }}>
                    {userInfo.image ? (
                        <div className="relative h-8 w-8 rounded-sm overflow-hidden" style={{ border: '1px solid rgba(13,148,136,0.3)' }}>
                            <Image src={userInfo.image} alt={userInfo.name ?? "Avatar"} fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="h-8 w-8 rounded-sm flex items-center justify-center text-xs font-black" style={{ background: 'rgba(13,148,136,0.15)', color: '#14b8a6', border: '1px solid rgba(13,148,136,0.3)' }}>
                            {userInfo.name?.[0]?.toUpperCase() ?? "U"}
                        </div>
                    )}
                    <button onClick={() => document.querySelector('form[action*="signOut"]')?.dispatchEvent(new Event('submit', { bubbles: true }))} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors" title="Logout">
                        <LogOut size={14} />
                    </button>
                </div>
            </>
        );
    }

    // Expanded mode with accordion
    return (
        <>
            {/* Logo section */}
            <div className="flex items-center justify-between shrink-0 px-3 py-4" style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                <Link href="/" className="flex items-center justify-center w-full group">
                    <div className="relative h-16 w-full transition-opacity group-hover:opacity-80">
                        <Image src="/logo.png" alt="LegacyMark" fill className="object-contain" priority style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                </Link>
            </div>

            {/* Toggle button */}
            <div className="flex justify-center py-2" style={{ borderBottom: '1px solid rgba(30,41,59,0.4)' }}>
                <button onClick={toggleSidebar} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-teal-400 transition-all" title="Collapse sidebar">
                    <PanelLeftClose size={16} />
                </button>
            </div>

            {/* System HUD indicators */}
            <div className="flex items-center gap-3 px-4 py-2" style={{ borderBottom: '1px solid rgba(30,41,59,0.4)' }}>
                <div className="flex items-center gap-1.5 text-xs font-mono text-teal-400 uppercase tracking-widest">
                    <Activity size={8} className="text-teal-500" /> SYS: ONLINE
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <NotificationBell />
                    <span className="relative flex h-1.5 w-1.5 ml-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                    </span>
                </div>
            </div>

            {/* Navigation with Accordion */}
            <nav className="flex-1 overflow-y-auto py-2 space-y-0 scrollbar-hide min-h-0" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                {navGroups.map((group) => {
                    const accessible = group.items.filter(item => accessibleSet.has(item.href));
                    if (accessible.length === 0) return null;
                    const colors = ACCENT_COLORS[group.accent ?? 'default'];
                    const isExpanded = expandedGroups.has(group.code);

                    return (
                        <div key={group.title} className="mb-1">
                            {/* Group header with toggle */}
                            <div 
                                onClick={() => toggleGroup(group.code)}
                                className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.15em] cursor-pointer hover:bg-slate-800/50 ${colors.label}`}
                            >
                                <span className={`w-1 h-1 rounded-full ${colors.dot} opacity-60`} />
                                <span className="flex-1 text-left">{group.code}</span>
                                {isExpanded ? (
                                    <ChevronDown size={12} className="opacity-60" />
                                ) : (
                                    <ChevronRight size={12} className="opacity-60" />
                                )}
                            </div>

                            {/* Group items - collapsible */}
                            {isExpanded && (
                                <div className="ml-2">
                                    {accessible.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`group flex items-center gap-2.5 px-4 py-1.5 text-xs font-medium transition-all duration-200 relative ${
                                                    isActive ? 'bg-slate-800/50' : ''
                                                }`}
                                                style={{ color: isActive ? '#ffffff' : 'rgba(148,163,184,0.9)' }}
                                            >
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-3 bg-teal-500/80 group-hover:w-0.5 transition-all duration-200 rounded-r-full" />
                                                <span className={`shrink-0 opacity-50 group-hover:opacity-100 group-hover:text-teal-400 transition-all ${isActive ? 'text-teal-400' : ''}`}>
                                                    {item.icon}
                                                </span>
                                                <span className="group-hover:text-white transition-colors">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="shrink-0 p-3" style={{ borderTop: '1px solid rgba(30,41,59,0.6)' }}>
                <div className="flex items-center gap-2.5 mb-2">
                    {userInfo.image ? (
                        <div className="relative h-7 w-7 rounded-sm overflow-hidden shrink-0" style={{ border: '1px solid rgba(13,148,136,0.3)' }}>
                            <Image src={userInfo.image} alt={userInfo.name ?? "Avatar"} fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="h-7 w-7 rounded-sm flex items-center justify-center text-xs font-black shrink-0 font-mono" style={{ background: 'rgba(13,148,136,0.15)', color: '#14b8a6', border: '1px solid rgba(13,148,136,0.3)' }}>
                            {userInfo.name?.[0]?.toUpperCase() ?? "U"}
                        </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-semibold text-slate-200 truncate">{userInfo.name}</p>
                        <p className="text-xs font-mono text-slate-600 truncate">{userInfo.email}</p>
                    </div>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 mb-2 font-mono text-[8.5px] font-bold uppercase tracking-widest border rounded-sm ${userInfo.badge.color}`}>
                    <Lock size={7} /> {userInfo.badge.label}
                </div>
                <form action={signOutAction}>
                    <button type="submit" className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-mono uppercase tracking-widest text-slate-600 hover:text-red-400 transition-colors group">
                        <LogOut size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        LOGOUT
                    </button>
                </form>
            </div>
        </>
    );
}