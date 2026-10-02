"use client";

import React, { useState } from "react";

export default function FraudGuardPage() {
  const [testAmount, setTestAmount] = useState("15000000");
  const [testNit, setTestNit] = useState("900.849.201-4");
  const [riskResult, setRiskResult] = useState<any>({
    isAnomalous: true,
    riskScore: 92,
    riskLevel: "CRITICAL",
    riskReason: "Monto atípico muy elevado ($15,000,000) requiere aprobación de doble factor corporativo.",
    zScore: 4.1,
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(testAmount) || 0;
    if (amt > 10000000) {
      setRiskResult({
        isAnomalous: true,
        riskScore: 92,
        riskLevel: "CRITICAL",
        riskReason: `Monto atípico muy elevado ($${amt.toLocaleString()}) requiere aprobación de doble factor corporativo.`,
        zScore: 4.1,
      });
    } else {
      setRiskResult({
        isAnomalous: false,
        riskScore: 12,
        riskLevel: "LOW",
        riskReason: "Transacción dentro de los parámetros habituales.",
        zScore: 0.4,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
          Guardián de Anomalías y Fraude Financiero (AI Guard)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Protección en tiempo real contra duplicados, transacciones atípicas y montos sospechosos mediante puntuación Z-Score.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Interactive Form */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Simulador de Evaluación de Riesgo</h2>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Monto de Transacción ($)</label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">NIT Proveedor / Cliente</label>
              <input
                type="text"
                value={testNit}
                onChange={(e) => setTestNit(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
            >
              🔍 Analizar Riesgo con IA
            </button>
          </form>
        </div>

        {/* Risk Score Widget */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-200">Resultado de Análisis de Riesgo</h2>
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wider ${
                riskResult.riskLevel === "CRITICAL" || riskResult.riskLevel === "HIGH"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              }`}
            >
              NIVEL: {riskResult.riskLevel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs font-semibold">Puntaje de Riesgo (0-100)</span>
              <div className="text-3xl font-extrabold text-rose-400 mt-1">{riskResult.riskScore} / 100</div>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs font-semibold">Z-Score Estadístico</span>
              <div className="text-3xl font-extrabold text-amber-400 mt-1">{riskResult.zScore} SD</div>
            </div>
          </div>

          <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl text-sm text-rose-300">
            <strong>Motivo de Alerta:</strong> {riskResult.riskReason}
          </div>
        </div>
      </div>
    </div>
  );
}
