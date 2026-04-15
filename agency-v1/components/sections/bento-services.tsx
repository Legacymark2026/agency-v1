"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useState, useEffect } from "react";
import { Search, PenTool, LayoutTemplate, Briefcase, ChevronRight, BarChart3, Cloud, Code, LineChart, Globe } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useTranslations } from "next-intl";

export const BentoServices = () => {
    const t = useTranslations("home.services");

    return (
        <div className="relative bg-slate-950 py-24 sm:py-32 overflow-hidden border-b border-transparent">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none mix-blend-screen" />

            <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-teal-900/50 bg-slate-900/60 text-teal-400 text-[10px] font-mono mb-6 uppercase tracking-widest shadow-sm"
                    >
                        <Briefcase size={12} strokeWidth={1.5} />
                        {t('badge')}
                    </motion.div>

                    <h2 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">
                        {t('titleStart')} <span className="text-slate-400 font-light">{t('titleHighlight')}</span>
                    </h2>
                    <p className="mt-6 text-base md:text-lg leading-relaxed text-slate-400 font-light max-w-xl mx-auto uppercase tracking-widest font-mono">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[300px]">

                    {/* CARD 1: Large (Span 2) - Marketing */}
                    <TechCard
                        className="md:col-span-2"
                        title={t('items.marketing.title')}
                        description={t('items.marketing.desc')}
                        icon={BarChart3}
                        bgCode="MKT_SYS_01"
                        metric="+420% ROAS"
                        metricDesc="Avg. Client ROI"
                    >
                        <div className="absolute bottom-0 right-0 w-64 h-32 bg-gradient-to-t from-slate-900 to-transparent opacity-50 pointer-events-none" />
                    </TechCard>

                    {/* CARD 2: Branding */}
                    <TechCard
                        title={t('items.branding.title')}
                        description={t('items.branding.desc')}
                        icon={PenTool}
                        bgCode="DSGN_CORE"
                        metric="94%"
                        metricDesc="Brand Recall"
                    />

                    {/* CARD 3: Web Dev */}
                    <TechCard
                        title={t('items.webdev.title')}
                        description={t('items.webdev.desc')}
                        icon={LayoutTemplate}
                        bgCode="DEV_OPS"
                        metric="98/100"
                        metricDesc="Core Web Vitals"
                    />

                    {/* CARD 4: Large (Span 2) - Automation */}
                    <TechCard
                        className="md:col-span-2"
                        title={t('items.automation.title')}
                        description={t('items.automation.desc')}
                        icon={Code}
                        bgCode="AUTO_BOT_V3"
                        metric="24/7"
                        metricDesc="Active Agents"
                    >
                        {/* Abstract Vis */}
                        <div className="absolute right-12 top-1/2 -translate-y-1/2 flex gap-1.5 opacity-20">
                            <div className="w-1.5 h-12 bg-slate-700 rounded-sm animate-pulse" />
                            <div className="w-1.5 h-8 bg-slate-700 rounded-sm animate-pulse delay-75" />
                            <div className="w-1.5 h-16 bg-slate-700 rounded-sm animate-pulse delay-150" />
                        </div>
                    </TechCard>

                    {/* CARD 5: SEO */}
                    <TechCard
                        title={t('items.seo.title')}
                        description={t('items.seo.desc')}
                        icon={Search}
                        bgCode="SERP_RANK_1"
                        metric="#1"
                        metricDesc="Google Ranking"
                    />

                    {/* CARD 6: Cloud */}
                    <TechCard
                        title={t('items.cloud.title')}
                        description={t('items.cloud.desc')}
                        icon={Cloud}
                        bgCode="AWS_VPC"
                        metric="99.9%"
                        metricDesc="Uptime SLA"
                    />

                    {/* CARD 7: Analytics */}
                    <TechCard
                        title={t('items.analytics.title')}
                        description={t('items.analytics.desc')}
                        icon={LineChart}
                        bgCode="DATA_LAKE"
                        metric="Real-time"
                        metricDesc="Data Sync"
                    />
                </div>
            </div>
        </div>
    );
};

const TechCard = ({
    className,
    title,
    description,
    icon: Icon,
    children,
    bgCode,
    metric,
    metricDesc
}: {
    className?: string;
    title: string;
    description: string;
    icon: any;
    children?: React.ReactNode;
    bgCode?: string;
    metric?: string;
    metricDesc?: string;
}) => {
    // Flashlight effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            onMouseMove={handleMouseMove}
            className={cn(
                "relative group overflow-hidden rounded-sm bg-slate-900/50 border border-slate-800 p-8 md:p-12 min-h-[300px] md:min-h-0 transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.15)] hover:-translate-y-1 hover:border-teal-500/30",
                className
            )}>
            {/* Flashlight Hover Effect */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-0"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            400px circle at ${mouseX}px ${mouseY}px,
                            rgba(45, 212, 191, 0.05),
                            transparent 80%
                        )
                    `,
                }}
            />

            {/* Tech Decoration */}
            <div className="absolute top-6 right-6 text-[10px] font-mono text-slate-600 group-hover:text-slate-400 transition-colors uppercase tracking-widest z-10">
                [{bgCode}]
            </div>

            {/* Icon */}
            <div className="w-10 h-10 rounded-sm bg-slate-800 border border-slate-700 flex items-center justify-center mb-8 shadow-sm group-hover:border-teal-800 group-hover:bg-teal-900/50 group-hover:scale-105 transition-all z-10 relative">
                <Icon size={18} strokeWidth={1.5} className="text-slate-400 group-hover:text-teal-400 transition-colors" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <h3 className="text-2xl font-black tracking-tight text-white group-hover:text-teal-50 transition-colors mb-4">
                    {title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-light max-w-sm">
                    {description}
                </p>
            </div>

            {/* Metric Hover Reveal */}
            {metric && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
                    <div className="text-center">
                        <div className="text-5xl font-black text-teal-400 mb-2 font-mono tracking-tighter">{metric}</div>
                        <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">{metricDesc}</div>
                    </div>
                </div>
            )}

            <div className="relative z-10">{children}</div>

            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left z-10" />
        </div>
    )
}
