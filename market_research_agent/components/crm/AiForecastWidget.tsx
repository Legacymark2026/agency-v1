"use client";

import { useState, useEffect } from "react";
import { Brain, TrendingUp, AlertTriangle, Target, Loader2, RefreshCw, DollarSign } from "lucide-react";

interface ForecastData {
    predictedRevenue: number;
    confidenceScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    bestCaseRevenue: number;
    worstCaseRevenue: number;
    pipelineValue: number;
    weightedValue: number;
    activeDealCount: number;
    keyInsights: string[];
    recommendations: string[];
    source: "gemini" | "algorithmic" | "algorithmic_fallback";
}

const RISK_STYLES = {
    LOW: { color: "#10b981", label: "Bajo Riesgo", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" },
    MEDIUM: { color: "#f59e0b", label: "Riesgo Medio", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" },
    HIGH: { color: "#ef4444", label: "Alto Riesgo", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
};

export function AiForecastWidget({ companyId }: { companyId: string }) {
    const [data, setData] = useState<ForecastData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    const loadForecast = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/crm/ai-forecast?companyId=${companyId}`);
            const json = await res.json();
            setData(json);
        } catch {
            console.error("Failed to load forecast");
        }
        setLoading(false);
    };

    useEffect(() => { loadForecast(); }, [companyId]);

    if (loading) return (
        <div className="ds-section flex items-center justify-center h-24">
            <div className="flex items-center gap-3">
                <Loader2 size={14} className="animate-spin text-teal-400" />
                <p className="font-mono text-[9px] text-slate-500">Generando predicción con IA...</p>
            </div>
        </div>
    );

    if (!data) return null;

    const risk = RISK_STYLES[data.riskLevel] ?? RISK_STYLES.MEDIUM;
    const isGemini = data.source === "gemini";

    return (
        <div className="ds-section" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="ds-icon-box w-7 h-7"><Brain size={12} className="text-violet-400" /></div>
                    <p className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        AI Sales Forecast {isGemini ? "· Gemini" : "· Algorítmico"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-mono text-[8px] px-2 py-0.5 rounded-sm" style={{ background: risk.bg, border: `1px solid ${risk.border}`, color: risk.color }}>
                        {risk.label}
                    </span>
                    <button onClick={loadForecast} className="p-1 text-slate-600 hover:text-slate-300 transition-colors rounded">
                        <RefreshCw size={10} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                    <p className="font-mono text-[8px] text-slate-600 uppercase tracking-widest mb-1">Predicción</p>
                    <p className="font-mono text-xl font-black text-teal-400">${(data.predictedRevenue / 1000).toFixed(1)}k</p>
                </div>
                <div className="text-center">
                    <p className="font-mono text-[8px] text-slate-600 uppercase tracking-widest mb-1">Confianza</p>
                    <div className="flex items-center justify-center gap-1">
                        <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,0.8)' }}>
                            <div className="h-full rounded-full" style={{ width: `${data.confidenceScore}%`, background: 'linear-gradient(90deg, #7c3aed, #0ea5e9)' }} />
                        </div>
                        <span className="font-mono text-xs font-black text-violet-400">{data.confidenceScore}%</span>
                    </div>
                </div>
                <div className="text-center">
                    <p className="font-mono text-[8px] text-slate-600 uppercase tracking-widest mb-1">Deals Activos</p>
                    <p className="font-mono text-xl font-black text-slate-200">{data.activeDealCount}</p>
                </div>
            </div>

            {/* Best/Worst case */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <p className="font-mono text-[8px] text-emerald-500 mb-1">Optimista</p>
                    <p className="font-mono text-sm font-black text-emerald-400">${(data.bestCaseRevenue / 1000).toFixed(1)}k</p>
                </div>
                <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <p className="font-mono text-[8px] text-red-500 mb-1">Conservador</p>
                    <p className="font-mono text-sm font-black text-red-400">${(data.worstCaseRevenue / 1000).toFixed(1)}k</p>
                </div>
            </div>

            <button onClick={() => setExpanded(e => !e)} className="w-full font-mono text-[9px] text-slate-600 hover:text-slate-400 transition-colors text-center">
                {expanded ? "▲ Ocultar insights" : "▼ Ver insights y recomendaciones"}
            </button>

            {expanded && (
                <div className="mt-4 space-y-3">
                    {data.keyInsights.length > 0 && (
                        <div>
                            <p className="font-mono text-[8px] text-slate-600 uppercase tracking-widest mb-2">Insights</p>
                            {data.keyInsights.map((insight, i) => (
                                <div key={i} className="flex items-start gap-2 mb-1.5">
                                    <Target size={9} className="text-violet-400 shrink-0 mt-0.5" />
                                    <p className="font-mono text-[9px] text-slate-400">{insight}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {data.recommendations.length > 0 && (
                        <div>
                            <p className="font-mono text-[8px] text-slate-600 uppercase tracking-widest mb-2">Recomendaciones</p>
                            {data.recommendations.map((rec, i) => (
                                <div key={i} className="flex items-start gap-2 mb-1.5">
                                    <TrendingUp size={9} className="text-sky-400 shrink-0 mt-0.5" />
                                    <p className="font-mono text-[9px] text-slate-400">{rec}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
