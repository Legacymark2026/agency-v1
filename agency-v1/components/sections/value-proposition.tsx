"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import React, { useRef } from "react";
import { Target, Cpu, Activity, Globe } from "lucide-react";
import { useTranslations } from "next-intl";

export function ValueProposition() {
    const t = useTranslations("home.valueProp");

    const values = [
        {
            icon: Target,
            title: t('items.execution.title'),
            description: t('items.execution.desc'),
        },
        {
            icon: Cpu,
            title: t('items.engineering.title'),
            description: t('items.engineering.desc'),
        },
        {
            icon: Activity,
            title: t('items.growth.title'),
            description: t('items.growth.desc'),
        }
    ];

    return (
        <section className="bg-transparent py-24 sm:py-32 relative overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Header */}
                    <div className="lg:col-span-3 text-center mb-16">
                        <h2 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl text-balance">
                            {t('titleStart')} <span className="text-teal-400 font-light">{t('titleHighlight')}</span>
                        </h2>
                        <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-light font-mono uppercase tracking-widest">
                            {t('subtitle')}
                        </p>
                    </div>

                    {values.map((val, idx) => (
                        <TiltCard key={idx} val={val} index={idx} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function TiltCard({ val, index }: { val: any, index: number }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    // Use proper refs for Framer Motion
    const ref = useRef<HTMLDivElement>(null);

    const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]); // Reduced rotation for card
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const clientX = e.clientX;
        const clientY = e.clientY;

        const xPct = (clientX - rect.left) / width - 0.5;
        const yPct = (clientY - rect.top) / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            style={{ perspective: 1000 }}
            className="group h-full"
        >
            <motion.div
                ref={ref}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                className="bg-slate-900/50 p-12 rounded-sm shadow-xl border border-slate-800 hover:border-teal-500/30 hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.15)] transition-all duration-500 h-full flex flex-col items-start relative overflow-hidden hover:-translate-y-2 backdrop-blur-sm"
            >
                {/* Holographic BG on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="h-12 w-12 bg-slate-800 border border-slate-700 text-teal-400 rounded-sm flex items-center justify-center mb-8 group-hover:scale-105 transition-transform relative z-10 shadow-sm group-hover:border-teal-800 group-hover:bg-teal-900/50">
                    <val.icon size={20} strokeWidth={1.5} />
                </div>

                <h3 className="text-2xl font-black tracking-tight text-white mb-4 relative z-10 group-hover:text-teal-50 transition-colors">
                    {val.title}
                </h3>

                <p className="text-slate-400 leading-relaxed text-sm relative z-10 font-light">
                    {val.description}
                </p>

                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 text-slate-800/50 opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none">
                    <Globe size={120} strokeWidth={0.5} />
                </div>
            </motion.div>
        </motion.div>
    );
}
