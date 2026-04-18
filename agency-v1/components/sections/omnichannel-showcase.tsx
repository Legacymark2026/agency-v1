"use client";

import { useTranslations } from "next-intl";
import { motion, useMotionValue, useMotionTemplate, useTransform, useSpring } from "framer-motion";
import { MouseEvent } from "react";
import Image from "next/image";
import { Database, Network, Shield, Zap, TrendingUp, Globe, PenTool, Layers, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OmnichannelShowcase() {
    const t = useTranslations("home.omnichannel");

    // Mouse Interaction for the highlight effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);
    }

    const springConfig = { damping: 25, stiffness: 150 };
    const px1 = useSpring(useTransform(mouseX, [0, 1500], [-15, 15]), springConfig);
    const py1 = useSpring(useTransform(mouseY, [0, 1000], [-15, 15]), springConfig);
    const px2 = useSpring(useTransform(mouseX, [0, 1500], [15, -15]), springConfig);
    const py2 = useSpring(useTransform(mouseY, [0, 1000], [15, -15]), springConfig);
    const px3 = useSpring(useTransform(mouseX, [0, 1500], [-10, 10]), springConfig);
    const py3 = useSpring(useTransform(mouseY, [0, 1000], [10, -10]), springConfig);
    const px4 = useSpring(useTransform(mouseX, [0, 1500], [10, -10]), springConfig);
    const py4 = useSpring(useTransform(mouseY, [0, 1000], [-10, 10]), springConfig);

    return (
        <section className="relative bg-slate-950 py-24 sm:py-32 overflow-hidden text-white" onMouseMove={handleMouseMove}>
            {/* Top Slanted Divider to separate from StrategicAlliances */}
            <div className="absolute top-0 inset-x-0 h-32 bg-slate-950 transform -skew-y-2 origin-top-left -translate-y-16 z-0 pointer-events-none" />

            {/* Background Texture & Glow Elements */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none mix-blend-screen" />

            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-0"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            800px circle at ${mouseX}px ${mouseY}px,
                            rgba(13, 148, 136, 0.05),
                            transparent 80%
                        )
                    `,
                }}
            />

            {/* Subtle Gradient Orbs */}
            <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="container relative mx-auto px-6 lg:px-8 z-10 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">

                    {/* Content Column */}
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-teal-500/30 bg-teal-500/10 text-teal-400 text-xs font-mono mb-8 uppercase tracking-widest shadow-[0_0_15px_-3px_rgba(20,184,166,0.3)]"
                        >
                            <Network size={12} strokeWidth={1.5} />
                            {t('badge')}
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-6"
                        >
                            {t('titleStart')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">{t('titleHighlight')}</span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-lg md:text-xl text-slate-400 font-light leading-relaxed mb-10 max-w-xl"
                        >
                            {t('description')}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12"
                        >
                            <div className="space-y-3">
                                <div className="w-10 h-10 rounded-sm bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 shadow-sm">
                                    <Database size={18} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-white font-bold">{t('features.f1.title')}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{t('features.f1.desc')}</p>
                            </div>
                            <div className="space-y-3">
                                <div className="w-10 h-10 rounded-sm bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 shadow-sm">
                                    <Zap size={18} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-white font-bold">{t('features.f2.title')}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{t('features.f2.desc')}</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                        >
                            <Button size="lg" className="h-14 px-8 rounded-sm bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold uppercase tracking-wider font-mono border-none shadow-[0_0_30px_-5px_rgba(20,184,166,0.4)] transition-all">
                                {t('cta')}
                            </Button>
                        </motion.div>
                    </div>

                    {/* Image Showcase Column */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] xl:aspect-square max-w-2xl mx-auto rounded-xl overflow-hidden group border border-slate-800/50 shadow-2xl"
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full ease-in-out" />

                        {/* Image overlay to blend the dark edges of the image with the section bg */}
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none" />
                        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/80 to-transparent z-10 pointer-events-none" />
                        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-950/80 to-transparent z-10 pointer-events-none" />
                        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-950/80 to-transparent z-10 pointer-events-none" />

                        <Image
                            src="/images/IMG_20260305_152613.png"
                            alt="Omnichannel Intelligence Showcase"
                            fill
                            className="object-cover object-center z-0 scale-95"
                            priority
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />

                        {/* Floating Element 1: Analytics / Meta Ads */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            className="absolute top-[12%] -left-4 sm:-left-8 z-30"
                        >
                            <motion.div style={{ x: px1, y: py1 }} className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                        <TrendingUp size={16} />
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-xs text-slate-400 font-medium whitespace-nowrap">Meta Ads ROAS</p>
                                        <p className="text-sm font-bold text-white">+245%</p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        {/* Floating Element 2: Web Dev / Traffic */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.7 }}
                            className="absolute top-[30%] -right-4 sm:-right-8 z-30"
                        >
                            <motion.div style={{ x: px2, y: py2 }} className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-[0_0_30px_rgba(45,212,191,0.3)]">
                                <motion.div animate={{ y: [5, -5, 5] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400">
                                        <Globe size={16} />
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-xs text-slate-400 font-medium whitespace-nowrap">Web Traffic</p>
                                        <p className="text-sm font-bold text-white">45k visitors</p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        {/* Floating Element 3: Content / Design */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.9 }}
                            className="absolute bottom-[35%] -left-6 sm:-left-10 z-30"
                        >
                            <motion.div style={{ x: px3, y: py3 }} className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                                <motion.div animate={{ y: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }} className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center border-2 border-slate-900 shadow-sm"><PenTool size={12} className="text-white" /></div>
                                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center border-2 border-slate-900 shadow-sm"><Layers size={12} className="text-white" /></div>
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-xs text-slate-400 font-medium whitespace-nowrap">Auto-Design</p>
                                        <p className="text-xs font-bold text-white">Generating...</p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        {/* Floating Element 4: Google Ads */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1.1 }}
                            className="absolute bottom-[20%] -right-2 sm:-right-4 z-30"
                        >
                            <motion.div style={{ x: px4, y: py4 }} className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                                <motion.div animate={{ y: [6, -6, 6] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                        <MousePointerClick size={16} />
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider whitespace-nowrap">Google CPC</p>
                                        <p className="text-sm font-bold text-white">$0.45</p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        {/* Tech Data Overlay */}
                        <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end">
                            <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800/80 rounded-md px-4 py-2 opacity-80">
                                <span className="flex items-center gap-2 text-xs font-mono text-teal-400 uppercase tracking-widest">
                                    <Shield size={10} />
                                    {t('secureBadge')}
                                </span>
                            </div>
                            <div className="font-mono text-xs text-slate-500 uppercase tracking-widest text-right">
                                EXTRACTING_METRICS... <br />
                                SYNC_STATUS: <span className="text-emerald-400">OPTIMAL</span>
                            </div>
                        </div>

                    </motion.div>
                </div>
            </div>

            {/* Bottom transition removed to stay in dark mode */}
        </section>
    );
}
