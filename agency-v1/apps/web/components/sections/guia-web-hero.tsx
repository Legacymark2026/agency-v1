"use client";

import { motion } from "framer-motion";
import { ArrowRight, Code, Zap, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GuiaWebHero() {
    return (
        <div className="relative min-h-[90vh] w-full flex items-center justify-center bg-slate-950 overflow-hidden pt-24 pb-16">
            {/* Background elements */}
            <div className="absolute inset-0 bg-noise mix-blend-multiply opacity-[0.02] pointer-events-none" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[80%] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.15)_0%,transparent_70%)] pointer-events-none -z-10" />

            <div className="container relative z-20 px-4 md:px-6">
                <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/40 border border-teal-500/20 text-teal-400 text-sm font-medium mb-4"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                        Guía Definitiva 2026
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-tight"
                    >
                        La Arquitectura de una <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-600">
                           Página Web Rentable
                        </span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl font-medium"
                    >
                        Descubre por qué "estar en internet" ya no es suficiente. Aprende los secretos para transformar una web estática en un ecosistema de captación, automatización y ventas 24/7.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center gap-4 pt-6 w-full sm:w-auto"
                    >
                        <Button size="lg" className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white rounded-full h-14 px-8 text-lg font-bold shadow-[0_0_20px_rgba(13,148,136,0.4)] transition-all hover:scale-105 group" onClick={() => document.getElementById('anatomy')?.scrollIntoView({ behavior: 'smooth' })}>
                            Explorar la Guía <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                        <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full h-14 px-8 text-lg font-semibold border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all bg-transparent" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                            Cotizar mi Proyecto
                        </Button>
                    </motion.div>

                    {/* Features row */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 0.8, duration: 1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 w-full text-slate-400"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Zap className="w-5 h-5 text-teal-500" />
                            <span className="text-sm font-medium">Optimizada para Velocidad</span>
                        </div>
                        <div className="flex items-center justify-center gap-3">
                            <Code className="w-5 h-5 text-teal-500" />
                            <span className="text-sm font-medium">Arquitectura SEO Técnica</span>
                        </div>
                        <div className="flex items-center justify-center gap-3">
                            <BarChart className="w-5 h-5 text-teal-500" />
                            <span className="text-sm font-medium">Integración Omnicanal</span>
                        </div>
                    </motion.div>

                </div>
            </div>
            
            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none" />
        </div>
    );
}
