'use client';

import { useState, useEffect } from 'react';
import { getUnifiedInsights, DashboardMetrics } from '@/actions/marketing/analytics';
import { TrendingUp, TrendingDown, DollarSign, MousePointerClick, Eye, ShoppingCart, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const PLATFORM_META: Record<string, { label: string; icon: string; color: string }> = {
    FACEBOOK_ADS: { label: 'Meta Ads', icon: '📘', color: '#1877F2' },
    GOOGLE_ADS: { label: 'Google Ads', icon: '🔍', color: '#EA4335' },
    TIKTOK_ADS: { label: 'TikTok Ads', icon: '🎵', color: '#000000' },
    LINKEDIN_ADS: { label: 'LinkedIn Ads', icon: '💼', color: '#0A66C2' },
};

type DateRange = 'last_7d' | 'last_30d' | 'last_90d';

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#8B5CF6' }: { data: number[]; color?: string }) {
    if (!data || data.length < 2) return <div className="h-8 w-16 bg-white/5 rounded" />;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 64;
    const height = 32;

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="shrink-0">
            <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── METRIC CARD ─────────────────────────────────────────────────────────────
function MetricCard({
    label,
    value,
    icon: Icon,
    trend,
    sub,
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    trend?: number;
    sub?: string;
}) {
    const positive = trend === undefined ? null : trend >= 0;
    return (
        <div className="p-5 bg-white/3 border border-white/8 rounded-xl space-y-3 hover:border-violet-500/30 transition-colors">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
                <div className="w-7 h-7 bg-violet-500/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-violet-400" />
                </div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            {sub && <p className="text-xs text-gray-500">{sub}</p>}
            {trend !== undefined && (
                <div className={cn('flex items-center gap-1 text-xs font-medium', positive ? 'text-emerald-400' : 'text-red-400')}>
                    {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{positive ? '+' : ''}{trend.toFixed(1)}%</span>
                    <span className="text-gray-600 font-normal">vs. período anterior</span>
                </div>
            )}
        </div>
    );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
export function UnifiedMetricsDashboard() {
    const [dateRange, setDateRange] = useState<DateRange>('last_30d');
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, [dateRange]);

    async function fetchMetrics() {
        setLoading(true);
        try {
            const data = await getUnifiedInsights(dateRange);
            setMetrics(data);
        } catch (err) {
            console.error('Failed to fetch metrics:', err);
        } finally {
            setLoading(false);
        }
    }

    const fmt = {
        currency: (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
        number: (n: number) => n.toLocaleString('en-US'),
        pct: (n: number) => `${n.toFixed(2)}%`,
        roas: (n: number) => `${n.toFixed(2)}x`,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Torre de Control</h2>
                    <p className="text-sm text-gray-500">Métricas unificadas de todas las plataformas</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Date Range */}
                    <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                        {(['last_7d', 'last_30d', 'last_90d'] as const).map((r) => (
                            <button
                                key={r}
                                id={`date-range-${r}`}
                                onClick={() => setDateRange(r)}
                                className={cn(
                                    'px-3 py-1.5 rounded text-xs font-medium transition-all',
                                    dateRange === r ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                                )}
                            >
                                {r === 'last_7d' ? '7D' : r === 'last_30d' ? '30D' : '90D'}
                            </button>
                        ))}
                    </div>
                    <Link href="/dashboard/admin/marketing/campaigns/new">
                        <Button id="new-campaign-btn" className="bg-violet-600 hover:bg-violet-500 text-white gap-2 h-9">
                            <Plus className="w-4 h-4" /> Nueva Campaña
                        </Button>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
            ) : metrics ? (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard label="Gasto Total" value={fmt.currency(metrics.totalSpend)} icon={DollarSign} />
                        <MetricCard label="Impresiones" value={fmt.number(metrics.totalImpressions)} icon={Eye} />
                        <MetricCard label="Clicks" value={fmt.number(metrics.totalClicks)} icon={MousePointerClick} sub={`CTR: ${fmt.pct(metrics.avgCtr)}`} />
                        <MetricCard label="Conversiones" value={fmt.number(metrics.totalConversions)} icon={ShoppingCart} sub={`ROAS: ${fmt.roas(metrics.avgRoas)}`} />
                    </div>

                    {/* Platform Breakdown */}
                    {metrics.byPlatform.length > 0 && (
                        <div className="bg-white/3 border border-white/8 rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-white mb-4">Rendimiento por Plataforma</h3>
                            <div className="space-y-3">
                                {metrics.byPlatform.map((p) => {
                                    const meta = PLATFORM_META[p.platform];
                                    const maxSpend = Math.max(...metrics.byPlatform.map(pl => pl.spend));
                                    const pct = maxSpend > 0 ? (p.spend / maxSpend) * 100 : 0;
                                    return (
                                        <div key={p.platform} className="flex items-center gap-4">
                                            <span className="text-lg w-7">{meta?.icon ?? '📊'}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-white">{meta?.label ?? p.platform}</span>
                                                    <span className="text-sm text-gray-400">{fmt.currency(p.spend)}</span>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${pct}%`, backgroundColor: meta?.color ?? '#8B5CF6' }}
                                                    />
                                                </div>
                                                <div className="flex gap-4 mt-1">
                                                    <span className="text-xs text-gray-600">CTR {fmt.pct(p.ctr)}</span>
                                                    <span className="text-xs text-gray-600">CPC {fmt.currency(p.cpc)}</span>
                                                    <span className="text-xs text-gray-600">ROAS {fmt.roas(p.roas)}</span>
                                                </div>
                                            </div>
                                            <Sparkline data={p.spendTrend} color={meta?.color ?? '#8B5CF6'} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Top Campaigns */}
                    {metrics.topCampaigns.length > 0 && (
                        <div className="bg-white/3 border border-white/8 rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-white mb-4">Top Campañas</h3>
                            <div className="space-y-2">
                                {metrics.topCampaigns.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between p-3 bg-white/3 rounded-lg hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span>{PLATFORM_META[c.platform]?.icon ?? '📊'}</span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{c.name}</p>
                                                <p className="text-xs text-gray-500">{c.platform} · {c.status}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-4">
                                            <p className="text-sm font-semibold text-white">{fmt.currency(c.spend)}</p>
                                            <p className="text-xs text-emerald-400">ROAS {fmt.roas(c.roas)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {metrics.byPlatform.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mb-4">
                                <TrendingUp className="w-8 h-8 text-violet-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Sin datos de campaña</h3>
                            <p className="text-gray-500 text-sm mb-6 max-w-xs">
                                Connecta tus plataformas y lanza tu primera campaña para ver métricas aquí.
                            </p>
                            <Link href="/dashboard/admin/marketing/campaigns/new">
                                <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2">
                                    <Plus className="w-4 h-4" /> Crear Primera Campaña
                                </Button>
                            </Link>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}
