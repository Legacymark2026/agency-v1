"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import {
    Megaphone,
    Layout,
    Palette,
    Bot,
    LineChart,
    Video,
    ArrowUpRight,
    Sparkles
} from "lucide-react";
import { MouseEvent } from "react";

const services = [
    {
        title: "Plan de Medios",
        description: "Atraemos tráfico cualificado con campañas de medios pagados optimizadas en Meta y Google Ads.",
        icon: Megaphone,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        colSpan: "md:col-span-2",
        delay: 0
    },
    {
        title: "Diseño Web",
        description: "Sitios web ultra-rápidos y persuasivos.",
        icon: Layout,
        color: "text-teal-500",
        bg: "bg-teal-500/10",
        colSpan: "md:col-span-1",
        delay: 0.1
    },
    {
        title: "Branding",
        description: "Identidad visual memorable.",
        icon: Palette,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        colSpan: "md:col-span-1",
        delay: 0.2
    },
    {
        title: "Automatización IA",
        description: "Sistemas autónomos que reducen carga operativa.",
        icon: Bot,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        colSpan: "md:col-span-2",
        delay: 0.3
    },
    {
        title: "SEO Técnico",
        description: "Posicionamiento orgánico para dominar Google.",
        icon: LineChart,
        color: "text-green-500",
        bg: "bg-green-500/10",
        colSpan: "md:col-span-1",
        delay: 0.4
    },
    {
        title: "Producción Video",
        description: "Contenido audiovisual de alto impacto.",
        icon: Video,
        color: "text-red-500",
        bg: "bg-red-500/10",
        colSpan: "md:col-span-1",
        delay: 0.5
    },
    {
        title: "Consultoría 360",
        description: "Auditoría integral de tu ecosistema digital.",
        icon: Sparkles,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
        colSpan: "md:col-span-1",
        delay: 0.6
    }
];

function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={`group relative border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_0_rgba(45,212,191,0.2)] transition-all duration-500 ${className}`}
            onMouseMove={handleMouseMove}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(14, 165, 233, 0.1),
              transparent 80%
            )
          `,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    );
}

export function FlyeringServices() {
    return (
        <section id="services" className="py-24 bg-slate-950 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-bold mb-4 uppercase tracking-widest"
                    >
                        <Sparkles size={12} /> Soluciones Premium
                    </motion.div>
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl mb-4">
                        Ecosistema de <span className="text-teal-400">Alto Rendimiento</span>
                    </h2>
                    <p className="text-lg text-slate-400">
                        Cada servicio es un módulo diseñado para integrarse y potenciar tu crecimiento.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: service.delay }}
                            viewport={{ once: true }}
                            className={service.colSpan}
                        >
                            <SpotlightCard className="h-full hover:shadow-2xl transition-shadow duration-500">
                                <div className="p-8 h-full flex flex-col items-start relative">
                                    {/* Gradient border bottom */}
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <div className={`w-12 h-12 rounded-lg ${service.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        <service.icon className={`w-6 h-6 ${service.color}`} />
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-teal-400 group-hover:to-cyan-400 transition-all duration-300">
                                        {service.title}
                                    </h3>

                                    <p className="text-slate-400 leading-relaxed mb-6 flex-grow">
                                        {service.description}
                                    </p>

                                    <div className="mt-auto flex items-center text-sm font-semibold text-gray-400 group-hover:text-teal-600 transition-colors">
                                        Explorar <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </div>
                                </div>
                            </SpotlightCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
