"use client";

import React, { useState } from "react";
import { DIAN_OPERATION_TYPES, DIAN_PAYMENT_METHODS, DIAN_TAX_CATALOG } from "@/lib/dian-tax-parameters";
import { Layers, CreditCard, DollarSign, HeartPulse, Sparkles, CheckCircle2, ShieldCheck, Globe } from "lucide-react";

export function DianTaxParametersManager() {
    const [selectedTab, setSelectedTab] = useState<"operations" | "payments" | "healthy_taxes">("operations");

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Catálogo Maestro de Parámetros Tributarios DIAN (Anexo 1.8 / 1.9)
                        </h3>
                        <p className="text-xs text-slate-400">
                            Tipos de Operación (AIU, Mandatos, Exportación), Medios de Pago y Tributos Saludables Ley 2277.
                        </p>
                    </div>
                </div>

                <div className="flex gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
                    <button
                        onClick={() => setSelectedTab("operations")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            selectedTab === "operations" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Globe className="w-3.5 h-3.5" /> Operaciones DIAN ({DIAN_OPERATION_TYPES.length})
                    </button>
                    <button
                        onClick={() => setSelectedTab("payments")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            selectedTab === "payments" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <CreditCard className="w-3.5 h-3.5" /> Medios de Pago ({DIAN_PAYMENT_METHODS.length})
                    </button>
                    <button
                        onClick={() => setSelectedTab("healthy_taxes")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            selectedTab === "healthy_taxes" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <HeartPulse className="w-3.5 h-3.5" /> Impuestos Saludables ({DIAN_TAX_CATALOG.length})
                    </button>
                </div>
            </div>

            {/* TAB 1: TIPOS DE OPERACIÓN DIAN */}
            {selectedTab === "operations" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {DIAN_OPERATION_TYPES.map((op) => (
                        <div key={op.code} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-indigo-500/40 transition-all">
                            <div className="flex justify-between items-center">
                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono font-bold rounded-lg border border-indigo-500/30">
                                    Código DIAN: {op.code}
                                </span>
                                {op.requiresAiu && <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Requiere Base AIU</span>}
                                {op.requiresTrm && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Requiere TRM USD/EUR</span>}
                                {op.requiresConsortiumPercentage && <span className="text-[10px] font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">% Consorciados</span>}
                            </div>
                            <h4 className="font-bold text-white text-sm">{op.name}</h4>
                            <p className="text-slate-400 text-[11px]">{op.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 2: MEDIOS DE PAGO DIAN */}
            {selectedTab === "payments" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                    {DIAN_PAYMENT_METHODS.map((pm) => (
                        <div key={pm.code} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                            <span className="font-bold text-white">{pm.name}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-slate-900 text-teal-400 rounded-md border border-slate-700 font-sans font-semibold">
                                {pm.category}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 3: IMPUESTOS SALUDABLES & TRIBUTOS LEY 2277 */}
            {selectedTab === "healthy_taxes" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {DIAN_TAX_CATALOG.map((tax) => (
                        <div key={tax.code} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono font-bold rounded-lg border border-emerald-500/30">
                                    Tributo {tax.code}
                                </span>
                                {tax.rateDefault && <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md">Tarifa: {tax.rateDefault}%</span>}
                            </div>
                            <h4 className="font-bold text-white text-sm">{tax.name}</h4>
                            <p className="text-slate-400 text-[11px]">{tax.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
