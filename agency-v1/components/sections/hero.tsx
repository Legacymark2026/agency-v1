"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles, Terminal } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { ScrambleText } from "@/components/ui/scramble-text";

const WORDS = ["Negocio", "Marca", "Futuro", "Visión"];

export function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    // Parallax Effects
    const y1 = useTransform(scrollY, [0, 500], [0, 150]);
    const y2 = useTransform(scrollY, [0, 500], [0, -100]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % WORDS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section ref={containerRef} className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#030014] text-white">

            {/* 1. Deep Space Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(76,29,149,0.15),_rgba(3,0,20,1))]" />

                {/* Moving Stars via CSS/SVG can be added here or complex Particles */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 bg-[size:50px_50px]" />

                <div className="absolute top-[-20%] left-[20%] h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[10%] h-[400px] w-[400px] rounded-full bg-cyan-600/10 blur-[120px] mix-blend-screen" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 flex flex-col items-center">

                {/* 2. Futuristic Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="mb-8 group relative inline-flex items-center overflow-hidden rounded-full border border-purple-500/30 bg-purple-900/10 px-6 py-2 backdrop-blur-md transition-all hover:bg-purple-900/20 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <Sparkles size={14} className="mr-2 text-purple-400" />
                    <span className="text-sm font-medium text-purple-100 tracking-wider uppercase">
                        <ScrambleText text="La Agencia del Futuro" reveal={true} speed={30} />
                    </span>
                </motion.div>

                {/* 3. Main Title with Glitch/Scramble Vibe */}
                <motion.div style={{ y: y1, opacity }} className="relative z-20">
                    <h1 className="relative mx-auto max-w-6xl text-6xl font-bold tracking-tight sm:text-7xl lg:text-8xl leading-tight">
                        <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">Transformamos tu</span>
                        <div className="mt-2 h-[1.2em] overflow-hidden flex justify-center w-full">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={index}
                                    initial={{ y: 80, opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                                    animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    exit={{ y: -80, opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                                    transition={{ duration: 0.6, ease: "anticipate" }}
                                    className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent pb-4 block"
                                >
                                    {WORDS[index]}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </h1>
                </motion.div>

                {/* 4. Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="mx-auto mt-8 max-w-2xl text-lg text-gray-400 sm:text-xl leading-relaxed font-light"
                >
                    Agencia de marketing performance impulsada por <span className="text-cyan-400 font-medium font-mono">INTELIGENCIA ARTIFICIAL</span>.
                    Maximizamos tu ROI con estrategias predictivas y automatización avanzada.
                </motion.p>

                {/* 5. CTAs with Magnetic Effect */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row z-30"
                >
                    <Link href="/contacto">
                        <MagneticButton strength={0.3}>
                            <Button size="lg" className="h-16 px-10 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 group relative overflow-hidden">
                                <span className="relative z-10 flex items-center gap-2">
                                    Iniciar Proyecto <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Button>
                        </MagneticButton>
                    </Link>

                    <Link href="/portfolio">
                        <MagneticButton strength={0.2}>
                            <Button variant="ghost" size="lg" className="h-16 px-10 rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition-all font-medium">
                                Ver Tecnologías
                            </Button>
                        </MagneticButton>
                    </Link>
                </motion.div>

                {/* 6. Code/Terminal Aesthetic Decoration */}
                <motion.div
                    style={{ y: y2 }}
                    className="absolute bottom-10 right-10 hidden lg:flex flex-col gap-2 font-mono text-xs text-white/20 select-none pointer-events-none"
                >
                    <div>{`> SYSTEM.INIT(CORE_V2)`}</div>
                    <div>{`> LOADING_MODULES... [OK]`}</div>
                    <div className="animate-pulse">{`> WAITING_FOR_INPUT_`}</div>
                </motion.div>

            </div>
        </section>
    );
}
