"use client";

import { DollarSign, Briefcase, TrendingUp, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";

function useCountUp(end: number, duration: number = 1500) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let startTime: number | null = null;
        let frame: number;
        const animate = (ts: number) => {
            if (!startTime) startTime = ts;
            const pct = Math.min((ts - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - pct, 4);
            setCount(end * ease);
            if (pct < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [end, duration]);
    return count;
}

interface StatsProps {
    stats: {
        pipelineValue: number;
        activeDeals: number;
        winRate: number;
        avgDealSize: number;
    }
}

const CARDS = [
    { key: "pipeline", title: "Pipeline Total", icon: DollarSign, code: "PIP_VAL", trendKey: "+20.1%", up: true },
    { key: "deals", title: "Deals Activos", icon: Briefcase, code: "ACT_DEL", trendKey: "+5 esta sem.", up: true },
    { key: "winrate", title: "Win Rate", icon: Target, code: "WIN_PCT", trendKey: "+2.4%", up: true },
    { key: "avg", title: "Ticket Promedio", icon: TrendingUp, code: "AVG_DL", trendKey: "-1.2%", up: false },
] as const;

function KPICard({ title, value, trend, up, icon: Icon, code, delay }: {
    title: string; value: string; trend: string; up: boolean;
    icon: any; code: string; delay: number;
}) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    function onMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onMouseMove={onMove}
            className="ds-kpi group relative"
        >
            {/* Flashlight — home TechCard style */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
                style={{ background: useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, rgba(45,212,191,0.05), transparent 80%)` }}
            />

            {/* Code tag */}
            <span className="absolute top-3 right-3 font-mono text-xs text-slate-700 uppercase tracking-widest group-hover:text-slate-500 transition-colors">[{code}]</span>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">{title}</p>
                    <div className="ds-icon-box w-9 h-9">
                        <Icon size={15} strokeWidth={1.5} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
                    </div>
                </div>

                <p className="ds-stat-value">{value}</p>

                <div className="flex items-center gap-2 mt-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-bold rounded-sm border ${up
                        ? 'bg-teal-950/50 text-teal-400 border-teal-900/50'
                        : 'bg-red-950/50 text-red-400 border-red-900/50'
                        }`}>
                        {up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                        {trend}
                    </span>
                    <span className="text-xs font-mono text-slate-600 uppercase tracking-widest">vs mes ant.</span>
                </div>
            </div>
        </motion.div>
    );
}

export function KPICards({ stats }: StatsProps) {
    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    const pipe = useCountUp(stats.pipelineValue);
    const deals = useCountUp(stats.activeDeals);
    const win = useCountUp(stats.winRate);
    const avg = useCountUp(stats.avgDealSize);

    const values = [fmt.format(pipe), Math.floor(deals).toString(), `${Math.floor(win)}%`, fmt.format(avg)];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CARDS.map((c, i) => (
                <KPICard
                    key={c.key}
                    title={c.title}
                    value={values[i]}
                    trend={c.trendKey}
                    up={c.up}
                    icon={c.icon}
                    code={c.code}
                    delay={i * 0.08}
                />
            ))}
        </div>
    );
}
