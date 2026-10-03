"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
    ArrowRight, Bot, BarChart3,
    Server, Shield,
    Workflow, MessageSquare, LineChart, Terminal, Database, Code2
} from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useTranslations } from "next-intl";

// Animation Variants
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
};

export default function AutomationPage() {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
    const t = useTranslations("automatizacionPage");

    return (
        <main className="bg-slate-50 selection:bg-teal-500 selection:text-white overflow-hidden">

            {/* 1. HERO SECTION: "The Quantum Leap" */}
            <section ref={targetRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-white">
                {/* 1. Dynamic Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                {/* 2. Ambient Light Orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-teal-200/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.4, 0.2],
                        x: [0, 50, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply"
                />

                <motion.div style={{ opacity, scale }} className="container relative z-10 mx-auto px-6 lg:px-8 text-center">

                    {/* 3. Glassmorphic Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/50 backdrop-blur-md shadow-sm hover:shadow-md transition-all cursor-default mb-8"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                        <span className="text-slate-600 text-xs font-mono font-medium uppercase tracking-widest">{t('hero.badge')}</span>
                    </motion.div>

                    {/* 4. Gradient Text & Typography */}
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="text-5xl lg:text-8xl font-bold tracking-tighter text-slate-900 mb-8 max-w-5xl mx-auto leading-[1.1]"
                    >
                        {t('hero.title1')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-indigo-500 to-teal-500 animate-gradient-x bg-[length:200%_auto]">
                            {t('hero.title2')}
                        </span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="text-xl lg:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
                    >
                        <p dangerouslySetInnerHTML={{ __html: t('hero.desc1') }} />
                        <p>{t('hero.desc2')}</p>
                    </motion.div>

                    {/* 5. Magnetic Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex flex-col sm:flex-row justify-center gap-6"
                    >
                        <Link href="/contacto">
                            <Button size="lg" className="h-16 px-10 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-lg shadow-[0_20px_50px_-12px_rgba(15,23,42,0.5)] hover:shadow-[0_20px_50px_-12px_rgba(15,23,42,0.8)] transition-all hover:scale-105 active:scale-95 group relative overflow-hidden">
                                <span className="relative z-10 flex items-center">
                                    {t('hero.btn1')} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                                {/* Button Shine Effect */}
                                <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-300 group-hover:scale-100 group-hover:bg-slate-800/50" />
                            </Button>
                        </Link>
                        <Link href="#agents">
                            <Button variant="outline" size="lg" className="h-16 px-10 rounded-full border-slate-200 bg-white/80 backdrop-blur text-slate-700 hover:bg-slate-50 hover:border-teal-200 text-lg hover:shadow-lg transition-all hover:-translate-y-1">
                                <Bot className="mr-2 h-5 w-5 text-teal-500" />
                                {t('hero.btn2')}
                            </Button>
                        </Link>
                    </motion.div>

                    {/* 6. Scrolling Logos / Social Proof */}
                    <div className="mt-24 pt-10 border-t border-slate-200/60 max-w-4xl mx-auto">
                        <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-6">{t('hero.trusted')}</p>
                        <div className="flex justify-between items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                            {/* Use Lucide icons as abstract logo placeholders for robustness */}
                            <div className="flex items-center gap-2 group cursor-pointer"><Server className="h-6 w-6 group-hover:text-teal-600 transition-colors" /><span className="font-bold text-lg group-hover:text-slate-900">NexusCore</span></div>
                            <div className="flex items-center gap-2 group cursor-pointer"><Database className="h-6 w-6 group-hover:text-indigo-600 transition-colors" /><span className="font-bold text-lg group-hover:text-slate-900">DataFlow</span></div>
                            <div className="flex items-center gap-2 group cursor-pointer"><Shield className="h-6 w-6 group-hover:text-blue-600 transition-colors" /><span className="font-bold text-lg group-hover:text-slate-900">SecureScale</span></div>
                            <div className="flex items-center gap-2 group cursor-pointer"><Code2 className="h-6 w-6 group-hover:text-purple-600 transition-colors" /><span className="font-bold text-lg group-hover:text-slate-900">DevOps.io</span></div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* 7. PROBLEM: "Efficiency Black Hole" - Hover Perspective Cards */}
            <section className="py-32 bg-slate-50 relative overflow-hidden">
                <div className="container mx-auto px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                        >
                            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                                {t('problem.title1')} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                                    {t('problem.title2')}
                                </span>
                            </h2>
                            <div className="text-lg text-slate-600 mb-10 leading-relaxed border-l-4 border-red-200 pl-6 space-y-2">
                                <p dangerouslySetInnerHTML={{ __html: t('problem.desc1') }} />
                                <p>{t('problem.desc2')}</p>
                            </div>
                            <ul className="space-y-6">
                                {[
                                    { icon: Workflow, text: t('problem.list1'), color: "text-red-500" },
                                    { icon: Shield, text: t('problem.list2'), color: "text-orange-500" },
                                    { icon: BarChart3, text: t('problem.list3'), color: "text-amber-500" },
                                ].map((item, idx) => (
                                    <motion.li
                                        key={idx}
                                        whileHover={{ x: 10 }}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-crosshair"
                                    >
                                        <div className={`p-2 rounded-lg bg-slate-50 ${item.color}`}>
                                            <item.icon size={20} />
                                        </div>
                                        <span className="text-slate-700 font-medium">{item.text}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* 8. 3D Hover Effect Visualization */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 100 }}
                            className="relative group perspective-1000"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-indigo-500/20 blur-3xl rounded-full -z-10 group-hover:blur-2xl transition-all duration-500" />

                            {/* Card Container with Tilt Effect (Simulated via CSS/Motion) */}
                            <motion.div
                                whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-10 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-100 to-transparent rounded-bl-[100px] opacity-50" />

                                <div className="grid grid-cols-2 gap-8 relative z-10">
                                    {/* Manual State */}
                                    <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-red-200 transition-colors">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('problem.comparison.manual')}</div>
                                        <div className="text-5xl font-bold text-slate-300 mb-2 group-hover:text-red-400 transition-colors">{t('problem.comparison.manualTime')}</div>
                                        <div className="text-sm text-slate-500">{t('problem.comparison.timeLabel')}</div>
                                        <div className="mt-4 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full w-full bg-red-400/50" />
                                        </div>
                                    </div>

                                    {/* AI State */}
                                    <div className="text-center p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent" />
                                        <div className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-4 relative z-10">{t('problem.comparison.ai')}</div>
                                        <div className="text-5xl font-bold text-white mb-2 relative z-10">{t('problem.comparison.aiTime')}</div>
                                        <div className="text-sm text-slate-400 relative z-10">{t('problem.comparison.timeLabel')}</div>
                                        <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden relative z-10">
                                            <div className="h-full w-[1%] bg-teal-400 animate-[loading_2s_ease-in-out_infinite]" />
                                        </div>
                                        {/* Particle Effect */}
                                        <div className="absolute bottom-0 right-0 w-20 h-20 bg-teal-500/20 blur-xl rounded-full animate-pulse" />
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                                    <div className="text-sm font-medium text-slate-500">{t('problem.comparison.efficiency')}</div>
                                    <div className="text-2xl font-bold text-teal-600">+9,900%</div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 9. AGENTS CATALOG - Spotlight Cards */}
            <section id="agents" className="py-32 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="container mx-auto px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="text-center max-w-3xl mx-auto mb-20"
                    >
                        <Badge variant="outline" className="mb-6 border-teal-500/30 bg-teal-500/10 text-teal-300">
                            {t('agents.badge')}
                        </Badge>
                        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                            {t('agents.title')}
                        </h2>
                        <p className="text-lg text-slate-400">
                            {t('agents.desc')}
                        </p>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-3 gap-8"
                    >
                        {[
                            {
                                id: "Sales_V1",
                                role: t('agents.list.a1.role'),
                                icon: MessageSquare,
                                color: "indigo",
                                desc: t('agents.list.a1.desc'),
                                stats: { label: t('agents.list.a1.statsLabel'), val: "< 1s" }
                            },
                            {
                                id: "Ops_Core",
                                role: t('agents.list.a2.role'),
                                icon: Workflow,
                                color: "teal",
                                desc: t('agents.list.a2.desc'),
                                stats: { label: t('agents.list.a2.statsLabel'), val: "99.99%" }
                            },
                            {
                                id: "Analyst_Pro",
                                role: t('agents.list.a3.role'),
                                icon: LineChart,
                                color: "amber",
                                desc: t('agents.list.a3.desc'),
                                stats: { label: t('agents.list.a3.statsLabel'), val: "98.5%" }
                            }
                        ].map((agent, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeIn}
                                whileHover={{ y: -10 }}
                                className="group relative bg-slate-800/50 rounded-3xl p-8 border border-white/5 backdrop-blur-md overflow-hidden hover:border-white/10 transition-all duration-300"
                            >
                                {/* 10. Card Spotlight Effect */}
                                <div className={`absolute inset-0 bg-gradient-to-br from-${agent.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-${agent.color}-500/10 blur-[50px] rounded-full group-hover:bg-${agent.color}-500/20 transition-all`} />

                                <div className="relative z-10">
                                    <div className={`w-16 h-16 rounded-2xl bg-${agent.color}-500/10 flex items-center justify-center text-${agent.color}-400 mb-8 group-hover:bg-${agent.color}-500/20 group-hover:scale-110 transition-all duration-300`}>
                                        <agent.icon size={32} />
                                    </div>

                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-2xl font-bold text-white">{agent.id}</h3>
                                        <div className={`h-2 w-2 rounded-full bg-${agent.color}-400 animate-pulse`} />
                                    </div>
                                    <p className="text-xs font-mono text-slate-400 mb-6 uppercase tracking-wider">{agent.role}</p>

                                    <p className="text-slate-300 mb-8 leading-relaxed text-sm">
                                        {agent.desc}
                                    </p>

                                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                        <div className="text-xs font-mono text-slate-500">{agent.stats.label}</div>
                                        <div className={`text-xl font-bold text-${agent.color}-400 font-mono`}>{agent.stats.val}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 11. TECH STACK - Marquee / Grid */}
            <section className="py-24 bg-white border-b border-slate-100">
                <div className="container mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-2xl font-bold text-slate-900">{t('stack.title')}</h2>
                    </div>
                    <div className="flex flex-wrap justify-center gap-12 lg:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
                        {[
                            { name: "Python", icon: Terminal, color: "text-yellow-500" },
                            { name: "PostgreSQL", icon: Database, color: "text-blue-500" },
                            { name: "OpenAI", icon: Bot, color: "text-green-500" },
                            { name: "Docker", icon: Server, color: "text-blue-400" },
                            { name: "Security", icon: Shield, color: "text-red-500" },
                        ].map((tech, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.1, opacity: 1 }}
                                className="flex flex-col items-center gap-3 cursor-pointer group"
                            >
                                <tech.icon size={48} className={`text-slate-300 group-hover:${tech.color} transition-colors duration-300`} />
                                <span className="font-mono text-sm font-semibold text-slate-400 group-hover:text-slate-800">{tech.name}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 12. ROI CALCULATOR - Animated Graph */}
            <section className="py-32 bg-slate-50">
                <div className="container mx-auto px-6 lg:px-8">
                    <div className="bg-white rounded-[3rem] p-10 lg:p-20 shadow-2xl border border-slate-100 flex flex-col lg:flex-row gap-20 items-center relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-50/50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="flex-1 relative z-10">
                            <Badge variant="outline" className="mb-8 border-indigo-100 bg-indigo-50 text-indigo-600 px-4 py-1 text-sm">
                                <BarChart3 className="w-3 h-3 mr-2" />
                                {t('roi.badge')}
                            </Badge>
                            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-8 leading-tight">
                                {t('roi.title1')} <br />
                                <span className="text-teal-600">{t('roi.title2')}</span>
                            </h2>
                            <p className="text-lg text-slate-600 mb-12 leading-relaxed">
                                {t('roi.desc')}
                            </p>

                            <div className="grid grid-cols-2 gap-10">
                                <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="text-5xl font-bold text-slate-900 mb-2 tracking-tight">{t('roi.stats.s1Val')}</div>
                                    <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">{t('roi.stats.s1Label')}</div>
                                </motion.div>
                                <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-teal-50 border border-teal-100">
                                    <div className="text-5xl font-bold text-teal-600 mb-2 tracking-tight">{t('roi.stats.s2Val')}</div>
                                    <div className="text-sm font-medium text-teal-700 uppercase tracking-widest">{t('roi.stats.s2Label')}</div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Animated Bar Chart Visualization */}
                        <div className="flex-1 w-full relative h-[400px] flex items-end justify-center gap-8 pl-10 border-l lg:border-l-2 border-dashed border-slate-200">
                            <div className="flex flex-col items-center gap-4 w-32 group">
                                <motion.div
                                    initial={{ height: 0 }}
                                    whileInView={{ height: "40%" }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                    className="w-full bg-slate-200 rounded-t-2xl relative overflow-hidden"
                                >
                                    <div className="absolute top-4 w-full text-center font-bold text-slate-500">{t('roi.graph.before')}</div>
                                </motion.div>
                                <span className="text-sm font-mono text-slate-400">{t('roi.graph.manual')}</span>
                            </div>

                            <div className="flex flex-col items-center gap-4 w-32 group">
                                <motion.div
                                    initial={{ height: 0 }}
                                    whileInView={{ height: "100%" }}
                                    transition={{ type: "spring", stiffness: 50, delay: 0.4 }}
                                    className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-2xl relative shadow-2xl shadow-teal-500/30 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 mix-blend-overlay" />
                                    <div className="absolute top-6 w-full text-center font-bold text-white text-2xl">$$$</div>
                                </motion.div>
                                <span className="text-sm font-bold text-teal-600 uppercase tracking-widest">LegacyMark</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 13. FAQ - Clean Accordion */}
            <section className="py-24 bg-white relative">
                <div className="container mx-auto px-6 lg:px-8 max-w-3xl">
                    <h2 className="text-3xl font-bold text-slate-900 text-center mb-16">
                        {t('faq.title')}
                    </h2>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {[
                            { q: t('faq.q1'), a: t('faq.a1') },
                            { q: t('faq.q2'), a: t('faq.a2') },
                            { q: t('faq.q3'), a: t('faq.a3') }
                        ].map((faq, i) => (
                            <AccordionItem key={i} value={`item-${i}`} className="border border-slate-100 rounded-xl px-4 bg-slate-50/50 data-[state=open]:bg-white data-[state=open]:shadow-md transition-all duration-300">
                                <AccordionTrigger className="text-lg font-medium text-slate-800 hover:no-underline py-6">{faq.q}</AccordionTrigger>
                                <AccordionContent className="text-slate-600 text-base leading-relaxed pb-6">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            {/* 14. FINAL CTA - "System Ready" Terminal Style */}
            <section className="py-32 bg-slate-950 border-t border-slate-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-900/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="container mx-auto px-6 lg:px-8 text-center relative z-10">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-950/50 text-teal-400 text-xs font-mono mb-8 backdrop-blur-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                        {t('cta.badge')}
                    </motion.div>

                    <h2 className="text-5xl lg:text-7xl font-bold text-white mb-8 tracking-tight max-w-4xl mx-auto">
                        {t('cta.title1')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">
                            {t('cta.title2')}
                        </span>
                    </h2>

                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light">
                        {t('cta.desc')}
                    </p>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col sm:flex-row justify-center gap-4"
                    >
                        <Link href="/contacto">
                            <Button size="lg" className="h-20 px-12 rounded-full bg-teal-500 text-white hover:bg-teal-400 text-xl font-bold shadow-[0_0_40px_-10px_rgba(20,184,166,0.5)] transition-all">
                                {t('cta.btn')}
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
