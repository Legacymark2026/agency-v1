"use client";

/**
 * modules/analytics/components/tenant-bi-dashboard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Nivel 3B: Dashboard de Business Intelligence por Tenant
 *
 * Componente cliente que renderiza los KPIs del snapshot de BI del tenant.
 * Diseñado para el sistema HUD (Slate-950 + Teal) de LegacyMark.
 *
 * SECCIONES:
 *  1. Hero KPIs   — Revenue, Pipeline, Leads, Win Rate (4 tarjetas)
 *  2. Forecast    — Barras de 3 meses (weighted vs total)
 *  3. Leaderboard — Top agentes por revenue
 *  4. Lead Sources — Distribución por fuente
 *  5. Funnel      — Leads → Oportunidades → Pipeline → Ganados
 *  6. Métricas ops — Avg Deal Size, Avg Days Close, Stagnant, Activity
 */

import {
  TrendingUp, TrendingDown, Minus,
  DollarSign, BarChart3, Users, Trophy,
  Target, Zap, Clock, AlertTriangle,
  Activity, ArrowRight,
} from "lucide-react";
import type { TenantKpiSnapshot } from "../actions/bi-tenant";

interface Props {
  data: TenantKpiSnapshot;
  companyName?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Subcomponents ─────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, trend, color = "teal"
}: {
  icon: any; label: string; value: string; sub?: string;
  trend?: number; color?: "teal" | "violet" | "blue" | "emerald";
}) {
  const colors = {
    teal:    { bg: "rgba(13,148,136,0.08)",  border: "rgba(13,148,136,0.25)",  text: "text-teal-400" },
    violet:  { bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.25)",  text: "text-violet-400" },
    blue:    { bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.25)",  text: "text-blue-400" },
    emerald: { bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.25)",   text: "text-emerald-400" },
  }[color];

  return (
    <div className="ds-card group relative overflow-hidden">
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

// ── Main Component ─────────────────────────────────────────────────────────────

export function TenantBIDashboard({ data, companyName }: Props) {
  const maxForecast = Math.max(...data.forecastData.map(d => d.total), 1);
  const maxLeader   = Math.max(...data.leaderboard.map(l => l.wonValue), 1);
  const maxSource   = Math.max(...data.leadSources.map(s => s.value), 1);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="ds-badge ds-badge-teal">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
              </span>
              BI · Live Data
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Business Intelligence
            {companyName && <span className="text-teal-400"> — {companyName}</span>}
          </h2>
          <p className="font-mono text-xs text-slate-600 mt-0.5">
            Cache actualizado cada 5 min · {new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
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
        <div className="ds-card lg:col-span-2">
          <SectionTitle icon={TrendingUp} label="Forecast Revenue" sub="Weighted por probabilidad" />
          <div className="space-y-3">
            {data.forecastData.map((month) => (
              <div key={month.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-slate-400 uppercase">{month.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-500">{fmt(month.total)} total</span>
                    <span className="font-mono text-xs font-bold text-teal-400">{fmt(month.weighted)} pond.</span>
                  </div>
                </div>
                {/* Total bar */}
                <div className="h-5 rounded-sm bg-slate-800/60 overflow-hidden relative">
                  <div
                    className="h-full bg-slate-700/60 transition-all duration-500"
                    style={{ width: `${Math.round((month.total / maxForecast) * 100)}%` }}
                  />
                  {/* Weighted overlay */}
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-600/80 to-teal-400/80 transition-all duration-700"
                    style={{ width: `${Math.round((month.weighted / maxForecast) * 100)}%` }}
                  />
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
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={12} className="text-slate-600" />
                <span className="font-mono text-xs text-slate-500">{label}</span>
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
          <SectionTitle icon={Trophy} label="Top Agentes" sub="Revenue acumulado" />
          <div className="space-y-2.5">
            {data.leaderboard.length === 0 ? (
              <p className="font-mono text-xs text-slate-600 text-center py-6">No hay datos de agentes aún</p>
            ) : data.leaderboard.map((agent, i) => (
              <div key={agent.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-600 w-4">#{i + 1}</span>
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[140px]">{agent.name}</span>
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
          <SectionTitle icon={Target} label="Fuentes de Leads" />
          <div className="space-y-2.5">
            {data.leadSources.length === 0 ? (
              <p className="font-mono text-xs text-slate-600 text-center py-6">No hay datos de fuentes aún</p>
            ) : data.leadSources.map((source) => (
              <div key={source.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-300">{source.name}</span>
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

      {/* ── CRM Funnel ── */}
      <div className="ds-card">
        <SectionTitle icon={ArrowRight} label="Embudo CRM" sub="Leads → Ganados" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.funnel.map((stage, i) => (
            <div key={stage.stage} className="relative">
              {i > 0 && (
                <div className="hidden sm:flex absolute -left-1.5 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight size={12} className="text-slate-700" />
                </div>
              )}
              <div
                className="p-3 rounded-sm text-center"
                style={{ background: "rgba(15,23,42,0.8)", border: `1px solid ${stage.color}22` }}
              >
                <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-1">{stage.stage}</p>
                <p className="text-xl font-black text-white">{stage.count.toLocaleString()}</p>
                <div
                  className="text-xs font-bold font-mono mt-1"
                  style={{ color: stage.color }}
                >
                  {stage.pct}%
                </div>
                {/* Mini bar */}
                <div className="h-0.5 mt-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${stage.pct}%`, backgroundColor: stage.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
