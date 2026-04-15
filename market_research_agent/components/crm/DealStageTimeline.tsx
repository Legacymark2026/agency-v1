"use client";

import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight } from "lucide-react";

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
    NEW: { label: "Nuevo", color: "#64748b" },
    CONTACTED: { label: "Contactado", color: "#0ea5e9" },
    QUALIFIED: { label: "Calificado", color: "#8b5cf6" },
    PROPOSAL: { label: "Propuesta", color: "#f59e0b" },
    NEGOTIATION: { label: "Negociación", color: "#f97316" },
    WON: { label: "Ganado", color: "#10b981" },
    LOST: { label: "Perdido", color: "#ef4444" },
};

interface HistoryItem {
    id: string;
    fromStage: string;
    toStage: string;
    createdAt: Date | string;
    user?: { name: string | null; image: string | null } | null;
}

export function DealStageTimeline({ history }: { history: HistoryItem[] }) {
    if (history.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    &gt; Sin historial de cambios_
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {history.map((item, i) => {
                const from = STAGE_LABELS[item.fromStage] ?? { label: item.fromStage, color: '#64748b' };
                const to = STAGE_LABELS[item.toStage] ?? { label: item.toStage, color: '#64748b' };
                const date = new Date(item.createdAt);
                return (
                    <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 10,
                        background: i === 0 ? 'rgba(13,148,136,0.05)' : 'transparent',
                        border: i === 0 ? '1px solid rgba(13,148,136,0.2)' : '1px solid transparent',
                        transition: 'all 0.2s'
                    }}>
                        {/* Timeline dot */}
                        <div style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            background: to.color, boxShadow: `0 0 6px ${to.color}66`
                        }} />

                        {/* Stage change */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                            <span style={{
                                fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                                padding: '2px 7px', borderRadius: 5,
                                background: `${from.color}22`, color: from.color, border: `1px solid ${from.color}44`
                            }}>
                                {from.label}
                            </span>
                            <ArrowRight style={{ width: 11, height: 11, color: '#475569' }} />
                            <span style={{
                                fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                                padding: '2px 7px', borderRadius: 5,
                                background: `${to.color}22`, color: to.color, border: `1px solid ${to.color}44`
                            }}>
                                {to.label}
                            </span>
                        </div>

                        {/* User + time */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            {item.user && (
                                <div style={{
                                    width: 18, height: 18, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #0d9488, #0ea5e9)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 8, fontWeight: 800, color: 'white'
                                }}>
                                    {(item.user.name ?? '?')[0].toUpperCase()}
                                </div>
                            )}
                            <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#475569' }}
                                title={format(date, "d MMM yyyy HH:mm", { locale: es })}>
                                {formatDistanceToNow(date, { addSuffix: true, locale: es })}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
