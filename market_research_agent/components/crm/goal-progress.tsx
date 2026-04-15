"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";

interface GoalProgressProps {
    wonValue: number;
    monthlyTarget: number;
    progress: number;
}

export function GoalProgress({ wonValue, monthlyTarget, progress }: GoalProgressProps) {
    const [simulated, setSimulated] = useState(wonValue);
    const [simActive, setSimActive] = useState(false);

    const displayValue = simActive ? simulated : wonValue;
    const raw = Math.min((displayValue / monthlyTarget) * 100, 100);
    const pct = isNaN(raw) ? 0 : raw;

    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    // Color based on progress
    const barColor = pct >= 100 ? 'from-teal-400 to-emerald-400' :
        pct >= 75 ? 'from-teal-500 to-teal-400' :
            pct >= 50 ? 'from-teal-600 to-teal-500' :
                'from-slate-600 to-slate-500';

    return (
        <div className="ds-section h-full flex flex-col relative overflow-hidden group">
            {/* Ambient */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-3 pb-4 mb-4 relative z-10"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div className="ds-icon-box w-8 h-8">
                    <Target size={14} strokeWidth={1.5} className="text-teal-400" />
                </div>
                <div>
                    <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em]">
                        Meta Mensual {simActive && <span className="text-teal-400 ml-1">(SIM)</span>}
                    </p>
                    <p className="font-mono text-[8px] text-slate-700 uppercase tracking-widest mt-0.5">Objetivo de ingresos · Forecast</p>
                </div>
            </div>

            {/* Values */}
            <div className="flex justify-between items-end mb-5 relative z-10">
                <div>
                    <p className="ds-stat-value font-mono">{fmt.format(displayValue)}</p>
                    <p className="ds-stat-label">Ganados hasta ahora</p>
                </div>
                <div className="text-right">
                    <span className="font-mono text-lg font-black text-teal-400">{pct.toFixed(1)}%</span>
                    <p className="ds-mono-label mt-0.5">del objetivo</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 mb-2">
                <div className="ds-progress-track">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`ds-progress-fill bg-gradient-to-r ${barColor} relative overflow-hidden`}
                    >
                        <motion.div
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                    </motion.div>
                </div>
                <div className="flex justify-between mt-2">
                    <span className="ds-mono-label">$0</span>
                    <span className="ds-mono-label">Objetivo: {fmt.format(monthlyTarget)}</span>
                </div>
            </div>

            {/* Simulator */}
            <div className="mt-auto pt-4 relative z-10" style={{ borderTop: '1px dashed rgba(30,41,59,0.6)' }}>
                <div className="flex justify-between items-center mb-3">
                    <span className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">Simulador de Escenarios</span>
                    <button
                        onClick={() => { setSimActive(!simActive); setSimulated(wonValue); }}
                        className={`font-mono text-[8.5px] px-2.5 py-1 uppercase tracking-widest transition-all border rounded-sm ${simActive
                                ? 'border-red-900/50 text-red-400 bg-red-950/30 hover:border-red-700/50'
                                : 'border-teal-900/50 text-teal-400 bg-teal-950/30 hover:border-teal-700/50'
                            }`}
                    >
                        {simActive ? 'Cancelar' : 'Activar Sim.'}
                    </button>
                </div>

                {simActive && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <input
                            type="range"
                            min={wonValue} max={monthlyTarget * 1.5} value={simulated}
                            onChange={e => setSimulated(Number(e.target.value))}
                            className="w-full accent-teal-500"
                        />
                        <div className="flex justify-between mt-2 font-mono text-[9px]">
                            <span className="text-slate-600 uppercase tracking-widest">Mover para simular cierres</span>
                            <span className="text-teal-400">+{fmt.format(simulated - wonValue)}</span>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
