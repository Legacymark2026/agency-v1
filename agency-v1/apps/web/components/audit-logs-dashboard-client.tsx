"use client";

import { useState, useEffect } from "react";
import { getComplianceAuditLogs } from "@/actions/compliance";
import { ShieldCheck, FileCheck2, User, Clock, Search, RefreshCw, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuditLogsDashboardClient() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const loadLogs = async (p: number) => {
        setLoading(true);
        try {
            const res = await getComplianceAuditLogs(p, 15);
            if (res.success) {
                setLogs(res.data || []);
                setTotal(res.total || 0);
            }
        } catch {
            console.error("Error loading audit logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs(page);
    }, [page]);

    const totalPages = Math.ceil(total / 15) || 1;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">ISO/IEC 27001 SIEM Audit Trail</span>
                        <h1 className="text-2xl font-extrabold text-white">Registros de Auditoría & Cumplimiento</h1>
                    </div>
                </div>

                <Button 
                    onClick={() => loadLogs(page)} 
                    variant="outline" 
                    className="bg-slate-950 hover:bg-slate-800 border-slate-700 text-xs font-semibold text-slate-200 self-start sm:self-auto"
                >
                    <RefreshCw size={14} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
                    <span>Actualizar Registros</span>
                </Button>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Fecha / Hora (UTC)</th>
                                <th className="p-4">Acción Auditoría</th>
                                <th className="p-4">Usuario / Actor</th>
                                <th className="p-4">Recurso Afectado</th>
                                <th className="p-4">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-purple-400" />
                                        <span>Cargando registros inmutables SIEM...</span>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No se encontraron registros de auditoría recientes.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                            {new Date(log.createdAt).toISOString().replace("T", " ").substring(0, 19)}
                                        </td>
                                        <td className="p-4 font-semibold text-white">
                                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono text-[11px]">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-slate-400" />
                                                <span>{log.user?.email || log.userId || "Sistema / Gateway"}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-slate-400 text-[11px]">
                                            {log.resourceType}:{log.resourceId?.substring(0, 8)}...
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <Lock size={10} />
                                                Inmutable
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Página {page} de {totalPages} ({total} registros totales)</span>
                    <div className="flex items-center gap-2">
                        <Button 
                            disabled={page <= 1} 
                            onClick={() => setPage(p => p - 1)}
                            variant="outline" 
                            size="sm"
                            className="bg-slate-900 border-slate-800 text-xs"
                        >
                            <ChevronLeft size={14} /> Anterior
                        </Button>
                        <Button 
                            disabled={page >= totalPages} 
                            onClick={() => setPage(p => p + 1)}
                            variant="outline" 
                            size="sm"
                            className="bg-slate-900 border-slate-800 text-xs"
                        >
                            Siguiente <ChevronRight size={14} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
