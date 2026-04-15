"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Search, Lightbulb, Map, FileCode, BarChart3, Rocket, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function Methodology() {
    const t = useTranslations("home.methodology");
    const [activeStep, setActiveStep] = useState(0);
    const [progress, setProgress] = useState(0);

    const STEPS = [
        {
            id: "A",
            title: t('steps.s1.title'),
            subtitle: t('steps.s1.subtitle'),
            desc: t('steps.s1.desc'),
            icon: Search,
            tech_spec: "ANALYSIS_PROTOCOL_V4",
            color: "text-teal-600",
            bg: "bg-teal-50",
            border: "border-teal-200",
            load: "84%"
        },
        {
            id: "C",
            title: t('steps.s2.title'),
            subtitle: t('steps.s2.subtitle'),
            desc: t('steps.s2.desc'),
            icon: Lightbulb,
            tech_spec: "BLUEPRINT_GEN_2.0",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            load: "92%"
        },
        {
            id: "T",
            title: t('steps.s3.title'),
            subtitle: t('steps.s3.subtitle'),
            desc: t('steps.s3.desc'),
            icon: Map,
            tech_spec: "OPS_MATRIX_LOADED",
            color: "text-teal-500",
            bg: "bg-teal-50",
            border: "border-teal-200",
            load: "76%"
        },
        {
            id: "I",
            title: t('steps.s4.title'),
            subtitle: t('steps.s4.subtitle'),
            desc: t('steps.s4.desc'),
            icon: FileCode,
            tech_spec: "EXEC_CORE_ACTIVE",
            color: "text-cyan-600",
            bg: "bg-cyan-50",
            border: "border-cyan-200",
            load: "100%"
        },
        {
            id: "O",
            title: t('steps.s5.title'),
            subtitle: t('steps.s5.subtitle'),
            desc: t('steps.s5.desc'),
            icon: BarChart3,
            tech_spec: "DATA_LOOP_SYNC",
            color: "text-emerald-500",
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            load: "98%"
        },
        {
            id: "N",
            title: t('steps.s6.title'),
            subtitle: t('steps.s6.subtitle'),
            desc: t('steps.s6.desc'),
            icon: Rocket,
            tech_spec: "SCALE_UP_READY",
            color: "text-teal-600",
            bg: "bg-teal-50",
            border: "border-teal-200",
            load: "89%"
        },
    ];

    // Auto-rotate steps if not interacting
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % STEPS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setProgress((activeStep / (STEPS.length - 1)) * 100);
    }, [activeStep]);

    return (
        <section className="bg-transparent py-32 text-white relative overflow-hidden">
            {/* 1. Technical Background Overlay - Dark Mode Blueprint */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,#020617_0%,transparent_100%)] opacity-90" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
                {/* 2. Header with 'System Status' aesthetic */}
                <div className="text-center mb-16 sm:mb-24 relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-teal-900/50 bg-slate-900/60 text-teal-400 text-[10px] font-mono mb-6 uppercase tracking-widest shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                        {t('badge')}
                    </div>
                    <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-[-0.04em] mb-6 text-white">
                        {t('titleStart')} <span className="text-teal-400 font-light">{t('titleHighlight')}</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-light uppercase tracking-widest font-mono">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-stretch">
                    {/* 3. Steps Navigation (Timeline) */}
                    <div className="flex flex-col justify-between py-4 relative">
                        {/* Connecting Line - Darker for visibility */}
                        <div className="absolute left-[2.25rem] top-8 bottom-8 w-px bg-gray-200 hidden lg:block">
                            <motion.div
                                className="w-full bg-gradient-to-b from-teal-500 to-emerald-500"
                                initial={{ height: "0%" }}
                                animate={{ height: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>

                        <div className="space-y-4">
                            {STEPS.map((step, index) => (
                                <div
                                    key={step.id}
                                    onMouseEnter={() => setActiveStep(index)}
                                    className={cn(
                                        "group relative flex items-center gap-6 p-4 rounded-sm cursor-pointer transition-all duration-300 border",
                                        activeStep === index
                                            ? "bg-slate-900/80 border-slate-800 shadow-[0_0_30px_rgba(20,184,166,0.1)]"
                                            : "bg-transparent border-transparent hover:bg-slate-900/40 hover:border-slate-800/50"
                                    )}
                                >
                                    {/* ID Circle */}
                                    <div className={cn(
                                        "relative h-14 w-14 rounded-full flex items-center justify-center font-mono font-bold text-xl border transition-all duration-300 z-10",
                                        activeStep === index
                                            ? "bg-teal-500 text-slate-950 border-teal-400 scale-110 shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                                            : "bg-slate-900 text-slate-500 border-slate-800 group-hover:border-slate-700 group-hover:text-slate-400 shadow-sm"
                                    )}>
                                        {step.id}
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className={cn(
                                                "font-black tracking-tight text-lg transition-colors duration-300",
                                                activeStep === index ? "text-white" : "text-slate-500 group-hover:text-slate-400"
                                            )}>
                                                {step.title}
                                            </h3>
                                            {activeStep === index && <ArrowRight size={16} strokeWidth={1.5} className="text-teal-400" />}
                                        </div>
                                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{step.subtitle}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. Visualization Panel - Dark Mode Card */}
                    <div className="relative lg:h-auto min-h-[350px] sm:min-h-[500px] flex items-center">
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md rounded-sm border border-slate-800 md:rotate-1 hover:rotate-0 transition-transform duration-700 ease-out-expo shadow-[0_0_50px_rgba(20,184,166,0.05)]">
                            {/* Inner Grid */}
                            <div className="absolute inset-4 border border-slate-800/50 rounded-sm overflow-hidden">
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none mix-blend-screen" />

                                {/* Corner Decorations */}
                                <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-teal-500/30 rounded-tl-2xl" />
                                <div className="absolute bottom-0 right-0 w-20 h-20 border-b border-r border-teal-500/30 rounded-br-2xl" />

                                <div className="absolute top-6 right-6 flex gap-2">
                                    <div className="h-2 w-2 rounded-full bg-red-500/80" />
                                    <div className="h-2 w-2 rounded-full bg-yellow-500/80" />
                                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                                </div>
                            </div>
                        </div>

                        {/* Active Step Content Reveal */}
                        <div className="relative z-10 w-full p-8 md:p-12">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative"
                                >
                                    {/* Large Background Letter */}
                                    <span className="absolute -top-20 -left-10 text-[12rem] font-black text-slate-800/30 select-none pointer-events-none mix-blend-overlay">
                                        {STEPS[activeStep].id}
                                    </span>

                                    {/* Tech Icon */}
                                    {(() => {
                                        const ActiveIcon = STEPS[activeStep].icon;
                                        return (
                                            <div className="inline-flex p-5 rounded-sm mb-10 border border-slate-700 bg-slate-800 shadow-sm relative z-20">
                                                <ActiveIcon className="h-10 w-10 text-teal-400" strokeWidth={1.5} />
                                            </div>
                                        );
                                    })()}

                                    {/* Tech Spec Label */}
                                    <div className="mb-6 inline-flex items-center gap-2 text-[10px] font-mono text-teal-500 bg-slate-950/80 px-3 py-1.5 rounded-sm border border-slate-800 tracking-widest uppercase shadow-sm relative z-20">
                                        <CodeIcon />
                                        {STEPS[activeStep].tech_spec}
                                    </div>

                                    <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-6 font-mono uppercase relative z-20">
                                        {STEPS[activeStep].title}
                                    </h3>

                                    <p className="text-lg text-slate-400 leading-relaxed font-light pl-6 relative z-20">
                                        <span className="absolute left-0 top-0 bottom-0 w-px bg-slate-800" />
                                        <span className="absolute left-0 top-0 h-1/3 w-px bg-teal-500" />
                                        {STEPS[activeStep].desc}
                                    </p>

                                    <div className="mt-12 flex items-center gap-4 text-[10px] text-slate-500 font-mono tracking-widest uppercase relative z-20">
                                        <span>STATUS:</span>
                                        <span className="text-teal-400 font-bold">OPTIMAL</span>
                                        <span className="w-px h-4 bg-slate-800" />
                                        <span>LOAD:</span>
                                        <span className="text-white font-bold">{STEPS[activeStep].load}</span>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function CodeIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    )
}
