"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const features = [
    "Estrategia de Contenido",
    "Guiones & Storyboards",
    "Grabación Profesional 4K",
    "Edición Estilo Hormozi/Cinemático",
    "Distribución Multi-plataforma",
    "Reporte Mensual de Métricas",
    "Community Management Básico",
    "Miniaturas Clickbait"
];

const packages = [
    {
        name: "Starter",
        price: "2.5M",
        features: [true, true, false, true, true, false, false, true],
        description: "Perfecto para marcas personales iniciando."
    },
    {
        name: "Growth",
        price: "4.5M",
        popular: true,
        features: [true, true, true, true, true, true, false, true],
        description: "Para negocios listos para escalar agresivamente."
    },
    {
        name: "Dominance",
        price: "8M",
        features: [true, true, true, true, true, true, true, true],
        description: "Solución completa 'Done-For-You'."
    }
];

export default function PricingBuilder() {
    const [selectedPlan, setSelectedPlan] = useState<string>("Growth");

    return (
        <section className="py-20 bg-white" id="pricing">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-slate-900">Planes Flexibles</h2>
                    <p className="text-slate-600">Escoge el nivel de impacto que necesitas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {packages.map((pkg) => (
                        <motion.div
                            key={pkg.name}
                            whileHover={{ y: -10 }}
                            className={`relative p-8 rounded-3xl border transition-all duration-300 group overflow-hidden ${pkg.popular
                                ? "bg-white border-teal-500 shadow-2xl shadow-teal-900/10 ring-4 ring-teal-500/10"
                                : "bg-white border-slate-200 hover:border-teal-200 hover:shadow-xl"
                                }`}
                        >
                            {/* Spotlight Effect - Light Mode */}
                            <div className="absolute inset-0 bg-gradient-to-b from-teal-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                            {pkg.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg animate-pulse-glow z-10">
                                    Más Popular
                                </div>
                            )}

                            <h3 className={`text-2xl font-bold mb-2 ${pkg.popular ? "text-teal-600" : "text-slate-900"}`}>{pkg.name}</h3>
                            <p className="text-slate-500 text-sm mb-6 h-10 leading-relaxed">{pkg.description}</p>

                            <div className="mb-8">
                                <span className="text-5xl font-bold tracking-tight text-slate-900">${pkg.price}</span>
                                <span className="text-slate-400 font-medium text-sm ml-2">COP /mes</span>
                            </div>

                            <button className={`w-full py-4 rounded-xl font-bold mb-8 transition-all flex items-center justify-center gap-2 group-hover:gap-3 ${pkg.popular
                                ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:shadow-teal-500/20"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}>
                                Comenzar Ahora <span className="text-lg">→</span>
                            </button>

                            <div className="space-y-4">
                                {features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${pkg.features[i] ? "bg-teal-100 text-teal-600" : "bg-slate-50 text-slate-300"
                                            }`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className={`text-sm ${!pkg.features[i] ? "text-slate-400 line-through decoration-slate-300" : "text-slate-600"}`}>
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Discount Timer/Fomo */}
                <div className="mt-16 text-center max-w-2xl mx-auto p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                    <p className="font-bold text-orange-600 mb-1">🔥 Oferta Limitada</p>
                    <p className="text-sm text-slate-600">
                        Reserva tu llamada de estrategia en las próximas <span className="text-slate-900 font-mono bg-white border border-slate-200 px-1 rounded">24:00:00</span> y obtén
                        <span className="text-orange-500 font-bold"> 2 Videos Extra</span> en tu primer mes.
                    </p>
                </div>
            </div>
        </section>
    );
}
