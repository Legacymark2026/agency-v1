"use client";

import React, { useState } from "react";
import { emitElectronicInvoice } from "@/actions/dian.actions";
import { 
    FileSignature, AlertCircle, CheckCircle2, Clock,
    Send, ShieldCheck, Download, Search, Plus
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function DianClient({ initialInvoices }: any) {
    const [isEmitting, setIsEmitting] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const handleEmit = async (id: string) => {
        setIsEmitting(id);
        try {
            const res = await emitElectronicInvoice(id);
            alert(`Factura emitida ante la DIAN exitosamente. CUFE: ${res.cufe}`);
        } catch (e: any) {
            console.error(e);
            alert(`Error de emisión: ${e.message}`);
        } finally {
            setIsEmitting(null);
        }
    };

    const filtered = initialInvoices.filter((i: any) => 
        i.clientName.toLowerCase().includes(search.toLowerCase()) || 
        i.clientNit?.includes(search)
    );

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-200 animate-in fade-in duration-500">
            <div className="px-8 py-6 border-b border-slate-800/60 bg-slate-900/40 sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                            <span>Finanzas</span> <span className="text-slate-700">/</span> <span className="text-amber-500">Tributario</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                            Emisión DIAN <span className="text-sm font-normal text-slate-500">UBL 2.1</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20 flex items-center gap-1">
                                <ShieldCheck size={12}/> API Real
                            </span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/invoicing/new" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/20 text-sm">
                            <Plus size={16} /> Crear Factura
                        </Link>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="text" 
                                placeholder="Buscar por Cliente o NIT..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 text-sm text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 space-y-8">
                <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl shadow-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/30 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800/60">
                                <th className="px-6 py-4">Cliente / NIT</th>
                                <th className="px-6 py-4">Vencimiento</th>
                                <th className="px-6 py-4 text-right">Total (COP)</th>
                                <th className="px-6 py-4 text-center">Estado DIAN</th>
                                <th className="px-6 py-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-800/40">
                            {filtered.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay facturas pendientes.</td></tr>
                            )}
                            {filtered.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-white">{inv.clientName}</p>
                                        <p className="text-xs text-slate-500 font-mono mt-1">NIT: {inv.clientNit || 'N/A'}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                        {inv.dueDate ? format(new Date(inv.dueDate), 'yyyy-MM-dd') : 'Sin fecha'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-200">
                                        ${inv.finalAmount?.toLocaleString("es-CO")}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {inv.status === 'EMITIDA_DIAN' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <CheckCircle2 size={10} /> TRANSMITIDA
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                                <Clock size={10} /> BORRADOR
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {inv.status === 'EMITIDA_DIAN' ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => alert('Creación de Nota Crédito próximamente en Fase 3.3')} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg transition-colors">Nota Crédito</button>
                                                <Link href={`/api/invoices/${inv.id}/pdf`} target="_blank" className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors inline-block">
                                                    <Download size={18} />
                                                </Link>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleEmit(inv.id)}
                                                disabled={isEmitting === inv.id}
                                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-end gap-2 ml-auto shadow-[0_0_10px_rgba(217,119,6,0.3)]"
                                            >
                                                {isEmitting === inv.id ? "Emitiendo (XML)..." : <><Send size={14} /> Transmitir UBL</>}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


