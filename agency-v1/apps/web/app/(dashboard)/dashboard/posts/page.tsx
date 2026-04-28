import { getPosts, deletePost } from "@/actions/cms";
import { getAllComments } from "@/actions/blog";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Plus, Edit, Trash2, FileText, MessageCircle } from "lucide-react";

export default async function PostsPage() {
    const postsResult = await getPosts();
    const posts = postsResult.success && postsResult.data ? postsResult.data : [];
    const session = await auth();
    const companyId = session?.user?.companyId || '';
    const commentsData = await getAllComments(companyId, { limit: 1 });
    const totalComments = commentsData.total || 0;

    return (
        <div className="ds-page space-y-8">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between pb-8"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <div className="mb-4 flex items-center gap-3">
                        <span className="ds-badge ds-badge-teal">CMS · BLOG POSTS</span>
                        {totalComments > 0 && (
                            <Link href="/dashboard/posts/comments" 
                                className="ds-badge ds-badge-purple flex items-center gap-1">
                                <MessageCircle size={10} />
                                {totalComments} comentarios
                            </Link>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-11 h-11">
                            <FileText className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page">Blog Posts</h1>
                            <p className="ds-subtext mt-1">Gestiona el contenido del blog</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {totalComments > 0 && (
                        <Link href="/dashboard/posts/comments"
                            className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-white rounded-sm transition-all hover:-translate-y-0.5"
                            style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)' }}>
                            <MessageCircle size={12} /> Comentarios
                        </Link>
                    )}
                    <Link href="/dashboard/posts/create"
                        className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-white rounded-sm transition-all hover:-translate-y-0.5"
                        style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.4)' }}>
                        <Plus size={12} /> New Post
                    </Link>
                </div>
            </div>

            {/* Table */}
            <div className="relative z-10 ds-section overflow-hidden">
                <table className="min-w-full">
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                            {["Title", "Author", "Status", "Date", "Actions"].map((h, i) => (
                                <th key={h} className={`px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-slate-600 ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {posts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center">
                                    <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">&gt; No posts encontrados · Crea el primero_</p>
                                </td>
                            </tr>
                        ) : (
                            posts.map((post: any) => (
                                <tr key={post.id} className="group transition-all hover:bg-slate-900/30"
                                    style={{ borderBottom: '1px solid rgba(30,41,59,0.5)' }}>
                                    <td className="px-4 py-4">
                                        <p className="text-[13px] font-bold text-slate-200">{post.title}</p>
                                        <p className="font-mono text-xs text-slate-600 mt-0.5 truncate max-w-[200px]">{post.slug}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-[12px] text-slate-300">{post.author.name || 'Unknown'}</p>
                                        <p className="font-mono text-xs text-slate-600">{post.author.email}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`ds-badge ${post.published ? 'ds-badge-teal' : 'ds-badge-amber'}`}>
                                            {post.published ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="font-mono text-xs text-slate-500 uppercase tracking-widest">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/dashboard/posts/${post.id}`}
                                                className="ds-icon-box w-7 h-7 hover:border-teal-800 transition-all">
                                                <Edit size={12} strokeWidth={1.5} className="text-slate-500 hover:text-teal-400 transition-colors" />
                                            </Link>
                                            <form action={async () => {
                                                'use server';
                                                await deletePost(post.id);
                                            }}>
                                                <button type="submit" className="ds-icon-box w-7 h-7 hover:border-red-900/50 transition-all">
                                                    <Trash2 size={12} strokeWidth={1.5} className="text-slate-500 hover:text-red-400 transition-colors" />
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
