import { getCRMReports } from "@/actions/crm-advanced";
import { getFunnelConversionReport, getStagnantDeals } from "@/actions/crm-closing";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TrendingUp, DollarSign, Users, Clock, BarChart3, Trophy, AlertTriangle } from "lucide-react";

const STAGE_LABELS: Record<string, { label: string; color: string; accent: string }> = {
    NEW: { label: "Nuevo", color: "#64748b", accent: "#475569" },
    CONTACTED: { label: "Contactado", color: "#0ea5e9", accent: "#38bdf8" },
    QUALIFIED: { label: "Calificado", color: "#8b5cf6", accent: "#a78bfa" },
    PROPOSAL: { label: "Propuesta", color: "#f59e0b", accent: "#fbbf24" },
    NEGOTIATION: { label: "Negociación", color: "#f97316", accent: "#fb923c" },
    WON: { label: "Ganado", color: "#10b981", accent: "#34d399" },
    LOST: { label: "Perdido", color: "#ef4444", accent: "#f87171" },
};

export default async function ReportsPage() {
    const company = await prisma.company.findFirst();
    if (!company) return (
        <div className="ds-page flex items-center justify-center">
            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">&gt; Empresa no configurada_</p>
        </div>
    );

    const [data, funnelData, stagnantDeals] = await Promise.all([
        getCRMReports(company.id),
        getFunnelConversionReport(company.id).catch(() => []),
        getStagnantDeals(company.id, 7).catch(() => []),
    ]);

    if ("error" in data) return (
        <div className="ds-page flex items-center justify-center">
            <p className="font-mono text-[9px] text-red-500 uppercase tracking-widest">&gt; Error al cargar reportes_</p>
        </div>
    );

    const { revenueByMonth, winRateByMonth, conversionBySource, stageRevenue, salesReps, avgDaysToClose, totalRevenue, totalLeads, totalDeals, winRate } = data;
    const maxRevenue = Math.max(...revenueByMonth.map(r => r.revenue), 1);
    const maxLeads = Math.max(...revenueByMonth.map(r => r.leads), 1);
    const maxFunnelCount = Math.max(...funnelData.filter(f => f.stage !== 'LOST').map(f => f.count), 1);

    const kpis = [
        { label: "Revenue Total", value: `$${(totalRevenue / 1000).toFixed(1)}k`, icon: DollarSign, code: "REV_TOT" },
        { label: "Win Rate", value: `${winRate}%`, icon: TrendingUp, code: "WIN_RT" },
        { label: "Total Leads", value: totalLeads, icon: Users, code: "LDS_TOT" },
        { label: "Días a Cierre", value: avgDaysToClose, icon: Clock, code: "AVG_DYS" },
    ];

    return (
        <div className="ds-page space-y-8">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* Header */}
            <div className="relative z-10 pb-8" style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div className="mb-4">
                    <span className="ds-badge ds-badge-teal">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                        </span>
                        CRM_CORE · REPORTS
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="ds-icon-box w-12 h-12">
                        <BarChart3 className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                        <h1 className="ds-heading-page">Reportes CRM</h1>
                        <p className="ds-subtext mt-2">Análisis de desempeño comercial · Últimos 6 meses</p>
                    </div>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {kpis.map(k => (
                    <div key={k.code} className="ds-kpi group">
                        <span className="absolute top-3 right-3 font-mono text-[8px] text-slate-700 uppercase tracking-widest">[{k.code}]</span>
                        <div className="relative z-10">
                            <div className="ds-icon-box w-9 h-9 mb-3">
                                <k.icon size={14} strokeWidth={1.5} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
                            </div>
                            <p className="ds-stat-value">{k.value}</p>
                            <p className="ds-stat-label">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Revenue by Month */}
                <div className="ds-section">
                    <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em] mb-5">Revenue por Mes</p>
                    <div className="flex items-end gap-2 h-40">
                        {revenueByMonth.map(m => (
                            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                <span className="font-mono text-[8px] font-bold text-teal-400">${(m.revenue / 1000).toFixed(1)}k</span>
                                <div className="w-full rounded-sm bg-gradient-to-t from-teal-600 to-teal-400 transition-all relative overflow-hidden"
                                    style={{ height: `${Math.max((m.revenue / maxRevenue) * 100, 4)}%` }}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_linear_infinite]" />
                                </div>
                                <span className="font-mono text-[7px] text-slate-600 capitalize">{m.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Win Rate Trend */}
                <div className="ds-section">
                    <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em] mb-5">Win Rate por Mes</p>
                    <div className="relative h-40">
                        <svg viewBox="0 0 500 130" className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="winGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            {winRateByMonth.length > 1 && (() => {
                                const pts = winRateByMonth.map((m, i) => ({ x: (i / (winRateByMonth.length - 1)) * 480 + 10, y: 120 - (m.winRate / 100) * 110 }));
                                const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
                                const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},130 L${pts[0].x.toFixed(1)},130 Z`;
                                return (<>
                                    <path d={area} fill="url(#winGrad)" />
                                    <path d={line} fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#14b8a6" />)}
                                </>);
                            })()}
                        </svg>
                        <div className="flex justify-between mt-2">
                            {winRateByMonth.map(m => (
                                <div key={m.month} className="text-center">
                                    <p className="font-mono text-[8px] font-bold text-teal-400">{m.winRate}%</p>
                                    <p className="font-mono text-[7px] text-slate-600 capitalize">{m.month}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Conversion by Source */}
                <div className="ds-section">
                    <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em] mb-5">Conversión por Fuente</p>
                    <div className="space-y-3">
                        {conversionBySource.map(s => (
                            <div key={s.source} className="flex items-center gap-3">
                                <span className="font-mono text-[9px] text-slate-400 w-24 truncate uppercase tracking-widest">{s.source}</span>
                                <div className="flex-1 h-1.5 overflow-hidden" style={{ background: 'rgba(30,41,59,0.8)', borderRadius: 0 }}>
                                    <div className="h-full bg-gradient-to-r from-teal-600 to-teal-400" style={{ width: `${s.rate}%` }} />
                                </div>
                                <span className="font-mono text-[9px] font-bold text-teal-400 w-10 text-right">{s.rate}%</span>
                                <span className="font-mono text-[8px] text-slate-600 w-20 text-right">{s.converted}/{s.total} leads</span>
                            </div>
                        ))}
                        {conversionBySource.length === 0 && (
                            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest text-center py-4">&gt; Sin datos aún_</p>
                        )}
                    </div>
                </div>

                {/* Stage Revenue + Leaderboard */}
                <div className="space-y-5">
                    <div className="ds-section">
                        <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em] mb-4">Pipeline por Etapa</p>
                        <div className="space-y-2">
                            {Object.entries(stageRevenue).map(([stage, value]) => (
                                <div key={stage} className="flex items-center justify-between">
                                    <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">{STAGE_LABELS[stage]?.label ?? stage}</span>
                                    <span className="font-mono font-black text-sm text-slate-100">${(value as number).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="ds-section">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="ds-icon-box w-7 h-7">
                                <Trophy size={12} strokeWidth={1.5} className="text-teal-400" />
                            </div>
                            <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em]">Leaderboard Ventas</p>
                        </div>
                        <div className="space-y-3">
                            {salesReps.map((rep, i) => (
                                <div key={rep.name} className="flex items-center gap-3">
                                    <span className={`w-5 h-5 rounded-sm flex items-center justify-center font-mono text-[8px] font-black ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : "text-orange-400"}`}
                                        style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(30,41,59,0.8)' }}>{i + 1}</span>
                                    <span className="flex-1 font-mono text-[10px] text-slate-300 truncate">{rep.name}</span>
                                    <span className="font-mono text-[9px] text-slate-600">{rep.won} deals</span>
                                    <span className="font-mono font-black text-sm text-teal-400">${(rep.value / 1000).toFixed(1)}k</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Leads Volume */}
            <div className="relative z-10 ds-section">
                <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em] mb-5">Volumen de Leads por Mes</p>
                <div className="flex items-end gap-3 h-32">
                    {revenueByMonth.map(m => (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                            <span className="font-mono text-[8px] font-bold text-teal-400">{m.leads}</span>
                            <div className="w-full rounded-sm bg-gradient-to-t from-sky-700 to-sky-500" style={{ height: `${Math.max((m.leads / maxLeads) * 100, 4)}%` }} />
                            <span className="font-mono text-[7px] text-slate-600 capitalize">{m.month}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* F6: Funnel Conversion Chart */}
            <div className="relative z-10 ds-section">
                <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em] mb-6">Embudo de Conversión por Etapa</p>
                <div className="space-y-4">
                    {funnelData.filter(f => f.stage !== 'LOST').map((f, i) => {
                        const cfg = STAGE_LABELS[f.stage];
                        const barWidth = maxFunnelCount > 0 ? Math.max((f.count / maxFunnelCount) * 100, 2) : 2;
                        return (
                            <div key={f.stage} className="flex items-center gap-4">
                                <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest w-24 shrink-0">{cfg?.label ?? f.stage}</span>
                                <div className="flex-1 relative h-6 flex items-center">
                                    <div className="absolute inset-0 rounded-sm" style={{ background: 'rgba(30,41,59,0.5)' }} />
                                    <div className="relative h-full rounded-sm transition-all duration-700"
                                        style={{ width: `${barWidth}%`, background: `linear-gradient(90deg, ${cfg?.color ?? '#64748b'}, ${cfg?.accent ?? '#94a3b8'})`, boxShadow: `0 0 12px ${cfg?.color ?? '#64748b'}44` }}>
                                        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white/30" />
                                    </div>
                                    <span className="ml-3 font-mono text-[9px] font-black" style={{ color: cfg?.accent ?? '#94a3b8' }}>{f.count} deals</span>
                                </div>
                                <div className="text-right shrink-0 w-32">
                                    <p className="font-mono font-black text-sm text-slate-100">${(f.value / 1000).toFixed(1)}k</p>
                                    {i > 0 && f.conversionRate > 0 && (
                                        <p className="font-mono text-[8px] text-slate-600">→ {f.conversionRate}% conversión</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* F2: Stagnant Deals Alert Table */}
            {stagnantDeals.length > 0 && (
                <div className="relative z-10 ds-section border border-amber-900/30" style={{ background: 'rgba(120,53,15,0.08)' }}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="ds-icon-box w-7 h-7" style={{ background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' }}>
                            <AlertTriangle size={12} className="text-amber-400" />
                        </div>
                        <div>
                            <p className="font-mono text-[9px] font-bold text-amber-500 uppercase tracking-[0.14em]">Deals Estancados · {stagnantDeals.length} alertas</p>
                            <p className="font-mono text-[8px] text-slate-600">Sin actividad por más de 7 días</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {stagnantDeals.slice(0, 8).map(d => {
                            const daysSince = d.lastActivity ? Math.floor((Date.now() - new Date(d.lastActivity).getTime()) / 86400000) : 0;
                            return (
                                <Link key={d.id} href={`/dashboard/admin/crm/deals/${d.id}`}
                                    className="flex items-center gap-3 p-2.5 rounded-lg transition-all hover:bg-amber-900/20"
                                    style={{ border: '1px solid rgba(245,158,11,0.1)' }}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" style={{ boxShadow: '0 0 6px #f59e0b66' }} />
                                    <span className="flex-1 font-mono text-[10px] text-slate-300 truncate">{d.title}</span>
                                    <span className="font-mono text-[9px] font-black" style={{ color: STAGE_LABELS[d.stage]?.color ?? '#64748b' }}>
                                        {STAGE_LABELS[d.stage]?.label ?? d.stage}
                                    </span>
                                    <span className="font-mono font-black text-sm text-teal-400">${(d.value / 1000).toFixed(1)}k</span>
                                    <span className="font-mono text-[9px] font-bold text-amber-500 shrink-0">{daysSince}d ❄️</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
