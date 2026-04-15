"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MouseEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Sparkles, Target, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

function MagneticButton({ children, className }: { children: React.ReactNode, className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current?.getBoundingClientRect() || { height: 0, width: 0, left: 0, top: 0 };
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        setPosition({ x: middleX * 0.1, y: middleY * 0.1 });
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    const { x, y } = position;
    return (
        <motion.div
            style={{ position: "relative" }}
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x, y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        >
            <div className={className}>{children}</div>
        </motion.div>
    );
}

export function CorporateHero() {
    const t = useTranslations("nosotrosPage.hero");

    // Mouse Interaction
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth Mouse for Parallax
    const springConfig = { damping: 25, stiffness: 150 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

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

    return (
        <div
            className="relative min-h-[90vh] w-full flex items-center justify-center bg-slate-950 overflow-hidden group perspective-[2000px]"
            onMouseMove={handleMouseMove}
        >
            {/* 0. QUANTUM GRID (Dark Mode) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -inset-[100%] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 animate-grid-flow transform-gpu perspective-3d rotate-x-60 title-grid" style={{ transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)' }} />
            </div>

            {/* 1. Global Spotlight Follower */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-10"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(20, 184, 166, 0.15),
              transparent 80%
            )
          `,
                }}
            />

            <div className="container relative z-20 px-4 md:px-6 pt-20">
                <div className="flex flex-col items-center text-center space-y-8">

                    {/* 3. Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative"
                    >
                        <span className="relative inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-teal-400 shadow-sm uppercase tracking-wider">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            {t('badge')}
                        </span>
                    </motion.div>

                    {/* 4. Main Headline */}
                    <div className="max-w-5xl space-y-6 relative">
                        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-4 sm:mb-6 relative z-10 leading-[0.9]">
                            <span className="block mb-2 drop-shadow-sm text-slate-500 font-thin text-4xl md:text-6xl tracking-widest uppercase">
                                {t('titleStart')}
                            </span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 animate-gradient-x font-mono relative">
                                {t('titleHighlight')}
                            </span>
                        </h1>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mx-auto max-w-3xl relative"
                        >
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-500 to-transparent hidden md:block" />
                            <p className="text-lg md:text-xl text-slate-400 leading-relaxed text-pretty font-medium pl-6 text-left border-l-2 border-teal-500/20 md:border-none">
                                {t.rich('description', {
                                    highlight: (chunks) => (
                                        <span className="text-teal-400 font-bold">{chunks}</span>
                                    ),
                                })}
                            </p>
                        </motion.div>
                    </div>

                    {/* Buttons with Magnetic Effect */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pt-4 pb-8 w-full sm:w-auto px-4 sm:px-0"
                    >
                        <MagneticButton>
                            <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-base sm:text-lg transition-all shadow-xl shadow-teal-500/20 relative overflow-hidden group">
                                <span className="relative flex items-center gap-2">
                                    {t('btnPrimary')} <Zap className="w-5 h-5 text-slate-900 group-hover:scale-110 transition-transform" />
                                </span>
                            </Button>
                        </MagneticButton>

                        <MagneticButton>
                            <Button variant="ghost" size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all group relative overflow-hidden">
                                <span className="flex items-center gap-2 relative z-10 font-semibold">
                                    <Play className="w-4 h-4 fill-current" /> {t('btnSecondary')}
                                </span>
                            </Button>
                        </MagneticButton>
                    </motion.div>

                    {/* 5. Metrics / Trust */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 pt-12 border-t border-slate-800 w-full max-w-4xl"
                    >
                        {[
                            { label: t("stats.precision.label"), icon: Target, value: t("stats.precision.value") },
                            { label: t("stats.innovation.label"), icon: Sparkles, value: t("stats.innovation.value") },
                            { label: t("stats.speed.label"), icon: Zap, value: t("stats.speed.value") },
                            { label: t("stats.impact.label"), icon: ActivityIcon, value: t("stats.impact.value") },
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 group cursor-default">
                                <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl group-hover:bg-slate-800 group-hover:border-teal-500/30 transition-colors duration-300">
                                    <stat.icon className="w-6 h-6 text-slate-500 group-hover:text-teal-400 transition-colors" />
                                </div>
                                <div className="font-bold text-2xl text-white">{stat.value}</div>
                                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>

                </div>
            </div>

            {/* 7. Bottom Haze (Dark) */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20 pointer-events-none" />
        </div>
    );
}

function ActivityIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}
