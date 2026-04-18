"use client";

import Link from "next/link";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { CRM_CURRENCY_FORMATTER } from "@/lib/crm-charts-config";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface ForecastData { name: string; weighted: number; total: number; }
interface RevenueForecastProps { data: ForecastData[]; }

const TOOLTIP_STYLE = {
    backgroundColor: 'rgba(2,6,23,0.95)',
    border: '1px solid rgba(30,41,59,0.8)',
    borderRadius: '0',
    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
    fontFamily: 'ui-monospace, monospace',
    fontSize: '11px',
    color: '#f8fafc',
};

export function RevenueForecast({ data }: RevenueForecastProps) {
    if (!data || data.length === 0) {
        return (
            <div className="ds-section h-full flex flex-col">
                <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Forecast de Ingresos</p>
                <div className="flex-1 flex items-center justify-center">
                    <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">&gt; Sin datos para proyección_</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ds-section h-full flex flex-col relative overflow-hidden group">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-2 relative z-10"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div className="flex items-center gap-3">
                    <div className="ds-icon-box w-8 h-8">
                        <TrendingUp size={14} strokeWidth={1.5} className="text-teal-400" />
                    </div>
                    <div>
                        <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Forecast Mensual</p>
                        <p className="font-mono text-xs text-slate-700 uppercase tracking-widest mt-0.5">Proyección 3 meses — Probable vs Total</p>
                    </div>
                </div>
                <Link href="/dashboard/admin/crm/pipeline"
                    className="ds-icon-box w-8 h-8 hover:border-teal-800 hover:text-teal-400 transition-all">
                    <ArrowUpRight size={14} strokeWidth={1.5} className="text-slate-500 hover:text-teal-400" />
                </Link>
            </div>

            {/* Chart */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 relative z-10 mt-2"
                style={{ minHeight: 280 }}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradWeighted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#475569" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(30,41,59,0.6)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10}
                            style={{ fontSize: '9px', fontFamily: 'ui-monospace, monospace', fontWeight: 700, fill: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }} />
                        <YAxis axisLine={false} tickLine={false} dx={-10}
                            tickFormatter={(v) => `$${v / 1000}k`}
                            style={{ fontSize: '9px', fontFamily: 'ui-monospace, monospace', fontWeight: 600, fill: '#334155' }} />
                        <Tooltip
                            formatter={(value: any) => CRM_CURRENCY_FORMATTER.format(Number(value))}
                            contentStyle={TOOLTIP_STYLE}
                            itemStyle={{ fontWeight: 700, color: '#14b8a6' }}
                            labelStyle={{ color: '#64748b', fontWeight: 600, marginBottom: 4 }}
                        />
                        <Area type="monotone" dataKey="total" name="Máximo Potencial"
                            stroke="#334155" strokeWidth={1.5} strokeDasharray="5 5"
                            fillOpacity={1} fill="url(#gradTotal)" animationDuration={1500} />
                        <Area type="monotone" dataKey="weighted" name="Probable (Weighted)"
                            stroke="#14b8a6" strokeWidth={2}
                            fillOpacity={1} fill="url(#gradWeighted)" animationDuration={2000} />
                    </AreaChart>
                </ResponsiveContainer>
            </motion.div>
        </div>
    );
}
