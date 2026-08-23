export const dynamic = 'force-dynamic';

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDripCampaigns, createDripCampaign } from "@/actions/marketing/campaigns";
import CampaignsDashboardClient from "@/components/marketing/CampaignsDashboardClient";
import CampaignMetricsCards from "@/components/marketing/CampaignMetricsCards";
import { Plus, Mail, Target, Settings, CheckCircle, PauseCircle, Users, BarChart3, Clock } from "lucide-react";
import Link from 'next/link';

export default async function CampaignsPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/auth/login");

    // 1. Resolve Company ID safely (supports super_admin and single-tenant fallback)
    let companyId: string | undefined;
    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { companies: true }
        });
        companyId = user?.companies[0]?.companyId;

        if (!companyId) {
            const firstCompany = await prisma.company.findFirst({ select: { id: true } });
            companyId = firstCompany?.id;
        }
    } catch (e) {
        console.warn("[CampaignsPage] Error resolving company:", e);
    }

    if (!companyId) {
        return (
            <div className="ds-page flex items-center justify-center min-h-[400px]">
                <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">&gt; Configurando espacio de trabajo de la empresa..._</p>
            </div>
        );
    }

    // 2. Fetch both Paid & Drip campaigns safely with full error shielding
    let dripCampaigns: any[] = [];
    let paidCampaigns: any[] = [];
    let safeMetrics = { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, cpa: 0 };

    try {
        const [dripList, allCampaigns] = await Promise.all([
            getDripCampaigns(companyId).catch(() => []),
            prisma.campaign.findMany({
                where: { companyId },
                orderBy: { updatedAt: 'desc' },
                take: 50,
            }).catch(() => [])
        ]);

        dripCampaigns = dripList;
        paidCampaigns = allCampaigns;

        // Calculate aggregated metrics
        const totalSpend = allCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
        const totalImpressions = allCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
        const totalClicks = allCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
        const totalConversions = allCampaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
        const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

        safeMetrics = { totalSpend, totalImpressions, totalClicks, totalConversions, cpa };
    } catch (err) {
        console.error("[CampaignsPage] Data load error:", err);
    }

    async function handleCreate(formData: FormData) {
        'use server';
        const name = formData.get("name") as string;
        if (name && companyId) {
            await createDripCampaign({ name, companyId });
        }
    }

    const formattedCampaigns = paidCampaigns.map(c => ({
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

    const activeDripCount = dripCampaigns.filter(c => c.status === 'ACTIVE').length;

    return (
        <div className="ds-page space-y-8 w-full">
            {/* Ambient grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* ── Page Header ── */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <div className="mb-4">
                        <span className="ds-badge ds-badge-teal">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                            </span>
                            MKT_SYS · CAMPAÑAS & AD SPEND
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-12 h-12">
                            <Target className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page">Gestor Central de Campañas</h1>
                            <p className="ds-subtext mt-2">Meta Ads · Google Ads · TikTok · LinkedIn · Secuencias de Email Drip</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    <Link href="/dashboard/marketing/email-blast">
                        <button className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest text-slate-300 border border-slate-800 hover:border-teal-700 hover:text-teal-400 transition-all rounded-sm bg-slate-900/60">
                            <Mail className="h-3.5 w-3.5" /> Email Masivo
                        </button>
                    </Link>
                    <Link href="/dashboard/admin/marketing/creative-studio">
                        <button className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest text-white border border-teal-700/50 bg-teal-900/30 hover:bg-teal-800/30 hover:border-teal-500 hover:shadow-[0_0_20px_-8px_rgba(13,148,136,0.5)] transition-all rounded-sm">
                            <Plus className="h-3.5 w-3.5" /> Creative Studio IA
                        </button>
                    </Link>
                </div>
            </div>

            {/* ── KPI Summary Cards ── */}
            <div className="relative z-10">
                <CampaignMetricsCards metrics={safeMetrics} />
            </div>

            {/* ── Main Performance & Multi-Platform Ad Spend View ── */}
            <div className="relative z-10">
                <CampaignsDashboardClient initialCampaigns={formattedCampaigns} serverChartData={[]} />
            </div>

            {/* ── Email Drip Sequences Section ── */}
            <div className="relative z-10 pt-8 border-t border-slate-800/80 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Mail className="w-5 h-5 text-teal-400" /> Secuencias de Email Drip ({activeDripCount} activas)
                        </h2>
                        <p className="text-xs text-slate-400">Automatizaciones de nutrición de leads y secuencias por goteo</p>
                    </div>

                    <form action={handleCreate} className="flex gap-2 items-center">
                        <input
                            name="name"
                            placeholder="Nombre de secuencia..."
                            required
                            className="px-3 py-2 font-mono text-xs text-slate-200 rounded-sm placeholder:text-slate-600 focus:outline-none focus:border-teal-700 transition-all w-[220px]"
                            style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(30,41,59,0.8)' }}
                        />
                        <button type="submit"
                            className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-white rounded-sm transition-all hover:bg-teal-900/50"
                            style={{ background: 'rgba(13,148,136,0.25)', border: '1px solid rgba(13,148,136,0.5)' }}>
                            <Plus size={12} /> Nueva Secuencia
                        </button>
                    </form>
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {dripCampaigns.map(campaign => {
                        const isActive = campaign.status === 'ACTIVE';
                        return (
                            <div key={campaign.id} className="ds-card group">
                                <span className="absolute top-3 right-3 font-mono text-xs text-slate-700 uppercase tracking-widest">[DRIP]</span>
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`ds-icon-box w-9 h-9 ${isActive ? 'border-teal-800/50 bg-teal-950/30' : ''}`}>
                                                <Mail size={14} className={isActive ? 'text-teal-400' : 'text-slate-500'} />
                                            </div>
                                            <div>
                                                <h3 className="text-[13px] font-black text-slate-100 truncate max-w-[160px]">{campaign.name}</h3>
                                                <p className="font-mono text-[10px] text-slate-600 uppercase">{campaign.code}</p>
                                            </div>
                                        </div>
                                        <span className={`ds-badge ${isActive ? 'ds-badge-teal' : 'ds-badge-slate'}`}>
                                            {isActive ? <CheckCircle size={8} /> : <PauseCircle size={8} />}
                                            {campaign.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80">
                                        <div className="text-center">
                                            <div className="ds-stat-value text-lg">{campaign._count?.leads || 0}</div>
                                            <div className="ds-mono-label mt-1 text-[10px]">Leads</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="ds-stat-value text-lg">0%</div>
                                            <div className="ds-mono-label mt-1 text-[10px]">Apertura</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="ds-stat-value text-lg">0%</div>
                                            <div className="ds-mono-label mt-1 text-[10px]">CTR</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {dripCampaigns.length === 0 && (
                        <div className="col-span-full ds-section flex flex-col items-center justify-center py-12 text-center">
                            <Mail size={24} className="text-slate-600 mb-3" />
                            <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">&gt; Sin secuencias de email activas · Crea una arriba_</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
