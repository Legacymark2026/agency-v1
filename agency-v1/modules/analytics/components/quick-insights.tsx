'use client';

import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Insight } from "@/modules/analytics/actions/analytics";

interface QuickInsightsProps {
    data?: Insight[];
}

const iconMap: Record<string, LucideIcon> = {
    'trending-up': TrendingUp,
    'trending-down': TrendingDown,
    'alert': AlertCircle,
    'target': Target,
    'trend-up': TrendingUp,
};

const colorMap: Record<string, { glow: string; text: string; border: string; badge: string }> = {
    emerald: { glow: 'shadow-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', badge: 'bg-emerald-500/15' },
    violet: { glow: 'shadow-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', badge: 'bg-violet-500/15' },
    amber: { glow: 'shadow-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', badge: 'bg-amber-500/15' },
    red: { glow: 'shadow-red-500/10', text: 'text-red-400', border: 'border-red-500/20', badge: 'bg-red-500/15' },
    blue: { glow: 'shadow-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', badge: 'bg-blue-500/15' },
};

export function QuickInsights({ data = [] }: QuickInsightsProps) {
    if (data.length === 0) return null;

    return (
        <div className="ds-card">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
                <div className="ds-icon-box w-7 h-7">
                    <Sparkles size={13} strokeWidth={1.5} className="text-teal-400" />
                </div>
                <div>
                    <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em]">Insights Inteligentes</p>
                    <p className="font-mono text-[8px] text-slate-700 uppercase tracking-widest mt-0.5">Generados por análisis de datos en tiempo real</p>
                </div>
                <span className="ml-auto font-mono text-[8px] text-slate-700 uppercase tracking-widest">[AI_INS]</span>
            </div>

            {/* Insights grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {data.map((insight) => {
                    const Icon = iconMap[insight.iconType] || Sparkles;
                    const colors = colorMap[insight.color] || colorMap.blue;

                    return (
                        <div
                            key={insight.id}
                            className={`group relative p-4 rounded-xl border ${colors.border} bg-slate-900/50 hover:shadow-lg ${colors.glow} transition-all duration-300 backdrop-blur-sm overflow-hidden`}
                        >
                            {/* Top accent */}
                            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent ${colors.text} opacity-30`} />

                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${colors.badge} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-xs mb-1 leading-tight">
                                        {insight.title}
                                    </h4>
                                    <p className={`text-[10px] text-slate-400 leading-relaxed`}>
                                        {insight.description}
                                    </p>
                                    {insight.action && (
                                        <button className={`mt-2 text-[10px] font-black ${colors.text} hover:opacity-80 transition-opacity uppercase tracking-wider`}>
                                            {insight.action} →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
