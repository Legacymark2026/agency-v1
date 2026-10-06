"use client";

import { useState } from "react";
import { Check, Zap, Sparkles, Building2, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/actions/billing";
import { toast } from "sonner";

interface PlanTier {
    id: string;
    name: string;
    badge?: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
    isPopular?: boolean;
    buttonText: string;
}

const TIERS: PlanTier[] = [
    {
        id: "starter",
        name: "Starter B2B",
        badge: "Pymes",
        description: "Para pequeños negocios y tiendas con operaciones de mostrador.",
        monthlyPrice: 0,
        yearlyPrice: 0,
        buttonText: "Plan Actual (Gratis)",
        features: [
            "Hasta 3 miembros del equipo",
            "1,000 leads / contactos",
            "5,000 llamadas API / mes",
            "Módulo POS y Facturación básica",
            "Soporte por correo electrónico",
        ]
    },
    {
        id: "pro",
        name: "Professional Growth",
        badge: "Más Popular",
        isPopular: true,
        description: "Para empresas en expansión con ventas multicanal y fuerza de ventas.",
        monthlyPrice: 49,
        yearlyPrice: 39,
        buttonText: "Mejorar a Professional",
        features: [
            "Hasta 15 miembros del equipo",
            "10,000 leads y CRM completo",
            "50,000 correos transaccionales",
            "Facturación Electrónica DIAN síncrona",
            "Gestión de Bodegas & Inventarios caótico",
            "Soporte prioritario 24/7",
        ]
    },
    {
        id: "agency",
        name: "Enterprise Multi-Tenant",
        badge: "Corporativo",
        description: "Operaciones de alto volumen, automatización total y trazabilidad GxP.",
        monthlyPrice: 99,
        yearlyPrice: 79,
        buttonText: "Mejorar a Enterprise",
        features: [
            "Miembros y asientos ilimitados",
            "Contactos & Leads ilimitados",
            "Agentes Cognitivos Autónomos IA",
            "Pasarelas de Pago BYOG ilimitadas",
            "SLA 99.99% & Auditoría GxP / FDA 21 CFR",
            "Gerente de cuenta técnico dedicado",
        ]
    }
];

export function B2BPlanComparison({ currentPlan = "starter" }: { currentPlan?: string }) {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleSelectPlan = async (tierId: string) => {
        if (tierId === currentPlan || tierId === "starter") {
            toast.info("Ya estás en este plan o es el nivel inicial.");
            return;
        }

        setLoadingPlan(tierId);
        try {
            const res = await createCheckoutSession(tierId, billingCycle === "yearly");
            if (res.success && res.data?.url) {
                window.location.href = res.data.url;
            } else {
                toast.error(res.error || "No se pudo iniciar el proceso de checkout.");
            }
        } catch (err: any) {
            toast.error("Error al procesar suscripción.");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Toggle de Facturación Mensual / Anual */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        Planes B2B & Escalamiento por Capacidad
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Todos los planes incluyen cifrado de base de datos TLS/AES y soporte multi-bodega.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                    <button
                        onClick={() => setBillingCycle("monthly")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                            billingCycle === "monthly"
                                ? "bg-slate-800 text-white shadow-sm"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Facturación Mensual
                    </button>
                    <button
                        onClick={() => setBillingCycle("yearly")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                            billingCycle === "yearly"
                                ? "bg-teal-600 text-white shadow-sm shadow-teal-600/30"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Anual <span className="text-[10px] bg-teal-400/20 text-teal-300 px-1.5 py-0.2 rounded font-bold">-20% OFF</span>
                    </button>
                </div>
            </div>

            {/* Grid de 3 Columnas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TIERS.map((tier) => {
                    const price = billingCycle === "yearly" ? tier.yearlyPrice : tier.monthlyPrice;
                    const isCurrent = currentPlan?.toLowerCase() === tier.id.toLowerCase();
                    const isLoading = loadingPlan === tier.id;

                    return (
                        <div
                            key={tier.id}
                            className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
                                tier.isPopular
                                    ? "bg-slate-900 border-2 border-teal-500 shadow-xl shadow-teal-500/10"
                                    : "bg-slate-900/80 border border-slate-800 hover:border-slate-700"
                            }`}
                        >
                            {tier.badge && (
                                <div className="absolute -top-3 left-6">
                                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                        tier.isPopular 
                                            ? "bg-teal-500 text-slate-950 shadow-md"
                                            : "bg-slate-800 text-slate-300 border border-slate-700"
                                    }`}>
                                        {tier.badge}
                                    </span>
                                </div>
                            )}

                            <div>
                                <h4 className="text-lg font-bold text-white mb-1 mt-1">{tier.name}</h4>
                                <p className="text-xs text-slate-400 mb-5 leading-relaxed">{tier.description}</p>

                                <div className="mb-6 flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-white font-mono">${price}</span>
                                    <span className="text-xs text-slate-400">/ mes {billingCycle === "yearly" && "(facturado anualmente)"}</span>
                                </div>

                                <div className="space-y-2.5 mb-8 border-t border-slate-800/80 pt-5">
                                    {tier.features.map((feat, i) => (
                                        <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                                            <div className="p-0.5 rounded bg-teal-500/10 text-teal-400 mt-0.5 shrink-0">
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => handleSelectPlan(tier.id)}
                                disabled={isCurrent || isLoading}
                                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                                    isCurrent
                                        ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-default"
                                        : tier.isPopular
                                        ? "bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/30"
                                        : "bg-slate-950 hover:bg-slate-800 text-white border border-slate-700"
                                }`}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Conectando Checkout...
                                    </>
                                ) : isCurrent ? (
                                    "Plan Actual Activo"
                                ) : (
                                    <>
                                        {tier.buttonText} <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
