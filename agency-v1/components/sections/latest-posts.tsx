"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, FileText, Calendar, User } from "lucide-react";
import { useTranslations } from "next-intl";

interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    coverImage?: string | null;
    createdAt: string | Date;
    author?: { name: string | null } | null;
}

interface LatestPostsProps {
    posts: Post[];
}

export function LatestPosts({ posts }: LatestPostsProps) {
    const t = useTranslations("home.latestPosts");
    if (!posts || posts.length === 0) return null;

    return (
        <section className="bg-transparent py-24 border-t border-slate-800 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="mb-16 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-teal-900/50 bg-slate-900/60 text-teal-400 text-[10px] font-mono mb-4 uppercase tracking-widest shadow-sm">
                            <FileText size={12} strokeWidth={1.5} />
                            {t('badge')}
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl uppercase font-mono">{t('titleStart')} <span className="text-teal-400">{t('titleHighlight')}</span></h2>
                        <p className="mt-2 text-lg text-slate-400 font-light">{t('subtitle')}</p>
                    </div>
                    <Link href="/blog">
                        <Button variant="outline" className="text-slate-300 border-slate-700 hover:bg-teal-500 hover:text-slate-950 hover:border-teal-400 rounded-sm font-bold tracking-widest uppercase text-[10px] transition-all duration-300 shadow-sm">
                            {t('btn')}
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {posts.map((post, index) => (
                        <motion.article
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group flex flex-col overflow-hidden rounded-sm bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-teal-500/30 hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.15)] transition-all duration-300 hover:-translate-y-1"
                        >
                            <Link href={`/blog/${post.slug}`} className="block overflow-hidden aspect-[16/9] relative border-b border-slate-800">
                                <div
                                    className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                                    style={{ backgroundImage: `url(${post.coverImage || 'https://images.unsplash.com/photo-1432821596592-e2c18b781492?q=80&w=2070&auto=format&fit=crop'})` }}
                                />
                                <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/10 transition-colors" />
                            </Link>

                            <div className="flex flex-1 flex-col p-6">
                                <div className="mb-4 flex items-center gap-4 text-[10px] font-mono text-teal-500 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Calendar size={12} strokeWidth={1.5} /> {new Date(post.createdAt).toLocaleDateString()}</span>
                                    {post.author?.name && (
                                        <span className="flex items-center gap-1.5"><User size={12} strokeWidth={1.5} /> {post.author.name}</span>
                                    )}
                                </div>

                                <h3 className="mb-3 text-xl font-black text-white group-hover:text-teal-50 transition-colors leading-tight">
                                    <Link href={`/blog/${post.slug}`}>
                                        {post.title}
                                    </Link>
                                </h3>

                                <p className="mb-6 flex-1 text-slate-400 line-clamp-3 text-sm leading-relaxed font-light">
                                    {post.excerpt || t('lockedMsg')}
                                </p>

                                <Link href={`/blog/${post.slug}`} className="inline-flex items-center font-bold text-teal-400 hover:text-teal-300 transition-colors text-[10px] uppercase tracking-widest font-mono">
                                    {t('readAction')} <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.5} />
                                </Link>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
