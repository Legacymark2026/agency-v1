"use client";

import Link from "next/link";
import { ArrowUpRight, TrendingDown, Filter } from "lucide-react";
import { useMemo } from "react";
import { motion } from "framer-motion";

interface FunnelProps { data: { name: string; value: number }[]; }

const STAGE_COLORS = [
    "from-teal-600 to-teal-500",
    "from-teal-500 to-teal-400",
    "from-teal-400 to-emerald-400",
    "from-emerald-400 to-emerald-300",
    "from-emerald-300 to-green-300"
];

export function SalesFunnel({ data }: FunnelProps) {
    const funnelData = useMemo(() => {
        const sorted = [...(data ?? [])].sort((a, b) => b.value - a.value);
        const maxVal = sorted[0]?.value || 1;
        return sorted.map((stage, i) => {
            const next = sorted[i + 1]?.value;
            const drop = next !== undefined ? ((stage.value - next) / stage.value) * 100 : 0;
            return { ...stage, pct: (stage.value / maxVal) * 100, drop: isNaN(drop) ? 0 : drop, hasNext: next !== undefined };
        });
    }, [data]);

    if (!funnelData.length) {
        return (
            <div className="ds-section h-full flex flex-col justify-center items-center">
                <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">&gt; Sin datos de progresión de deals_</p>
            </div>
        );
    }

    return (
        <div className="ds-section h-full flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-5 relative z-10"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div className="flex items-center gap-3">
                    <div className="ds-icon-box w-8 h-8">
                        <Filter size={14} strokeWidth={1.5} className="text-teal-400" />
                    </div>
                    <div>
                        <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Embudo de Ventas</p>
                        <p className="font-mono text-xs text-slate-700 uppercase tracking-widest mt-0.5">Conversión por etapa · Drop-off rate</p>
                    </div>
                </div>
                <Link href="/dashboard/admin/crm/pipeline" className="ds-icon-box w-8 h-8 hover:border-teal-800 transition-all">
                    <ArrowUpRight size={14} strokeWidth={1.5} className="text-slate-500 hover:text-teal-400 transition-colors" />
                </Link>
            </div>

            {/* Funnel bars */}
            <div className="flex-1 space-y-3 relative z-10">
                {funnelData.map((stage, idx) => (
                    <div key={stage.name} className="relative w-full">
                        <div className="flex justify-between items-end mb-1.5">
                            <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest">{stage.name}</span>
                            <span className="font-mono text-sm font-black text-slate-200">{stage.value}</span>
                        </div>

                        {/* Bar track */}
                        <div className="w-full h-7 rounded-sm overflow-visible relative"
                            style={{ background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(30,41,59,0.8)' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(stage.pct, 5)}%` }}
                                transition={{ duration: 1, delay: idx * 0.12, ease: "easeOut" }}
                                className={`h-full bg-gradient-to-r ${STAGE_COLORS[idx % STAGE_COLORS.length]} relative`}
                            >
                                {/* Shimmer */}
                                <motion.div
                                    animate={{ x: ["-100%", "200%"] }}
                                    transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: idx * 0.3 }}
                                    className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                />
                            </motion.div>
                        </div>

                        {/* Drop-off indicator */}
                        {stage.hasNext && stage.drop > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 + idx * 0.1 }}
                                className="absolute -bottom-2 right-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-sm"
                                style={{ background: 'rgba(2,6,23,0.95)', border: '1px solid rgba(239,68,68,0.3)' }}
                            >
                                <TrendingDown className="w-2.5 h-2.5 text-red-400" />
                                <span className="font-mono text-xs font-bold text-red-400">-{stage.drop.toFixed(1)}%</span>
                            </motion.div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
