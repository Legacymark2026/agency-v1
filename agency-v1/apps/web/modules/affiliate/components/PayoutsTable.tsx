import type { Payout } from '../types';
import { Landmark, Clock, CheckCircle2, XCircle, Loader2, DollarSign } from 'lucide-react';

const STATUS_CONFIG = {
    PENDING:    { label: 'Pendiente',    color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  icon: <Clock size={11} /> },
    PROCESSING: { label: 'Procesando',   color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)',  icon: <Loader2 size={11} className="animate-spin" /> },
    PAID:       { label: 'Pagado',       color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)',  icon: <CheckCircle2 size={11} /> },
    FAILED:     { label: 'Fallido',      color: '#fb7185', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.3)',   icon: <XCircle size={11} /> },
};

function StatusBadge({ status }: { status: string }) {
    const key = (status || 'PROCESSING') as keyof typeof STATUS_CONFIG;
    const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.PROCESSING;
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-mono text-[11px] uppercase tracking-wider"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            {cfg.icon}{cfg.label}
        </span>
    );
}

interface Props { payouts: Payout[] }

export function PayoutsTable({ payouts }: Props) {
    const fmtMoney = (v: string) => `$${parseFloat(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    const fmtDate  = (d: string | null) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    if (payouts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16"
                style={{ border: '1px solid rgba(30,41,59,0.6)', borderRadius: '2px', background: 'rgba(2,6,23,0.6)' }}>
                <div className="w-12 h-12 rounded-sm flex items-center justify-center mb-4"
                    style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <Landmark size={18} className="text-violet-600" />
                </div>
                <p className="font-mono text-xs uppercase tracking-widest text-slate-600">Sin pagos aún</p>
                <p className="font-mono text-xs text-slate-700 mt-1">Los pagos solicitados aparecerán aquí</p>
            </div>
        );
    }

    return (
        <div className="rounded-sm overflow-hidden" style={{ border: '1px solid rgba(30,41,59,0.6)' }}>
            <div className="grid grid-cols-[1fr_auto_auto_auto] px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-600 gap-4"
                style={{ background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                <span>ID Pago</span>
                <span>Monto</span>
                <span>Estado</span>
                <span>Fecha Pago</span>
            </div>
            {payouts.map((p, i) => (
                <div key={p.id}
                    className="grid grid-cols-[1fr_auto_auto_auto] px-4 py-3.5 items-center gap-4 hover:bg-slate-900/40 transition-colors"
                    style={{ borderBottom: i < payouts.length - 1 ? '1px solid rgba(30,41,59,0.4)' : 'none', background: 'rgba(2,6,23,0.7)' }}>
                    <span className="font-mono text-xs text-slate-500">{p.id.slice(0, 12)}…</span>
                    <span className="font-mono text-base font-black text-violet-400">{fmtMoney(p.amount)}</span>
                    <StatusBadge status={p.status} />
                    <span className="font-mono text-xs text-slate-600 whitespace-nowrap">{fmtDate(p.paidAt)}</span>
                </div>
            ))}
        </div>
    );
}
