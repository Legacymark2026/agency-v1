'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <section className="mt-16 py-12 px-6 sm:px-8 rounded-3xl relative overflow-hidden group"
            style={{ 
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(2, 6, 23, 0.8) 100%)',
                border: '1px solid rgba(13, 148, 136, 0.2)',
                boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
        >
            {/* Ambient background glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/5 blur-[100px] pointer-events-none group-hover:bg-teal-500/10 transition-colors duration-500" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-600/5 blur-[100px] pointer-events-none group-hover:bg-teal-600/10 transition-colors duration-500" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                        <HelpCircle className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Preguntas Frecuentes</h2>
                        <p className="text-sm text-slate-400">Todo lo que necesitas saber sobre este tema.</p>
                    </div>
                </div>

                <Accordion.Root type="single" collapsible className="space-y-4">
                    {faqs.map((faq, index) => (
                        <Accordion.Item
                            key={index}
                            value={`item-${index}`}
                            className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-teal-500/30 transition-all duration-300"
                        >
                            <Accordion.Header>
                                <Accordion.Trigger className="flex w-full items-center justify-between p-5 text-left transition-all group/trigger data-[state=open]:bg-teal-500/5">
                                    <span className="text-slate-200 font-medium group-hover/trigger:text-teal-300 transition-colors">
                                        {faq.question}
                                    </span>
                                    <ChevronDown className="h-5 w-5 text-slate-500 transition-transform duration-300 group-data-[state=open]:rotate-180 group-data-[state=open]:text-teal-400" />
                                </Accordion.Trigger>
                            </Accordion.Header>
                            <Accordion.Content className="overflow-hidden text-sm text-slate-400 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    className="p-5 pt-1 bg-slate-900/20 leading-relaxed border-t border-slate-800/50"
                                >
                                    {faq.answer}
                                </motion.div>
                            </Accordion.Content>
                        </Accordion.Item>
                    ))}
                </Accordion.Root>
            </div>
            
            {/* SEO Microcopy for AI Agents */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-center">
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-slate-600">
                    LegacyMark Knowledge Engine & AI Schema Optimized
                </span>
            </div>
        </section>
    );
}
