"use client";

import React, { useState } from "react";
import {
    Calculator, ShieldCheck, AlertCircle, CheckCircle2,
    DollarSign, HelpCircle, Layers, FileText, Info
} from "lucide-react";
import {
    calculateColombianWithholding,
    COLOMBIAN_WITHHOLDING_RULES,
    ColombianTransactionType,
    ColombianTaxRegime,
    CompanyAgentStatus,
    BuyerTaxStatus,
    UVT_VALUE_2026
} from "@/lib/dian-withholding-engine";

export function DianWithholdingCalculator() {
    // 1. ESTADO DE AGENTE RETENEDOR (EMPRESA)
    const [isWithholdingAgent, setIsWithholdingAgent] = useState(true);
    const [isGranContribuyente, setIsGranContribuyente] = useState(true);
    const [isAutorretenedor, setIsAutorretenedor] = useState(false);

    // 2. TIPO DE TRANSACCIÓN & RÉGIMEN CLIENTE
    const [transactionType, setTransactionType] = useState<ColombianTransactionType>("COMPRAS_GENERALES_DECLARANTE");
    const [buyerTaxRegime, setBuyerTaxRegime] = useState<ColombianTaxRegime>("PERSONA_JURIDICA_DECLARANTE");

    // 3. MONTOS DE SIMULACIÓN
    const [baseSubtotalInput, setBaseSubtotalInput] = useState("1500000");
    const [ivaPctInput, setIvaPctInput] = useState("19");
    const [reteIcaRateInput, setReteIcaRateInput] = useState("4.14");

    const baseSubtotal = parseFloat(baseSubtotalInput) || 0;
    const ivaPct = parseFloat(ivaPctInput) || 0;
    const ivaAmount = baseSubtotal * (ivaPct / 100);
    const reteIcaRate = parseFloat(reteIcaRateInput) || 4.14;

    const companyStatus: CompanyAgentStatus = {
        isWithholdingAgent,
        isGranContribuyente,
        isAutorretenedor,
        isRegimenSimple: false,
    };

    const buyerStatus: BuyerTaxStatus = {
        taxRegime: buyerTaxRegime,
        isDeclarante: buyerTaxRegime === "PERSONA_JURIDICA_DECLARANTE" || buyerTaxRegime === "PERSONA_NATURAL_DECLARANTE" || buyerTaxRegime === "GRAN_CONTRIBUYENTE",
        isAutorretenedor: buyerTaxRegime === "AUTORRETENEDOR",
        isRegimenSimple: buyerTaxRegime === "REGIMEN_SIMPLE_RST",
    };

    const result = calculateColombianWithholding(
        baseSubtotal,
        ivaAmount,
        companyStatus,
        buyerStatus,
        transactionType,
        reteIcaRate
    );

    const activeRule = COLOMBIAN_WITHHOLDING_RULES[transactionType];

    const fmtCOP = (val: number) => {
        return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl text-slate-100">
            {/* ENCABEZADO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                        <Calculator className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            Motor de Retención en la Fuente DIAN 2026
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                UVT = ${UVT_VALUE_2026.toLocaleString("es-CO")} COP
                            </span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            Validación de Agente Retenedor, Régimen del Cliente, Umbral de UVT y Tarifas según Estatuto Tributario
                        </p>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 1: VALIDACIÓN AGENTE RETENEDOR DE LA EMPRESA */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    1. Condición de la Empresa Emisora (Agente Retenedor ET Art. 368)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isWithholdingAgent ? "bg-indigo-950/60 border-indigo-500/50 text-indigo-200" : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}>
                        <div className="space-y-0.5">
                            <span className="font-bold text-xs block text-white">Agente Retenedor</span>
                            <span className="text-[10.5px] text-slate-400 block">Obligado por Art. 368 ET</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={isWithholdingAgent}
                            onChange={(e) => setIsWithholdingAgent(e.target.checked)}
                            className="w-4 h-4 accent-indigo-500"
                        />
                    </label>

                    <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isGranContribuyente ? "bg-teal-950/60 border-teal-500/50 text-teal-200" : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}>
                        <div className="space-y-0.5">
                            <span className="font-bold text-xs block text-white">Gran Contribuyente</span>
                            <span className="text-[10.5px] text-slate-400 block">Resolución O-13 DIAN</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={isGranContribuyente}
                            onChange={(e) => setIsGranContribuyente(e.target.checked)}
                            className="w-4 h-4 accent-teal-500"
                        />
                    </label>

                    <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isAutorretenedor ? "bg-amber-950/60 border-amber-500/50 text-amber-200" : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}>
                        <div className="space-y-0.5">
                            <span className="font-bold text-xs block text-white">Autorretenedor</span>
                            <span className="text-[10.5px] text-slate-400 block">Resolución O-15 DIAN</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={isAutorretenedor}
                            onChange={(e) => setIsAutorretenedor(e.target.checked)}
                            className="w-4 h-4 accent-amber-500"
                        />
                    </label>
                </div>
            </div>

            {/* SECCIÓN 2: TIPO DE TRANSACCIÓN Y RÉGIMEN TRIBUTARIO CLIENTE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* PARÁMETRO TRANSACCIÓN */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        Tipo de Concepto / Transacción DIAN
                    </label>
                    <select
                        value={transactionType}
                        onChange={(e) => setTransactionType(e.target.value as ColombianTransactionType)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500 font-semibold"
                    >
                        {Object.values(COLOMBIAN_WITHHOLDING_RULES).map((rule) => (
                            <option key={rule.code} value={rule.code}>
                                {rule.label} (Base Mín: {rule.minBaseUvt} UVT)
                            </option>
                        ))}
                    </select>
                    <p className="text-[10.5px] text-slate-400 italic">
                        {activeRule.description}
                    </p>
                </div>

                {/* PARÁMETRO RÉGIMEN CLIENTE */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        Régimen Tributario del Cliente (Adquiriente)
                    </label>
                    <select
                        value={buyerTaxRegime}
                        onChange={(e) => setBuyerTaxRegime(e.target.value as ColombianTaxRegime)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500 font-semibold"
                    >
                        <option value="PERSONA_JURIDICA_DECLARANTE">Persona Jurídica (Declarante de Renta)</option>
                        <option value="PERSONA_NATURAL_DECLARANTE">Persona Natural (Declarante de Renta)</option>
                        <option value="PERSONA_NATURAL_NO_DECLARANTE">Persona Natural (No Declarante)</option>
                        <option value="REGIMEN_SIMPLE_RST">Régimen Simple de Tributación (RST - Ley 2277)</option>
                        <option value="AUTORRETENEDOR">Autorretenedor DIAN (O-15)</option>
                        <option value="GRAN_CONTRIBUYENTE">Gran Contribuyente (O-13)</option>
                    </select>
                    <p className="text-[10.5px] text-slate-400 italic">
                        {buyerTaxRegime === "REGIMEN_SIMPLE_RST"
                            ? "Exento de Retefuente según Art. 911 ET (Ley de Reforma Tributaria 2277 de 2022)."
                            : buyerTaxRegime === "AUTORRETENEDOR"
                            ? "Exento de Retefuente: El cliente practica su propia autorretención."
                            : "Sujeto a Retefuente según condición de declarante."}
                    </p>
                </div>
            </div>

            {/* SECCIÓN 3: MONTOS Y SIMULADOR DE CÁLCULO */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-teal-400" />
                    3. Simulación de Valores de la Factura
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Base Subtotal ($ COP)</label>
                        <input
                            type="number"
                            value={baseSubtotalInput}
                            onChange={(e) => setBaseSubtotalInput(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold outline-none focus:border-teal-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Tasa IVA (%)</label>
                        <select
                            value={ivaPctInput}
                            onChange={(e) => setIvaPctInput(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                        >
                            <option value="19">19% (Tarifa General)</option>
                            <option value="5">5% (Tarifa Reducida)</option>
                            <option value="0">0% (Exento / Excluido)</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Tarifa ReteICA (x 1.000)</label>
                        <input
                            type="text"
                            value={reteIcaRateInput}
                            onChange={(e) => setReteIcaRateInput(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono outline-none focus:border-teal-500"
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 4: RESULTADO Y TARJETA DE AUDITORÍA */}
            <div className={`p-6 rounded-2xl border transition-all space-y-4 ${
                result.meetsMinThreshold && result.withholdingAmount > 0
                    ? "bg-indigo-950/40 border-indigo-500/40"
                    : "bg-slate-950 border-slate-800"
            }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2 font-bold text-sm">
                        {result.meetsMinThreshold && result.withholdingAmount > 0 ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                        )}
                        <span>
                            {result.meetsMinThreshold && result.withholdingAmount > 0
                                ? "Retención en la Fuente Aplicada Correctamente"
                                : "Transacción Exenta o No Alcanza Cuantía Mínima"}
                        </span>
                    </div>

                    <div className="font-mono text-xs text-slate-400">
                        Umbral Requerido: <span className="font-bold text-white">{activeRule.minBaseUvt} UVT</span> ({fmtCOP(result.uvtBaseThresholdCop)})
                    </div>
                </div>

                {result.exemptionReason ? (
                    <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        <span>{result.exemptionReason}</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                            <span className="text-[10.5px] text-slate-400 block font-sans font-semibold">Base Subtotal</span>
                            <span className="font-bold text-white text-sm">{fmtCOP(result.baseSubtotal)}</span>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                            <span className="text-[10.5px] text-slate-400 block font-sans font-semibold">
                                Retefuente ({result.appliedRatePct}%)
                            </span>
                            <span className="font-bold text-emerald-400 text-sm">-${fmtCOP(result.withholdingAmount)}</span>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                            <span className="text-[10.5px] text-slate-400 block font-sans font-semibold">
                                ReteICA ({reteIcaRate} / 1.000)
                            </span>
                            <span className="font-bold text-emerald-300 text-sm">-${fmtCOP(result.reteIcaAmount)}</span>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-indigo-500/40 bg-indigo-950/20">
                            <span className="text-[10.5px] text-indigo-300 block font-sans font-bold">Total a Pagar Neto</span>
                            <span className="font-black text-indigo-400 text-base">{fmtCOP(result.netPayableAmount)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
