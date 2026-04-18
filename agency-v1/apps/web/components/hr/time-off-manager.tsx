"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTimeOffStatus } from "@/actions/hr-time";
import { 
    CalendarClock, CheckCircle2, XCircle, 
    Clock, Plane, HeartPulse, MoreHorizontal, User
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
    companyId: string;
    initialData: any[];
}

const TYPE_CONFIG: any = {
    VACATION: { label: "Vacaciones", icon: Plane, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    SICK: { label: "Incapacidad", icon: HeartPulse, color: "text-red-400 bg-red-500/10 border-red-500/20" },
    PERSONAL: { label: "Permiso Personal", icon: Clock, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    MATERNITY: { label: "Maternidad/Paternidad", icon: CalendarClock, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" }
};

const STATUS_CONFIG: any = {
    PENDING: { label: "Pendiente", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
    APPROVED: { label: "Aprobado", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    REJECTED: { label: "Rechazado", color: "text-red-400 bg-red-500/10 border-red-500/20" }
};

export function TimeOffManager({ initialData }: Props) {
    const router = useRouter();
    const [requests, setRequests] = useState(initialData);

    const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
        const tid = toast.loading(`Marcando como ${status === 'APPROVED' ? 'aprobado' : 'rechazado'}...`);
        
        // Optimistic update
        const prev = [...requests];
        setRequests(requests.map(r => r.id === id ? { ...r, status } : r));

        try {
            const res = await updateTimeOffStatus(id, status);
            if (res.success) {
                toast.success("Estado actualizado", { id: tid });
                router.refresh();
            }
        } catch (error) {
            toast.error("Error al actualizar estado", { id: tid });
            setRequests(prev); // Revert
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CalendarClock className="w-6 h-6 text-emerald-400" />
                        Gestor de Vacaciones y Permisos
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Aprueba o rechaza solicitudes de tiempo libre de tu personal (Time Off).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {requests.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                        <Plane className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-300">No hay solicitudes recientes</h3>
                    </div>
                )}
                
                {requests.map(req => {
                    const type = TYPE_CONFIG[req.type] || TYPE_CONFIG.PERSONAL;
                    const status = STATUS_CONFIG[req.status];
                    const TypeIcon = type.icon;
                    
                    return (
                        <div key={req.id} className="relative flex flex-col rounded-2xl border border-slate-800 bg-[#0b0d14] p-5 shadow-sm hover:border-slate-700 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2.5 py-1 rounded-md border text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 ${type.color}`}>
                                    <TypeIcon className="w-3 h-3" />
                                    {type.label}
                                </div>
                                <div className={`px-2.5 py-1 rounded-md border text-xs font-bold tracking-wider uppercase ${status.color}`}>
                                    {status.label}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white leading-tight">
                                        {req.employee.firstName} {req.employee.lastName}
                                    </h4>
                                    <p className="text-xs text-slate-400">{req.employee.position}</p>
                                </div>
                            </div>

                            <div className="py-3 border-y border-slate-800/60 mb-4 bg-slate-900/30 rounded-lg px-3">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Desde</span>
                                    <span>Hasta</span>
                                </div>
                                <div className="flex justify-between text-sm font-medium text-slate-200">
                                    <span>{format(new Date(req.startDate), "dd MMM, yyyy", { locale: es })}</span>
                                    <span>{format(new Date(req.endDate), "dd MMM, yyyy", { locale: es })}</span>
                                </div>
                                {req.reason && (
                                    <div className="mt-3 text-xs text-slate-400 italic bg-slate-800/50 p-2 rounded line-clamp-2">
                                        "{req.reason}"
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-3 pt-2">
                                {req.status === 'PENDING' ? (
                                    <>
                                        <button 
                                            onClick={() => handleUpdateStatus(req.id, "REJECTED")}
                                            className="flex items-center justify-center gap-2 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" /> Rechazar
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(req.id, "APPROVED")}
                                            className="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Aprobar
                                        </button>
                                    </>
                                ) : (
                                    <div className="col-span-2 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 py-2">
                                        <MoreHorizontal className="w-4 h-4" /> 
                                        {req.status === 'APPROVED' ? 'Aprobado por ti' : 'Rechazado'}
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
