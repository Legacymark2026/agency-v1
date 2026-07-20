"use client";

import { useState } from "react";
import {
    CreditCard, Zap, CheckCircle2, ShieldCheck, Sparkles, ArrowRight,
    Lock, Layers, Cpu, Server, Bot, Video, MessageSquare, Globe, RefreshCw, Check
} from "lucide-react";

interface SubscriptionPlan {
    id: "starter" | "growth" | "scale";
    name: string;
    monthlyPrice: number;
    annualPrice: number;
    description: string;
    apiLimit: string;
    aiTokens: string;
    waMessages: string;
    renderHours: string;
    features: string[];
    popular?: boolean;
}

const PLANS: SubscriptionPlan[] = [
    {
        id: "starter",
        name: "Starter SaaS",
        monthlyPrice: 49,
        annualPrice: 39,
        description: "Ideal para startups y pequeños equipos operando automatizaciones iniciales.",
        apiLimit: "50,000 req/mes",
        aiTokens: "500,000 tokens",
        waMessages: "2,000 msgs",
        renderHours: "5 horas",
        features: [
            "Hasta 3 usuarios de equipo",
            "5,000 contactos en CRM",
            "API REST & Webhooks básicos",
            "Agente IA de Ventas",
            "Soporte por email (24h)"
        ]
    },
    {
        id: "growth",
        name: "Growth Engine",
        monthlyPrice: 149,
        annualPrice: 119,
        description: "Para empresas en expansión que requieren alto volumen de API y agentes de IA.",
        apiLimit: "500,000 req/mes",
        aiTokens: "5,000,000 tokens",
        waMessages: "25,000 msgs",
        renderHours: "30 horas",
        popular: true,
        features: [
            "Hasta 15 usuarios de equipo",
            "50,000 contactos en CRM",
            "API REST & GraphQL ilimitado",
            "Equipos de Agentes IA Autónomos",
            "Conexión WhatsApp Business Multi-Agente",
            "Soporte prioritario WhatsApp (1h)"
        ]
    },
    {
        id: "scale",
        name: "Enterprise & Scale",
        monthlyPrice: 499,
        annualPrice: 399,
        description: "Infraestructura dedicada con SLA garantizado y recursos ilimitados de API.",
        apiLimit: "5,000,000 req/mes",
        aiTokens: "50,000,000 tokens",
        waMessages: "200,000 msgs",
        renderHours: "200 horas",
        features: [
            "Usuarios e Integraciones Ilimitadas",
            "Contactos CRM Ilimitados",
            "Cluster Cloud Privado Dedicado",
            "Despliegue On-Premise o Multi-Cloud",
            "SLA de Disponibilidad 99.99%",
            "Gerente Técnico de Cuenta Asignado"
        ]
    }
];

interface ApiAddon {
    id: string;
    name: string;
    amount: string;
    price: number;
    icon: any;
    description: string;
}

const API_ADDONS: ApiAddon[] = [
    {
        id: "api_100k",
        name: "Bolsa 100K Peticiones API",
        amount: "+100,000 Requests",
        price: 29,
        icon: Server,
        description: "Créditos adicionables sin vencimiento para el API Gateway."
    },
    {
        id: "ai_5m",
        name: "Bolsa 5M Tokens IA",
        amount: "+5,000,000 Tokens",
        price: 45,
        icon: Cpu,
        description: "Para ejecución intensiva de Agentes Autónomos."
    },
    {
        id: "wa_10k",
        name: "Pack 10K Envíos WhatsApp",
        amount: "+10,000 Mensajes",
        price: 39,
        icon: MessageSquare,
        description: "Plantillas oficiales Meta & Conversaciones iniciadas."
    },
    {
        id: "video_10h",
        name: "10 Horas Render de Video",
        amount: "+10 Horas CPU/GPU",
        price: 49,
        icon: Video,
        description: "Procesamiento de videos automatizados en HD 1080p."
    }
];

export default function SubscriptionCheckoutClient() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
    const [selectedPlanId, setSelectedPlanId] = useState<"starter" | "growth" | "scale">("growth");
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];
    const planPrice = billingCycle === "annual" ? selectedPlan.annualPrice : selectedPlan.monthlyPrice;

    const addonsTotal = selectedAddons.reduce((sum, addonId) => {
        const addon = API_ADDONS.find((a) => a.id === addonId);
        return sum + (addon ? addon.price : 0);
    }, 0);

    const totalPrice = planPrice + addonsTotal;

    const toggleAddon = (id: string) => {
        setSelectedAddons((prev) =>
            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
        );
    };

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/payments/checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `Suscripción SaaS ${selectedPlan.name} (${billingCycle === "annual" ? "Anual" : "Mensual"})`,
                    amount: totalPrice,
                    currency: "USD",
                    mode: "subscription",
                    successUrl: `${window.location.origin}/es/suscripcion/exito`,
                    cancelUrl: `${window.location.origin}/es/suscripcion/cancelado`,
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Error creando sesión de suscripción. Por favor reintenta.");
            }
        } catch (err) {
            alert("Error de conexión al procesar la pasarela de pagos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30 py-12 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* HEADER SECTION */}
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider">
                        <Zap className="w-3.5 h-3.5" /> Portal de Suscripción SaaS & Consumo de API
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        Potencia tu Infraestructura Digital
                    </h1>
                    <p className="text-slate-400 text-base md:text-lg">
                        Accede a recursos ilimitados de API, clusters de IA y automatización escalable. Cambia de plan o añade créditos en cualquier momento.
                    </p>

                    {/* MONTHLY / ANNUAL TOGGLE */}
                    <div className="flex items-center justify-center gap-4 pt-4">
                        <span className={`text-xs font-bold ${billingCycle === "monthly" ? "text-white" : "text-slate-500"}`}>Facturación Mensual</span>
                        <button
                            onClick={() => setBillingCycle((prev) => (prev === "monthly" ? "annual" : "monthly"))}
                            className="relative w-14 h-7 bg-slate-800 rounded-full p-1 border border-slate-700 transition-colors focus:outline-none"
                        >
                            <div
                                className={`w-5 h-5 rounded-full bg-teal-400 shadow-md transition-transform ${
                                    billingCycle === "annual" ? "translate-x-7" : "translate-x-0"
                                }`}
                            />
                        </button>
                        <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === "annual" ? "text-teal-400" : "text-slate-500"}`}>
                            Facturación Anual
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-black">Ahorra 20%</span>
                        </span>
                    </div>
                </div>

                {/* PLAN SELECTION CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {PLANS.map((plan) => {
                        const isSelected = selectedPlanId === plan.id;
                        const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;

                        return (
                            <div
                                key={plan.id}
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={`relative rounded-2xl p-6 md:p-8 border transition-all cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                        ? "bg-slate-900 border-teal-500/80 shadow-2xl shadow-teal-500/10 ring-2 ring-teal-500/40"
                                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-teal-500 to-indigo-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-lg">
                                        MÁS POPULAR
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                        {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-400" />}
                                    </div>

                                    <p className="text-xs text-slate-400 leading-relaxed">{plan.description}</p>

                                    <div className="pt-2">
                                        <span className="text-4xl font-black text-white">${price}</span>
                                        <span className="text-xs text-slate-400 font-medium"> USD / mes</span>
                                    </div>

                                    {/* USAGE METRICS */}
                                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
                                        <div className="flex justify-between text-slate-300">
                                            <span>API Gateway:</span>
                                            <span className="text-teal-400 font-bold">{plan.apiLimit}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-300">
                                            <span>Tokens IA:</span>
                                            <span className="text-indigo-400 font-bold">{plan.aiTokens}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-300">
                                            <span>WhatsApp Bot:</span>
                                            <span className="text-emerald-400 font-bold">{plan.waMessages}</span>
                                        </div>
                                    </div>

                                    {/* FEATURE LIST */}
                                    <ul className="space-y-2 pt-2 text-xs text-slate-300">
                                        {plan.features.map((feat, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    className={`mt-6 w-full py-3 rounded-xl font-bold text-xs transition-all ${
                                        isSelected
                                            ? "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20"
                                            : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                                    }`}
                                >
                                    {isSelected ? "Plan Seleccionado" : "Elegir Plan"}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* API CONSUMPTION & ADD-ONS SECTION */}
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 md:p-8 space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Server className="w-5 h-5 text-indigo-400" />
                            Recargas de Consumo de API & Créditos Adicionales
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Añade bolsas de consumo extra para tu infraestructura. Los créditos adicionales no vencen al final del ciclo.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {API_ADDONS.map((addon) => {
                            const isAdded = selectedAddons.includes(addon.id);
                            const IconComponent = addon.icon;

                            return (
                                <div
                                    key={addon.id}
                                    onClick={() => toggleAddon(addon.id)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                                        isAdded
                                            ? "bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/40"
                                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                                            <IconComponent className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-teal-400 font-mono">+${addon.price} USD</span>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-white text-xs">{addon.name}</h4>
                                        <span className="text-[10px] font-mono text-indigo-300 font-semibold">{addon.amount}</span>
                                        <p className="text-[11px] text-slate-400 mt-1">{addon.description}</p>
                                    </div>

                                    <div className="pt-2">
                                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md block text-center ${
                                            isAdded ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                                        }`}>
                                            {isAdded ? "Añadido a la orden" : "+ Añadir a la suscripción"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* FINAL CHECKOUT ORDER SUMMARY */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-teal-500/30 p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                        <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">RESUMEN DE SUSCRIPCIÓN SAAS</span>
                        <h3 className="text-2xl font-black text-white">
                            {selectedPlan.name} ({billingCycle === "annual" ? "Facturación Anual" : "Facturación Mensual"})
                        </h3>
                        {selectedAddons.length > 0 && (
                            <p className="text-xs text-indigo-300">
                                Incluye {selectedAddons.length} bolsas de consumo de API adicionales.
                            </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-400 justify-center md:justify-start">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Garantía de reembolso de 14 días. Cancela en 1-clic en cualquier momento.</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                        <div className="text-center md:text-right">
                            <span className="text-xs text-slate-400 block uppercase">TOTAL SUSCRIPCIÓN</span>
                            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 font-mono">
                                ${totalPrice} USD / mes
                            </span>
                        </div>

                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {loading ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Completar Suscripción & Activar API
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
