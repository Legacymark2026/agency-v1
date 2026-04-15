"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import dynamic from 'next/dynamic';
import { ArrowDown, Play } from "lucide-react";

const ParticlesCanvas = dynamic(() => import('./particles-canvas'), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-slate-900/50" />
});
import { useMousePosition } from "@/hooks/use-mouse-position";

export default function ContentHero() {
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const spotlightRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    const mousePos = useMousePosition();

    useEffect(() => {
        setMounted(true);

        const handleMouseMove = () => {
            if (spotlightRef.current) {
                spotlightRef.current.style.left = `${mousePos.current.x - 400}px`;
                spotlightRef.current.style.top = `${mousePos.current.y - 400}px`;
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mousePos]);

    // Only compute window-dependent values client-side after mount
    const springConfig = { damping: 25, stiffness: 150 };
    const rotateX = useSpring(useTransform(scrollY, [0, 500], [0, 5]), springConfig);
    // Use 0 as safe default for SSR — no hydration mismatch
    const rotateY = useSpring(0, springConfig);

    return (
        <div ref={containerRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden neural-bg">
            <ParticlesCanvas />

            {/* Noise Overlay - Light Mode */}
            <div className="noise-overlay"></div>

            {/* Mouse Spotlight - Subtle Teal */}
            <div
                ref={spotlightRef}
                className="absolute w-[800px] h-[800px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply"
                style={{
                    left: mounted ? mousePos.current.x - 400 : -400,
                    top: mounted ? mousePos.current.y - 400 : -400,
                    transition: 'transform 0.05s ease-out'
                }}
            />

            <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="mb-8"
                >
                    <span className="px-5 py-2 rounded-full border border-teal-200 bg-teal-50 text-teal-700 text-xs md:text-sm font-bold tracking-widest uppercase animate-pulse-glow backdrop-blur-md">
                        🚀 Next-Gen Content Studio
                    </span>
                </motion.div>

                <motion.h1
                    className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 via-slate-800 to-teal-900 animate-gradient-x text-glow"
                    style={{ rotateX, rotateY }}
                >
                    Creamos Contenido <br />
                    <span className="text-slate-900 relative inline-block mt-2">
                        <span className="absolute -inset-4 blur-3xl bg-teal-200/50 rounded-full opacity-50"></span>
                        <span className="relative drop-shadow-sm">Que Vende</span>
                    </span>
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-xl md:text-3xl text-slate-600 max-w-3xl mb-12 h-[3rem] font-light"
                >
                    <span className="typewriter-text border-r-4 border-teal-500 pr-3 drop-shadow-sm">
                        Estrategia. Producción. Viralidad.
                    </span>
                </motion.div>

                <motion.div
                    className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center w-full sm:w-auto px-4 sm:px-0"
                    initial={{ opacity: 0.8, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                >
                    <button className="w-full sm:w-auto group relative px-8 sm:px-10 py-4 sm:py-5 bg-slate-900 text-white font-bold text-base sm:text-lg rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-xl shadow-teal-900/10 animate-shimmer">
                        <span className="absolute inset-0 bg-gradient-to-r from-teal-500 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative flex items-center gap-3">
                            Iniciar Proyecto <ArrowDown className="w-5 h-5" />
                        </span>
                    </button>

                    <button className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-teal-300 transition-all flex items-center justify-center gap-4 backdrop-blur-md group shadow-sm bg-white/50">
                        <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                            <Play className="w-5 h-5 text-teal-600 fill-teal-600 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-lg text-slate-700 font-medium">Ver Showreel (1:20)</span>
                    </button>
                </motion.div>

                {/* Floating Stats Cards - Hidden on mobile */}
                <motion.div style={{ y: y1 }} className="absolute -right-10 top-1/4 hidden xl:block z-0 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="glass-card p-6 rounded-3xl w-72 rotate-12 hover:rotate-6 transition-transform duration-700 border-t border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl shadow-teal-900/5">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium text-slate-500">Views Growth</span>
                            <span className="text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-1 rounded">+124% ↗</span>
                        </div>
                        <div className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">2.4M</div>
                        <div className="h-2 w-full bg-slate-100 mt-4 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-teal-400 to-sky-500 w-[78%] relative">
                                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div style={{ y: y2 }} className="absolute -left-20 bottom-1/4 hidden lg:block">
                    <div className="glass-card p-4 rounded-2xl w-56 -rotate-6 hover:rotate-0 transition-transform duration-500 border-t border-white/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-teal-900/5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg text-white">
                                <span className="text-xs font-bold">IG</span>
                            </div>
                            <span className="text-sm font-medium text-slate-700">Viral Post</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">45.2k <span className="text-xs font-normal text-slate-500">Likes</span></div>
                    </div>
                </motion.div>

            </div>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-400 flex flex-col items-center gap-2"
            >
                <span className="text-[10px] uppercase tracking-widest font-medium">Scroll to explore</span>
                <ArrowDown className="w-4 h-4 text-teal-500" />
            </motion.div>
        </div>
    );
}
