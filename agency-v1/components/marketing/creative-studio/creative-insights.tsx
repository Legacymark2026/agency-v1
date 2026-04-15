'use client';

import { useEffect, useState } from 'react';
import { getCreativeInsights, type CreativeInsight } from '@/actions/marketing/creative-analytics';
import Image from 'next/image';
import { TrendingUp, Award, Target, BarChart3, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORM_LABELS: Record<string, { label: string; color: string }> = {
    FACEBOOK_ADS: { label: 'Meta', color: 'text-blue-400' },
    GOOGLE_ADS: { label: 'Google', color: 'text-yellow-400' },
    TIKTOK_ADS: { label: 'TikTok', color: 'text-pink-400' },
    LINKEDIN_ADS: { label: 'LinkedIn', color: 'text-sky-400' },
};

export function CreativeInsights() {
    const [insights, setInsights] = useState<CreativeInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getCreativeInsights();
            setInsights(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error al cargar');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>;

    if (error) return (
        <div className="text-center py-12">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button type="button" onClick={load} className="text-violet-400 text-xs hover:underline">Reintentar</button>
        </div>
    );

    if (insights.length === 0) return (
        <div className="text-center py-16">
            <BarChart3 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aún no hay suficientes datos de campañas.</p>
            <p className="text-gray-600 text-xs mt-1">Los insights aparecerán cuando tus campañas tengan ad spend registrado.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" /> Análisis de Creativos Ganadores
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Patrones de los assets con mayor ROAS por plataforma</p>
                </div>
                <button type="button" onClick={load} disabled={loading}
                    className="text-gray-500 hover:text-violet-400 transition-colors">
                    <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                </button>
            </div>

            {/* Platform cards */}
            <div className="grid grid-cols-2 gap-4">
                {insights.map((insight) => {
                    const platformMeta = PLATFORM_LABELS[insight.platform] ?? { label: insight.platform, color: 'text-gray-400' };
                    return (
                        <div key={insight.platform}
                            className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4 hover:border-white/15 transition-colors">

                            <div className="flex items-start justify-between">
                                <div>
                                    <p className={cn('font-bold text-sm', platformMeta.color)}>{platformMeta.label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{insight.totalAssets} assets analizados</p>
                                </div>
                                {insight.topAssetUrl && (
                                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                        <Image src={insight.topAssetUrl} alt="Top asset" fill className="object-cover" unoptimized />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <Award className="w-4 h-4 text-yellow-400" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'ROAS Top', value: `${insight.topAssetRoas.toFixed(2)}x`, color: insight.topAssetRoas > 2 ? 'text-emerald-400' : 'text-white' },
                                    { icon: <Target className="w-3.5 h-3.5" />, label: 'CTR Prom.', value: `${insight.avgCtr.toFixed(2)}%`, color: 'text-white' },
                                    { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Win Rate', value: `${insight.winRate.toFixed(0)}%`, color: insight.winRate > 50 ? 'text-emerald-400' : 'text-amber-400' },
                                ].map((m) => (
                                    <div key={m.label} className="text-center bg-white/3 rounded-xl p-2">
                                        <div className="text-gray-500 flex justify-center mb-1">{m.icon}</div>
                                        <p className={cn('text-sm font-bold', m.color)}>{m.value}</p>
                                        <p className="text-[9px] text-gray-600">{m.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Style pattern */}
                            <div className="flex items-center justify-between py-2 px-3 bg-white/3 rounded-lg">
                                <span className="text-xs text-gray-500">Estilo dominante</span>
                                <span className="text-xs font-semibold text-white capitalize px-2 py-0.5 bg-violet-500/20 rounded-full">
                                    {insight.topStylePattern}
                                </span>
                            </div>

                            {/* ROAS bar */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] text-gray-600">ROAS Promedio</span>
                                    <span className="text-[10px] text-gray-400">{insight.avgRoas.toFixed(2)}x</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/5">
                                    <div className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all"
                                        style={{ width: `${Math.min(insight.avgRoas * 20, 100)}%` }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Global tip */}
            {insights.length > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-xs text-amber-300 font-semibold mb-1">💡 Recomendación basada en tus datos</p>
                    <p className="text-xs text-gray-400">
                        Los creativos con estilo "<strong className="text-white">{insights[0]?.topStylePattern}</strong>" tienen el mayor rendimiento en {PLATFORM_LABELS[insights[0]?.platform]?.label}.
                        Úsalo como base para tus próximas generaciones.
                    </p>
                </div>
            )}
        </div>
    );
}
