'use client';

import { useState, useMemo } from 'react';
import {
    BaselineRevenueConfig, WhatIfParameters, simulateWhatIfRevenue
} from '@/lib/crm/whatif-simulator';
import { Sliders, TrendingUp, DollarSign, Users, Target, ArrowRight, Zap, RefreshCw } from 'lucide-react';

export function WhatIfSimulatorWidget() {
    const [baseline] = useState<BaselineRevenueConfig>({
        monthlyLeads: 200,
        conversionRate: 5.0,
        avgDealSize: 2500,
        salesReps: 4,
    });

    const [params, setParams] = useState<WhatIfParameters>({
        leadVolumeChangePct: 20,
        conversionRateDeltaPct: 2.0,
        dealSizeChange: 500,
        salesRepChange: 1,
    });

    const simulation = useMemo(() => {
        return simulateWhatIfRevenue(baseline, params);
    }, [baseline, params]);

    const resetSimulator = () => {
        setParams({
            leadVolumeChangePct: 0,
            conversionRateDeltaPct: 0,
            dealSizeChange: 0,
            salesRepChange: 0,
        });
    };

    return (
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="ds-badge ds-badge-teal">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                            </span>
                            Fase 3 · Simulador What-If
                        </span>
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                        Simulador de Escenarios de Ventas "What-If"
                    </h2>
                    <p className="font-mono text-xs text-slate-500 mt-0.5">
                        Manipula variables de tráfico, conversión y vendedores para proyectar ingresos en tiempo real.
                    </p>
                </div>

                <button
                    onClick={resetSimulator}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white transition-all"
                >
                    <RefreshCw size={13} />
                    <span>Restablecer Sliders</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* ── Interactive Sliders Column ── */}
                <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 font-mono text-xs">
                    
                    {/* Slider 1: Volume */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Volumen de Leads (%):</span>
                            <span className="font-bold text-teal-400">{params.leadVolumeChangePct > 0 ? `+${params.leadVolumeChangePct}` : params.leadVolumeChangePct}%</span>
                        </div>
                        <input
                            type="range" min="-50" max="100" step="5"
                            value={params.leadVolumeChangePct}
                            onChange={(e) => setParams(p => ({ ...p, leadVolumeChangePct: parseInt(e.target.value) }))}
                            className="w-full accent-teal-400 bg-slate-950 rounded-lg cursor-pointer"
                        />
                    </div>

                    {/* Slider 2: Conversion Rate */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Variación Tasa de Conversión (%):</span>
                            <span className="font-bold text-cyan-400">{params.conversionRateDeltaPct > 0 ? `+${params.conversionRateDeltaPct}` : params.conversionRateDeltaPct}%</span>
                        </div>
                        <input
                            type="range" min="-3" max="10" step="0.5"
                            value={params.conversionRateDeltaPct}
                            onChange={(e) => setParams(p => ({ ...p, conversionRateDeltaPct: parseFloat(e.target.value) }))}
                            className="w-full accent-cyan-400 bg-slate-950 rounded-lg cursor-pointer"
                        />
                    </div>

                    {/* Slider 3: Deal Size */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Aumento Ticket Promedio ($):</span>
                            <span className="font-bold text-emerald-400">${params.dealSizeChange >= 0 ? `+${params.dealSizeChange}` : params.dealSizeChange}</span>
                        </div>
                        <input
                            type="range" min="-1000" max="3000" step="100"
                            value={params.dealSizeChange}
                            onChange={(e) => setParams(p => ({ ...p, dealSizeChange: parseInt(e.target.value) }))}
                            className="w-full accent-emerald-400 bg-slate-950 rounded-lg cursor-pointer"
                        />
                    </div>

                    {/* Slider 4: Sales Reps */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Vendedores Adicionales:</span>
                            <span className="font-bold text-purple-400">{params.salesRepChange >= 0 ? `+${params.salesRepChange}` : params.salesRepChange} reps</span>
                        </div>
                        <input
                            type="range" min="-2" max="6" step="1"
                            value={params.salesRepChange}
                            onChange={(e) => setParams(p => ({ ...p, salesRepChange: parseInt(e.target.value) }))}
                            className="w-full accent-purple-400 bg-slate-950 rounded-lg cursor-pointer"
                        />
                    </div>
                </div>

                {/* ── Live Projections Results Column ── */}
                <div className="space-y-4 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-3">
                        
                        {/* Baseline */}
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                            <span className="font-mono text-[10px] text-slate-500 uppercase">Revenue Base Actual</span>
                            <p className="text-2xl font-black text-slate-300">${simulation.baselineMonthlyRevenue.toLocaleString()}</p>
                            <span className="font-mono text-[11px] text-slate-500 block pt-1">{simulation.baselineDealsWon} deals ganados/mes</span>
                        </div>

                        {/* Projected */}
                        <div className="p-4 rounded-xl bg-slate-900 border border-teal-500/40 space-y-1 shadow-lg shadow-teal-500/10">
                            <span className="font-mono text-[10px] text-teal-400 uppercase font-bold">Revenue Proyectado</span>
                            <p className="text-2xl font-black text-teal-300">${simulation.projectedMonthlyRevenue.toLocaleString()}</p>
                            <span className="font-mono text-[11px] text-emerald-400 font-bold block pt-1">
                                {simulation.growthPercentage >= 0 ? `+${simulation.growthPercentage}%` : `${simulation.growthPercentage}%`} crecimiento
                            </span>
                        </div>
                    </div>

                    {/* Insight Box */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap size={14} className="text-teal-400" /> Diagnóstico del Escenario
                        </span>
                        <p className="font-mono text-xs text-slate-300 leading-relaxed">
                            {simulation.insightSummary}
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
}
