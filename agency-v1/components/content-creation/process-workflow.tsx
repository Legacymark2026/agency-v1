"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
    Lightbulb,
    Clapperboard,
    Scissors,
    Rocket,
    Calendar,
    ArrowRight,
    Zap,
    Clock,
    CheckCircle2
} from "lucide-react";
import { useState, useRef } from "react";
import Link from "next/link";

const steps = [
    {
        number: "01",
        icon: Lightbulb,
        title: "Estrategia & Concepto",
        description: "Analizamos tendencias en tiempo real y diseñamos ganchos virales personalizados para tu nicho. Investigación competente, benchmarks de industria y hooks de alto impacto.",
        deliverables: ["Análisis de audiencia", "3 ideas virales", "Hook principal definido"],
        color: "from-violet-500 to-purple-600",
        glow: "shadow-violet-500/20",
        bg: "bg-violet-50",
        border: "border-violet-100",
        time: "Día 1–2",
    },
    {
        number: "02",
        icon: Calendar,
        title: "Planificación Editorial",
        description: "Guiones palabra por palabra, storyboards detallados y calendario de contenido. Todo listo para tu aprobación antes de producir una sola toma.",
        deliverables: ["Guión completo", "Storyboard visual", "Calendario 30 días"],
        color: "from-sky-500 to-cyan-500",
        glow: "shadow-sky-500/20",
        bg: "bg-sky-50",
        border: "border-sky-100",
        time: "Día 3",
    },
    {
        number: "03",
        icon: Clapperboard,
        title: "Producción Premium",
        description: "Grabación con equipo de cine o dirección remota. Iluminación profesional, audio de estudio y dirección creativa de nivel internacional.",
        deliverables: ["Grabación HD/4K", "Dirección creativa", "Backup raw footage"],
        color: "from-orange-500 to-red-500",
        glow: "shadow-orange-500/20",
        bg: "bg-orange-50",
        border: "border-orange-100",
        time: "Día 4–5",
    },
    {
        number: "04",
        icon: Scissors,
        title: "Edición Hormozi-Style",
        description: "Cortes dinámicos en los primeros 3 segundos, subtítulos animados nativos, sound design inmersivo y motion graphics que frenan el scroll.",
        deliverables: ["Edición dinámica", "Subtítulos animados", "Motion graphics"],
        color: "from-teal-500 to-emerald-500",
        glow: "shadow-teal-500/20",
        bg: "bg-teal-50",
        border: "border-teal-100",
        time: "Día 6–8",
    },
    {
        number: "05",
        icon: Rocket,
        title: "Distribución & Escala",
        description: "Publicación en el horario pico de tu audiencia, gestión de primeras horas críticas, análisis de métricas y optimización continua basada en datos.",
        deliverables: ["Publicación estratégica", "Gestión primeras 48h", "Reporte de métricas"],
        color: "from-pink-500 to-rose-500",
        glow: "shadow-pink-500/20",
        bg: "bg-pink-50",
        border: "border-pink-100",
        time: "Día 9+",
    }
];

export default function ProcessWorkflow() {
    const [activeStep, setActiveStep] = useState<number | null>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
    const lineProgress = useTransform(scrollYProgress, [0.1, 0.8], ["0%", "100%"]);

    return (
        <section ref={sectionRef} className="py-32 bg-[#080c14] relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-violet-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="container px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-20">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-xs font-bold tracking-widest uppercase mb-6"
                    >
                        <Zap className="w-3 h-3" /> Proceso Comprobado
                    </motion.span>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight"
                    >
                        De la idea al{" "}
                        <span className="bg-gradient-to-r from-teal-400 to-sky-400 bg-clip-text text-transparent">
                            viral
                        </span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 text-lg max-w-xl mx-auto"
                    >
                        Nuestro pipeline de producción en 9 días. Sin improvisación.
                    </motion.p>

                    {/* Timeline indicator */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm"
                    >
                        <Clock className="w-4 h-4 text-teal-400" />
                        <span className="text-white/70 text-sm font-medium">Entrega garantizada en <span className="text-teal-400 font-bold">9 días hábiles</span></span>
                    </motion.div>
                </div>

                {/* Steps */}
                <div className="relative max-w-4xl mx-auto">
                    {/* Vertical line */}
                    <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2">
                        <motion.div
                            className="w-full bg-gradient-to-b from-violet-500 via-teal-500 to-pink-500"
                            style={{ height: lineProgress }}
                        />
                    </div>

                    <div className="space-y-12 relative">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                
                                transition={{ duration: 0.6, delay: idx * 0.08, ease: "easeOut" }}
                                className={`flex flex-col md:flex-row items-start md:items-center gap-6 pl-16 md:pl-0 ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                                onMouseEnter={() => setActiveStep(idx)}
                                onMouseLeave={() => setActiveStep(null)}
                            >
                                {/* Card */}
                                <div className="flex-1 w-full">
                                    <motion.div
                                        animate={{
                                            borderColor: activeStep === idx ? "rgba(94,234,212,0.3)" : "rgba(255,255,255,0.06)",
                                            backgroundColor: activeStep === idx ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className={`p-6 rounded-2xl border backdrop-blur-sm relative overflow-hidden group cursor-default ${activeStep === idx ? `shadow-2xl ${step.glow}` : ""}`}
                                    >
                                        {/* Gradient accent on hover */}
                                        <motion.div
                                            animate={{ opacity: activeStep === idx ? 1 : 0 }}
                                            className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-5 pointer-events-none`}
                                        />

                                        <div className="flex items-start gap-4 relative z-10">
                                            <div className={`p-3 rounded-xl bg-gradient-to-br ${step.color} flex-shrink-0 shadow-lg`}>
                                                <step.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-mono font-bold tracking-widest bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                                                        PASO {step.number}
                                                    </span>
                                                    <span className="text-xs text-white/30 font-mono">·</span>
                                                    <span className="text-xs font-mono text-white/40 tracking-wider">{step.time}</span>
                                                </div>
                                                <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                                                <p className="text-slate-400 text-sm leading-relaxed mb-4">{step.description}</p>

                                                {/* Deliverables */}
                                                <div className="flex flex-wrap gap-2">
                                                    {step.deliverables.map((d, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3 text-teal-400" />
                                                            {d}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Center dot */}
                                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex-shrink-0 z-20">
                                    <motion.div
                                        animate={{
                                            scale: activeStep === idx ? 1.3 : 1,
                                            boxShadow: activeStep === idx ? `0 0 0 8px rgba(94,234,212,0.1)` : "none"
                                        }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/10 bg-[#080c14] relative`}
                                    >
                                        <motion.div
                                            animate={{ backgroundImage: activeStep !== null && activeStep >= idx ? `linear-gradient(135deg, ${step.color.split(" ")[1]} 0%, ${step.color.split(" ")[3]} 100%)` : "none" }}
                                            className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${activeStep !== null && activeStep >= idx ? `bg-gradient-to-br ${step.color}` : "bg-white/5"}`}
                                        >
                                            <span className="text-white text-xs font-black">{step.number}</span>
                                        </motion.div>
                                    </motion.div>
                                </div>

                                {/* Empty side */}
                                <div className="flex-1 hidden md:block" />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* CTA Final */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    
                    transition={{ duration: 0.6 }}
                    className="mt-24 max-w-3xl mx-auto"
                >
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl p-10 text-center">
                        {/* Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-violet-500/10 pointer-events-none" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent" />

                        <div className="relative z-10">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center shadow-2xl shadow-teal-500/30">
                                <Rocket className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                                ¿Listo para escalar tu contenido?
                            </h3>
                            <p className="text-slate-400 mb-8 max-w-xl mx-auto text-lg">
                                Agenda una auditoría gratuita de 15 min. Analizamos tu perfil y te entregamos 3 ideas virales personalizadas — sin compromiso.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/contacto"
                                    className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-sky-500 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-xl shadow-teal-500/25"
                                >
                                    Agendar Auditoría Gratis
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            <p className="mt-5 text-xs text-white/30 font-mono tracking-wider uppercase">Solo 3 cupos disponibles esta semana</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
