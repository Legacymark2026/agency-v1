"use client";

import { motion } from "framer-motion";

export function GuiaWebRoadmap() {
    const steps = [
        {
            number: "01",
            title: "Auditoría y Estrategia SEO",
            desc: "Antes de diseñar, analizamos el mercado. Definimos el mapa de sitio óptimo, investigación de palabras clave y objetivos de conversión medibles."
        },
        {
            number: "02",
            title: "Wireframing y UX",
            desc: "Diseñamos el esqueleto de la información. Priorizamos el 'User Journey', asegurando que los usuarios fluyan naturalmente hacia la acción objetivo (comprar, agendar, suscribirse)."
        },
        {
            number: "03",
            title: "UI & Ecosistema Visual",
            desc: "Aplicamos branding, tipografía moderna, micro-interacciones (Framer Motion) y un diseño 'Premium Tech' (HUD Slate/Teal) que transmite autoridad instantánea."
        },
        {
            number: "04",
            title: "Desarrollo y Conexión Backend",
            desc: "Codificamos con tecnologías modernas (React, Next.js). Integramos analítica avanzada (Pixel de Meta, CAPI) y conectamos los formularios directamente a tu Inbox y CRM de LegacyMark."
        },
        {
            number: "05",
            title: "Lanzamiento y Monitoreo",
            desc: "Despliegue a producción, pruebas de estrés y monitoreo real. Tu web no se estanca, evoluciona continuamente basada en métricas de tráfico y conversión."
        }
    ];

    return (
        <section className="py-24 bg-slate-950 relative border-t border-slate-900">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
                        El Mapa de Ruta Hacia el <span className="text-teal-500">Éxito en Línea</span>
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Un proceso claro, auditable y escalable. Así construimos en LegacyMark.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto relative">
                    <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-teal-500/0 via-teal-500/50 to-teal-500/0 hidden md:block" />
                    
                    <div className="space-y-12">
                        {steps.map((step, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6 }}
                                className={`flex flex-col md:flex-row gap-8 ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
                            >
                                <div className="flex-1 pt-2 md:text-right">
                                    <div className={`md:hidden text-teal-500 font-mono text-xl font-bold mb-2`}>{step.number}</div>
                                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                                </div>
                                <div className="hidden md:flex flex-col items-center justify-start z-10 shrink-0 mx-2">
                                    <div className="w-16 h-16 rounded-full bg-slate-950 border-2 border-teal-500 flex items-center justify-center text-teal-400 font-mono font-bold text-lg shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                                        {step.number}
                                    </div>
                                </div>
                                <div className="flex-1" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
