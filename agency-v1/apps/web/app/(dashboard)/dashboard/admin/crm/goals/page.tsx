import { prisma } from "@/lib/prisma";
import { getSalesGoalsDashboard } from "@/actions/crm-goals";
import { Target, TrendingUp, Users, DollarSign, Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { GoalFormClient } from "./GoalFormClient";

export default async function SalesGoalsPage() {
    const company = await prisma.company.findFirst();
    if (!company) return <div className="ds-page flex items-center justify-center"><p className="font-mono text-xs text-slate-600 uppercase tracking-widest">Empresa no configurada</p></div>;

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dashboard = await getSalesGoalsDashboard(company.id, period);

    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });

    return (
        <div className="ds-page space-y-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between pb-6" style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <span className="ds-badge ds-badge-teal mb-3 inline-flex">
                        <span className="relative flex h-1.5 w-1.5 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" /></span>
                        CRM_CORE · SALES GOALS
                    </span>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-11 h-11"><Target className="w-5 h-5 text-teal-400" /></div>
                        <div>
                            <h1 className="ds-heading-page">Metas de Ventas</h1>
                            <p className="ds-subtext mt-1">Seguimiento de cuotas por vendedor · {period}</p>
                        </div>
                    </div>
                </div>
                <GoalFormClient companyId={company.id} period={period} teamUsers={dashboard.teamUsers} />
            </div>

            {/* Global KPI */}
            <div className="relative z-10 grid grid-cols-3 gap-4">
                {[
                    { label: "Won Este Mes", value: `$${(dashboard.totalWon / 1000).toFixed(1)}k`, icon: DollarSign, color: "text-teal-400" },
                    { label: "Metas Activas", value: dashboard.goals.length, icon: Target, color: "text-violet-400" },
                    { label: "Reps con Meta", value: dashboard.goals.filter(g => g.userId).length, icon: Users, color: "text-sky-400" },
                ].map(k => (
                    <div key={k.label} className="ds-kpi group">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">{k.label}</p>
                            <div className="ds-icon-box w-7 h-7"><k.icon size={12} strokeWidth={1.5} className={k.color} /></div>
                        </div>
                        <p className="ds-stat-value">{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Goals Cards */}
            <div className="relative z-10 space-y-4">
                <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Progreso Individual · {period}</p>
                {dashboard.goals.length === 0 ? (
                    <div className="ds-section flex items-center justify-center h-32">
                        <div className="text-center">
                            <Target size={24} className="text-slate-700 mx-auto mb-3" />
                            <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">Sin metas configuradas para {period}</p>
                            <p className="font-mono text-xs text-slate-700 mt-1">Click en "Nueva Meta" para agregar</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {dashboard.goals.map(goal => {
                            const pct = goal.progressPct;
                            const isOver = pct >= 100;
                            const isWarning = pct < 50 && pct > 0;
                            return (
                                <div key={goal.id} className="ds-section">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-black text-white flex-shrink-0"
                                                style={{ background: 'linear-gradient(135deg, #0d9488, #0ea5e9)' }}>
                                                {(goal.user?.name ?? "?")[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-mono text-xs font-bold text-slate-200">{goal.user?.name ?? "Meta Global"}</p>
                                                <p className="font-mono text-xs text-slate-600">{goal.label ?? goal.period}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono font-black text-sm text-slate-100">${(goal.wonAmount / 1000).toFixed(1)}k <span className="text-slate-600 font-normal">/ ${(goal.targetAmount / 1000).toFixed(1)}k</span></p>
                                            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 font-mono text-xs font-bold rounded-sm ${isOver ? 'text-teal-400' : isWarning ? 'text-amber-400' : 'text-slate-400'}`}
                                                style={{ background: isOver ? 'rgba(13,148,136,0.1)' : isWarning ? 'rgba(245,158,11,0.1)' : 'rgba(100,116,139,0.1)', border: `1px solid ${isOver ? 'rgba(13,148,136,0.3)' : isWarning ? 'rgba(245,158,11,0.3)' : 'rgba(100,116,139,0.3)'}` }}>
                                                {isOver ? '🎯 ' : ''}{pct}%
                                            </span>
                                        </div>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,0.8)' }}>
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${Math.min(pct, 100)}%`,
                                                background: isOver ? 'linear-gradient(90deg, #0d9488, #34d399)' : isWarning ? 'linear-gradient(90deg, #d97706, #fbbf24)' : 'linear-gradient(90deg, #0ea5e9, #6366f1)',
                                                boxShadow: isOver ? '0 0 8px rgba(13,148,136,0.5)' : undefined,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
