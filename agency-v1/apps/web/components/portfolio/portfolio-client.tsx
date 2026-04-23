"use client";

import { Button } from "@/components/ui/button";
import {
    Code2, Layers, Zap, Layout, Database, Terminal, Cpu,
    Box, Monitor, PenTool, Trophy, Shield, Brain, ArrowUpRight, FolderOpen, Smartphone, ChevronDown, ChevronUp
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { GridEditor, MediaAsset, SocialProfile } from "@/components/portfolio/grid-editor";

// --- ULTRA-PREMIUM, HIGH PERFORMANCE VISUAL FX COMPONENTS ---

const CleanTitleEffect = ({ text }: { text: string }) => (
    <span className="inline-block relative">
        <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-500">{text}</span>
    </span>
);

// ─────────────────────────────────────────────────────────────
// Helper: build MediaAsset[] from a single project
// ─────────────────────────────────────────────────────────────
function buildProjectAssets(project: any): MediaAsset[] {
    const assets: MediaAsset[] = [];
    if (project.coverImage) {
        assets.push({ id: `${project.id}-cover`, url: project.coverImage, type: "image", order: 0 });
    }
    (project.gallery || []).forEach((g: any, gi: number) => {
        assets.push({
            id: `${project.id}-g-${gi}`,
            url: typeof g === "string" ? g : g.url,
            type: typeof g === "object" && g.type === "video" ? "video" : "image",
            order: gi + 1,
        });
    });
    return assets.filter((a) => a.url);
}

// ─────────────────────────────────────────────────────────────
// Helper: build client-specific SocialProfiles for a project
// ─────────────────────────────────────────────────────────────
function buildClientProfiles(project: any): SocialProfile[] {
    const clientName: string = project.client || "Cliente";
    const clientLogo: string | null = project.clientLogo || null;
    // Slug-based username (lowercase, no spaces)
    const username = clientName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

    const base = {
        displayName: clientName,
        username,
        avatarUrl: clientLogo,
        followersCount: 0,
        followingCount: 0,
    };

    return [
        { ...base, platform: "instagram" },
        { ...base, platform: "tiktok" },
        { ...base, platform: "facebook" },
    ];
}

// ─────────────────────────────────────────────────────────────
// ProjectCard — with inline Grid Visualizer
// ─────────────────────────────────────────────────────────────
const ProjectCard = ({
    project,
    index,
    socialProfiles,
}: {
    project: any;
    index: number;
    socialProfiles: SocialProfile[];
}) => {
    const [showVisualizer, setShowVisualizer] = useState(false);

    const gradients = [
        "from-teal-500/20 via-emerald-900/10 to-transparent",
        "from-purple-500/20 via-indigo-900/10 to-transparent",
        "from-blue-500/20 via-cyan-900/10 to-transparent",
        "from-rose-500/20 via-orange-900/10 to-transparent",
        "from-amber-500/20 via-yellow-900/10 to-transparent",
    ];
    const accentColors = [
        "border-teal-500/40 group-hover:border-teal-400",
        "border-purple-500/40 group-hover:border-purple-400",
        "border-blue-500/40 group-hover:border-blue-400",
        "border-rose-500/40 group-hover:border-rose-400",
        "border-amber-500/40 group-hover:border-amber-400",
    ];
    const glowColors = [
        "from-teal-500/10",
        "from-purple-500/10",
        "from-blue-500/10",
        "from-rose-500/10",
        "from-amber-500/10",
    ];
    const idx = project.slug.length % gradients.length;
    const gradient = gradients[idx];
    const accent = accentColors[idx];
    const glow = glowColors[idx];

    const iconMap: Record<string, any> = {
        react: Code2, nextjs: Layout, database: Database, backend: Terminal,
        ai: Brain, design: PenTool, ecommerce: Box, security: Shield,
        node: Terminal, typescript: Code2, vue: Layers,
    };
    const displayStack = (project.techStack || []).slice(0, 5).map((tech: string) => ({
        Icon: iconMap[tech.toLowerCase()] || Cpu,
        label: tech,
    }));
    if (displayStack.length === 0) {
        displayStack.push({ Icon: Layers, label: "Design" }, { Icon: Zap, label: "Dev" });
    }

    const stats = (project.results || []).slice(0, 3);
    const hasCover = !!(project.coverImage || (project.gallery && project.gallery.length > 0));
    let coverAsset = project.coverImage;
    if (!coverAsset && project.gallery && project.gallery.length > 0) {
        const firstGallery = project.gallery[0];
        coverAsset = typeof firstGallery === "string" ? firstGallery : firstGallery.url;
    }
    const galleryCount = (project.gallery || []).length;

    // Assets for this specific project
    const projectAssets = buildProjectAssets(project);
    const hasMedia = projectAssets.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true, margin: "-40px" }}
            className={`group relative flex flex-col bg-slate-900/80 border ${accent} rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500`}
        >
            {/* ── Cover Image Area ── */}
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-950 flex-shrink-0">
                {coverAsset ? (
                    <img
                        src={coverAsset}
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <Monitor size={48} className="text-slate-700" strokeWidth={1} />
                    </div>
                )}
                {/* Image overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                {/* Top-left: Category badge */}
                <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                    {project.category && (
                        <span className="px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-700/80 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-300 backdrop-blur-md">
                            {project.category.name}
                        </span>
                    )}
                    {project.featured && (
                        <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 backdrop-blur-md flex items-center gap-1">
                            <Trophy size={9} /> Featured
                        </span>
                    )}
                </div>

                {/* Top-right: Status */}
                <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest backdrop-blur-md ${
                        project.status === "published"
                            ? "bg-teal-500/20 border border-teal-500/40 text-teal-400"
                            : "bg-slate-800/80 border border-slate-700 text-slate-400"
                    }`}>
                        {project.status === "published" ? "● Live" : project.status}
                    </span>
                </div>

                {/* Bottom-right: Gallery count */}
                {galleryCount > 0 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-slate-950/80 border border-slate-700/80 text-[10px] text-slate-400 backdrop-blur-md font-mono">
                        <Monitor size={10} />
                        {galleryCount}
                    </div>
                )}
            </div>

            {/* ── Card Body ── */}
            <div className="flex flex-col flex-1 p-5 gap-4">

                {/* Title + Client */}
                <div>
                    <h3 className="text-lg font-black text-white tracking-tight leading-tight line-clamp-2 group-hover:text-teal-100 transition-colors mb-1">
                        {project.title}
                    </h3>
                    {project.client && (
                        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1">
                            <Box size={10} className="text-slate-600" />
                            {project.client}
                        </p>
                    )}
                </div>

                {/* Description */}
                {project.description && (
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 flex-1">
                        {project.description}
                    </p>
                )}

                {/* ROI Stats */}
                {stats.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                        {stats.map((stat: any, i: number) => (
                            <div key={i} className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-center">
                                <div className="text-base font-black text-white leading-none">{stat.value}</div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5 font-mono truncate">{stat.metric}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tech Stack + CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-auto">
                    <div className="flex gap-1.5 flex-wrap">
                        {displayStack.map(({ Icon, label }: any, i: number) => (
                            <div
                                key={i}
                                title={label}
                                className="w-7 h-7 bg-slate-800 border border-slate-700/80 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-teal-400 group-hover:border-teal-500/40 transition-all duration-300"
                            >
                                <Icon size={13} strokeWidth={1.5} />
                            </div>
                        ))}
                    </div>
                    <Link
                        href={`/portfolio/${project.slug}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 group-hover:text-teal-300 border border-slate-700 group-hover:border-teal-500/50 rounded-lg bg-slate-800/50 group-hover:bg-teal-500/10 transition-all duration-300 relative z-30"
                    >
                        Ver proyecto <ArrowUpRight size={13} />
                    </Link>
                </div>

                {/* ── "Ver en Redes" Toggle Button ── */}
                {hasMedia && (
                    <button
                        onClick={() => setShowVisualizer((v) => !v)}
                        className={`relative z-30 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 border ${
                            showVisualizer
                                ? "bg-teal-500/15 border-teal-500/50 text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.15)]"
                                : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-teal-500/40 hover:text-teal-300 hover:bg-teal-500/10"
                        }`}
                    >
                        <Smartphone size={13} />
                        {showVisualizer ? "Ocultar preview" : "Ver en Redes"}
                        {showVisualizer ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showVisualizer && hasMedia && (
                    <motion.div
                        key="visualizer"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflowX: "hidden" }}
                        className="border-t border-teal-500/20"
                    >
                        <div className="p-4 bg-slate-950/80">
                            {/* Mini section header */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-5 rounded-full bg-teal-500 shadow-[0_0_8px_#14b8a6]" />
                                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-teal-400/80">
                                    Preview de Redes Sociales
                                </span>
                            </div>
                            <GridEditor
                                assets={projectAssets}
                                profiles={buildClientProfiles(project)}
                                onOrderChange={() => {}}
                                onRemove={() => {}}
                                onEdit={() => {}}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ambient glow on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl`} />
        </motion.div>
    );
};


export function PortfolioClient({
    projects,
    categories,
    socialProfiles = [],
}: {
    projects: any[];
    categories: any[];
    socialProfiles?: SocialProfile[];
}) {
    const [filter, setFilter] = useState("All");
    const t = useTranslations("portfolioPage");

    const displayedProjects = projects.filter(
        (p) => filter === "All" || p.category?.slug === filter || p.category?.name === filter
    );

    const getCategoryIcon = (cat: any) => {
        const slug = cat.slug?.toLowerCase() || "";
        const name = cat.name?.toLowerCase() || "";
        if (slug.includes("web") || name.includes("web")) return Monitor;
        if (slug.includes("marketing") || name.includes("marketing")) return Zap;
        if (slug.includes("design") || name.includes("diseño")) return PenTool;
        if (slug.includes("ecommerce") || name.includes("tienda")) return Box;
        if (slug.includes("software") || name.includes("desarrollo")) return Code2;
        return Layers;
    };

    return (
        <main className="bg-slate-950 min-h-screen text-slate-200 selection:bg-teal-500/30 selection:text-teal-200">
            {/* AMBIENT BACKGROUND */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.05)_0%,transparent_60%)]" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] mix-blend-screen" />
            </div>

            {/* HERO SECTION */}
            <section className="relative pt-40 pb-20 px-6 container mx-auto z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-5xl"
                >
                    <div className="inline-flex items-center gap-2 mb-10 px-4 py-2 rounded-sm border border-teal-900/50 bg-slate-900/60 backdrop-blur-sm shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_#14b8a6]" />
                        <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-teal-400/80">
                            {t("hero.badge")}
                        </span>
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-black text-white leading-[0.85] tracking-tighter mb-10 uppercase">
                        {t("hero.scramble")}<br />
                        <CleanTitleEffect text={t("hero.titleHighlight")} />
                    </h1>

                    <div className="flex flex-col md:flex-row gap-12 items-start opacity-0 animate-[fade-in_1s_ease-out_0.3s_forwards]">
                        <p className="text-lg md:text-xl text-slate-400 max-w-xl font-light font-mono uppercase tracking-widest leading-relaxed border-l-2 border-teal-500/50 pl-6">
                            {t("hero.desc")}
                        </p>

                        <div className="flex gap-8">
                            <div className="text-left md:text-center">
                                <div className="text-3xl font-black text-white">{projects.length > 0 ? projects.length : t("hero.stats.s1.val")}</div>
                                <div className="text-xs font-bold uppercase tracking-widest text-teal-500/70 mt-1">{t("hero.stats.s1.label")}</div>
                            </div>
                            <div className="text-left md:text-center">
                                <div className="text-3xl font-black text-white">{t("hero.stats.s2.val")}</div>
                                <div className="text-xs font-bold uppercase tracking-widest text-teal-500/70 mt-1">{t("hero.stats.s2.label")}</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* GALLERY SECTION */}
            <section className="relative py-12 container mx-auto px-6 z-10">

                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
                >
                    <div>
                        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-sm border border-teal-900/50 bg-slate-900/60 backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shadow-[0_0_6px_#14b8a6]" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-teal-400/80">Proyectos</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase font-mono">
                            Nuestro <span className="text-teal-400">Portafolio</span>
                        </h2>
                    </div>
                    {/* Project count */}
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                            <div className="text-xl font-black text-white">{displayedProjects.length}</div>
                            <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mt-0.5">Proyectos</div>
                        </div>
                        {categories.length > 0 && (
                            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                                <div className="text-xl font-black text-white">{categories.length}</div>
                                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mt-0.5">Categorías</div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button
                        onClick={() => setFilter("All")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 border ${
                            filter === "All"
                                ? "bg-teal-500/15 border-teal-500/50 text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.15)]"
                                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                        }`}
                    >
                        {t("filters.all")}
                    </button>
                    {categories.map((c: any) => (
                        <button
                            key={c.id}
                            onClick={() => setFilter(c.name)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 border ${
                                filter === c.name || filter === c.slug
                                    ? "bg-teal-500/15 border-teal-500/50 text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.15)]"
                                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                            }`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="space-y-24">
                    <AnimatePresence mode="popLayout">
                        {filter === "All" ? (
                            categories.map((cat: any) => {
                                const catProjects = projects.filter((p) => p.category?.id === cat.id);
                                if (catProjects.length === 0) return null;
                                const Icon = getCategoryIcon(cat);

                                return (
                                    <motion.div
                                        key={cat.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="relative"
                                    >
                                        <div className="flex items-center gap-4 mb-10 group/header">
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-500 group-hover/header:border-teal-500/50 group-hover/header:bg-teal-500/10 transition-all duration-500 shadow-lg">
                                                <Icon size={24} strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter group-hover/header:text-teal-100 transition-colors">
                                                    {cat.name}
                                                </h3>
                                                <div className="h-0.5 w-12 bg-teal-500/40 rounded-full mt-1 group-hover/header:w-24 transition-all duration-500" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {catProjects.map((project, idx) => (
                                                <ProjectCard
                                                    key={project.id}
                                                    project={project}
                                                    index={idx}
                                                    socialProfiles={socialProfiles}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                            >
                                {displayedProjects.length > 0 ? displayedProjects.map((project, index) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        index={index}
                                        socialProfiles={socialProfiles}
                                    />
                                )) : (
                                    <div className="col-span-full text-center py-24 text-slate-500 font-mono uppercase tracking-widest">
                                        No projects found for this category.
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Load More / Request Custom */}
                <div className="mt-20 text-center">
                    <p className="font-mono text-teal-500/60 text-xs tracking-widest uppercase mb-6">{t("gallery.end")}</p>
                    <Link href="/contacto">
                        <Button variant="outline" className="h-16 px-10 border-slate-700 bg-slate-900/50 text-slate-300 uppercase tracking-widest text-xs font-bold hover:border-teal-500 hover:text-teal-400 transition-all rounded-sm backdrop-blur-sm group">
                            <FolderOpen className="mr-3 w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                            {t("gallery.req")}
                        </Button>
                    </Link>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="relative py-32 bg-slate-900 border-t border-slate-800 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] mix-blend-overlay" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-[radial-gradient(ellipse_at_bottom,rgba(20,184,166,0.1)_0%,transparent_70%)] pointer-events-none" />

                <div className="container mx-auto px-6 text-center relative z-10">
                    <div className="mb-12 inline-block">
                        <div className="w-16 h-16 bg-slate-800 border-slate-700 border rounded-sm flex items-center justify-center mx-auto mb-8 shadow-lg">
                            <Trophy size={28} className="text-teal-400" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase font-mono">
                            {t("cta.title")} <span className="text-teal-400">{t("cta.titleBr")}</span>
                        </h2>
                    </div>

                    <div className="flex justify-center gap-6">
                        <Link href="/contacto">
                            <Button className="h-16 px-12 bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold uppercase tracking-widest rounded-sm transition-all shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:shadow-[0_0_50px_rgba(20,184,166,0.5)]">
                                {t("cta.btn")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
