"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
    ArrowRight, PenTool, Eye,
    Check, Crown, Zap, LayoutTemplate
} from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValue, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

// --- SWISS DESIGN COMPONENTS (Light Mode) ---

// 1. Interactive Grid Background (Architectural)
const SwissGrid = () => (
    <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:6rem_6rem]" />
        <div className="absolute left-0 right-0 top-0 h-px bg-slate-200" />
        <div className="absolute left-0 bottom-0 top-0 w-px bg-slate-200" />
        <div className="absolute right-0 bottom-0 top-0 w-px bg-slate-200" />
    </div>
);

// 2. Magnetic Button (Light Mode)
interface MagneticButtonProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

const MagneticButton = ({ children, className = "", onClick }: MagneticButtonProps) => {
    const ref = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current!.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        x.set((clientX - centerX) * 0.2);
        y.set((clientY - centerY) * 0.2);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            ref={ref}
            style={{ x, y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            className={className}
        >
            {children}
        </motion.button>
    );
};

// 3. Strategic Tool: Archetype Selector
const ArchetypeSelector = () => {
    const t = useTranslations('estrategiaMarcaPage.tools.archetypes');
    const archetypes = [
        { id: "hero", name: t("a1Name"), traits: t("a1Traits"), color: "bg-red-600", icon: Crown, voice: t("a1Voice"), drive: t("a1Drive") },
        { id: "sage", name: t("a2Name"), traits: t("a2Traits"), color: "bg-blue-600", icon: Eye, voice: t("a2Voice"), drive: t("a2Drive") },
        { id: "creator", name: t("a3Name"), traits: t("a3Traits"), color: "bg-purple-600", icon: PenTool, voice: t("a3Voice"), drive: t("a3Drive") },
        { id: "rebel", name: t("a4Name"), traits: t("a4Traits"), color: "bg-orange-600", icon: Zap, voice: t("a4Voice"), drive: t("a4Drive") },
    ];
    const [selected, setSelected] = useState(archetypes[0]);

    return (
        <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">{t("title")}</h3>
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                {archetypes.map((arch) => (
                    <button
                        key={arch.id}
                        onClick={() => setSelected(arch)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-none border transition-all whitespace-nowrap text-sm font-bold uppercase tracking-wide ${selected.id === arch.id
                            ? "bg-black text-white border-black"
                            : "bg-white text-slate-500 border-slate-200 hover:border-black hover:text-black"
                            }`}
                    >
                        {arch.name}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-6"
                >
                    <div className={`p-6 rounded-2xl ${selected.color} text-white shadow-lg`}>
                        <selected.icon size={32} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-bold text-slate-900 mb-2">{selected.name}</h4>
                        <p className="text-slate-600 text-lg">{selected.traits}</p>
                        <div className="mt-4 flex gap-2">
                            <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">{selected.voice}</span>
                            <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">{selected.drive}</span>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// 4. Strategic Tool: Brand Equity Calculator
const BrandEquityCalc = () => {
    const t = useTranslations('estrategiaMarcaPage.tools.equity');
    const [awareness, setAwareness] = useState([50]);
    const [loyalty, setLoyalty] = useState([50]);
    const [quality, setQuality] = useState([50]);

    const equityScore = Math.round((awareness[0] + loyalty[0] + quality[0]) / 3);

    return (
        <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">{t("title")}</h3>
            <div className="space-y-6 mb-8">
                <div>
                    <div className="flex justify-between mb-2 text-sm font-medium text-slate-700"><span>{t("l1")}</span><span>{awareness}%</span></div>
                    <Slider value={awareness} onValueChange={setAwareness} max={100} step={1} className="cursor-pointer" />
                </div>
                <div>
                    <div className="flex justify-between mb-2 text-sm font-medium text-slate-700"><span>{t("l2")}</span><span>{loyalty}%</span></div>
                    <Slider value={loyalty} onValueChange={setLoyalty} max={100} step={1} className="cursor-pointer" />
                </div>
                <div>
                    <div className="flex justify-between mb-2 text-sm font-medium text-slate-700"><span>{t("l3")}</span><span>{quality}%</span></div>
                    <Slider value={quality} onValueChange={setQuality} max={100} step={1} className="cursor-pointer" />
                </div>
            </div>

            <div className="border-t border-slate-100 pt-6 flex justify-between items-center">
                <span className="text-slate-500 font-medium">{t("result")}</span>
                <span className={`text-3xl font-bold ${equityScore > 80 ? "text-green-600" : equityScore > 50 ? "text-blue-600" : "text-slate-400"}`}>
                    {equityScore}/100
                </span>
            </div>
        </div>
    );
};

// 5. Strategic Tool: Color Psychology
const ColorPsychology = () => {
    const t = useTranslations('estrategiaMarcaPage.tools.color');
    const colors = [
        { hex: "#ef4444", name: t("c1Name"), emotion: t("c1Emotion") },
        { hex: "#3b82f6", name: t("c2Name"), emotion: t("c2Emotion") },
        { hex: "#22c55e", name: t("c3Name"), emotion: t("c3Emotion") },
        { hex: "#000000", name: t("c4Name"), emotion: t("c4Emotion") },
    ];
    const [activeColor, setActiveColor] = useState(colors[0]);

    return (
        <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm h-full flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">{t("title")}</h3>
            <div className="flex gap-3 mb-8 justify-center">
                {colors.map(c => (
                    <button
                        key={c.name}
                        onClick={() => setActiveColor(c)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${activeColor.name === c.name ? "scale-110 border-slate-400 shadow-md" : "border-transparent"}`}
                        style={{ backgroundColor: c.hex }}
                    />
                ))}
            </div>
            <div className="text-center mt-auto p-6 rounded-lg transition-colors duration-500" style={{ backgroundColor: `${activeColor.hex}15` }}>
                <h4 className="text-xl font-bold mb-2" style={{ color: activeColor.hex }}>{activeColor.name}</h4>
                <p className="text-slate-700 font-medium">{activeColor.emotion}</p>
            </div>
        </div>
    );
}

export default function BrandStrategyPage() {
    const t = useTranslations('estrategiaMarcaPage');
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll();

    const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

    return (
        <main className="bg-white selection:bg-black selection:text-white overflow-hidden text-slate-900 w-full font-sans relative">
            <SwissGrid />

            {/* Nav Trigger (Sticky Strategy) */}
            <motion.div
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-0 left-0 right-0 h-1 bg-black z-50 origin-left"
                style={{ scaleX: scrollYProgress }}
            />

            {/* 1. HERO SECTION: "Clean Authority" */}
            <section ref={targetRef} className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden bg-transparent z-10">
                <motion.div
                    style={{ y, opacity }}
                    className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="inline-flex items-center gap-2 mb-8">
                                    <div className="w-3 h-3 bg-black rounded-full animate-pulse" />
                                    <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-slate-500">
                                        {t('hero.badge')}
                                    </span>
                                </div>

                                <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter text-black mb-6 sm:mb-8 leading-[0.9]">
                                    {t('hero.title1')}<br />
                                    <span className="text-slate-400">{t('hero.title2')}</span>
                                </h1>

                                <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-lg font-medium leading-relaxed">
                                    {t('hero.desc1')} <br />
                                    {t('hero.desc2')}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                    <Link href="/contacto">
                                        <MagneticButton className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-10 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl">
                                            {t('hero.btn1')} <ArrowRight size={16} />
                                        </MagneticButton>
                                    </Link>
                                    <Link href="#tools">
                                        <Button variant="outline" className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-10 border-2 border-black text-black bg-transparent hover:bg-black hover:text-white text-sm font-bold uppercase tracking-widest rounded-none transition-all">
                                            {t('hero.btn2')}
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>

                        {/* Hero Graphic: Abstract Swiss Poster */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="relative aspect-[4/5] bg-slate-50 border border-slate-200 p-8 hidden lg:flex flex-col justify-between shadow-2xl"
                        >
                            <div className="flex justify-between items-start">
                                <div className="text-6xl font-black text-slate-200">01</div>
                                <LayoutTemplate size={40} className="text-black" />
                            </div>
                            <div className="space-y-4">
                                <div className="h-4 bg-black w-3/4" />
                                <div className="h-4 bg-slate-200 w-1/2" />
                                <div className="h-4 bg-slate-200 w-2/3" />
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-mono uppercase tracking-widest text-slate-400">EST. 2025</div>
                                <div className="text-4xl font-bold text-black mt-2">LEGACY MARK</div>
                            </div>

                            {/* Floating Elements */}
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-20 -right-10 bg-white p-6 shadow-xl border border-slate-100 max-w-[200px]"
                            >
                                <div className="text-xs font-bold uppercase text-slate-400 mb-2">{t('hero.graphic.tag')}</div>
                                <div className="text-lg font-bold text-black">{t('hero.graphic.title')}</div>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* 2. STRATEGIC TOOLKIT SECTION (Interactivity) */}
            <section id="tools" className="py-20 sm:py-32 bg-slate-50 relative border-t border-slate-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-20">
                        <div>
                            <Badge variant="outline" className="mb-4 border-black text-black bg-transparent rounded-none px-3 py-1 uppercase tracking-widest font-bold">
                                {t('tools.badge')}
                            </Badge>
                            <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight mt-4">
                                {t('tools.title')}
                            </h2>
                        </div>
                        <p className="text-slate-500 max-w-md text-right mt-6 md:mt-0">
                            {t('tools.desc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* Tool 1: Archetypes */}
                        <div className="lg:col-span-2">
                            <ArchetypeSelector />
                        </div>

                        {/* Tool 2: Color Psych */}
                        <div>
                            <ColorPsychology />
                        </div>

                        {/* Tool 3: Equity */}
                        <div className="lg:col-span-3">
                            <div className="grid md:grid-cols-2 gap-8 items-center bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
                                <div>
                                    <h3 className="text-2xl font-bold text-black mb-4">{t('tools.impact.title')}</h3>
                                    <p className="text-slate-600 mb-6">
                                        {t('tools.impact.desc')}
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-3 text-sm text-slate-700"><Check size={16} className="text-green-600" /> {t('tools.impact.p1')}</li>
                                        <li className="flex items-center gap-3 text-sm text-slate-700"><Check size={16} className="text-green-600" /> {t('tools.impact.p2')}</li>
                                        <li className="flex items-center gap-3 text-sm text-slate-700"><Check size={16} className="text-green-600" /> {t('tools.impact.p3')}</li>
                                    </ul>
                                </div>
                                <BrandEquityCalc />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. CORE SERVICES - "The Process" */}
            <section className="py-20 sm:py-32 bg-white relative">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
                        <div className="md:sticky md:top-32 h-fit">
                            <h2 className="text-4xl sm:text-6xl font-black text-black mb-6 sm:mb-8 leading-none">
                                {t('process.title1')}<br />{t('process.title2')}
                            </h2>
                            <p className="text-xl text-slate-600 mb-12 leading-relaxed">
                                {t('process.desc')}
                            </p>
                            <div className="flex gap-4">
                                <div className="flex flex-col">
                                    <span className="text-4xl font-bold text-black">{t('process.stats.v1')}</span>
                                    <span className="text-sm font-mono text-slate-500 uppercase">{t('process.stats.l1')}</span>
                                </div>
                                <div className="w-px bg-slate-200 mx-4" />
                                <div className="flex flex-col">
                                    <span className="text-4xl font-bold text-black">{t('process.stats.v2')}</span>
                                    <span className="text-sm font-mono text-slate-500 uppercase">{t('process.stats.l2')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    viewport={{ once: true }}
                                    className="group border-b border-slate-200 pb-8 hover:pl-8 transition-all duration-300 cursor-pointer"
                                >
                                    <div className="flex items-baseline gap-6">
                                        <span className="text-sm font-mono font-bold text-slate-300 group-hover:text-black transition-colors">0{i + 1}</span>
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-800 group-hover:text-black mb-2">{t(`process.steps.s${i}Title`)}</h3>
                                            <p className="text-slate-500 group-hover:text-slate-700">{t(`process.steps.s${i}Desc`)}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. CTA - Minimalist */}
            <section className="py-20 sm:py-40 bg-slate-50 border-t border-slate-200 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.4] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply" />

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl sm:text-5xl md:text-8xl font-black text-black mb-8 sm:mb-12 tracking-tighter">
                            {t('cta.title1')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t('cta.title2')}</span>
                        </h2>

                        <div className="flex flex-col items-center gap-6">
                            <p className="text-xl text-slate-600 max-w-2xl font-medium">
                                {t('cta.desc')}
                            </p>
                            <Link href="/contacto">
                                <MagneticButton className="w-full sm:w-auto h-16 sm:h-20 px-10 sm:px-16 bg-black text-white text-base sm:text-lg font-bold uppercase tracking-widest hover:bg-slate-900 border-2 border-black transition-all shadow-xl rounded-none">
                                    {t('cta.btn')}
                                </MagneticButton>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
