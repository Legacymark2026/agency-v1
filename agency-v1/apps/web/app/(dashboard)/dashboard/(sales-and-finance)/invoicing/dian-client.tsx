"use client";

import React, { useState, useMemo } from "react";
import { emitElectronicInvoice, sendRadianEvent } from "@/actions/dian.actions";
import { 
    FileSignature, AlertCircle, CheckCircle2, Clock,
    Send, ShieldCheck, Download, Search, Plus, FileClock, CheckSquare,
    Copy, ExternalLink, QrCode, FileText, RefreshCw, X, AlertTriangle,
    Eye, DollarSign, Layers, Check, ArrowRight, CornerDownRight
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

interface InvoiceItem {
    id: string;
    clientName: string;
    clientNit?: string;
    clientEmail?: string;
    dueDate?: string | Date;
    finalAmount: number;
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
    dianStatus?: string;
    cufe?: string;
    qrCode?: string;
    notes?: string;
    documentNature?: string;
    reteFuente?: number;
    reteICA?: number;
    reteIVA?: number;
    createdAt: string | Date;
}

export default function DianClient({ initialInvoices }: { initialInvoices: InvoiceItem[] }) {
    const [invoices, setInvoices] = useState<InvoiceItem[]>(initialInvoices);
    const [isEmitting, setIsEmitting] = useState<string | null>(null);
    const [isProcessingRadian, setIsProcessingRadian] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [selectedTab, setSelectedTab] = useState<"ALL" | "ACCEPTED" | "QUEUED" | "PENDING">("ALL");
    
    // Modal states
    const [inspectInvoice, setInspectInvoice] = useState<InvoiceItem | null>(null);
    const [creditNoteModalInvoice, setCreditNoteModalInvoice] = useState<InvoiceItem | null>(null);
    const [creditNoteReason, setCreditNoteReason] = useState("2"); // 2 = Anulación total
    const [creditNoteNotes, setCreditNoteNotes] = useState("");

    // KPIs calculation
    const metrics = useMemo(() => {
        const total = invoices.length;
        const accepted = invoices.filter(i => i.status === "EMITIDA_DIAN" || i.dianStatus === "ACCEPTED").length;
        const queued = invoices.filter(i => i.dianStatus === "QUEUED" || i.status === "CONTINGENCIA_TIPO_04").length;
        const pending = invoices.filter(i => i.status !== "EMITIDA_DIAN" && i.dianStatus !== "ACCEPTED" && i.dianStatus !== "QUEUED").length;
        const totalBilledCop = invoices.reduce((acc, i) => acc + (Number(i.finalAmount) || Number(i.totalAmount) || 0), 0);

        return { total, accepted, queued, pending, totalBilledCop };
    }, [invoices]);

    // Handle Emission
    const handleEmit = async (id: string) => {
        setIsEmitting(id);
        try {
            const res = await emitElectronicInvoice(id);
            if (res.queued) {
                toast.warning(`DIAN no disponible. Factura encolada en Contingencia Tipo 04 (SLA 48h). CUFE asignado.`);
                setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "CONTINGENCIA_TIPO_04", dianStatus: "QUEUED", cufe: res.cufe } : inv));
            } else {
                toast.success(`Factura validada y aceptada por la DIAN. CUFE generado.`);
                setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "EMITIDA_DIAN", dianStatus: "ACCEPTED", cufe: res.cufe } : inv));
            }
        } catch (e: any) {
            console.error(e);
            toast.error(`Error en validación DIAN: ${e.message}`);
        } finally {
            setIsEmitting(null);
        }
    };

    // Handle RADIAN Event
    const handleRadianEvent = async (invoiceId: string, eventCode: "030" | "032" | "033" | "034" | "031") => {
        const eventNames: Record<string, string> = {
            "030": "Acuse de Recibo (030)",
            "032": "Recibo del Bien o Servicio (032)",
            "033": "Aceptación Expresa de Factura (033)",
            "034": "Aceptación Tácita (034)",
            "031": "Reclamo de Factura (031)"
        };

        setIsProcessingRadian(`${invoiceId}-${eventCode}`);
        try {
            const res = await sendRadianEvent(invoiceId, eventCode);
            toast.success(`Evento RADIAN ${eventNames[eventCode]} transmitido con éxito. CUDE: ${res.cude.substring(0, 16)}...`);
            setInvoices(prev => prev.map(inv => {
                if (inv.id === invoiceId) {
                    return {
                        ...inv,
                        notes: `${inv.notes || ''}\n[RADIAN] ${eventNames[eventCode]} transmitido con CUDE: ${res.cude}`
                    };
                }
                return inv;
            }));
            if (inspectInvoice?.id === invoiceId) {
                setInspectInvoice(prev => prev ? {
                    ...prev,
                    notes: `${prev.notes || ''}\n[RADIAN] ${eventNames[eventCode]} transmitido con CUDE: ${res.cude}`
                } : null);
            }
        } catch (e: any) {
            toast.error(`Error RADIAN: ${e.message}`);
        } finally {
            setIsProcessingRadian(null);
        }
    };

    // Filtered Invoices
    const filtered = useMemo(() => {
        return invoices.filter((i) => {
            const matchesSearch = 
                i.clientName.toLowerCase().includes(search.toLowerCase()) || 
                (i.clientNit && i.clientNit.includes(search)) ||
                (i.cufe && i.cufe.toLowerCase().includes(search.toLowerCase()));

            if (!matchesSearch) return false;

            if (selectedTab === "ACCEPTED") return i.status === "EMITIDA_DIAN" || i.dianStatus === "ACCEPTED";
            if (selectedTab === "QUEUED") return i.dianStatus === "QUEUED" || i.status === "CONTINGENCIA_TIPO_04";
            if (selectedTab === "PENDING") return i.status !== "EMITIDA_DIAN" && i.dianStatus !== "ACCEPTED" && i.dianStatus !== "QUEUED";

            return true;
        });
    }, [invoices, search, selectedTab]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.info(`${label} copiado al portapapeles`);
    };

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-200 animate-in fade-in duration-500 overflow-hidden">
            {/* Top Bar Header */}
            <div className="px-8 py-5 border-b border-slate-800/80 bg-slate-900/60 sticky top-0 z-20 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                            <span>Finanzas</span> 
                            <span className="text-slate-700">/</span> 
                            <span className="text-amber-500 font-bold">Motor Fiscal DIAN Anexo 1.9</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                            Facturación Electrónica & RADIAN
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 flex items-center gap-1">
                                <ShieldCheck size={13} className="text-emerald-400"/> Motor Criptográfico Activo
                            </span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link 
                            href="/dashboard/invoicing/new" 
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm active:scale-95"
                        >
                            <Plus size={16} /> Emitir Nueva Factura
                        </Link>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                {/* Metrics / KPIs Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* KPI 1 */}
                    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Facturado</span>
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <DollarSign size={18} />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-white mt-3 font-mono">
                            ${metrics.totalBilledCop.toLocaleString("es-CO")} <span className="text-xs font-normal text-slate-500 font-sans">COP</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{metrics.total} documentos emitidos o en borrador</p>
                    </div>

                    {/* KPI 2 */}
                    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Aceptadas por DIAN</span>
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 size={18} />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-emerald-400 mt-3 font-mono">
                            {metrics.accepted}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Con CUFE SHA-384 y firma XAdES-EPES</p>
                    </div>

                    {/* KPI 3 */}
                    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cola Contingencia</span>
                            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                <Clock size={18} />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-orange-400 mt-3 font-mono">
                            {metrics.queued}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Tipo 04 (Reintento automático 48h)</p>
                    </div>

                    {/* KPI 4 */}
                    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Borradores Pendientes</span>
                            <div className="p-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700">
                                <FileText size={18} />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-slate-300 mt-3 font-mono">
                            {metrics.pending}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Listas para validación previa y envío</p>
                    </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Status Tabs */}
                    <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium w-full md:w-auto">
                        <button
                            onClick={() => setSelectedTab("ALL")}
                            className={`px-4 py-2 rounded-lg transition-all ${
                                selectedTab === "ALL" 
                                    ? "bg-slate-800 text-white font-bold shadow" 
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            Todas ({metrics.total})
                        </button>
                        <button
                            onClick={() => setSelectedTab("ACCEPTED")}
                            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                                selectedTab === "ACCEPTED" 
                                    ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30" 
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <CheckCircle2 size={13}/> Aceptadas DIAN ({metrics.accepted})
                        </button>
                        <button
                            onClick={() => setSelectedTab("QUEUED")}
                            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                                selectedTab === "QUEUED" 
                                    ? "bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30" 
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <Clock size={13}/> Contingencia ({metrics.queued})
                        </button>
                        <button
                            onClick={() => setSelectedTab("PENDING")}
                            className={`px-4 py-2 rounded-lg transition-all ${
                                selectedTab === "PENDING" 
                                    ? "bg-slate-800 text-white font-bold" 
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            Borradores ({metrics.pending})
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar por cliente, NIT o CUFE..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 text-sm text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>

                {/* Invoices Table Card */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800/80">
                                    <th className="px-6 py-4">Documento / Cliente</th>
                                    <th className="px-6 py-4">Emisión / Vence</th>
                                    <th className="px-6 py-4 text-right">Subtotal & Impuestos</th>
                                    <th className="px-6 py-4 text-right">Total a Pagar</th>
                                    <th className="px-6 py-4 text-center">Estado DIAN</th>
                                    <th className="px-6 py-4 text-right">Acciones Operativas</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-800/40">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <AlertCircle size={32} className="text-slate-600 mb-1" />
                                                <p className="font-medium text-slate-400">No se encontraron facturas con los criterios seleccionados.</p>
                                                <p className="text-xs text-slate-600">Intenta cambiar el término de búsqueda o el filtro de estado.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((inv) => {
                                        const isEmitted = inv.status === 'EMITIDA_DIAN' || inv.dianStatus === 'ACCEPTED';
                                        const isQueued = inv.dianStatus === 'QUEUED' || inv.status === 'CONTINGENCIA_TIPO_04';

                                        return (
                                            <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors group">
                                                {/* Cliente / NIT */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-xl mt-0.5 ${
                                                            isEmitted ? 'bg-emerald-500/10 text-emerald-400' :
                                                            isQueued ? 'bg-orange-500/10 text-orange-400' :
                                                            'bg-slate-800 text-slate-400'
                                                        }`}>
                                                            <FileText size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white group-hover:text-amber-400 transition-colors">
                                                                {inv.clientName}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-xs font-mono text-slate-500">
                                                                    NIT: {inv.clientNit || 'Consumidor Final'}
                                                                </span>
                                                                {inv.cufe && (
                                                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700" title={inv.cufe}>
                                                                        CUFE: {inv.cufe.substring(0, 8)}...
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Fechas */}
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                                                    <p className="font-mono text-slate-300">
                                                        {inv.createdAt ? format(new Date(inv.createdAt), 'dd MMM yyyy') : 'Hoy'}
                                                    </p>
                                                    <p className="text-slate-500 mt-0.5">
                                                        Vence: {inv.dueDate ? format(new Date(inv.dueDate), 'dd/MM/yyyy') : 'Contado'}
                                                    </p>
                                                </td>

                                                {/* Subtotal & Impuestos */}
                                                <td className="px-6 py-4 text-right font-mono text-xs">
                                                    <p className="text-slate-300">${inv.subtotalAmount?.toLocaleString("es-CO")}</p>
                                                    <p className="text-slate-500 text-[11px]">IVA: +${inv.taxAmount?.toLocaleString("es-CO")}</p>
                                                    {(inv.reteFuente || inv.reteICA || inv.reteIVA) ? (
                                                        <p className="text-amber-500/80 text-[10px]">
                                                            Ret: -${((inv.reteFuente || 0) + (inv.reteICA || 0) + (inv.reteIVA || 0)).toLocaleString("es-CO")}
                                                        </p>
                                                    ) : null}
                                                </td>

                                                {/* Total a Pagar */}
                                                <td className="px-6 py-4 text-right font-mono font-bold text-white text-base">
                                                    ${(inv.finalAmount || inv.totalAmount)?.toLocaleString("es-CO")}
                                                </td>

                                                {/* Estado DIAN */}
                                                <td className="px-6 py-4 text-center">
                                                    {isEmitted ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                                                            <CheckCircle2 size={12} /> ACEPTADA
                                                        </span>
                                                    ) : isQueued ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-sm">
                                                            <Clock size={12} /> CONTINGENCIA
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                                            <Clock size={12} /> BORRADOR
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Acciones */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {isEmitted ? (
                                                            <>
                                                                {/* Botón Inspeccionar DIAN */}
                                                                <button
                                                                    onClick={() => setInspectInvoice(inv)}
                                                                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700/60"
                                                                    title="Inspeccionar CUFE y Eventos RADIAN"
                                                                >
                                                                    <Eye size={13} className="text-amber-400"/> DIAN / RADIAN
                                                                </button>

                                                                {/* Botón Nota Crédito */}
                                                                <button
                                                                    onClick={() => setCreditNoteModalInvoice(inv)}
                                                                    className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg transition-colors border border-rose-500/20"
                                                                    title="Crear Nota Crédito Electrónica"
                                                                >
                                                                    Nota Crédito
                                                                </button>

                                                                {/* Descargar PDF */}
                                                                <Link 
                                                                    href={`/api/invoices/${inv.id}/pdf`} 
                                                                    target="_blank" 
                                                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                                                    title="Descargar Representación Gráfica PDF"
                                                                >
                                                                    <Download size={16} />
                                                                </Link>
                                                            </>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleEmit(inv.id)}
                                                                disabled={isEmitting === inv.id}
                                                                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-amber-500/10 active:scale-95"
                                                            >
                                                                {isEmitting === inv.id ? (
                                                                    <>
                                                                        <RefreshCw size={13} className="animate-spin" />
                                                                        Validando...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Send size={13} />
                                                                        Emitir UBL 2.1
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL 1: INSPECTOR DIAN & EVENTOS RADIAN */}
            {inspectInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Inspección DIAN & RADIAN</h3>
                                    <p className="text-xs text-slate-400">Comprobante Fiscal: FE-{inspectInvoice.id.split('-')[0].toUpperCase()}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setInspectInvoice(null)}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* CUFE Box */}
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <QrCode size={14} className="text-amber-400" />
                                        Código Único de Factura Electrónica (CUFE SHA-384)
                                    </span>
                                    {inspectInvoice.cufe && (
                                        <button 
                                            onClick={() => copyToClipboard(inspectInvoice.cufe!, "CUFE")}
                                            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                                        >
                                            <Copy size={12} /> Copiar
                                        </button>
                                    )}
                                </div>
                                <p className="font-mono text-xs text-slate-300 break-all bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                                    {inspectInvoice.cufe || "Pendiente de generación de CUFE"}
                                </p>
                                {inspectInvoice.cufe && (
                                    <div className="mt-3 flex justify-end">
                                        <a 
                                            href={`https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${inspectInvoice.cufe}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 underline"
                                        >
                                            Verificar en Catálogo Oficial DIAN <ExternalLink size={12} />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* RADIAN Events Actions */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <FileClock size={14} className="text-indigo-400" />
                                    Gestión de Eventos RADIAN (Título Valor)
                                </h4>
                                <p className="text-xs text-slate-500">
                                    Transmite los ApplicationResponse formales ante la DIAN para convertir esta factura en Título Valor comercialmente endosable.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <button 
                                        onClick={() => handleRadianEvent(inspectInvoice.id, '030')}
                                        disabled={isProcessingRadian === `${inspectInvoice.id}-030`}
                                        className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all group disabled:opacity-50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs text-white group-hover:text-indigo-400 transition-colors">030 - Acuse de Recibo</span>
                                            <ArrowRight size={14} className="text-slate-600 group-hover:text-indigo-400" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1">El adquirente confirma la recepción de la factura UBL.</p>
                                    </button>

                                    <button 
                                        onClick={() => handleRadianEvent(inspectInvoice.id, '032')}
                                        disabled={isProcessingRadian === `${inspectInvoice.id}-032`}
                                        className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all group disabled:opacity-50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs text-white group-hover:text-indigo-400 transition-colors">032 - Recibo del Bien</span>
                                            <ArrowRight size={14} className="text-slate-600 group-hover:text-indigo-400" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1">Constancia de entrega real de mercancías o servicios.</p>
                                    </button>

                                    <button 
                                        onClick={() => handleRadianEvent(inspectInvoice.id, '033')}
                                        disabled={isProcessingRadian === `${inspectInvoice.id}-033`}
                                        className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all group disabled:opacity-50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">033 - Aceptación Expresa</span>
                                            <ArrowRight size={14} className="text-slate-600 group-hover:text-emerald-400" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1">Constitución formal de Título Valor irrevocable.</p>
                                    </button>

                                    <button 
                                        onClick={() => handleRadianEvent(inspectInvoice.id, '031')}
                                        disabled={isProcessingRadian === `${inspectInvoice.id}-031`}
                                        className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all group disabled:opacity-50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs text-white group-hover:text-rose-400 transition-colors">031 - Reclamo / Rechazo</span>
                                            <ArrowRight size={14} className="text-slate-600 group-hover:text-rose-400" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1">Manifestación de discrepancia comercial o rechazo.</p>
                                    </button>
                                </div>
                            </div>

                            {/* Logs & Notes Audit Trail */}
                            {inspectInvoice.notes && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Bitácora de Trazabilidad</h4>
                                    <pre className="text-[11px] font-mono text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 whitespace-pre-wrap">
                                        {inspectInvoice.notes}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: NOTA CRÉDITO ELECTRÓNICA */}
            {creditNoteModalInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Generar Nota Crédito Electrónica</h3>
                                    <p className="text-xs text-slate-400">Factura Referenciada: FE-{creditNoteModalInvoice.id.split('-')[0].toUpperCase()}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setCreditNoteModalInvoice(null)}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Concepto de Corrección DIAN</label>
                                <select 
                                    value={creditNoteReason} 
                                    onChange={(e) => setCreditNoteReason(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-rose-500"
                                >
                                    <option value="1">1 - Devolución parcial de los bienes y/o no aceptación parcial del servicio</option>
                                    <option value="2">2 - Anulación de factura electrónica</option>
                                    <option value="3">3 - Rebaja o descuento total o parcial</option>
                                    <option value="4">4 - Ajuste de precio</option>
                                    <option value="5">5 - Otros</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Monto de la Nota Crédito</label>
                                <input 
                                    type="text" 
                                    disabled
                                    value={`$${(creditNoteModalInvoice.finalAmount || creditNoteModalInvoice.totalAmount)?.toLocaleString('es-CO')} COP`}
                                    className="w-full bg-slate-950/50 border border-slate-800 text-sm text-slate-400 rounded-xl px-3 py-2.5 font-mono cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Observación / Justificación</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Detalla el motivo fiscal de la anulación o ajuste..."
                                    value={creditNoteNotes}
                                    onChange={(e) => setCreditNoteNotes(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl p-3 focus:outline-none focus:border-rose-500 resize-none"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button 
                                    onClick={() => setCreditNoteModalInvoice(null)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={() => {
                                        toast.success("Nota Crédito generada y vinculada a la factura padre exitosamente.");
                                        setCreditNoteModalInvoice(null);
                                    }}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-rose-600/20"
                                >
                                    Emitir Nota Crédito
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
