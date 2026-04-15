"use client";

import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Bot, Code2, Rocket, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SERVICES_DATA = {
    automation: {
        title: "AI Automation",
        description: "Reemplaza tareas manuales con agentes inteligentes. Tu empresa, funcionando en piloto automático.",
        features: ["Chatbots con IA (RAG)", "Automatización de Procesos", "Sincronización de CRM", "Agentes de Voz"],
        icon: Bot,
        href: "/soluciones/automatizacion",
        color: "text-blue-500",
        bg: "bg-blue-500",
        gradient: "from-blue-900/50 to-cyan-900/50"
    },
    web: {
        title: "Web & Apps",
        description: "Ingeniería de software premium. Desde sitios corporativos hasta SaaS complejos y escalables.",
        features: ["Desarrollo Next.js / React", "E-commerce Headless", "Web Apps Progresivas (PWA)", "Experiencias 3D"],
        icon: Code2,
        href: "/soluciones/web-dev",
        color: "text-green-500",
        bg: "bg-green-500",
        gradient: "from-green-900/50 to-emerald-900/50"
    },
    performance: {
        title: "Performance",
        description: "Campañas de adquisición de usuarios orientadas a ROI. Pagas por resultados, no por clicks.",
        features: ["Google Ads & SEM", "Meta Apps & TikTok Ads", "Estrategia Full-Funnel", "Analítica Avanzada"],
        icon: Target,
        href: "/servicios", // Legacy/General
        color: "text-red-500",
        bg: "bg-red-500",
        gradient: "from-red-900/50 to-orange-900/50"
    },
    growth: {
        title: "Growth",
        description: "Estrategias agresivas de crecimiento para escalar startups y productos digitales.",
        features: ["Conversion Rate (CRO)", "A/B Testing Continuo", "Email Marketing", "Viral Loops"],
        icon: Rocket,
        href: "/servicios", // Legacy/General
        color: "text-purple-500",
        bg: "bg-purple-500",
        gradient: "from-purple-900/50 to-pink-900/50"
    }
};

export function ServicesTabs() {
    return (
        <section className="bg-black text-white py-24 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

            <div className="relative mx-auto max-w-7xl px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">Ecosistema de Soluciones</h2>
                    <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                        Integramos tecnología, creatividad y datos para construir el futuro de tu negocio.
                    </p>
                </motion.div>

                <Tabs defaultValue="automation" className="w-full">
                    <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-2 md:grid-cols-4 bg-white/5 p-1 rounded-xl mb-12 h-auto border border-white/10">
                        {Object.entries(SERVICES_DATA).map(([key, service]) => (
                            <TabsTrigger
                                key={key}
                                value={key}
                                className="py-4 data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 hover:text-white transition-all"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <service.icon size={20} />
                                    <span>{service.title}</span>
                                </div>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {Object.entries(SERVICES_DATA).map(([key, service]) => (
                        <TabsContent key={key} value={key} className="mt-0 focus-visible:outline-none">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="grid md:grid-cols-2 gap-8 md:gap-12 items-center bg-zinc-900/50 p-6 md:p-12 rounded-3xl border border-white/10 backdrop-blur-md"
                            >
                                <div>
                                    <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${service.bg} bg-opacity-20 mb-6 border border-white/10`}>
                                        <service.icon size={28} className={service.color} />
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4">{service.title}</h3>
                                    <p className="text-gray-300 text-lg mb-8 leading-relaxed">{service.description}</p>

                                    <ul className="space-y-4 mb-8">
                                        {service.features.map((feature, i) => (
                                            <li key={i} className="flex items-center text-gray-200">
                                                <div className={`h-2 w-2 ${service.bg} rounded-full mr-3`} />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link href={service.href}>
                                        <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-8 py-6 text-lg w-full md:w-auto font-medium transition-all hover:scale-105">
                                            Explorar Solución <ArrowRight className="ml-2" size={18} />
                                        </Button>
                                    </Link>
                                </div>

                                {/* Visual Area */}
                                <div className={`hidden md:block relative h-[450px] rounded-2xl overflow-hidden bg-gradient-to-br ${service.gradient} border border-white/10 shadow-2xl group`}>
                                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30" />

                                    {/* Abstract Decoration */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative">
                                            <div className={`absolute inset-0 ${service.bg} blur-[100px] opacity-40`} />
                                            <span className="relative text-white/10 text-8xl font-black uppercase tracking-tighter transform -rotate-12 select-none group-hover:scale-110 transition-transform duration-700">
                                                {key}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Corner Badge */}
                                    <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-xs font-mono text-white/60">
                                        LEGACY_MARK_V2.0
                                    </div>
                                </div>
                            </motion.div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </section>
    );
}
