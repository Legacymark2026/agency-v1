"use client";
import { updateCommissionStatus } from "@/actions/crm-commissions";
import { toast } from "sonner";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const STATUSES = ["PENDING", "APPROVED", "PAID", "CANCELLED"] as const;
const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pendiente", APPROVED: "Aprobar", PAID: "Marcar Pagado", CANCELLED: "Cancelar",
};

export function CommissionActions({ paymentId, currentStatus }: { paymentId: string; currentStatus: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = async (status: string) => {
        setLoading(true);
        setOpen(false);
        const res = await updateCommissionStatus(paymentId, status as any);
        if (res.success) toast.success(`Estado actualizado: ${STATUS_LABELS[status]}`);
        else toast.error("Error al actualizar");
        setLoading(false);
    };

    if (currentStatus === "PAID" || currentStatus === "CANCELLED") return null;

    return (
        <div className="relative">
            <button onClick={() => setOpen(o => !o)} disabled={loading}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
                <ChevronDown size={12} />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-36 rounded-xl overflow-hidden z-50"
                    style={{ background: 'rgba(15,20,35,0.98)', border: '1px solid rgba(30,41,59,0.9)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                    {STATUSES.filter(s => s !== currentStatus).map(s => (
                        <button key={s} onClick={() => handleChange(s)}
                            className="w-full text-left px-3 py-2 font-mono text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                            {STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
