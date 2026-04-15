"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTimesheetStatus } from "@/actions/hr-time";
import { 
    Clock, CheckCircle2, XCircle, FileClock,
    MoreHorizontal, User, Send
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
    companyId: string;
    initialData: any[];
}

const STATUS_CONFIG: any = {
    DRAFT: { label: "Borrador", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
    SUBMITTED: { label: "Enviado a Revisión", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    APPROVED: { label: "Aprobado", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    REJECTED: { label: "Rechazado", color: "text-red-400 bg-red-500/10 border-red-500/20" }
};

export function TimesheetManager({ initialData }: Props) {
    const router = useRouter();
    const [sheets, setSheets] = useState(initialData);

    const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED" | "SUBMITTED") => {
        const tid = toast.loading(`Actualizando estado a ${status}...`);
        
        // Optimistic update
        const prev = [...sheets];
        setSheets(sheets.map(s => s.id === id ? { ...s, status } : s));

        try {
            const res = await updateTimesheetStatus(id, status);
            if (res.success) {
                toast.success("Hojas de tiempo actualizadas", { id: tid });
                router.refresh();
            }
        } catch (error) {
            toast.error("Error al actualizar estado", { id: tid });
            setSheets(prev); // Revert
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileClock className="w-6 h-6 text-blue-400" />
                        Auditoría de Hojas de Tiempo
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Revisa y aprueba el tiempo reportado por el equipo para el cálculo de nómina.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {sheets.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                        <Clock className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-300">No hay hojas de tiempo</h3>
                    </div>
                )}
                
                {sheets.map(sheet => {
                    const statusConfig = STATUS_CONFIG[sheet.status];
                    
                    return (
                        <div key={sheet.id} className="relative flex flex-col rounded-2xl border border-slate-800 bg-[#0b0d14] p-5 shadow-sm hover:border-slate-700 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-xs text-slate-400 font-medium">
                                    Periodo contable
                                </div>
                                <div className={`px-2.5 py-1 rounded-md border text-[10px] font-bold tracking-wider uppercase ${statusConfig.color}`}>
                                    {statusConfig.label}
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 border border-slate-800/80 mb-5">
                                <span className="text-sm font-semibold text-white">
                                    {format(new Date(sheet.periodStart), "dd MMM", { locale: es })}
                                </span>
                                <span className="text-slate-500 mx-2">—</span>
                                <span className="text-sm font-semibold text-white">
                                    {format(new Date(sheet.periodEnd), "dd MMM", { locale: es })}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-white leading-tight">
                                        {sheet.employee.firstName} {sheet.employee.lastName}
                                    </h4>
                                    <p className="text-xs text-slate-400">{sheet.employee.position}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-blue-400">
                                        {sheet.totalHours}<span className="text-xs text-slate-500 font-medium ml-1">hrs</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4 px-1 py-1">
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {sheet._count.timeEntries} Registros</span>
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-800/60">
                                {sheet.status === 'SUBMITTED' ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => handleUpdateStatus(sheet.id, "REJECTED")}
                                            className="flex items-center justify-center gap-2 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" /> Observar
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(sheet.id, "APPROVED")}
                                            className="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Aprobar Nómina
                                        </button>
                                    </div>
                                ) : sheet.status === 'DRAFT' ? (
                                    <button 
                                        onClick={() => handleUpdateStatus(sheet.id, "SUBMITTED")}
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-bold transition-all"
                                    >
                                        <Send className="w-4 h-4" /> Forzar Envío a RRHH
                                    </button>
                                ) : (
                                    <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 py-1">
                                        <MoreHorizontal className="w-4 h-4" /> 
                                        {sheet.status === 'APPROVED' ? `Aprobado por ${sheet.approvedBy?.firstName || 'Admin'}` : 'Rechazado y Devuelto'}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
