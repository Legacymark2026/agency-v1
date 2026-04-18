'use client';

import { DollarSign, MousePointerClick, TrendingUp, Users, Eye } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

interface MetricsProps {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    cpa: number;
}

const CARDS = [
    { key: 'spend', label: 'Total Ad Spend', icon: DollarSign, code: 'AD_SPN', accent: 'teal' },
    { key: 'impressions', label: 'Total Impressions', icon: Eye, code: 'IMP_TOT', accent: 'slate' },
    { key: 'clicks', label: 'Total Clicks', icon: MousePointerClick, code: 'CLK_TOT', accent: 'amber' },
    { key: 'cpa', label: 'Avg. CPA', icon: TrendingUp, code: 'CPA_AVG', accent: 'teal' },
] as const;

function MetricCard({ label, value, subtext, icon: Icon, code, delay, isFeatured }: {
    label: string; value: string; subtext: string;
    icon: any; code: string; delay: number; isFeatured?: boolean;
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
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
                style={{ background: useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, rgba(45,212,191,0.05), transparent 80%)` }}
            />

            <span className="absolute top-3 right-3 font-mono text-xs text-slate-700 uppercase tracking-widest group-hover:text-slate-500 transition-colors">[{code}]</span>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">{label}</p>
                    <div className="ds-icon-box w-8 h-8">
                        <Icon size={13} strokeWidth={1.5} className={`${isFeatured ? 'text-teal-400' : 'text-slate-500 group-hover:text-teal-400'} transition-colors`} />
                    </div>
                </div>
                <p className="ds-stat-value">{value}</p>
                <p className="ds-mono-label mt-2">{subtext}</p>
            </div>
        </motion.div>
    );
}

export default function CampaignMetricsCards({ metrics }: { metrics: MetricsProps }) {
    const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
    const num = (v: number) => new Intl.NumberFormat('en-US').format(v);

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Ad Spend" value={fmt(metrics.totalSpend)} subtext="Live · Meta & Google" icon={DollarSign} code="AD_SPN" delay={0} isFeatured />
            <MetricCard label="Total Impressions" value={num(metrics.totalImpressions)} subtext="Across all networks" icon={Eye} code="IMP_TOT" delay={0.08} />
            <MetricCard label="Total Clicks" value={num(metrics.totalClicks)} subtext="Aggregated live" icon={MousePointerClick} code="CLK_TOT" delay={0.16} />
            <MetricCard label={`Avg. CPA (${num(metrics.totalConversions)} leads)`}
                value={fmt(metrics.cpa)} subtext="Cost per acquisition" icon={TrendingUp} code="CPA_AVG" delay={0.24} isFeatured />
        </div>
    );
}
