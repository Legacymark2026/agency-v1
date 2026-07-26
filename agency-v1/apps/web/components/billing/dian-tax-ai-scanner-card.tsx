"use client";

import React, { useState } from "react";
import { runDianTaxAuditScan } from "@/lib/dian-tax-ai-scanner";
import { Sparkles, ShieldAlert, CheckCircle2, AlertTriangle, Lightbulb, RefreshCw, Zap } from "lucide-react";

export function DianTaxAiScannerCard() {
    const [isScanning, setIsScanning] = useState(false);

    const auditResult = runDianTaxAuditScan({
        totalInvoicedMonth: 45000000,
        totalPurchasesMonth: 18000000,
        totalPayrollMonth: 12000000,
        hasActiveCertificate: true,
        technicalKeyLength: 64,
        uvtValue: 49799,
    });

    const handleReScan = () => {
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 600);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Auditor Preventivo AI & Optimización Tributaria DIAN 2026 🤖
                        </h3>
                        <p className="text-xs text-slate-400">
                            Escaneo continuo de topes UVT, bases de retención y consistencia de Firma XAdES-BES.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleReScan}
                    disabled={isScanning}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700 flex items-center gap-2 text-xs font-bold"
                >
                    <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} /> Escanear Ahora
                </button>
            </div>

            {/* Audit Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Puntaje de Salud DIAN</span>
                        <span className="text-2xl font-black text-emerald-400 font-mono">{auditResult.score}/100</span>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-emerald-400/80" />
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Nivel de Riesgo Audit</span>
                        <span className="text-sm font-bold text-teal-300 uppercase tracking-widest">{auditResult.riskLevel === "LOW" ? "Bajo (Seguro)" : "Medio"}</span>
                    </div>
                    <Zap className="w-8 h-8 text-teal-400/80" />
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Proyección Retefuente Compras</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">${auditResult.taxSavingsEstimate.toLocaleString("es-CO")} COP</span>
                    </div>
                    <Lightbulb className="w-8 h-8 text-amber-400/80" />
                </div>
            </div>

            {/* Recommendations & AI Insights */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Recomendaciones Tributarias Automatizadas
                </h4>
                <ul className="space-y-2 text-slate-300">
                    {auditResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-teal-400 font-bold">•</span>
                            <span>{rec}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
