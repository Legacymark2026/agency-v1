import { KanbanBoard } from "@/modules/crm/components/KanbanBoard";
import { getDeals } from "@/modules/crm/actions/crm";
import { prisma } from "@/lib/prisma";
import { NewDealDialog } from "@/modules/crm/components/NewDealDialog";
import { CsvExportButton } from "@/modules/crm/components/CsvExportButton";
import { CsvImportDialog } from "@/components/crm/CsvImportDialog";
import { AiForecastWidget } from "@/components/crm/AiForecastWidget";
import { GitFork, DollarSign, TrendingUp, Users, BarChart2 } from "lucide-react";

export default async function PipelinePage() {
    const company = await prisma.company.findFirst();
    let deals: any[] = [];
    let companyUsers: { id: string; name: string | null; email: string | null }[] = [];
    
    if (company) {
        const [dealsRes, usersData] = await Promise.all([
            getDeals(company.id),
            prisma.companyUser.findMany({
                where: { companyId: company.id },
                include: { user: { select: { id: true, name: true, email: true } } }
            })
        ]);
        if (dealsRes.success) deals = dealsRes.data || [];
        companyUsers = usersData.map(cu => cu.user);
    }

    const totalValue = deals.reduce((s, d) => s + d.value, 0);
    const wonValue = deals.filter(d => d.stage === 'WON').reduce((s, d) => s + d.value, 0);
    const weightedValue = deals.reduce((s, d) => s + (d.value * (d.probability || 0) / 100), 0);
    const pipelineCount = deals.length;

    const kpis = [
        { label: "Total Pipeline", value: `$${totalValue.toLocaleString()}`, code: "PPL_TOT", icon: DollarSign, trend: "+12.5%" },
        { label: "Weighted Forecast", value: `$${Math.round(weightedValue).toLocaleString()}`, code: "WGT_PL", icon: BarChart2, trend: "Predictivo" },
        { label: "Won Revenue", value: `$${wonValue.toLocaleString()}`, code: "REV_WON", icon: TrendingUp, trend: "YTD" },
        { label: "Deals Activos", value: pipelineCount.toString(), code: "DLS_ACT", icon: Users, trend: "Manejados" },
    ];

    return (
        <div className="ds-page h-full flex flex-col space-y-6">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* Header */}
            <div className="relative z-10 flex justify-between items-center pb-6"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <div className="mb-3">
                        <span className="ds-badge ds-badge-teal">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                            </span>
                            CRM_CORE · PIPELINE
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-11 h-11">
                            <GitFork className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page">Sales Pipeline</h1>
                            <p className="ds-subtext mt-1">Gestiona deals · Rastrea revenue</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 shrink-0">
                    <CsvExportButton deals={deals} />
                    <CsvImportDialog companyId={company?.id ?? ""} />
                    {company && <NewDealDialog companyId={company.id} />}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((k, i) => (
                    <div key={k.code} className="ds-kpi group relative">
                        <span className="absolute top-3 right-3 font-mono text-[8px] text-slate-700 uppercase tracking-widest group-hover:text-slate-500 transition-colors">[{k.code}]</span>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em]">{k.label}</p>
                                <div className="ds-icon-box w-7 h-7">
                                    <k.icon size={12} strokeWidth={1.5} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
                                </div>
                            </div>
                            <p className="ds-stat-value">{k.value}</p>
                            <span className="inline-flex items-center gap-1 mt-3 px-2 py-0.5 font-mono text-[9px] font-bold rounded-sm text-teal-400"
                                style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.25)' }}>
                                {k.trend}
                            </span>
                        </div>
                        {/* Mini sparkline */}
                        <div className="flex gap-0.5 h-4 items-end mt-4 opacity-30 group-hover:opacity-50 transition-opacity">
                            {[40, 60, 45, 80, 55, 90, 75].map((h, j) => (
                                <div key={j} className="flex-1 bg-teal-500 rounded-t-sm" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Forecast Widget */}
            {company && (
                <div className="relative z-10">
                    <AiForecastWidget companyId={company.id} />
                </div>
            )}

            {/* Board */}
            <div className="relative z-10 flex-1 min-h-[500px] overflow-hidden ds-section">
                <KanbanBoard initialDeals={deals} users={companyUsers} />
            </div>
        </div>
    );
}
