'use client';

import { Calendar, Clock, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "@/i18n/navigation";

// ─── BlogPostHeader ──────────────────────────────────────────────────────────

interface BlogPostHeaderProps {
    title: string;
    createdAt: Date;
    authorName?: string | null;
    authorImage?: string | null;
    readingTime: number;
    categories?: { id: string; name: string }[];
}

export function BlogPostHeader({ title, createdAt, authorName, authorImage, readingTime, categories }: BlogPostHeaderProps) {
    return (
        <div className="space-y-6">
            {/* Categories */}
            {categories && categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/blog?category=${category.id}`}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest transition-all"
                            style={{
                                background: 'rgba(13,148,136,0.12)',
                                border: '1px solid rgba(13,148,136,0.3)',
                                color: '#2dd4bf'
                            }}
                        >
                            {category.name}
                        </Link>
                    ))}
                </div>
            )}

            {/* Title */}
            <h1 className="text-4xl font-black tracking-tighter text-white sm:text-5xl lg:text-6xl leading-tight break-words">
                {title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm">
                {/* Author */}
                <div className="flex items-center gap-3">
                    <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)', border: '2px solid rgba(13,148,136,0.4)' }}
                    >
                        {authorImage ? (
                            <img src={authorImage} alt={authorName || 'Author'} className="h-full w-full object-cover" />
                        ) : (
                            authorName?.charAt(0)?.toUpperCase() || 'A'
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-slate-200">{authorName || 'Autor'}</p>
                        <p className="text-xs text-slate-600">LegacyMark</p>
                    </div>
                </div>

                <span className="text-slate-800">|</span>

                {/* Date */}
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-500" />
                    <time dateTime={new Date(createdAt).toISOString()}>
                        {new Date(createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </time>
                </div>

                <span className="text-slate-800">|</span>

                {/* Reading Time */}
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-teal-500" />
                    <span>{readingTime} min de lectura</span>
                </div>
            </div>
        </div>
    );
}

// ─── ShareButtons ────────────────────────────────────────────────────────────

interface ShareButtonsProps {
    title: string;
    url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false);

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const btnBase: React.CSSProperties = {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: '10px',
        background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(30,41,59,0.9)',
        color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s'
    };

    return (
        <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-black text-slate-600 flex items-center gap-2 uppercase tracking-widest font-mono">
                <Share2 className="h-3.5 w-3.5" />
                Compartir
            </span>
            <div className="flex items-center gap-2">
                <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" style={btnBase}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.4)'; (e.currentTarget as HTMLElement).style.color = '#60a5fa'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,41,59,0.9)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                    aria-label="Compartir en Facebook">
                    <Facebook className="h-4 w-4" />
                </a>
                <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" style={btnBase}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.4)'; (e.currentTarget as HTMLElement).style.color = '#38bdf8'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,41,59,0.9)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                    aria-label="Compartir en X/Twitter">
                    <Twitter className="h-4 w-4" />
                </a>
                <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" style={btnBase}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.4)'; (e.currentTarget as HTMLElement).style.color = '#60a5fa'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,41,59,0.9)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                    aria-label="Compartir en LinkedIn">
                    <Linkedin className="h-4 w-4" />
                </a>
                <button onClick={copyToClipboard} style={btnBase}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,148,136,0.4)'; (e.currentTarget as HTMLElement).style.color = '#2dd4bf'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,41,59,0.9)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                    aria-label="Copiar enlace">
                    <LinkIcon className="h-4 w-4" />
                </button>
                {copied && (
                    <span className="text-xs text-teal-400 font-bold animate-pulse">¡Copiado!</span>
                )}
            </div>
        </div>
    );
}

// ─── AuthorBio ───────────────────────────────────────────────────────────────

interface AuthorBioProps {
    name: string;
    image?: string | null;
    bio?: string | null;
}

export function AuthorBio({ name, image, bio }: AuthorBioProps) {
    return (
        <div
            className="flex items-start gap-5 p-6 rounded-2xl"
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)' }}
        >
            <div
                className="flex-shrink-0 h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-black overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)', border: '2px solid rgba(13,148,136,0.4)' }}
            >
                {image ? (
                    <img src={image} alt={name} className="h-full w-full object-cover" />
                ) : (
                    name?.charAt(0)?.toUpperCase() || 'A'
                )}
            </div>
            <div className="flex-1">
                <p className="text-xs font-black text-teal-500 uppercase tracking-widest mb-1 font-mono">Escrito por</p>
                <h3 className="text-lg font-black text-white">{name}</h3>
                {bio && (
                    <p className="mt-2 text-slate-400 text-sm leading-relaxed">{bio}</p>
                )}
            </div>
        </div>
    );
}

// ─── RelatedPosts ────────────────────────────────────────────────────────────

interface RelatedPost {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    coverImage?: string | null;
}

interface RelatedPostsProps {
    posts: RelatedPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
    if (!posts || posts.length === 0) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(30,41,59,0.8))' }} />
                <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-slate-500 font-mono"
                    style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)' }}>
                    Artículos Relacionados
                </span>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(30,41,59,0.8), transparent)' }} />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                    <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group block overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1"
                        style={{
                            background: 'rgba(15,23,42,0.6)',
                            border: '1px solid rgba(30,41,59,0.8)',
                            boxShadow: '0 0 0 transparent'
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,148,136,0.35)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(13,148,136,0.06)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,41,59,0.8)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 transparent';
                        }}
                    >
                        <div className="aspect-[16/9] w-full overflow-hidden">
                            <div
                                className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                style={{ backgroundImage: `url(${post.coverImage || 'https://images.unsplash.com/photo-1432821596592-e2c18b781492?q=80&w=400&auto=format&fit=crop'})` }}
                            />
                        </div>
                        <div className="p-5">
                            <h3 className="font-black text-slate-200 group-hover:text-teal-300 transition-colors line-clamp-2 mb-2">
                                {post.title}
                            </h3>
                            {post.excerpt && (
                                <p className="text-sm text-slate-500 line-clamp-2">{post.excerpt}</p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ─── TableOfContents ─────────────────────────────────────────────────────────

interface TableOfContentsProps {
    content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
    const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h[2-3]>/gi;
    const headings: { level: number; text: string; id: string }[] = [];

    let match;
    while ((match = headingRegex.exec(content)) !== null) {
        const level = parseInt(match[1]);
        const text = match[2].replace(/<[^>]*>/g, '');
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        headings.push({ level, text, id });
    }

    if (headings.length < 2) return null;

    return (
        <nav
            className="p-5 rounded-2xl"
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)' }}
        >
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 font-mono">
                En este artículo
            </h2>
            <ul className="space-y-1.5">
                {headings.map((heading, index) => (
                    <li key={index} className={heading.level === 3 ? 'ml-4' : ''}>
                        <a
                            href={`#${heading.id}`}
                            className="text-sm text-slate-500 hover:text-teal-400 transition-colors block py-1 leading-snug"
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
