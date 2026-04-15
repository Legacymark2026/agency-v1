"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BarChart3, Target, Calendar } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function CaseStudies() {
    const t = useTranslations("home.caseStudies");

    const PROJECTS = [
        {
            id: "CS-01",
            client: t('projects.cs1.client'),
            title: t('projects.cs1.title'),
            desc: t('projects.cs1.desc'),
            metric: "+240% Speed",
            tags: [t('projects.cs1.tags.t1'), t('projects.cs1.tags.t2')],
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
        },
        {
            id: "CS-02",
            client: t('projects.cs2.client'),
            title: t('projects.cs2.title'),
            desc: t('projects.cs2.desc'),
            metric: "+85% Sales",
            tags: [t('projects.cs2.tags.t1'), t('projects.cs2.tags.t2')],
            image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
        },
        {
            id: "CS-03",
            client: t('projects.cs3.client'),
            title: t('projects.cs3.title'),
            desc: t('projects.cs3.desc'),
            metric: "3x Dev Speed",
            tags: [t('projects.cs3.tags.t1'), t('projects.cs3.tags.t2')],
            image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=2055&auto=format&fit=crop"
        }
    ];

    return (
        <section className="bg-transparent py-20 sm:py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none mix-blend-screen" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-teal-900/50 bg-slate-900/60 text-teal-400 text-[10px] font-mono mb-6 uppercase tracking-widest shadow-sm">
                            <Target size={12} strokeWidth={1.5} />
                            {t('badge')}
                        </div>
                        <h2 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">
                            {t('titleStart')} <span className="text-teal-400 font-light">{t('titleHighlight')}</span>
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{t('liveDb')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {PROJECTS.map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="group relative bg-slate-900/50 backdrop-blur-sm rounded-sm overflow-hidden border border-slate-800 shadow-xl hover:shadow-[0_30px_60px_-15px_rgba(13,148,136,0.15)] hover:border-teal-500/30 hover:-translate-y-3 transition-all duration-500"
                        >
                            {/* Image Header with Bleed */}
                            <div className="relative h-64 overflow-hidden w-full m-0 p-0 border-b border-slate-800">
                                <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors z-10" />
                                <Image
                                    src={project.image}
                                    alt={project.title}
                                    fill
                                    className="object-cover transform group-hover:scale-[1.03] transition-transform duration-700 opacity-80 group-hover:opacity-100"
                                />
                                <div className="absolute top-4 right-4 z-20 bg-slate-900/80 backdrop-blur-md text-teal-400 text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded-sm border border-slate-700/50 shadow-sm">
                                    {project.id}
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2 font-medium">{project.client}</p>
                                        <h3 className="text-2xl font-black tracking-tight text-white group-hover:text-teal-50 transition-colors">
                                            {project.title}
                                        </h3>
                                    </div>
                                    <button aria-label={`Ver caso de éxito: ${project.title}`} className="h-10 w-10 flex-shrink-0 rounded-sm bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 group-hover:border-teal-400 transition-all duration-300">
                                        <ArrowUpRight size={18} strokeWidth={1.5} />
                                    </button>
                                </div>

                                <p className="text-slate-400 text-sm mb-8 line-clamp-2 font-light leading-relaxed">
                                    {project.desc}
                                </p>

                                {/* Footer Metrics */}
                                <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
                                    <div className="flex gap-2">
                                        {project.tags.map(tag => (
                                            <span key={tag} className="text-[10px] font-mono uppercase tracking-widest bg-slate-900 text-slate-400 px-2 py-1 rounded-sm border border-slate-800">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-white font-mono text-xs uppercase tracking-widest font-bold">
                                        <BarChart3 size={14} strokeWidth={1.5} className="text-teal-500" />
                                        {project.metric}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
