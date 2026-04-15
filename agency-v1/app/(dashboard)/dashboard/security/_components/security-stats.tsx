import { ShieldAlert, ShieldCheck, Activity, Users, Monitor } from "lucide-react";

interface SecurityStatsProps {
    totalEvents: number;
    failedLogins: number;
    uniqueUsers: number;
    activeSessions: number;
}

export function SecurityStats({ totalEvents, failedLogins, uniqueUsers, activeSessions }: SecurityStatsProps) {
    const criticalPct = totalEvents > 0 ? Math.round((failedLogins / totalEvents) * 100) : 0;

    const cards = [
        {
            label: "Total Eventos",
            value: totalEvents.toLocaleString(),
            sub: "Registros en el sistema",
            icon: <Activity className="text-teal-400" size={16} />,
            color: "teal",
            ring: "border-teal-500/20 bg-teal-500/5",
            glow: "shadow-teal-500/5",
        },
        {
            label: "Eventos Críticos",
            value: failedLogins.toLocaleString(),
            sub: `${criticalPct}% del total de eventos`,
            icon: <ShieldAlert className="text-red-400" size={16} />,
            color: "red",
            ring: failedLogins > 0 ? "border-red-500/30 bg-red-500/5" : "border-slate-800 bg-slate-900/40",
            badge: failedLogins > 0 ? "⚠ Revisar" : undefined,
        },
        {
            label: "Usuarios Únicos",
            value: uniqueUsers.toLocaleString(),
            sub: "Con actividad registrada",
            icon: <Users className="text-indigo-400" size={16} />,
            color: "indigo",
            ring: "border-indigo-500/20 bg-indigo-500/5",
        },
        {
            label: "Sesiones Activas",
            value: activeSessions.toLocaleString(),
            sub: "En base de datos ahora",
            icon: <Monitor className="text-amber-400" size={16} />,
            color: "amber",
            ring: "border-amber-500/20 bg-amber-500/5",
        },
    ];

    return (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {cards.map(card => (
                <div key={card.label} className={`rounded-xl border p-4 flex flex-col gap-2 ${card.ring}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-slate-950 p-1.5 rounded-md border border-slate-800">{card.icon}</div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{card.label}</span>
                        </div>
                        {card.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">{card.badge}</span>
                        )}
                    </div>
                    <span className="text-2xl font-bold text-slate-100 leading-none">{card.value}</span>
                    <span className="text-[11px] text-slate-500">{card.sub}</span>
                </div>
            ))}
        </div>
    );
}
