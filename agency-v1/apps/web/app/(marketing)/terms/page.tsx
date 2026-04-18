"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, FileText, Globe, Scale, DollarSign, ShieldAlert, Ban, Info, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TermsPage() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [activeSection, setActiveSection] = useState("intro");

    const sections = [
        { id: "acceptance", title: "Aceptación de Términos" },
        { id: "services", title: "Nuestros Servicios" },
        { id: "ip", title: "Propiedad Intelectual" },
        { id: "payments", title: "Pagos y Facturación" },
        { id: "obligations", title: "Obligaciones del Usuario" },
        { id: "liability", title: "Limitación de Responsabilidad" },
        { id: "termination", title: "Terminación" },
        { id: "law", title: "Ley Aplicable" },
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
            {/* Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 origin-left z-50"
                style={{ scaleX }}
            />

            {/* Hero Section */}
            <div className="relative bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-cyan-50/50 dark:from-slate-900 dark:to-slate-800 pointer-events-none" />
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-100/40 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-cyan-100/40 rounded-full blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
                        <Link href="/" className="hover:text-indigo-600 transition-colors">Inicio</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/politica-privacidad" className="hover:text-indigo-600 transition-colors">Legal</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">Términos y Condiciones</span>
                    </nav>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center space-x-3 mb-6">
                            <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-700/10">
                                Legal
                            </span>
                            <span className="flex items-center text-sm text-gray-500">
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Vigente desde: 12 de Febrero, 2026
                            </span>
                        </div>

                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl mb-6">
                            Términos y Condiciones
                        </h1>
                        <p className="max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                            Bienvenido a LegacyMark. Estos términos rigen el uso de nuestros servicios de tecnología, marketing e inteligencia artificial.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

                    {/* Sticky Sidebar */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-24 space-y-1">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pl-3">
                                Secciones
                            </h3>
                            <nav className="space-y-1" aria-label="Sidebar">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                                            activeSection === section.id
                                                ? "bg-indigo-50 text-indigo-700 shadow-sm translate-x-1"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        {section.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-12">

                        {/* Intro */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="prose prose-lg prose-slate max-w-none dark:prose-invert"
                        >
                            <p className="lead text-xl text-gray-700 dark:text-gray-300">
                                Al acceder o utilizar los servicios de <strong>LegacyMark BIC S.A.S</strong> ("Nosotros", "La Agencia"), usted ("El Cliente", "El Usuario") acepta estar legalmente vinculado por estos Términos y Condiciones.
                            </p>
                        </motion.div>

                        {/* 1. Aceptación */}
                        <SectionCard id="acceptance" title="1. Aceptación de los Términos" icon={<Check className="w-6 h-6 text-green-600" />}>
                            <p className="mb-4 text-gray-600">
                                Si no está de acuerdo con alguna parte de estos términos, no podrá acceder a nuestros servicios. Estos términos se aplican a todos los visitantes, usuarios y otras personas que acceden o utilizan el Servicio.
                            </p>
                        </SectionCard>

                        {/* 2. Servicios */}
                        <SectionCard id="services" title="2. Nuestros Servicios" icon={<Globe className="w-6 h-6 text-blue-600" />}>
                            <p className="mb-4 text-gray-600">
                                LegacyMark ofrece servicios especializados en transformación digital, incluyendo pero no limitado a:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ServiceItem title="Desarrollo Web & Software" desc="Creación de sitios, aplicaciones y plataformas a medida." />
                                <ServiceItem title="Marketing Digital" desc="Estrategias SEO, SEM, gestión de redes sociales y publicidad." />
                                <ServiceItem title="Automatización & IA" desc="Implementación de chatbots, agentes autónomos y workflows." />
                                <ServiceItem title="Consultoría Estratégica" desc="Asesoramiento en transformación digital y crecimiento." />
                            </div>
                        </SectionCard>

                        {/* 3. Propiedad Intelectual */}
                        <SectionCard id="ip" title="3. Propiedad Intelectual" icon={<Scale className="w-6 h-6 text-purple-600" />}>
                            <h3 className="font-semibold text-gray-900 mb-2">3.1. Derechos de la Agencia</h3>
                            <p className="text-gray-600 mb-4">
                                Salvo acuerdo escrito en contrario, el código fuente base, metodologías, conocimientos previos ("Background IP") y herramientas internas utilizadas para prestar el servicio son propiedad exclusiva de LegacyMark.
                            </p>

                            <h3 className="font-semibold text-gray-900 mb-2">3.2. Entregables al Cliente</h3>
                            <p className="text-gray-600 mb-4">
                                Tras el pago total de los servicios, el Cliente obtiene una licencia de uso (o la cesión de derechos patrimoniales, según contrato específico) sobre los entregables finales (diseños, textos, software específico).
                            </p>

                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100">
                                <p className="text-sm text-purple-800 dark:text-purple-200">
                                    <strong>Reserva de Derechos:</strong> LegacyMark se reserva el derecho de mostrar el trabajo realizado en su portafolio y materiales de marketing, salvo acuerdo de confidencialidad (NDA) explícito.
                                </p>
                            </div>
                        </SectionCard>

                        {/* 4. Pagos */}
                        <SectionCard id="payments" title="4. Pagos y Facturación" icon={<DollarSign className="w-6 h-6 text-emerald-600" />}>
                            <ul className="space-y-3">
                                <TermListItem text="Los precios se estipulan en la propuesta comercial o contrato específico." />
                                <TermListItem text="Para proyectos de desarrollo, se requiere generalmente un anticipo del 50%." />
                                <TermListItem text="Las facturas deben pagarse dentro de los 5 días hábiles siguientes a su emisión." />
                                <TermListItem text="La falta de pago puede resultar en la suspensión inmediata de los servicios o la retención de entregables." />
                            </ul>
                        </SectionCard>

                        {/* 5. Obligaciones */}
                        <SectionCard id="obligations" title="5. Obligaciones del Usuario" icon={<Info className="w-6 h-6 text-cyan-600" />}>
                            <p className="text-gray-600 mb-4">El Usuario se compromete a:</p>
                            <ul className="space-y-3">
                                <TermListItem text="Proporcionar información veraz y completa." />
                                <TermListItem text="No utilizar nuestros servicios para fines ilegales o no autorizados." />
                                <TermListItem text="Respetar los derechos de propiedad intelectual de terceros." />
                                <TermListItem text="No intentar vulnerar la seguridad de nuestra plataforma o sistemas." />
                            </ul>
                        </SectionCard>

                        {/* 6. Responsabilidad */}
                        <SectionCard id="liability" title="6. Limitación de Responsabilidad" icon={<ShieldAlert className="w-6 h-6 text-orange-600" />}>
                            <p className="text-gray-600 mb-4">
                                En la máxima medida permitida por la ley aplicable, LegacyMark no será responsable por:
                            </p>
                            <div className="space-y-4">
                                <DisclaimerItem title="Daños Indirectos" desc="Lucro cesante, pérdida de datos, interrupción del negocio." />
                                <DisclaimerItem title="Fallos de Terceros" desc="Interrupciones causadas por proveedores de hosting, APIs externas (Meta, Google, OpenAI) o fallos de internet." />
                                <DisclaimerItem title="Uso del Cliente" desc="El uso que el Cliente haga de los entregables o la información proporcionada." />
                            </div>
                        </SectionCard>

                        {/* 7. Terminación */}
                        <SectionCard id="termination" title="7. Terminación" icon={<Ban className="w-6 h-6 text-red-600" />}>
                            <p className="text-gray-600">
                                Podemos terminar o suspender su acceso inmediatamente, sin previo aviso ni responsabilidad, por cualquier motivo, incluyendo, entre otros, si usted incumple los Términos. Tras la terminación, su derecho a utilizar el Servicio cesará inmediatamente.
                            </p>
                        </SectionCard>

                        {/* 8. Ley Aplicable */}
                        <SectionCard id="law" title="8. Ley Aplicable" icon={<Scale className="w-6 h-6 text-slate-600" />}>
                            <p className="text-gray-600">
                                Estos Términos se regirán e interpretarán de acuerdo con las leyes de la <strong>República de Colombia</strong>, sin tener en cuenta sus disposiciones sobre conflictos de leyes. Cualquier disputa se someterá a los tribunales competentes de Bogotá D.C.
                            </p>
                        </SectionCard>

                        {/* 9. Contacto */}
                        <div id="contact" className="rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 p-8 text-white shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                            <div className="relative z-10">
                                <h2 className="text-3xl font-bold mb-6">Contacto Legal</h2>
                                <p className="text-indigo-200 mb-8 max-w-2xl">
                                    Si tiene alguna pregunta sobre estos Términos, por favor contáctenos.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <a href="mailto:legacymarkcolombia@legacymarksas.com" className="flex items-center space-x-4 bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all border border-white/10 backdrop-blur-sm group">
                                        <div className="bg-indigo-500/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
                                            <Mail className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">Email</div>
                                            <div className="font-medium">legacymarkcolombia@legacymarksas.com</div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
                            <p>LegacyMark BIC S.A.S &copy; {new Date().getFullYear()}</p>
                        </div>

                    </div>
                </div>
            </div>

            {/* Back to top */}
            <Button
                variant="outline"
                size="icon"
                className="fixed bottom-8 right-8 rounded-full shadow-lg bg-white z-40 hidden md:flex hover:bg-gray-100"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
                <ArrowLeft className="w-4 h-4 rotate-90" />
            </Button>
        </div>
    );
}

// Subcomponents
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

function ServiceItem({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h4>
            <p className="text-sm text-gray-500">{desc}</p>
        </div>
    )
}

function TermListItem({ text }: { text: string }) {
    return (
        <li className="flex items-start">
            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 mr-3"></div>
            <span className="text-gray-700 dark:text-gray-300">{text}</span>
        </li>
    )
}

function DisclaimerItem({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="border-l-4 border-orange-200 pl-4 py-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
        </div>
    )
}
