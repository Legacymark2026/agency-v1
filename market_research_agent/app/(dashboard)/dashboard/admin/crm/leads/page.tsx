import { Suspense } from "react";
import { getLeads } from "@/actions/crm";
import { prisma } from "@/lib/prisma";
import { LeadsTable } from "@/components/crm/leads-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, Target, Star, UserCheck } from "lucide-react";

export default async function LeadsPage() {
    const company = await prisma.company.findFirst();

    if (!company) {
        return (
            <div className="ds-page flex items-center justify-center min-h-screen">
                <div className="ds-section text-center max-w-sm">
                    <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">&gt; Empresa no configurada_</p>
                </div>
            </div>
        );
    }

    const [result, statusStats] = await Promise.all([
        getLeads(company.id, { pageSize: 100 }),
        prisma.lead.groupBy({ by: ["status"], _count: { status: true }, where: { companyId: company.id } }),
    ]);

    const leads = "error" in result ? [] : result.leads;
    const total = "error" in result ? 0 : result.total;

    const stats = [
        { label: "Total Leads", value: total, icon: Users, code: "TOT" },
        { label: "Nuevos", value: statusStats.find(s => s.status === "NEW")?._count.status ?? 0, icon: Star, code: "NEW" },
        { label: "Calificados", value: statusStats.find(s => s.status === "QUALIFIED")?._count.status ?? 0, icon: Target, code: "QUA" },
        { label: "Convertidos", value: statusStats.find(s => s.status === "CONVERTED")?._count.status ?? 0, icon: TrendingUp, code: "CNV" },
    ];

    return (
        <div className="ds-page space-y-8">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* ── Header ── */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <div className="mb-4">
                        <span className="ds-badge ds-badge-teal">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                            </span>
                            CRM_CORE · LEADS
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-12 h-12">
                            <UserCheck className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page">Gestión de Leads</h1>
                            <p className="ds-subtext mt-2">Rastrea · Califica · Convierte cada oportunidad</p>
                        </div>
                    </div>
                </div>
                <span className="font-mono text-[9px] text-slate-700 uppercase tracking-widest hidden md:block">[LDS_CORE]</span>
            </div>

            {/* KPI Strip */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={s.label} className="ds-kpi group">
                        <span className="absolute top-3 right-3 font-mono text-[8px] text-slate-700 uppercase tracking-widest">[{s.code}]</span>
                        <div className="relative z-10">
                            <div className="ds-icon-box w-9 h-9 mb-3">
                                <s.icon size={14} strokeWidth={1.5} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
                            </div>
                            <p className="ds-stat-value">{s.value}</p>
                            <p className="ds-stat-label">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="relative z-10 ds-section">
                <Suspense fallback={<LeadTableSkeleton />}>
                    <LeadsTable leads={leads as any} total={total} companyId={company.id} />
                </Suspense>
            </div>
        </div>
    );
}

function LeadTableSkeleton() {
    return (
        <div className="space-y-3">
            <div className="h-10 w-full rounded-sm" style={{ background: 'rgba(30,41,59,0.4)' }} />
            {[...Array(8)].map((_, i) => (
                <div key={i} className="h-14 w-full rounded-sm" style={{ background: 'rgba(30,41,59,0.3)' }} />
            ))}
        </div>
    );
}
