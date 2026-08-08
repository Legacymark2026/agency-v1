"use client";

import React, { useState } from "react";
import { evaluateCommercialReadiness, DianSaaSCommercialConfig } from "@/lib/dian-commercialization-readiness";
import { ShieldCheck, Key, Server, Lock, Mail, CheckCircle2, AlertCircle, RefreshCw, FileText, Send, Sparkles, Building } from "lucide-react";
import { toast } from "sonner";

export function DianInvoicingSettings() {
    const [config, setConfig] = useState<DianSaaSCommercialConfig>({
        companyNit: "901345678",
        companyDv: "1",
        companyName: "LEGACYMARK S.A.S.",
        softwareId: "b8c3f4e1-7d9a-4e2b-8f1c-3a5d7e9f0b2a",
        softwarePin: "12345",
        technicalKey: "fc8eac422eba16e22ffd8c6f94b3f40a6e38112d7d06e23b2075a6e87a25032d8471a5c689d0f488f7b764b8a2135678",
        certificateP12Base64: "MIIGCgIBAzCCBcgGCSqGSIb3DQEHAaCCBbkEggW1MIIGsTCCBqAGCSqGSIb3DQEHA...",
        certificatePassword: "••••••••••••",
        testSetId: "fa82e1d0-9988-4433-bb22-110099887766",
        isProductionMode: false,
        smtpHost: "smtp.sendgrid.net",
        smtpUser: "facturacion@legacymark.com",
        smtpPass: "••••••••••••",
        isFullyEnabledForProduction: true,
    });

    const readiness = evaluateCommercialReadiness(config);

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Configuración Comercial de Facturación DIAN guardada con éxito.");
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                        <Building className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Configuración de Producción & Comercialización SaaS DIAN 🚀
                        </h3>
                        <p className="text-xs text-slate-400">
                            Parámetros del Proveedor Tecnológico, Firma Digital Certicámara, TestSetID y Envío de Correos.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                        config.isProductionMode
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}>
                        {config.isProductionMode ? "● Ambiente Producción DIAN" : "▲ Ambiente Habilitación / Pruebas"}
                    </span>
                </div>
            </div>

            {/* Readiness Score Card */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Estado de Listo para Comercializar</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${readiness.isReadyForCommercialUse ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                            {readiness.isReadyForCommercialUse ? "LISTO PARA PRODUCCIÓN SAAS" : "REQUIERE CONFIGURACIÓN"}
                        </span>
                    </div>
                    <p className="text-xs text-slate-300">
                        Cumplimiento de requisitos técnicos y legales ante la DIAN para emisión síncrona.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="text-2xl font-black text-emerald-400 font-mono">{readiness.score}%</span>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Puntaje Habilitación</span>
                    </div>

                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 text-emerald-400">
                        <Sparkles className="w-8 h-8" />
                    </div>
                </div>
            </div>

            {/* Readiness Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {readiness.checks.map(c => (
                    <div key={c.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
                        {c.status === "PASSED" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                            <span className="font-bold text-white block">{c.title}</span>
                            <span className="text-slate-400 text-[11px] block mt-0.5">{c.description}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Form */}
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                        <Key className="w-4 h-4" /> Credenciales de Software DIAN (MUISC A)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="font-bold text-slate-300">Software ID (UUID registado en la DIAN) *</label>
                            <input
                                type="text" required
                                value={config.softwareId} onChange={e => setConfig({ ...config, softwareId: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-teal-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="font-bold text-slate-300">Software PIN *</label>
                            <input
                                type="password" required
                                value={config.softwarePin} onChange={e => setConfig({ ...config, softwarePin: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-teal-500"
                            />
                        </div>

                        <div className="space-y-1 col-span-2">
                            <label className="font-bold text-slate-300">Clave Técnica DIAN SHA-384 (64 caracteres Hex) *</label>
                            <input
                                type="text" required
                                value={config.technicalKey} onChange={e => setConfig({ ...config, technicalKey: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono outline-none focus:border-teal-500"
                            />
                        </div>

                        <div className="space-y-1 col-span-2">
                            <label className="font-bold text-slate-300">ID del Set de Pruebas (TestSetID Habilitación)</label>
                            <input
                                type="text" placeholder="fa82e1d0-9988-4433-bb22-110099887766"
                                value={config.testSetId} onChange={e => setConfig({ ...config, testSetId: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-indigo-400 font-mono outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                        <Lock className="w-4 h-4" /> Certificado Digital X.509 (Firma XAdES-BES)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1 col-span-2">
                            <label className="font-bold text-slate-300">Archivo Certificado Digital (.p12 / .pfx Base64)</label>
                            <textarea
                                rows={2}
                                value={config.certificateP12Base64} onChange={e => setConfig({ ...config, certificateP12Base64: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-400 font-mono text-[10px] outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="font-bold text-slate-300">Contraseña del Certificado Digital</label>
                            <input
                                type="password"
                                value={config.certificatePassword} onChange={e => setConfig({ ...config, certificatePassword: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="font-bold text-slate-300">Cambiar Ambiente de Operación</label>
                            <select
                                value={config.isProductionMode ? "PROD" : "HAB"}
                                onChange={e => setConfig({ ...config, isProductionMode: e.target.value === "PROD" })}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-indigo-500"
                            >
                                <option value="HAB">▲ Ambiente Habilitación / Pruebas (VPFE DIAN)</option>
                                <option value="PROD">● Ambiente Producción Oficial DIAN</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="submit"
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                    >
                        <ShieldCheck className="w-5 h-5" /> Guardar Configuración de Comercialización DIAN
                    </button>
                </div>
            </form>
        </div>
    );
}
