"use client";

import { useState, useEffect } from "react";
import { BarChart2, TrendingUp, Clock, Zap, AlertTriangle, CheckCircle2, Target, Loader2 } from "lucide-react";
import { getKanbanAnalytics } from "@/actions/kanban-tasks";

interface KanbanAnalyticsDashboardProps {
  projectId: string;
}

const COLORS = { TODO: "#64748b", IN_PROGRESS: "#0ea5e9", REVIEW: "#f59e0b", DONE: "#10b981" };
const CFD_COLORS = { done: "#10b981", review: "#f59e0b", inProgress: "#0ea5e9", todo: "#64748b" };

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono text-slate-400 w-6 text-right">{value}</span>
    </div>
  );
}

function VelocityChart({ data }: { data: { week: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const avg = Math.round(data.reduce((s, d) => s + d.count, 0) / data.length);

  return (
    <div>
      <div className="flex items-end gap-1 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-teal-400 font-mono">{d.count}</span>
            <div className="w-full rounded-t-md transition-all duration-700" style={{ height: `${max > 0 ? (d.count / max) * 80 : 4}px`, minHeight: "4px", background: d.count > 0 ? "#10b981" : "#1e293b" }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-xs text-slate-600">{d.week}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <span>Promedio:</span>
        <span className="text-teal-400 font-bold">{avg} tareas/sem</span>
      </div>
    </div>
  );
}

function CumulativeFlow({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => (d.todo + d.inProgress + d.review + d.done)), 1);

  return (
    <div>
      <div className="flex items-end gap-0.5 h-32">
        {data.slice(-10).map((d, i) => {
          const total = d.todo + d.inProgress + d.review + d.done || 1;
          return (
            <div key={i} className="flex-1 flex flex-col rounded-t-sm overflow-hidden" style={{ height: `${(total / max) * 100}%`, minHeight: "4px" }}>
              <div style={{ flex: d.done, background: CFD_COLORS.done }} />
              <div style={{ flex: d.review, background: CFD_COLORS.review }} />
              <div style={{ flex: d.inProgress, background: CFD_COLORS.inProgress }} />
              <div style={{ flex: d.todo, background: CFD_COLORS.todo }} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-0.5 mt-1">
        {data.slice(-10).map((d, i) => (
          <div key={i} className="flex-1 text-center"><span className="text-xs text-slate-700">{d.date.split(" ")[1]}</span></div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {[
          { label: "Completado", color: CFD_COLORS.done },
          { label: "Revisión",   color: CFD_COLORS.review },
          { label: "En Progreso",color: CFD_COLORS.inProgress },
          { label: "Por Hacer",  color: CFD_COLORS.todo },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanAnalyticsDashboard({ projectId }: KanbanAnalyticsDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getKanbanAnalytics(projectId).then(res => {
      if (res.success) setData(res.data);
      setLoading(false);
    });
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-slate-500 text-sm">Sin datos de analytics aún.</div>;
  }

  const statusLabels: Record<string, string> = { TODO: "Por Hacer", IN_PROGRESS: "En Progreso", REVIEW: "En Revisión", DONE: "Completado" };
  const priorityLabels: Record<string, string> = { URGENT: "Urgente", HIGH: "Alta", MEDIUM: "Media", LOW: "Baja" };
  const priorityColors: Record<string, string> = { URGENT: "#f87171", HIGH: "#fbbf24", MEDIUM: "#60a5fa", LOW: "#94a3b8" };
  const maxStatus = Math.max(...Object.values(data.byStatus as Record<string, number>), 1);
  const maxPriority = Math.max(...Object.values(data.byPriority as Record<string, number>), 1);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-slate-500 font-semibold">Total</span>
          </div>
          <p className="text-3xl font-black text-white">{data.total}</p>
          <p className="text-xs text-slate-600 mt-1">tareas</p>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-slate-500 font-semibold">Completadas</span>
          </div>
          <p className="text-3xl font-black text-teal-400">{data.completionRate}%</p>
          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${data.completionRate}%` }} />
          </div>
        </div>
        <div className={`p-4 border rounded-xl ${data.overdue > 0 ? "bg-red-500/5 border-red-500/20" : "bg-slate-900/60 border-slate-800"}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-4 h-4 ${data.overdue > 0 ? "text-red-400" : "text-slate-500"}`} />
            <span className="text-xs text-slate-500 font-semibold">Vencidas</span>
          </div>
          <p className={`text-3xl font-black ${data.overdue > 0 ? "text-red-400" : "text-slate-300"}`}>{data.overdue}</p>
          <p className="text-xs text-slate-600 mt-1">tareas atrasadas</p>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-500 font-semibold">Horas Log</span>
          </div>
          <p className="text-3xl font-black text-purple-400">{data.totalEstimated.toFixed(0)}h</p>
          <p className="text-xs text-slate-600 mt-1">estimadas totales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Status */}
        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-teal-400" /> Por Estado
          </h4>
          <div className="space-y-3">
            {["TODO", "IN_PROGRESS", "REVIEW", "DONE"].map(s => (
              <div key={s}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: COLORS[s as keyof typeof COLORS] }} className="font-medium">{statusLabels[s]}</span>
                </div>
                <MiniBar value={data.byStatus[s] || 0} max={maxStatus} color={COLORS[s as keyof typeof COLORS]} />
              </div>
            ))}
          </div>
        </div>

        {/* By Priority */}
        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Por Prioridad
          </h4>
          <div className="space-y-3">
            {["URGENT","HIGH","MEDIUM","LOW"].map(p => (
              <div key={p}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: priorityColors[p] }} className="font-medium">{priorityLabels[p]}</span>
                </div>
                <MiniBar value={data.byPriority[p] || 0} max={maxPriority} color={priorityColors[p]} />
              </div>
            ))}
          </div>
        </div>

        {/* Velocity */}
        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" /> Velocidad (tareas completadas/semana)
          </h4>
          {data.velocity ? <VelocityChart data={data.velocity} /> : <p className="text-slate-600 text-xs">Sin datos</p>}
        </div>

        {/* Cumulative Flow */}
        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-blue-400" /> Diagrama de Flujo Acumulado (14 días)
          </h4>
          {data.cumulativeFlow ? <CumulativeFlow data={data.cumulativeFlow} /> : <p className="text-slate-600 text-xs">Sin datos</p>}
        </div>
      </div>
    </div>
  );
}
