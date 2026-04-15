"use client";

import { motion } from "framer-motion";
import { Lightbulb, BarChart3, Rocket, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const services = [
    {
        title: "Estrategia de Marca",
        description: "Definimos la identidad y el propósito de tu marca para conectar profundamente con tu audiencia.",
        icon: Lightbulb,
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
    },
    {
        title: "Marketing Digital",
        description: "Maximizamos tu alcance y conversión a través de campañas de datos impulsadas por IA.",
        icon: BarChart3,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
    },
    {
        title: "Innovación Publicitaria",
        description: "Creamos experiencias visuales y campañas creativas que rompen el ruido del mercado.",
        icon: Rocket,
        color: "text-purple-400",
        bg: "bg-purple-400/10",
    },
];

export function ServicesPreview() {
    return (
        <section className="relative bg-zinc-950 py-32 text-white">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-20 text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-3xl font-bold tracking-tight sm:text-5xl"
                    >
                        Nuestras Especialidades
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="mt-4 text-lg text-gray-400"
                    >
                        Soluciones integrales diseñadas para la era digital.
                    </motion.p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {services.map((service, index) => (
                        <motion.div
                            key={service.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -10 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-8 transition-all hover:bg-white/10"
                        >
                            <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                                <ArrowUpRight className="text-white/50" />
                            </div>

                            <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${service.bg} ${service.color} transition-all group-hover:scale-110`}>
                                <service.icon size={26} />
                            </div>

                            <h3 className="mb-3 text-2xl font-bold">{service.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{service.description}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <Link href="/servicios">
                        <Button variant="outline" size="lg" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/40 transition-all">
                            Ver todos los servicios
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
