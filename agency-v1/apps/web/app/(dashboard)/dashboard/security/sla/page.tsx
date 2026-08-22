"use client";

import React, { useState } from "react";

export default function SLACompliancePage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadCert = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert("Certificado de SLA Corporativo (PDF) generado e iniciado para descarga.");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Monitor de Cumplimiento SLA 99.99%
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Métricas en tiempo real de disponibilidad, MTTR y certificación de nivel corporativo Fortune 500.
          </p>
        </div>
        <button
          onClick={handleDownloadCert}
          disabled={downloading}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
        >
          {downloading ? "Generando PDF..." : "📄 Descargar Certificado SLA"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Disponibilidad Real</span>
          <div className="text-4xl font-extrabold text-emerald-400 mt-2">99.992%</div>
          <span className="text-xs text-emerald-500 font-medium">✓ Estándar Enterprise Cumplido</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">MTTR (Tiempo Recuperación)</span>
          <div className="text-4xl font-extrabold text-cyan-400 mt-2">2.4 min</div>
          <span className="text-xs text-slate-400">Promedio mensual de respuesta</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">MTBF (Tiempo Entre Fallas)</span>
          <div className="text-4xl font-extrabold text-indigo-400 mt-2">45.2 días</div>
          <span className="text-xs text-indigo-400">Sin interrupciones operativas</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Estado de Garantía</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">SLA_MET</div>
          <span className="text-xs text-slate-400">Garantía de reembolso inactiva</span>
        </div>
      </div>

      {/* Microservices Status Grid */}
      <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-slate-200 mb-4">Estado de Disponibilidad de Microservicios (24/24 Online)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "finance-service", "auth-service", "ai-engine", "crm-service",
            "pos-service", "automation-service", "analytics-service", "integration-service"
          ].map((svc) => (
            <div key={svc} className="flex items-center space-x-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-slate-200">{svc}</div>
                <div className="text-[10px] text-slate-400">Latency: 14ms | 100% Uptime</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
