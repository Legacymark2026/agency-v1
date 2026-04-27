import { Suspense } from "react";
import { AnalyticsOverview } from "@/modules/analytics/components/overview";
import { TrafficChart } from "@/modules/analytics/components/traffic-chart";
import { SeoMetrics } from "@/modules/analytics/components/seo-metrics";
import { TrackPageEvent } from "@/modules/analytics/components/track-page-event";
import { DeviceChart } from "@/modules/analytics/components/device-chart";
import { TopPages } from "@/modules/analytics/components/top-pages";
import { TrafficSources } from "@/modules/analytics/components/traffic-sources";
import { DateRangeSelector } from "@/modules/analytics/components/date-range-selector";
import { RealtimeIndicator } from "@/modules/analytics/components/realtime-indicator";
import { PeriodComparison } from "@/modules/analytics/components/period-comparison";
import { ActivityHeatmap } from "@/modules/analytics/components/activity-heatmap";
import { FunnelChartComponent } from "@/modules/analytics/components/funnel-chart";
import { ExportButton } from "@/modules/analytics/components/export-button";
import { GeoMap } from "@/modules/analytics/components/geo-map";
import { GoalsWidget } from "@/modules/analytics/components/goals-widget";
import { PerformanceScore } from "@/modules/analytics/components/performance-score";
import { KpiAlerts } from "@/modules/analytics/components/kpi-alerts";
import { QuickInsights } from "@/modules/analytics/components/quick-insights";
import { SessionHistogram } from "@/modules/analytics/components/session-histogram";
import { BounceTrend } from "@/modules/analytics/components/bounce-trend";
import { UserFlow } from "@/modules/analytics/components/user-flow";
import { RefreshSelector } from "@/modules/analytics/components/refresh-selector";
import { LiveVisitorsMap } from "@/modules/analytics/components/live-visitors-map";
import { PageSpeedMetrics } from "@/modules/analytics/components/page-speed-metrics";
import { AnnotationsTimeline } from "@/modules/analytics/components/annotations-timeline";
import { ChannelAttribution } from "@/modules/analytics/components/channel-attribution";
import { RevenueTracker } from "@/modules/analytics/components/revenue-tracker";
import { ABTestResults } from "@/modules/analytics/components/ab-test-results";
import { SearchTermsCloud } from "@/modules/analytics/components/search-terms-cloud";
import { BrowserOsStats } from "@/modules/analytics/components/browser-os-stats";
import { SocialMediaMetrics } from "@/modules/analytics/components/social-media-metrics";
import { EngagementRadar } from "@/modules/analytics/components/engagement-radar";
import { TenantBIWrapper } from "@/modules/analytics/components/tenant-bi-wrapper";
import { BIDashboardSkeleton } from "@/modules/analytics/components/bi-section-skeleton";
import Link from "next/link";
import {
    TrendingUp, Globe, Monitor, BarChart3, Target, Gauge,
    Calendar, MapPin, Activity, Filter, ArrowRight,
    DollarSign, FlaskConical, Search, Share2, Zap,
    LayoutDashboard, MousePointerClick, Eye, Trophy
} from "lucide-react";
import {
    getTrafficData, getTrafficSources, getConversionFunnel, getChannelPerformance,
    getDeviceStats, getGeoStats, getTopPages, getBrowserOsStats, getRealtimeUsers,
    getRevenueStats, getChannelAttribution, getPageSpeedMetrics, getActivityHeatmap,
    getSessionDurationDistribution, getGoalsProgress, getQuickInsights,
    getSearchTerms, getSocialMetrics, getEngagementMetrics
} from "@/modules/analytics/actions/analytics";

export const metadata = {
    title: "Analítica Web | LegacyMark Command Center",
    description: "Métricas de rendimiento, tráfico y conversión en tiempo real.",
};

// ─── Shared HUD Card ──────────────────────────────────────────────────────────
function DarkCard({ children, className = "", code }: { children: React.ReactNode; className?: string; code?: string }) {
    return (
        <div className={`ds-card group relative ${className}`}>
            {code && <span className="absolute top-3 right-3 font-mono text-xs text-slate-700 uppercase tracking-widest">[{code}]</span>}
            {children}
        </div>
    );
}

function SectionHeader({ icon: Icon, label, sub }: { icon: any; label: string; sub?: string }) {
    return (
        <div className="flex items-center gap-2.5 mb-5">
            <div className="ds-icon-box w-7 h-7">
                <Icon size={13} strokeWidth={1.5} className="text-teal-400" />
            </div>
            <div>
                <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">{label}</p>
                {sub && <p className="font-mono text-xs text-slate-700 uppercase tracking-widest mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── Tab Nav (server-compatible via searchParams) ────────────────────────────
const TABS = [
    { id: "crm-bi", label: "CRM BI", icon: Trophy },
    { id: "resumen", label: "Resumen", icon: LayoutDashboard },
    { id: "trafico", label: "Tráfico", icon: Globe },
    { id: "conversiones", label: "Conversiones", icon: Target },
    { id: "rendimiento", label: "Rendimiento", icon: Gauge },
] as const;

function TabNav({ active }: { active: string }) {
    return (
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
                <Link
                    key={id}
                    href={`?tab=${id}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${active === id
                            ? "bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-sm shadow-teal-500/10"
                            : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                        }`}
                >
                    <Icon size={12} />
                    {label}
                </Link>
            ))}
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const { tab = "crm-bi" } = await searchParams;
    const activeTab = TABS.find(t => t.id === tab)?.id ?? "crm-bi";

    // Fetch all data in parallel ONLY IF NOT IN CRM-BI TAB (Performance Optimization Nivel 3A)
    // En la pestaña CRM BI, los datos cargan vía Suspense (Streaming SSR) sin bloquear la página.
    let trafficData, trafficSources, funnelData, seoData, deviceData, geoData, topPagesData, browserOsData;
    let activeUsers = 0, revenueData, attributionData, pageSpeedData, heatmapData, sessionDurationData;
    let goalsData, insightsData, searchTermsData, socialMetricsData, engagementData;

    if (activeTab !== "crm-bi") {
        [
            trafficData, trafficSources, funnelData, seoData,
            deviceData, geoData, topPagesData, browserOsData,
            activeUsers, revenueData, attributionData, pageSpeedData,
            heatmapData, sessionDurationData, goalsData, insightsData,
            searchTermsData, socialMetricsData, engagementData,
        ] = await Promise.all([
            getTrafficData(7),
            getTrafficSources(30),
            getConversionFunnel(),
            getChannelPerformance(6),
            getDeviceStats(30),
            getGeoStats(30),
            getTopPages(10, 30),
            getBrowserOsStats(30),
            getRealtimeUsers(),
            getRevenueStats(),
            getChannelAttribution(),
            getPageSpeedMetrics(),
            getActivityHeatmap(),
            getSessionDurationDistribution(),
            getGoalsProgress(),
            getQuickInsights(),
            getSearchTerms(),
            getSocialMetrics(),
            getEngagementMetrics(),
        ]);
    }

    return (
        <div className="ds-page space-y-6">
            <TrackPageEvent eventName="ViewAnalytics" isCustom={true} />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* ── Header ── */}
            <div
                className="relative z-10 flex flex-col gap-4 pb-6"
                style={{ borderBottom: "1px solid rgba(30,41,59,0.8)" }}
            >
                {/* Top row: title + controls */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div>
                        <div className="mb-3">
                            <span className="ds-badge ds-badge-teal">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                                </span>
                                ANL_SYS · LIVE DATA
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="ds-icon-box w-12 h-12">
                                <BarChart3 className="w-5 h-5 text-teal-400" />
                            </div>
                            <div>
                                <h1 className="ds-heading-page">Analítica Avanzada</h1>
                                <p className="ds-subtext mt-1">Métricas de rendimiento · Tráfico · Conversión en tiempo real</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <RealtimeIndicator count={activeUsers} />
                        <RefreshSelector />
                        <DateRangeSelector />
                        <ExportButton />
                    </div>
                </div>

                {/* Tab navigation */}
                <TabNav active={activeTab} />
            </div>

            {/* ══════════════════════════════════════════════════════════════
                TAB: CRM BI (Nivel 3A/3B: Multi-tenant + Streaming SSR)
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === "crm-bi" && (
                <div className="relative z-10">
                    <Suspense fallback={<BIDashboardSkeleton />}>
                        <TenantBIWrapper />
                    </Suspense>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB: RESUMEN
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === "resumen" && (
                <div className="relative z-10 space-y-5">
                    {/* Quick Insights */}
                    <QuickInsights data={insightsData} />

                    {/* KPI Overview */}
                    <AnalyticsOverview />

                    {/* Period Comparison */}
                    <PeriodComparison />

                    {/* Main Charts */}
                    <div className="grid gap-5 lg:grid-cols-2">
                        <DarkCard code="TRF_WK">
                            <SectionHeader icon={TrendingUp} label="Tráfico Semanal" sub="Últimos 7 días" />
                            <TrafficChart data={trafficData} />
                        </DarkCard>
                        <DarkCard code="SEO_PAG">
                            <SectionHeader icon={BarChart3} label="SEO vs Pago" sub="Rendimiento por canal" />
                            <SeoMetrics data={seoData} />
                        </DarkCard>
                    </div>

                    {/* Funnel + User Flow */}
                    <div className="grid gap-5 lg:grid-cols-2">
                        <DarkCard code="FNN_CNV">
                            <SectionHeader icon={Filter} label="Embudo de Conversión" />
                            <FunnelChartComponent data={funnelData} />
                        </DarkCard>
                        <DarkCard code="USR_FLW">
                            <SectionHeader icon={ArrowRight} label="User Flow" sub="Rutas de navegación" />
                            <UserFlow data={funnelData} />
                        </DarkCard>
                    </div>

                    {/* Social Media */}
                    <DarkCard code="SOC_MET">
                        <SectionHeader icon={Share2} label="Redes Sociales" sub="Últimos 30 días" />
                        <SocialMediaMetrics data={socialMetricsData} />
                    </DarkCard>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB: TRÁFICO
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === "trafico" && (
                <div className="relative z-10 space-y-5">
                    {/* Devices + Sources */}
                    <div className="grid gap-5 lg:grid-cols-3">
                        <DarkCard code="DEV_STS">
                            <SectionHeader icon={Monitor} label="Dispositivos" />
                            <DeviceChart data={deviceData} />
                        </DarkCard>
                        <DarkCard className="lg:col-span-2" code="TRF_SRC">
                            <SectionHeader icon={Globe} label="Fuentes de Tráfico" />
                            <TrafficSources data={trafficSources} />
                        </DarkCard>
                    </div>

                    {/* Geo Map */}
                    <DarkCard code="GEO_MAP">
                        <SectionHeader icon={MapPin} label="Distribución Geográfica" sub="Por país y región" />
                        <GeoMap data={geoData} />
                    </DarkCard>

                    {/* Top Pages */}
                    <DarkCard code="TOP_PGS">
                        <SectionHeader icon={Eye} label="Top Páginas Visitadas" sub="Últimos 30 días" />
                        <TopPages data={topPagesData} />
                    </DarkCard>

                    {/* Session + Bounce + Browser/OS + Search */}
                    <div className="grid gap-5 lg:grid-cols-2">
                        <DarkCard code="SESS_HG">
                            <SectionHeader icon={Activity} label="Duración de Sesiones" />
                            <SessionHistogram data={sessionDurationData} />
                        </DarkCard>
                        <DarkCard code="BNC_TRD">
                            <SectionHeader icon={MousePointerClick} label="Tendencia de Rebote" />
                            <BounceTrend />
                        </DarkCard>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-3">
                        <DarkCard code="SRCH_TM">
                            <SectionHeader icon={Search} label="Términos de Búsqueda" />
                            <SearchTermsCloud data={searchTermsData} />
                        </DarkCard>
                        <DarkCard code="BROW_OS">
                            <SectionHeader icon={Monitor} label="Navegador / SO" />
                            <BrowserOsStats data={browserOsData} />
                        </DarkCard>
                        <DarkCard code="ENG_RDR">
                            <SectionHeader icon={Activity} label="Radar de Engagement" />
                            <EngagementRadar data={engagementData} />
                        </DarkCard>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB: CONVERSIONES
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === "conversiones" && (
                <div className="relative z-10 space-y-5">
                    {/* Goals + KPI Alerts */}
                    <div className="grid gap-5 lg:grid-cols-2">
                        <DarkCard code="GOALS">
                            <SectionHeader icon={Target} label="Objetivos y Metas" />
                            <GoalsWidget data={goalsData as any} />
                        </DarkCard>
                        <DarkCard code="KPI_ALT">
                            <SectionHeader icon={Zap} label="Alertas KPI" />
                            <KpiAlerts />
                        </DarkCard>
                    </div>

                    {/* Revenue + Attribution */}
                    <div className="grid gap-5 lg:grid-cols-2">
                        <DarkCard code="REV_TRK">
                            <SectionHeader icon={DollarSign} label="Ingresos del CRM" sub="Deals ganados" />
                            <RevenueTracker data={revenueData} />
                        </DarkCard>
                        <DarkCard code="CHN_ATR">
                            <SectionHeader icon={Globe} label="Atribución por Canal" sub="Basado en Lead.source" />
                            <ChannelAttribution data={attributionData} />
                        </DarkCard>
                    </div>

                    {/* A/B Tests + Annotations */}
                    <div className="grid gap-5 lg:grid-cols-2">
                        <DarkCard code="AB_TEST">
                            <SectionHeader icon={FlaskConical} label="Pruebas A/B" />
                            <ABTestResults />
                        </DarkCard>
                        <DarkCard code="ANNOT">
                            <SectionHeader icon={Calendar} label="Anotaciones" />
                            <AnnotationsTimeline />
                        </DarkCard>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB: RENDIMIENTO
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === "rendimiento" && (
                <div className="relative z-10 space-y-5">
                    {/* Performance score */}
                    <DarkCard code="PERF_SCR">
                        <SectionHeader icon={Gauge} label="Puntuación de Rendimiento" />
                        <PerformanceScore />
                    </DarkCard>

                    {/* Live Visitors + Page Speed */}
                    <div className="grid gap-5 lg:grid-cols-2">
                        <DarkCard code="LIV_VIS">
                            <SectionHeader icon={Activity} label="Visitantes en Vivo" sub="Últimos 5 minutos" />
                            <LiveVisitorsMap initialCount={activeUsers} />
                        </DarkCard>
                        <DarkCard code="PG_SPDS">
                            <SectionHeader icon={Gauge} label="Velocidad de Página" sub="Core Web Vitals" />
                            <PageSpeedMetrics data={pageSpeedData} />
                        </DarkCard>
                    </div>

                    {/* Activity Heatmap */}
                    <DarkCard code="ACT_HMP">
                        <SectionHeader icon={Calendar} label="Actividad Anual" sub="Estilo GitHub — Últimos 365 días" />
                        <ActivityHeatmap data={heatmapData} />
                    </DarkCard>
                </div>
            )}
        </div>
    );
}
