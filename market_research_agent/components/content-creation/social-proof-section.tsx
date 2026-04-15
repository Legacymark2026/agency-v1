"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Star, TrendingUp, DollarSign, Users, Eye, Zap, ArrowUpRight, Play, Quote } from "lucide-react";
import { useEffect, useState, useRef } from "react";

const testimonials = [
    {
        author: "Sofia R.",
        role: "Marketing Director",
        company: "TechStart",
        avatar: "SR",
        avatarColor: "from-violet-500 to-purple-600",
        text: "El impacto fue inmediato. Pasamos de 500 a 15k views promedio en reels en solo 3 semanas. El equipo de LegacyMark sabe exactamente cómo crear contenido que para el scroll.",
        metric: "+2,900%",
        metricLabel: "Views en 3 semanas",
        rating: 5,
        platform: "Instagram",
    },
    {
        author: "Carlos M.",
        role: "CEO",
        company: "InmoGroup",
        avatar: "CM",
        avatarColor: "from-sky-500 to-cyan-600",
        text: "La calidad visual es de otro nivel. Capturaron la esencia premium de nuestra marca inmobiliaria perfectamente. Nuestros clientes ahora nos perciben como líderes del sector.",
        metric: "18x",
        metricLabel: "ROAS en campañas",
        rating: 5,
        platform: "LinkedIn",
    },
    {
        author: "Ana P.",
        role: "Founder",
        company: "EcoBrand",
        avatar: "AP",
        avatarColor: "from-emerald-500 to-teal-600",
        text: "No solo es contenido bonito, es contenido que vende. Nuestro ROI fue positivo desde el mes 1 y hemos triplicado nuestra base de suscriptores en 90 días.",
        metric: "3x",
        metricLabel: "Base de clientes",
        rating: 5,
        platform: "TikTok",
    }
];

const globalStats = [
    { value: "2.4B+", label: "Views Generadas", icon: Eye, color: "from-violet-500 to-purple-600" },
    { value: "8.7x", label: "ROAS Promedio", icon: TrendingUp, color: "from-teal-500 to-sky-500" },
    { value: "$4.2M", label: "Revenue Generado", icon: DollarSign, color: "from-orange-500 to-red-500" },
    { value: "120+", label: "Clientes Activos", icon: Users, color: "from-pink-500 to-rose-500" },
];

function AnimatedNumber({ target, suffix = "" }: { target: string; suffix?: string }) {
    const [displayed, setDisplayed] = useState("0");
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        // Extract numeric part
        const numeric = parseFloat(target.replace(/[^0-9.]/g, ""));
        const prefix = target.match(/^[^0-9]*/)?.[0] || "";
        const sfx = target.match(/[^0-9.]+$/)?.[0] || suffix;
        let start = 0;
        const duration = 2000;
        const step = (timestamp: number, startTime: number) => {
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = (eased * numeric).toFixed(numeric % 1 !== 0 ? 1 : 0);
            setDisplayed(`${prefix}${current}${sfx}`);
            if (progress < 1) {
                requestAnimationFrame((ts) => step(ts, startTime));
            }
        };
        requestAnimationFrame((ts) => step(ts, ts));
    }, [target, suffix]);

    return <span>{displayed}</span>;
}

export default function SocialProofSection() {
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [inView, setInView] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setInView(true); },
            { threshold: 0.2 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const t = setInterval(() => {
            setActiveTestimonial((p) => (p + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(t);
    }, []);

    return (
        <section ref={sectionRef} className="py-32 bg-white relative overflow-hidden">
            {/* Subtle background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.04),transparent_60%)] pointer-events-none" />

            <div className="container px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-20">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-teal-700 text-xs font-bold tracking-widest uppercase mb-6"
                    >
                        <Zap className="w-3 h-3" /> Resultados Reales
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight"
                    >
                        Números que{" "}
                        <span className="bg-gradient-to-r from-teal-500 to-sky-500 bg-clip-text text-transparent">
                            hablan solos
                        </span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 text-lg max-w-lg mx-auto"
                    >
                        Datos reales de campañas activas. Sin inflaciones. Sin promedios.
                    </motion.p>
                </div>

                {/* Global Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
                    {globalStats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            
                            transition={{ delay: idx * 0.08 }}
                            className="group relative p-6 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                                {inView ? <AnimatedNumber target={stat.value} /> : "—"}
                            </div>
                            <div className="text-slate-500 text-sm font-medium">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Testimonials + Case Study */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

                    {/* Testimonials — 3 cols */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Lo que dicen nuestros clientes</h3>
                            <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                                <span className="text-slate-500 text-sm ml-1 font-medium">4.9/5</span>
                            </div>
                        </div>

                        {testimonials.map((t, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => setActiveTestimonial(idx)}
                                className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${activeTestimonial === idx
                                        ? "border-teal-200 bg-teal-50 shadow-lg shadow-teal-100"
                                        : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
                                    }`}
                            >
                                {/* Quote icon */}
                                {activeTestimonial === idx && (
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30">
                                        <Quote className="w-4 h-4 text-white" />
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}>
                                        {t.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div>
                                                <span className="font-bold text-slate-900 text-sm">{t.author}</span>
                                                <span className="text-slate-400 text-xs ml-2">{t.role} · {t.company}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{t.platform}</span>
                                        </div>
                                        <p className={`text-sm leading-relaxed transition-all duration-300 ${activeTestimonial === idx ? "text-slate-700" : "text-slate-500 line-clamp-2"}`}>
                                            {t.text}
                                        </p>
                                        {activeTestimonial === idx && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-teal-100 rounded-full"
                                            >
                                                <TrendingUp className="w-3 h-3 text-teal-500" />
                                                <span className="text-teal-700 font-bold text-xs">{t.metric}</span>
                                                <span className="text-slate-400 text-xs">{t.metricLabel}</span>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Case Study Card — 2 cols */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-2"
                    >
                        <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50">
                            {/* Card header */}
                            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-8 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-sky-500/10" />
                                <div className="absolute top-0 right-0 w-48 h-48 bg-teal-400/10 blur-[60px] rounded-full" />

                                <span className="relative z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 text-[10px] font-bold tracking-widest uppercase mb-4">
                                    <Zap className="w-2.5 h-2.5" /> Case Study Destacado
                                </span>
                                <h3 className="relative z-10 text-2xl font-black text-white mb-1">Campaña Black Friday</h3>
                                <p className="relative z-10 text-slate-400 text-sm">Fashion Nova Style · E-commerce</p>

                                {/* Fake sparkline */}
                                <div className="relative z-10 mt-6 h-16 flex items-end gap-1">
                                    {[20, 35, 28, 45, 38, 60, 55, 80, 72, 95, 88, 100].map((h, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            
                                            transition={{ delay: i * 0.05, duration: 0.4 }}
                                            className="flex-1 rounded-sm bg-gradient-to-t from-teal-500 to-sky-400 opacity-80"
                                        />
                                    ))}
                                </div>
                                <p className="relative z-10 text-slate-500 text-[10px] mt-2 font-mono">Revenue · 30 días de campaña</p>
                            </div>

                            {/* Stats */}
                            <div className="bg-white p-6">
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {[
                                        { label: "Revenue", value: "$45k", icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
                                        { label: "ROAS", value: "8.5x", icon: TrendingUp, color: "text-sky-600 bg-sky-50" },
                                        { label: "Nuevos Usuarios", value: "+12k", icon: Users, color: "text-violet-600 bg-violet-50" },
                                    ].map((s, i) => (
                                        <div key={i} className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mx-auto mb-2`}>
                                                <s.icon className="w-4 h-4" />
                                            </div>
                                            <div className="text-xl font-black text-slate-900">{s.value}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <a
                                    href="/portfolio"
                                    className="group w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-sm"
                                >
                                    Ver caso completo
                                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
