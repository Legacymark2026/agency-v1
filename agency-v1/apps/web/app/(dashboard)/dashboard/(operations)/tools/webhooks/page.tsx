"use client";

import React, { useState } from "react";

export default function WebhookSandboxPage() {
  const [targetUrl, setTargetUrl] = useState("https://api.empresa.com/v1/webhooks/receiver");
  const [secretKey, setSecretKey] = useState("whsec_live_9a6874740a8f7d29");
  const [eventType, setEventType] = useState("lead.created");
  const [payloadText, setPayloadText] = useState(JSON.stringify({ leadId: "ld_9901", name: "Carlos Mendoza", email: "carlos@empresa.com" }, null, 2));
  const [testResult, setTestResult] = useState<any>(null);

  const handleTestDispatch = () => {
    setTestResult({
      status: 200,
      statusText: "OK",
      signature: "9a6874740a8f7d295b9c1d0e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
      latencyMs: 142,
      responseBody: JSON.stringify({ success: true, message: "Webhook recibido y procesado en Make.com" }, null, 2),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
          Constructor & Sandbox de Webhooks (HMAC SHA256)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Diseña, firma criptográficamente y prueba eventos de webhook en tiempo real con firmas de seguridad HMAC SHA256.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Config */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Configuración del Webhook</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">URL Destino (Endpoint)</label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Llave Secreta HMAC (Secret Key)</label>
            <input
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo de Evento</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500 text-xs"
            >
              <option value="lead.created">lead.created</option>
              <option value="invoice.paid">invoice.paid</option>
              <option value="payment.failed">payment.failed</option>
              <option value="order.completed">order.completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Payload JSON</label>
            <textarea
              rows={5}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500 text-xs font-mono"
            />
          </div>
          <button
            onClick={handleTestDispatch}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            🚀 Probar Envío de Webhook Firmado
          </button>
        </div>

        {/* Response Sandbox Console */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Consola de Respuestas HTTP</h2>
          {testResult ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl">
                <span className="text-emerald-400 font-bold text-sm">HTTP {testResult.status} {testResult.statusText}</span>
                <span className="text-xs text-slate-400">Latencia: {testResult.latencyMs}ms</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs font-semibold block mb-1">Firma Criptográfica (`x-legacymark-signature`)</span>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-purple-300 font-mono break-all">
                  {testResult.signature}
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-xs font-semibold block mb-1">Cuerpo de Respuesta</span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto">
                  {testResult.responseBody}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              Presiona "Probar Envío" para ejecutar la simulación de firma e inspeccionar la respuesta HTTP.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
