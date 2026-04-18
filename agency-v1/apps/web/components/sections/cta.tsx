"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, Radio } from "lucide-react";
import { useTranslations } from "next-intl";

export function CTA() {
    const t = useTranslations("home.cta");
    return (
        <section className="relative py-32 overflow-hidden bg-slate-950 border-t border-slate-900">
            {/* Background Beams - Dark Mode */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-sm text-slate-300 text-xs font-mono mb-12 uppercase tracking-widest"
                >
                    <Radio size={12} strokeWidth={1.5} className="animate-pulse text-teal-400" />
                    {t('badge')}
                </motion.div>

                <h2 className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-[-0.04em] text-white mb-10 leading-[0.85] uppercase">
                    {t('titleStart')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500 font-bold">{t('titleHighlight')}</span>
                </h2>

                <p className="text-xl md:text-2xl text-slate-400 mb-16 max-w-2xl mx-auto font-light font-mono uppercase tracking-widest">
                    {t('subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Button size="lg" className="h-16 px-12 rounded-sm bg-teal-500 text-slate-950 hover:bg-teal-400 hover:shadow-[0_0_40px_-10px_rgba(20,184,166,0.6)] text-lg font-bold shadow-xl hover:-translate-y-1 transition-all group">
                        <span className="flex items-center gap-3">
                            {t('btn1')} <Rocket strokeWidth={1.5} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </span>
                    </Button>
                    <Button variant="outline" size="lg" className="h-16 px-12 rounded-sm border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white hover:bg-slate-800 text-lg font-bold bg-transparent backdrop-blur-sm transition-all shadow-sm">
                        {t('btn2')}
                    </Button>
                </div>

                {/* Footer Data */}
                <div className="mt-16 pt-8 border-t border-slate-800 flex justify-center gap-8 text-sm font-mono text-slate-500">
                    <span>{t('footerInfo.f1')}</span>
                    <span>{t('footerInfo.f2')}</span>
                    <span>{t('footerInfo.f3')}</span>
                </div>
            </div>
        </section>
    );
}
