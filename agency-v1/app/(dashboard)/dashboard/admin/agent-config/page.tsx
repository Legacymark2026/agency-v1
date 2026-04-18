"use client";

import { useState, useEffect } from "react";
import { Bot, Save, Loader2, Sparkles, Settings2, Sliders, Smartphone, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Assuming sonner is used for toasts, standard in Shadcn

export default function AgentConfigPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [config, setConfig] = useState({
        systemPrompt: "",
        llmModel: "gemini-2.0-flash-lite",
        temperature: 0.7,
        maxTokens: 1024,
        adminWhatsappPhone: "",
        monthlySalesTarget: 10000,
        isActive: true,
    });

    useEffect(() => {
        fetch("/api/admin/agent-config")
            .then(res => res.json())
            .then(data => {
                if (data.config) {
                    setConfig(data.config);
                }
            })
            .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/agent-config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });

            if (!res.ok) throw new Error("Error al guardar la configuración");
            
            toast.success("Configuración guardada exitosamente");
        } catch (error) {
            console.error(error);
            toast.error("Hubo un error al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                        <Bot className="h-6 w-6 text-teal-400" />
                        Configuración del Agente Cognitivo
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Ajusta el comportamiento, la personalidad y las reglas de negocio de tu Asistente AI.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="font-medium">Opciones del Agente</span>
                    </label>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar Cambios
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Panel Izquierdo: System Prompt */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="h-5 w-5 text-teal-400" />
                            <h2 className="text-lg font-semibold text-slate-100">Cerebro del Agente (System Prompt)</h2>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">
                            Define la personalidad, el tono y las reglas inquebrantables del Agente. Este prompt guía todas sus decisiones.
                        </p>
                        <textarea
                            value={config.systemPrompt}
                            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                            className="w-full h-[400px] bg-slate-950 border border-slate-700 text-slate-200 text-sm font-mono rounded-lg p-4 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-600 resize-none"
                            placeholder="Eres un agente..."
                        />
                    </div>
                </div>

                {/* Panel Derecho: Parámetros y Variables */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Settings2 className="h-5 w-5 text-teal-400" />
                            <h2 className="text-lg font-semibold text-slate-100">Modelo AI</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Modelo LLM</label>
                                <select
                                    value={config.llmModel}
                                    onChange={(e) => setConfig({ ...config, llmModel: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-teal-500"
                                >
                                    <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (Recomendado, Más rápido)</option>
                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center justify-between text-sm font-medium text-slate-300 mb-1.5">
                                    <span>Temperatura ({config.temperature})</span>
                                    <Sliders className="h-3 w-3 text-slate-500" />
                                </label>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.1"
                                    value={config.temperature}
                                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                                    className="w-full accent-teal-500"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>Preciso</span>
                                    <span>Creativo</span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Max Tokens</label>
                                <input
                                    type="number"
                                    value={config.maxTokens}
                                    onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-teal-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="h-5 w-5 text-teal-400" />
                            <h2 className="text-lg font-semibold text-slate-100">Variables de Negocio</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
                                    <Smartphone className="h-4 w-4" />
                                    WhatsApp Admin (Reportes)
                                </label>
                                <input
                                    type="text"
                                    value={config.adminWhatsappPhone}
                                    onChange={(e) => setConfig({ ...config, adminWhatsappPhone: e.target.value })}
                                    placeholder="573145629141"
                                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-teal-500"
                                />
                                <p className="text-xs text-slate-400 mt-1">Incluir código de país, sin espacios ni el signo +.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Meta de Ventas Mensual ($)</label>
                                <input
                                    type="number"
                                    value={config.monthlySalesTarget}
                                    onChange={(e) => setConfig({ ...config, monthlySalesTarget: parseFloat(e.target.value) })}
                                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-teal-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
