"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
    ArrowRight, Play, Layers, Zap, Target, TrendingUp,
    Video, Palette, PenTool, Megaphone, BarChart3
} from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useTranslations } from "next-intl";

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2 }
    }
};

export default function ContentCreationPage() {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
    const t = useTranslations("creacionContenidoPage");

    return (
        <main className="bg-slate-50 selection:bg-teal-500 selection:text-white overflow-hidden">

            {/* HERO SECTION */}
            <section ref={targetRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-teal-200/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.4, 0.2],
                        x: [0, 50, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply"
                />

                <motion.div style={{ opacity, scale }} className="container relative z-10 mx-auto px-6 lg:px-8 text-center">

                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/50 backdrop-blur-md shadow-sm hover:shadow-md transition-all cursor-default mb-8"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                        <span className="text-slate-600 text-xs font-mono font-medium uppercase tracking-widest">Producción de Contenido</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="text-5xl lg:text-8xl font-bold tracking-tighter text-slate-900 mb-8 max-w-5xl mx-auto leading-[1.1]"
                    >
                        Contenido <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-indigo-500 to-teal-500 animate-gradient-x bg-[length:200%_auto]">
                            de Alto Impacto
                        </span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="text-xl lg:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
                    >
                        Producimos contenido audiovisual y gráfico que no solo se ve bien, sino que vende.
                        Estrategias visuales diseñadas para interrumpir y convertir.
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex flex-col sm:flex-row justify-center gap-6"
                    >
                        <Link href="/contacto">
                            <Button size="lg" className="h-16 px-10 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-lg shadow-[0_20px_50px_-12px_rgba(15,23,42,0.5)] hover:shadow-[0_20px_50px_-12px_rgba(15,23,42,0.8)] transition-all hover:scale-105 active:scale-95 group relative overflow-hidden">
                                <span className="relative z-10 flex items-center">
                                    Iniciar Producción <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Button>
                        </Link>
                        <Link href="#proceso">
                            <Button variant="outline" size="lg" className="h-16 px-10 rounded-full border-slate-200 bg-white/80 backdrop-blur text-slate-700 hover:bg-slate-50 hover:border-teal-200 text-lg hover:shadow-lg transition-all hover:-translate-y-1">
                                <Play className="mr-2 h-5 w-5 text-teal-500" />
                                Ver Proceso
                            </Button>
                        </Link>
                    </motion.div>

                    <div className="mt-24 pt-10 border-t border-slate-200/60 max-w-4xl mx-auto">
                        <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-6">Resultados</p>
                        <div className="flex justify-between items-center">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-slate-900">+2.4M</div>
                                <div className="text-xs text-slate-400">Vistas</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-slate-900">8.7x</div>
                                <div className="text-xs text-slate-400">ROAS</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-slate-900">45%</div>
                                <div className="text-xs text-slate-400">Open Rate</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-slate-900">+12k</div>
                                <div className="text-xs text-slate-400">Shares</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* SERVICES SECTION */}
            <section className="py-32 bg-slate-50 relative overflow-hidden">
                <div className="container mx-auto px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                        >
                            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                                Stack de <span className="text-teal-600">Producción</span>
                            </h2>
                            <div className="text-lg text-slate-600 mb-10 leading-relaxed">
                                <p>Todo lo que necesitas para escalar tu marca visualmente.</p>
                            </div>
                            <ul className="space-y-6">
                                {[
                                    { icon: Video, text: "Producción de Video 4K", sub: "Videos cinematográficos", color: "text-teal-500" },
                                    { icon: Palette, text: "Diseño Gráfico HD", sub: "Identidad visual premium", color: "text-indigo-500" },
                                    { icon: PenTool, text: "Copywriting Estratégico", sub: "Textos que venden", color: "text-amber-500" },
                                    { icon: Megaphone, text: "Creatividades para Pauta", sub: "Meta, Google, TikTok", color: "text-purple-500" },
                                ].map((item, idx) => (
                                    <motion.li
                                        key={idx}
                                        whileHover={{ x: 10 }}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-crosshair"
                                    >
                                        <div className={`p-2 rounded-lg bg-slate-50 ${item.color}`}>
                                            <item.icon size={20} />
                                        </div>
                                        <div>
                                            <div className="text-slate-700 font-medium">{item.text}</div>
                                            <div className="text-xs text-slate-400">{item.sub}</div>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 100 }}
                            className="relative group perspective-1000"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-indigo-500/20 blur-3xl rounded-full -z-10 group-hover:blur-2xl transition-all duration-500" />

                            <motion.div
                                whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-10 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-100 to-transparent rounded-bl-[100px] opacity-50" />

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Antes</div>
                                        <div className="text-5xl font-bold text-slate-300 mb-2">Baja</div>
                                        <div className="text-sm text-slate-400">Conversión</div>
                                    </div>
                                    <div className="text-center p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent" />
                                        <div className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-4 relative z-10">Con LegacyMark</div>
                                        <div className="text-5xl font-bold text-white mb-2 relative z-10">Alta</div>
                                        <div className="text-sm text-slate-400 relative z-10">Conversión</div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ROI SECTION */}
            <section className="py-32 bg-slate-50">
                <div className="container mx-auto px-6 lg:px-8">
                    <div className="bg-white rounded-[3rem] p-10 lg:p-20 shadow-2xl border border-slate-100 flex flex-col lg:flex-row gap-20 items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-50/50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="flex-1 relative z-10">
                            <Badge variant="outline" className="mb-8 border-indigo-100 bg-indigo-50 text-indigo-600 px-4 py-1 text-sm">
                                <BarChart3 className="w-3 h-3 mr-2" />
                                ROI Calculator
                            </Badge>
                            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-8 leading-tight">
                                Calcula tu ROI de <span className="text-teal-600">Contenido</span>
                            </h2>
                            <p className="text-lg text-slate-600 mb-12 leading-relaxed">
                                Herramienta de cálculo de retorno de inversión en contenido.
                            </p>

                            <div className="grid grid-cols-2 gap-10">
                                <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="text-5xl font-bold text-slate-900 mb-2 tracking-tight">8.7x</div>
                                    <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">ROAS Promedio</div>
                                </motion.div>
                                <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-teal-50 border border-teal-100">
                                    <div className="text-5xl font-bold text-teal-600 mb-2 tracking-tight">+150</div>
                                    <div className="text-sm font-medium text-teal-700 uppercase tracking-widest">Campañas Activas</div>
                                </motion.div>
                            </div>
                        </div>

                        <div className="flex-1 w-full text-center">
                            <Link href="/contacto" className="text-teal-600 hover:underline text-lg">
                                Solicitar acceso al simulador →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section className="py-24 bg-white relative">
                <div className="container mx-auto px-6 lg:px-8 max-w-3xl">
                    <h2 className="text-3xl font-bold text-slate-900 text-center mb-16">
                        Preguntas Frecuentes
                    </h2>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        <AccordionItem value="item-0" className="border border-slate-100 rounded-xl px-4 bg-slate-50/50 data-[state=open]:bg-white data-[state=open]:shadow-md transition-all duration-300">
                            <AccordionTrigger className="text-lg font-medium text-slate-800 hover:no-underline py-6">
                                ¿Cuánto tiempo takes take la producción de un video?
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-600 text-base leading-relaxed pb-6">
                                Nuestro pipeline de producción toma 9 días hábiles desde la concept until la entrega final.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-1" className="border border-slate-100 rounded-xl px-4 bg-slate-50/50 data-[state=open]:bg-white data-[state=open]:shadow-md transition-all duration-300">
                            <AccordionTrigger className="text-lg font-medium text-slate-800 hover:no-underline py-6">
                                ¿Qué plataformas cubren?
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-600 text-base leading-relaxed pb-6">
                                Meta Ads, Google Ads, TikTok Ads y todos los canales principales de redes sociales.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2" className="border border-slate-100 rounded-xl px-4 bg-slate-50/50 data-[state=open]:bg-white data-[state=open]:shadow-md transition-all duration-300">
                            <AccordionTrigger className="text-lg font-medium text-slate-800 hover:no-underline py-6">
                                ¿Incluyen copywriting?
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-600 text-base leading-relaxed pb-6">
                                Sí, todos nuestros paquetes incluyen copywriting estratégico optimizado para conversión.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-32 bg-slate-950 border-t border-slate-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-900/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="container mx-auto px-6 lg:px-8 text-center relative z-10">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-950/50 text-teal-400 text-xs font-mono mb-8 backdrop-blur-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                        Disponible para nuevos proyectos
                    </motion.div>

                    <h2 className="text-5xl lg:text-7xl font-bold text-white mb-8 tracking-tight max-w-4xl mx-auto">
                        ¿Listo para transformar tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">
                            marca?
                        </span>
                    </h2>

                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light">
                        Agenda una consulta y descubre cómo llevar tu contenido al siguiente nivel.
                    </p>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col sm:flex-row justify-center gap-4"
                    >
                        <Link href="/contacto">
                            <Button size="lg" className="h-20 px-12 rounded-full bg-teal-500 text-white hover:bg-teal-400 text-xl font-bold shadow-[0_0_40px_-10px_rgba(20,184,166,0.5)] transition-all">
                                Agendar Consulta
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}