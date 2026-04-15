"use client";

import { useState, useMemo, useEffect } from "react";
import { UserRole } from "@/types/auth";
import { RoleSelector } from "@/components/dashboard/RoleSelector";
import { toggleUserStatus, bulkDeleteUsers, bulkToggleUsersStatus, deleteUser } from "@/actions/admin";
import { toast } from "sonner";
import {
    Crown, Shield, Megaphone, ShoppingBag, Palette, Users, UserPlus,
    Search, Download, Trash, UserX, Inbox, LayoutGrid, List, SlidersHorizontal,
    MoreVertical, Star, EyeOff, Briefcase, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { UserDrawer } from "./UserDrawer";
import { InviteMemberModal } from "./modals/InviteMemberModal";
import { UsersTable } from "./table/UsersTable";

export type UserRecord = {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    phone: string | null;
    jobTitle: string | null;
    adminNotes: string | null;
    customTag: string | null;
    createdAt: Date;
    deactivatedAt: Date | null;
    mfaEnabled: boolean;
    emailVerified: boolean | null;
    _count: { activityLogs: number };
};

interface UsersClientProps {
    initialUsers: UserRecord[];
    currentUserId: string;
    customRoles?: any[];
}

// Dark-themed role colors — all using opacity-based tinting for consistency
const ROLE_INFO: Record<string, { icon: React.ReactNode; label: string; colorClass: string; dotColor: string }> = {
    super_admin: { icon: <Crown size={11} />, label: "SuperAdmin", colorClass: "text-red-400 border-red-900/50 bg-red-950/30", dotColor: "bg-red-500" },
    admin: { icon: <Shield size={11} />, label: "ProjectManager", colorClass: "text-indigo-400 border-indigo-900/50 bg-indigo-950/30", dotColor: "bg-indigo-500" },
    content_manager: { icon: <Megaphone size={11} />, label: "Marketing / SEO", colorClass: "text-teal-400 border-teal-900/50 bg-teal-950/30", dotColor: "bg-teal-500" },
    client_admin: { icon: <ShoppingBag size={11} />, label: "Ventas", colorClass: "text-amber-400 border-amber-900/50 bg-amber-950/30", dotColor: "bg-amber-500" },
    client_user: { icon: <Palette size={11} />, label: "Creativo", colorClass: "text-purple-400 border-purple-900/50 bg-purple-950/30", dotColor: "bg-purple-500" },
    guest: { icon: <Users size={11} />, label: "Sin Rol", colorClass: "text-slate-500 border-slate-800 bg-slate-900/50", dotColor: "bg-slate-600" },
};

export function UsersDashboardClient({ initialUsers, currentUserId, customRoles = [] }: UsersClientProps) {
    const [users, setUsers] = useState<UserRecord[]>(initialUsers);
    const [searchQuery, setSearchQuery] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [roleFilter, setRoleFilter] = useState("all");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
    const [isClient, setIsClient] = useState(false);
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [showMetrics, setShowMetrics] = useState(true);
    const [selectedUserForDrawer, setSelectedUserForDrawer] = useState<UserRecord | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; userId: string } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; userName: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Invite Modal State
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    const dynamicRoleInfo = useMemo(() => {
        const map: Record<string, typeof ROLE_INFO[string]> = { ...ROLE_INFO };
        if (customRoles.length > 0) {
            customRoles.forEach(role => {
                map[role.id] = {
                    icon: <Briefcase size={11} />,
                    label: role.name,
                    colorClass: "text-sky-400 border-sky-900/50 bg-sky-950/30",
                    dotColor: "bg-sky-500",
                };
            });
        }
        return map;
    }, [customRoles]);

    useEffect(() => {
        setIsClient(true);
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                document.getElementById("user-search-input")?.focus();
            }
        };
        const closeContext = () => setContextMenu(null);
        document.addEventListener("keydown", down);
        document.addEventListener("click", closeContext);
        return () => {
            document.removeEventListener("keydown", down);
            document.removeEventListener("click", closeContext);
        };
    }, []);

    const filteredUsers = useMemo(() => {
        let result = users.filter(user => {
            const matchesSearch = ((user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesRole = roleFilter === "all" || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });
        result.sort((a, b) => {
            if (starredIds.has(a.id) && !starredIds.has(b.id)) return -1;
            if (!starredIds.has(a.id) && starredIds.has(b.id)) return 1;
            return 0;
        });
        return result;
    }, [users, searchQuery, roleFilter, starredIds]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 500);
    };

    const handleToggleStatus = async (userId: string) => {
        const originalStatus = users.find(u => u.id === userId)?.deactivatedAt;
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, deactivatedAt: originalStatus ? null : new Date() } : u));
        const res = await toggleUserStatus(userId);
        if (res.success) {
            toast.success(res.isDeactivated ? "Usuario suspendido correctamente." : "Usuario reactivado.");
        } else {
            toast.error(res.error || "Algo falló.");
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, deactivatedAt: originalStatus ?? null } : u));
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteConfirm) return;
        const { userId, userName } = deleteConfirm;
        setIsDeleting(true);
        // Optimistic: remove from local list
        setUsers(prev => prev.filter(u => u.id !== userId));
        const res = await deleteUser(userId);
        setIsDeleting(false);
        setDeleteConfirm(null);
        // IMPORTANT: check res.success === true (not just 'success' in res)
        // because both success and error responses have the 'success' key
        if (res.success === true) {
            toast.success(`Usuario '${userName}' eliminado permanentemente.`);
        } else {
            const errMsg = 'error' in res ? res.error : "Error al eliminar el usuario.";
            toast.error(errMsg || "Error al eliminar el usuario.");
            // Revert optimistic update by restoring the user
            setUsers(prev => [...prev.filter(u => u.id !== userId)]);
            window.location.reload();
        }
    };

    const confirmDelete = (userId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const user = users.find(u => u.id === userId);
        if (!user) return;
        setDeleteConfirm({ userId, userName: user.name || user.email || userId });
    };

    const handleDrawerUpdate = (userId: string, data: Partial<UserRecord>) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    };

    const handleRightClick = (e: React.MouseEvent, userId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, userId });
    };

    const toggleStar = (userId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(starredIds);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        setStarredIds(next);
    };

    const getInitials = (name: string | null) => name?.[0]?.toUpperCase() ?? "U";

    const getRelativeDate = (date: Date) => {
        const rtf = new Intl.RelativeTimeFormat('es-CO', { numeric: 'auto' });
        const daysDiff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 0) return "Hoy";
        if (daysDiff < 30) return rtf.format(-daysDiff, 'day');
        if (daysDiff < 365) return rtf.format(-Math.floor(daysDiff / 30), 'month');
        return rtf.format(-Math.floor(daysDiff / 365), 'year');
    };

    return (
        <div className={`ds-page space-y-6 transition-opacity duration-500 pb-20 ${!isClient ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 animate-in fade-in zoom-in-95'}`}>
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {!isClient && <Skeleton className="w-full h-[600px] rounded-sm mb-8" style={{ background: 'rgba(15,23,42,0.5)' }} />}

            {/* ── HEADER ───────────────────────────────────────────── */}
            <div className="relative z-10 flex items-start justify-between gap-4 pb-8"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <div className="mb-4">
                        <span className="ds-badge ds-badge-teal">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                            </span>
                            IAM_CTRL · DIRECTORIO
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-12 h-12">
                            <Users className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page">Directorio IAM</h1>
                            <p className="ds-subtext mt-2">Control de identidades · Accesos · Métricas operativas</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 shrink-0">
                    <button className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-teal-400 rounded-sm transition-all"
                        style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}>
                        <Download size={12} /> Exportar IAM
                    </button>
                    <button 
                        onClick={() => setIsInviteOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white rounded-sm transition-all hover:-translate-y-0.5"
                        style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.5)' }}>
                        <UserPlus size={12} /> Invitar Miembro
                    </button>
                </div>
            </div>

            {/* ── TOOLBAR ──────────────────────────────────────────── */}
            <div className="relative z-30 ds-section flex flex-col xl:flex-row gap-4 justify-between items-center sticky top-4">
                {/* Search */}
                <div className="flex w-full xl:w-auto items-center gap-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-3.5 h-3.5" />
                    <input
                        id="user-search-input"
                        type="text"
                        placeholder="Buscar identidad (Cmd+K)..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 pr-14 py-2 font-mono text-[11px] text-slate-200 placeholder:text-slate-700 rounded-sm transition-all focus:outline-none w-full xl:w-80"
                        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}
                    />
                    <AnimatePresence>
                        {isTyping && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute right-12 top-1/2 -translate-y-1/2 flex gap-1">
                                <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" />
                                <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Role filter pills */}
                <div className="flex w-full xl:w-auto items-center gap-3 overflow-x-auto pb-1 xl:pb-0">
                    <div className="flex gap-1 p-1 rounded-sm" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}>
                        <button onClick={() => setRoleFilter('all')}
                            className={`px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider rounded-sm transition-all ${roleFilter === 'all' ? 'text-teal-400' : 'text-slate-600 hover:text-slate-400'}`}
                            style={roleFilter === 'all' ? { background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)' } : {}}>
                            Todos
                        </button>
                        {Object.entries(dynamicRoleInfo).filter(([k]) => k !== 'guest').map(([k, info]) => (
                            <button key={k} onClick={() => setRoleFilter(k)}
                                className={`px-3 py-1.5 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider rounded-sm transition-all ${roleFilter === k ? 'text-teal-400' : 'text-slate-600 hover:text-slate-400'}`}
                                style={roleFilter === k ? { background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)' } : {}}>
                                {info.icon} <span className="hidden sm:inline">{info.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="h-5 w-px hidden sm:block" style={{ background: 'rgba(30,41,59,0.8)' }} />

                    {/* View mode toggle */}
                    <div className="flex gap-1 p-1 rounded-sm" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}>
                        <button onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'table' ? 'text-teal-400' : 'text-slate-600 hover:text-slate-400'}`}
                            style={viewMode === 'table' ? { background: 'rgba(13,148,136,0.15)' } : {}}>
                            <List size={14} />
                        </button>
                        <button onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'grid' ? 'text-teal-400' : 'text-slate-600 hover:text-slate-400'}`}
                            style={viewMode === 'grid' ? { background: 'rgba(13,148,136,0.15)' } : {}}>
                            <LayoutGrid size={14} />
                        </button>
                    </div>

                    <button onClick={() => setShowMetrics(!showMetrics)}
                        className="p-1.5 rounded-sm text-slate-600 hover:text-teal-400 transition-colors"
                        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}
                        title="Alternar Columnas">
                        <SlidersHorizontal size={14} />
                    </button>
                </div>
            </div>

            {/* ── TABLE VIEW ───────────────────────────────────────── */}
            {viewMode === "table" ? (
                <UsersTable
                    users={filteredUsers}
                    currentUserId={currentUserId}
                    customRoles={customRoles}
                    showMetrics={showMetrics}
                    starredIds={starredIds}
                    onToggleStar={toggleStar}
                    onSelectUser={setSelectedUserForDrawer}
                    onRightClick={handleRightClick}
                    onToggleStatus={handleToggleStatus}
                    onConfirmDelete={confirmDelete}
                    getInitials={getInitials}
                    getRelativeDate={getRelativeDate}
                />
            ) : (
                /* ── GRID VIEW ─────────────────────────────────────── */
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredUsers.map(user => (
                        <div key={user.id} onClick={() => setSelectedUserForDrawer(user)}
                            className="ds-card group cursor-pointer relative overflow-hidden">
                            {user.deactivatedAt && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center"
                                    style={{ background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(2px)' }}>
                                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-red-400 px-3 py-1.5"
                                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.15rem' }}>
                                        Cuenta Suspendida
                                    </span>
                                </div>
                            )}
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-11 w-11 rounded-sm flex items-center justify-center font-black text-lg transition-transform group-hover:-translate-y-0.5"
                                        style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)', color: '#14b8a6' }}>
                                        {getInitials(user.name)}
                                    </div>
                                    <button onClick={(e) => toggleStar(user.id, e)} className="p-1 z-20">
                                        <Star size={14} className={starredIds.has(user.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-700 hover:text-amber-500'} />
                                    </button>
                                </div>
                                <h3 className="font-black text-[13px] text-slate-100 truncate">{user.name || "Usuario Sin Nombre"}</h3>
                                <p className="font-mono text-[9px] text-slate-600 truncate mb-4 mt-0.5">{user.email}</p>
                                <div className="flex items-center gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
                                    <RoleSelector userId={user.id} currentRole={user.role} isSelf={user.id === currentUserId} customRoles={customRoles} />
                                </div>
                                <div className="pt-4 flex justify-between items-center font-mono text-[9px] text-slate-700 uppercase tracking-widest"
                                    style={{ borderTop: '1px solid rgba(30,41,59,0.8)' }}>
                                    <span>{user._count.activityLogs ?? 0} Logins</span>
                                    <span>{getRelativeDate(new Date(user.createdAt))}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {filteredUsers.length === 0 && (
                <div className="relative z-10 ds-section flex flex-col items-center justify-center py-20 text-center">
                    <div className="ds-icon-box w-14 h-14 mx-auto mb-5">
                        <Inbox className="w-6 h-6 text-slate-700" />
                    </div>
                    <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest mb-1">&gt; Sin identidades que coincidan_</p>
                    <p className="font-mono text-[9px] text-slate-700 uppercase tracking-widest">Intenta con otro filtro o término de búsqueda</p>
                </div>
            )}

            {/* ── CONTEXT MENU ────────────────────────────────────── */}
            {contextMenu && (
                <div
                    style={{ top: contextMenu.y, left: contextMenu.x, background: 'rgba(10,17,35,0.97)', border: '1px solid rgba(30,41,59,0.9)', borderRadius: '0.15rem' }}
                    className="fixed z-50 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.8)] p-1.5 min-w-[180px]"
                >
                    {/* Teal top line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
                    <p className="font-mono text-[8px] font-bold text-slate-600 uppercase tracking-widest px-3 pt-2 pb-1.5 mb-1"
                        style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>Opciones Rápidas</p>
                    <button onClick={() => { setSelectedUserForDrawer(users.find(u => u.id === contextMenu.userId) || null); setContextMenu(null); }}
                        className="w-full text-left px-3 py-2 font-mono text-[10px] text-slate-400 hover:text-teal-400 rounded-sm transition-colors hover:bg-teal-950/20">
                        Abrir Ficha Técnica
                    </button>
                    <button onClick={() => { handleToggleStatus(contextMenu.userId); setContextMenu(null); }}
                        className="w-full text-left px-3 py-2 font-mono text-[10px] text-amber-400/70 hover:text-amber-400 rounded-sm transition-colors hover:bg-amber-950/20">
                        Alterar Estado
                    </button>
                    <button
                        onClick={() => { confirmDelete(contextMenu.userId); setContextMenu(null); }}
                        className="w-full text-left px-3 py-2 font-mono text-[10px] text-red-400/70 hover:text-red-400 rounded-sm transition-colors hover:bg-red-950/20">
                        Eliminar del Hub
                    </button>
                </div>
            )}

            {/* ── DELETE CONFIRMATION MODAL ───────────────────────── */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(4px)' }}
                    onClick={() => !isDeleting && setDeleteConfirm(null)}>
                    <div className="relative w-full max-w-sm p-6 overflow-hidden"
                        style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.15rem' }}
                        onClick={e => e.stopPropagation()}>
                        {/* Red top line */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-11 h-11 shrink-0 flex items-center justify-center rounded-sm"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                                <UserX className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-black text-[15px] text-slate-100">Eliminar Usuario</h3>
                                    <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-red-400 px-1.5 py-0.5"
                                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.15rem' }}>
                                        IRREVERSIBLE
                                    </span>
                                </div>
                                <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Acción permanente · Sin recuperación</p>
                            </div>
                        </div>

                        <div className="mb-6 p-3 rounded-sm"
                            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <p className="text-[12px] text-slate-300 mb-1">
                                ¿Estás seguro de eliminar a <span className="font-black text-slate-100">{deleteConfirm.userName}</span>?
                            </p>
                            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">
                                Se eliminarán todos sus datos, sesiones y registros de actividad.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors rounded-sm disabled:opacity-40"
                                style={{ border: '1px solid rgba(30,41,59,0.8)' }}>
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-all rounded-sm disabled:opacity-40"
                                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)' }}>
                                {isDeleting ? (
                                    <><span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> Eliminando...</>
                                ) : (
                                    <><Trash size={11} /> Eliminar definitivamente</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── INVITE MODAL ───────────────────────── */}
            <InviteMemberModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                customRoles={customRoles}
            />

            {/* USER DRAWER */}
            <UserDrawer
                user={selectedUserForDrawer}
                onClose={() => setSelectedUserForDrawer(null)}
                onUpdate={handleDrawerUpdate}
            />
        </div>
    );
}
