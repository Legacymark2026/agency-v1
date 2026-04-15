"use client";

import { CheckCircle2, Trophy, Users, Zap, Search, BarChart } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const benefits = [
    {
        title: "Metodología Validada",
        description: "Estrategias probadas con +50 clientes que garantizan retorno.",
        icon: Zap,
        color: "text-yellow-500",
        bg: "bg-yellow-500/10"
    },
    {
        title: "Talento Senior",
        description: "Equipo multidisciplinario con experiencia en grandes marcas.",
        icon: Users,
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    {
        title: "Transparencia Total",
        description: "Dashboards en tiempo real. Sin cajas negras ni métricas vanidosas.",
        icon: Search,
        color: "text-purple-500",
        bg: "bg-purple-500/10"
    },
    {
        title: "Enfoque en ROI",
        description: "Cada acción está pensada para impactar directamente en la facturación.",
        icon: Trophy,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    }
];

export function FlyeringBenefits() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section ref={containerRef} className="py-32 bg-slate-950 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-900/20 opacity-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-900/20 opacity-50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

            <div className="container px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

                    {/* Left Content */}
                    <motion.div style={{ opacity }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-bold mb-6 border border-slate-200 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                            Por qué elegirnos
                        </div>

                        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-8 leading-tight">
                            Más que una agencia, tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">socio estratégico</span>
                        </h2>

                        <p className="text-lg text-gray-400 mb-12 leading-relaxed">
                            En un mercado saturado de promesas, nosotros entregamos resultados. Combinamos la creatividad del diseño con la precisión de la ingeniería de datos.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {benefits.map((benefit, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="flex flex-col gap-4 group"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${benefit.bg} flex items-center justify-center ${benefit.color} group-hover:scale-110 transition-transform duration-300 shadow-sm ring-1 ring-white/10`}>
                                        <benefit.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                                        <p className="text-sm text-gray-400 leading-relaxed font-medium">{benefit.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Image/Visual - Animated 3D Card Style */}
                    <div className="relative perspective-[1000px] group">
                        {/* Main Card */}
                        <motion.div
                            style={{ y }}
                            className="relative z-20 bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10"
                        >
                            {/* Header Stats */}
                            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                                <div>
                                    <div className="text-sm text-gray-500 font-medium">Crecimiento Mensual</div>
                                    <div className="text-3xl font-bold text-white">+127%</div>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 -ml-3 first:ml-0" />)}
                                </div>
                            </div>

                            {/* Chart Visual (CSS only) */}
                            <div className="h-64 flex items-end gap-2 px-4 pb-4 bg-white/5 rounded-xl border border-dashed border-white/10 relative overflow-hidden group-hover:bg-white/10 transition-colors">
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.2]" />
                                {[30, 45, 35, 60, 50, 75, 60, 80, 70, 95].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        whileInView={{ height: `${h}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        viewport={{ once: true }}
                                        className="flex-1 bg-gradient-to-t from-teal-500 to-cyan-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer relative group/bar shadow-[0_0_15px_rgba(45,212,191,0.3)] hover:shadow-[0_0_25px_rgba(45,212,191,0.6)]"
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                            {h}%
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Floating Elements */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-6 -right-6 bg-slate-800 p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-white/10 flex items-center gap-3 z-30"
                            >
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircle2 size={20} /></div>
                                <div>
                                    <div className="text-xs font-bold text-gray-500">Objetivo</div>
                                    <div className="text-sm font-bold text-white">Completado</div>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute -bottom-6 -left-6 bg-slate-900 p-4 rounded-2xl shadow-xl flex items-center gap-3 z-30"
                            >
                                <div className="p-2 bg-white/10 text-teal-400 rounded-lg"><BarChart size={20} /></div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400">ROI Actual</div>
                                    <div className="text-sm font-bold text-white">4.5x Promedio</div>
                                </div>
                            </motion.div>

                        </motion.div>

                        {/* Back Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-teal-500/20 to-purple-500/20 blur-3xl rounded-full -z-10" />
                    </div>

                </div>
            </div>
        </section>
    );
}
