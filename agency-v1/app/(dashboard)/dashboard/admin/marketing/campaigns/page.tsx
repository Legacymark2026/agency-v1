export const dynamic = 'force-dynamic';

import { getCampaignsList, getAggregatedSpend, getCampaignChartData } from "@/actions/marketing";
import CampaignsDashboardClient from "@/components/marketing/CampaignsDashboardClient";
import CampaignMetricsCards from "@/components/marketing/CampaignMetricsCards";
import { Plus, Settings, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default async function CampaignsPage() {
    const campaigns = await getCampaignsList().catch(() => []);
    const metricsResult = await getAggregatedSpend().catch(() => null);
    const rawChartData = await getCampaignChartData().catch(() => []);

    const safeMetrics = metricsResult ?? { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, cpa: 0 };

    // Map DB object to what the client component expects
    const formattedCampaigns = campaigns.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        platform: c.platform,
        status: c.status,
        budget: c.budget,
        spend: c.spend,
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.conversions
    }));

    return (
        <div className="ds-page space-y-8">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* ── Header ── */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <div className="mb-4">
                        <span className="ds-badge ds-badge-teal">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                            </span>
                            MKT_SYS · CAMPAÑAS ACTIVAS
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-12 h-12">
                            <Target className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page">Campañas & Ad Spend</h1>
                            <p className="ds-subtext mt-2">Meta · Google · TikTok · LinkedIn &mdash; Vista CMO Centralizada</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[9px] text-slate-700 uppercase tracking-widest hidden md:block">[MKT_LIVE]</span>
                    <Link href="/dashboard/admin/marketing/settings">
                        <button id="campaigns-api-btn" className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest text-slate-400 border border-slate-800 hover:border-teal-800 hover:text-teal-400 transition-all rounded-sm bg-slate-950/50">
                            <Settings className="h-3.5 w-3.5" /> Conexiones API
                        </button>
                    </Link>
                    <Link href="/dashboard/admin/marketing/campaigns/new">
                        <button id="campaigns-new-btn" className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest text-white border border-teal-700/50 bg-teal-900/30 hover:bg-teal-800/30 hover:border-teal-500 hover:shadow-[0_0_20px_-8px_rgba(13,148,136,0.5)] transition-all rounded-sm">
                            <Plus className="h-3.5 w-3.5" /> Nueva Campaña
                        </button>
                    </Link>
                </div>
            </div>

            <div className="relative z-10">
                <CampaignMetricsCards metrics={safeMetrics} />
            </div>

            <div className="relative z-10">
                <CampaignsDashboardClient initialCampaigns={formattedCampaigns} serverChartData={rawChartData} />
            </div>
        </div>
    );
}
