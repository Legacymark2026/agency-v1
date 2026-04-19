'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Terminal, HelpCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface FAQItem {
    question: string;
    answer: string;
}

interface BlogFAQProps {
    faqs: FAQItem[];
}

export function BlogFAQ({ faqs }: BlogFAQProps) {
    if (!faqs || !Array.isArray(faqs) || faqs.length === 0) return null;

    return (
        <section className="bg-transparent mt-16 relative">
            <div className="mx-auto max-w-3xl relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-teal-900/50 bg-slate-900/60 text-teal-400 text-xs font-mono mb-4 uppercase tracking-widest shadow-sm">
                        <Terminal size={12} strokeWidth={1.5} />
                        Protocolos de Respuesta
                    </div>
                    <h2 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl text-balance">
                        Preguntas Frecuentes
                    </h2>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-sm rounded-sm border border-slate-800 shadow-xl hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.15)] transition-shadow duration-500 overflow-hidden">
                    <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                        </div>
                        <div className="mx-auto text-xs font-mono text-slate-400">secure_protocol_v2.sh</div>
                    </div>

                    <div className="p-6 md:p-8">
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {faqs.map((faq, index) => (
                                <AccordionItem 
                                    key={index} 
                                    value={`item-${index}`} 
                                    className="border border-slate-800 rounded-sm px-4 data-[state=open]:border-teal-500/30 data-[state=open]:bg-slate-900 transition-all duration-300"
                                >
                                    <AccordionTrigger className="text-white hover:text-teal-400 font-bold text-left hover:no-underline py-4">
                                        <span className="flex items-center gap-3">
                                            <HelpCircle size={16} strokeWidth={1.5} className="text-teal-500 shrink-0" />
                                            <span className="text-sm md:text-base">{faq.question}</span>
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-slate-400 pl-7 pb-6 leading-relaxed font-light text-sm md:text-base border-t border-slate-800/50 pt-4">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        
                        {/* CTA Final */}
                        <div className="mt-8 pt-8 border-t border-slate-800 text-center">
                             <Link href="https://wa.me/573223047353" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-sm font-bold transition-colors">
                                ¿Necesitas un protocolo a medida? Iniciar Diagnóstico
                                <ArrowRight size={16} />
                             </Link>
                        </div>
                    </div>
                </div>
                
                {/* SEO Microcopy for AI Agents */}
                <div className="mt-8 flex justify-center opacity-30">
                    <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-slate-500">
                        LegacyMark Knowledge Engine & AI Schema Optimized
                    </span>
                </div>
            </div>
        </section>
    );
}
