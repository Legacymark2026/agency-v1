"use client";

import React, { useState } from "react";
import { vectorSearchService } from "../../../../../../services/ai-engine/src/services/vector-search.service";
import { cronSchedulerService } from "../../../../../../services/automation-service/src/services/cron-scheduler.service";
import { envelopeCrypto } from "../../../../../../services/auth-service/src/services/crypto-rotator.service";
import { piiSanitizer } from "../../../../../../services/crm-service/src/services/pii-sanitizer.service";
import { featureFlagService } from "../../../../../../services/admin-service/src/services/feature-flag.service";
import { verifyCustomDomainCNAME } from "../../../../../../services/integration-service/src/services/cname-verifier.service";

export default function MasterToolsHubPage() {
  const [activeTab, setActiveTab] = useState<"RAG" | "CRON" | "CRYPTO" | "PII" | "FLAGS" | "CNAME">("RAG");

  // RAG Search State
  const [ragQuery, setRagQuery] = useState("facturación electrónica DIAN Colombia");
  const [ragResults, setRagResults] = useState<any[]>([]);

  // Cron State
  const [cronJobName, setCronJobName] = useState("Proceso de Nómina Quincenal");
  const [cronExpr, setCronExpr] = useState("0 0 15,30 * *");
  const [cronJobs, setCronJobs] = useState<any[]>(cronSchedulerService.listCronJobs());

  // Crypto State
  const [secretText, setSecretText] = useState("ClaveSecretaBanco12345");
  const [encryptedData, setEncryptedData] = useState<any>(null);

  // PII State
  const [piiInput, setPiiInput] = useState("Contacto: Carlos Mendoza, email: carlos@empresa.com, teléfono: 3153981340, tarjeta: 4532-1234-5678-9012");
  const [sanitizedResult, setSanitizedResult] = useState<string>("");

  // Feature Flags State
  const [flags, setFlags] = useState<any[]>(featureFlagService.listFlags());

  // CNAME State
  const [customDomainInput, setCustomDomainInput] = useState("agencia.miempresa.com");
  const [cnameResult, setCnameResult] = useState<any>(null);

  // Handlers
  const handleRunRagSearch = () => {
    // Seed initial docs if empty
    if (vectorSearchService.listDocuments().length === 0) {
      vectorSearchService.upsertDocument({ id: "doc_1", content: "Guía completa de Facturación Electrónica DIAN y UBL 2.1" });
      vectorSearchService.upsertDocument({ id: "doc_2", content: "Manual de integración de pasarela de pagos Wompi y Stripe" });
    }
    const results = vectorSearchService.searchSimilar(ragQuery, 3);
    setRagResults(results);
  };

  const handleCreateCron = () => {
    const job = cronSchedulerService.scheduleCronJob({ name: cronJobName, cronExpression: cronExpr, targetService: "automation-service" });
    setCronJobs(cronSchedulerService.listCronJobs());
    alert(`Tarea Cron '${job.name}' programada exitosamente.`);
  };

  const handleEncryptText = () => {
    const enc = envelopeCrypto.encryptData(secretText);
    setEncryptedData(enc);
  };

  const handleSanitizeText = () => {
    const clean = piiSanitizer.sanitizePIIData(piiInput);
    setSanitizedResult(clean);
  };

  const handleToggleFlag = (key: string) => {
    const current = featureFlagService.isFeatureEnabled(key);
    featureFlagService.setFlag(key, !current);
    setFlags(featureFlagService.listFlags());
  };

  const handleVerifyCname = () => {
    const res = verifyCustomDomainCNAME(customDomainInput);
    setCnameResult(res);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
          Consola Maestra de Herramientas Enterprise (Backend Hub)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Acceso directo a las 6 herramientas avanzadas de microservicios expuestas en el frontend.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { key: "RAG", name: "🧠 RAG Vector Search", desc: "ai-engine" },
          { key: "CRON", name: "⏱️ Tareas Cron", desc: "automation-service" },
          { key: "CRYPTO", name: "🔒 Bóveda Criptográfica", desc: "auth-service" },
          { key: "PII", name: "🛡️ Sanitizador PII", desc: "crm-service" },
          { key: "FLAGS", name: "🚩 Feature Flags", desc: "admin-service" },
          { key: "CNAME", name: "🌐 Dominios CNAME", desc: "integration-service" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === t.key
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            <div>{t.name}</div>
            <div className="text-[9px] opacity-75 font-mono">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
        {activeTab === "RAG" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Búsqueda Vectorial RAG & Embeddings</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
              />
              <button onClick={handleRunRagSearch} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl">
                🔍 Buscar Similitud Coseno
              </button>
            </div>
            {ragResults.length > 0 && (
              <div className="space-y-2 pt-2">
                {ragResults.map((r, i) => (
                  <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                    <span className="text-emerald-400 font-bold">Similitud: {(r.similarityScore * 100).toFixed(1)}%</span>
                    <p className="text-slate-200 mt-1">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "CRON" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Programador de Tareas Cron Distribuidas</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={cronJobName}
                onChange={(e) => setCronJobName(e.target.value)}
                placeholder="Nombre de tarea..."
                className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
              />
              <input
                type="text"
                value={cronExpr}
                onChange={(e) => setCronExpr(e.target.value)}
                placeholder="Expresión Cron (ej. 0 0 15,30 * *)..."
                className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono"
              />
            </div>
            <button onClick={handleCreateCron} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl">
              ⏱️ Programar Tarea Cron
            </button>
          </div>
        )}

        {activeTab === "CRYPTO" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Bóveda Criptográfica & Cifrado AES-256-GCM</h2>
            <input
              type="text"
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono"
            />
            <button onClick={handleEncryptText} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl">
              🔒 Cifrar Dato con Envelope Encryption
            </button>
            {encryptedData && (
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-mono overflow-x-auto">
                {JSON.stringify(encryptedData, null, 2)}
              </pre>
            )}
          </div>
        )}

        {activeTab === "PII" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Sanitizador y Redactor PII GDPR</h2>
            <textarea
              rows={3}
              value={piiInput}
              onChange={(e) => setPiiInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
            />
            <button onClick={handleSanitizeText} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl">
              🛡️ Redactar Datos Sensibles
            </button>
            {sanitizedResult && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-300 font-mono">
                {sanitizedResult}
              </div>
            )}
          </div>
        )}

        {activeTab === "FLAGS" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Gestor de Feature Flags e Inquilinos</h2>
            <div className="space-y-2">
              {flags.map((f) => (
                <div key={f.key} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-200">{f.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono block">{f.key}</span>
                  </div>
                  <button
                    onClick={() => handleToggleFlag(f.key)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${
                      f.enabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    }`}
                  >
                    {f.enabled ? "ACTIVADO" : "DESACTIVADO"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "CNAME" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Verificador CNAME de Dominios Marca Blanca</h2>
            <input
              type="text"
              value={customDomainInput}
              onChange={(e) => setCustomDomainInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono"
            />
            <button onClick={handleVerifyCname} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl">
              🌐 Validar Registro DNS CNAME
            </button>
            {cnameResult && (
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-cyan-300 font-mono overflow-x-auto">
                {JSON.stringify(cnameResult, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
