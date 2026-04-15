"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, Clock, TrendingUp } from "lucide-react";

export default function RoiCalculator() {
    const [videoCount, setVideoCount] = useState(4);
    const [avgLeadValue, setAvgLeadValue] = useState(100);
    const [conversionRate, setConversionRate] = useState(2);

    const calculations = useMemo(() => {
        const monthlyReach = videoCount * 2500; // Est. views per video
        const monthlyLeads = (monthlyReach * (conversionRate / 100));
        const monthlyRevenue = monthlyLeads * avgLeadValue;
        const timeSaved = videoCount * 5; // hours saved per video

        return { monthlyReach, monthlyLeads, monthlyRevenue, timeSaved };
    }, [videoCount, avgLeadValue, conversionRate]);

    return (
        <section className="py-20 bg-slate-50 text-slate-900 relative overflow-hidden">
            {/* Ambient Light */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply"></div>

            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    <div className="space-y-8">
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            
                            className="text-4xl font-bold text-slate-900"
                        >
                            Calcula tu ROI Potencial
                        </motion.h2>
                        <p className="text-slate-600 text-lg">
                            Visualiza el impacto financiero de una estrategia de contenido profesional.
                        </p>

                        <div className="space-y-6">
                            {/* Sliders */}
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium text-slate-500">Videos por Mes</label>
                                    <span className="text-teal-600 font-bold text-xl">{videoCount}</span>
                                </div>
                                <div className="relative h-2 bg-slate-200 rounded-full">
                                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-sky-500 rounded-full" style={{ width: `${(videoCount / 20) * 100}%` }}></div>
                                    <input
                                        type="range" min="1" max="20" step="1"
                                        value={videoCount}
                                        onChange={(e) => setVideoCount(Number(e.target.value))}
                                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                    />
                                    <div className="absolute h-5 w-5 bg-white rounded-full shadow-md top-1/2 -translate-y-1/2 pointer-events-none transition-all" style={{ left: `calc(${(videoCount / 20) * 100}% - 10px)` }}></div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium text-slate-500">Valor Promedio por Lead ($)</label>
                                    <span className="text-teal-600 font-bold text-xl">${avgLeadValue}</span>
                                </div>
                                <div className="relative h-2 bg-slate-200 rounded-full">
                                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-sky-500 rounded-full" style={{ width: `${(avgLeadValue / 1000) * 100}%` }}></div>
                                    <input
                                        type="range" min="10" max="1000" step="10"
                                        value={avgLeadValue}
                                        onChange={(e) => setAvgLeadValue(Number(e.target.value))}
                                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                    />
                                    <div className="absolute h-5 w-5 bg-white rounded-full shadow-md top-1/2 -translate-y-1/2 pointer-events-none transition-all" style={{ left: `calc(${(avgLeadValue / 1000) * 100}% - 10px)` }}></div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium text-slate-500">Tasa de Conversión (%)</label>
                                    <span className="text-teal-600 font-bold text-xl">{conversionRate}%</span>
                                </div>
                                <div className="relative h-2 bg-slate-200 rounded-full">
                                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-sky-500 rounded-full" style={{ width: `${(conversionRate / 5) * 100}%` }}></div>
                                    <input
                                        type="range" min="0.1" max="5" step="0.1"
                                        value={conversionRate}
                                        onChange={(e) => setConversionRate(Number(e.target.value))}
                                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                    />
                                    <div className="absolute h-5 w-5 bg-white rounded-full shadow-md top-1/2 -translate-y-1/2 pointer-events-none transition-all" style={{ left: `calc(${(conversionRate / 5) * 100}% - 10px)` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        
                        className="glass-card rounded-3xl p-8 relative overflow-hidden group bg-white border border-slate-200 shadow-xl"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/10 via-sky-500/10 to-teal-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent"></div>

                        <div className="relative z-10 grid grid-cols-2 gap-6">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-teal-100 transition-colors">
                                <div className="flex items-center gap-2 mb-2 text-slate-500">
                                    <TrendingUp className="w-4 h-4 text-teal-600" /> MONTHLY REACH
                                </div>
                                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {calculations.monthlyReach.toLocaleString()}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-teal-100 transition-colors">
                                <div className="flex items-center gap-2 mb-2 text-slate-500">
                                    <Clock className="w-4 h-4 text-sky-600" /> TIME SAVED
                                </div>
                                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {calculations.timeSaved} <span className="text-sm font-normal text-slate-400">hrs/mes</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-slate-100 text-center relative z-10">
                            <p className="text-sm text-slate-500 uppercase tracking-widest mb-4">Ingresos Mensuales Estimados</p>
                            <motion.div
                                key={calculations.monthlyRevenue}
                                initial={{ scale: 1.1, textShadow: "0 0 30px rgba(13, 148, 136, 0.4)" }}
                                animate={{ scale: 1, textShadow: "0 0 0px rgba(13, 148, 136, 0)" }}
                                className="text-6xl md:text-7xl font-black tracking-tighter bg-gradient-to-b from-slate-900 to-slate-600 bg-clip-text text-transparent"
                            >
                                ${Math.floor(calculations.monthlyRevenue).toLocaleString()}
                            </motion.div>
                            <div className="mt-6 px-6 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full inline-flex items-center gap-2 text-sm font-bold shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                +400% ROI Proyectado
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
