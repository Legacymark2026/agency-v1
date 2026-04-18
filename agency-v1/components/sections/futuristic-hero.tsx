"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MouseEvent, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Activity, Wifi, ShieldCheck, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";

const GLITCH_MSGS = ["INNOVATION", "DISRUPTION", "EVOLUTION", "DOMINATION", "GROWTH"];

export function FuturisticHero() {
    const t = useTranslations("home.hero");
    // Mouse Interaction
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth Mouse for Parallax
    const springConfig = { damping: 25, stiffness: 150 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    // Parallax Transforms
    const rotateX = useTransform(springY, [-0.5, 0.5], [5, -5]); // Reduced rotation for cleaner feel
    const rotateY = useTransform(springX, [-0.5, 0.5], [-5, 5]);
    const layer1X = useTransform(springX, [-0.5, 0.5], [-20, 20]);
    const layer1Y = useTransform(springY, [-0.5, 0.5], [-20, 20]);
    const layer2X = useTransform(springX, [-0.5, 0.5], [-40, 40]);
    const layer2Y = useTransform(springY, [-0.5, 0.5], [-40, 40]);

    function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
        const { width, height } = e.currentTarget.getBoundingClientRect();
        const x = e.clientX / width - 0.5;
        const y = e.clientY / height - 0.5;

        const { left, top } = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);

        springX.set(x);
        springY.set(y);
    }

    // Text Glitch Effect
    const [glitchText, setGlitchText] = useState("Digital");
    const [glitchIndex, setGlitchIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (glitchIndex + 1) % GLITCH_MSGS.length;
            setGlitchIndex(nextIndex);
            let steps = 0;
            const glitchInterval = setInterval(() => {
                setGlitchText(prev => prev.split('').map(() => String.fromCharCode(65 + Math.random() * 26)).join(''));
                steps++;
                if (steps > 5) {
                    clearInterval(glitchInterval);
                    setGlitchText(GLITCH_MSGS[nextIndex]);
                }
            }, 50);

        }, 4000);
        return () => clearInterval(interval);
    }, [glitchIndex]);

    return (
        <div
            className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 overflow-hidden group perspective-[2000px] pt-12"
            onMouseMove={handleMouseMove}
        >
            {/* 0. QUANTUM GRID (Dark Mode) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Dark/Teal Grid on Slate */}
                <div className="absolute -inset-[100%] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 animate-grid-flow transform-gpu perspective-3d rotate-x-60 title-grid" style={{ transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)' }} />
            </div>

            {/* 1. Global Spotlight Follower (Subtle Shadow/Highlight) */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-10"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(13, 148, 136, 0.03),
              transparent 80%
            )
          `,
                }}
            />

            {/* 2. HUD Overlay Elements (Teal Text on Dark) */}
            <div className="absolute top-24 left-8 hidden lg:flex flex-col gap-2 pointer-events-none z-20">
                <div className="flex items-center gap-2 text-xs font-mono text-teal-400 uppercase tracking-widest border border-teal-900/50 px-2 py-1 bg-slate-900/80 backdrop-blur-sm rounded-sm shadow-sm">
                    <Wifi size={10} className="animate-pulse text-teal-500" /> NET: SECURE
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-teal-400 uppercase tracking-widest border border-teal-900/50 px-2 py-1 bg-slate-900/80 backdrop-blur-sm rounded-sm shadow-sm">
                    <Activity size={10} className="text-teal-500" /> SYS: OPTIMAL
                </div>
            </div>

            <div className="container relative z-20 px-4 md:px-6 pt-16 sm:pt-20">
                <div className="flex flex-col items-center text-center space-y-8 sm:space-y-10">

                    {/* 3. Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="relative hidden sm:block"
                    >
                        <span className="relative inline-flex items-center gap-2 rounded-full border border-teal-900/50 bg-slate-900/60 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-teal-50 shadow-sm uppercase tracking-widest font-mono">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            <span className="text-teal-400">{t('systemActive')}</span> {t('systemStatus')}
                        </span>
                    </motion.div>

                    {/* 4. Main Headline (Dark Text) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-6xl space-y-6 sm:space-y-8 relative w-full"
                    >
                        {/* Ambient Glow behind text */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-teal-400/10 blur-[100px] rounded-full pointer-events-none animate-pulse" />

                        <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[7.5rem] font-black tracking-[-0.04em] text-white mb-6 sm:mb-8 relative z-10 leading-[0.85]">
                            <span className="block mb-2 drop-shadow-sm text-white">
                                {t('titleStart')}
                            </span>
                            <div className="flex justify-center items-center gap-3 sm:gap-5 flex-wrap">
                                <span className="text-2xl sm:text-4xl md:text-6xl font-mono uppercase tracking-widest align-super font-light text-slate-400">{t('titleHighlight')}</span>
                                <span className="font-mono relative tracking-tight text-transparent bg-clip-text bg-[linear-gradient(110deg,#0d9488,45%,#34d399,55%,#0d9488)] bg-[length:200%_100%] animate-[shine_3s_linear_infinite]">
                                    {glitchText}
                                </span>
                            </div>
                        </h1>
                        <p className="mx-auto max-w-2xl text-base md:text-lg text-slate-400 leading-relaxed text-pretty font-light uppercase tracking-widest font-mono relative z-10">
                            {t('subtitle')}
                        </p>
                    </motion.div>

                    {/* 5. Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-6 sm:mt-8 w-full sm:w-auto relative z-10"
                    >
                        <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 rounded-sm bg-slate-900 hover:bg-slate-800 border-none text-white font-bold text-sm sm:text-base transition-all duration-300 shadow-[0_0_40px_-10px_rgba(13,148,136,0.3)] hover:shadow-[0_0_60px_-15px_rgba(13,148,136,0.5)] relative overflow-hidden group">
                            {/* Animated Sweep Shimmer Effect */}
                            <div className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] group-hover:animate-[shimmer_1.5s_infinite]" />
                            <span className="relative z-10 flex items-center gap-2 uppercase tracking-wider font-mono">
                                Iniciar Protocolo <Rocket className="w-4 h-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 text-teal-400" strokeWidth={1.5} />
                            </span>
                        </Button>

                        <Button variant="ghost" size="lg" aria-label={t('ctaSecondary')} className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 rounded-sm border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:text-slate-900 transition-all group relative overflow-hidden font-mono uppercase tracking-wider text-sm">
                            <span className="flex items-center gap-2 relative z-10">
                                <Play className="w-4 h-4 fill-current" aria-hidden="true" strokeWidth={1.5} /> {t('ctaSecondary')}
                            </span>
                        </Button>
                    </motion.div>

                    {/* 6. 3D Parallax Dashboard - Hidden on mobile for performance */}
                    <div className="w-full max-w-6xl mt-12 sm:mt-20 perspective-[2000px] relative z-10 group/dashboard hidden sm:block">
                        <motion.div
                            style={{ rotateX, rotateY }}
                            className="relative aspect-[16/9] md:aspect-[21/9] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Layer 0: Grid Background */}
                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />

                            {/* Layer 1: Base UI */}
                            <motion.div style={{ x: layer1X, y: layer1Y }} className="absolute inset-0 p-8 flex flex-col justify-between">
                                {/* Header */}
                                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                    </div>
                                    <div className="font-mono text-xs text-slate-400">DASHBOARD_V4.2.0_STABLE</div>
                                </div>
                                {/* Footer Graph Lines (Teal) */}
                                <div className="flex gap-1 items-end h-16 opacity-30">
                                    {[40, 60, 35, 80, 50, 90, 20, 70, 45, 60, 80, 50].map((h, i) => (
                                        <div key={i} className="flex-1 bg-teal-500 rounded-t-sm" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </motion.div>

                            {/* Layer 2: Floating Cards */}
                            <motion.div style={{ x: layer2X, y: layer2Y }} className="absolute inset-0 pointer-events-none">
                                {/* Card 1: Activity */}
                                <div className="absolute top-1/4 left-1/4 -translate-x-1/2 p-4 rounded-xl bg-white border border-gray-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] max-w-xs transform hover:scale-105 transition-transform duration-300 pointer-events-auto cursor-help">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600"><Activity size={18} /></div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">Rendimiento</div>
                                            <div className="text-lg font-bold text-slate-900">+245%</div>
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-teal-500 w-[75%]" />
                                    </div>
                                </div>

                                {/* Card 2: Code Snippet */}
                                <div className="absolute top-1/3 right-1/4 translate-x-1/2 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl max-w-xs hidden md:block transform hover:scale-105 transition-transform duration-300 pointer-events-auto">
                                    <div className="font-mono text-xs text-emerald-400 leading-tight">
                                        <p>{"> initializing_core..."}</p>
                                        <p>{"> loading_modules [OK]"}</p>
                                        <p className="animate-pulse">{"> awaiting_user_input_"}</p>
                                    </div>
                                </div>

                                {/* Card 3: Security Badge */}
                                <div className="absolute bottom-1/4 left-1/3 p-3 rounded-lg bg-white border border-teal-100 flex items-center gap-3 shadow-lg">
                                    <ShieldCheck size={16} className="text-teal-600" />
                                    <span className="text-xs font-bold text-slate-700">ENCRYPTED</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                </div>
            </div>

            {/* 7. Bottom Haze (Dark) */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20 pointer-events-none" />

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 opacity-70">
                <span className="font-mono text-xs tracking-widest uppercase">Scroll</span>
                <div className="w-px h-8 bg-slate-300 relative overflow-hidden">
                    <motion.div
                        className="absolute top-0 left-0 w-full h-full bg-slate-600"
                        animate={{ y: ["-100%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                </div>
            </div>
        </div>
    );
}
