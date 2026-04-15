"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Terminal, HelpCircle, Cpu, Globe, Shield, Server, UserCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

const PROTOCOLS = [
    {
        id: "ia",
        icon: Cpu,
        question: "¿Cómo garantizan que la IA realmente genere retorno y no sea solo una tendencia?",
        answer: "No implementamos IA de forma aislada; diseñamos Arquitecturas de Autonomía. Nuestro protocolo comienza con el mapeo de fricciones operativas y cuellos de botella en tu embudo de ventas. Desarrollamos agentes personalizados que se integran a tu stack tecnológico actual (CRM, APIs de pauta) para automatizar la captura y calificación de leads en tiempo real. La meta no es 'usar IA', es reducir tu costo de adquisición (CAC) y liberar el talento humano para tareas de cierre de alto impacto."
    },
    {
        id: "stack",
        icon: Server,
        question: "¿Por qué utilizan Next.js y arquitecturas de microservicios para sus proyectos?",
        answer: "La autoridad digital se construye sobre la velocidad y la escalabilidad. Utilizamos Next.js porque ofrece el rendimiento más alto del mercado (Core Web Vitals), esencial para el SEO técnico y la retención de usuarios. Al trabajar con microservicios y bases de datos optimizadas (PostgreSQL/Redis), garantizamos que tu ecosistema digital sea capaz de soportar picos de tráfico masivos y expansión internacional sin degradación del servicio ni deuda técnica."
    },
    {
        id: "capi",
        icon: Shield,
        question: "¿Cómo solucionan la pérdida de datos de conversión por las restricciones de privacidad actuales?",
        answer: "Implementamos Protocolos de Medición de Lazo Cerrado. Ante las limitaciones de las cookies de terceros, integramos la API de Conversiones (CAPI) directamente desde tu servidor. Esto nos permite enviar señales de datos precisas a las plataformas de pauta (Meta, Google), recuperando la visibilidad del ROAS real y permitiendo que los algoritmos de aprendizaje automático optimicen tus campañas con datos de primera fuente, no con suposiciones."
    },
    {
        id: "intl",
        icon: Globe,
        question: "¿Qué estrategia siguen para posicionar una marca en mercados competitivos como EE.UU. o España?",
        answer: "La expansión no es solo traducción, es Localización de Autoridad. Aplicamos estrategias de SEO Internacional dinámico y arquitecturas de contenido específicas por región. Analizamos los motores de respuesta (AEO) de cada mercado para asegurar que tu marca sea la solución recomendada por la IA. Combinamos esto con una infraestructura técnica que detecta la ubicación del usuario para entregar una experiencia de carga ultrarrápida desde el nodo más cercano, eliminando cualquier fricción geográfica."
    },
    {
        id: "client",
        icon: UserCheck,
        question: "¿Cómo es el seguimiento una vez lanzado el ecosistema digital?",
        answer: "LegacyMark no entrega proyectos, gestiona activos digitales. Cada cliente tiene acceso a su propio Client Terminal, donde monitoreamos en tiempo real el estado de los protocolos activos, métricas de rendimiento y actualizaciones de seguridad mTLS. Operamos bajo un modelo de iteración continua: utilizamos los datos del mercado para ajustar la estrategia mensualmente, asegurando que tu infraestructura evolucione al mismo ritmo que la tecnología."
    }
];

export function FaqAccordion() {
    return (
        <section className="bg-transparent py-24 relative">
            <div className="mx-auto max-w-3xl px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-teal-900/50 bg-slate-900/60 text-teal-400 text-[10px] font-mono mb-6 uppercase tracking-widest shadow-sm">
                        <Terminal size={12} strokeWidth={1.5} />
                        Protocolos de Respuesta
                    </div>
                    <h2 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl text-balance">
                        Preguntas Strategicas
                    </h2>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-sm rounded-sm border border-slate-800 shadow-xl hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.15)] transition-shadow duration-500 overflow-hidden">
                    <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                        </div>
                        <div className="mx-auto text-[10px] font-mono text-slate-400">secure_protocol_v2.sh</div>
                    </div>

                    <div className="p-6 md:p-8">
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {PROTOCOLS.map((protocol) => (
                                <AccordionItem key={protocol.id} value={protocol.id} className="border border-slate-800 rounded-sm px-4 data-[state=open]:border-teal-500/30 data-[state=open]:bg-slate-900 transition-all duration-300">
                                    <AccordionTrigger className="text-white hover:text-teal-400 font-bold text-left hover:no-underline">
                                        <span className="flex items-center gap-3">
                                            <protocol.icon size={16} strokeWidth={1.5} className="text-teal-500 shrink-0" />
                                            <span className="text-sm md:text-base">{protocol.question}</span>
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-slate-400 pl-7 leading-relaxed font-light text-sm md:text-base">
                                        <div dangerouslySetInnerHTML={{ __html: protocol.answer }} />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        
                        {/* CTA Final */}
                        <div className="mt-8 pt-8 border-t border-slate-800 text-center">
                             <Link href="/contacto" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-sm font-bold transition-colors">
                                ¿Necesitas un protocolo a medida? Iniciar Diagnóstico
                                <ArrowRight size={16} />
                             </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
