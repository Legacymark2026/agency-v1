"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight, FolderOpen, Layers } from "lucide-react";
import { useTranslations } from "next-intl";

interface Project {
    id: string;
    title: string;
    slug: string;
    client?: string | null;
    coverImage?: string | null;
}

interface PortfolioPreviewProps {
    projects: Project[];
}

export function PortfolioPreview({ projects }: PortfolioPreviewProps) {
    const t = useTranslations("home.portfolioPreview");
    if (!projects || projects.length === 0) return null;

    return (
        <section className="bg-transparent py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none mix-blend-screen" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="mb-24 flex flex-col items-end justify-between gap-6 md:flex-row md:items-end border-b border-slate-200 pb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-teal-900/50 bg-slate-900/60 text-teal-400 text-xs font-mono mb-6 uppercase tracking-widest shadow-sm">
                            <Layers size={12} strokeWidth={1.5} />
                            {t('badge')}
                        </div>
                        <h2 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-[-0.04em] text-white mb-4">
                            {t('titleStart')} <span className="text-teal-400 font-light">{t('titleHighlight')}</span>
                        </h2>
                        <p className="mt-6 text-base md:text-lg text-slate-400 max-w-xl font-light font-mono uppercase tracking-widest">
                            {t('subtitle')}
                        </p>
                    </div>
                    <Link href="/portfolio">
                        <Button variant="outline" className="text-slate-800 border-slate-300 hover:bg-slate-900 hover:text-white rounded-sm group font-bold tracking-widest uppercase text-xs px-6 h-12 transition-all duration-300">
                            <FolderOpen className="mr-2 h-4 w-4" strokeWidth={1.5} />
                            {t('btn')}
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    {projects.map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            viewport={{ once: true }}
                            className="group relative aspect-square xl:aspect-video cursor-pointer overflow-hidden rounded-sm bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-teal-500/30 shadow-xl hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.15)] transition-all duration-500 hover:-translate-y-2"
                        >
                            <Link href={`/portfolio/${project.slug}`} className="block h-full w-full relative">
                                {/* Image with Overlay - Default Grayscale, color on hover */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-[1.03] opacity-80 group-hover:opacity-100 grayscale group-hover:grayscale-0"
                                    style={{ backgroundImage: `url(${project.coverImage || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop'})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <div className="flex justify-between items-end mb-4">
                                            <p className="text-xs font-mono text-teal-400 uppercase tracking-widest bg-slate-900/80 w-fit px-3 py-1.5 rounded-sm border border-slate-700/50 backdrop-blur-md">
                                                {project.client || "CONFIDENTIAL"}
                                            </p>
                                            <div className="w-12 h-12 rounded-sm bg-slate-900 border border-slate-800 text-teal-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg group-hover:bg-teal-500 group-hover:text-slate-950 group-hover:border-teal-400">
                                                <ArrowUpRight size={20} strokeWidth={1.5} />
                                            </div>
                                        </div>

                                        <h3 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2 uppercase font-mono">{project.title}</h3>

                                        <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-500 opacity-0 group-hover:opacity-100">
                                            <p className="text-slate-300 text-sm mt-4 font-light leading-relaxed">
                                                {t('hoverHint')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
