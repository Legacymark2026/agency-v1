import { getDripCampaigns, createDripCampaign } from "@/actions/marketing/campaigns";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Plus, Mail, Users, BarChart3, Clock, Radio, CheckCircle, PauseCircle } from "lucide-react";



export default async function CampaignsPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect("/auth/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { companies: true }
    });
    const companyId = user?.companies[0]?.companyId;
    if (!companyId) return (
        <div className="ds-page flex items-center justify-center">
            <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">&gt; Empresa no configurada_</p>
        </div>
    );

    const campaigns = await getDripCampaigns(companyId);

    async function handleCreate(formData: FormData) {
        'use server';
        const name = formData.get("name") as string;
        await createDripCampaign({ name, companyId: companyId! });
    }

    const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length;

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
                            MKT_CAMP · EMAIL DRIP
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-12 h-12">
                            <Mail className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page">Email Campaigns</h1>
                            <p className="ds-subtext mt-2">Drip sequences · Newsletters · {activeCount} active</p>
                        </div>
                    </div>
                </div>

                {/* Create Campaign Form */}
                <form action={handleCreate} className="flex gap-2 shrink-0 items-center">
                    <input
                        name="name"
                        placeholder="Nueva campaña..."
                        required
                        className="px-3 py-2 font-mono text-[11px] text-slate-200 rounded-sm placeholder:text-slate-700 focus:outline-none focus:border-teal-800/50 transition-all w-[200px]"
                        style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}
                    />
                    <button type="submit"
                        className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white rounded-sm transition-all hover:-translate-y-0.5"
                        style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.4)' }}>
                        <Plus size={12} /> Crear
                    </button>
                </form>
            </div>

            {/* Campaign Cards */}
            <div className="relative z-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map(campaign => {
                    const isActive = campaign.status === 'ACTIVE';
                    return (
                        <div key={campaign.id} className="ds-card group">
                            {/* Code tag */}
                            <span className="absolute top-3 right-3 font-mono text-[8px] text-slate-700 uppercase tracking-widest group-hover:text-slate-500 transition-colors">[CAMP]</span>

                            {/* Teal accent bar top for active */}
                            {isActive && (
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent" />
                            )}

                            <div className="relative z-10">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`ds-icon-box w-9 h-9 ${isActive ? 'border-teal-800/50 bg-teal-950/30' : ''}`}>
                                            <Mail size={14} strokeWidth={1.5} className={isActive ? 'text-teal-400' : 'text-slate-500'} />
                                        </div>
                                        <div>
                                            <h3 className="text-[13px] font-black text-slate-100 truncate max-w-[160px]">{campaign.name}</h3>
                                            <p className="font-mono text-[8px] text-slate-700 uppercase tracking-widest">{campaign.code}</p>
                                        </div>
                                    </div>
                                    <span className={`ds-badge ${isActive ? 'ds-badge-teal' : 'ds-badge-slate'}`}>
                                        {isActive ? <CheckCircle size={8} /> : <PauseCircle size={8} />}
                                        {campaign.status}
                                    </span>
                                </div>

                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-2 pt-4"
                                    style={{ borderTop: '1px solid rgba(30,41,59,0.8)' }}>
                                    <div className="text-center">
                                        <div className="ds-stat-value text-xl">{campaign._count.leads}</div>
                                        <div className="flex items-center justify-center gap-1 ds-mono-label mt-1">
                                            <Users size={9} /> Leads
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="ds-stat-value text-xl">0%</div>
                                        <div className="flex items-center justify-center gap-1 ds-mono-label mt-1">
                                            <BarChart3 size={9} /> Open Rate
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="ds-stat-value text-xl">0%</div>
                                        <div className="flex items-center justify-center gap-1 ds-mono-label mt-1">
                                            <Clock size={9} /> CTR
                                        </div>
                                    </div>
                                </div>

                                {/* CTA */}
                                <Link href={`/dashboard/marketing/campaigns/${campaign.id}`}
                                    className="flex items-center justify-center gap-2 w-full mt-5 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-teal-400 transition-all rounded-sm"
                                    style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}>
                                    Edit Sequence →
                                </Link>
                            </div>
                        </div>
                    );
                })}

                {campaigns.length === 0 && (
                    <div className="col-span-full ds-section flex flex-col items-center justify-center py-16 text-center">
                        <div className="ds-icon-box w-14 h-14 mx-auto mb-5">
                            <Mail size={20} strokeWidth={1.5} className="text-slate-600" />
                        </div>
                        <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest">&gt; Sin campañas activas · Crea una arriba_</p>
                    </div>
                )}
            </div>
        </div>
    );
}
