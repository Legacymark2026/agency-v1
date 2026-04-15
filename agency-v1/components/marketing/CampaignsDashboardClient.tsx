'use client';

import { useState, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Search,
    RefreshCcw,
    Loader2,
    Play,
    Pause,
    ExternalLink,
    Zap,
    TrendingUp,
    DollarSign,
    Target,
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Facebook
} from "lucide-react";
import { syncLiveCampaigns } from '@/actions/marketing';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import {
    AreaChart,
    Area,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import { SmartRulesDrawer } from './SmartRulesDrawer';

interface CampaignData {
    id: string;
    name: string;
    code: string;
    platform: string;
    status: string;
    budget: number | null;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
}

type SortKey = keyof Pick<CampaignData, 'name' | 'spend' | 'conversions' | 'impressions'>;
type SortDir = 'asc' | 'desc';

// We will receive real aggregated data from the server.

export default function CampaignsDashboardClient({ initialCampaigns, serverChartData }: { initialCampaigns: CampaignData[], serverChartData?: any[] }) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>('spend');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
    const [smartRulesCampaign, setSmartRulesCampaign] = useState<CampaignData | null>(null);

    const platforms = ['ALL', ...Array.from(new Set(initialCampaigns.map(c => c.platform)))];

    const filtered = useMemo(() => {
        let list = initialCampaigns.filter(c => {
            const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase());
            const matchPlatform = selectedPlatform === 'ALL' || c.platform === selectedPlatform;
            return matchSearch && matchPlatform;
        });
        list.sort((a, b) => {
            const av = a[sortKey] ?? 0;
            const bv = b[sortKey] ?? 0;
            if (typeof av === 'string' && typeof bv === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
        });
        return list;
    }, [initialCampaigns, searchQuery, selectedPlatform, sortKey, sortDir]);

    // KPI Aggregates
    const totalSpend = initialCampaigns.reduce((s, c) => s + c.spend, 0);
    const totalConversions = initialCampaigns.reduce((s, c) => s + c.conversions, 0);
    const totalImpressions = initialCampaigns.reduce((s, c) => s + c.impressions, 0);
    const blendedCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
    
    // Utilize real server data or fallback to empty array
    const chartData = serverChartData || [];

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await syncLiveCampaigns();
            toast.success(`Synced ${res.syncedCount} campaigns from Meta & Google Ads!`);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to sync campaigns");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const getSortIcon = (key: SortKey) => {
        if (sortKey !== key) return <ChevronsUpDown size={12} className="text-slate-600" />;
        return sortDir === 'asc' ? <ChevronUp size={12} className="text-teal-400" /> : <ChevronDown size={12} className="text-teal-400" />;
    };

    const getPlatformBadge = (platform: string) => {
        if (platform === 'FACEBOOK_ADS') return (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                <Facebook size={13} /> Meta Ads
            </div>
        );
        if (platform === 'GOOGLE_ADS') return (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <Search size={13} /> Google Ads
            </div>
        );
        return <span className="text-xs text-slate-400">{platform}</span>;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE': return (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border font-mono text-[10px] uppercase gap-1">
                    <Play size={9} /> Active
                </Badge>
            );
            case 'PAUSED': return (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 border font-mono text-[10px] uppercase gap-1">
                    <Pause size={9} /> Paused
                </Badge>
            );
            default: return <Badge className="bg-slate-800 text-slate-400 border-slate-700 border font-mono text-[10px]">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-5 p-0">
            {/* === KPI Command Center === */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <KpiCard icon={<DollarSign className="text-teal-400" size={16} />} label="Total Ad Spend" value={`$${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} sub={`${initialCampaigns.filter(c => c.status === 'ACTIVE').length} campañas activas`} color="teal" />
                <KpiCard icon={<Target className="text-indigo-400" size={16} />} label="Total Conversiones" value={totalConversions.toLocaleString()} sub="Leads / Ventas directas" color="indigo" />
                <KpiCard icon={<TrendingUp className="text-amber-400" size={16} />} label="CPA Blended" value={`$${blendedCPA.toFixed(2)}`} sub="Costo prom. por conversión" color="amber" />
                <KpiCard icon={<Search className="text-blue-400" size={16} />} label="Impresiones" value={totalImpressions > 1000 ? `${(totalImpressions / 1000).toFixed(1)}K` : totalImpressions.toString()} sub="Alcance total de anuncios" color="blue" />
            </div>

            {/* === Trend Chart === */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Gasto vs. Conversiones — Últimos 7 Días</h3>
                    <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20"><Zap size={10} /> Live Data Sync</span>
                </div>
                <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradConv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }} itemStyle={{ color: '#e2e8f0' }} />
                            <Area type="monotone" dataKey="spend" name="Gasto ($)" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#gradSpend)" />
                            <Area type="monotone" dataKey="conversions" name="Conversiones" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#gradConv)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* === Toolbar === */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Buscar campañas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-600 w-56 h-9 text-sm"
                        />
                    </div>
                    <div className="flex bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
                        {platforms.map(p => (
                            <button
                                key={p}
                                onClick={() => setSelectedPlatform(p)}
                                className={`px-3 py-1.5 text-xs font-mono transition-colors ${selectedPlatform === p ? 'bg-teal-600 text-white' : 'text-slate-500 hover:text-slate-200'}`}
                            >
                                {p === 'ALL' ? 'Todos' : p.replace('_ADS', '')}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    <Button onClick={handleSync} disabled={isSyncing} className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs h-9 shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                        {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                        Sync API
                    </Button>
                    <Button onClick={() => router.push('/dashboard/marketing/campaigns/new')} className="bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs h-9 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                        <Zap className="mr-2 h-4 w-4" />
                        Lanzar Campaña
                    </Button>
                </div>
            </div>

            {/* === Data Table HUD === */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-800 hover:bg-transparent">
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase tracking-widest py-3">
                                <button onClick={() => handleSort('name')} className="flex items-center gap-1">Campaña {getSortIcon('name')}</button>
                            </TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Plataforma</TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Estado</TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase tracking-widest text-right">Presupuesto</TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase tracking-widest text-right">
                                <button onClick={() => handleSort('spend')} className="flex items-center gap-1 ml-auto">Gasto {getSortIcon('spend')}</button>
                            </TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase tracking-widest text-right">
                                <button onClick={() => handleSort('conversions')} className="flex items-center gap-1 ml-auto">Conv. / CPA {getSortIcon('conversions')}</button>
                            </TableHead>
                            <TableHead className="text-slate-500 font-mono text-[10px] uppercase tracking-widest w-[80px]">Reglas</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-36 text-center text-slate-500 font-mono text-sm">
                                    Sin campañas. Pulsa "Sync API Live" para importar desde Meta/Google.
                                </TableCell>
                            </TableRow>
                        ) : filtered.map((camp) => {
                            const cpa = camp.conversions > 0 ? (camp.spend / camp.conversions) : 0;
                            const pctSpent = camp.budget ? Math.min(100, (camp.spend / camp.budget) * 100) : 0;
                            return (
                                <TableRow key={camp.id} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                                    <TableCell className="py-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-100 truncate max-w-[240px]">{camp.name}</span>
                                            <span className="text-[10px] text-slate-600 font-mono mt-0.5">ID: {camp.code}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getPlatformBadge(camp.platform)}</TableCell>
                                    <TableCell>{getStatusBadge(camp.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs font-mono text-slate-400">{camp.budget ? `$${camp.budget.toFixed(2)}` : '--'}</span>
                                            {camp.budget && (
                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${pctSpent > 85 ? 'bg-red-500' : pctSpent > 60 ? 'bg-amber-500' : 'bg-teal-500'}`}
                                                        style={{ width: `${pctSpent}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm font-bold text-slate-100">
                                        ${camp.spend.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-emerald-400">{camp.conversions}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">CPA: ${cpa.toFixed(2)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-600 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                                            onClick={() => setSmartRulesCampaign(camp)}
                                            title="Smart Rules"
                                        >
                                            <Zap size={15} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Smart Rules Drawer */}
            <SmartRulesDrawer
                open={!!smartRulesCampaign}
                onClose={() => setSmartRulesCampaign(null)}
                campaign={smartRulesCampaign}
            />
        </div>
    );
}

// === KPI Card Helper ===
function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
    const ring: Record<string, string> = {
        teal: 'border-teal-500/20 bg-teal-500/5',
        indigo: 'border-indigo-500/20 bg-indigo-500/5',
        amber: 'border-amber-500/20 bg-amber-500/5',
        blue: 'border-blue-500/20 bg-blue-500/5',
    };
    return (
        <div className={`rounded-xl border p-4 flex flex-col gap-2 ${ring[color]}`}>
            <div className="flex items-center gap-2">
                <div className="bg-slate-950 p-1.5 rounded-md border border-slate-800">{icon}</div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">{label}</span>
            </div>
            <span className="text-2xl font-bold text-slate-100 leading-none">{value}</span>
            <span className="text-[11px] text-slate-500">{sub}</span>
        </div>
    );
}
