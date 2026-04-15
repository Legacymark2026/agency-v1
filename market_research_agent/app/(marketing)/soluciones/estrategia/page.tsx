"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowRight, TrendingUp, Rocket,
    Search, LineChart,
    Briefcase, BrainCircuit, Network, Database,
    Crown, Map
} from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate } from "framer-motion";
import { useRef } from "react";
import { useTranslations } from "next-intl";

// --- Advanced Visual Components (Spanish Edition) ---

// 1. Interactive Blueprint Board (Enhanced)
const BlueprintGrid = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        {/* Dynamic Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.3]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:160px_160px] opacity-[0.2]" />

        {/* Animated Scanning Line */}
        <motion.div
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[2px] bg-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.3)]"
        />

        {/* Glowing Nodes */}
        <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-teal-500/10 rounded-full blur-[80px]"
        />
    </div>
);

// 2. 3D Tilt Card (Professional Spanish)
function ExecutiveCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className={`group relative border border-slate-900 bg-black/90 overflow-hidden ${className}`}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            800px circle at ${mouseX}px ${mouseY}px,
                            rgba(20, 184, 166, 0.08),
                            transparent 80%
                        )
                    `,
                }}
            />
            {/* Tech Corners */}
            <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-slate-800 group-hover:border-teal-500/50 transition-colors" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-slate-800 group-hover:border-teal-500/50 transition-colors" />

            <div className="relative h-full z-10">{children}</div>
        </motion.div>
    );
}

// 3. Transformation Timeline Node (Localized)
const TimelineNode = ({
    step, title, desc, icon: Icon, isLast = false, delay = 0
}: {
    step: string, title: string, desc: string, icon: React.ElementType, isLast?: boolean, delay?: number
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay }}
            viewport={{ once: true }}
            className="relative pl-12 pb-16 last:pb-0"
        >
            {/* Line */}
            {!isLast && (
                <div className="absolute left-[19px] top-10 bottom-0 w-[1px] bg-slate-900">
                    <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: "100%" }}
                        transition={{ duration: 1.5, delay: delay + 0.5 }}
                        className="w-full bg-teal-900/50 origin-top"
                    />
                </div>
            )}

            {/* Circle */}
            <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-black border border-slate-800 flex items-center justify-center z-10 group hover:border-teal-500/50 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <Icon size={18} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
            </div>

            {/* Content */}
            <ExecutiveCard className="p-8 rounded-sm border-l-2 border-l-slate-800 hover:border-l-teal-500 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                    <span className="text-[10px] font-mono text-teal-500 uppercase tracking-widest border border-teal-500/20 px-2 py-1 bg-teal-500/5">{step}</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </ExecutiveCard>
        </motion.div>
    );
};

export default function StrategyPage() {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll();
    const t = useTranslations("estrategiaPage");

    // Parallax

    const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

    return (
        <main className="bg-black selection:bg-teal-500 selection:text-white overflow-hidden text-white w-full font-sans">

            {/* 1. HERO SECTION: "Arquitectos de Dominio" */}
            <section ref={targetRef} className="relative min-h-screen flex items-center justify-center pt-24 pb-20 overflow-hidden bg-black">
                <BlueprintGrid />

                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black pointer-events-none" />

                <motion.div
                    style={{ opacity, scale }}
                    className="container relative z-10 mx-auto px-6 lg:px-8 max-w-7xl"
                >
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="text-left relative">
                            {/* Decorative Line */}
                            <div className="absolute -left-8 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-slate-800 to-transparent hidden lg:block" />

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                className="inline-flex items-center gap-3 px-3 py-1 border border-slate-800 bg-black/50 backdrop-blur-sm mb-8 hover:border-teal-500/30 transition-colors cursor-default"
                            >
                                <BrainCircuit size={14} className="text-teal-500" />
                                <span className="text-slate-400 text-[10px] font-mono font-medium uppercase tracking-[0.2em]">{t('hero.badge')}</span>
                            </motion.div>

                            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-white mb-8 leading-[0.95]">
                                {t('hero.title1')} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-200">
                                    {t('hero.title2')}
                                </span>
                            </h1>

                            <p
                                className="text-lg text-slate-400 mb-12 leading-relaxed font-light max-w-lg border-l border-teal-500/30 pl-6"
                                dangerouslySetInnerHTML={{ __html: t('hero.desc') }}
                            />

                            <div className="flex flex-col sm:flex-row gap-0">
                                <Link href="/contacto">
                                    <Button size="lg" className="h-16 px-10 rounded-none bg-teal-600 text-white hover:bg-teal-500 text-sm font-bold uppercase tracking-widest transition-all hover:pr-12 group shadow-[0_0_30px_rgba(20,184,166,0.3)]">
                                        {t('hero.btn1')}
                                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="#roadmap">
                                    <Button variant="outline" size="lg" className="h-16 px-10 rounded-none border-l-0 border-slate-800 bg-transparent text-slate-300 hover:bg-slate-900 hover:text-white text-sm uppercase tracking-widest">
                                        {t('hero.btn2')}
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Abstract 3D Architecture Visualization (Enhanced) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotateY: 45 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className="relative hidden lg:block perspective-2000"
                        >
                            <div className="relative w-full aspect-square flex items-center justify-center p-12 transform-style-3d rotate-y-12 rotate-x-6">
                                {/* Rotating Rings */}
                                <motion.div
                                    animate={{ rotateZ: 360 }}
                                    transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border border-dashed border-slate-800 rounded-full opacity-50"
                                />
                                <motion.div
                                    animate={{ rotateZ: -360 }}
                                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-12 border border-dotted border-teal-900/50 rounded-full"
                                />

                                {/* Floating Cards Grid */}
                                <div className="grid grid-cols-2 gap-6 w-full h-full transform translate-z-20">
                                    <ExecutiveCard className="bg-black/90 flex flex-col items-center justify-center text-center p-8 border-slate-800 hover:border-teal-500/50 transition-colors shadow-2xl">
                                        <div className="mb-4 p-3 bg-slate-900/50 rounded-full"><Briefcase size={24} className="text-teal-500" /></div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-300">{t('hero.cards.c1')}</div>
                                        <div className="mt-2 h-0.5 w-6 bg-teal-500 mx-auto" />
                                    </ExecutiveCard>

                                    <ExecutiveCard className="bg-black/80 flex flex-col items-center justify-center text-center p-8 border-slate-800 mt-12 hover:border-teal-500/50 transition-colors shadow-2xl backdrop-blur-md">
                                        <div className="mb-4 p-3 bg-slate-900/50 rounded-full"><Database size={24} className="text-slate-500" /></div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('hero.cards.c2')}</div>
                                    </ExecutiveCard>

                                    <ExecutiveCard className="bg-black/80 flex flex-col items-center justify-center text-center p-8 border-slate-800 -mt-8 hover:border-teal-500/50 transition-colors shadow-2xl backdrop-blur-md">
                                        <div className="mb-4 p-3 bg-slate-900/50 rounded-full"><Network size={24} className="text-slate-500" /></div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('hero.cards.c3')}</div>
                                    </ExecutiveCard>

                                    <ExecutiveCard className="bg-white text-black flex flex-col items-center justify-center text-center p-8 border-white shadow-[0_0_60px_rgba(255,255,255,0.1)] transform scale-105 z-20 hover:scale-110 transition-transform">
                                        <div className="mb-4 p-3 bg-slate-100 rounded-full"><Crown size={24} className="text-black" /></div>
                                        <div className="text-xs font-bold uppercase tracking-wider">{t('hero.cards.c4')}</div>
                                    </ExecutiveCard>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* 2. THE TRANSFORMATION ROADMAP (Localized) */}
            <section id="roadmap" className="py-32 bg-black relative border-t border-slate-900 overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.05),transparent_50%)] pointer-events-none" />

                <div className="container mx-auto px-6 lg:px-8 max-w-5xl relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-24 border-b border-slate-900 pb-8">
                        <div>
                            <Badge variant="outline" className="mb-4 border-teal-900/50 bg-teal-950/10 text-teal-500 rounded-none px-3 py-1">
                                {t('roadmap.badge')}
                            </Badge>
                            <h2 className="text-4xl text-white font-bold tracking-tight">{t('roadmap.title')}</h2>
                        </div>
                        <p className="text-slate-500 max-w-sm text-right mt-6 md:mt-0 font-light text-sm">
                            {t('roadmap.desc')}
                        </p>
                    </div>

                    <div className="relative">
                        <TimelineNode
                            step={t('roadmap.phases.p01.step')}
                            title={t('roadmap.phases.p01.title')}
                            desc={t('roadmap.phases.p01.desc')}
                            icon={Search}
                            delay={0.2}
                        />
                        <TimelineNode
                            step={t('roadmap.phases.p02.step')}
                            title={t('roadmap.phases.p02.title')}
                            desc={t('roadmap.phases.p02.desc')}
                            icon={Map}
                            delay={0.4}
                        />
                        <TimelineNode
                            step={t('roadmap.phases.p03.step')}
                            title={t('roadmap.phases.p03.title')}
                            desc={t('roadmap.phases.p03.desc')}
                            icon={Rocket}
                            delay={0.6}
                        />
                        <TimelineNode
                            step={t('roadmap.phases.p04.step')}
                            title={t('roadmap.phases.p04.title')}
                            desc={t('roadmap.phases.p04.desc')}
                            icon={TrendingUp}
                            isLast={true}
                            delay={0.8}
                        />
                    </div>
                </div>
            </section>

            {/* 3. CORE STRATEGIC SERVICES (Localized) */}
            <section className="py-32 bg-black border-t border-slate-900 relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-900/50 to-transparent" />

                <div className="container mx-auto px-6 lg:px-8">
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">{t('services.title')}</h2>
                        <p className="text-slate-500">{t('services.desc')}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-0 border border-slate-900">
                        {/* Fractional CMO */}
                        <ExecutiveCard className="p-12 border-b md:border-b-0 md:border-r border-slate-900 hover:bg-slate-900/20 transition-colors group">
                            <div className="w-12 h-12 bg-black border border-slate-800 flex items-center justify-center mb-8 group-hover:border-teal-500 transition-colors">
                                <Briefcase size={20} className="text-slate-400 group-hover:text-teal-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">{t('services.cmo.title')}</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                                {t('services.cmo.desc')}
                            </p>
                            <ul className="space-y-4 border-t border-slate-900 pt-8">
                                <li className="text-sm text-slate-500 flex items-center gap-3 font-medium"><div className="w-1.5 h-1.5 bg-teal-500" /> {t('services.cmo.l1')}</li>
                                <li className="text-sm text-slate-500 flex items-center gap-3 font-medium"><div className="w-1.5 h-1.5 bg-teal-500" /> {t('services.cmo.l2')}</li>
                                <li className="text-sm text-slate-500 flex items-center gap-3 font-medium"><div className="w-1.5 h-1.5 bg-teal-500" /> {t('services.cmo.l3')}</li>
                            </ul>
                        </ExecutiveCard>

                        {/* Tech Stack Arch */}
                        <ExecutiveCard className="p-12 border-b md:border-b-0 md:border-r border-slate-900 hover:bg-slate-900/20 transition-colors group">
                            <div className="w-12 h-12 bg-black border border-slate-800 flex items-center justify-center mb-8 group-hover:border-blue-500 transition-colors">
                                <Database size={20} className="text-slate-400 group-hover:text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">{t('services.tech.title')}</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                                {t('services.tech.desc')}
                            </p>
                            <ul className="space-y-4 border-t border-slate-900 pt-8">
                                <li className="text-sm text-slate-500 flex items-center gap-3 font-medium"><div className="w-1.5 h-1.5 bg-blue-500" /> {t('services.tech.l1')}</li>
                                <li className="text-sm text-slate-500 flex items-center gap-3 font-medium"><div className="w-1.5 h-1.5 bg-blue-500" /> {t('services.tech.l2')}</li>
                                <li className="text-sm text-slate-500 flex items-center gap-3 font-medium"><div className="w-1.5 h-1.5 bg-blue-500" /> {t('services.tech.l3')}</li>
                            </ul>
                        </ExecutiveCard>

                        {/* Growth Consulting */}
                        <ExecutiveCard className="p-12 hover:bg-slate-900/20 transition-colors group">
                            <div className="w-12 h-12 bg-black border border-slate-800 flex items-center justify-center mb-8 group-hover:border-purple-500 transition-colors">
                                <LineChart size={20} className="text-slate-400 group-hover:text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">{t('services.growth.title')}</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                                {t('services.growth.desc')}
                            </p>
                            <ul className="space-y-4 border-t border-slate-900 pt-8">
                                <li className="text-sm text-slate-500 flex items-center gap-3 font-medium"><div className="w-1.5 h-1.5 bg-purple-500" /> {t('services.growth.l1')}</li>
                                <li className="text-sm text-slate-500 flex items-center gap-3 font-medium"><div className="w-1.5 h-1.5 bg-purple-500" /> {t('services.growth.l2')}</li>
                                <li className="text-sm text-slate-500 flex items-center gap-3 font-medium"><div className="w-1.5 h-1.5 bg-purple-500" /> {t('services.growth.l3')}</li>
                            </ul>
                        </ExecutiveCard>
                    </div>
                </div>
            </section>

            {/* 4. BI & ANALYTICS INTEGRATION MARQUEE */}
            <section className="py-24 bg-black border-y border-slate-900 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black to-transparent z-10" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent z-10" />

                <div className="container mx-auto px-6 lg:px-8 relative z-20 text-center mb-16">
                    <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.3em] mb-4">{t('stack.badge')}</p>
                    <h2 className="text-2xl font-bold text-white">{t('stack.title')}</h2>
                </div>

                <div className="relative flex overflow-x-hidden group z-0">
                    <div className="animate-marquee flex gap-20 items-center whitespace-nowrap py-6 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                        {[
                            "Tableau", "PowerBI", "Snowflake", "Segment", "Salesforce", "Oracle", "AWS", "Google Cloud", "Looker"
                        ].map((tech, i) => (
                            <span key={i} className="text-2xl font-bold text-slate-500 mx-4 font-mono tracking-widest">{tech}</span>
                        ))}
                        {[
                            "Tableau", "PowerBI", "Snowflake", "Segment", "Salesforce", "Oracle", "AWS", "Google Cloud", "Looker"
                        ].map((tech, i) => (
                            <span key={`dup-${i}`} className="text-2xl font-bold text-slate-500 mx-4 font-mono tracking-widest">{tech}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. PRICING: CONSULTING TIERS (Localized) */}
            <section className="py-32 bg-black">
                <div className="container mx-auto px-6 lg:px-8">
                    <div className="text-center mb-24">
                        <Badge variant="outline" className="mb-4 border-slate-800 bg-slate-900/50 text-slate-400 rounded-none px-3 py-1">
                            {t('pricing.badge')}
                        </Badge>
                        <h2 className="text-4xl text-white font-bold">{t('pricing.title')}</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                        {/* Advisory */}
                        <div className="bg-black p-12 border border-slate-800 flex flex-col hover:border-slate-600 transition-colors transform hover:-translate-y-1 duration-300">
                            <div className="mb-6"><BrainCircuit size={32} className="text-slate-500" /></div>
                            <h3 className="text-2xl font-bold text-white mb-2">{t('pricing.t1.title')}</h3>
                            <div className="text-4xl font-bold text-slate-200 mb-6 font-mono tracking-tight">{t('pricing.t1.price')} <span className="text-sm font-normal text-slate-500 font-sans">{t('pricing.t1.unit')}</span></div>
                            <p className="text-slate-400 text-sm mb-10 leading-relaxed max-w-xs">
                                {t('pricing.t1.desc')}
                            </p>

                            <ul className="space-y-4 mb-10 flex-1">
                                {[t('pricing.t1.f1'), t('pricing.t1.f2'), t('pricing.t1.f3'), t('pricing.t1.f4')].map((f, i) => (
                                    <li key={i} className="flex gap-4 text-sm text-slate-300 items-start">
                                        <div className="w-1.5 h-1.5 bg-white mt-1.5 flex-shrink-0" />
                                        <span className="leading-tight">{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-white hover:text-black rounded-none h-14 uppercase tracking-widest font-bold transition-all">{t('pricing.t1.btn')}</Button>
                        </div>

                        {/* Fractional Executive - Feature */}
                        <div className="bg-white p-12 border border-white flex flex-col relative overflow-hidden group shadow-[0_0_80px_rgba(255,255,255,0.1)] transform scale-105">
                            <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold px-4 py-2 uppercase tracking-widest">{t('pricing.t2.badge')}</div>
                            <div className="mb-6"><Crown size={32} className="text-black" /></div>
                            <h3 className="text-2xl font-bold text-black mb-2">{t('pricing.t2.title')}</h3>
                            <div className="text-4xl font-bold text-black mb-6 font-mono tracking-tight">{t('pricing.t2.price')} <span className="text-sm font-normal text-slate-500 font-sans">{t('pricing.t2.unit')}</span></div>
                            <p className="text-slate-600 text-sm mb-10 leading-relaxed max-w-xs">
                                {t('pricing.t2.desc')}
                            </p>

                            <ul className="space-y-4 mb-10 flex-1">
                                {[t('pricing.t2.f1'), t('pricing.t2.f2'), t('pricing.t2.f3'), t('pricing.t2.f4')].map((f, i) => (
                                    <li key={i} className="flex gap-4 text-sm text-black font-medium items-start">
                                        <div className="w-1.5 h-1.5 bg-black mt-1.5 flex-shrink-0" />
                                        <span className="leading-tight">{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button className="w-full bg-black hover:bg-slate-800 text-white rounded-none h-14 uppercase tracking-widest font-bold transition-all">{t('pricing.t2.btn')}</Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. CTA - FINAL (Localized) */}
            <section className="py-40 bg-black border-t border-slate-900 relative overflow-hidden">
                <div className="container mx-auto px-6 lg:px-8 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-7xl font-bold text-white mb-8 tracking-tighter">
                            {t('cta.title1')} <br />
                            {t('cta.title2')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-white">{t('cta.title2Span')}</span>
                        </h2>
                        <p className="text-xl text-slate-500 mb-16 max-w-2xl mx-auto font-light leading-relaxed">
                            {t('cta.desc1')} <br />
                            {t('cta.desc2')}
                        </p>

                        <Link href="/contacto">
                            <Button size="lg" className="h-24 px-16 rounded-none bg-white text-black hover:bg-slate-200 text-xl font-bold uppercase tracking-[0.2em] hover:scale-105 transition-all duration-300 border-2 border-white hover:border-slate-300 shadow-[0_0_60px_rgba(255,255,255,0.2)]">
                                {t('cta.btn')}
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
