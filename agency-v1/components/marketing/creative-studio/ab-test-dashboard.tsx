'use client';

import { useEffect, useState } from 'react';
import { getABTestResults, declareWinner, type ABTestResult } from '@/actions/marketing/ab-test-manager';
import Image from 'next/image';
import { Trophy, TrendingUp, Eye, MousePointerClick, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ABTestDashboardProps {
    abTestId: string;
    onWinnerDeclared?: (variantId: string) => void;
}

export function ABTestDashboard({ abTestId, onWinnerDeclared }: ABTestDashboardProps) {
    const [data, setData] = useState<ABTestResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [declaring, setDeclaring] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getABTestResults(abTestId)
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [abTestId]);

    async function handleDeclareWinner(variantId: string) {
        setDeclaring(variantId);
        try {
            await declareWinner(abTestId, variantId);
            onWinnerDeclared?.(variantId);
            setData((prev) => prev ? { ...prev, winnerVariantId: variantId, status: 'COMPLETED' } : prev);
        } finally {
            setDeclaring(null);
        }
    }

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>;
    if (error) return <div className="flex items-center gap-2 text-red-400 py-8"><AlertCircle className="w-4 h-4" />{error}</div>;
    if (!data) return null;

    const sortedVariants = [...data.variants].sort((a, b) => b.ctr - a.ctr);
    const leader = sortedVariants[0];
    const maxImpressions = Math.max(...data.variants.map((v) => v.impressions), 1);

    const STATUS_COLORS: Record<string, string> = {
        DRAFT: 'bg-gray-500/20 text-gray-400',
        ACTIVE: 'bg-emerald-500/20 text-emerald-400',
        PARTIAL: 'bg-amber-500/20 text-amber-400',
        COMPLETED: 'bg-violet-500/20 text-violet-400',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-white text-lg">{data.name}</h3>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block', STATUS_COLORS[data.status] ?? 'bg-gray-500/20 text-gray-400')}>
                        {data.status}
                    </span>
                </div>
                {leader && data.status !== 'COMPLETED' && (
                    <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Líder actual</p>
                        <p className="text-sm font-bold text-white">{leader.name}</p>
                        <p className="text-xs text-emerald-400">{leader.ctr.toFixed(2)}% CTR</p>
                    </div>
                )}
                {data.winnerVariantId && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-300 text-sm font-semibold">
                            Ganador: {data.variants.find((v) => v.id === data.winnerVariantId)?.name}
                        </span>
                    </div>
                )}
            </div>

            {/* Variants comparison */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${data.variants.length}, 1fr)` }}>
                {sortedVariants.map((variant, i) => {
                    const isWinner = variant.id === data.winnerVariantId;
                    const isLeader = variant.id === leader?.id && data.status !== 'COMPLETED';
                    const pct = maxImpressions > 0 ? (variant.impressions / maxImpressions) * 100 : 0;

                    return (
                        <div key={variant.id}
                            className={cn('relative p-4 rounded-2xl border transition-all', isWinner ? 'border-yellow-500/50 bg-yellow-500/5' : isLeader ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/8 bg-white/2')}>

                            {(isWinner || isLeader) && (
                                <div className={cn('absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border', isWinner ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' : 'bg-violet-500/20 border-violet-500/40 text-violet-300')}>
                                    {isWinner ? <Trophy className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                    {isWinner ? 'GANADOR' : `#${i + 1} LÍDER`}
                                </div>
                            )}

                            {/* Asset thumbnail */}
                            {variant.assetUrl && (
                                <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-black/30">
                                    <Image src={variant.assetUrl} alt={variant.name} fill className="object-cover" unoptimized />
                                </div>
                            )}

                            <p className="font-semibold text-white text-sm mb-3">{variant.name}</p>
                            <p className="text-[10px] text-gray-500 mb-3">Peso: {variant.weight}%</p>

                            {/* Metrics */}
                            <div className="space-y-2.5">
                                {[
                                    { icon: <Eye className="w-3 h-3" />, label: 'Impresiones', value: variant.impressions.toLocaleString() },
                                    { icon: <MousePointerClick className="w-3 h-3" />, label: 'CTR', value: `${variant.ctr.toFixed(2)}%`, highlight: isLeader },
                                    { icon: <DollarSign className="w-3 h-3" />, label: 'ROAS', value: `${variant.roas.toFixed(2)}x`, highlight: variant.roas > 1 },
                                ].map((m) => (
                                    <div key={m.label}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="flex items-center gap-1 text-[10px] text-gray-500">{m.icon}{m.label}</span>
                                            <span className={cn('text-xs font-bold', m.highlight ? 'text-emerald-400' : 'text-white')}>{m.value}</span>
                                        </div>
                                        {m.label === 'Impresiones' && (
                                            <div className="h-1 rounded-full bg-white/5">
                                                <div className="h-1 rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Declare winner */}
                            {!data.winnerVariantId && data.status !== 'DRAFT' && (
                                <Button id={`declare-winner-${variant.id}`} size="sm" onClick={() => handleDeclareWinner(variant.id)} disabled={!!declaring}
                                    className={cn('w-full mt-4 h-7 text-xs gap-1', isLeader ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10')}>
                                    {declaring === variant.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trophy className="w-3 h-3" />}
                                    Declarar Ganador
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/8">
                {[
                    { label: 'Total Impresiones', value: data.variants.reduce((a, v) => a + v.impressions, 0).toLocaleString() },
                    { label: 'Total Clicks', value: data.variants.reduce((a, v) => a + v.clicks, 0).toLocaleString() },
                    { label: 'Variantes', value: data.variants.length.toString() },
                ].map((s) => (
                    <div key={s.label} className="text-center">
                        <p className="text-xl font-bold text-white">{s.value}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
