import { getAllPosts } from "@/lib/data";
import Link from "next/link";
import { ArrowRight, BookOpen, Rss } from "lucide-react";
import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'nav' });

    return {
        title: `Blog | ${siteConfig.name}`,
        description: "Insights y estrategias de alto nivel sobre marketing digital, diseño y automatización.",
        openGraph: {
            title: `Blog - Insights & Estrategias | ${siteConfig.name}`,
            description: "Contenido de alto nivel para escalar tu negocio.",
            url: `${siteConfig.url}/${locale}/blog`,
            siteName: siteConfig.name,
            images: [{ url: `${siteConfig.url}/logo.png` }],
            locale: locale === 'en' ? 'en_US' : 'es_ES',
            type: 'website',
        },
    };
}

// ─── Decorative Components ─────────────────────────────────────────────────

const DotGrid = ({ cols = 8, rows = 6 }: { cols?: number; rows?: number }) => (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols * rows }).map((_, i) => (
            <div
                key={i}
                className="w-1 h-1 rounded-full bg-current"
                style={{ opacity: 0.08 + (i % 5) * 0.04 }}
            />
        ))}
    </div>
);

export default async function BlogPage() {
    const posts = await getAllPosts();

    return (
        <main className="relative bg-slate-950 text-white overflow-hidden scroll-smooth min-h-screen">

            {/* ── Dense Editorial Noise ─────────────────────────────────── */}
            <div className="bg-noise fixed inset-0 z-50 pointer-events-none mix-blend-multiply opacity-[0.015]" />

            {/* ── Global Spotlight Glow ──────────────────────────────────── */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.08)_0%,transparent_60%)] pointer-events-none -z-10" />
            <div className="absolute top-[30%] right-[-5%] w-[500px] h-[500px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.05)_0%,transparent_70%)] pointer-events-none -z-10" />

            {/* ── HERO SECTION ─────────────────────────────────────────────── */}
            <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden">

                {/* Animated blobs */}
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />

                {/* Dot grids */}
                <div className="absolute top-20 left-6 text-teal-500/20 hidden lg:block pointer-events-none" aria-hidden>
                    <DotGrid cols={8} rows={5} />
                </div>
                <div className="absolute bottom-8 right-6 text-slate-700 hidden lg:block pointer-events-none" aria-hidden>
                    <DotGrid cols={6} rows={4} />
                </div>

                {/* Top accent line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-teal-400/60 to-transparent" aria-hidden />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-500 -translate-y-1" aria-hidden />

                {/* Viewfinder corners */}
                {['top-20 left-4 border-t-2 border-l-2', 'top-20 right-4 border-t-2 border-r-2', 'bottom-4 left-4 border-b-2 border-l-2', 'bottom-4 right-4 border-b-2 border-r-2'].map((cls, i) => (
                    <div key={i} className={`absolute w-6 h-6 border-teal-500/20 hidden md:block ${cls}`} aria-hidden />
                ))}

                {/* Live indicator */}
                <div className="absolute top-24 right-5 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm border border-teal-500/20 rounded-full shadow-sm hidden md:flex" aria-hidden>
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" style={{ animationDuration: '2s' }} />
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">LIVE FEED</span>
                </div>

                <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center relative z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 backdrop-blur-md shadow-md mb-8">
                        <Rss className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-teal-400 text-xs font-black tracking-widest uppercase">Blog & Recursos</span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6 break-words">
                        <span className="block text-white">Insights &</span>
                        <span className="block bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #2dd4bf 0%, #38bdf8 50%, #a78bfa 100%)' }}>Estrategias</span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
                        Contenido de <span className="text-white font-semibold">alto nivel</span> sobre marketing digital, diseño y automatización para escalar tu negocio.
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center justify-center gap-6 text-sm">
                        {[
                            { label: 'Artículos', value: `${posts.length}+` },
                            { label: 'Categorías', value: '5' },
                            { label: 'Lectores / mes', value: '2K+' },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/50">
                                <p className="font-black text-white text-lg">{stat.value}</p>
                                <p className="text-slate-500 text-xs uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── DIVIDER ───────────────────────────────────────────────────── */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

            {/* ── POSTS GRID ───────────────────────────────────────────────── */}
            <section className="py-16 sm:py-24 relative z-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-800" />
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50">
                            <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Publicaciones Recientes</span>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post, index) => (
                            <article
                                key={post.id}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-teal-500/40 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 h-full backdrop-blur-sm relative"
                            >
                                {/* Top accent bar on hover */}
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Image */}
                                <div className="aspect-video w-full bg-slate-800 relative overflow-hidden">
                                    <Link href={`/${locale}/blog/${post.slug}`} className="block h-full w-full">
                                        <div
                                            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                            style={{ backgroundImage: `url(${post.coverImage || 'https://images.unsplash.com/photo-1432821596592-e2c18b781492?q=80&w=2070&auto=format&fit=crop'})` }}
                                        />
                                        {/* Dark overlay for text contrast */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                                    </Link>

                                    {/* Index badge */}
                                    <div className="absolute top-3 left-3 w-7 h-7 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-slate-700 flex items-center justify-center">
                                        <span className="text-xs font-black text-teal-400 font-mono">{String(index + 1).padStart(2, '0')}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col p-6">
                                    {/* Date / Category */}
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="text-xs font-black uppercase tracking-widest text-teal-400">
                                            {new Date(post.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="mb-3 text-lg font-black text-white group-hover:text-teal-300 transition-colors leading-snug">
                                        <Link href={`/${locale}/blog/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                    </h3>

                                    {/* Excerpt */}
                                    <p className="flex-1 text-sm text-slate-400 line-clamp-3 mb-5 leading-relaxed">
                                        {post.excerpt || "Sin resumen disponible."}
                                    </p>

                                    {/* CTA */}
                                    <Link href={`/${locale}/blog/${post.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors group/link">
                                        <span>Leer artículo</span>
                                        <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </article>
                        ))}

                        {/* Empty state */}
                        {posts.length === 0 && (
                            <div className="col-span-full text-center py-24 relative">
                                <div className="w-20 h-20 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center justify-center mx-auto mb-6">
                                    <BookOpen className="w-8 h-8 text-slate-600" />
                                </div>
                                <p className="text-slate-500 text-lg font-bold mb-2">No hay publicaciones todavía</p>
                                <p className="text-slate-600 text-sm">Estamos preparando contenido de alto valor. Vuelve pronto.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── NEWSLETTER CTA BANNER ─────────────────────────────────── */}
            <section className="py-16 sm:py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #020617 0%, #042f2e 60%, #0c2340 100%)' }}>
                {/* Radial glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(13,148,136,0.12),transparent)] pointer-events-none" />
                {/* Dot pattern */}
                <div
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                    aria-hidden
                />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent" aria-hidden />

                <div className="container mx-auto px-4 md:px-6 max-w-2xl text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 mb-6">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        <span className="text-teal-400 text-xs font-black uppercase tracking-widest">Estrategia & Crecimiento</span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        ¿Listo para escalar<br />
                        <span className="bg-gradient-to-r from-teal-400 to-sky-400 bg-clip-text text-transparent">tu negocio?</span>
                    </h2>
                    <p className="text-slate-400 text-lg mb-8">
                        Cada artículo es una pieza del sistema. Hablemos de cómo aplicarlo a tu empresa.
                    </p>

                    <a
                        href="https://wa.me/573223047353"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-lg rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-teal-500/30"
                    >
                        Hablar con un experto
                        <ArrowRight className="w-5 h-5" />
                    </a>
                    <p className="mt-4 text-slate-500 text-sm">Sin compromiso · Respuesta en menos de 2h</p>
                </div>
            </section>

        </main>
    );
}
