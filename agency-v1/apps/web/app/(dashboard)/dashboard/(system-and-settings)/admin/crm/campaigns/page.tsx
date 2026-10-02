import { getCampaigns } from "@/actions/crm";
import { prisma } from "@/lib/prisma";
import { CreateCampaignDialog, CampaignRow } from "@/components/crm/campaign-components";
import { BarChart2, Users, TrendingUp, DollarSign, MousePointer } from "lucide-react";

export default async function CampaignsPage() {
    const company = await prisma.company.findFirst();

    if (!company) {
        return <div className="p-8 text-center text-slate-500">No se encontró la empresa. Configura tu empresa primero.</div>;
    }

    const result = await getCampaigns(company.id);
    const campaigns = Array.isArray(result) ? result : [];

    // Aggregate KPIs
    const totalLeads = campaigns.reduce((a, c) => a + c.leadCount, 0);
    const totalSpend = campaigns.reduce((a, c) => a + c.spend, 0);
    const totalClicks = campaigns.reduce((a, c) => a + c.clicks, 0);
    const avgRoas = campaigns.length > 0 ? campaigns.reduce((a, c) => a + c.roas, 0) / campaigns.length : 0;

    const kpis = [
        { label: "Campañas Activas", value: campaigns.filter((c) => c.status === "ACTIVE").length, icon: <BarChart2 className="w-5 h-5" />, color: "text-teal-600", bg: "bg-teal-50" },
        { label: "Total Leads", value: totalLeads, icon: <Users className="w-5 h-5" />, color: "text-sky-600", bg: "bg-sky-50" },
        { label: "ROAS Promedio", value: `${avgRoas.toFixed(2)}x`, icon: <TrendingUp className="w-5 h-5" />, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Inversión Total", value: `$${totalSpend.toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: "text-violet-600", bg: "bg-violet-50" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Campañas</h1>
                    <p className="text-slate-500 mt-1">Gestiona tus campañas, rastrea ROAS y atribuye leads automáticamente.</p>
                </div>
                <CreateCampaignDialog companyId={company.id} />
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {kpis.map((k) => (
                    <div key={k.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-2xl ${k.bg} ${k.color} flex items-center justify-center flex-shrink-0`}>{k.icon}</div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{k.value}</p>
                            <p className="text-xs text-slate-400 font-medium">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Todas las Campañas</h2>
                    <span className="text-xs text-slate-400">{campaigns.length} campañas</span>
                </div>

                {campaigns.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="text-4xl mb-4">📊</div>
                        <h3 className="font-bold text-slate-900 mb-2">Sin campañas aún</h3>
                        <p className="text-sm text-slate-400 mb-6">Crea tu primera campaña para empezar a rastrear el ROAS y atribuir leads.</p>
                        <CreateCampaignDialog companyId={company.id} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    {["Campaña", "Estado", "Leads", "Impresiones", "Clicks (CTR)", "ROAS", "CPL", "Inversión", ""].map((h) => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {campaigns.map((campaign) => (
                                    <CampaignRow key={campaign.id} campaign={campaign as any} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ROAS Legend */}
            <div className="flex gap-6 text-xs text-slate-400">
                <span><span className="font-bold text-emerald-600">Verde ≥ 3x</span> — Campaña rentable</span>
                <span><span className="font-bold text-amber-600">Amarillo 1–3x</span> — Neutral, optimizar</span>
                <span><span className="font-bold text-red-500">Rojo &lt; 1x</span> — Pérdida, revisar urgente</span>
            </div>
        </div>
    );
}
