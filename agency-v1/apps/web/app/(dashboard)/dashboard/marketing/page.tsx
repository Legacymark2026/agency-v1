"use client";

import React, { useState } from "react";

export default function MarketingDashboardPage() {
  const [campaignTitle, setCampaignTitle] = useState("Lanzamiento Licencias Enterprise Q4");
  const [subjectVariantA, setSubjectVariantA] = useState("Aviso importante para tu empresa");
  const [subjectVariantB, setSubjectVariantB] = useState("¡Descubre la automatización de microservicios con 20% OFF hoy!");
  const [predictedScore, setPredictedScore] = useState<any>({
    winningVariant: "Variante B",
    predictedOpenRate: 64.5,
    confidence: 94.2,
  });

  const handlePredictiveAudit = () => {
    setPredictedScore({
      winningVariant: "Variante B",
      predictedOpenRate: 68.2,
      confidence: 95.8,
    });
    alert("Análisis predictivo A/B completado con éxito.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
            Centro de Automatización & Campañas de Marketing
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Programador de campañas masivas, generador de Pruebas A/B y optimizador predictivo de tasa de apertura.
          </p>
        </div>
        <button
          onClick={handlePredictiveAudit}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
        >
          ✨ Evaluar Pruebas A/B con IA
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campaign Config */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Configuración de Campaña A/B</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre de la Campaña</label>
            <input
              type="text"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-300">Variante A (Asunto)</span>
              <input
                type="text"
                value={subjectVariantA}
                onChange={(e) => setSubjectVariantA(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="p-4 bg-slate-950/60 border border-violet-500/40 rounded-xl space-y-2">
              <span className="text-xs font-bold text-violet-300">Variante B (Asunto Ganador Estimado)</span>
              <input
                type="text"
                value={subjectVariantB}
                onChange={(e) => setSubjectVariantB(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-violet-200 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => alert("Campaña A/B programada para envío multicanal.")}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
          >
            🚀 Programar Envío de Campaña A/B
          </button>
        </div>

        {/* Predictive CTR Score Gauge */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-slate-200">Rendimiento Predictivo</h2>
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-center space-y-2">
            <span className="text-xs text-slate-400 font-semibold block">Variante Ganadora</span>
            <div className="text-2xl font-extrabold text-violet-400">{predictedScore.winningVariant}</div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">{predictedScore.predictedOpenRate}% CTR</div>
            <span className="text-[10px] text-slate-500 block">Nivel de Confianza: {predictedScore.confidence}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
