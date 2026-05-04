'use client';

import { useMemo } from 'react';
import { Clock, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SLAData {
  status: string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  firstResponseAt?: Date | string | null;
  resolvedAt?: Date | string | null;
  breachedAt?: Date | string | null;
  createdAt: Date | string;
  pausedMinutes?: number;
}

interface SlaBadgeProps {
  sla: SLAData | null | undefined;
  compact?: boolean;
  className?: string;
}

function computeWarning(sla: SLAData): {
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'BREACHED' | 'MET';
  percentage: number;
  minutesLeft: number;
} {
  if (sla.resolvedAt) return { status: 'MET', percentage: 100, minutesLeft: 0 };
  if (sla.breachedAt) return { status: 'BREACHED', percentage: 100, minutesLeft: 0 };

  const minuteLimit = sla.firstResponseAt
    ? sla.resolutionMinutes
    : sla.firstResponseMinutes;

  const elapsed = Math.floor(
    (Date.now() - new Date(sla.createdAt).getTime()) / 60_000
  ) - (sla.pausedMinutes || 0);

  const percentage = Math.round((elapsed / minuteLimit) * 100);
  const minutesLeft = minuteLimit - elapsed;

  let status: 'OK' | 'WARNING' | 'CRITICAL' | 'BREACHED' = 'OK';
  if (percentage >= 100) status = 'BREACHED';
  else if (percentage >= 80) status = 'CRITICAL';
  else if (percentage >= 60) status = 'WARNING';

  return { status, percentage: Math.min(percentage, 100), minutesLeft };
}

const CONFIG = {
  MET:      { label: 'SLA Met',     color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', Icon: CheckCircle2, pulse: false },
  OK:       { label: 'On Track',    color: '#2dd4bf', bg: 'rgba(13,148,136,0.12)', border: 'rgba(13,148,136,0.3)', Icon: Clock,         pulse: false },
  WARNING:  { label: 'SLA Warning', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', Icon: Clock,         pulse: false },
  CRITICAL: { label: 'SLA Critical',color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', Icon: AlertTriangle,  pulse: true  },
  BREACHED: { label: 'SLA Breached',color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)', Icon: Zap,            pulse: true  },
} as const;

function formatMinutes(mins: number): string {
  if (mins <= 0) return 'Now';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function SlaBadge({ sla, compact = false, className }: SlaBadgeProps) {
  const warn = useMemo(() => sla ? computeWarning(sla) : null, [sla]);

  if (!sla || !warn) return null;

  const cfg = CONFIG[warn.status];
  const Icon = cfg.Icon;

  if (compact) {
    return (
      <span
        className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold leading-none', className)}
        style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
        title={cfg.label}
      >
        {cfg.pulse && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: cfg.color }} />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />
          </span>
        )}
        <Icon size={9} />
        {warn.status === 'BREACHED' ? 'BREACH' : warn.status === 'MET' ? 'MET' : formatMinutes(warn.minutesLeft)}
      </span>
    );
  }

  return (
    <div
      className={cn('flex flex-col gap-1.5 p-2.5 rounded-lg border', className)}
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {cfg.pulse && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: cfg.color }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: cfg.color }} />
            </span>
          )}
          <Icon size={11} style={{ color: cfg.color }} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold" style={{ color: cfg.color }}>
          {warn.status === 'BREACHED'
            ? 'BREACHED'
            : warn.status === 'MET'
            ? 'CLOSED'
            : `${formatMinutes(warn.minutesLeft)} left`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${warn.percentage}%`,
            background: `linear-gradient(to right, ${cfg.color}80, ${cfg.color})`,
          }}
        />
      </div>

      {/* Sub info */}
      <div className="flex justify-between text-[9px] font-mono" style={{ color: cfg.color, opacity: 0.7 }}>
        <span>FRT: {sla.firstResponseMinutes}m</span>
        <span>RES: {sla.resolutionMinutes}m</span>
      </div>
    </div>
  );
}
