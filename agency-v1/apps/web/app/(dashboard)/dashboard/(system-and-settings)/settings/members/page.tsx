"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Search, MoreHorizontal, Shield, Activity, Mail, Check, X, Loader2, Clock } from "lucide-react";
import { getTeamActivity, sendTeamInvite } from "@/actions/developer";
import { getUsers, getCustomRoles } from "@/actions/admin";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin", color: "text-red-400 bg-red-500/10 border-red-500/20" },
    ADMIN: { label: "Admin", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
    member: { label: "Miembro", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    guest: { label: "Invitado", color: "text-slate-400 bg-slate-500/10 border-slate-700" },
};

export default function MembersPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [customRoles, setCustomRoles] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("member");
    const [isInviting, setIsInviting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const [aRes, rolesRes] = await Promise.all([
            getTeamActivity(),
            getCustomRoles(),
        ]);
        if (aRes.success) setMembers(aRes.data);
        if (rolesRes.success) setCustomRoles(rolesRes.roles || []);
        setIsLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return toast.error("Escribe un email");
        setIsInviting(true);
        const res = await sendTeamInvite(inviteEmail, inviteRole);
        setIsInviting(false);
        if (res.success) {
            toast.success(res.message);
            setInviteEmail("");
            setShowInvite(false);
            load();
        } else {
            toast.error(res.error);
        }
    };

    const filtered = members.filter(m => {
        const name = `${m.user?.firstName || ""} ${m.user?.lastName || ""} ${m.user?.email || ""}`.toLowerCase();
        return name.includes(search.toLowerCase());
    });

    const adminCount = members.filter(m => ["SUPER_ADMIN", "ADMIN"].includes(m.user?.role)).length;
    const memberCount = members.filter(m => !["SUPER_ADMIN", "ADMIN"].includes(m.user?.role)).length;
    const initials = (m: any) => {
        const f = m.user?.firstName?.[0] || "";
        const l = m.user?.lastName?.[0] || "";
        return (f + l).toUpperCase() || m.user?.email?.[0]?.toUpperCase() || "?";
    };

    const ROLE_OPTIONS = [
        { value: "member", label: "Miembro" },
        { value: "ADMIN", label: "Admin" },
        ...customRoles.map(r => ({ value: r.roleName, label: r.roleName })),
    ];

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal-md)] text-xs font-mono mb-3">
                    <Users className="w-3.5 h-3.5" /> IAM & TEAM MANAGEMENT
                </div>
                <h2 className="text-2xl font-bold text-[var(--ds-text-primary)] tracking-tight">Equipo y Miembros</h2>
                <p className="text-[var(--ds-text-secondary)] text-sm mt-1">Gestiona los accesos, roles y actividad de tu equipo.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Miembros", val: members.length, icon: <Users className="w-4 h-4" />, color: "text-[var(--ds-teal-md)] bg-[var(--ds-teal-dim)] border-[var(--ds-border-glow)]" },
                    { label: "Administradores", val: adminCount, icon: <Shield className="w-4 h-4" />, color: "text-red-400 bg-red-500/10 border-red-500/20" },
                    { label: "Miembros", val: memberCount, icon: <Users className="w-4 h-4" />, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                    { label: "Roles Personalizados", val: customRoles.length, icon: <Activity className="w-4 h-4" />, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
                ].map((kpi, i) => (
                    <div key={i} className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl p-4 transition-all duration-300 hover:border-[var(--ds-border-glow)] hover:shadow-[var(--ds-shadow-teal)]">
                        <div className={`inline-flex items-center justify-center p-2 rounded-lg mb-2 border ${kpi.color}`}>{kpi.icon}</div>
                        <p className="text-xs text-[var(--ds-text-muted)] mb-1">{kpi.label}</p>
                        <p className="text-2xl font-bold text-[var(--ds-text-primary)]">{isLoading ? "—" : kpi.val}</p>
                    </div>
                ))}
            </div>

            {/* Seat Usage Bar */}
            <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl p-4 transition-all duration-300 hover:border-[var(--ds-border-glow)] hover:shadow-[var(--ds-shadow-teal)]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[var(--ds-text-muted)]">Seats utilizados</span>
                    <span className="text-xs font-mono text-[var(--ds-text-secondary)]">{members.length} / 25</span>
                </div>
                <div className="h-2 bg-[var(--ds-surface-2)] rounded-full overflow-hidden border border-[var(--ds-border)]/50">
                    <div className={`h-2 rounded-full transition-all duration-700 ${members.length >= 22 ? "bg-red-500" : members.length >= 18 ? "bg-amber-500" : "bg-[var(--ds-teal)]"}`}
                        style={{ width: `${Math.min((members.length / 25) * 100, 100)}%` }} />
                </div>
            </div>

            {/* Invite + Search bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ds-text-muted)]" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o email..."
                        className="w-full bg-[var(--ds-surface-2)] border border-[var(--ds-border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--ds-text-primary)] placeholder-[var(--ds-text-dim)] focus:outline-none focus:border-[var(--ds-teal-md)] transition-colors focus:ring-1 focus:ring-[var(--ds-teal-md)]"
                    />
                </div>
                <button onClick={() => setShowInvite(v => !v)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--ds-teal)] hover:bg-[var(--ds-teal-md)] text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-[var(--ds-shadow-teal)] border border-[var(--ds-border-glow)] hover:scale-[1.02] active:scale-95">
                    <UserPlus className="w-4 h-4" /> Invitar Miembro
                </button>
            </div>

            {/* Invite form */}
            {showInvite && (
                <div className="bg-[var(--ds-bg-deep)] border border-[var(--ds-border-glow)] rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-[var(--ds-teal-md)] mb-2">Nuevo Miembro</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                            <label className="text-xs text-[var(--ds-text-muted)] block mb-1">Email</label>
                            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                type="email" placeholder="usuario@empresa.com"
                                className="w-full bg-[var(--ds-surface-2)] border border-[var(--ds-border)] rounded-lg px-3 py-2 text-sm text-[var(--ds-text-primary)] placeholder-[var(--ds-text-dim)] focus:outline-none focus:border-[var(--ds-teal-md)] transition-colors" />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--ds-text-muted)] block mb-1">Rol</label>
                            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                                className="w-full bg-[var(--ds-surface-2)] border border-[var(--ds-border)] rounded-lg px-3 py-2 text-sm text-[var(--ds-text-primary)] focus:outline-none focus:border-[var(--ds-teal-md)] transition-colors">
                                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] transition-colors">Cancelar</button>
                        <button onClick={handleInvite} disabled={isInviting}
                            className="px-4 py-2 text-sm bg-[var(--ds-teal)] hover:bg-[var(--ds-teal-md)] border border-[var(--ds-border-glow)] text-white font-semibold rounded-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95">
                            {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Invitación"}
                        </button>
                    </div>
                </div>
            )}

            {/* Members Table */}
            <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl overflow-hidden shadow-lg backdrop-blur-md">
                <div className="divide-y divide-[var(--ds-border)]/50">
                    {isLoading ? (
                        <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-[var(--ds-teal-md)] mx-auto" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center text-[var(--ds-text-muted)] text-sm">No se encontraron miembros.</div>
                    ) : filtered.map(m => {
                        const roleCfg = ROLE_LABELS[m.user?.role] || ROLE_LABELS.guest;
                        return (
                            <div key={m.id} className="flex items-center gap-4 p-4 hover:bg-[var(--ds-surface-2)]/60 transition-colors">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--ds-teal)] to-[var(--ds-teal-bright)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {initials(m)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-[var(--ds-text-primary)]">
                                        {m.user?.firstName || ""} {m.user?.lastName || ""}
                                        {(!m.user?.firstName && !m.user?.lastName) && <span className="text-[var(--ds-text-muted)]">Sin nombre</span>}
                                    </div>
                                    <div className="text-xs text-[var(--ds-text-muted)] flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {m.user?.email}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${roleCfg.color}`}>{roleCfg.label}</span>
                                    <div className="flex items-center gap-1 text-xs text-[var(--ds-text-muted)]">
                                        <Clock className="w-3 h-3" />
                                        <span>{new Date(m.joinedAt).toLocaleDateString("es-CO")}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
