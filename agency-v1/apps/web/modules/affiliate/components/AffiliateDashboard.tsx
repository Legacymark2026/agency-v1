import type { AffiliateStats } from '../types';
import {
    MousePointerClick, Users, DollarSign, TrendingUp,
    Clock, CheckCircle2, XCircle, ArrowUpRight
} from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
    accent?: 'teal' | 'amber' | 'rose' | 'emerald' | 'violet';
    trend?: string;
}

const ACCENT_STYLES = {
    teal:    { border: 'rgba(13,148,136,0.25)',  bg: 'rgba(13,148,136,0.06)',  text: '#2dd4bf', glow: 'rgba(13,148,136,0.08)' },
    amber:   { border: 'rgba(245,158,11,0.25)',  bg: 'rgba(245,158,11,0.06)',  text: '#fbbf24', glow: 'rgba(245,158,11,0.08)' },
    rose:    { border: 'rgba(244,63,94,0.25)',   bg: 'rgba(244,63,94,0.06)',   text: '#fb7185', glow: 'rgba(244,63,94,0.08)' },
    emerald: { border: 'rgba(52,211,153,0.25)',  bg: 'rgba(52,211,153,0.06)',  text: '#34d399', glow: 'rgba(52,211,153,0.08)' },
    violet:  { border: 'rgba(139,92,246,0.25)',  bg: 'rgba(139,92,246,0.06)', text: '#a78bfa', glow: 'rgba(139,92,246,0.08)' },
};

function StatCard({ label, value, sub, icon, accent = 'teal', trend }: StatCardProps) {
    const a = ACCENT_STYLES[accent];
    return (
        <div className="relative rounded-sm p-5 transition-all duration-200 hover:scale-[1.01]"
            style={{ background: 'rgba(2,6,23,0.8)', border: `1px solid ${a.border}` }}>
            <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg,transparent,${a.text}40,transparent)` }} />
            <div className="absolute inset-0 rounded-sm pointer-events-none"
                style={{ background: `radial-gradient(ellipse at top right,${a.glow},transparent 70%)` }} />

            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-2">{label}</p>
                    <p className="text-3xl font-black tracking-tight text-white">{value}</p>
                    {sub && <p className="font-mono text-xs mt-1.5" style={{ color: a.text }}>{sub}</p>}
                </div>
                <div className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                    style={{ background: a.bg, border: `1px solid ${a.border}`, color: a.text }}>
                    {icon}
                </div>
            </div>

            {trend && (
                <div className="relative z-10 flex items-center gap-1 mt-3 pt-3"
                    style={{ borderTop: '1px solid rgba(30,41,59,0.6)' }}>
                    <ArrowUpRight size={11} style={{ color: a.text }} />
                    <span className="font-mono text-xs" style={{ color: a.text }}>{trend}</span>
                </div>
            )}
        </div>
    );
}

interface Props {
    stats: AffiliateStats;
}

export function AffiliateDashboard({ stats }: Props) {
    const fmtMoney = (v: string) => `$${parseFloat(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    label="Clics Totales"
                    value={stats.totalClicks.toLocaleString()}
                    sub={`${stats.convertedClicks} convertidos · ${stats.conversionRate}% conv.`}
                    icon={<MousePointerClick size={16} />}
                    accent="teal"
                    trend={`${stats.last30DaysClicks} en los últimos 30 días`}
                />
                <StatCard
                    label="Referidos Totales"
                    value={stats.totalReferrals.toLocaleString()}
                    sub={`${stats.pendingReferrals} pendientes · ${stats.approvedReferrals} aprobados`}
                    icon={<Users size={16} />}
                    accent="amber"
                    trend={`${stats.last30DaysReferrals} en los últimos 30 días`}
                />
                <StatCard
                    label="Ganancia Aprobada"
                    value={fmtMoney(stats.totalEarned)}
                    sub={`${fmtMoney(stats.pendingEarned)} en revisión`}
                    icon={<CheckCircle2 size={16} />}
                    accent="emerald"
                    trend={`Saldo disponible: ${fmtMoney(stats.pendingPayoutBalance)}`}
                />
                <StatCard
                    label="Total Pagado"
                    value={fmtMoney(stats.totalPaidOut)}
                    sub={`Saldo pendiente: ${fmtMoney(stats.pendingPayoutBalance)}`}
                    icon={<DollarSign size={16} />}
                    accent="violet"
                />
            </div>

            {/* Referral status breakdown */}
            <div className="rounded-sm p-5"
                style={{ background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(30,41,59,0.6)' }}>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
                <p className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-4">Estado de Referidos</p>
                <div className="flex flex-wrap gap-4">
                    {[
                        { label: 'Pendientes', value: stats.pendingReferrals, color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: <Clock size={12} /> },
                        { label: 'Aprobados',  value: stats.approvedReferrals, color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', icon: <CheckCircle2 size={12} /> },
                        { label: 'Rechazados', value: stats.rejectedReferrals, color: '#fb7185', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.3)', icon: <XCircle size={12} /> },
                    ].map(({ label, value, color, bg, border, icon }) => (
                        <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-sm"
                            style={{ background: bg, border: `1px solid ${border}` }}>
                            <span style={{ color }}>{icon}</span>
                            <span className="font-mono text-xs uppercase tracking-widest" style={{ color }}>{label}</span>
                            <span className="font-bold text-white text-sm">{value}</span>
                        </div>
                    ))}
                </div>

                {/* Visual progress bar */}
                {stats.totalReferrals > 0 && (
                    <div className="mt-4">
                        <div className="flex rounded-full overflow-hidden h-2" style={{ background: 'rgba(30,41,59,0.5)' }}>
                            <div style={{ width: `${(stats.approvedReferrals / stats.totalReferrals) * 100}%`, background: '#34d399' }} />
                            <div style={{ width: `${(stats.pendingReferrals / stats.totalReferrals) * 100}%`, background: '#fbbf24' }} />
                            <div style={{ width: `${(stats.rejectedReferrals / stats.totalReferrals) * 100}%`, background: '#fb7185' }} />
                        </div>
                        <div className="flex justify-between mt-1.5">
                            <span className="font-mono text-[10px] text-slate-600">Aprobados · Pendientes · Rechazados</span>
                            <span className="font-mono text-[10px] text-slate-600">{stats.totalReferrals} total</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
