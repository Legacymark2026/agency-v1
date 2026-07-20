'use client';

import { useState, useMemo } from 'react';
import {
    AreaChart, Area, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrafficDataPoint } from '@/modules/analytics/actions/analytics';
import { RechartsTooltipProps, RechartsPayload } from '@/types/recharts';
import { BarChart2, TrendingUp, Layers, Download, Eye, Users, MousePointer, Filter } from 'lucide-react';

interface TrafficChartProps {
    data?: TrafficDataPoint[];
}

type ChartType = 'area' | 'line' | 'bar' | 'stacked';

const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl space-y-2">
                <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
                    {label}
                </p>
                {payload.map((entry: RechartsPayload, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-xs font-mono">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-300">{entry.name}:</span>
                        </div>
                        <span className="font-bold text-white">
                            {entry.value?.toLocaleString() || 0}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function TrafficChart({ data = [] }: TrafficChartProps) {
    const [chartType, setChartType] = useState<ChartType>('area');
    const [visibleMetrics, setVisibleMetrics] = useState({
        users: true,
        sessions: true,
        pageViews: false,
    });
    const [selectedRange, setSelectedRange] = useState<number>(30);

    // Transform & Filter Data based on selected range
    const filteredRawData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.slice(-selectedRange);
    }, [data, selectedRange]);

    const chartData = useMemo(() => {
        if (filteredRawData.length === 0) {
            return [{ name: 'Sin datos', users: 0, sessions: 0, pageViews: 0 }];
        }
        return filteredRawData.map(d => ({
            name: new Date(d.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
            users: d.visitors,
            sessions: d.sessions,
            pageViews: d.pageViews
        }));
    }, [filteredRawData]);

    // Live Totals for HUD Summary Pills
    const totals = useMemo(() => {
        return filteredRawData.reduce((acc, curr) => ({
            users: acc.users + (curr.visitors || 0),
            sessions: acc.sessions + (curr.sessions || 0),
            pageViews: acc.pageViews + (curr.pageViews || 0),
        }), { users: 0, sessions: 0, pageViews: 0 });
    }, [filteredRawData]);

    const toggleMetric = (metric: 'users' | 'sessions' | 'pageViews') => {
        setVisibleMetrics(prev => {
            const updated = { ...prev, [metric]: !prev[metric] };
            // Prevent deselecting all metrics
            if (!updated.users && !updated.sessions && !updated.pageViews) {
                return prev;
            }
            return updated;
        });
    };

    // CSV Data Export
    const handleExportCSV = () => {
        if (chartData.length === 0) return;
        const headers = ['Fecha/Dia', 'Usuarios', 'Sesiones', 'Vistas de Pagina'];
        const rows = chartData.map(row => [row.name, row.users, row.sessions, row.pageViews]);
        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `trafico_analytics_${selectedRange}d.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">

            {/* ── Interactive Controls Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                
                {/* Metric Series Toggles */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mr-1">
                        <Filter size={12} className="text-teal-400" /> Series:
                    </span>
                    <button
                        onClick={() => toggleMetric('users')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                            visibleMetrics.users
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                                : 'bg-slate-950 text-slate-500 border border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                    >
                        <Users size={12} />
                        Usuarios ({totals.users.toLocaleString()})
                    </button>
                    <button
                        onClick={() => toggleMetric('sessions')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                            visibleMetrics.sessions
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                                : 'bg-slate-950 text-slate-500 border border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                    >
                        <MousePointer size={12} />
                        Sesiones ({totals.sessions.toLocaleString()})
                    </button>
                    <button
                        onClick={() => toggleMetric('pageViews')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                            visibleMetrics.pageViews
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                                : 'bg-slate-950 text-slate-500 border border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                    >
                        <Eye size={12} />
                        Vistas ({totals.pageViews.toLocaleString()})
                    </button>
                </div>

                {/* Controls: Chart Type, Time Filter & Export */}
                <div className="flex items-center gap-2">
                    
                    {/* Time Window Selector */}
                    <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
                        {[7, 14, 30, 90].map(days => (
                            <button
                                key={days}
                                onClick={() => setSelectedRange(days)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                                    selectedRange === days
                                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {days}D
                            </button>
                        ))}
                    </div>

                    {/* Chart Type Selector */}
                    <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
                        <button
                            onClick={() => setChartType('area')}
                            title="Gráfico de Área"
                            className={`p-1.5 rounded-md transition-all ${
                                chartType === 'area' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <TrendingUp size={14} />
                        </button>
                        <button
                            onClick={() => setChartType('line')}
                            title="Gráfico de Líneas"
                            className={`p-1.5 rounded-md transition-all ${
                                chartType === 'line' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <BarChart2 size={14} className="rotate-90" />
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            title="Gráfico de Barras"
                            className={`p-1.5 rounded-md transition-all ${
                                chartType === 'bar' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <BarChart2 size={14} />
                        </button>
                        <button
                            onClick={() => setChartType('stacked')}
                            title="Barras Apiladas"
                            className={`p-1.5 rounded-md transition-all ${
                                chartType === 'stacked' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <Layers size={14} />
                        </button>
                    </div>

                    {/* CSV Export */}
                    <button
                        onClick={handleExportCSV}
                        title="Exportar datos a CSV"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-all"
                    >
                        <Download size={13} className="text-teal-400" />
                        <span className="hidden sm:inline">Exportar</span>
                    </button>
                </div>
            </div>

            {/* ── Interactive Recharts Rendering ── */}
            <div className="w-full h-[360px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val.toLocaleString()} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="circle" />
                            {visibleMetrics.users && (
                                <Area type="monotone" dataKey="users" stroke="#a855f7" strokeWidth={2.5} fill="url(#colorUsers)" name="Usuarios" animationDuration={1000} />
                            )}
                            {visibleMetrics.sessions && (
                                <Area type="monotone" dataKey="sessions" stroke="#06b6d4" strokeWidth={2.5} fill="url(#colorSessions)" name="Sesiones" animationDuration={1000} />
                            )}
                            {visibleMetrics.pageViews && (
                                <Area type="monotone" dataKey="pageViews" stroke="#10b981" strokeWidth={2.5} fill="url(#colorPageViews)" name="Vistas de Página" animationDuration={1000} />
                            )}
                        </AreaChart>
                    ) : chartType === 'line' ? (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val.toLocaleString()} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="circle" />
                            {visibleMetrics.users && (
                                <Line type="monotone" dataKey="users" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} activeDot={{ r: 7 }} name="Usuarios" animationDuration={1000} />
                            )}
                            {visibleMetrics.sessions && (
                                <Line type="monotone" dataKey="sessions" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} activeDot={{ r: 7 }} name="Sesiones" animationDuration={1000} />
                            )}
                            {visibleMetrics.pageViews && (
                                <Line type="monotone" dataKey="pageViews" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 7 }} name="Vistas de Página" animationDuration={1000} />
                            )}
                        </LineChart>
                    ) : (
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val.toLocaleString()} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="circle" />
                            {visibleMetrics.users && (
                                <Bar dataKey="users" fill="#a855f7" radius={[4, 4, 0, 0]} name="Usuarios" stackId={chartType === 'stacked' ? 'a' : undefined} animationDuration={1000} />
                            )}
                            {visibleMetrics.sessions && (
                                <Bar dataKey="sessions" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Sesiones" stackId={chartType === 'stacked' ? 'a' : undefined} animationDuration={1000} />
                            )}
                            {visibleMetrics.pageViews && (
                                <Bar dataKey="pageViews" fill="#10b981" radius={[4, 4, 0, 0]} name="Vistas de Página" stackId={chartType === 'stacked' ? 'a' : undefined} animationDuration={1000} />
                            )}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>

        </div>
    );
}
