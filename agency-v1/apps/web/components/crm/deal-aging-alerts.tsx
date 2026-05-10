'use client';

import { AlertTriangle, Flame, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number;
  probability?: number;
  updatedAt?: string | Date;
  createdAt?: string | Date;
}

interface DealAgingAlertsProps {
  deals: Deal[];
}

const STAGE_LABELS: Record<string, string> = {
  LEAD: 'Lead',
  QUALIFIED: 'Calificado',
  PROPOSAL: 'Propuesta',
  NEGOTIATION: 'Negociación',
  WON: 'Ganado',
  LOST: 'Perdido',
};

function daysSince(date?: string | Date): number {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export function DealAgingAlerts({ deals: rawDeals }: DealAgingAlertsProps) {
  const active = rawDeals.filter(d => d.stage !== 'WON' && d.stage !== 'LOST');

  // Stagnant: 14+ days without update
  const stagnant = active
    .filter(d => daysSince(d.updatedAt) >= 14)
    .sort((a, b) => daysSince(b.updatedAt) - daysSince(a.updatedAt))
    .slice(0, 5);

  // Hot & abandoned: high probability but 7+ days without update
  const hotAbandoned = active
    .filter(d => (d.probability || 0) >= 70 && daysSince(d.updatedAt) >= 7)
    .sort((a, b) => (b.probability || 0) - (a.probability || 0))
    .slice(0, 5);

  const totalAlerts = stagnant.length + hotAbandoned.length;

  if (totalAlerts === 0) {
    return (
      <div className="ds-section">
        <div className="flex items-center gap-3 mb-4">
          <div className="ds-icon-box w-9 h-9">
            <AlertTriangle className="w-4 h-4 text-teal-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest">Deal Aging Alerts</p>
          </div>
          <span className="ml-auto font-mono text-xs text-slate-700">[AGE_MON]</span>
        </div>
        <div className="py-8 text-center">
          <p className="font-mono text-xs text-teal-500">✓ Pipeline saludable — sin deals estancados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-section relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="ds-icon-box w-9 h-9" style={{ borderColor: 'rgba(251,191,36,0.4)' }}>
            <AlertTriangle className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest">Deal Aging Alerts</p>
            <p className="text-xs text-slate-600 mt-0.5">Requieren atención inmediata</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-sm font-mono text-xs font-black text-amber-400"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
            {totalAlerts} alertas
          </span>
          <span className="font-mono text-xs text-slate-700">[AGE_MON]</span>
        </div>
      </div>

      {/* Hot & Abandoned Section */}
      {hotAbandoned.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <p className="font-mono text-[10px] font-bold text-orange-400 uppercase tracking-widest">
              Deals Calientes Abandonados ({hotAbandoned.length})
            </p>
          </div>
          <div className="space-y-2">
            {hotAbandoned.map(deal => {
              const days = daysSince(deal.updatedAt);
              return (
                <div key={deal.id}
                  className="flex items-center justify-between p-3 rounded-lg group transition-all"
                  style={{ background: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.2)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-200 truncate">{deal.title}</p>
                      <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                        {STAGE_LABELS[deal.stage] || deal.stage} · ${deal.value.toLocaleString()} · {deal.probability}% prob.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="font-mono text-xs font-bold text-orange-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {days}d
                    </span>
                    <Link href={`/dashboard/admin/crm/deals/${deal.id}`}
                      className="p-1 rounded text-slate-600 hover:text-teal-400 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stagnant Deals Section */}
      {stagnant.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <p className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Estancados &gt;14 días ({stagnant.length})
            </p>
          </div>
          <div className="space-y-2">
            {stagnant.map(deal => {
              const days = daysSince(deal.updatedAt);
              const urgency = days >= 30 ? 'rgba(239,68,68,0.15)' : 'rgba(30,41,59,0.5)';
              const urgencyBorder = days >= 30 ? 'rgba(239,68,68,0.3)' : 'rgba(30,41,59,0.8)';
              return (
                <div key={deal.id}
                  className="flex items-center justify-between p-3 rounded-lg transition-all"
                  style={{ background: urgency, border: `1px solid ${urgencyBorder}` }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-slate-500" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-300 truncate">{deal.title}</p>
                      <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                        {STAGE_LABELS[deal.stage] || deal.stage} · ${deal.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className={`font-mono text-xs font-bold flex items-center gap-1 ${days >= 30 ? 'text-red-400' : 'text-slate-400'}`}>
                      <Clock className="w-3 h-3" />
                      {days}d
                    </span>
                    <Link href={`/dashboard/admin/crm/deals/${deal.id}`}
                      className="p-1 rounded text-slate-600 hover:text-teal-400 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
