"use client";

import { useState } from 'react';
import {
    MessageSquare, Inbox, Send, Archive, Trash2,
    MoreVertical, Search, Filter, Phone, Video, Info, Menu,
    Hash, Star, Clock, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InboxCommandMenu } from "@/components/inbox/inbox-command-menu";
import { toast } from "sonner";
import { useRouter, useSearchParams } from 'next/navigation';
import { RealtimeRefresher } from '@/components/inbox/realtime-refresher';

interface InboxLayoutProps {
    children: React.ReactNode;
    conversationList: React.ReactNode;
    leadProfile?: React.ReactNode;
    currentUser?: any;
    metrics?: any;
}

export function InboxLayout({ children, conversationList, leadProfile, currentUser, metrics }: InboxLayoutProps) {
    const [isFoldersOpen, setIsFoldersOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentFolder = searchParams.get('folder');
    const currentTag = searchParams.get('tag');

    const handleNavigation = (type: 'folder' | 'tag', value: string) => {
        if (type === 'folder') {
            router.push(`/dashboard/inbox?folder=${value}`);
        } else {
            router.push(`/dashboard/inbox?tag=${value}`);
        }
    };

    return (
        <TooltipProvider>
            <div style={{
                display: "flex",
                height: "calc(100vh - 65px)",
                overflow: "hidden",
                background: "rgba(11,15,25,0.95)",
                borderTop: "1px solid rgba(30,41,59,0.8)",
            }}>
                <RealtimeRefresher intervalMs={6000} />

                {/* Panel 1: Folders & Filters (Left) */}
                <div style={{
                    display: "none",
                    flexDirection: "column",
                    borderRight: "1px solid rgba(30,41,59,0.8)",
                    background: "rgba(8,12,20,0.98)",
                    transition: "width 0.3s",
                    width: isFoldersOpen ? "256px" : "64px",
                    flexShrink: 0,
                }} className="hidden md:flex">
                    <div style={{
                        padding: "0 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isFoldersOpen ? "space-between" : "center",
                        borderBottom: "1px solid rgba(30,41,59,0.8)",
                        height: "64px",
                    }}>
                        {isFoldersOpen && <h2 style={{ fontWeight: 800, color: "#e2e8f0", fontSize: "14px", fontFamily: "monospace", letterSpacing: "0.05em", margin: 0 }}>Bandeja</h2>}
                        <button onClick={() => setIsFoldersOpen(!isFoldersOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "8px", color: "#475569", display: "flex", alignItems: "center" }}>
                            <Menu size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ padding: "16px 0" }}>
                        {/* Status Folders */}
                        <div style={{ marginBottom: "24px", padding: "0 12px" }}>
                            {isFoldersOpen && <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "#1e293b", fontFamily: "monospace", padding: "0 12px", marginBottom: "6px" }}>Vistas</p>}
                            <NavItem icon={Inbox} label="Sin Asignar" count={metrics?.unassigned || 0} active={currentFolder === 'unassigned'} isOpen={isFoldersOpen} badgeColor="teal" onClick={() => handleNavigation('folder', 'unassigned')} />
                            <NavItem icon={MessageSquare} label="Mis Chats" count={metrics?.mine || 0} active={currentFolder === 'mine'} isOpen={isFoldersOpen} onClick={() => handleNavigation('folder', 'mine')} />
                            <NavItem icon={Clock} label="Pendientes" count={metrics?.pending || 0} active={currentFolder === 'pending'} isOpen={isFoldersOpen} badgeColor="amber" onClick={() => handleNavigation('folder', 'pending')} />
                            <NavItem icon={CheckCircle2} label="Resueltos" count={metrics?.resolved || 0} active={currentFolder === 'resolved'} isOpen={isFoldersOpen} onClick={() => handleNavigation('folder', 'resolved')} />
                            <NavItem icon={MessageSquare} label="Todos" active={!currentFolder && !currentTag} isOpen={isFoldersOpen} badgeColor="teal" onClick={() => router.push('/dashboard/inbox')} />
                        </div>

                        {/* Tags */}
                        <div style={{ marginBottom: "24px", padding: "0 12px" }}>
                            {isFoldersOpen && <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "#1e293b", fontFamily: "monospace", padding: "0 12px", marginBottom: "6px" }}>Etiquetas</p>}
                            <NavItem icon={Hash} iconColor="#f43f5e" label="Soporte VIP" count={metrics?.vip || 0} active={currentTag === 'Soporte VIP'} isOpen={isFoldersOpen} onClick={() => handleNavigation('tag', 'Soporte VIP')} />
                            <NavItem icon={Hash} iconColor="#10b981" label="Ventas" count={metrics?.sales || 0} active={currentTag === 'Ventas'} isOpen={isFoldersOpen} onClick={() => handleNavigation('tag', 'Ventas')} />
                            <NavItem icon={Hash} iconColor="#a78bfa" label="Dudas" count={metrics?.questions || 0} active={currentTag === 'Dudas'} isOpen={isFoldersOpen} onClick={() => handleNavigation('tag', 'Dudas')} />
                        </div>

                        {/* Other */}
                        <div style={{ padding: "0 12px" }}>
                            {isFoldersOpen && <p style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "#1e293b", fontFamily: "monospace", padding: "0 12px", marginBottom: "6px" }}>Otros</p>}
                            <NavItem icon={Star} label="Destacados" active={currentFolder === 'starred'} isOpen={isFoldersOpen} onClick={() => handleNavigation('folder', 'starred')} />
                            <NavItem icon={Archive} label="Archivados" active={currentFolder === 'archived'} isOpen={isFoldersOpen} onClick={() => handleNavigation('folder', 'archived')} />
                            <NavItem icon={AlertCircle} label="Spam" active={currentFolder === 'spam'} isOpen={isFoldersOpen} onClick={() => handleNavigation('folder', 'spam')} />
                        </div>
                    </div>

                    {/* User Mini Profile */}
                    {isFoldersOpen && (
                        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(30,41,59,0.8)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #0d9488, #2dd4bf)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "11px", flexShrink: 0 }}>
                                    {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'AG'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: "12px", fontWeight: 700, color: "#cbd5e1", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser?.name || 'Administrador'}</p>
                                    <p style={{ fontSize: "10px", color: "#10b981", display: "flex", alignItems: "center", gap: "4px", margin: 0 }}>
                                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                                        En línea
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Panel 2: Conversation List */}
                <div style={{
                    display: "none",
                    flexDirection: "column",
                    width: "360px",
                    flexShrink: 0,
                    borderRight: "1px solid rgba(30,41,59,0.8)",
                    background: "rgba(10,14,23,0.97)",
                    overflow: "hidden",
                }} className="hidden md:flex">
                    {conversationList}
                </div>

                {/* Panel 3: Main Chat Area */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "rgba(11,15,25,0.95)", position: "relative" }}>
                    {/* Mobile Drawer */}
                    <div className="md:hidden" style={{ display: "flex", alignItems: "center", padding: "12px", borderBottom: "1px solid rgba(30,41,59,0.8)", background: "rgba(8,12,20,0.98)", position: "sticky", top: 0, zIndex: 10 }}>
                        <Sheet>
                            <SheetTrigger asChild>
                                <button style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", marginRight: "8px", color: "#475569" }}>
                                    <Menu size={20} />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-[320px] sm:w-[360px]" style={{ background: "rgba(8,12,20,0.99)", borderRight: "1px solid rgba(30,41,59,0.8)" }}>
                                <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                                    <div style={{ padding: "16px", borderBottom: "1px solid rgba(30,41,59,0.8)" }}>
                                        <h2 style={{ fontWeight: 800, fontSize: "16px", color: "#e2e8f0", margin: 0 }}>Inbox</h2>
                                    </div>
                                    <div style={{ flex: 1, overflowY: "auto" }}>
                                        {conversationList}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <span style={{ fontWeight: 700, color: "#cbd5e1", fontSize: "14px" }}>Inbox</span>
                    </div>

                    {children}
                </div>

                {/* Panel 4: Lead Profile (Right) */}
                {leadProfile && (
                    <div style={{
                        display: isProfileOpen ? "flex" : "none",
                        flexDirection: "column",
                        width: isProfileOpen ? "320px" : "0",
                        flexShrink: 0,
                        borderLeft: "1px solid rgba(30,41,59,0.8)",
                        background: "rgba(8,12,20,0.98)",
                        overflow: "hidden",
                        transition: "width 0.3s",
                    }} className="hidden xl:flex">
                        {leadProfile}
                    </div>
                )}
                <InboxCommandMenu />
            </div>
        </TooltipProvider>
    );
}

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    count?: number;
    active?: boolean;
    isOpen?: boolean;
    badgeColor?: string;
    iconColor?: string;
    onClick?: () => void;
}

function NavItem({ icon: Icon, label, count, active, isOpen, badgeColor, iconColor, onClick }: NavItemProps) {
    const activeBg = "rgba(13,148,136,0.12)";
    const activeBorder = "rgba(13,148,136,0.3)";
    const activeText = "#2dd4bf";
    const inactiveText = "#475569";
    const hoverBg = "rgba(30,41,59,0.5)";

    const badgeBg = badgeColor === 'teal'
        ? "rgba(13,148,136,0.15)"
        : badgeColor === 'amber'
            ? "rgba(245,158,11,0.15)"
            : "rgba(30,41,59,0.7)";
    const badgeText = badgeColor === 'teal'
        ? "#2dd4bf"
        : badgeColor === 'amber'
            ? "#f59e0b"
            : "#475569";

    if (!isOpen) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <button onClick={onClick} style={{
                        background: active ? activeBg : "transparent",
                        border: active ? `1px solid ${activeBorder}` : "1px solid transparent",
                        borderRadius: "8px", width: "40px", height: "40px", marginBottom: "6px", position: "relative",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", color: active ? activeText : (iconColor || inactiveText),
                    }}>
                        <Icon size={18} />
                        {!!count && (
                            <span style={{ position: "absolute", top: "2px", right: "2px", width: "6px", height: "6px", background: "#f43f5e", borderRadius: "50%", border: "1px solid rgba(8,12,20,0.9)" }} />
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="right" style={{ background: "rgba(11,15,25,0.95)", border: "1px solid rgba(30,41,59,0.8)", color: "#cbd5e1", fontSize: "11px", fontFamily: "monospace" }}>
                    {label} {count ? `(${count})` : ''}
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <button onClick={onClick} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "7px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
            background: active ? activeBg : "transparent",
            border: active ? `1px solid ${activeBorder}` : "1px solid transparent",
            color: active ? activeText : inactiveText,
            cursor: "pointer", marginBottom: "2px", transition: "all 0.15s",
            fontFamily: "monospace",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Icon size={15} style={{ color: active ? activeText : (iconColor || inactiveText), flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {!!count && (
                <span style={{ padding: "1px 6px", borderRadius: "99px", fontSize: "10px", fontWeight: 800, background: badgeBg, color: badgeText, fontFamily: "monospace" }}>
                    {count}
                </span>
            )}
        </button>
    );
}
