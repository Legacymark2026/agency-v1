"use client";

import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useMemo } from "react";
import { Activity, Users, TrendingUp, Server } from "lucide-react";
import { useTranslations } from "next-intl";

// Base stats config without text keys
const STATS_CONFIG = [
    {
        id: "ROI-01",
        key: "roi",
        value: 450,
        suffix: "%",
        icon: TrendingUp
    },
    {
        id: "LDS-02",
        key: "leads",
        value: 12000,
        suffix: "+",
        icon: Users
    },
    {
        id: "CNV-03",
        key: "conversion",
        value: 15,
        suffix: "%",
        icon: Activity
    },
    {
        id: "SCL-04",
        key: "scale",
        value: 85,
        suffix: "+",
        icon: Server
    },
];

function Counter({ value, suffix }: { value: number, suffix: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: "-30%" }); // Requires 70% viewport
    const springValue = useSpring(0, { stiffness: 40, damping: 15, duration: 2500 });

    useEffect(() => {
        if (inView) {
            springValue.set(value);
        }
    }, [inView, value, springValue]);

    const displayValue = useTransform(springValue, (current) => Math.floor(current).toLocaleString());

    return (
        <span className="text-5xl sm:text-6xl lg:text-[5rem] font-black tracking-[-0.04em] text-white flex items-center justify-center font-mono relative z-10 leading-none">
            <motion.span ref={ref}>{displayValue}</motion.span>
            <span className="text-teal-400 ml-2 text-3xl font-light">{suffix}</span>
        </span>
    );
}

export function Stats() {
    const t = useTranslations("home.stats");

    const statsArray = useMemo(() => {
        return STATS_CONFIG.map(s => ({
            ...s,
            label: t(`items.${s.key}.label`),
            desc: t(`items.${s.key}.desc`)
        }));
    }, [t]);

    return (
        <section className="bg-transparent py-20 sm:py-32 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none mix-blend-screen" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
                {/* Section Header */}
                <div className="flex justify-center mb-24">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-teal-900/50 bg-slate-900/60 text-teal-400 text-[10px] font-mono uppercase tracking-widest shadow-sm">
                        <Activity size={12} strokeWidth={1.5} />
                        {t('badge')}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 divide-y lg:divide-y-0 divide-slate-800 lg:divide-x lg:divide-slate-800">
                    {statsArray.map((stat, index) => (
                        <motion.div
                            key={stat.id}
                            className="text-center group relative px-4"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 }}
                        >
                            {/* Hover BG */}
                            <div className="absolute inset-0 bg-slate-900/50 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-sm -inset-x-4 -inset-y-4 z-0 border border-slate-800/50" />

                            <div className="relative z-10 flex flex-col items-center">
                                <div className="mb-8 relative">
                                    <div className="absolute inset-0 bg-teal-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-10 h-10 rounded-sm bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform duration-500 shadow-sm">
                                        <stat.icon className="text-teal-400 w-5 h-5" strokeWidth={1.5} />
                                    </div>
                                </div>

                                <Counter value={stat.value} suffix={stat.suffix} />

                                <div className="mt-6 space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors font-mono">
                                        {stat.label}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                                        [{stat.id}] :: {stat.desc}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
