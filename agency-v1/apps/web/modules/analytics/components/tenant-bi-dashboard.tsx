"use client";

/**
 * modules/analytics/components/tenant-bi-dashboard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Nivel 3B: Dashboard de Business Intelligence por Tenant (Interactive Upgrade)
 *
 * Componente cliente interactivo que permite manipular gráficos, filtrar por
 * agentes, fuentes de lead, etapas del embudo y exportar reportes de BI.
 */

import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Minus,
  DollarSign, BarChart3, Users, Trophy,
  Target, Zap, Clock, AlertTriangle,
  Activity, ArrowRight, Filter, Search, Download, RefreshCw, X, Eye
} from "lucide-react";
import type { TenantKpiSnapshot } from "../actions/bi-tenant";

interface Props {
  data: TenantKpiSnapshot;
  companyName?: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString("es-CO")}`;
}

function Trend({ pct }: { pct: number }) {
  if (pct > 0) return (
    <span className="flex items-center gap-0.5 text-emerald-400 font-mono text-xs">
      <TrendingUp size={10} /> +{pct}%
    </span>
  );
  if (pct < 0) return (
    <span className="flex items-center gap-0.5 text-rose-400 font-mono text-xs">
      <TrendingDown size={10} /> {pct}%
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-slate-500 font-mono text-xs">
      <Minus size={10} /> 0%
    </span>
  );
}

function KpiCard({
  icon: Icon, label, value, sub, trend, color = "teal", onClick, isActive = false
}: {
  icon: any; label: string; value: string; sub?: string;
  trend?: number; color?: "teal" | "violet" | "blue" | "emerald";
  onClick?: () => void; isActive?: boolean;
}) {
  const colors = {
    teal:    { bg: "rgba(13,148,136,0.08)",  border: "rgba(13,148,136,0.25)",  text: "text-teal-400" },
    violet:  { bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.25)",  text: "text-violet-400" },
    blue:    { bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.25)",  text: "text-blue-400" },
    emerald: { bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.25)",   text: "text-emerald-400" },
  }[color];

  return (
    <div
      onClick={onClick}
      className={`ds-card group relative overflow-hidden transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
      } ${
        isActive ? 'ring-2 ring-teal-400 shadow-lg shadow-teal-500/20' : ''
      }`}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-slate-500 uppercase tracking-[0.14em] mb-2">{label}</p>
          <p className="text-2xl font-black text-white tracking-tight">{value}</p>
          {sub && <p className="font-mono text-xs text-slate-600 mt-1">{sub}</p>}
          {trend !== undefined && (
            <div className="mt-2">
              <Trend pct={trend} />
            </div>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
          style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
        >
          <Icon size={16} className={colors.text} />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, label, sub }: { icon: any; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="ds-icon-box w-7 h-7">
        <Icon size={13} strokeWidth={1.5} className="text-teal-400" />
      </div>
      <div>
        <p className="font-mono text-xs font-bold text-slate-400 uppercase tracking-[0.14em]">{label}</p>
        {sub && <p className="font-mono text-xs text-slate-600 uppercase tracking-widest mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function TenantBIDashboard({ data, companyName }: Props) {
  // ── Interactive States ──────────────────────────────────────────────────────
  const [selectedAgent, setSelectedAgent] = useState<string>("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<string | null>(null);
  const [forecastView, setForecastView] = useState<"both" | "weighted" | "total">("both");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // ── Filtered Leaderboard & Lead Sources ─────────────────────────────────────
  const filteredLeaderboard = useMemo(() => {
    return data.leaderboard.filter(agent => {
      const matchesAgent = selectedAgent === "ALL" || agent.name === selectedAgent;
      const matchesSearch = !searchTerm || agent.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesAgent && matchesSearch;
    });
  }, [data.leaderboard, selectedAgent, searchTerm]);

  const filteredLeadSources = useMemo(() => {
    return data.leadSources.filter(source => {
      const matchesSource = selectedSource === "ALL" || source.name === selectedSource;
      const matchesSearch = !searchTerm || source.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSource && matchesSearch;
    });
  }, [data.leadSources, selectedSource, searchTerm]);

  // Max calculations for bar rendering
  const maxForecast = Math.max(...data.forecastData.map(d => d.total), 1);
  const maxLeader   = Math.max(...filteredLeaderboard.map(l => l.wonValue), 1);
  const maxSource   = Math.max(...filteredLeadSources.map(s => s.value), 1);

  // Clear all interactive filters
  const resetFilters = () => {
    setSelectedAgent("ALL");
    setSelectedSource("ALL");
    setSelectedFunnelStage(null);
    setSearchTerm("");
  };

  // CSV Export of BI Snapshot Data
  const handleExportBI = () => {
    const csvRows = [
      ['SECCION', 'METRICA/NOMBRE', 'VALOR'],
      ['KPI', 'Revenue Mes Actual', data.revenueCurrentMonth],
      ['KPI', 'Revenue Mes Anterior', data.revenueLastMonth],
      ['KPI', 'Pipeline Activo', data.pipelineValue],
      ['KPI', 'Win Rate', `${data.winRate}%`],
      ['KPI', 'Avg Deal Size', data.avgDealSize],
      ['KPI', 'Avg Days to Close', data.avgDaysToClose],
      ...filteredLeaderboard.map(a => ['Top Agente', a.name, a.wonValue]),
      ...filteredLeadSources.map(s => ['Fuente Lead', s.name, s.value]),
    ];

    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bi_dashboard_${companyName || 'tenant'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters = selectedAgent !== "ALL" || selectedSource !== "ALL" || selectedFunnelStage !== null || searchTerm !== "";

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="ds-badge ds-badge-teal">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
              </span>
              BI · Dashboard Interactivo
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Business Intelligence
            {companyName && <span className="text-teal-400"> — {companyName}</span>}
          </h2>
          <p className="font-mono text-xs text-slate-500 mt-0.5">
            Manipula filtros, etapas del embudo y desgloses de agentes en tiempo real.
          </p>
        </div>

        {/* Goal progress pill */}
        <div
          className="flex flex-col items-end gap-1 px-4 py-2 rounded-sm"
          style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.2)" }}
        >
          <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">Meta mensual</p>
          <p className="font-black text-2xl text-white">{data.goalProgress}%</p>
          <div className="w-32 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700"
              style={{ width: `${data.goalProgress}%` }}
            />
          </div>
          <p className="font-mono text-[10px] text-slate-600">{fmt(data.revenueCurrentMonth)} / {fmt(data.monthlyTarget)}</p>
        </div>
      </div>

      {/* ── Interactive Filter Controls Bar ── */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Agent Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-slate-500 uppercase flex items-center gap-1">
              <Users size={12} className="text-teal-400" /> Agente:
            </span>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs font-mono font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">Todos los Agentes</option>
              {data.leaderboard.map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Lead Source Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-slate-500 uppercase flex items-center gap-1">
              <Target size={12} className="text-teal-400" /> Fuente:
            </span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs font-mono font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">Todas las Fuentes</option>
              {data.leadSources.map(s => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Instant Search Input */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar agente / fuente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:border-teal-500 w-44 placeholder:text-slate-600"
            />
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg transition-all"
            >
              <X size={12} /> Limpiar Filtros
            </button>
          )}
        </div>

        {/* Export Report */}
        <button
          onClick={handleExportBI}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-mono font-bold text-teal-300 transition-all shadow-sm shadow-teal-500/10"
        >
          <Download size={13} />
          <span>Exportar BI (CSV)</span>
        </button>
      </div>

      {/* ── Hero KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={DollarSign} label="Revenue (Mes)" color="emerald"
          value={fmt(data.revenueCurrentMonth)}
          sub={`Anterior: ${fmt(data.revenueLastMonth)}`}
          trend={data.revenueMomPct}
        />
        <KpiCard
          icon={BarChart3} label="Pipeline Activo" color="blue"
          value={fmt(data.pipelineValue)}
          sub={`${data.pipelineCount} oportunidades`}
        />
        <KpiCard
          icon={Users} label="Leads (Mes)" color="violet"
          value={data.leadsThisMonth.toString()}
          sub={`Anterior: ${data.leadsLastMonth}`}
          trend={data.leadsMomPct}
        />
        <KpiCard
          icon={Trophy} label="Win Rate" color="teal"
          value={`${data.winRate}%`}
          sub={`Avg deal: ${fmt(data.avgDealSize)}`}
        />
      </div>

      {/* ── Forecast + Ops Metrics ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Forecast */}
        <div className="ds-card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle icon={TrendingUp} label="Forecast Revenue" sub="Proyección de ingresos" />
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setForecastView("both")}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  forecastView === "both" ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "text-slate-500"
                }`}
              >
                Ambos
              </button>
              <button
                onClick={() => setForecastView("weighted")}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  forecastView === "weighted" ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "text-slate-500"
                }`}
              >
                Ponderado
              </button>
              <button
                onClick={() => setForecastView("total")}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  forecastView === "total" ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "text-slate-500"
                }`}
              >
                Total
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {data.forecastData.map((month) => (
              <div key={month.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-slate-400 uppercase">{month.name}</span>
                  <div className="flex items-center gap-3">
                    {(forecastView === "both" || forecastView === "total") && (
                      <span className="font-mono text-xs text-slate-500">{fmt(month.total)} total</span>
                    )}
                    {(forecastView === "both" || forecastView === "weighted") && (
                      <span className="font-mono text-xs font-bold text-teal-400">{fmt(month.weighted)} pond.</span>
                    )}
                  </div>
                </div>

                {/* Bars */}
                <div className="h-5 rounded-sm bg-slate-800/60 overflow-hidden relative">
                  {(forecastView === "both" || forecastView === "total") && (
                    <div
                      className="h-full bg-slate-700/60 transition-all duration-500"
                      style={{ width: `${Math.round((month.total / maxForecast) * 100)}%` }}
                    />
                  )}
                  {(forecastView === "both" || forecastView === "weighted") && (
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-600/80 to-teal-400/80 transition-all duration-700"
                      style={{ width: `${Math.round((month.weighted / maxForecast) * 100)}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="font-mono text-xs text-slate-500 uppercase">Forecast Total</span>
              <span className="font-black text-lg text-white">{fmt(data.forecastTotal)}</span>
            </div>
          </div>
        </div>

        {/* Ops Metrics */}
        <div className="ds-card space-y-4">
          <SectionTitle icon={Zap} label="Métricas Operativas" />
          {[
            {
              icon: Clock, label: "Días prom. cierre", value: `${data.avgDaysToClose}d`,
              color: data.avgDaysToClose > 60 ? "text-rose-400" : "text-teal-400"
            },
            {
              icon: DollarSign, label: "Avg Deal Size", value: fmt(data.avgDealSize),
              color: "text-teal-400"
            },
            {
              icon: AlertTriangle, label: "Deals estancados", value: data.stagnantDeals.toString(),
              color: data.stagnantDeals > 5 ? "text-amber-400" : "text-slate-400"
            },
            {
              icon: Activity, label: "Actividad 7 días", value: data.recentActivity.toString(),
              color: "text-teal-400"
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <Icon size={12} className="text-slate-500" />
                <span className="font-mono text-xs text-slate-400">{label}</span>
              </div>
              <span className={`font-mono text-xs font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Leaderboard + Lead Sources ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Leaderboard */}
        <div className="ds-card">
          <div className="flex items-center justify-between mb-2">
            <SectionTitle icon={Trophy} label="Top Agentes" sub="Revenue acumulado" />
            <span className="font-mono text-[10px] text-slate-500 uppercase">{filteredLeaderboard.length} agentes</span>
          </div>
          <div className="space-y-2.5">
            {filteredLeaderboard.length === 0 ? (
              <p className="font-mono text-xs text-slate-600 text-center py-6">No coinciden agentes con el filtro</p>
            ) : filteredLeaderboard.map((agent, i) => (
              <div
                key={agent.name}
                onClick={() => setSelectedAgent(selectedAgent === agent.name ? "ALL" : agent.name)}
                className="group/item cursor-pointer p-1.5 rounded-lg hover:bg-slate-900/70 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-600 w-4">#{i + 1}</span>
                    <span className={`text-xs font-bold transition-all ${
                      selectedAgent === agent.name ? "text-teal-300 underline" : "text-slate-200 group-hover/item:text-teal-400"
                    }`}>
                      {agent.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{agent.dealCount} deals</span>
                    <span className="font-mono text-xs font-bold text-teal-400">{fmt(agent.wonValue)}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.round((agent.wonValue / maxLeader) * 100)}%`,
                      background: i === 0
                        ? "linear-gradient(90deg, #f59e0b, #fcd34d)"
                        : i === 1
                          ? "linear-gradient(90deg, #94a3b8, #cbd5e1)"
                          : "linear-gradient(90deg, #0d9488, #34d399)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="ds-card">
          <div className="flex items-center justify-between mb-2">
            <SectionTitle icon={Target} label="Fuentes de Leads" />
            <span className="font-mono text-[10px] text-slate-500 uppercase">{filteredLeadSources.length} fuentes</span>
          </div>
          <div className="space-y-2.5">
            {filteredLeadSources.length === 0 ? (
              <p className="font-mono text-xs text-slate-600 text-center py-6">No coinciden fuentes con el filtro</p>
            ) : filteredLeadSources.map((source) => (
              <div
                key={source.name}
                onClick={() => setSelectedSource(selectedSource === source.name ? "ALL" : source.name)}
                className="group/item cursor-pointer p-1.5 rounded-lg hover:bg-slate-900/70 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold transition-all ${
                    selectedSource === source.name ? "text-teal-300 underline" : "text-slate-300 group-hover/item:text-teal-400"
                  }`}>
                    {source.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{source.value}</span>
                    <span className="font-mono text-xs font-bold text-teal-400">{source.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-700"
                    style={{ width: `${Math.round((source.value / maxSource) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Interactive CRM Funnel ── */}
      <div className="ds-card space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle icon={ArrowRight} label="Embudo CRM Interactivo" sub="Haz clic en una etapa para filtrar" />
          {selectedFunnelStage && (
            <span className="font-mono text-xs text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded">
              Etapa activa: {selectedFunnelStage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.funnel.map((stage, i) => {
            const isSelected = selectedFunnelStage === stage.stage;
            return (
              <div
                key={stage.stage}
                onClick={() => setSelectedFunnelStage(isSelected ? null : stage.stage)}
                className={`relative cursor-pointer transition-all duration-300 hover:scale-[1.03] ${
                  isSelected ? 'ring-2 ring-teal-400' : ''
                }`}
              >
                {i > 0 && (
                  <div className="hidden sm:flex absolute -left-1.5 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight size={12} className="text-slate-700" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-lg text-center transition-all ${
                    isSelected ? 'bg-slate-900 border-teal-500/60 shadow-lg shadow-teal-500/10' : 'bg-slate-950/80 border-slate-800'
                  }`}
                  style={{ border: `1px solid ${isSelected ? stage.color : stage.color + '33'}` }}
                >
                  <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-1">{stage.stage}</p>
                  <p className="text-2xl font-black text-white">{stage.count.toLocaleString()}</p>
                  <div
                    className="text-xs font-bold font-mono mt-1"
                    style={{ color: stage.color }}
                  >
                    {stage.pct}%
                  </div>
                  {/* Mini bar */}
                  <div className="h-1 mt-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${stage.pct}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
