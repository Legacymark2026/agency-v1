import { getMarketingKPIs, getAttributionStats, getRecentActivity } from "@/actions/marketing/analytics";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { AttributionChart } from "@/modules/marketing/components/attribution-chart";
import { DateRangePicker } from "@/modules/marketing/components/date-range-picker";
import {
    Users, DollarSign, TrendingUp, Activity, Radio, Globe, BarChart3
} from "lucide-react";

const prisma = new PrismaClient();

function SectionLabel({ icon: Icon, label, sub }: { icon: any; label: string; sub?: string }) {
    return (
        <div className="flex items-center gap-2.5 mb-5">
            <div className="ds-icon-box w-7 h-7">
                <Icon size={12} strokeWidth={1.5} className="text-teal-400" />
            </div>
            <div>
                <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em]">{label}</p>
                {sub && <p className="font-mono text-[8px] text-slate-700 uppercase tracking-widest mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

export default async function MarketingDashboardPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/auth/login");

    const companyUser = await prisma.companyUser.findFirst({ where: { userId: session.user.id } });
    if (!companyUser) return (
        <div className="ds-page flex items-center justify-center">
            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">&gt; Empresa no configurada_</p>
        </div>
    );
    const companyId = companyUser.companyId;

    const kpis = await getMarketingKPIs(companyId);
    const attribution = await getAttributionStats(companyId);
    const recentEvents = await getRecentActivity(companyId);

    const kpiCards = [
        { label: "New Leads (MoM)", value: `+${kpis.newLeads}`, sub: `Total: ${kpis.totalLeads} leads`, icon: Users, code: "NEW_LDS" },
        { label: "Ad Spend (Month)", value: `$${kpis.spend.toLocaleString()}`, sub: "Across all platforms", icon: DollarSign, code: "AD_SPN" },
        { label: "Cost Per Lead (CPL)", value: `$${kpis.cpl.toFixed(2)}`, sub: "Target: < $15.00", icon: TrendingUp, code: "CPL_AVG" },
        { label: "Traffic Events", value: kpis.totalEvents, sub: "+12% from last month", icon: Activity, code: "TRF_EVT" },
    ];

    return (
        <div className="ds-page space-y-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between gap-4 pb-8"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <div className="mb-4">
                        <span className="ds-badge ds-badge-teal">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                            </span>
                            MKT_HUB · LIVE
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-12 h-12">
                            <Radio className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page">Marketing Command Center</h1>
                            <p className="ds-subtext mt-2">Real-time insights · Performance tracking</p>
                        </div>
                    </div>
                </div>
                <div className="shrink-0 flex gap-2">
                    <DateRangePicker />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="relative z-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((k, i) => (
                    <div key={k.code} className="ds-kpi group">
                        <span className="absolute top-3 right-3 font-mono text-[8px] text-slate-700 uppercase tracking-widest group-hover:text-slate-500 transition-colors">[{k.code}]</span>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em]">{k.label}</p>
                                <div className="ds-icon-box w-7 h-7">
                                    <k.icon size={12} strokeWidth={1.5} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
                                </div>
                            </div>
                            <p className="ds-stat-value">{k.value}</p>
                            <p className="ds-mono-label mt-2">{k.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Attribution + Channels */}
            <div className="relative z-10 grid gap-5 lg:grid-cols-7">
                <div className="col-span-4 ds-section">
                    <SectionLabel icon={BarChart3} label="Attribution Overview" sub="Tráfico por canal" />
                    <AttributionChart data={attribution} />
                </div>
                <div className="col-span-3 ds-section">
                    <SectionLabel icon={Globe} label="Top Channels" sub="Fuentes de conversión" />
                    <div className="space-y-4">
                        {attribution.map((item) => (
                            <div key={item.source} className="flex items-center justify-between ds-card-sm">
                                <div>
                                    <p className="text-[13px] font-bold text-slate-200">{item.source}</p>
                                    <p className="ds-mono-label">Best performing source</p>
                                </div>
                                <span className="font-mono font-black text-sm text-teal-400">{item.count} <span className="text-[9px] text-slate-600">Leads</span></span>
                            </div>
                        ))}
                        {attribution.length === 0 && (
                            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest text-center py-6">&gt; Sin datos aún_</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Live Activity Feed */}
            <div className="relative z-10 ds-section">
                <div className="flex items-center justify-between mb-5">
                    <SectionLabel icon={Activity} label="Live Activity Feed" sub="Eventos en tiempo real" />
                    <span className="ds-badge ds-badge-teal">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                        </span>
                        Real-Time
                    </span>
                </div>
                <div className="space-y-3">
                    {recentEvents.map(event => (
                        <div key={event.id} className="ds-card-sm flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-slate-200 truncate">
                                    {event.eventType}
                                    {event.eventName && <span className="text-slate-500 font-light"> — {event.eventName}</span>}
                                </p>
                                <p className="ds-mono-label mt-0.5">
                                    {event.lead ? (event.lead as any).email : (event.visitorId ? `Visitor ${event.visitorId.substring(0, 8)}...` : 'Anonymous')}
                                    {' '}&bull; {new Date(event.createdAt).toLocaleTimeString()}
                                </p>
                            </div>
                            <p className="font-mono text-[9px] text-slate-700 uppercase tracking-widest truncate max-w-[160px]">
                                {event.url}
                            </p>
                        </div>
                    ))}
                    {recentEvents.length === 0 && (
                        <div className="py-10 flex items-center justify-center">
                            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">&gt; Esperando eventos de tráfico entrante..._</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
