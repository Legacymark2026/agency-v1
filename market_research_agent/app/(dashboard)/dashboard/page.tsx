import { auth } from "@/lib/auth";
import { AnalyticsOverview } from "@/modules/analytics/components/overview";
import { prisma } from "@/lib/prisma";
import { Activity, ShieldCheck, Sparkles, Clock, Terminal } from "lucide-react";

export default async function DashboardPage() {
    const session = await auth();
    const user = session?.user;

    const dbUser = user?.id ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
    }) : null;
    const currentRole = dbUser?.role || user?.role || 'Guest';

    const activityLogs: any[] = user?.id ? await prisma.userActivityLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
    }) : [];

    return (
        <div className="ds-page space-y-8">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* ── Header ── */}
            <div className="relative z-10 ds-card group"
                style={{ padding: '2rem 2.5rem' }}>
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(13,148,136,0.07),transparent_70%)] pointer-events-none" />

                {/* Code tag */}
                <div className="absolute top-4 right-4 font-mono text-[9px] text-slate-700 uppercase tracking-widest">[SYS_CORE · OVW]</div>

                {/* Teal accent top line — identical to home TechCard bottom line on hover */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        {/* HUD badge */}
                        <div className="mb-4">
                            <span className="ds-badge ds-badge-teal">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                                </span>
                                <Sparkles size={8} /> Panel C-Level · Live
                            </span>
                        </div>

                        <h1 className="text-4xl font-black tracking-[-0.04em] text-white">
                            Bienvenido,{" "}
                            <span className="font-mono text-transparent bg-clip-text bg-[linear-gradient(110deg,#0d9488,45%,#34d399,55%,#0d9488)] bg-[length:200%_100%] animate-[shine_3s_linear_infinite]">
                                {user?.name?.split(' ')[0] || 'Usuario'}
                            </span>
                        </h1>
                        <p className="ds-subtext mt-3">Estado en tiempo real de tus operaciones</p>
                    </div>

                    {/* Role badge */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-sm font-mono text-[10px] text-teal-400 uppercase tracking-widest"
                            style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)' }}>
                            <ShieldCheck size={12} className="text-teal-500" />
                            {currentRole}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Analytics Overview ── */}
            <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2.5 px-1">
                    <div className="ds-icon-box w-6 h-6">
                        <Activity size={12} strokeWidth={1.5} className="text-teal-400" />
                    </div>
                    <h2 className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em]">Métricas Estratégicas</h2>
                </div>
                <AnalyticsOverview />
            </div>

            {/* ── Recent Activity ── */}
            <div className="relative z-10 ds-section">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-6"
                    style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                    <div className="flex items-center gap-3">
                        <div className="ds-icon-box w-8 h-8">
                            <Clock size={14} strokeWidth={1.5} className="text-teal-400" />
                        </div>
                        <div>
                            <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em]">Registro de Actividad Reciente</p>
                            <p className="font-mono text-[8px] text-slate-700 uppercase tracking-widest mt-0.5">Log de sistema · Actualización automática</p>
                        </div>
                    </div>
                    <span className="ds-badge ds-badge-teal">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                        </span>
                        Live
                    </span>
                </div>

                {/* Timeline */}
                <div className="relative" style={{ borderLeft: '1px solid rgba(30,41,59,0.8)', marginLeft: '1.25rem', paddingLeft: '1.5rem' }}>
                    {activityLogs.length > 0 ? (
                        <div className="space-y-4">
                            {activityLogs.map((log, i) => (
                                <div key={log.id} className="relative group">
                                    {/* Timeline dot */}
                                    <div className="absolute -left-[calc(1.5rem+0.65rem)] top-3 w-5 h-5 rounded-sm flex items-center justify-center text-[7px] font-mono font-black text-teal-400"
                                        style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(30,41,59,0.8)' }}>
                                        {(log.action || 'LOG').substring(0, 2)}
                                    </div>

                                    {/* Content */}
                                    <div className="ds-card-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[13px] text-slate-200 truncate">{log.action}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5 font-light truncate">
                                                {log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : 'Operación de sistema completada exitosamente.'}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">{new Date(log.createdAt).toLocaleDateString()}</p>
                                            <p className="font-mono text-[9px] text-slate-700 mt-0.5">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="ds-icon-box w-10 h-10 mb-4 mx-auto">
                                <Terminal size={16} strokeWidth={1.5} className="text-slate-600" />
                            </div>
                            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">&gt; No hay actividad reciente_</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
