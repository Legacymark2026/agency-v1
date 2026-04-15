"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
    ArrowRight, Zap,
    Smartphone, CheckCircle2, XCircle, Rocket, Terminal, Sparkles, Search
} from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate, Variants } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

// --- Animation Variants & Utilities ---
const fadeIn: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};



function PerspectiveCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={`group relative border border-slate-800 bg-slate-900/50 overflow-hidden ${className}`}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            650px circle at ${mouseX}px ${mouseY}px,
                            rgba(20, 184, 166, 0.15),
                            transparent 80%
                        )
                    `,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    );
}

const TypingEffect = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.slice(0, i));
            i++;
            if (i > text.length) clearInterval(interval);
        }, 30);
        return () => clearInterval(interval);
    }, [text]);

    return <span>{displayedText}<span className="animate-pulse">|</span></span>;
};

export default function WebDevPage() {
    const t = useTranslations('webDevPage');
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll();

    // Parallax & Scale Transforms
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    return (
        <main className="bg-slate-950 selection:bg-teal-500 selection:text-white overflow-hidden text-white w-full">

            {/* 1. PROGRESS BAR */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 origin-left z-50"
                style={{ scaleX: scrollYProgress }}
            />

            {/* 2. HERO SECTION: "Speed is Currency" */}
            <section ref={targetRef} className="relative min-h-screen flex items-center justify-center pt-24 pb-20 overflow-hidden bg-slate-950">
                {/* 3. Neural Network Background Effect */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

                {/* 4. Animated Blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.15, 0.3, 0.15],
                            rotate: [0, 45, 0]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-[10%] -left-[10%] w-[40vw] h-[40vw] bg-purple-700/20 rounded-full blur-[120px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.15, 0.25, 0.15],
                            x: [0, 100, 0]
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[20%] -right-[10%] w-[35vw] h-[35vw] bg-teal-600/20 rounded-full blur-[100px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.1, 0.2, 0.1],
                            y: [0, -50, 0]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] bg-blue-800/20 rounded-full blur-[130px]"
                    />
                </div>

                <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="container relative z-10 mx-auto px-6 lg:px-8 text-center max-w-6xl">

                    {/* 5. Floating Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, type: "spring" }}
                        className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-slate-700 bg-slate-900/60 backdrop-blur-xl shadow-[0_0_20px_rgba(20,184,166,0.15)] hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(20,184,166,0.3)] transition-all cursor-default mb-10 group"
                    >
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                        </span>
                        <span className="text-slate-300 text-xs font-mono font-semibold uppercase tracking-[0.2em] group-hover:text-white transition-colors">
                            {t('hero.badge')}
                        </span>
                    </motion.div>

                    {/* 6. Hero Typography with Staggered Reveal */}
                    <motion.h1
                        className="text-6xl md:text-7xl lg:text-9xl font-bold tracking-tighter text-white mb-8 leading-[0.9]"
                    >
                        <motion.span
                            initial={{ opacity: 0, y: 50, rotateX: -45 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="block"
                        >
                            {t('hero.title1')}
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, y: 50, rotateX: -45 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            className="block text-slate-500"
                        >
                            {t('hero.title2')}
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
                            className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 animate-gradient-x bg-[length:200%_auto]"
                        >
                            {t('hero.title3')}
                        </motion.span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
                    >
                        {t('hero.desc1')}<span className="text-white font-medium border-b border-teal-500/50 pb-0.5">{t('hero.desc2')}</span>{t('hero.desc3')}
                    </motion.p>

                    {/* 7. Advanced Button Group */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="flex flex-col sm:flex-row justify-center gap-6"
                    >
                        <Link href="/contacto">
                            <div className="relative group rounded-full p-[1px] bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500 shadow-[0_0_40px_-10px_rgba(20,184,166,0.4)] hover:shadow-[0_0_60px_-10px_rgba(20,184,166,0.6)] transition-all duration-300">
                                <Button size="lg" className="h-16 px-10 rounded-full bg-slate-950 text-white relative overflow-hidden transition-all group-hover:bg-slate-900">
                                    <span className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <span className="relative z-10 flex items-center text-lg font-bold tracking-wide">
                                        {t('hero.btn1')} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Button>
                            </div>
                        </Link>
                        <Link href="#portfolio">
                            <Button variant="ghost" size="lg" className="h-16 px-10 rounded-full text-slate-400 hover:text-white hover:bg-white/5 text-lg transition-all border border-transparent hover:border-slate-800">
                                <Sparkles className="mr-2 h-5 w-5 text-purple-400" />
                                {t('hero.btn2')}
                            </Button>
                        </Link>
                    </motion.div>

                    {/* 8. Interactive Code Terminal */}
                    <motion.div
                        initial={{ opacity: 0, y: 60, rotateX: 20 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 1, delay: 1, type: "spring", stiffness: 40 }}
                        className="mt-24 mx-auto max-w-4xl relative group perspective-1000"
                    >
                        {/* Glow Behind */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                        <div className="relative rounded-xl bg-[#0d1117] border border-slate-800 shadow-2xl overflow-hidden transform-gpu transition-transform duration-500 group-hover:scale-[1.01]">
                            {/* Window Controls */}
                            <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-slate-800">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#fa7970]" />
                                    <div className="w-3 h-3 rounded-full bg-[#faa356]" />
                                    <div className="w-3 h-3 rounded-full bg-[#7ce38b]" />
                                </div>
                                <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                                    <Terminal size={12} />
                                    {t('hero.term.title')}
                                </div>
                                <div className="w-10" />
                            </div>

                            {/* Code Content */}
                            <div className="p-6 text-left font-mono text-sm leading-relaxed overflow-x-auto">
                                <div className="flex gap-4">
                                    <div className="flex flex-col text-slate-600 select-none text-right border-r border-slate-800 pr-4">
                                        <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                                    </div>
                                    <div className="text-slate-300">
                                        <div className="w-full">
                                            <span className="text-purple-400">const</span> <span className="text-blue-400">AppConfig</span> = {'{'}
                                        </div>
                                        <div className="pl-6 w-full">
                                            <span className="text-slate-50">{t('hero.term.c1')}</span><br />
                                            {t('hero.term.c2')} <span className="text-green-400">{t('hero.term.c2v')}</span>,<br />
                                            {t('hero.term.c3')} <span className="text-yellow-400 mb-1 inline-block"><TypingEffect text={t('hero.term.c3v')} /></span>,<br />
                                            {t('hero.term.c4')} <span className="text-blue-400">{t('hero.term.c4v')}</span>
                                        </div>
                                        <div>{'}'};</div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Bar */}
                            <div className="bg-teal-900/20 text-teal-400 text-xs px-4 py-1 flex justify-between items-center border-t border-teal-900/30">
                                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" /> {t('hero.term.status')}</span>
                                <span>UTF-8</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* 9. DUAL MARQUEE SECTION */}
            <section className="py-24 bg-slate-950 border-y border-slate-900 relative">
                <div className="container mx-auto px-6 lg:px-8 relative z-10 text-center mb-16">
                    <p className="text-sm font-bold text-teal-500 uppercase tracking-widest mb-3">{t('marquee.tag')}</p>
                    <h2 className="text-3xl md:text-5xl font-bold text-white">{t('marquee.title')}</h2>
                </div>

                {/* Marquee 1 (Left) */}
                <div className="relative flex overflow-x-hidden group mb-8">
                    <div className="animate-marquee flex gap-16 items-center whitespace-nowrap py-4">
                        {[
                            "Next.js 14", "React Server Components", "TypeScript", "TailwindCSS", "Framer Motion", "Vercel Edge", "PostgreSQL"
                        ].map((tech, i) => (
                            <span key={i} className="text-3xl md:text-5xl font-bold text-slate-800 mx-4 font-mono hover:text-white transition-colors cursor-crosshair stroke-text">{tech}</span>
                        ))}
                        {[
                            "Next.js 14", "React Server Components", "TypeScript", "TailwindCSS", "Framer Motion", "Vercel Edge", "PostgreSQL"
                        ].map((tech, i) => (
                            <span key={`dup-${i}`} className="text-3xl md:text-5xl font-bold text-slate-800 mx-4 font-mono hover:text-white transition-colors cursor-crosshair stroke-text">{tech}</span>
                        ))}
                    </div>
                </div>

                {/* Marquee 2 (Right) */}
                <div className="relative flex overflow-x-hidden group">
                    <div className="animate-marquee-reverse flex gap-16 items-center whitespace-nowrap py-4">
                        {[
                            "Prisma ORM", "Stripe Connect", "Auth.js", "Radix UI", "Zustand", "Docker", "Kubernetes", "Redis"
                        ].map((tech, i) => (
                            <span key={i} className="text-3xl md:text-5xl font-bold text-slate-800 mx-4 font-mono hover:text-teal-500 transition-colors cursor-crosshair stroke-text">{tech}</span>
                        ))}
                        {[
                            "Prisma ORM", "Stripe Connect", "Auth.js", "Radix UI", "Zustand", "Docker", "Kubernetes", "Redis"
                        ].map((tech, i) => (
                            <span key={`dup-${i}`} className="text-3xl md:text-5xl font-bold text-slate-800 mx-4 font-mono hover:text-teal-500 transition-colors cursor-crosshair stroke-text">{tech}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* 10. LIGHTHOUSE PERFORMANCE SECTION */}
            <section className="py-32 bg-slate-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="container mx-auto px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                        >
                            <Badge variant="outline" className="mb-6 border-green-500/30 bg-green-900/20 text-green-400 px-3 py-1">
                                <Zap size={14} className="mr-2" /> {t('performance.tag')}
                            </Badge>
                            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                                {t('performance.title1')} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">
                                    {t('performance.title2')}
                                </span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-10 leading-relaxed border-l-2 border-slate-700 pl-6">
                                {t('performance.desc')}
                            </p>

                            <ul className="space-y-8">
                                {[
                                    { icon: Rocket, title: t('performance.features.f1Title'), desc: t('performance.features.f1Desc'), color: "text-purple-400" },
                                    { icon: Smartphone, title: t('performance.features.f2Title'), desc: t('performance.features.f2Desc'), color: "text-blue-400" },
                                    { icon: Search, title: t('performance.features.f3Title'), desc: t('performance.features.f3Desc'), color: "text-yellow-400" },
                                ].map((item, idx) => (
                                    <motion.li
                                        key={idx}
                                        whileHover={{ x: 10 }}
                                        className="flex gap-6 group cursor-default"
                                    >
                                        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center ${item.color} border border-slate-700 group-hover:border-slate-500 transition-colors`}>
                                            <item.icon size={26} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">{item.title}</h4>
                                            <p className="text-slate-400">{item.desc}</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Interactive Lighthouse Card */}
                        <div className="relative group perspective-1000">
                            {/* Background Elements */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-[3rem] transform rotate-3 scale-105 opacity-50 blur-xl group-hover:rotate-6 transition-transform duration-700" />

                            <PerspectiveCard className="rounded-[2.5rem] p-10 bg-slate-950 border-slate-800 shadow-2xl">
                                <div className="grid grid-cols-2 gap-6">
                                    {[
                                        { label: "Performance", score: 100 },
                                        { label: "Accessibility", score: 100 },
                                        { label: "Best Practices", score: 100 },
                                        { label: "SEO", score: 100 },
                                    ].map((metric, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-slate-900/50 rounded-2xl p-6 text-center border border-slate-800 flex flex-col items-center justify-center gap-4 hover:bg-slate-800/80 hover:border-green-500/50 transition-all duration-300 group/circle"
                                        >
                                            <div className="relative w-24 h-24 flex items-center justify-center">
                                                {/* Background Circle */}
                                                <svg className="w-full h-full -rotate-90 transform origin-center" viewBox="0 0 36 36">
                                                    <path
                                                        className="text-slate-800"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                    />
                                                    {/* Animated Progress Circle */}
                                                    <motion.path
                                                        initial={{ pathLength: 0 }}
                                                        whileInView={{ pathLength: 1 }}
                                                        transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                                                        className="text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <span className="absolute text-3xl font-bold text-white font-mono group-hover/circle:scale-110 transition-transform">{metric.score}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-400 tracking-wide uppercase group-hover/circle:text-white transition-colors">{metric.label}</span>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 font-mono">
                                    <span>{t('performance.report')}</span>
                                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> {t('performance.status')}</span>
                                </div>
                            </PerspectiveCard>
                        </div>
                    </div>
                </div>
            </section>

            {/* 11. COMPARISON: "The Ugly Truth" */}
            <section className="py-32 bg-slate-950 relative">
                <div className="container mx-auto px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">{t('comparison.title')}</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            {t('comparison.desc')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto relative">
                        {/* VS Badge */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-900 rounded-full border border-slate-700 flex items-center justify-center z-20 shadow-xl hidden md:flex">
                            <span className="font-bold text-white text-xl italic">VS</span>
                        </div>

                        {/* "Other Agencies" Card */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-b from-red-950/20 to-slate-900/50 p-10 rounded-[2rem] border border-red-900/30 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                            <h3 className="text-3xl font-bold text-red-100/80 mb-8 flex items-center gap-3">
                                <XCircle className="text-red-500" />
                                {t('comparison.bad.title')}
                            </h3>
                            <ul className="space-y-6 text-slate-400 font-medium">
                                <li className="flex gap-4 items-center">
                                    <XCircle size={20} className="text-red-500/50" />
                                    <span>{t('comparison.bad.items.0')}</span>
                                </li>
                                <li className="flex gap-4 items-center">
                                    <XCircle size={20} className="text-red-500/50" />
                                    <span>{t('comparison.bad.items.1')}</span>
                                </li>
                                <li className="flex gap-4 items-center">
                                    <XCircle size={20} className="text-red-500/50" />
                                    <span>{t('comparison.bad.items.2')}</span>
                                </li>
                                <li className="flex gap-4 items-center">
                                    <XCircle size={20} className="text-red-500/50" />
                                    <span>{t('comparison.bad.items.3')}</span>
                                </li>
                            </ul>
                        </motion.div>

                        {/* "LegacyMark" Card */}
                        <PerspectiveCard className="p-10 rounded-[2rem] border-teal-500/30 shadow-[0_0_60px_-15px_rgba(20,184,166,0.2)]">
                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                <CheckCircle2 size={100} className="text-teal-900/30" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
                                <CheckCircle2 className="text-teal-400" />
                                {t('comparison.good.title')}
                            </h3>
                            <ul className="space-y-6 text-slate-200 font-medium relative z-10">
                                <li className="flex gap-4 items-center">
                                    <div className="bg-teal-500/20 p-1 rounded-full"><CheckCircle2 size={16} className="text-teal-400" /></div>
                                    <span>{t('comparison.good.items.0')}</span>
                                </li>
                                <li className="flex gap-4 items-center">
                                    <div className="bg-teal-500/20 p-1 rounded-full"><CheckCircle2 size={16} className="text-teal-400" /></div>
                                    <span>{t('comparison.good.items.1')}</span>
                                </li>
                                <li className="flex gap-4 items-center">
                                    <div className="bg-teal-500/20 p-1 rounded-full"><CheckCircle2 size={16} className="text-teal-400" /></div>
                                    <span>{t('comparison.good.items.2')}</span>
                                </li>
                                <li className="flex gap-4 items-center">
                                    <div className="bg-teal-500/20 p-1 rounded-full"><CheckCircle2 size={16} className="text-teal-400" /></div>
                                    <span>{t('comparison.good.items.3')}</span>
                                </li>
                            </ul>
                        </PerspectiveCard>
                    </div>
                </div>
            </section>

            {/* 12. PRICING TIERS - Glassmorphism */}
            <section className="py-32 bg-slate-900 relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.8))]" />
                <div className="container mx-auto px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-24">
                        <Badge variant="outline" className="mb-4 border-purple-500/30 bg-purple-500/10 text-purple-300">
                            {t('pricing.tag')}
                        </Badge>
                        <h2 className="text-4xl text-white font-bold">{t('pricing.title')}</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-start">
                        {/* Startup */}
                        <motion.div whileHover={{ y: -10 }} className="bg-slate-950/80 p-8 rounded-3xl border border-slate-800 backdrop-blur-sm flex flex-col min-h-[500px]">
                            <h3 className="text-2xl font-bold text-white mb-2">{t('pricing.t1.title')}</h3>
                            <div className="text-4xl font-bold text-slate-200 mb-6 font-mono tracking-tighter">{t('pricing.t1.price')} <span className="text-sm font-sans font-normal text-slate-500">{t('pricing.t1.currency')}</span></div>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{t('pricing.t1.desc')}</p>
                            <div className="h-px w-full bg-slate-800 mb-8" />
                            <ul className="space-y-4 mb-8 flex-1">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-300">
                                        <CheckCircle2 size={16} className="text-teal-500 flex-shrink-0" /> {t(`pricing.t1.features.${i}`)}
                                    </li>
                                ))}
                            </ul>
                            <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 h-12 rounded-xl">{t('pricing.t1.btn')}</Button>
                        </motion.div>

                        {/* Business - Featured */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-slate-900 p-8 rounded-3xl border border-teal-500 relative flex flex-col shadow-[0_0_50px_-10px_rgba(20,184,166,0.3)] min-h-[550px] -mt-6"
                        >
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-teal-500 to-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-2xl shadow-lg">{t('pricing.t2.badge')}</div>
                            <h3 className="text-2xl font-bold text-white mb-2">{t('pricing.t2.title')}</h3>
                            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400 mb-6 font-mono tracking-tighter">{t('pricing.t2.price')} <span className="text-sm font-sans font-normal text-slate-400">{t('pricing.t2.currency')}</span></div>
                            <p className="text-slate-300 text-sm mb-8 leading-relaxed">{t('pricing.t2.desc')}</p>
                            <div className="h-px w-full bg-slate-700 mb-8" />
                            <ul className="space-y-4 mb-8 flex-1">
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <li key={i} className="flex gap-3 text-sm text-white font-medium">
                                        <div className="bg-teal-500/20 rounded-full p-0.5"><CheckCircle2 size={14} className="text-teal-400" /></div> {t(`pricing.t2.features.${i}`)}
                                    </li>
                                ))}
                            </ul>
                            <Button className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold h-14 rounded-xl shadow-lg">{t('pricing.t2.btn')}</Button>
                        </motion.div>

                        {/* Enterprise */}
                        <motion.div whileHover={{ y: -10 }} className="bg-slate-950/80 p-8 rounded-3xl border border-slate-800 backdrop-blur-sm flex flex-col min-h-[500px]">
                            <h3 className="text-2xl font-bold text-white mb-2">{t('pricing.t3.title')}</h3>
                            <div className="text-4xl font-bold text-slate-200 mb-6 font-mono tracking-tighter">{t('pricing.t3.price')}</div>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{t('pricing.t3.desc')}</p>
                            <div className="h-px w-full bg-slate-800 mb-8" />
                            <ul className="space-y-4 mb-8 flex-1">
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-300">
                                        <CheckCircle2 size={16} className="text-teal-500 flex-shrink-0" /> {t(`pricing.t3.features.${i}`)}
                                    </li>
                                ))}
                            </ul>
                            <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 h-12 rounded-xl">{t('pricing.t3.btn')}</Button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 13. FAQ */}
            <section className="py-24 bg-slate-950 relative">
                <div className="container mx-auto px-6 lg:px-8 max-w-3xl">
                    <h2 className="text-3xl font-bold text-white text-center mb-16">
                        {t('faq.title')}
                    </h2>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <AccordionItem key={i} value={`item-${i}`} className="border border-slate-800 rounded-xl px-6 bg-slate-900/30 data-[state=open]:bg-slate-900 data-[state=open]:border-slate-700 transition-all duration-300">
                                <AccordionTrigger className="text-lg font-medium text-slate-200 hover:no-underline py-6 hover:text-teal-400 transition-colors text-left">{t(`faq.q${i}`)}</AccordionTrigger>
                                <AccordionContent className="text-slate-400 text-base leading-relaxed pb-6 pr-8">
                                    {t(`faq.a${i}`)}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            {/* 14. FINAL CTA - "Singular Focus" */}
            <section className="py-40 bg-black border-t border-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent 50%,rgba(20,184,166,0.1))]" />
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 bg-fixed"
                />

                <div className="container mx-auto px-6 lg:px-8 text-center relative z-10">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-5xl md:text-8xl font-bold text-white mb-8 tracking-tighter">
                            {t('cta.title1')} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">{t('cta.title2')}</span>
                        </h2>
                        <p className="text-xl md:text-2xl text-slate-500 mb-16 max-w-3xl mx-auto font-light">
                            {t('cta.desc1')} <br />
                            {t('cta.desc2')}
                        </p>

                        <Link href="/contacto">
                            <Button size="lg" className="h-24 px-16 rounded-full bg-white text-black hover:bg-slate-200 text-2xl font-bold shadow-[0_0_100px_-20px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300">
                                {t('cta.btn')}
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}

// Add simple Search icon since it was missing in lucide import

