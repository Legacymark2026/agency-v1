"use client";

import { motion } from "framer-motion";
import { Gauge, ShieldCheck, Database, Smartphone } from "lucide-react";

export function GuiaWebAnatomy() {
    const features = [
        {
            icon: <Gauge className="w-8 h-8 text-teal-400" />,
            title: "Performance & Velocidad",
            description: "El 53% de los usuarios abandona una web si tarda más de 3 segundos en cargar. Construimos arquitecturas escalables con Next.js y Edge Networks para carga casi instantánea."
        },
        {
            icon: <Smartphone className="w-8 h-8 text-teal-400" />,
            title: "Diseño UX/UI Responsivo",
            description: "No adaptamos a móviles; diseñamos pensando en ellos desde el inicio. Interfaces inmersivas (HUD Design) orientadas a reducir la fricción y aumentar la retención."
        },
        {
            icon: <Database className="w-8 h-8 text-teal-400" />,
            title: "Integración CRM Bi-direccional",
            description: "Tu web no es un folleto, es el motor de tu CRM. Captura leads, centraliza en LegacyMark y lanza automatizaciones en tiempo real sin intervención humana."
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-teal-400" />,
            title: "Seguridad y Accesibilidad",
            description: "Encriptación SSL estricta, protección contra ataques y cumplimiento de estándares internacionales para que tú y tus clientes operen con total tranquilidad."
        }
    ];

    return (
        <section id="anatomy" className="py-24 bg-slate-950 relative overflow-hidden">
            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
                        Anatomía de una <span className="text-teal-500">Web de Alta Conversión</span>
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Lo que diferencia a una página amateur de una herramienta empresarial no es solo cómo se ve, sino cómo funciona en sus entrañas.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-teal-500/50 p-8 rounded-2xl transition-colors group"
                        >
                            <div className="bg-slate-950 w-16 h-16 rounded-xl border border-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
