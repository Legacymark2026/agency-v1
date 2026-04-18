"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Handshake, TrendingUp, CheckCircle2, ShieldCheck, Globe, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const PARTNERS = [
    { name: "Google Ads", tier: "Premier Partner", metric: "Top 3% Global", icon: Globe, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Meta Business", tier: "Marketing Pro", metric: "Ad Spend >$1M", icon: Handshake, color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "Vercel Enterprise", tier: "Expert System", metric: "99.99% Uptime", icon: Cpu, color: "text-gray-800", bg: "bg-gray-100" },
    { name: "HubSpot", tier: "Solutions Partner", metric: "CRM Integration", icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
    { name: "Shopify Plus", tier: "Agency Partner", metric: "E-comm Scale", icon: ShieldCheck, color: "text-green-500", bg: "bg-green-500/10" },
];

export function StrategicAlliances() {
    const t = useTranslations("home.alliances");

    return (
        <section className="py-24 bg-slate-950 border-b border-transparent overflow-hidden relative">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">

                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-teal-900/50 bg-slate-900/60 text-teal-400 text-xs font-mono mb-6 uppercase tracking-widest shadow-sm"
                    >
                        <ShieldCheck size={12} strokeWidth={1.5} />
                        {t('badge')}
                    </motion.div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">{t('titleStart')} <span className="text-teal-400">{t('titleHighlight')}</span></h2>
                </div>

                {/* Partners Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {PARTNERS.map((partner, index) => (
                        <motion.div
                            key={partner.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="group relative flex flex-col items-center justify-between p-8 bg-transparent rounded-sm hover:-translate-y-2 transition-all duration-500 grayscale opacity-40 hover:grayscale-0 hover:opacity-100"
                        >
                            <div className={cn("p-4 rounded-full mb-6 transition-colors", partner.bg)}>
                                <partner.icon className={cn("w-8 h-8", partner.color)} strokeWidth={1.5} />
                            </div>

                            <div className="text-center transition-all group-hover:opacity-100 opacity-60">
                                <h3 className="font-bold text-white mb-1 tracking-tight text-lg">{partner.name}</h3>
                                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4">
                                    {partner.tier}
                                </p>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-sm border border-slate-800 text-xs font-bold text-slate-300 shadow-sm font-mono tracking-wider">
                                    <CheckCircle2 size={12} className={partner.color} strokeWidth={1.5} />
                                    {partner.metric}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Performance Ticker */}
                <div className="mt-16 relative flex overflow-hidden border-y border-transparent bg-slate-900/50 py-3">
                    <div className="animate-marquee whitespace-nowrap flex gap-16 items-center">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex gap-16">
                                {["SYSTEM STATUS: ONLINE", "AVG. ROAS: 450%", "UPTIME: 99.99%", "SECURE CONNECTION", "LIVE TELEMETRY"].map((text, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)] animate-pulse" />
                                        {text}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
