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
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-3">
                    <Users className="w-3.5 h-3.5" /> IAM & TEAM MANAGEMENT
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Equipo y Miembros</h2>
                <p className="text-slate-400 text-sm mt-1">Gestiona los accesos, roles y actividad de tu equipo.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Miembros", val: members.length, icon: <Users className="w-4 h-4" />, color: "text-teal-400 bg-teal-500/10" },
                    { label: "Administradores", val: adminCount, icon: <Shield className="w-4 h-4" />, color: "text-red-400 bg-red-500/10" },
                    { label: "Miembros", val: memberCount, icon: <Users className="w-4 h-4" />, color: "text-blue-400 bg-blue-500/10" },
                    { label: "Roles Personalizados", val: customRoles.length, icon: <Activity className="w-4 h-4" />, color: "text-violet-400 bg-violet-500/10" },
                ].map((kpi, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className={`inline-flex items-center justify-center p-2 rounded-lg mb-2 ${kpi.color}`}>{kpi.icon}</div>
                        <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
                        <p className="text-2xl font-bold text-white">{isLoading ? "—" : kpi.val}</p>
                    </div>
                ))}
            </div>

            {/* Seat Usage Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">Seats utilizados</span>
                    <span className="text-xs font-mono text-slate-300">{members.length} / 25</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full transition-all duration-700 ${members.length >= 22 ? "bg-red-500" : members.length >= 18 ? "bg-amber-500" : "bg-teal-500"}`}
                        style={{ width: `${Math.min((members.length / 25) * 100, 100)}%` }} />
                </div>
            </div>

            {/* Invite + Search bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o email..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                    />
                </div>
                <button onClick={() => setShowInvite(v => !v)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-[0_0_12px_rgba(20,184,166,0.3)]">
                    <UserPlus className="w-4 h-4" /> Invitar Miembro
                </button>
            </div>

            {/* Invite form */}
            {showInvite && (
                <div className="bg-slate-950 border border-teal-500/30 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-teal-400 mb-2">Nuevo Miembro</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                            <label className="text-xs text-slate-500 block mb-1">Email</label>
                            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                type="email" placeholder="usuario@empresa.com"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Rol</label>
                            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors">
                                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
                        <button onClick={handleInvite} disabled={isInviting}
                            className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors">
                            {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Invitación"}
                        </button>
                    </div>
                </div>
            )}

            {/* Members Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="divide-y divide-slate-800/50">
                    {isLoading ? (
                        <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-teal-400 mx-auto" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No se encontraron miembros.</div>
                    ) : filtered.map(m => {
                        const roleCfg = ROLE_LABELS[m.user?.role] || ROLE_LABELS.guest;
                        return (
                            <div key={m.id} className="flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {initials(m)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-200">
                                        {m.user?.firstName || ""} {m.user?.lastName || ""}
                                        {(!m.user?.firstName && !m.user?.lastName) && <span className="text-slate-500">Sin nombre</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {m.user?.email}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${roleCfg.color}`}>{roleCfg.label}</span>
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
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
