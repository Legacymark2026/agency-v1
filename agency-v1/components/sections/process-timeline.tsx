"use client";

import { motion } from "framer-motion";
import { Search, Compass, Zap, Trophy } from "lucide-react";

const steps = [
    {
        title: "Descubrimiento",
        description: "Inmersión profunda en tu marca, audiencia y objetivos para encontrar oportunidades únicas.",
        icon: Search,
    },
    {
        title: "Estrategia",
        description: "Diseñamos un plan de acción a medida que alinea creatividad con KPIs de negocio.",
        icon: Compass,
    },
    {
        title: "Ejecución",
        description: "Implementación ágil y de alta calidad utilizando las últimas tecnologías y tendencias.",
        icon: Zap,
    },
    {
        title: "Resultados",
        description: "Medición constante y optimización para asegurar el máximo retorno de inversión.",
        icon: Trophy,
    },
];

export function ProcessTimeline() {
    return (
        <section className="bg-gray-50 py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-24 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">Nuestro Proceso</h2>
                    <p className="mt-4 text-lg text-gray-600">Cómo transformamos tu visión en realidad.</p>
                </div>

                <div className="relative mx-auto max-w-4xl">
                    {/* Central Line */}
                    <div className="absolute left-[28px] top-0 h-full w-0.5 bg-gray-300 md:left-1/2 md:-ml-0.5" />

                    <div className="space-y-12">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true, margin: "-100px" }}
                                className={`relative flex flex-col gap-8 md:flex-row ${index % 2 === 0 ? "md:flex-row-reverse" : ""
                                    }`}
                            >
                                {/* Icon Node */}
                                <div className="absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-black text-white z-10 md:left-1/2 md:-ml-7 shadow-lg">
                                    <step.icon size={24} />
                                </div>

                                {/* Content Card */}
                                <div className={`ml-20 md:ml-0 md:w-1/2 ${index % 2 === 0 ? "md:pr-16 md:text-right" : "md:pl-16"
                                    }`}>
                                    <h3 className="mb-3 text-xl font-bold text-black">{step.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                                </div>

                                {/* Empty Space for alignment */}
                                <div className="hidden md:block md:w-1/2" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
