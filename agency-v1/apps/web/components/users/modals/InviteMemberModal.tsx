"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { sendTeamInvite } from "@/actions/developer";

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    customRoles: any[];
}

export function InviteMemberModal({ isOpen, onClose, customRoles = [] }: InviteMemberModalProps) {
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("admin");
    const [isInviting, setIsInviting] = useState(false);

    if (!isOpen) return null;

    const handleInvite = async () => {
        if (!inviteEmail) return toast.error("Por favor ingresa un email válido.");
        setIsInviting(true);
        try {
            const res = await sendTeamInvite(inviteEmail, inviteRole);
            if (res.success) {
                toast.success("Invitación enviada por email.");
                setInviteEmail("");
                onClose();
            } else {
                toast.error(res.error || "No se pudo enviar la invitación.");
            }
        } catch (error) {
            toast.error("Error inesperado en el servidor.");
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(4px)' }}
            onClick={() => !isInviting && onClose()}>
            <div className="relative w-full max-w-sm p-6 overflow-hidden"
                style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: '0.15rem' }}
                onClick={e => e.stopPropagation()}>
                
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

                <div className="flex items-start gap-4 mb-6">
                    <div className="w-11 h-11 shrink-0 flex items-center justify-center rounded-sm"
                        style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.3)' }}>
                        <UserPlus className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-[15px] text-slate-100 mb-1">Invitar al Hub</h3>
                        <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">Enviar acceso por correo</p>
                    </div>
                </div>

                <div className="mb-6 space-y-4">
                    <div>
                        <label className="block font-mono text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Correo Electrónico</label>
                        <input 
                            type="email" 
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="ejemplo@agencia.com"
                            className="w-full px-3 py-2 font-mono text-xs text-slate-200 placeholder:text-slate-600 rounded-sm transition-all focus:outline-none"
                            style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}
                        />
                    </div>
                    <div>
                        <label className="block font-mono text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nivel de Acceso</label>
                        <select 
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="w-full px-3 py-2 font-mono text-xs text-slate-200 rounded-sm transition-all focus:outline-none appearance-none"
                            style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}
                        >
                            <option value="admin">ProjectManager (Admin)</option>
                            <option value="content_manager">Marketing / SEO</option>
                            <option value="client_admin">Ventas</option>
                            <option value="client_user">Creativo</option>
                            {customRoles.map((r: any) => (
                                <option key={r.id} value={r.id}>{r.name} (Custom)</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isInviting}
                        className="flex-1 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors rounded-sm disabled:opacity-40"
                        style={{ border: '1px solid rgba(30,41,59,0.8)' }}>
                        Cancelar
                    </button>
                    <button
                        onClick={handleInvite}
                        disabled={isInviting}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-teal-400 hover:text-teal-300 transition-all rounded-sm disabled:opacity-40"
                        style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.4)' }}>
                        {isInviting ? (
                            <><span className="w-3 h-3 border border-teal-400 border-t-transparent rounded-full animate-spin" /> Procesando...</>
                        ) : (
                            <><UserPlus size={11} /> Enviar Invitación</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
