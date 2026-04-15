"use client";

import { motion } from "framer-motion";
import { Play, Wifi, Rocket, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExitIntentPopup } from "@/components/ui/exit-intent-popup";
import { useHeroParallax } from "./flyering-hero/use-hero-parallax";
import { useGlitchText } from "./flyering-hero/use-glitch-text";
import { HeroBackground } from "./flyering-hero/hero-background";
import { HeroDashboard } from "./flyering-hero/hero-dashboard";

const GLITCH_MSGS = ["DIGITAL", "INTEGRAL", "360°", "GLOBAL", "TOTAL"];

export function FlyeringHero() {
    const { mouseX, mouseY, rotateX, rotateY, layer1X, layer1Y, layer2X, layer2Y, handleMouseMove } = useHeroParallax();
    const glitchText = useGlitchText(GLITCH_MSGS, 4000);

    return (
        <div
            className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 overflow-hidden group perspective-[2000px]"
            onMouseMove={handleMouseMove}
        >
            <HeroBackground mouseX={mouseX} mouseY={mouseY} />

            <div className="container relative z-20 px-4 md:px-6 pt-32">
                <div className="flex flex-col items-center text-center space-y-10">

                    {/* Removed overlapping badge (viñeta) */}

                    {/* 4. Main Headline */}
                    <div className="max-w-5xl space-y-6 relative">
                        <div className="absolute -left-12 top-0 text-6xl font-thin text-slate-800 hidden lg:block font-mono">{"{"}</div>
                        <div className="absolute -right-12 bottom-0 text-6xl font-thin text-slate-800 hidden lg:block font-mono">{"}"}</div>

                        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-4 sm:mb-6 relative z-10 leading-[0.9]">
                            <span className="block mb-2 drop-shadow-sm">
                                Impulsa tu Negocio
                            </span>
                            <div className="flex justify-center items-center gap-4 flex-wrap">
                                <span className="text-xl sm:text-3xl md:text-5xl font-mono text-teal-600/50 uppercase tracking-widest align-super">Estrategia</span>
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-600 animate-gradient-x font-mono relative">
                                    {glitchText}
                                </span>
                            </div>
                        </h1>
                        <p className="mx-auto max-w-2xl text-lg md:text-xl text-slate-400 leading-relaxed text-pretty font-medium">
                            Plan de medios, diseño web, branding, automatización, SEO y producción audiovisual. Todo en un solo lugar con enfoque en <span className="text-teal-400 font-bold bg-teal-950/30 px-2 rounded border border-teal-500/20">CONVERSIÓN</span>.
                        </p>
                    </div>

                    {/* 5. Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-8 w-full sm:w-auto px-4 sm:px-0"
                    >
                        <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-base sm:text-lg transition-all hover:scale-105 shadow-xl shadow-red-700/20 relative overflow-hidden group animate-pulse-slow">
                            <span className="relative flex items-center gap-2 uppercase tracking-wide">
                                ¡RECLAMAR MI CUPO AHORA! <Rocket className="w-5 h-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                            </span>
                        </Button>

                        <Button variant="ghost" size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all group relative overflow-hidden">
                            <span className="flex items-center gap-2 relative z-10 font-semibold">
                                <Play className="w-4 h-4 fill-current" /> Ver Soluciones
                            </span>
                        </Button>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-xs text-slate-500 font-medium"
                    >
                        🔒 <span className="text-slate-400">Validado por +50 empresas locales.</span> Tu competencia ya está aquí.
                    </motion.p>

                    {/* 6. 3D Parallax Dashboard */}
                    <HeroDashboard
                        rotateX={rotateX}
                        rotateY={rotateY}
                        layer1X={layer1X}
                        layer1Y={layer1Y}
                        layer2X={layer2X}
                        layer2Y={layer2Y}
                    />
                </div>
            </div>

            {/* 7. Bottom Haze (Dark) */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20 pointer-events-none" />

            {/* 8. Sticky Mobile CTA */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ delay: 2, type: "spring" }}
                className="fixed bottom-4 left-4 right-4 z-50 md:hidden"
            >
                <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold h-12 rounded-full shadow-2xl shadow-teal-500/40 border border-teal-400/50 flex items-center justify-center gap-2" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                    <Zap className="fill-current w-4 h-4" /> Reclamar Auditoría Gratis
                </Button>
            </motion.div>

            {/* 9. QR Scan Success Toast */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, type: "spring" }}
                className="fixed top-24 right-4 z-50 bg-slate-900/90 backdrop-blur-md border border-teal-500/50 p-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-sm"
            >
                <div className="bg-teal-500/20 p-2 rounded-lg text-teal-400">
                    <Wifi className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                    <h4 className="text-white font-bold text-sm">Conexión Segura</h4>
                    <p className="text-slate-400 text-xs">Acceso desde Flyer verificado. Tu oferta ha sido reservada.</p>
                </div>
            </motion.div>

            {/* 10. Aggressive Acquisition Modules */}
            <ExitIntentPopup />
        </div >
    );
}
