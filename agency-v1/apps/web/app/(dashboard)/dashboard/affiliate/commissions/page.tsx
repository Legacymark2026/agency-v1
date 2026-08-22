"use client";

import React from "react";

export default function AffiliateCommissionsPage() {
  const commissions = [
    { id: "sale_901", client: "Agencia Creativa S.A.S.", amount: 1500000, tier1: 300000, tier2: 75000, date: "2026-08-22", status: "LIQUIDADO" },
    { id: "sale_898", client: "Inversiones Bogotá LTDA", amount: 2800000, tier1: 560000, tier2: 140000, date: "2026-08-21", status: "LIQUIDADO" },
    { id: "sale_894", client: "Soluciones Tech Colombia", amount: 950000, tier1: 190000, tier2: 47500, date: "2026-08-20", status: "PENDIENTE" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
          Centro de Comisiones Multinivel de Afiliados
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Desglose de comisiones de Venta Directa (Tier 1: 20%) y Red de Referidos (Tier 2: 5%).
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Comisiones Tier 1 (Directas 20%)</span>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">$1,050,000 COP</div>
          <span className="text-xs text-amber-500 font-medium">3 ventas referidas este mes</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Comisiones Tier 2 (Red 5%)</span>
          <div className="text-3xl font-extrabold text-orange-400 mt-2">$262,500 COP</div>
          <span className="text-xs text-orange-500 font-medium">Generadas por afiliados secundarios</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Total Acumulado Listo para Retiro</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">$1,312,500 COP</div>
          <button
            onClick={() => alert("Solicitud de pago enviada para procesamiento bancario.")}
            className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
          >
            💸 Solicitar Pago a Cuenta
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-slate-200">Historial de Ventas y Liquidaciones</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-3">ID Venta</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Monto Venta</th>
                <th className="p-3">Comisión Tier 1 (20%)</th>
                <th className="p-3">Comisión Tier 2 (5%)</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-b border-slate-800/60 hover:bg-slate-950/40">
                  <td className="p-3 font-mono text-slate-400">{c.id}</td>
                  <td className="p-3 font-bold text-slate-200">{c.client}</td>
                  <td className="p-3 text-slate-300">${c.amount.toLocaleString()}</td>
                  <td className="p-3 text-amber-400 font-bold">${c.tier1.toLocaleString()}</td>
                  <td className="p-3 text-orange-400 font-bold">${c.tier2.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${c.status === "LIQUIDADO" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {c.status}
                    </span>
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
