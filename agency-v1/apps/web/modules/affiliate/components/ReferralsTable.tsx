import type { Referral } from '../types';
import { Clock, CheckCircle2, XCircle, DollarSign } from 'lucide-react';

const STATUS_CONFIG = {
    PENDING:  { label: 'Pendiente',  color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  icon: <Clock size={11} /> },
    APPROVED: { label: 'Aprobado',   color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', icon: <CheckCircle2 size={11} /> },
    REJECTED: { label: 'Rechazado',  color: '#fb7185', bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.3)',  icon: <XCircle size={11} /> },
};

interface Props {
    referrals: Referral[];
}

function StatusBadge({ status }: { status: Referral['status'] }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-mono text-[11px] uppercase tracking-wider"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
}

export function ReferralsTable({ referrals }: Props) {
    const fmtMoney = (v: string) => `$${parseFloat(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    const fmtDate  = (d: string) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

    if (referrals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16"
                style={{ border: '1px solid rgba(30,41,59,0.6)', borderRadius: '2px', background: 'rgba(2,6,23,0.6)' }}>
                <div className="w-12 h-12 rounded-sm flex items-center justify-center mb-4"
                    style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                    <DollarSign size={18} className="text-teal-600" />
                </div>
                <p className="font-mono text-xs uppercase tracking-widest text-slate-600">Sin referidos aún</p>
                <p className="font-mono text-xs text-slate-700 mt-1">Comparte tu link y gana comisiones</p>
            </div>
        );
    }

    return (
        <div className="rounded-sm overflow-hidden" style={{ border: '1px solid rgba(30,41,59,0.6)' }}>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-600"
                style={{ background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                <span>Orden ID</span>
                <span>Comprador</span>
                <span>Total Orden</span>
                <span>Comisión</span>
                <span>Estado · Fecha</span>
            </div>

            {referrals.map((r, i) => (
                <div key={r.id}
                    className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] px-4 py-3.5 items-center hover:bg-slate-900/40 transition-colors duration-150"
                    style={{ borderBottom: i < referrals.length - 1 ? '1px solid rgba(30,41,59,0.4)' : 'none', background: 'rgba(2,6,23,0.7)' }}>
                    <span className="font-mono text-xs text-slate-400 truncate" title={r.orderId}>
                        {r.orderId.slice(0, 8)}…
                    </span>
                    <span className="font-mono text-xs text-slate-500 truncate" title={r.buyerUserId}>
                        {r.buyerUserId.slice(0, 8)}…
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-300">{fmtMoney(r.orderTotal)}</span>
                    <span className="font-mono text-sm font-bold text-teal-400">{fmtMoney(r.commissionAmount)}</span>
                    <div className="flex flex-col gap-1">
                        <StatusBadge status={r.status} />
                        <span className="font-mono text-[10px] text-slate-700">{fmtDate(r.createdAt)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
