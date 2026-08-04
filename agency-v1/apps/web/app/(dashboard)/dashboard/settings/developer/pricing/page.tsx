"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sliders, Save, RefreshCw, CheckCircle2, AlertTriangle, ArrowLeft, DollarSign, ShieldAlert, Cpu, Video, FileText, Globe } from "lucide-react";
import { toast } from "sonner";

export default function AdminApiPricingPage() {
    const [pricing, setPricing] = useState<Record<string, { unitType: string; costPerUnitUsd: number }>>({
        "/api/v1/agents":  { unitType: "TOKENS", costPerUnitUsd: 0.0000025 },
        "/api/v1/video":   { unitType: "SECONDS", costPerUnitUsd: 0.05 },
        "/api/v1/invoices": { unitType: "DOCUMENTS", costPerUnitUsd: 0.08 },
        "default":         { unitType: "REQUESTS", costPerUnitUsd: 0.0005 },
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadPricing = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/v1/admin/pricing").then(r => r.json());
            if (res.success && res.pricing) {
                setPricing(res.pricing);
            }
        } catch {
            toast.error("Error al cargar configuración de tarifario");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPricing(); }, []);

    const handlePriceChange = (key: string, newCost: number) => {
        setPricing(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                costPerUnitUsd: newCost
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        const tid = toast.loading("Guardando tarifario y propagando a Redis Stream Gateway...");
        try {
            const res = await fetch("/api/v1/admin/pricing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pricing })
            }).then(r => r.json());

            if (res.success) {
                toast.success("¡Tarifario actualizado en tiempo real sin reiniciar microservicios!", { id: tid });
            } else {
                toast.error(res.error || "Error al actualizar tarifario", { id: tid });
            }
        } catch {
            toast.error("Error de conexión", { id: tid });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard/settings/developer" className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-mono mb-2">
                        <ArrowLeft className="w-3.5 h-3.5" /> Volver a Developer Console
                    </Link>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                        <Sliders className="w-6 h-6 text-teal-400" /> Panel Administrador · Configuración de Tarifas & Parámetros API
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Ajusta en tiempo real los costos por unidad en USD y límites de metering para todos los microservicios.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
                >
                    <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar Tarifario"}
                </button>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* 1. Agentes IA */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-500/10 rounded-lg"><Cpu className="w-4 h-4 text-teal-400" /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Motor Cognitivo & Agentes IA</h3>
                                <p className="text-xs text-slate-500">Ruta: <code className="text-teal-300 font-mono">/api/v1/agents/*</code></p>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 font-mono">TOKENS</span>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 mb-1.5 block">Costo por Token LLM (USD)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
                            <input
                                type="number" step="0.0000001" min="0"
                                value={pricing["/api/v1/agents"]?.costPerUnitUsd || 0.0000025}
                                onChange={e => handlePriceChange("/api/v1/agents", Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-teal-500"
                            />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Equivalente a <strong className="text-teal-400">${((pricing["/api/v1/agents"]?.costPerUnitUsd || 0.0000025) * 1000).toFixed(4)} USD</strong> por cada 1,000 tokens.</p>
                    </div>
                </div>

                {/* 2. Renderizado de Video */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-500/10 rounded-lg"><Video className="w-4 h-4 text-violet-400" /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Video Engine (VPS Render)</h3>
                                <p className="text-xs text-slate-500">Ruta: <code className="text-violet-300 font-mono">/api/v1/video/*</code></p>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 font-mono">SECONDS</span>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 mb-1.5 block">Costo por Segundo de Renderizado (USD)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
                            <input
                                type="number" step="0.001" min="0"
                                value={pricing["/api/v1/video"]?.costPerUnitUsd || 0.05}
                                onChange={e => handlePriceChange("/api/v1/video", Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-teal-500"
                            />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Un video de 60 segundos costará <strong className="text-violet-400">${((pricing["/api/v1/video"]?.costPerUnitUsd || 0.05) * 60).toFixed(2)} USD</strong>.</p>
                    </div>
                </div>

                {/* 3. Facturación Electrónica DIAN */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg"><FileText className="w-4 h-4 text-blue-400" /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Facturación Electrónica DIAN</h3>
                                <p className="text-xs text-slate-500">Ruta: <code className="text-blue-300 font-mono">/api/v1/invoices</code></p>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 font-mono">DOCUMENTS</span>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 mb-1.5 block">Costo por Documento / Factura Emitida (USD)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
                            <input
                                type="number" step="0.005" min="0"
                                value={pricing["/api/v1/invoices"]?.costPerUnitUsd || 0.08}
                                onChange={e => handlePriceChange("/api/v1/invoices", Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-teal-500"
                            />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Emisión e integración con servicios de la DIAN.</p>
                    </div>
                </div>

                {/* 4. Core REST (Peticiones Estándar) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg"><Globe className="w-4 h-4 text-amber-400" /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Core REST API (CRM, POS, Leads)</h3>
                                <p className="text-xs text-slate-500">Ruta por defecto: <code className="text-amber-300 font-mono">default</code></p>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 font-mono">REQUESTS</span>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 mb-1.5 block">Costo por Petición HTTP Standard (USD)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
                            <input
                                type="number" step="0.0001" min="0"
                                value={pricing["default"]?.costPerUnitUsd || 0.0005}
                                onChange={e => handlePriceChange("default", Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-teal-500"
                            />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">1,000 peticiones estándar costarán <strong className="text-amber-400">${((pricing["default"]?.costPerUnitUsd || 0.0005) * 1000).toFixed(2)} USD</strong>.</p>
                    </div>
                </div>

            </div>

            {/* Info Footer */}
            <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
                    <p className="text-xs text-teal-300">
                        Los cambios de precios se guardan en el cluster de Redis y aplican de manera instantánea para todas las API Keys activas sin downtime.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                    {saving ? "Guardando..." : "Aplicar Cambios Ahora"}
                </button>
            </div>
        </div>
    );
}
