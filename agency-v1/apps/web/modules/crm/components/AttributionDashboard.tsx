'use client';

import { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
    calculateMultiTouchAttribution,
    calculateCohortLTV,
    AttributionModel,
    Touchpoint
} from '@/lib/crm/attribution-engine';
import {
    PieChart as PieIcon, BarChart3, TrendingUp, DollarSign,
    Layers, Download, RefreshCw, Calendar, Target, Award
} from 'lucide-react';

const MOCK_TOUCHPOINTS: Touchpoint[] = [
    { id: 't1', channel: 'Google Ads', timestamp: '2026-01-01T10:00:00Z', eventType: 'FIRST_VISIT' },
    { id: 't2', channel: 'Meta Ads', timestamp: '2026-01-03T12:00:00Z', eventType: 'LEAD_CAPTURED' },
    { id: 't3', channel: 'Email Campaign', timestamp: '2026-01-07T15:00:00Z', eventType: 'DEMO_SCHEDULED' },
    { id: 't4', channel: 'LinkedIn Ads', timestamp: '2026-01-12T16:00:00Z', eventType: 'OPPORTUNITY_CREATED' },
    { id: 't5', channel: 'Direct', timestamp: '2026-01-18T11:00:00Z', eventType: 'DEAL_WON' },
];

const MOCK_COHORTS = [
    { dealValue: 12000, recurrenceMonths: 12 },
    { dealValue: 25000, recurrenceMonths: 12 },
    { dealValue: 18000, recurrenceMonths: 12 },
    { dealValue: 45000, recurrenceMonths: 12 },
    { dealValue: 30000, recurrenceMonths: 12 },
];

const CHANNEL_COLORS: Record<string, string> = {
    'Google Ads': '#4285F4',
    'Meta Ads': '#0666E5',
    'LinkedIn Ads': '#0A66C2',
    'Email Campaign': '#10B981',
    'Direct': '#8B5CF6',
    'Organic': '#F59E0B',
    'Referral': '#EC4899',
};

export function AttributionDashboard() {
    const [selectedModel, setSelectedModel] = useState<AttributionModel>('W_SHAPED');
    const [totalRevenue, setTotalRevenue] = useState<number>(130000);
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

    // Calculate Attribution
    const attributionShares = useMemo(() => {
        return calculateMultiTouchAttribution(totalRevenue, MOCK_TOUCHPOINTS, selectedModel);
    }, [totalRevenue, selectedModel]);

    // Calculate Cohort LTV
    const cohortLtv = useMemo(() => {
        return calculateCohortLTV('2026-01', MOCK_COHORTS);
    }, []);

    // CSV Export
    const handleExportCSV = () => {
        const headers = ['Canal', 'Revenue Atribuido', 'Porcentaje', 'Puntos de Contacto'];
        const rows = attributionShares.map(s => [s.channel, s.attributedRevenue, `${s.percentage}%`, s.touchpointCount]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `atribucion_multitactil_${selectedModel}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl">
            
            {/* ── Header Controls ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="ds-badge ds-badge-teal">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                            </span>
                            Fase 2 · Atribución Multi-Táctil
                        </span>
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                        Multi-Touch Revenue Attribution & LTV
                    </h2>
                    <p className="font-mono text-xs text-slate-500 mt-0.5">
                        Analiza matemáticamente la contribución exacta de cada canal publicitario al revenue cerrado.
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Model Switcher */}
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
                        {(['W_SHAPED', 'TIME_DECAY', 'LINEAR', 'FIRST_TOUCH', 'LAST_TOUCH'] as AttributionModel[]).map(m => (
                            <button
                                key={m}
                                onClick={() => setSelectedModel(m)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                                    selectedModel === m
                                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {m.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Chart Type Toggle */}
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setChartType('bar')}
                            className={`p-1.5 rounded-md transition-all ${
                                chartType === 'bar' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500'
                            }`}
                        >
                            <BarChart3 size={14} />
                        </button>
                        <button
                            onClick={() => setChartType('pie')}
                            className={`p-1.5 rounded-md transition-all ${
                                chartType === 'pie' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500'
                            }`}
                        >
                            <PieIcon size={14} />
                        </button>
                    </div>

                    {/* Export */}
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-all"
                    >
                        <Download size={13} className="text-teal-400" />
                        <span className="hidden sm:inline">Exportar CSV</span>
                    </button>
                </div>
            </div>

            {/* ── Main Chart Section ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Chart */}
                <div className="lg:col-span-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Layers size={14} className="text-teal-400" /> Distribución de Ingresos por Canal
                        </span>
                        <span className="font-mono text-xs text-teal-400 font-bold">
                            Total Atribuido: ${totalRevenue.toLocaleString()}
                        </span>
                    </div>

                    <div className="w-full h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'bar' ? (
                                <BarChart data={attributionShares}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                    <XAxis dataKey="channel" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }}
                                        formatter={(val: number) => [`$${val.toLocaleString()}`, 'Revenue Atribuido']}
                                    />
                                    <Bar dataKey="attributedRevenue" radius={[6, 6, 0, 0]}>
                                        {attributionShares.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHANNEL_COLORS[entry.channel] || '#0d9488'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            ) : (
                                <PieChart>
                                    <Pie
                                        data={attributionShares}
                                        dataKey="attributedRevenue"
                                        nameKey="channel"
                                        cx="50%" cy="50%"
                                        outerRadius={100}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    >
                                        {attributionShares.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHANNEL_COLORS[entry.channel] || '#0d9488'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }}
                                        formatter={(val: number) => [`$${val.toLocaleString()}`, 'Revenue Atribuido']}
                                    />
                                </PieChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cohort LTV Summary Widget */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                        <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-400" /> Métricas de Cohorte & LTV
                        </span>

                        <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="font-mono text-[10px] text-slate-500 uppercase">Clientes Cohorte Enero</span>
                                <p className="text-2xl font-black text-white">{cohortLtv.customerCount}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="font-mono text-[10px] text-slate-500 uppercase">LTV Promedio Actual</span>
                                <p className="text-2xl font-black text-teal-400">${cohortLtv.avgLtv.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                <span className="font-mono text-[10px] text-slate-500 uppercase">LTV Proyectado (12 Meses)</span>
                                <p className="text-2xl font-black text-emerald-400">${cohortLtv.projected12MonthLtv.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs font-mono text-teal-300">
                        💡 <strong>Insight:</strong> El modelo {selectedModel} muestra que {attributionShares[0]?.channel || 'los canales publicitarios'} lidera la generación de valor.
                    </div>
                </div>
            </div>

            {/* ── Channel Attribution Table Breakdown ── */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                        <tr>
                            <th className="p-3 uppercase">Canal de Marketing</th>
                            <th className="p-3 uppercase text-right">Revenue Atribuido</th>
                            <th className="p-3 uppercase text-right">Participación %</th>
                            <th className="p-3 uppercase text-right">Puntos de Contacto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                        {attributionShares.map(s => (
                            <tr key={s.channel} className="hover:bg-slate-900/40 transition-colors">
                                <td className="p-3 font-bold text-white flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[s.channel] || '#0d9488' }} />
                                    {s.channel}
                                </td>
                                <td className="p-3 text-right font-bold text-teal-400">${s.attributedRevenue.toLocaleString()}</td>
                                <td className="p-3 text-right text-slate-300">{s.percentage}%</td>
                                <td className="p-3 text-right text-slate-400">{s.touchpointCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
