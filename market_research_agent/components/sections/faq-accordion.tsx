"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Terminal, HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function FaqAccordion() {
    const t = useTranslations("home.faq");
    return (
        <section className="bg-transparent py-24 relative">
            <div className="mx-auto max-w-3xl px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-teal-900/50 bg-slate-900/60 text-teal-400 text-[10px] font-mono mb-6 uppercase tracking-widest shadow-sm">
                        <HelpCircle size={12} strokeWidth={1.5} />
                        {t('badge')}
                    </div>
                    <h2 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl text-balance">
                        {t('titleStart')} <span className="text-teal-400 font-light">{t('titleHighlight')}</span>
                    </h2>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-sm rounded-sm border border-slate-800 shadow-xl hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.15)] transition-shadow duration-500 overflow-hidden">
                    <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                        </div>
                        <div className="mx-auto text-[10px] font-mono text-slate-500">faq_terminal_v1.sh</div>
                    </div>

                    <div className="p-6 md:p-8">
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            <AccordionItem value="item-1" className="border border-slate-800 rounded-sm px-4 data-[state=open]:border-teal-500/30 data-[state=open]:bg-slate-900 transition-all duration-300">
                                <AccordionTrigger className="text-white hover:text-teal-400 font-bold text-left hover:no-underline">
                                    <span className="flex items-center gap-3">
                                        <Terminal size={14} strokeWidth={1.5} className="text-teal-500 shrink-0" />
                                        {t('q1.q')}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="text-slate-400 pl-7 leading-relaxed font-light [&>div]:opacity-0 data-[state=open]:[&>div]:animate-in data-[state=open]:[&>div]:fade-in data-[state=open]:[&>div]:slide-in-from-top-2 data-[state=open]:[&>div]:duration-500 data-[state=open]:[&>div]:delay-150">
                                    <div>{t('q1.a')}</div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-2" className="border border-slate-800 rounded-sm px-4 data-[state=open]:border-teal-500/30 data-[state=open]:bg-slate-900 transition-all duration-300">
                                <AccordionTrigger className="text-white hover:text-teal-400 font-bold text-left hover:no-underline">
                                    <span className="flex items-center gap-3">
                                        <Terminal size={14} strokeWidth={1.5} className="text-teal-500 shrink-0" />
                                        {t('q2.q')}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="text-slate-400 pl-7 leading-relaxed font-light [&>div]:opacity-0 data-[state=open]:[&>div]:animate-in data-[state=open]:[&>div]:fade-in data-[state=open]:[&>div]:slide-in-from-top-2 data-[state=open]:[&>div]:duration-500 data-[state=open]:[&>div]:delay-150">
                                    <div>{t('q2.a')}</div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3" className="border border-slate-800 rounded-sm px-4 data-[state=open]:border-teal-500/30 data-[state=open]:bg-slate-900 transition-all duration-300">
                                <AccordionTrigger className="text-white hover:text-teal-400 font-bold text-left hover:no-underline">
                                    <span className="flex items-center gap-3">
                                        <Terminal size={14} strokeWidth={1.5} className="text-teal-500 shrink-0" />
                                        {t('q3.q')}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="text-slate-400 pl-7 leading-relaxed font-light [&>div]:opacity-0 data-[state=open]:[&>div]:animate-in data-[state=open]:[&>div]:fade-in data-[state=open]:[&>div]:slide-in-from-top-2 data-[state=open]:[&>div]:duration-500 data-[state=open]:[&>div]:delay-150">
                                    <div>{t('q3.a')}</div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    );
}
