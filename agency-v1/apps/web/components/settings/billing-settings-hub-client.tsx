"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    CreditCard, Receipt, BarChart3, ShieldCheck, 
    Download, Sparkles, RefreshCw, Loader2, CheckCircle2, 
    ExternalLink, Layers, ArrowUpRight
} from "lucide-react";
import { getUsageStats, getInvoices } from "@/actions/developer";
import { createPortalSession } from "@/actions/billing";
import { toast } from "sonner";
import { ByogGatewaysManager } from "./byog-gateways-manager";
import { B2BPlanComparison } from "./b2b-plan-comparison";

type BillingTab = "overview" | "plans" | "gateways" | "invoices";

const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(Math.round(n));
const pct = (val: number, limit: number) => Math.min(Math.round((val / limit) * 100), 100);
const fmtDate = (d: any) =>
    d ? new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }) : "—";

export function BillingSettingsHubClient() {
    const [usage, setUsage] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<BillingTab>("overview");
    const [loadingPortal, setLoadingPortal] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [uRes, iRes] = await Promise.all([getUsageStats(), getInvoices()]);
            if (uRes.success) setUsage(uRes.data);
            if (iRes.success) setInvoices(iRes.data);
        } catch (e) {
            console.error("Error loading billing data", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handlePortal() {
        setLoadingPortal(true);
        try {
            const res = await createPortalSession();
            if (res.success && res.data?.url) {
                window.location.href = res.data.url;
            } else {
                toast.error(res.error || "No se pudo abrir el portal de pagos de Stripe.");
            }
        } finally {
            setLoadingPortal(false);
        }
    }

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    nextBillingDate.setDate(1);

    const tabs: { id: BillingTab; label: string; icon: any; badge?: string }[] = [
        { id: "overview", label: "Consumo & Resumen", icon: BarChart3 },
        { id: "plans", label: "Planes B2B & Precios", icon: Sparkles, badge: "Upgrade" },
        { id: "gateways", label: "Pasarelas BYOG", icon: CreditCard, badge: "KMS" },
        { id: "invoices", label: "Facturas & Recibos", icon: Receipt },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-16">
            {/* Header del Módulo de Facturación */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--ds-border)] pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            Gobernanza Financiera
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Suscripción Activa
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        Facturación, Cuotas & Pasarelas de Pago
                    </h2>
                    <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                        Supervisa las cuotas de consumo, gestiona las pasarelas omnicanal BYOG cifradas con AES-256 y descarga tus comprobantes fiscales.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePortal}
                        disabled={loadingPortal}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-2 shadow-sm transition"
                    >
                        {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4 text-teal-400" />}
                        Portal de Facturación Stripe
                    </button>
                </div>
            </div>

            {/* Pestañas de Navegación Segmentada */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                                isActive
                                    ? "bg-slate-900 text-white border border-teal-500/30 shadow-md shadow-teal-500/10 font-bold"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent font-medium"
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? "text-teal-400" : "text-slate-500"}`} />
                            <span className="text-xs">{tab.label}</span>
                            {tab.badge && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                    isActive ? "bg-teal-500/20 text-teal-300" : "bg-slate-800 text-slate-400"
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Subtab 1: Overview & Consumo */}
            {activeTab === "overview" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Current Plan Card */}
                        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 relative overflow-hidden shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                <div>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 uppercase tracking-wider">
                                        Plan Activo: {usage?.plan ? usage.plan.toUpperCase() : "ENTERPRISE MULTI-TENANT"}
                                    </span>
                                    <h3 className="text-xl font-bold text-white mt-3">
                                        Suscripción Corporativa Activa
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Renovación automática programada para el {fmtDate(nextBillingDate)}.
                                    </p>
                                </div>

                                <div className="text-left sm:text-right">
                                    <div className="text-3xl font-black text-white font-mono">
                                        {usage?.plan === "pro" ? "$49" : usage?.plan === "starter" ? "$0" : "$99"}
                                        <span className="text-sm font-normal text-slate-400"> / mes</span>
                                    </div>
                                    <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                                        ● Estado: Al día
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs">
                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Miembros</span>
                                    <span className="font-mono font-bold text-white text-sm">{usage?.members || 1} / {usage?.limits?.members || 25}</span>
                                </div>
                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Facturas Emitidas</span>
                                    <span className="font-mono font-bold text-white text-sm">Ilimitadas (UBL 2.1)</span>
                                </div>
                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">SLA Garantizado</span>
                                    <span className="font-mono font-bold text-teal-400 text-sm">99.99%</span>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-3">
                                <button
                                    onClick={() => setActiveTab("plans")}
                                    className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
                                >
                                    Cambiar o Escalar Plan <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setActiveTab("gateways")}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
                                >
                                    Configurar Cobros BYOG
                                </button>
                            </div>
                        </div>

                        {/* Payment Method Card */}
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-teal-400" /> Método de Pago Registrado
                                </h4>
                                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                                    <div className="w-10 h-7 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow">
                                        VISA
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-mono font-semibold text-white">•••• •••• •••• 4242</p>
                                        <p className="text-[11px] text-slate-400">Expira 12/2028 · Cobro automático</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handlePortal}
                                    className="mt-3 w-full py-2 text-xs text-teal-400 hover:text-teal-300 font-medium text-center transition"
                                >
                                    Actualizar tarjeta en Stripe &rarr;
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Consumo de Cuotas */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-teal-400" />
                                    Métricas de Consumo Mensual (Cuotas del Workspace)
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Monitoreo en tiempo real de recursos consumidos en el ciclo de facturación vigente.
                                </p>
                            </div>
                            <span className="text-xs text-slate-500 font-mono">
                                Reinicia: {fmtDate(nextBillingDate)}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                            {[
                                { label: "API Requests", val: usage?.apiCalls || 2840, limit: usage?.limits?.apiCalls || 100000, color: "bg-teal-500" },
                                { label: "Contactos / Leads", val: usage?.leads || 142, limit: usage?.limits?.leads || 10000, color: "bg-blue-500" },
                                { label: "Correos Salientes", val: usage?.emailsSent || 1120, limit: usage?.limits?.emailsSent || 50000, color: "bg-purple-500" },
                                { label: "Tokens IA Cognitiva", val: usage?.aiTokens || 45200, limit: usage?.limits?.aiTokens || 1000000, color: "bg-amber-500" },
                            ].map((m, i) => {
                                const p = pct(m.val, m.limit);
                                return (
                                    <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-300 font-semibold">{m.label}</span>
                                            <span className="font-mono font-bold text-white">{p}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                            <div className={`h-full rounded-full transition-all duration-500 ${m.color}`} style={{ width: `${Math.max(p, 4)}%` }} />
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-mono">
                                            {fmt(m.val)} / {fmt(m.limit)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Subtab 2: Planes B2B & Precios */}
            {activeTab === "plans" && (
                <div className="animate-in fade-in duration-200">
                    <B2BPlanComparison currentPlan={usage?.plan || "agency"} />
                </div>
            )}

            {/* Subtab 3: Pasarelas BYOG */}
            {activeTab === "gateways" && (
                <div className="animate-in fade-in duration-200">
                    <ByogGatewaysManager />
                </div>
            )}

            {/* Subtab 4: Facturas & Recibos */}
            {activeTab === "invoices" && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden animate-in fade-in duration-200">
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                <Receipt className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Comprobantes y Facturas Electrónicas</h3>
                                <p className="text-xs text-slate-400">Historial de pagos de tu suscripción con soporte PDF descargable.</p>
                            </div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{invoices.length} registros</span>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                        {invoices.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 text-xs">
                                No hay facturas previas registradas para esta cuenta.
                            </div>
                        ) : (
                            invoices.map((inv) => (
                                <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition">
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
                                            <Receipt className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">Factura #{inv.number || inv.id}</p>
                                            <p className="text-[11px] text-slate-400">{fmtDate(inv.date)} · Suscripción SaaS</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            {inv.status || "PAGADA"}
                                        </span>
                                        <span className="font-mono font-bold text-sm text-white">
                                            ${((inv.amount || 0) / 100).toFixed(2)} {inv.currency || "USD"}
                                        </span>
                                        {inv.downloadUrl && inv.downloadUrl !== "#" ? (
                                            <a
                                                href={inv.downloadUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition"
                                                title="Descargar PDF"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => toast.info("Comprobante digital sincronizado con Stripe.")}
                                                className="p-2 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
