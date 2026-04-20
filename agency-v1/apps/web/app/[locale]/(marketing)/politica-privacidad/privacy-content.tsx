"use client";

import { useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, FileText, Globe, Lock, Mail, Phone, Shield, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Subcomponents for cleaner code
function SectionCard({ id, title, icon, children }: { id: string, title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <motion.div
            id={id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 hover:shadow-md transition-shadow duration-300"
        >
            <div className="flex items-center gap-4 mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    {icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            </div>
            <div className="text-gray-600 dark:text-gray-300">
                {children}
            </div>
        </motion.div>
    )
}

function InfoItem({ label, value }: { label: string, value: string }) {
    return (
        <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</dt>
            <dd className="text-base font-semibold text-gray-900 dark:text-white mt-1">{value}</dd>
        </div>
    )
}

function FeatureItem({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h4>
            <p className="text-sm text-gray-500">{desc}</p>
        </div>
    )
}

function CheckListItem({ text }: { text: string }) {
    return (
        <li className="flex items-start">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5 mr-3">
                <Check className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-gray-700 dark:text-gray-300">{text}</span>
        </li>
    )
}

function RetentionItem({ title, duration, desc }: { title: string, duration: string, desc: string }) {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border-l-4 border-blue-500">
            <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
                <p className="text-sm text-gray-500">{desc}</p>
            </div>
            <div className="text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full whitespace-nowrap">
                {duration}
            </div>
        </div>
    )
}

export function PrivacyPolicyContent() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [activeSection, setActiveSection] = useState("responsible");

    const sections = [
        { id: "responsible", title: "Responsable" },
        { id: "data", title: "Datos Recopilados" },
        { id: "purpose", title: "Finalidades" },
        { id: "legitimation", title: "Legitimación" },
        { id: "retention", title: "Conservación" },
        { id: "recipients", title: "Destinatarios" },
        { id: "rights", title: "Tus Derechos" },
        { id: "security", title: "Seguridad" },
        { id: "contact", title: "Contacto" },
    ];

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
            setActiveSection(id);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-100 selection:text-blue-900">
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 origin-left z-50"
                style={{ scaleX }}
            />

            <div className="relative bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-slate-900 dark:to-slate-800 pointer-events-none" />
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-100/40 rounded-full blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
                        <Link href="/" className="hover:text-blue-600 transition-colors">Inicio</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 dark:text-slate-100 font-medium">Política de Privacidad</span>
                    </nav>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center space-x-3 mb-6">
                            <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10">
                                Legal
                            </span>
                            <span className="flex items-center text-sm text-gray-500">
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Actualizado: 12 de Febrero, 2026
                            </span>
                        </div>

                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl mb-6">
                            Política de Privacidad
                        </h1>
                        <p className="max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                            En LegacyMark, tu privacidad es nuestra prioridad. Descubre cómo protegemos tus datos con transparencia, seguridad y compromiso.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-24 space-y-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4 pl-3">
                                Contenido
                            </h3>
                            <nav className="space-y-1" aria-label="Sidebar">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                                            activeSection === section.id
                                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm translate-x-1"
                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                                        )}
                                    >
                                        {section.title}
                                    </button>
                                ))}
                            </nav>

                            <div className="mt-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
                                <h4 className="font-semibold mb-2">¿Dudas?</h4>
                                <p className="text-xs text-slate-300 mb-4">Nuestro equipo legal está disponible para ayudarte.</p>
                                <Button size="sm" variant="secondary" className="w-full text-xs" onClick={() => scrollToSection("contact")}>
                                    Contactar DPO
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="prose prose-lg prose-slate max-w-none dark:prose-invert"
                        >
                            <p className="lead text-xl text-gray-700 dark:text-gray-300">
                                En <strong>LegacyMark BIC S.A.S</strong> (en adelante, &quot;LegacyMark&quot;, &quot;la Agencia&quot;, &quot;nosotros&quot; o &quot;nuestro&quot;), valoramos profundamente la confianza que depositas en nosotros.
                            </p>
                            <p>
                                Nos comprometemos a proteger tu privacidad y a tratar tus datos con la más absoluta <strong>transparencia, lealtad y seguridad</strong>, en estricto cumplimiento de la Ley 1581 de 2012 y demás normas vigentes.
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mt-6 rounded-r-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200 m-0">
                                    <strong>Uso de APIs y Plataformas de Terceros (Meta, Google, etc.):</strong> Nuestro negocio utiliza los datos proporcionados por la plataforma exclusivamente para prestar servicios de marketing digital y desarrollo web en nombre de nuestros clientes. Esto incluye la gestión y optimización de campañas publicitarias, análisis de métricas de rendimiento, segmentación de audiencias, implementación de píxeles y APIs de conversión. La información obtenida se utiliza únicamente con el fin de planificar, ejecutar, medir y mejorar las estrategias digitales. <strong>No vendemos, compartimos ni utilizamos estos datos para fines propios</strong> o distintos a la prestación de los servicios contratados.
                                </p>
                            </div>
                        </motion.div>

                        <SectionCard id="responsible" title="1. Responsable del Tratamiento" icon={<Shield className="w-6 h-6 text-blue-600" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <InfoItem label="Razón Social" value="LegacyMark BIC S.A.S" />
                                    <InfoItem label="NIT" value="902028722-3" />
                                </div>
                                <div className="space-y-4">
                                    <InfoItem label="Dirección" value="CRR 18 A 22-21, Giron, Santander" />
                                    <InfoItem label="Email DPO" value="legacymarkcolombia@legacymarksas.com" />
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard id="data" title="2. Datos que Recopilamos" icon={<FileText className="w-6 h-6 text-purple-600" />}>
                            <p className="mb-6 text-gray-600 dark:text-gray-400">Recopilamos información para brindarte una experiencia excepcional:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FeatureItem title="Identificación" desc="Nombre, documento, dirección, email, teléfono." />
                                <FeatureItem title="Navegación" desc="IP, navegador, cookies, preferencias." />
                                <FeatureItem title="Facturación" desc="Datos fiscales, historial de pagos." />
                                <FeatureItem title="Redes Sociales" desc="Información pública de perfiles vinculados." />
                            </div>
                        </SectionCard>

                        <SectionCard id="purpose" title="3. Finalidades del Tratamiento" icon={<Globe className="w-6 h-6 text-green-600" />}>
                            <ul className="space-y-3">
                                <CheckListItem text="Gestión de consultas y solicitudes de información." />
                                <CheckListItem text="Ejecución y desarrollo de la relación contractual." />
                                <CheckListItem text="Marketing, newsletters y comunicaciones comerciales." />
                                <CheckListItem text="Mejora de experiencia de usuario y análisis web (Google Analytics)." />
                                <CheckListItem text="Gestión de procesos de selección de personal." />
                                <CheckListItem text="Cumplimiento de obligaciones legales y requerimientos administrativos." />
                            </ul>
                        </SectionCard>

                        <SectionCard id="legitimation" title="4. Legitimación" icon={<Lock className="w-6 h-6 text-indigo-600" />}>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border border-slate-100 dark:border-slate-800">
                                <p className="text-gray-700 dark:text-gray-300 mb-4">El tratamiento de tus datos se basa en:</p>
                                <div className="flex flex-wrap gap-2">
                                    {["Consentimiento", "Contrato", "Obligación Legal", "Interés Vital"].map((item) => (
                                        <span key={item} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard id="retention" title="5. Tiempo de Conservación" icon={<User className="w-6 h-6 text-amber-600" />}>
                            <div className="space-y-4">
                                <RetentionItem title="Clientes" duration="Vigencia + 5 años" desc="Obligaciones fiscales y legales." />
                                <RetentionItem title="Prospectos" duration="Hasta revocación" desc="Mientras exista consentimiento." />
                                <RetentionItem title="Candidatos" duration="2 años" desc="Para futuras vacantes laborales." />
                            </div>
                        </SectionCard>

                        <SectionCard id="recipients" title="6. Destinatarios y Transferencias" icon={<Globe className="w-6 h-6 text-cyan-600" />}>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">Compartimos datos solo con proveedores de confianza bajo estrictos acuerdos:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/480px-Google_%22G%22_logo.svg.png" alt="Google" className="h-8 mx-auto opacity-70 grayscale hover:grayscale-0 transition-all" />
                                <div className="flex items-center justify-center font-bold text-gray-400">Mailchimp</div>
                                <div className="flex items-center justify-center font-bold text-gray-400">Stripe</div>
                                <div className="flex items-center justify-center font-bold text-gray-400">AWS</div>
                            </div>
                            <p className="text-xs text-gray-500 mt-4 text-center">
                                Transferencias internacionales garantizadas mediante cláusulas contractuales tipo o decisiones de adecuación.
                            </p>
                        </SectionCard>

                        <SectionCard id="rights" title="7. Tus Derechos y Eliminación de Datos" icon={<Shield className="w-6 h-6 text-emerald-600" />}>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">Tienes control total sobre tu información. Puedes ejercer los siguientes derechos en cualquier momento:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {["Conocer, actualizar y rectificar", "Solicitar eliminación o borrado de datos", "Solicitar prueba de autorización", "Ser informado del uso", "Revocar autorización", "Acceder gratuitamente", "Presentar quejas ante la SIC"].map((right, idx) => (
                                    <div key={idx} className="flex items-start p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{right}</span>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard id="security" title="8. Seguridad" icon={<Lock className="w-6 h-6 text-rose-600" />}>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">Utilizamos cifrado SSL/TLS, firewalls, y políticas de mínimo privilegio. A pesar de nuestros esfuerzos, ninguna transmisión es 100% segura.</p>
                        </SectionCard>

                        <div id="contact" className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
                            <div className="relative z-10">
                                <h2 className="text-3xl font-bold mb-6">¿Necesitas ejercer tus derechos?</h2>
                                <p className="text-slate-300 mb-8 max-w-2xl">
                                    Si tienes preguntas o deseas actualizar tu información, nuestro Oficial de Protección de Datos está listo para ayudarte.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <a href="mailto:legacymarkcolombia@legacymarksas.com" className="flex items-center space-x-4 bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all border border-white/10 backdrop-blur-sm group">
                                        <div className="bg-blue-500/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
                                            <Mail className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Email</div>
                                            <div className="font-medium">legacymarkcolombia@legacymarksas.com</div>
                                        </div>
                                    </a>
                                    <a href="tel:+573222047353" className="flex items-center space-x-4 bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all border border-white/10 backdrop-blur-sm group">
                                        <div className="bg-green-500/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
                                            <Phone className="w-6 h-6 text-green-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Teléfono</div>
                                            <div className="font-medium">+57 322 204 7353</div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200 dark:border-slate-800">
                            <p>Documento actualizado a: 12 de Febrero, 2026</p>
                        </div>
                    </div>
                </div>
            </div>

            <Button
                variant="outline"
                size="icon"
                className="fixed bottom-8 right-8 rounded-full shadow-lg bg-white dark:bg-slate-900 z-40 hidden md:flex"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
                <ArrowLeft className="w-4 h-4 rotate-90" />
            </Button>
        </div>
    );
}
