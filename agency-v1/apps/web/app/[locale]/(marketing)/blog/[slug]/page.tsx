import { getPostBySlug, getRelatedPosts } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft, Tag, Rss, Calendar, Clock, ChevronRight } from "lucide-react";
import {
    BlogPostHeader,
    ShareButtons,
    AuthorBio,
    RelatedPosts,
    TableOfContents
} from "@/components/blog/blog-post-components";
import { EngagementBar } from "@/components/blog/blog-engagement";
import { CommentSection } from "@/components/blog/blog-comments";
import { NewsletterInline } from "@/components/blog/newsletter";
import { ArticleSchema, BreadcrumbSchema } from "@/components/seo/structured-data";
import { getPostComments, getCommentCount } from "@/actions/blog";
import { BlogContentViewer } from "@/components/blog/blog-content-viewer";

// Calculate reading time (average 200 words per minute)
function calculateReadingTime(content: string): number {
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
}

// Add IDs to headings for table of contents linking
function addHeadingIds(html: string): string {
    return html.replace(/<h([2-3])([^>]*)>(.*?)<\/h[2-3]>/gi, (match, level, attrs, text) => {
        const cleanText = text.replace(/<[^>]*>/g, '');
        const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    });
}

import { siteConfig } from "@/lib/site-config";

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
    const { slug, locale } = await params;
    const post = await getPostBySlug(slug);

    if (!post) return { title: 'Post not found' };

    const baseUrl = siteConfig.url;
    const postUrl = `${baseUrl}/${locale}/blog/${slug}`;

    return {
        title: post.metaTitle || post.title,
        description: post.metaDescription || post.excerpt || `Lee ${post.title} en nuestro blog`,
        keywords: post.tags?.map(t => t.name).join(', '),
        authors: [{ name: post.author?.name || 'LegacyMark' }],
        openGraph: {
            title: post.metaTitle || post.title,
            description: post.metaDescription || post.excerpt || '',
            url: postUrl,
            type: 'article',
            publishedTime: post.createdAt.toISOString(),
            modifiedTime: post.updatedAt.toISOString(),
            authors: [post.author?.name || 'LegacyMark'],
            images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.imageAlt || post.title }] : [],
            siteName: siteConfig.name,
            locale: locale === 'en' ? 'en_US' : 'es_ES',
        },
        twitter: {
            card: 'summary_large_image',
            title: post.metaTitle || post.title,
            description: post.metaDescription || post.excerpt || '',
            images: post.coverImage ? [post.coverImage] : [],
        },
        alternates: { canonical: post.canonicalUrl || postUrl },
        robots: { index: post.published, follow: true },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
    const { slug, locale } = await params;
    const post = await getPostBySlug(slug);

    if (!post) notFound();

    const categoryIds = post.categories?.map(c => c.id) || [];

    let relatedPosts: any[] = [];
    let comments: any[] = [];
    let commentCount = 0;

    try {
        [relatedPosts, comments, commentCount] = await Promise.all([
            getRelatedPosts(post.id, categoryIds, 3),
            getPostComments(post.id).catch(() => []),
            getCommentCount(post.id).catch(() => 0)
        ]);
    } catch {
        relatedPosts = await getRelatedPosts(post.id, categoryIds, 3).catch(() => []);
    }

    const readingTime = calculateReadingTime(post.content);
    const processedContent = addHeadingIds(post.content);

    const baseUrl = siteConfig.url;
    const postUrl = `${baseUrl}/${locale}/blog/${slug}`;

    return (
        <>
            {/* SEO Structured Data */}
            <ArticleSchema
                title={post.title}
                description={post.metaDescription || post.excerpt || ''}
                url={postUrl}
                imageUrl={post.coverImage || undefined}
                authorName={post.author?.name || 'LegacyMark'}
                publishedDate={post.createdAt.toISOString()}
                modifiedDate={post.updatedAt.toISOString()}
                section={post.categories?.[0]?.name}
                tags={post.tags?.map(t => t.name)}
            />
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: baseUrl },
                    { name: 'Blog', url: `${baseUrl}/blog` },
                    ...(post.categories?.[0] ? [{ name: post.categories[0].name, url: `${baseUrl}/blog?category=${post.categories[0].id}` }] : []),
                    { name: post.title, url: postUrl }
                ]}
            />

            {/* ── NOISE + GLOW (matching home) ─────────────────────────── */}
            <div className="bg-noise fixed inset-0 z-50 pointer-events-none mix-blend-multiply opacity-[0.015]" />

            <article className="min-h-screen relative" style={{ background: '#020617' }}>

                {/* Global ambient glows */}
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[110%] h-[700px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.07)_0%,transparent_60%)] pointer-events-none -z-0" />
                <div className="absolute top-[40%] right-[-5%] w-[400px] h-[400px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.04)_0%,transparent_70%)] pointer-events-none -z-0" />

                {/* ── TEAL Reading Progress Bar ──────────────────────────── */}
                <div className="fixed top-0 left-0 right-0 h-[2px] z-50" style={{ background: 'rgba(15,23,42,0.9)' }}>
                    <div
                        id="reading-progress"
                        className="h-full transition-all duration-150"
                        style={{ width: '0%', background: 'linear-gradient(90deg, #2dd4bf 0%, #38bdf8 60%, #a78bfa 100%)' }}
                    />
                </div>

                {/* ── HERO SECTION ───────────────────────────────────────── */}
                <div
                    className="relative pt-28 pb-14 overflow-hidden"
                    style={{ background: 'linear-gradient(180deg, rgba(13,148,136,0.07) 0%, transparent 100%)' }}
                >
                    {/* Top accent line */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-14 bg-gradient-to-b from-teal-400/50 to-transparent" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-500 -translate-y-1" />

                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">

                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-8 font-mono">
                            <Link href="/" className="hover:text-teal-400 transition-colors">Inicio</Link>
                            <ChevronRight className="w-3 h-3 text-slate-700" />
                            <Link href="/blog" className="hover:text-teal-400 transition-colors">Blog</Link>
                            {post.categories?.[0] && (
                                <>
                                    <ChevronRight className="w-3 h-3 text-slate-700" />
                                    <Link
                                        href={`/blog?category=${post.categories[0].id}`}
                                        className="hover:text-teal-400 transition-colors"
                                    >
                                        {post.categories[0].name}
                                    </Link>
                                </>
                            )}
                        </nav>

                        <Link href="/blog">
                            <span className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 border border-slate-800 bg-slate-900/60 hover:border-teal-500/40 hover:text-teal-400 transition-all -ml-1">
                                <ArrowLeft className="w-4 h-4" /> Volver al Blog
                            </span>
                        </Link>

                        <BlogPostHeader
                            title={post.title}
                            createdAt={post.createdAt}
                            authorName={post.author?.name}
                            authorImage={post.author?.image}
                            readingTime={readingTime}
                            categories={post.categories}
                        />

                        {/* Engagement Bar - Mobile */}
                        <div className="mt-8 lg:hidden">
                            <EngagementBar
                                postId={post.id}
                                postSlug={slug}
                                postTitle={post.title}
                                content={post.content}
                            />
                        </div>
                    </div>
                </div>

                {/* ── COVER IMAGE ────────────────────────────────────────── */}
                {post.coverImage && (
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-4 mb-12 relative z-10">
                        <figure className="relative">
                            <div className="aspect-[21/9] w-full relative overflow-hidden rounded-2xl group" style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(30,41,59,0.8)' }}>
                                <img
                                    src={post.coverImage}
                                    alt={post.imageAlt || post.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    loading="eager"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
                            </div>
                            {post.imageAlt && (
                                <figcaption className="mt-3 text-center text-sm text-slate-600">{post.imageAlt}</figcaption>
                            )}
                        </figure>
                    </div>
                )}

                {/* ── MAIN CONTENT AREA ──────────────────────────────────── */}
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-12">

                        {/* Article Content */}
                        <div className="order-2 lg:order-1">
                            {/* Share Buttons - Top */}
                            <div className="mb-8 pb-6" style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                                <ShareButtons title={post.title} url={postUrl} />
                            </div>

                            {/* Main Article Content */}
                            <BlogContentViewer content={processedContent} />

                            {/* Tags */}
                            {post.tags && post.tags.length > 0 && (
                                <div className="mt-12 pt-8" style={{ borderTop: '1px solid rgba(30,41,59,0.8)' }}>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Tag className="h-4 w-4 text-slate-600" />
                                        {post.tags.map((tag) => (
                                            <Link
                                                key={tag.name}
                                                href={`/blog?tag=${encodeURIComponent(tag.name)}`}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold text-teal-300 transition-all hover:text-white"
                                                style={{
                                                    background: 'rgba(13,148,136,0.1)',
                                                    border: '1px solid rgba(13,148,136,0.3)',
                                                }}
                                            >
                                                #{tag.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Engagement Bar - Desktop */}
                            <div className="hidden lg:block mt-8 pt-8" style={{ borderTop: '1px solid rgba(30,41,59,0.8)' }}>
                                <EngagementBar
                                    postId={post.id}
                                    postSlug={slug}
                                    postTitle={post.title}
                                    content={post.content}
                                />
                            </div>

                            {/* Share Buttons - Bottom */}
                            <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgba(30,41,59,0.8)' }}>
                                <ShareButtons title={post.title} url={postUrl} />
                            </div>

                            {/* Author Bio */}
                            <div className="mt-12">
                                <AuthorBio
                                    name={post.author?.name || "Autor"}
                                    image={post.author?.image}
                                    bio="Especialista en marketing digital y estrategia de contenidos. Apasionado por ayudar a marcas a crecer en el mundo digital."
                                />
                            </div>

                            {/* Comments Section */}
                            <div className="mt-16 pt-12" style={{ borderTop: '1px solid rgba(30,41,59,0.8)' }} id="comentarios">
                                <CommentSection
                                    postId={post.id}
                                    initialComments={comments.map((c: any) => ({
                                        id: c.id,
                                        content: c.content,
                                        authorName: c.authorName,
                                        createdAt: c.createdAt,
                                        likeCount: c.likeCount || 0,
                                        replies: c.replies?.map((r: any) => ({
                                            id: r.id,
                                            content: r.content,
                                            authorName: r.authorName,
                                            createdAt: r.createdAt,
                                            likeCount: r.likeCount || 0
                                        }))
                                    }))}
                                    commentCount={commentCount}
                                />
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside className="order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start space-y-6">
                            {/* Table of Contents */}
                            <TableOfContents content={post.content} />

                            {/* Quick Stats */}
                            <div
                                className="p-5 rounded-2xl"
                                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)' }}
                            >
                                <h3 className="text-xs font-black uppercase tracking-widest mb-4 text-slate-500 font-mono">
                                    Información
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-4 w-4 text-teal-500" />
                                        <span className="text-slate-400">Tiempo de lectura</span>
                                        <span className="ml-auto font-bold text-white">{readingTime} min</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-teal-500" />
                                        <span className="text-slate-400">Publicado</span>
                                        <span className="ml-auto font-bold text-white">
                                            {new Date(post.createdAt).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Newsletter Inline */}
                            <NewsletterInline />

                            {/* RSS Feed Link */}
                            <Link
                                href="/rss"
                                className="flex items-center gap-2 p-4 rounded-xl font-medium transition-all"
                                style={{
                                    background: 'rgba(249,115,22,0.08)',
                                    border: '1px solid rgba(249,115,22,0.2)',
                                    color: '#fb923c'
                                }}
                                target="_blank"
                            >
                                <Rss className="h-5 w-5" />
                                <span>Suscribirse vía RSS</span>
                            </Link>
                        </aside>
                    </div>
                </div>

                {/* ── RELATED POSTS SECTION ──────────────────────────────── */}
                {relatedPosts.length > 0 && (
                    <section
                        className="py-16 sm:py-24 relative z-10"
                        style={{ borderTop: '1px solid rgba(30,41,59,0.8)', background: 'rgba(15,23,42,0.4)' }}
                    >
                        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                            <RelatedPosts posts={relatedPosts} />
                        </div>
                    </section>
                )}

            </article>

            {/* Reading Progress Script */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        if (typeof window !== 'undefined') {
                            window.addEventListener('scroll', function() {
                                const article = document.querySelector('article');
                                const progress = document.getElementById('reading-progress');
                                if (article && progress) {
                                    const scrollTop = window.scrollY;
                                    const docHeight = article.scrollHeight - window.innerHeight;
                                    const scrollPercent = Math.min((scrollTop / docHeight) * 100, 100);
                                    progress.style.width = scrollPercent + '%';
                                }
                            });
                        }
                    `
                }}
            />
        </>
    );
}
