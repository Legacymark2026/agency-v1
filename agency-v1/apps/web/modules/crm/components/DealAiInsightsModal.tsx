'use client';

import { useState } from 'react';
import {
    Sparkles, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
    Zap, MessageSquare, ArrowRight, X, ShieldAlert, Target, Award
} from 'lucide-react';
import {
    calculateWinProbability, predictNextBestAction,
    analyzeTextSentiment, evaluateStagnationRisk, DealData
} from '@/lib/crm/ai-revenue-engine';

interface DealAiInsightsModalProps {
    deal: DealData;
    isOpen: boolean;
    onClose: () => void;
    onExecuteAction?: (actionName: string) => void;
}

export function DealAiInsightsModal({
    deal,
    isOpen,
    onClose,
    onExecuteAction
}: DealAiInsightsModalProps) {
    const [sampleMessage, setSampleMessage] = useState('Me interesa la propuesta, pero me gustaría ajustar los tiempos de entrega');

    if (!isOpen) return null;

    // AI calculations
    const winResult = calculateWinProbability(deal);
    const nbaResult = predictNextBestAction(deal);
    const stagnationResult = evaluateStagnationRisk(deal.daysInStage, deal.avgStageDuration ?? 7);
    const sentimentResult = analyzeTextSentiment(sampleMessage);

    const riskColors = {
        LOW: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
        MEDIUM: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
        HIGH: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
        CRITICAL: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    }[winResult.riskLevel];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 overflow-hidden max-h-[90vh] overflow-y-auto">
                
                {/* ── Header ── */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Sparkles size={20} className="text-slate-950" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-white tracking-tight">{deal.title}</h3>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${riskColors}`}>
                                    Riesgo: {winResult.riskLevel}
                                </span>
                            </div>
                            <p className="font-mono text-xs text-slate-500 mt-0.5">
                                AI Revenue Intelligence · Análisis Predictivo en Tiempo Real
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── 1. Win Probability & Stagnation ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Probability Card */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Target size={14} className="text-teal-400" /> Probabilidad de Cierre
                            </span>
                            <span className="font-mono text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                                Confianza: {winResult.confidence}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white">{winResult.winProbability}%</span>
                            <span className="font-mono text-xs text-slate-400">tasa esperada</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700"
                                style={{ width: `${winResult.winProbability}%` }}
                            />
                        </div>
                    </div>

                    {/* Stagnation Risk Card */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldAlert size={14} className="text-amber-400" /> Diagnóstico de Flujo
                            </span>
                            {stagnationResult.isStagnant && (
                                <span className="font-mono text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                                    Estancado (+{stagnationResult.daysOverdue}d)
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pt-1">
                            {stagnationResult.recommendation}
                        </p>
                    </div>
                </div>

                {/* ── 2. Next Best Action (NBA) Recommendation ── */}
                <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 p-4 rounded-xl space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap size={16} className="text-teal-400" />
                            <span className="font-mono text-xs font-bold text-teal-400 uppercase tracking-wider">
                                Next Best Action Recomendada (IA)
                            </span>
                        </div>
                        <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                            Impacto estimado: {nbaResult.expectedImpact}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">{nbaResult.action}</h4>
                        <p className="text-xs text-slate-400">{nbaResult.description}</p>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                        <span className="font-mono text-[11px] text-slate-500">
                            Canal sugerido: <strong className="text-slate-200">{nbaResult.recommendedChannel}</strong>
                        </span>
                        <button
                            onClick={() => onExecuteAction && onExecuteAction(nbaResult.action)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-md shadow-teal-500/20"
                        >
                            <span>Ejecutar Acción Rápida</span>
                            <ArrowRight size={13} />
                        </button>
                    </div>
                </div>

                {/* ── 3. Positive & Negative Key Drivers ── */}
                <div className="space-y-2">
                    <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">
                        Factores Clave del Diagnóstico
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {winResult.drivers.map((driver, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono"
                            >
                                {driver.impact === 'POSITIVE' ? (
                                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                ) : (
                                    <XCircle size={14} className="text-rose-400 shrink-0" />
                                )}
                                <span className="text-slate-300 truncate">{driver.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── 4. Interactive NLP Sentiment Tester ── */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <span className="font-mono text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-cyan-400" /> Clasificador de Sentimiento & Intención NLP
                    </span>
                    
                    <input
                        type="text"
                        value={sampleMessage}
                        onChange={(e) => setSampleMessage(e.target.value)}
                        placeholder="Escribe o pega un mensaje del cliente..."
                        className="w-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-1">
                        <div className="flex items-center gap-3">
                            <span className="text-slate-400">
                                Sentimiento: <strong className="text-teal-300">{sentimentResult.sentiment}</strong>
                            </span>
                            <span className="text-slate-400">
                                Intención: <strong className="text-cyan-300">{sentimentResult.intent}</strong>
                            </span>
                        </div>
                        <span className="text-slate-400">
                            Score NLP: <strong className="text-white">{sentimentResult.score}</strong>
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}
