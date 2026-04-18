"use client";

import { useState } from "react";
import { assignDeal } from "@/actions/crm-closing";
import { toast } from "sonner";
import { UserCheck, ChevronDown, Loader2 } from "lucide-react";

type User = { id: string; name: string | null; email: string | null; image: string | null };

interface DealAssignSelectProps {
    dealId: string;
    users: User[];
    currentAssigneeId?: string | null;
}

export function DealAssignSelect({ dealId, users, currentAssigneeId }: DealAssignSelectProps) {
    const [assignedTo, setAssignedTo] = useState(currentAssigneeId ?? "");
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const currentUser = users.find(u => u.id === assignedTo);

    const handleAssign = async (userId: string | null) => {
        setLoading(true);
        setOpen(false);
        const res = await assignDeal(dealId, userId);
        if (res.success) {
            setAssignedTo(userId ?? "");
            toast.success(userId ? `Asignado a ${users.find(u => u.id === userId)?.name}` : "Asignación removida");
        } else {
            toast.error("Error al asignar");
        }
        setLoading(false);
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(!open)}
                disabled={loading}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 12px', borderRadius: '10px',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.9)',
                    cursor: 'pointer', color: '#94a3b8', fontSize: '12px', width: '100%',
                    transition: 'all 0.2s'
                }}
            >
                {loading ? (
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                ) : currentUser ? (
                    <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0d9488, #0ea5e9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, color: 'white', flexShrink: 0
                    }}>
                        {(currentUser.name ?? currentUser.email ?? '?')[0].toUpperCase()}
                    </div>
                ) : (
                    <UserCheck style={{ width: 14, height: 14, color: '#475569' }} />
                )}
                <span style={{ flex: 1, textAlign: 'left' }}>
                    {currentUser?.name ?? currentUser?.email ?? 'Sin asignar'}
                </span>
                <ChevronDown style={{ width: 12, height: 12 }} />
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4,
                    background: 'rgb(11,15,25)', border: '1px solid rgba(30,41,59,0.9)',
                    borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                }}>
                    <button
                        onClick={() => handleAssign(null)}
                        style={{
                            width: '100%', padding: '8px 12px', textAlign: 'left',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: '#475569', fontSize: 11, transition: 'background 0.1s',
                            borderBottom: '1px solid rgba(30,41,59,0.5)'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,41,59,0.5)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        — Sin asignar
                    </button>
                    {users.map(u => (
                        <button
                            key={u.id}
                            onClick={() => handleAssign(u.id)}
                            style={{
                                width: '100%', padding: '8px 12px', textAlign: 'left',
                                background: u.id === assignedTo ? 'rgba(13,148,136,0.1)' : 'transparent',
                                border: 'none', cursor: 'pointer', color: u.id === assignedTo ? '#2dd4bf' : '#94a3b8',
                                fontSize: 11, display: 'flex', alignItems: 'center', gap: 8,
                                transition: 'background 0.1s'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,41,59,0.5)')}
                            onMouseLeave={e => (e.currentTarget.style.background = u.id === assignedTo ? 'rgba(13,148,136,0.1)' : 'transparent')}
                        >
                            <div style={{
                                width: 18, height: 18, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #0d9488, #0ea5e9)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 8, fontWeight: 800, color: 'white', flexShrink: 0
                            }}>
                                {(u.name ?? u.email ?? '?')[0].toUpperCase()}
                            </div>
                            <span style={{ flex: 1 }}>{u.name ?? u.email}</span>
                            {u.id === assignedTo && <span style={{ fontSize: 9, color: '#2dd4bf' }}>✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
