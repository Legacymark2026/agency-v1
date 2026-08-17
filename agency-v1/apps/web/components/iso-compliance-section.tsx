"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, FileCheck2, Cpu, CheckCircle2, Award, ArrowRight, Database, Server } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const ISO_STANDARDS = [
    {
        id: "iso-27001",
        code: "ISO/IEC 27001:2022",
        title: "Sistema de Gestión de Seguridad de la Información (SGSI)",
        badge: "Seguridad de Datos",
        color: "from-emerald-500 to-teal-700",
        lightBg: "bg-emerald-500/10",
        textColor: "text-emerald-400",
        borderColor: "border-emerald-500/30",
        description: "Estándar internacional para la protección de activos de información empresarial, autenticación segura y cifrado multi-inquilino.",
        highlights: [
            "Autenticación robusta y control de acceso basado en roles (RBAC).",
            "Protección contra ataques de fuerza bruta y Rate Limiting inteligente.",
            "Cifrado de datos en tránsito (TLS 1.3) y en reposo (AES-256-GCM).",
            "Aislamiento estricto de datos en arquitecturas multi-inquilino (Multi-tenant)."
        ]
    },
    {
        id: "iso-27701",
        code: "ISO/IEC 27701:2019",
        title: "Gestión de Privacidad de la Información (PIMS)",
        badge: "Privacidad & GDPR",
        color: "from-blue-500 to-indigo-700",
        lightBg: "bg-blue-500/10",
        textColor: "text-blue-400",
        borderColor: "border-blue-500/30",
        description: "Extensión de ISO 27001 para la gestión del tratamiento de datos personales (PII), derecho al olvido y cumplimiento GDPR/Habeas Data.",
        highlights: [
            "Anonimización y seudonimización de datos de clientes e interacciones.",
            "Protocolos strictly de consentimiento y derecho al olvido.",
            "Auditoría inmutable de accesos y modificaciones a registros de usuarios.",
            "Cumplimiento alineado con GDPR (Europa) y Ley 1581 (Habeas Data Colombia)."
        ]
    },
    {
        id: "iso-9001",
        code: "ISO 9001:2015",
        title: "Sistema de Gestión de Calidad (SGC)",
        badge: "Excelencia Operativa",
        color: "from-purple-500 to-indigo-700",
        lightBg: "bg-purple-500/10",
        textColor: "text-purple-400",
        borderColor: "border-purple-500/30",
        description: "Garantía de calidad en la ejecución de campañas de marketing, automatizaciones con IA y desarrollo continuo de software sin fricción.",
        highlights: [
            "Despliegue continuo con pruebas automatizadas e integración CI/CD.",
            "Monitoreo de SLAs de atención en Inbox (FRT y TRT en tiempo real).",
            "Mejora continua en algoritmos de agentes inteligentes e integración CRM.",
            "Satisfacción del cliente garantizada con encuestas CSAT integradas."
        ]
    },
    {
        id: "iso-22301",
        code: "ISO 22301:2019",
        title: "Gestión de la Continuidad del Negocio (SGCN)",
        badge: "Alta Disponibilidad",
        color: "from-amber-500 to-orange-700",
        lightBg: "bg-amber-500/10",
        textColor: "text-amber-400",
        borderColor: "border-amber-500/30",
        description: "Resiliencia operativa garantizada con arquitectura redundante, failover automático e infraestructura distribuida.",
        highlights: [
            "Arquitectura en microservicios aislados con Circuit Breaker en API Gateway.",
            "Copias de seguridad automatizadas de base de datos PostgreSQL en tiempo real.",
            "Recuperación ante desastres (RPO < 1 min, RTO < 15 min).",
            "Disponibilidad objetivo del 99.9% (SLA Uptime garantizado)."
        ]
    }
];

export function IsoComplianceSection() {
    const [activeTab, setActiveTab] = useState(ISO_STANDARDS[0].id);
    const activeStandard = ISO_STANDARDS.find(s => s.id === activeTab) || ISO_STANDARDS[0];

    return (
        <div className="w-full bg-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800 relative overflow-hidden">
            {/* Background Glow Elements */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 mb-4"
                    >
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span>ESTÁNDARES INTERNACIONALES ISO & COMPLIANCE</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6"
                    >
                        Seguridad, Privacidad y Calidad de Clase Mundial
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-base sm:text-lg text-slate-400 leading-relaxed"
                    >
                        LegacyMark opera bajo estrictos marcos normativos internacionales para garantizar la integridad de tus datos, la continuidad de tus operaciones y la excelencia en el servicio.
                    </motion.p>
                </div>

                {/* ISO Navigation Tabs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
                    {ISO_STANDARDS.map((std) => {
                        const isActive = std.id === activeTab;
                        return (
                            <button
                                key={std.id}
                                onClick={() => setActiveTab(std.id)}
                                className={`p-4 rounded-xl text-left border transition-all duration-300 flex flex-col justify-between ${
                                    isActive
                                        ? `bg-slate-900 ${std.borderColor} ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/5`
                                        : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700"
                                }`}
                            >
                                <div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${std.lightBg} ${std.textColor} inline-block mb-2`}>
                                        {std.badge}
                                    </span>
                                    <h3 className="text-sm font-bold text-slate-100">{std.code}</h3>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium">
                                    <span>Ver detalles</span>
                                    <ArrowRight size={14} className={`transition-transform ${isActive ? "translate-x-1 text-emerald-400" : ""}`} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Active ISO Standard Card */}
                <motion.div
                    key={activeStandard.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Left Info Column */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-2xl bg-gradient-to-br ${activeStandard.color} shadow-lg`}>
                                    <Award size={24} className="text-white" />
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Norma ISO Certificable</span>
                                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{activeStandard.code}</h3>
                                </div>
                            </div>

                            <h4 className="text-lg font-bold text-emerald-400">{activeStandard.title}</h4>
                            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{activeStandard.description}</p>

                            <div className="space-y-3 pt-2">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Garantías de Cumplimiento:</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {activeStandard.highlights.map((point, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                                            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-300 font-medium leading-snug">{point}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Technical Specs Card */}
                        <div className="lg:col-span-5 bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800/90 space-y-5">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                <span className="text-xs font-bold text-slate-300">Auditoría & Trazabilidad</span>
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    100% Verificado
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-900 rounded-lg text-indigo-400 border border-slate-800">
                                        <Lock size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-200">Cifrado de Extremo a Extremo</p>
                                        <p className="text-[11px] text-slate-400">TLS 1.3 & AES-256 en reposo</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-900 rounded-lg text-emerald-400 border border-slate-800">
                                        <Database size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-200">Aislamiento Multi-Tenant</p>
                                        <p className="text-[11px] text-slate-400">Separación lógica total por Company ID</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-900 rounded-lg text-blue-400 border border-slate-800">
                                        <Server size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-200">Protección Anti-Fuerza Bruta</p>
                                        <p className="text-[11px] text-slate-400">Rate Limiting dinámico en Redis</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800/80">
                                <Link href="/es/terms">
                                    <Button variant="outline" className="w-full bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 text-xs font-semibold py-2.5 h-auto">
                                        Ver Términos y Políticas de Privacidad
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Trust Footer Badges */}
                <div className="mt-12 pt-8 border-t border-slate-900 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <span>ISO/IEC 27001 Certified Practices</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileCheck2 size={16} className="text-blue-500" />
                        <span>GDPR & Habeas Data Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-purple-500" />
                        <span>Zero-Trust Microservices Architecture</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
