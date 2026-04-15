"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
    {
        name: "Starter",
        price: "$2,500",
        period: "/mes",
        desc: "Para startups en fase de crecimiento.",
        features: ["Estrategia Digital Básica", "Gestión de Redes Sociales", "Reportes Mensuales", "Soporte por Email"],
        highlight: false
    },
    {
        name: "Growth",
        price: "$5,000",
        period: "/mes",
        desc: "Para empresas escalando agresivamente.",
        features: ["Estrategia de Performance", "SEO & Content Marketing", "Dashboard en Tiempo Real", "Gerente de Cuenta Dedicado", "CRO (Optimización Web)"],
        highlight: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        desc: "Soluciones a medida para corporativos.",
        features: ["Equipo Multidisciplinario", "Desarrollo a Medida", "Integración CRM Avanzada", "Soporte 24/7", "Auditorías Trimestrales"],
        highlight: false
    }
];

export function PricingTables() {
    return (
        <section className="bg-gray-50 py-24">
            <div className="mx-auto max-w-7xl px-4 text-center">
                <h2 className="text-3xl font-bold text-black sm:text-4xl mb-4">Planes de Inversión</h2>
                <p className="text-gray-500 mb-16 max-w-2xl mx-auto">
                    Modelos flexibles diseñados para maximizar tu retorno de inversión.
                </p>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`rounded-2xl p-8 border ${plan.highlight
                                    ? "bg-black text-white border-black shadow-2xl scale-105 z-10"
                                    : "bg-white text-gray-900 border-gray-200 shadow-sm"
                                }`}
                        >
                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <div className="flex items-baseline justify-center gap-1 mb-4">
                                <span className="text-4xl font-black">{plan.price}</span>
                                <span className={`text-sm ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>{plan.period}</span>
                            </div>
                            <p className={`text-sm mb-8 ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>{plan.desc}</p>

                            <ul className="space-y-4 mb-8 text-left">
                                {plan.features.map((feat) => (
                                    <li key={feat} className="flex items-center gap-3">
                                        <div className={`rounded-full p-1 ${plan.highlight ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}`}>
                                            <Check size={14} />
                                        </div>
                                        <span className="text-sm font-medium">{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full ${plan.highlight
                                        ? "bg-white text-black hover:bg-gray-200"
                                        : "bg-black text-white hover:bg-gray-800"
                                    }`}
                            >
                                Seleccionar Plan
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
