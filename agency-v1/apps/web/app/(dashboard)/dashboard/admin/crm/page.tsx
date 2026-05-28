import { Suspense } from "react";
import { requireCompany } from "@/lib/company-utils";
import {
    getCRMStats,
    getRecentActivity,
    getTopDeals,
    getHighPerformanceStats
} from "@/actions/crm";
import { RecentActivity } from "@/components/crm/recent-activity";
import { TopDeals } from "@/components/crm/top-deals";
import { QuickActions } from "@/components/crm/quick-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { TrendingUp } from "lucide-react";
import { CRMExportButton } from "@/components/crm/export-button";
import { EmptyState } from "@/components/ui/empty-state";
import { getRecentExecutions } from "@/actions/automation";
import { RecentAutomations } from "@/components/crm/recent-automations";

export default async function CRMDashboardPage() {
    // Get company ID
    const { companyId } = await requireCompany();

    // Fetch data in parallel
    const [stats, activities, topDeals, advancedStats, executions] = await Promise.all([
        getCRMStats(),
        getRecentActivity(),
        getTopDeals(),
        getHighPerformanceStats(),
        getRecentExecutions(companyId)
    ]);

    if ('error' in stats || 'error' in advancedStats) {
        return <div className="p-8 text-red-500">Error loading CRM data</div>;
    }

    const isTotalEmpty = stats.activeDeals === 0 && topDeals.length === 0 && advancedStats.wonValue === 0;

    return (
        <div className="ds-page space-y-8">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* ── Header ── */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    {/* HUD badge */}
                    <div className="mb-4">
                        <span className="ds-badge ds-badge-amber">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                            </span>
                            CRM CORE · LIVE
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-12 h-12">
                            <TrendingUp className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page">CRM Command Center</h1>
                            <p className="ds-subtext mt-2">Pipeline · Leads · Deals · Actividad</p>
                        </div>
                    </div>
                    <div className="mt-4 ml-16">
                        <QuickActions companyId={companyId} />
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs text-slate-700 uppercase tracking-widest hidden md:block">[CRM_CORE]</span>
                    <CalendarDateRangePicker />
                    <CRMExportButton stats={stats} advancedStats={advancedStats} />
                </div>
            </div>

            <Suspense fallback={<DashboardSkeleton />}>
                {isTotalEmpty ? (
                    <div className="mt-8">
                        <EmptyState
                            variant="crm"
                            title="Bienvenido a tu CRM"
                            description="Comienza creando tu primer deal para ver las métricas de rendimiento."
                            actionLabel="Crear Primer Deal"
                        />
                    </div>
                ) : (
                    <div className="space-y-6 relative z-10">
                        {/* Operational Workspace Grid */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                            {/* Left Pane: Top active deals */}
                            <div className="lg:col-span-4">
                                <TopDeals deals={topDeals} />
                            </div>

                            {/* Right Pane: Recent automations executions */}
                            <div className="lg:col-span-3">
                                <RecentAutomations data={executions} />
                            </div>
                        </div>

                        {/* Recent pipeline activity timeline */}
                        <div className="grid gap-6">
                            <div className="ds-card">
                                <RecentActivity activities={activities} />
                            </div>
                        </div>
                    </div>
                )}
            </Suspense>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-7">
                <Skeleton className="col-span-4 h-[350px]" />
                <Skeleton className="col-span-3 h-[350px]" />
            </div>
        </div>
    );
}
