"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteLead } from "@/actions/leads";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function LeadDeleteButton({ leadId }: { leadId?: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    if (!leadId) return null;

    const handleDelete = () => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar permanentemente este lead? Esta acción no se puede deshacer.")) return;

        startTransition(async () => {
            const res = await deleteLead(leadId);
            if (res.success) {
                toast?.success?.("Lead eliminado exitosamente") || alert("Lead eliminado");
                router.push('/dashboard/admin/crm/leads');
            } else {
                toast?.error?.(res.error || "Error al eliminar el lead") || alert("Error al eliminar");
            }
        });
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="group flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all focus:outline-none"
            title="Eliminar Lead"
        >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
        </button>
    );
}
