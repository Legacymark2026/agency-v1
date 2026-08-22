"use client";

import React, { useState } from "react";

export default function KanbanDashboardPage() {
  const [deals, setDeals] = useState<any[]>([
    { id: "d1", title: "Implementación ERP Colombia S.A.S.", value: 15000000, stage: "PROSPECION", client: "Empresa Colombia", prob: 40 },
    { id: "d2", title: "Licencia Anual 50 Agentes AI", value: 38000000, stage: "CALIFICADO", client: "Inversiones Bogotá", prob: 70 },
    { id: "d3", title: "Servicio de Automatización WhatsApp", value: 8500000, stage: "PROPUESTA", client: "Comercializadora Medellín", prob: 85 },
    { id: "d4", title: "Facturación Electrónica DIAN Enterprise", value: 12000000, stage: "CERRADO_GANADO", client: "Agencia Cali", prob: 100 },
  ]);

  const stages = [
    { key: "PROSPECION", name: "Prospección inicial", color: "border-cyan-500/40 text-cyan-400" },
    { key: "CALIFICADO", name: "Calificado por IA", color: "border-amber-500/40 text-amber-400" },
    { key: "PROPUESTA", name: "Propuesta enviada", color: "border-violet-500/40 text-violet-400" },
    { key: "CERRADO_GANADO", name: "Cerrado Ganado", color: "border-emerald-500/40 text-emerald-400" },
  ];

  const calculateStageTotal = (stageKey: string) => {
    return deals
      .filter((d) => d.stage === stageKey)
      .reduce((sum, d) => sum + d.value, 0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Tablero Kanban de Tratos & Embudos CRM
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestión visual de oportunidades comerciales, predicción de cierre y valor acumulado por etapa.
          </p>
        </div>
        <button
          onClick={() => {
            const title = prompt("Título del nuevo trato comercial:");
            if (title) {
              setDeals([
                ...deals,
                { id: `d_${Date.now()}`, title, value: 5000000, stage: "PROSPECION", client: "Nuevo Cliente", prob: 30 },
              ]);
            }
          }}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          ➕ Crear Nuevo Trato Comercial
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stages.map((stg) => {
          const stageDeals = deals.filter((d) => d.stage === stg.key);
          const stageTotal = calculateStageTotal(stg.key);

          return (
            <div key={stg.key} className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-4 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className={`text-xs font-extrabold uppercase tracking-wider ${stg.color}`}>{stg.name}</span>
                  <span className="px-2 py-0.5 bg-slate-950 text-slate-400 text-[10px] font-bold rounded-full border border-slate-800">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-400 mt-2">
                  Total: <span className="text-slate-100 font-extrabold">${stageTotal.toLocaleString()} COP</span>
                </div>

                {/* Deal Cards */}
                <div className="mt-4 space-y-3">
                  {stageDeals.map((d) => (
                    <div
                      key={d.id}
                      className="bg-slate-950/80 border border-slate-800 hover:border-teal-500/50 p-4 rounded-xl space-y-2 cursor-pointer transition-all hover:bg-slate-950"
                    >
                      <div className="text-xs font-bold text-slate-100">{d.title}</div>
                      <div className="text-[10px] text-slate-400">{d.client}</div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[10px]">
                        <span className="font-extrabold text-emerald-400">${d.value.toLocaleString()}</span>
                        <span className="text-amber-400 font-semibold">{d.prob}% Probabilidad</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
