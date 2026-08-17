"use client";

import { useState } from "react";
import { exportUserData, requestDataAnonymization } from "@/actions/compliance";
import { ShieldCheck, Download, Trash2, CheckCircle2, Lock, FileText, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrivacyPortalClient() {
    const [loadingExport, setLoadingExport] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleExport = async () => {
        setLoadingExport(true);
        setStatusMessage(null);
        try {
            const res = await exportUserData();
            if (res.success && res.data) {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
                const downloadAnchor = document.createElement("a");
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `iso-27701-pii-export-${new Date().toISOString().slice(0, 10)}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
                setStatusMessage({ type: "success", text: "Tus datos PII han sido exportados en formato JSON en cumplimiento de ISO/IEC 27701." });
            } else {
                setStatusMessage({ type: "error", text: res.error || "Error al exportar datos." });
            }
        } catch {
            setStatusMessage({ type: "error", text: "Error de conexión." });
        } finally {
            setLoadingExport(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿Confirmas la solicitud de anonimización de tus datos conforme a ISO 27701 / GDPR? Esta acción desactivará tu cuenta.")) return;
        setLoadingDelete(true);
        setStatusMessage(null);
        try {
            const res = await requestDataAnonymization();
            if (res.success) {
                setStatusMessage({ type: "success", text: res.message || "Tus datos han sido anonimizados." });
            } else {
                setStatusMessage({ type: "error", text: res.error || "Error al procesar la solicitud." });
            }
        } catch {
            setStatusMessage({ type: "error", text: "Error de comunicación." });
        } finally {
            setLoadingDelete(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            {/* Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">ISO/IEC 27701 & GDPR Portal</span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold">Centro de Privacidad y Derechos ARCO</h1>
                    </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                    Gestiona tus datos personales, ejerce tu derecho a la portabilidad de información y solicita la anonimización de tus registros con total transparencia y seguridad.
                </p>
            </div>

            {/* Status Message */}
            {statusMessage && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border ${
                    statusMessage.type === "success" 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                    {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{statusMessage.text}</span>
                </div>
            )}

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                            <Download size={20} />
                        </div>
                        <h3 className="font-bold text-base text-white">Portabilidad de Datos (JSON)</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Descarga una copia completa de tus datos de perfil, preferencias e historial de auditoría de actividad en formato JSON estándar.
                    </p>
                    <Button 
                        onClick={handleExport} 
                        disabled={loadingExport}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 h-auto rounded-xl flex items-center justify-center gap-2"
                    >
                        {loadingExport ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                        <span>Descargar Mis Datos PII</span>
                    </Button>
                </div>

                {/* Anonymize Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                            <Trash2 size={20} />
                        </div>
                        <h3 className="font-bold text-base text-white">Derecho al Olvido & Anonimización</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Solicita la desasociación permanente de tu identidad y la eliminación de tus datos personales conforme a la norma ISO 27701.
                    </p>
                    <Button 
                        onClick={handleDelete}
                        disabled={loadingDelete}
                        variant="destructive"
                        className="w-full bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-700/50 font-semibold text-xs py-2.5 h-auto rounded-xl flex items-center justify-center gap-2"
                    >
                        {loadingDelete ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        <span>Solicitar Anonimización</span>
                    </Button>
                </div>
            </div>

            {/* Compliance Info Banner */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <Lock size={14} className="text-emerald-400" />
                    <span>Cifrado de Extremo a Extremo (TLS 1.3 & AES-256)</span>
                </div>
                <div className="flex items-center gap-2">
                    <FileText size={14} className="text-blue-400" />
                    <span>Ley 1581 / GDPR Compliant</span>
                </div>
            </div>
        </div>
    );
}
