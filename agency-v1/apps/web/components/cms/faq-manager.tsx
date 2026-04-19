'use client';

import { Plus, Trash2, GripVertical, HelpCircle, MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface FAQPair {
    question: string;
    answer: string;
}

interface FAQManagerProps {
    value: FAQPair[];
    onChange: (faqs: FAQPair[]) => void;
}

export function FAQManager({ value, onChange }: FAQManagerProps) {
    const [faqs, setFaqs] = useState<FAQPair[]>(value || []);

    const addFAQ = () => {
        const newFaqs = [...faqs, { question: "", answer: "" }];
        setFaqs(newFaqs);
        onChange(newFaqs);
    };

    const removeFAQ = (index: number) => {
        const newFaqs = faqs.filter((_, i) => i !== index);
        setFaqs(newFaqs);
        onChange(newFaqs);
    };

    const updateFAQ = (index: number, field: keyof FAQPair, newValue: string) => {
        const newFaqs = faqs.map((faq, i) => {
            if (i === index) {
                return { ...faq, [field]: newValue };
            }
            return faq;
        });
        setFaqs(newFaqs);
        onChange(newFaqs);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-teal-600" />
                    <h3 className="font-semibold text-lg">Preguntas Frecuentes (FAQs)</h3>
                </div>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addFAQ}
                    className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                    <Plus className="h-4 w-4" />
                    Añadir Pregunta
                </Button>
            </div>

            <div className="space-y-3">
                <AnimatePresence initial={false}>
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group"
                        >
                            <div className="flex gap-4">
                                <div className="mt-2 text-slate-400 cursor-grab active:cursor-grabbing">
                                    <GripVertical className="h-5 w-5" />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-tight">
                                            <HelpCircle className="h-3 w-3" />
                                            Pregunta
                                        </div>
                                        <Input
                                            value={faq.question}
                                            onChange={(e) => updateFAQ(index, "question", e.target.value)}
                                            placeholder="¿Cómo ayuda LegacyMark en el crecimiento de mi marca?"
                                            className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-tight">
                                            <MessageSquareQuote className="h-3 w-3" />
                                            Respuesta
                                        </div>
                                        <Textarea
                                            value={faq.answer}
                                            onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                                            placeholder="Ofrecemos soluciones personalizadas impulsadas por IA..."
                                            className="bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 min-h-[80px]"
                                        />
                                    </div>
                                </div>
                                <div className="pt-6">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFAQ(index)}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {faqs.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No hay FAQs añadidas. Las FAQs ayudan a que Google y los modelos de IA entiendan mejor tu contenido.</p>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={addFAQ}
                            className="text-teal-600 font-semibold mt-2 hover:bg-teal-50"
                        >
                            Comenzar a añadir FAQs
                        </Button>
                    </div>
                )}
            </div>
            
            <p className="text-[11px] text-slate-400 italic">
                * Consejo: Usa palabras clave relevantes en las preguntas para mejorar el ranking SEO.
            </p>
        </div>
    );
}
