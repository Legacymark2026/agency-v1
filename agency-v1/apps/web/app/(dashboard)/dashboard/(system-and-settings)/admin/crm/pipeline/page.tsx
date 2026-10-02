import { KanbanBoard } from "@/modules/crm/components/KanbanBoard";
import { getDeals } from "@/modules/crm/actions/crm";
import { prisma } from "@/lib/prisma";
import { NewDealDialog } from "@/modules/crm/components/NewDealDialog";
import { CsvExportButton } from "@/modules/crm/components/CsvExportButton";
import { CsvImportDialog } from "@/components/crm/CsvImportDialog";
import { AiForecastWidget } from "@/components/crm/AiForecastWidget";
import { PipelineVelocity } from "@/components/crm/pipeline-velocity";
import { DealAgingAlerts } from "@/components/crm/deal-aging-alerts";
import { GitFork, DollarSign, TrendingUp, Users, BarChart2, Plus, Upload, Download } from "lucide-react";
import { ComponentErrorBoundary } from "@/shared/components/ui/ComponentErrorBoundary";

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

    const totalValue = deals.reduce((s, d) => s + (d.value || 0), 0);
    const wonValue = deals.filter(d => d.stage === 'WON').reduce((s, d) => s + (d.value || 0), 0);
    const weightedValue = deals.reduce((s, d) => s + ((d.value || 0) * (d.probability || 0) / 100), 0);
    const pipelineCount = deals.length;
    const activeDeals = deals.filter(d => d.stage !== 'WON' && d.stage !== 'LOST').length;

    const kpis = [
        { label: "Total Pipeline", value: `$${totalValue.toLocaleString()}`, code: "PPL_TOT", icon: DollarSign, sub: `${pipelineCount} deals` },
        { label: "Forecast Ponderado", value: `$${Math.round(weightedValue).toLocaleString()}`, code: "WGT_PL", icon: BarChart2, sub: "Por probabilidad" },
        { label: "Revenue Ganado", value: `$${wonValue.toLocaleString()}`, code: "REV_WON", icon: TrendingUp, sub: "YTD cerrado" },
        { label: "Deals Activos", value: activeDeals.toString(), code: "DLS_ACT", icon: Users, sub: `de ${pipelineCount} totales` },
    ];

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col space-y-4 overflow-hidden relative ds-page">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* ══ SECTION 1: Header & Compact KPIs ══ */}
            <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-end gap-4 pb-4"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-10 h-10">
                            <GitFork className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-black text-white tracking-tight">Sales Pipeline</h1>
                                <span className="ds-badge ds-badge-amber py-0">CRM_CORE</span>
                            </div>
                            <p className="ds-subtext mt-0.5 text-xs">Gestiona deals y revenue</p>
                        </div>
                    </div>
                </div>

                {/* Compact KPIs */}
                <div className="flex items-center gap-4 bg-slate-900/50 rounded-lg border border-slate-800 p-2">
                    {kpis.map((k, i) => (
                        <div key={k.code} className={`flex items-center gap-3 ${i !== 0 ? 'pl-4 border-l border-slate-800' : ''}`}>
                            <k.icon size={14} className="text-teal-500" />
                            <div>
                                <p className="text-[9px] font-mono font-bold text-slate-500 uppercase">{k.label}</p>
                                <p className="text-sm font-black text-white">{k.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <CsvExportButton deals={deals} />
                    <CsvImportDialog companyId={company?.id ?? ""} />
                    {company && <NewDealDialog companyId={company.id} />}
                </div>
            </div>

            {/* ══ SECTION 2: Main Content (Board + Right Sidebar) ══ */}
            <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
                
                {/* Left: Kanban Board */}
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-slate-900/40 rounded-xl border border-slate-800/80">
                    <div className="flex-1 overflow-hidden p-2">
                        <ComponentErrorBoundary title="Error cargando el Tablero Kanban">
                            <KanbanBoard initialDeals={deals} users={companyUsers} />
                        </ComponentErrorBoundary>
                    </div>
                </div>

                {/* Right: Intelligence Sidebar */}
                <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-track]:bg-transparent">
                    {company && (
                        <div className="flex flex-col gap-4">
                            <PipelineVelocity deals={deals} />
                            <AiForecastWidget companyId={company.id} />
                        </div>
                    )}
                    <DealAgingAlerts deals={deals} />
                </div>
            </div>
        </div>
    );
}
