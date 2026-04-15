"use client";

import { Plus, UserPlus, Phone, MessageSquare } from "lucide-react";
import { CreateDealDialog } from "@/components/crm/create-deal-dialog";
import { CreateLeadDialog } from "@/components/crm/create-lead-dialog";
import { LogCallDialog } from "@/components/crm/log-call-dialog";
import { QuickNoteDialog } from "@/components/crm/quick-note-dialog";

interface QuickActionsProps { companyId: string; }

// Home-style button — rounded-sm, mono font, teal border/hover
function ActionBtn({ label, code, className }: { label: string; code: string; className?: string }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all duration-200 cursor-pointer ${className}`}>
            {code === 'DEAL' && <Plus className="h-3 w-3" />}
            {code === 'LEAD' && <UserPlus className="h-3 w-3" />}
            {code === 'CALL' && <Phone className="h-3 w-3" />}
            {code === 'NOTE' && <MessageSquare className="h-3 w-3" />}
            {label}
        </span>
    );
}

export function QuickActions({ companyId }: QuickActionsProps) {
    return (
        <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* New Deal — primary teal */}
            <CreateDealDialog
                companyId={companyId}
                trigger={
                    <button className="flex items-center gap-1.5 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white rounded-sm transition-all hover:shadow-[0_0_20px_-8px_rgba(13,148,136,0.6)] hover:-translate-y-0.5"
                        style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.4)' }}>
                        <Plus className="h-3 w-3" /> Nuevo Deal
                    </button>
                }
            />

            {/* Secondary actions bar */}
            <div className="flex items-center gap-0"
                style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.8)', borderRadius: '0.15rem' }}>
                <CreateLeadDialog
                    companyId={companyId}
                    trigger={
                        <button className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-teal-400 hover:bg-teal-950/30 transition-all">
                            <UserPlus className="h-3 w-3" /> Lead
                        </button>
                    }
                />
                <div className="w-px h-5" style={{ background: 'rgba(30,41,59,0.8)' }} />
                <LogCallDialog
                    companyId={companyId}
                    trigger={
                        <button className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-teal-400 hover:bg-teal-950/30 transition-all">
                            <Phone className="h-3 w-3" /> Llamada
                        </button>
                    }
                />
                <div className="w-px h-5" style={{ background: 'rgba(30,41,59,0.8)' }} />
                <QuickNoteDialog
                    companyId={companyId}
                    trigger={
                        <button className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-amber-400 hover:bg-amber-950/20 transition-all">
                            <MessageSquare className="h-3 w-3" /> Nota
                        </button>
                    }
                />
            </div>
        </div>
    );
}
