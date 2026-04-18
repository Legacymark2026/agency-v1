"use client";

import { Star, EyeOff, Trash, Briefcase, Lock } from "lucide-react";
import { RoleSelector } from "@/components/dashboard/RoleSelector";

interface UsersTableProps {
    users: any[];
    currentUserId: string;
    customRoles: any[];
    showMetrics: boolean;
    starredIds: Set<string>;
    onToggleStar: (userId: string, e: React.MouseEvent) => void;
    onSelectUser: (user: any) => void;
    onRightClick: (e: React.MouseEvent, userId: string) => void;
    onToggleStatus: (userId: string) => void;
    onConfirmDelete: (userId: string, e: React.MouseEvent) => void;
    getInitials: (name: string | null) => string;
    getRelativeDate: (date: Date) => string;
}

export function UsersTable({
    users,
    currentUserId,
    customRoles,
    showMetrics,
    starredIds,
    onToggleStar,
    onSelectUser,
    onRightClick,
    onToggleStatus,
    onConfirmDelete,
    getInitials,
    getRelativeDate
}: UsersTableProps) {
    return (
        <div className="relative z-10 ds-section overflow-hidden p-0">
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(30,41,59,0.8)', background: 'rgba(15,23,42,0.4)' }}>
                            <th className="py-3.5 px-5 w-10"><Star size={12} className="text-slate-700" /></th>
                            <th className="py-3.5 px-5 font-mono text-xs font-bold tracking-[0.14em] text-slate-600 uppercase">Identidad Registrada</th>
                            <th className="py-3.5 px-5 font-mono text-xs font-bold tracking-[0.14em] text-slate-600 uppercase">Asignación de Rol</th>
                            {showMetrics && <th className="py-3.5 px-5 font-mono text-xs font-bold tracking-[0.14em] text-slate-600 uppercase">Actividad</th>}
                            <th className="py-3.5 px-5 font-mono text-xs font-bold tracking-[0.14em] text-slate-600 uppercase text-right">Controles</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => {
                            const isSelf = user.id === currentUserId;
                            const isDeactivated = !!user.deactivatedAt;
                            const isStarred = starredIds.has(user.id);
                            const initial = getInitials(user.name);

                            return (
                                <tr
                                    key={user.id}
                                    onContextMenu={(e) => onRightClick(e, user.id)}
                                    onClick={() => onSelectUser(user)}
                                    className={`group cursor-pointer transition-all ${isDeactivated ? 'opacity-50' : ''}`}
                                    style={{ borderBottom: '1px solid rgba(30,41,59,0.5)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.6)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                                >
                                    <td className="py-4 px-5" onClick={(e) => onToggleStar(user.id, e)}>
                                        <Star size={14} className={`transition-colors cursor-pointer ${isStarred ? 'text-amber-400 fill-amber-400' : 'text-slate-700 hover:text-amber-500'}`} />
                                    </td>
                                    <td className="py-4 px-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 shrink-0 rounded-sm flex items-center justify-center font-black text-sm transition-transform group-hover:scale-105"
                                                style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)', color: '#14b8a6' }}>
                                                {initial}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[13px] font-black text-slate-100">{user.name || "Sin Nombre"}</p>
                                                    {isSelf && <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded-sm" style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)', color: '#14b8a6' }}>TÚ</span>}
                                                    {user.mfaEnabled && <span title="MFA Activado"><Lock size={10} className="text-teal-500" /></span>}
                                                </div>
                                                <p className="font-mono text-xs text-slate-600 mt-0.5">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-5" onClick={(e) => e.stopPropagation()}>
                                        <RoleSelector userId={user.id} currentRole={user.role} isSelf={isSelf} customRoles={customRoles} />
                                        {user.jobTitle && <p className="font-mono text-xs text-slate-700 mt-1.5 flex items-center gap-1"><Briefcase size={9} /> {user.jobTitle}</p>}
                                    </td>
                                    {showMetrics && (
                                        <td className="py-4 px-5">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-[12px] font-bold text-slate-300 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                                    {user._count?.activityLogs ?? 0} Inicios de sesión
                                                </p>
                                                <p className="font-mono text-xs text-slate-600">Ingreso: {getRelativeDate(new Date(user.createdAt))}</p>
                                            </div>
                                        </td>
                                    )}
                                    <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onToggleStatus(user.id); }}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold tracking-widest uppercase rounded-sm transition-all ${isDeactivated ? 'text-red-400' : 'text-slate-500 hover:text-amber-400'}`}
                                                style={isDeactivated
                                                    ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }
                                                    : { background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}
                                                disabled={isSelf}
                                            >
                                                {isDeactivated ? <><EyeOff size={10} /> Suspendido</> : 'Suspender'}
                                            </button>
                                            {!isSelf && (
                                                <button
                                                    onClick={(e) => onConfirmDelete(user.id, e)}
                                                    className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-8 h-8 rounded-sm text-slate-700 hover:text-red-400 transition-all"
                                                    style={{ border: '1px solid rgba(30,41,59,0.6)' }}
                                                    title="Eliminar usuario">
                                                    <Trash size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
