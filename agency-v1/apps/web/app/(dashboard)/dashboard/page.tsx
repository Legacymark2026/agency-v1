export const dynamic = 'force-dynamic';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Terminal, 
  Users, 
  DollarSign, 
  Target, 
  Briefcase, 
  Wand2, 
  TrendingUp, 
  Layers, 
  Calendar, 
  Activity,
  ArrowUpRight
} from "lucide-react";
import { InteractiveSpotlight } from "@/components/dashboard/InteractiveSpotlight";
import Link from "next/link";
import { getCompanyFeedAction } from "@/actions/feed.actions";
import { DashboardFeedWidget } from "@/components/feed/dashboard-feed-widget";

export default async function DashboardPage() {
    let session = null;
    try {
        session = await auth();
    } catch (e) {
        console.warn("[DashboardPage] Auth resolution fallback:", e);
    }

    const user = session?.user;
    let currentRole = user?.role || 'Super Admin';
    let activityLogs: any[] = [];
    let feedPosts: any[] = [];
    let stats = {
        leadsCount: 0,
        dealsValue: 0,
        campaignsCount: 0,
        invoicesCount: 0
    };

    // Load statistics safely with error shield
    try {
        if (user?.id) {
            const [dbUser, logs, leads, deals, campaigns, invoices, feedRes] = await Promise.all([
                prisma.user.findUnique({
                    where: { id: user.id },
                    select: { role: true }
                }).catch(() => null),
                prisma.userActivityLog.findMany({
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }).catch(() => []),
                prisma.lead.count().catch(() => 0),
                prisma.deal.findMany({
                    select: { value: true },
                    take: 100
                }).catch(() => []),
                prisma.campaign.count({
                    where: { status: 'ACTIVE' }
                }).catch(() => 0),
                prisma.invoice.count().catch(() => 0),
                getCompanyFeedAction(5).catch(() => ({ success: false, data: [] }))
            ]);

            if (dbUser?.role) currentRole = dbUser.role;
            activityLogs = logs || [];
            if ((feedRes as any)?.data) {
                feedPosts = (feedRes as any).data;
            }
            
            const totalDealsVal = (deals || []).reduce((acc: number, d: any) => acc + (d.value || 0), 0);
            stats = {
                leadsCount: leads || 0,
                dealsValue: totalDealsVal,
                campaignsCount: campaigns || 0,
                invoicesCount: invoices || 0
            };
        }
    } catch (dbErr) {
        console.error("[DashboardPage] DB load non-blocking error:", dbErr);
    }

    const QUICK_SHORTCUTS = [
        { title: "CRM & Leads", href: "/dashboard/admin/crm", icon: Users, count: `${stats.leadsCount} Leads` },
        { title: "Facturación DIAN", href: "/dashboard/invoicing", icon: DollarSign, count: `${stats.invoicesCount} Docs` },
        { title: "Campañas & Ads", href: "/dashboard/marketing/campaigns", icon: Target, count: `${stats.campaignsCount} Activas` },
        { title: "Pipeline de Tratos", href: "/dashboard/admin/crm/pipeline", icon: Briefcase, count: `$${stats.dealsValue.toLocaleString()}` },
        { title: "Contabilidad & PUC", href: "/dashboard/accounting", icon: Layers, count: "Libro Mayor" },
        { title: "Agendación de Citas", href: "/dashboard/calendar", icon: Calendar, count: "Google Meet" },
        { title: "Video Studio Pro", href: "/dashboard/video", icon: Wand2, count: "AI 9:16" },
        { title: "Monitor SLA 99.99%", href: "/dashboard/security/sla", icon: Activity, count: "En Línea" },
    ];

    return (
        <div className="ds-page space-y-8 w-full">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* ── Header ── */}
            <InteractiveSpotlight className="relative z-10 ds-card group"
                style={{ padding: '2rem 2.5rem' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(13,148,136,0.07),transparent_70%)] pointer-events-none" />
                <div className="absolute top-4 right-4 font-mono text-xs text-slate-700 uppercase tracking-widest">[SYS_CORE · OVW]</div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="mb-4">
                            <span className="ds-badge ds-badge-teal">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                                </span>
                                <Sparkles size={8} /> Panel Ejecutivo · En Vivo
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black tracking-[-0.04em] text-white">
                            Bienvenido,{" "}
                            <span className="font-mono text-transparent bg-clip-text bg-[linear-gradient(110deg,#0d9488,45%,#34d399,55%,#0d9488)] bg-[length:200%_100%] animate-[shine_3s_linear_infinite]">
                                {user?.name?.split(' ')[0] || 'Administrador'}
                            </span>
                        </h1>
                        <p className="ds-subtext mt-2">Centro de Comando Unificado de Marketing, Ventas, Finanzas y Automatización IA</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-sm font-mono text-xs text-teal-400 uppercase tracking-widest"
                           style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)' }}>
                            <ShieldCheck size={12} className="text-teal-500" />
                            {currentRole}
                        </div>
                    </div>
                </div>
            </InteractiveSpotlight>

            {/* ── Quick Access Module Hub ── */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {QUICK_SHORTCUTS.map((sc) => {
                    const Icon = sc.icon;
                    return (
                        <Link 
                            key={sc.href} 
                            href={sc.href}
                            className="ds-card p-5 group hover:border-teal-500/40 transition-all block"
                        >
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 rounded-lg bg-teal-950/40 border border-teal-800/40 text-teal-400 group-hover:scale-110 transition-transform">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
                            </div>
                            <div className="mt-4">
                                <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">{sc.title}</h3>
                                <p className="text-xs font-mono text-slate-400 mt-1">{sc.count}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* ── Muro Corporativo & Comunicados (Visible Siempre) ── */}
            <DashboardFeedWidget 
                posts={feedPosts}
                currentUserId={user?.id}
            />

            {/* ── Recent Activity ── */}
            <InteractiveSpotlight className="relative z-10 ds-section">
                <div className="flex items-center justify-between pb-4 mb-6"
                    style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                    <div className="flex items-center gap-3">
                        <div className="ds-icon-box w-8 h-8">
                            <Clock size={14} strokeWidth={1.5} className="text-teal-400" />
                        </div>
                        <div>
                            <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">Registro de Actividad Reciente</p>
                            <p className="font-mono text-xs text-slate-700 uppercase tracking-widest mt-0.5">Auditoría del Sistema · Tiempo Real</p>
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

                <div className="relative" style={{ borderLeft: '1px solid rgba(30,41,59,0.8)', marginLeft: '1.25rem', paddingLeft: '1.5rem' }}>
                    {activityLogs.length > 0 ? (
                        <div className="space-y-4">
                            {activityLogs.map((log) => (
                                <div key={log.id} className="relative group">
                                    <div className="absolute -left-[calc(1.5rem+0.65rem)] top-3 w-5 h-5 rounded-sm flex items-center justify-center text-[7px] font-mono font-black text-teal-400"
                                        style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(30,41,59,0.8)' }}>
                                        {(log.action || 'LOG').substring(0, 2)}
                                    </div>

                                    <div className="ds-card-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[13px] text-slate-200 truncate">{log.action}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 font-light truncate">
                                                {log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : 'Operación registrada.'}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">{new Date(log.createdAt).toLocaleDateString()}</p>
                                            <p className="font-mono text-xs text-slate-700 mt-0.5">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="ds-icon-box w-10 h-10 mb-3 mx-auto">
                                <Terminal size={16} strokeWidth={1.5} className="text-slate-600" />
                            </div>
                            <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">&gt; Sistema en línea y listo para operar_</p>
                        </div>
                    )}
                </div>
            </InteractiveSpotlight>
        </div>
    );
}
