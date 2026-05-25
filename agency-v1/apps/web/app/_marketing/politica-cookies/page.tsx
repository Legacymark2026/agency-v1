"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, FileText, Globe, Lock, Mail, Phone, Shield, User, Cookie, Settings, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CookiesPolicyPage() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [activeSection, setActiveSection] = useState("intro");

    const sections = [
        { id: "what-are", title: "¿Qué son las Cookies?" },
        { id: "types", title: "Tipos de Cookies" },
        { id: "legal-basis", title: "Base Legal" },
        { id: "detailed-list", title: "Listado de Cookies" },
        { id: "international", title: "Transferencias Int." },
        { id: "management", title: "Gestión y Config." },
        { id: "rnbd", title: "Registro Nacional" },
        { id: "changes", title: "Cambios en Política" },
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
            {/* 2. Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 origin-left z-50"
                style={{ scaleX }}
            />

            {/* 1. Hero Section */}
            <div className="relative bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-slate-900 dark:to-slate-800 pointer-events-none" />
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-100/40 rounded-full blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                    {/* 11. Breadcrumbs */}
                    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
                        <Link href="/" className="hover:text-blue-600 transition-colors">Inicio</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/politica-privacidad" className="hover:text-blue-600 transition-colors">Legal</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">Política de Cookies</span>
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
                            {/* 10. Last Updated Badge */}
                            <span className="flex items-center text-sm text-gray-500">
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Actualizado: 12 de Febrero, 2026
                            </span>
                        </div>

                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl mb-6">
                            Política de Cookies
                        </h1>
                        <p className="max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
                            En LegacyMark, nos comprometemos con la transparencia. Aquí te explicamos cómo funcionan nuestras cookies y cómo gestionarlas.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

                    {/* 3. Sticky Table of Contents */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-24 space-y-1">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pl-3">
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
                                                ? "bg-blue-50 text-blue-700 shadow-sm translate-x-1"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        {section.title}
                                    </button>
                                ))}
                            </nav>

                            {/* 12. Contact Call-to-Action (Mini) */}
                            <div className="mt-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
                                <h4 className="font-semibold mb-2">¿Necesitas ayuda?</h4>
                                <p className="text-xs text-slate-300 mb-4">Nuestro equipo legal está aquí para resolver tus dudas sobre privacidad.</p>
                                <Button size="sm" variant="secondary" className="w-full text-xs" onClick={() => scrollToSection("contact")}>
                                    Contactar DPO
                                </Button>
                            </div>
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
                                En <strong>LegacyMark BIC S.A.S</strong> (en adelante, &quot;la Agencia&quot;), nos comprometemos con la transparencia y la protección de tu privacidad.
                            </p>
                            <p>
                                Esta Política explica qué son las cookies, cuáles usamos y cómo puedes gestionarlas, en cumplimiento de la Ley 1581 de 2012. Al navegar en nuestro Sitio, nos otorgas tu consentimiento para su uso.
                            </p>
                        </motion.div>

                        {/* 1. ¿Qué son las Cookies? */}
                        <SectionCard id="what-are" title="1. ¿Qué son las Cookies?" icon={<Cookie className="w-6 h-6 text-amber-600" />}>
                            <p className="mb-4 text-gray-600">
                                Son pequeños archivos de texto que se almacenan en tu dispositivo. Permiten recordar tus acciones y preferencias (como idioma o login) para que no tengas que configurarlas cada vez.
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    En Colombia, las cookies pueden ser consideradas tratamiento de datos personales si permiten identificar a una persona. Por ello, aplicamos los principios de libertad, finalidad, transparencia y consentimiento.
                                </p>
                            </div>
                        </SectionCard>

                        {/* 2. Tipos de Cookies */}
                        <SectionCard id="types" title="2. Tipos de Cookies que Utilizamos" icon={<Settings className="w-6 h-6 text-purple-600" />}>

                            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">2.1. Según la entidad</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <FeatureItem title="Propias" desc="Enviadas desde nuestros dominios." />
                                <FeatureItem title="De Terceros" desc="Gestionadas por entidades externas (ej. Google, Meta)." />
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-4">2.2. Según su finalidad</h3>
                            <div className="space-y-4">
                                <CookieTypeItem title="Técnicas / Necesarias" desc="Indispensables para el funcionamiento (sesión, seguridad)." example="Sesión de usuario, seguridad." />
                                <CookieTypeItem title="Preferencias" desc="Recuerdan información para personalizar tu experiencia." example="Idioma, moneda." />
                                <CookieTypeItem title="Análisis / Medición" desc="Cuantifican usuarios y analizan el uso del sitio." example="Google Analytics." />
                                <CookieTypeItem title="Publicidad Comportamental" desc="Crean perfiles de usuario para mostrar publicidad relevante." example="Pixel de Facebook, Remarketing." />
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">2.3. Según plazo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FeatureItem title="Sesión" desc="Expiran al cerrar el navegador." />
                                <FeatureItem title="Persistentes" desc="Permanecen por un tiempo definido." />
                            </div>
                        </SectionCard>

                        {/* 3. Base Legal */}
                        <SectionCard id="legal-basis" title="3. Base Legal" icon={<Shield className="w-6 h-6 text-green-600" />}>
                            <p className="text-gray-600 mb-4">El tratamiento se basa en tu consentimiento expreso e informado (Ley 1581 de 2012).</p>
                            <ul className="space-y-3">
                                <CheckListItem text="Cookies Técnicas: Exceptuadas de consentimiento por ser necesarias." />
                                <CheckListItem text="Cookies de Análisis y Publicidad: Requieren tu aprobación (botón 'Aceptar')." />
                            </ul>
                            <p className="text-sm text-gray-500 mt-4">Recuerda que puedes revocar este consentimiento en cualquier momento.</p>
                        </SectionCard>

                        {/* 4. Listado Detallado */}
                        <SectionCard id="detailed-list" title="4. Listado Detallado" icon={<FileText className="w-6 h-6 text-blue-600" />}>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cookie</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duración</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                        <CookieRow name="PHPSESSID" provider="LegacyMark" type="Técnica propia" duration="Sesión" />
                                        <CookieRow name="_ga" provider="Google Analytics" type="Análisis" duration="2 años" />
                                        <CookieRow name="_gid" provider="Google Analytics" type="Análisis" duration="24 horas" />
                                        <CookieRow name="_fbp" provider="Meta (Facebook)" type="Publicidad" duration="3 meses" />
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>

                        {/* 5. Transferencias Internacionales */}
                        <SectionCard id="international" title="5. Transferencias Internacionales" icon={<Globe className="w-6 h-6 text-cyan-600" />}>
                            <p className="text-gray-600 mb-4">
                                Al usar herramientas como Google o Meta, tus datos pueden ser transferidos a servidores en EE.UU. u otros países.
                            </p>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100">
                                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                                    Estas transferencias están amparadas por la Ley 1581 de 2012, bajo tu autorización o mediante países con niveles adecuados de protección.
                                </p>
                            </div>
                        </SectionCard>


                        {/* 6. Gestión y Configuración */}
                        <SectionCard id="management" title="6. Gestión y Configuración" icon={<Settings className="w-6 h-6 text-slate-600" />}>
                            <p className="text-gray-600 mb-6">Puedes aceptar, bloquear o eliminar cookies en cualquier momento.</p>

                            <h3 className="font-semibold text-gray-900 mb-2">6.1. A través de nuestro aviso</h3>
                            <p className="text-sm text-gray-500 mb-6">El banner inicial te permite aceptar todo, rechazar no esenciales o configurar preferencias.</p>

                            <h3 className="font-semibold text-gray-900 mb-2">6.2. A través del navegador</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" size="sm" asChild><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a></Button>
                                <Button variant="outline" size="sm" asChild><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Firefox</a></Button>
                                <Button variant="outline" size="sm" asChild><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></Button>
                                <Button variant="outline" size="sm" asChild><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Edge</a></Button>
                            </div>
                        </SectionCard>

                        {/* 7. RNBD */}
                        <SectionCard id="rnbd" title="7. Registro Nacional (RNBD)" icon={<FileText className="w-6 h-6 text-indigo-600" />}>
                            <p className="text-gray-600">
                                Informamos que las bases de datos personales recabadas vía cookies están debidamente inscritas en el Registro Nacional de Bases de Datos (RNBD), cumpliendo con la Circular Externa 001 de 2016 de la SIC.
                            </p>
                        </SectionCard>

                        {/* 8. Cambios */}
                        <SectionCard id="changes" title="8. Cambios en la Política" icon={<AlertTriangle className="w-6 h-6 text-orange-600" />}>
                            <p className="text-gray-600">
                                LegacyMark se reserva el derecho de modificar esta política por novedades legislativas o cambios en la industria. Cualquier cambio será publicado aquí.
                            </p>
                        </SectionCard>

                        {/* 9. Contacto */}
                        <div id="contact" className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
                            <div className="relative z-10">
                                <h2 className="text-3xl font-bold mb-6">¿Dudas sobre Cookies?</h2>
                                <p className="text-slate-300 mb-8 max-w-2xl">
                                    Si deseas ejercer tus derechos o tienes preguntas, contáctanos. Acompaña tu solicitud con copia de tu documento de identidad.
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

                        <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
                            <p>Documento actualizado a: 12 de Febrero, 2026</p>
                        </div>

                    </div>
                </div>
            </div>

            {/* 20. Back to top */}
            <Button
                variant="outline"
                size="icon"
                className="fixed bottom-8 right-8 rounded-full shadow-lg bg-white z-40 hidden md:flex"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
                <ArrowLeft className="w-4 h-4 rotate-90" />
            </Button>
        </div>
    );
}

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

function CookieTypeItem({ title, desc, example }: { title: string, desc: string, example: string }) {
    return (
        <div className="border-l-4 border-purple-500 pl-4 py-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{desc}</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 italic">Ejemplo: {example}</p>
        </div>
    )
}

function CookieRow({ name, provider, type, duration }: { name: string, provider: string, type: string, duration: string }) {
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{provider}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{type}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{duration}</td>
        </tr>
    )
}
