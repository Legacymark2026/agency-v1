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
        <div className="ds-page h-full flex flex-col space-y-6">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* ══ SECTION 1: Header ══ */}
            <div className="relative z-10 flex justify-between items-start pb-6"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <div className="mb-3">
                        <span className="ds-badge ds-badge-amber">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
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
                            <p className="ds-subtext mt-1">Gestiona deals · Rastrea revenue · Cierra oportunidades</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 pt-1">
                    <CsvExportButton deals={deals} />
                    <CsvImportDialog companyId={company?.id ?? ""} />
                    {company && <NewDealDialog companyId={company.id} />}
                </div>
            </div>

            {/* ══ SECTION 2: KPI Strip ══ */}
            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {kpis.map((k) => (
                    <div key={k.code} className="ds-kpi group relative">
                        <span className="absolute top-3 right-3 font-mono text-[10px] text-slate-800 uppercase tracking-widest group-hover:text-slate-600 transition-colors">[{k.code}]</span>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="ds-icon-box w-7 h-7">
                                    <k.icon size={12} strokeWidth={1.5} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
                                </div>
                                <p className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">{k.label}</p>
                            </div>
                            <p className="ds-stat-value">{k.value}</p>
                            <p className="text-[11px] text-slate-600 mt-1 font-mono">{k.sub}</p>
                        </div>
                        <div className="flex gap-0.5 h-3 items-end mt-4 opacity-20 group-hover:opacity-40 transition-opacity">
                            {[35, 55, 42, 75, 50, 88, 70].map((h, j) => (
                                <div key={j} className="flex-1 bg-teal-500 rounded-t-sm" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ══ SECTION 3: Intelligence Row ══ */}
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1" style={{ background: 'rgba(30,41,59,0.6)' }} />
                    <span className="font-mono text-[9px] text-slate-700 uppercase tracking-[0.2em] px-2">PIPELINE INTELLIGENCE</span>
                    <div className="h-px flex-1" style={{ background: 'rgba(30,41,59,0.6)' }} />
                </div>
                {company && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            <AiForecastWidget companyId={company.id} />
                        </div>
                        <div>
                            <PipelineVelocity deals={deals} />
                        </div>
                    </div>
                )}
            </div>

            {/* ══ SECTION 4: Alerts ══ */}
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1" style={{ background: 'rgba(30,41,59,0.6)' }} />
                    <span className="font-mono text-[9px] text-slate-700 uppercase tracking-[0.2em] px-2">DEAL HEALTH MONITOR</span>
                    <div className="h-px flex-1" style={{ background: 'rgba(30,41,59,0.6)' }} />
                </div>
                <DealAgingAlerts deals={deals} />
            </div>

            {/* ══ SECTION 5: Kanban Board ══ */}
            <div className="relative z-10 flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1" style={{ background: 'rgba(30,41,59,0.6)' }} />
                    <span className="font-mono text-[9px] text-slate-700 uppercase tracking-[0.2em] px-2">KANBAN BOARD</span>
                    <div className="h-px flex-1" style={{ background: 'rgba(30,41,59,0.6)' }} />
                </div>
                <div className="min-h-[500px] overflow-hidden ds-section">
                    <ComponentErrorBoundary title="Error cargando el Tablero Kanban">
                        <KanbanBoard initialDeals={deals} users={companyUsers} />
                    </ComponentErrorBoundary>
                </div>
            </div>
        </div>
    );
}
