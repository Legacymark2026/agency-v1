"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditCard, Download, Zap, TrendingUp, Users, BarChart3, Receipt, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { getUsageStats, getInvoices } from "@/actions/developer";
import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(Math.round(n));
const pct = (val: number, limit: number) => Math.min(Math.round((val / limit) * 100), 100);
const fmtMoney = (cents: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(cents / 100);
const fmtDate = (d: any) =>
    d ? new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }) : "—";

const PLAN_FEATURES = [
    "Contactos ilimitados",
    "Automatizaciones de Marketing",
    "API de WhatsApp Business",
    "Agentes IA integrados",
    "Módulo de Nómina completo",
    "Soporte prioritario 24/7",
    "Analytics avanzados",
    "Integraciones ilimitadas",
];

export default function BillingPage() {
    const [usage, setUsage] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "invoices">("overview");
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [loadingPortal, setLoadingPortal] = useState(false);

    async function handleUpgrade() {
        setLoadingCheckout(true);
        try {
            const res = await createCheckoutSession("pro", false);
            if (res.success) {
                window.location.href = (res.data as { url: string }).url;
            } else {
                toast.error(!res.success ? res.error : "Error procesando el pago.");
            }
        } finally {
            setLoadingCheckout(false);
        }
    }

    async function handlePortal() {
        setLoadingPortal(true);
        try {
            const res = await createPortalSession();
            if (res.success) {
                window.location.href = (res.data as { url: string }).url;
            } else {
                toast.error(!res.success ? res.error : "Error abriendo el portal.");
            }
        } finally {
            setLoadingPortal(false);
        }
    }

    const load = useCallback(async () => {
        setIsLoading(true);
        const [uRes, iRes] = await Promise.all([getUsageStats(), getInvoices()]);
        if (uRes.success) setUsage(uRes.data);
        if (iRes.success) setInvoices(iRes.data);
        setIsLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    nextBillingDate.setDate(1);

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-3">
                    <CreditCard className="w-3.5 h-3.5" /> PLAN & FACTURACIÓN
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Facturación y Suscripción</h2>
                <p className="text-slate-400 text-sm mt-1">Gestiona tu plan, monitorea el consumo y descarga facturas.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
                {[["overview", "Resumen"], ["invoices", "Facturas"]].map(([val, label]) => (
                    <button key={val} onClick={() => setActiveTab(val as any)}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === val ? "bg-teal-600 text-white shadow-[0_0_10px_rgba(20,184,166,0.3)]" : "text-slate-400 hover:text-white"}`}>
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === "overview" && (
                <>
                    {/* Current Plan Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/30 border border-teal-500/20 rounded-xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 rounded-full -translate-y-10 translate-x-10" />
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        {/* Plan badge dinámico desde la DB */}
                                        <span className={`text-xs font-mono font-bold px-2 py-1 rounded-full border ${
                                            usage?.plan === 'agency'
                                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                : usage?.plan === 'free'
                                                ? 'bg-slate-700/50 text-slate-400 border-slate-600'
                                                : 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                                        }`}>
                                            {usage?.plan ? `${usage.plan.toUpperCase()} PLAN` : 'CARGANDO...'}
                                            {usage?.subscriptionStatus === 'active' ? ' ACTIVO' : usage?.subscriptionStatus === 'past_due' ? ' - PAGO PENDIENTE' : ''}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-white">
                                            {usage?.plan === 'agency' ? '$99' : usage?.plan === 'pro' ? '$49' : '$0'}
                                            <span className="text-base font-medium text-slate-400">/mes</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Próximo cobro: {fmtDate(nextBillingDate)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-5">
                                    {PLAN_FEATURES.map(f => (
                                        <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={handleUpgrade} 
                                        disabled={loadingCheckout}
                                        className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg transition-colors shadow-[0_0_12px_rgba(20,184,166,0.3)] flex items-center justify-center">
                                        {loadingCheckout ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Mejorar a Enterprise
                                    </button>
                                    <button 
                                        onClick={handlePortal}
                                        disabled={loadingPortal}
                                        className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center justify-center">
                                        {loadingPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Gestionar Portal de Pago
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-4">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-slate-400" /> Método de Pago
                                </h3>
                                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
                                    <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded shrink-0 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">VISA</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-mono text-slate-300">•••• •••• •••• 4242</p>
                                        <p className="text-xs text-slate-500">Vence 12/26</p>
                                    </div>
                                </div>
                                <button className="mt-3 w-full text-xs text-teal-400 hover:text-teal-300 transition-colors text-center">
                                    Actualizar método de pago →
                                </button>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <h3 className="text-sm font-semibold text-white mb-1">Miembros del Plan</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-white">{usage?.members || "—"}</span>
                                    <span className="text-slate-500 text-sm">/ {usage?.limits?.members || 25} seats</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                    <div className="h-2 bg-teal-500 rounded-full" style={{ width: `${pct(usage?.members || 0, usage?.limits?.members || 25)}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Usage KPIs */}
                    {usage && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-teal-500" /> Consumo del Mes Actual
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                {[
                                    { label: "API Calls", val: usage.apiCalls, limit: usage.limits.apiCalls, color: "bg-teal-500" },
                                    { label: "Leads", val: usage.leads, limit: usage.limits.leads, color: "bg-blue-500" },
                                    { label: "Emails Enviados", val: usage.emailsSent, limit: usage.limits.emailsSent, color: "bg-violet-500" },
                                    { label: "AI Tokens", val: usage.aiTokens, limit: usage.limits.aiTokens, color: "bg-amber-500" },
                                ].map((m, i) => {
                                    const p = pct(m.val, m.limit);
                                    return (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">{m.label}</span>
                                                <span className={`font-mono font-bold ${p >= 90 ? "text-red-400" : p >= 75 ? "text-amber-400" : "text-slate-300"}`}>{p}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-2 rounded-full transition-all duration-700 ${p >= 90 ? "bg-red-500" : p >= 75 ? "bg-amber-500" : m.color}`}
                                                    style={{ width: `${p}%` }} />
                                            </div>
                                            <div className="text-xs text-slate-600 tabular-nums">{fmt(m.val)} / {fmt(m.limit)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === "invoices" && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-slate-400" /> Historial de Facturas
                        </h3>
                        <span className="text-xs text-slate-500">{invoices.length} facturas</span>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                        {invoices.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">No hay facturas disponibles.</div>
                        ) : invoices.map(inv => (
                            <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-800 rounded-lg">
                                        <Receipt className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">Factura #{inv.id}</p>
                                        <p className="text-xs text-slate-500">{fmtDate(inv.date)} · Plan Pro</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PAGADA</span>
                                    <span className="font-mono font-bold text-white">${(inv.amount / 100).toFixed(0)}</span>
                                    <button className="p-2 text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors" title="Descargar factura">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
