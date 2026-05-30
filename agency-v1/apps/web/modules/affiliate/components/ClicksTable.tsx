import type { Click } from '../types';
import { MousePointerClick, Globe, Monitor } from 'lucide-react';

interface Props {
    clicks: Click[];
}

export function ClicksTable({ clicks }: Props) {
    const fmtDate = (d: string) => new Date(d).toLocaleString('es-MX', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    if (clicks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16"
                style={{ border: '1px solid rgba(30,41,59,0.6)', borderRadius: '2px', background: 'rgba(2,6,23,0.6)' }}>
                <div className="w-12 h-12 rounded-sm flex items-center justify-center mb-4"
                    style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                    <MousePointerClick size={18} className="text-teal-600" />
                </div>
                <p className="font-mono text-xs uppercase tracking-widest text-slate-600">Sin clics registrados</p>
                <p className="font-mono text-xs text-slate-700 mt-1">Los clics aparecerán aquí en tiempo real</p>
            </div>
        );
    }

    return (
        <div className="rounded-sm overflow-hidden" style={{ border: '1px solid rgba(30,41,59,0.6)' }}>
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_auto_auto] px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-600 gap-4"
                style={{ background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
                <span>Referrer</span>
                <span>User Agent</span>
                <span>IP</span>
                <span>Fecha</span>
            </div>

            {clicks.map((c, i) => (
                <div key={c.id}
                    className="grid grid-cols-[1fr_1fr_auto_auto] px-4 py-3 items-center gap-4 hover:bg-slate-900/40 transition-colors"
                    style={{ borderBottom: i < clicks.length - 1 ? '1px solid rgba(30,41,59,0.4)' : 'none', background: 'rgba(2,6,23,0.7)' }}>

                    {/* Referrer */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <Globe size={11} className="text-teal-600 shrink-0" />
                            <p className="font-mono text-xs text-slate-300 truncate" title={c.referer ?? ''}>
                                {c.referer ? c.referer.replace(/^https?:\/\//, '').slice(0, 50) : 'directo'}
                            </p>
                        </div>
                    </div>

                    {/* UA */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <Monitor size={11} className="text-slate-600 shrink-0" />
                            <span className="font-mono text-[10px] text-slate-500 truncate" title={c.userAgent ?? ''}>
                                {c.userAgent ? c.userAgent.slice(0, 50) : '—'}
                            </span>
                        </div>
                    </div>

                    {/* IP */}
                    <span className="font-mono text-[10px] text-slate-600 shrink-0">{c.ip || '—'}</span>

                    {/* Date */}
                    <span className="font-mono text-[10px] text-slate-600 shrink-0 whitespace-nowrap">{fmtDate(c.createdAt)}</span>
                </div>
            ))}
        </div>
    );
}
