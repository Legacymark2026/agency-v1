import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { DollarSign, TrendingUp, Users, CheckCircle, Clock, XCircle } from "lucide-react";
import { CommissionActions } from "./CommissionActions";

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    PENDING: { label: "Pendiente", color: "#f59e0b", icon: Clock },
    APPROVED: { label: "Aprobado", color: "#0ea5e9", icon: TrendingUp },
    PAID: { label: "Pagado", color: "#10b981", icon: CheckCircle },
    CANCELLED: { label: "Cancelado", color: "#ef4444", icon: XCircle },
};

export default async function CommissionsPage() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const cu = await prisma.companyUser.findFirst({ where: { userId: session.user.id } });
        if (!cu) return (
            <div className="ds-page flex items-center justify-center">
                <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">Empresa no configurada</p>
            </div>
        );

        const companyId = cu.companyId;

        // Inline queries — avoid calling server action from server component
        const [rules, payments] = await Promise.all([
            prisma.commissionRule.findMany({
                where: { companyId },
                include: { user: { select: { id: true, name: true } } },
                orderBy: { rate: "desc" },
            }).catch(() => []),
            prisma.commissionPayment.findMany({
                where: { companyId },
                include: {
                    user: { select: { id: true, name: true, email: true, image: true } },
                    deal: { select: { id: true, title: true, value: true, stage: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 100,
            }).catch(() => []),
        ]);

        // Aggregate by user
        const byUser: Record<string, { name: string; total: number; pending: number; paid: number; count: number }> = {};
        for (const p of payments) {
            if (!byUser[p.userId]) {
                byUser[p.userId] = { name: (p.user as any).name ?? (p.user as any).email ?? "?", total: 0, pending: 0, paid: 0, count: 0 };
            }
            byUser[p.userId].total += p.amount;
            byUser[p.userId].count++;
            if (p.status === "PENDING" || p.status === "APPROVED") byUser[p.userId].pending += p.amount;
            if (p.status === "PAID") byUser[p.userId].paid += p.amount;
        }

        const totals = {
            totalAmount: payments.reduce((s, p) => s + p.amount, 0),
            pendingAmount: payments.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0),
            paidAmount: payments.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0),
        };

        return (
            <div className="ds-page space-y-8">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none" />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between pb-6" style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                    <div>
                        <span className="ds-badge ds-badge-teal mb-3 inline-flex">
                            <span className="relative flex h-1.5 w-1.5 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" /></span>
                            CRM_CORE · COMMISSIONS
                        </span>
                        <div className="flex items-center gap-4">
                            <div className="ds-icon-box w-11 h-11"><DollarSign className="w-5 h-5 text-teal-400" /></div>
                            <div>
                                <h1 className="ds-heading-page">Comisiones de Ventas</h1>
                                <p className="ds-subtext mt-1">Reglas, pagos y seguimiento por vendedor</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPIs */}
                <div className="relative z-10 grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Generado", value: `$${(totals.totalAmount / 1000).toFixed(2)}k`, icon: DollarSign, color: "text-teal-400" },
                        { label: "Por Pagar", value: `$${(totals.pendingAmount / 1000).toFixed(2)}k`, icon: Clock, color: "text-amber-400" },
                        { label: "Pagado", value: `$${(totals.paidAmount / 1000).toFixed(2)}k`, icon: CheckCircle, color: "text-emerald-400" },
                    ].map(k => (
                        <div key={k.label} className="ds-kpi group">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em]">{k.label}</p>
                                <div className="ds-icon-box w-7 h-7"><k.icon size={12} strokeWidth={1.5} className={k.color} /></div>
                            </div>
                            <p className="ds-stat-value">{k.value}</p>
                        </div>
                    ))}
                </div>

                {/* By Rep */}
                {Object.keys(byUser).length > 0 && (
                    <div className="relative z-10 ds-section">
                        <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em] mb-5">Por Vendedor</p>
                        <div className="space-y-3">
                            {Object.entries(byUser).sort(([, a], [, b]) => b.total - a.total).map(([userId, data]) => (
                                <div key={userId} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-black text-white flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)' }}>
                                        {data.name[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-mono text-xs font-bold text-slate-300">{data.name}</p>
                                        <p className="font-mono text-xs text-slate-600">{data.count} pagos</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-black text-sm text-teal-400">${(data.total / 1000).toFixed(2)}k</p>
                                        <p className="font-mono text-xs text-amber-500">${(data.pending / 1000).toFixed(2)}k pendiente</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Commission Rules */}
                <div className="relative z-10 ds-section">
                    <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em] mb-5">Reglas de Comisión</p>
                    {rules.length === 0 ? (
                        <p className="font-mono text-xs text-slate-600 text-center py-6">Sin reglas configuradas. Las comisiones se crean automáticamente al ganar un deal.</p>
                    ) : (
                        <div className="space-y-2">
                            {rules.map(rule => (
                                <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(30,41,59,0.8)' }}>
                                    <div>
                                        <p className="font-mono text-xs font-bold text-slate-200">{rule.label ?? ((rule.user as any)?.name ?? "Regla Global")}</p>
                                        <p className="font-mono text-xs text-slate-600">Mín. deal: ${rule.minDealValue.toLocaleString()}{rule.capAmount ? ` · Cap: $${rule.capAmount.toLocaleString()}` : ""}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono font-black text-xl text-teal-400">{(rule.rate * 100).toFixed(1)}%</span>
                                        <div className={`w-2 h-2 rounded-full ${rule.isActive ? "bg-teal-400" : "bg-slate-600"}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Payments */}
                <div className="relative z-10 ds-section">
                    <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-[0.14em] mb-5">Historial de Pagos</p>
                    <div className="space-y-2">
                        {payments.length === 0 ? (
                            <p className="font-mono text-xs text-slate-600 text-center py-6">Sin historial de pagos aún.</p>
                        ) : payments.slice(0, 20).map(p => {
                            const st = STATUS_MAP[p.status] ?? STATUS_MAP.PENDING;
                            return (
                                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg transition-all" style={{ background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(30,41,59,0.6)' }}>
                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.color }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-mono text-xs text-slate-300 truncate">{(p.deal as any).title}</p>
                                        <p className="font-mono text-xs text-slate-600">{(p.user as any).name} · {(p.rate * 100).toFixed(1)}%</p>
                                    </div>
                                    <span className="font-mono text-xs font-bold flex-shrink-0" style={{ color: st.color }}>{st.label}</span>
                                    <p className="font-mono font-black text-sm text-slate-100 flex-shrink-0">${p.amount.toFixed(0)}</p>
                                    <CommissionActions paymentId={p.id} currentStatus={p.status} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    } catch (err: any) {
        console.error("[CommissionsPage] Error:", err?.message);
        return (
            <div className="ds-page flex items-center justify-center">
                <div className="text-center">
                    <p className="font-mono text-red-400 text-sm">Error al cargar Comisiones</p>
                    <p className="font-mono text-slate-600 text-xs mt-2">{err?.message}</p>
                </div>
            </div>
        );
    }
}
