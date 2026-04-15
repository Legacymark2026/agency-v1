"use client";

import { motion } from "framer-motion";
import { Lightbulb, Zap, TrendingUp, Clock, Globe } from "lucide-react";

import { useTranslations } from "next-intl";

const valuesConfig = [
    {
        key: "creativity",
        icon: Lightbulb,
        className: "md:col-span-2",
        gradient: "from-purple-500 to-indigo-500"
    },
    {
        key: "innovation",
        icon: Zap,
        className: "md:col-span-1",
        gradient: "from-amber-400 to-orange-500"
    },
    {
        key: "effectiveness",
        icon: TrendingUp,
        className: "md:col-span-1",
        gradient: "from-emerald-400 to-teal-500"
    },
    {
        key: "efficiency",
        icon: Clock,
        className: "md:col-span-2",
        gradient: "from-blue-400 to-cyan-500"
    },
    {
        key: "responsibility",
        icon: Globe,
        className: "md:col-span-3",
        gradient: "from-pink-500 to-rose-500"
    }
];

export function CorporateValues() {
    const t = useTranslations("nosotrosPage.values");

    return (
        <section className="py-24 bg-white">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-slate-900 mb-4">{t('title')}</h2>
                    <p className="text-slate-500">{t('subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {valuesConfig.map((value, i) => (
                        <motion.div
                            key={value.key}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: i * 0.1, duration: 0.5, type: "spring" }}
                            className={`${value.className} group relative overflow-hidden rounded-[2rem] bg-slate-50 hover:bg-white p-8 md:p-10 transition-all duration-500 border border-slate-200/60 hover:border-transparent flex flex-col justify-between min-h-[280px] shadow-sm hover:shadow-2xl hover:shadow-slate-200/50`}
                        >
                            {/* Animated Gradient Border on Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl`} />
                            <div className="absolute inset-[1px] bg-white rounded-[1.9rem] z-0" />

                            <div className={`absolute -right-20 -top-20 w-60 h-60 bg-gradient-to-br ${value.gradient} opacity-5 group-hover:opacity-20 rounded-full blur-[80px] group-hover:scale-150 transition-all duration-700 z-10`} />

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className={`w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-white shadow-sm flex items-center justify-center mb-6 transition-colors duration-300 border border-slate-200 group-hover:scale-110 origin-left`}>
                                    <value.icon className="w-7 h-7 text-slate-700 group-hover:text-black transition-colors" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">{t(`items.${value.key}.title`)}</h3>
                                    <p className="text-slate-500 font-medium text-lg leading-relaxed group-hover:text-slate-600 transition-colors">{t(`items.${value.key}.description`)}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
