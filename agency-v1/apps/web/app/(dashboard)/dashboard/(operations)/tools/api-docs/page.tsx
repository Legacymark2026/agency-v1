"use client";

import React, { useState } from "react";

export default function APIDocsPage() {
  const [apiKey, setApiKey] = useState("lm_live_pk_994827104928174091823749");
  const [selectedEndpoint, setSelectedEndpoint] = useState("GET /api/v1/leads");
  const [responseOutput, setResponseOutput] = useState<any>(null);

  const handleGenerateNewKey = () => {
    const newKey = `lm_live_pk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newKey);
    alert("Nueva clave API pública generada correctamente. Guárdala en un lugar seguro.");
  };

  const handleExecuteRequest = () => {
    if (selectedEndpoint.includes("leads")) {
      setResponseOutput({
        status: 200,
        data: [
          { id: "ld_001", name: "Empresa Colombia S.A.S.", status: "QUALIFIED", value: 4500000 },
          { id: "ld_002", name: "Inversiones Medellín", status: "NEW", value: 12000000 },
        ],
      });
    } else if (selectedEndpoint.includes("invoices")) {
      setResponseOutput({
        status: 201,
        message: "Factura borrador creada exitosamente",
        invoiceId: "inv_90182",
      });
    } else {
      setResponseOutput({
        status: 200,
        response: "El Agente de IA ha procesado la solicitud correctamente.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            Explorador Interactivo de API Pública (OpenAPI / Swagger)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Documentación interactiva de endpoints REST/gRPC y gestión de claves de acceso API de la plataforma.
          </p>
        </div>
        <button
          onClick={handleGenerateNewKey}
          className="px-4 py-2.5 bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-400 font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          🔑 Generar Nueva Clave API
        </button>
      </div>

      {/* API Key Banner */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl flex justify-between items-center text-xs">
        <div>
          <span className="text-slate-400 font-semibold">Tu Clave API Pública (Bearer Token):</span>
          <div className="font-mono text-cyan-300 font-bold mt-1 text-sm">{apiKey}</div>
        </div>
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-full border border-emerald-500/40">
          Límite: 300 req/min
        </span>
      </div>

      {/* Interactive Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Endpoint Selector */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Probar Endpoint REST</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Seleccionar Endpoint</label>
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 text-xs"
            >
              <option value="GET /api/v1/leads">GET /api/v1/leads — Listar clientes potenciales</option>
              <option value="POST /api/v1/invoices">POST /api/v1/invoices — Crear factura electrónica</option>
              <option value="POST /api/v1/ai/agent">POST /api/v1/ai/agent — Ejecutar Agente de IA</option>
            </select>
          </div>
          <button
            onClick={handleExecuteRequest}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            ▶️ Ejecutar Petición de Prueba
          </button>
        </div>

        {/* Console Response Output */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Respuesta JSON de la API</h2>
          {responseOutput ? (
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-mono overflow-x-auto">
              {JSON.stringify(responseOutput, null, 2)}
            </pre>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              Presiona "Ejecutar Petición" para inspeccionar la respuesta JSON devuelta por la API pública.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
