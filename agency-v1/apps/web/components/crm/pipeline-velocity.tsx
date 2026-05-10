'use client';

import { Zap, TrendingUp, ArrowRight, Clock } from 'lucide-react';

interface Deal {
  value: number;
  stage: string;
  probability?: number;
  createdAt?: string | Date;
}

interface PipelineVelocityProps {
  deals: Deal[];
}

function calcVelocity(deals: Deal[]) {
  const active = deals.filter(d => d.stage !== 'WON' && d.stage !== 'LOST');
  const won = deals.filter(d => d.stage === 'WON');

  const dealCount = active.length;
  const winRate = deals.length > 0 ? won.length / deals.length : 0;
  const avgValue = deals.length > 0
    ? deals.reduce((s, d) => s + (d.value || 0), 0) / deals.length
    : 0;

  // Average sales cycle from creation to won — default 30 days if no won deals
  let avgCycleDays = 30;
  if (won.length > 0) {
    const cycles = won
      .filter(d => d.createdAt)
      .map(d => {
        const ms = Date.now() - new Date(d.createdAt!).getTime();
        return ms / (1000 * 60 * 60 * 24);
      });
    if (cycles.length > 0) avgCycleDays = cycles.reduce((s, c) => s + c, 0) / cycles.length;
  }

  const velocity = avgCycleDays > 0
    ? (dealCount * winRate * avgValue) / avgCycleDays
    : 0;

  return {
    velocity: Math.round(velocity),
    dealCount,
    winRate: Math.round(winRate * 100),
    avgValue: Math.round(avgValue),
    avgCycleDays: Math.round(avgCycleDays),
  };
}

export function PipelineVelocity({ deals }: PipelineVelocityProps) {
  const { velocity, dealCount, winRate, avgValue, avgCycleDays } = calcVelocity(deals);

  const metrics = [
    { label: 'Deals Activos', value: dealCount.toString(), code: 'DLS' },
    { label: 'Win Rate', value: `${winRate}%`, code: 'WIN' },
    { label: 'Valor Promedio', value: `$${avgValue.toLocaleString()}`, code: 'AVG' },
    { label: 'Ciclo (días)', value: `${avgCycleDays}d`, code: 'CYC' },
  ];

  return (
    <div className="ds-section relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="ds-icon-box w-9 h-9">
            <Zap className="w-4 h-4 text-teal-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest">Pipeline Velocity</p>
            <p className="text-xs text-slate-600 mt-0.5">Ingresos generados por día</p>
          </div>
        </div>
        <span className="font-mono text-xs text-slate-700 uppercase tracking-widest">[VEL_CORE]</span>
      </div>

      {/* Main velocity number */}
      <div className="flex items-end gap-3 mb-6">
        <div>
          <p className="text-5xl font-black text-white tracking-tight">
            ${velocity.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-xs font-bold text-teal-400"
              style={{ background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.25)' }}>
              <TrendingUp className="w-3 h-3" />
              por día
            </span>
            <span className="text-xs text-slate-500 font-mono">basado en ciclo actual</span>
          </div>
        </div>
      </div>

      {/* Velocity Formula Visualization */}
      <div className="flex items-center gap-2 mb-6 p-3 rounded-lg overflow-x-auto"
        style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(30,41,59,0.8)' }}>
        {[
          { label: 'Deals', val: dealCount },
          { op: '×' },
          { label: 'Win%', val: `${winRate}%` },
          { op: '×' },
          { label: 'Valor', val: `$${avgValue.toLocaleString()}` },
          { op: '÷' },
          { label: 'Ciclo', val: `${avgCycleDays}d` },
        ].map((item, i) =>
          'op' in item ? (
            <span key={i} className="text-slate-600 font-mono text-sm shrink-0">{item.op}</span>
          ) : (
            <div key={i} className="text-center shrink-0">
              <p className="font-mono text-xs font-bold text-white">{item.val}</p>
              <p className="font-mono text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">{item.label}</p>
            </div>
          )
        )}
        <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 ml-auto" />
        <div className="text-center shrink-0">
          <p className="font-mono text-sm font-black text-teal-400">${velocity}/día</p>
        </div>
      </div>

      {/* Sub-metrics */}
      <div className="grid grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.code} className="text-center p-3 rounded-lg"
            style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.6)' }}>
            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">[{m.code}]</p>
            <p className="font-bold text-white text-lg mt-1">{m.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
