"use client";

import { useState } from "react";
import {
  Share2, MessageSquare, ThumbsUp, Heart, Sparkles, Send,
  Pin, Lock, Eye, MoreHorizontal, Image as ImageIcon, Tag
} from "lucide-react";
import {
  createEnterprisePostAction,
  togglePostReactionAction,
  addPostCommentAction
} from "@/actions/feed.actions";

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  title?: string | null;
  content: string;
  mediaUrls: string[];
  audienceScope: "COMPANY_WIDE" | "DEPARTMENT" | "CONFIDENTIAL_MANAGEMENT";
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  comments?: any[];
  reactions?: any[];
  _count?: { comments: number; reactions: number };
  createdAt: string;
}

export function EnterpriseFeedClient({
  initialPosts,
  currentUserId,
  currentUserName,
  companyId
}: {
  initialPosts: Post[];
  currentUserId: string;
  currentUserName: string;
  companyId: string;
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostScope, setNewPostScope] = useState<"COMPANY_WIDE" | "DEPARTMENT" | "CONFIDENTIAL_MANAGEMENT">("COMPANY_WIDE");
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsPublishing(true);
    try {
      const res: any = await createEnterprisePostAction({
        title: newPostTitle.trim() || undefined,
        content: newPostContent.trim(),
        audienceScope: newPostScope
      });

      if (res?.data) {
        setPosts((prev) => [res.data, ...prev]);
        setNewPostContent("");
        setNewPostTitle("");
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleToggleReaction = async (postId: string, type: "LIKE" | "LOVE" | "CELEBRATE") => {
    // Optimistic reaction counter update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const currentCount = p._count?.reactions || 0;
        return {
          ...p,
          _count: {
            ...p._count,
            comments: p._count?.comments || 0,
            reactions: currentCount + 1
          }
        };
      })
    );

    await togglePostReactionAction(postId, type);
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText("");

    const res: any = await addPostCommentAction(postId, text);
    if (res?.data) {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const comments = p.comments ? [res.data, ...p.comments] : [res.data];
          return {
            ...p,
            comments,
            _count: {
              ...p._count,
              reactions: p._count?.reactions || 0,
              comments: (p._count?.comments || 0) + 1
            }
          };
        })
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Share2 className="w-6 h-6 text-teal-400" />
            Muro de Publicaciones Corporativas
          </h1>
          <p className="text-sm text-slate-400">
            Comunícate con toda la organización, comparte logros e interactúa con los equipos.
          </p>
        </div>
      </div>

      {/* ── Create Post Box ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <form onSubmit={handleCreatePost} className="space-y-4">
          <input
            type="text"
            placeholder="Título del anuncio o iniciativa (opcional)..."
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 transition-all font-medium"
          />

          <textarea
            rows={3}
            placeholder={`¿Qué hay de nuevo hoy, ${currentUserName}? Comparte novedades con el equipo...`}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 transition-all resize-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Audiencia:</label>
              <select
                value={newPostScope}
                onChange={(e: any) => setNewPostScope(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
              >
                <option value="COMPANY_WIDE">Toda la Organización</option>
                <option value="DEPARTMENT">Mi Departamento</option>
                <option value="CONFIDENTIAL_MANAGEMENT">Confidencial Directiva</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isPublishing || !newPostContent.trim()}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isPublishing ? "Publicando..." : "Publicar"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── Feed Stream ── */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 space-y-2">
            <Share2 className="w-10 h-10 mx-auto stroke-1 text-slate-600" />
            <p className="text-base font-medium">Aún no hay publicaciones en el muro.</p>
            <p className="text-xs">¡Sé el primero en compartir una novedad corporativa!</p>
          </div>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className={`bg-slate-900/80 border rounded-2xl p-6 shadow-lg backdrop-blur-sm transition-all ${
                post.isPinned
                  ? "border-teal-500/40 bg-teal-950/10 shadow-[0_0_15px_-3px_rgba(20,184,166,0.15)]"
                  : "border-slate-800 hover:border-slate-700/80"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/20 to-teal-900/40 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-sm">
                    {post.authorName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">
                        {post.authorName}
                      </span>
                      {post.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-medium">
                          <Pin className="w-3 h-3" /> Fijado
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] px-2 py-1 rounded-md bg-slate-800 text-slate-400 font-mono">
                  {post.audienceScope === "COMPANY_WIDE" ? "Global" : post.audienceScope}
                </span>
              </div>

              {/* Title & Body */}
              {post.title && (
                <h3 className="text-base font-bold text-white mb-2 leading-snug">
                  {post.title}
                </h3>
              )}
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line mb-4">
                {post.content}
              </p>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleReaction(post.id, "LIKE")}
                    className="flex items-center gap-1.5 hover:text-teal-400 transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{post._count?.reactions || 0} Reacciones</span>
                  </button>

                  <button
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 hover:text-teal-400 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post._count?.comments || post.comments?.length || 0} Comentarios</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{post.viewCount || 0} vistas</span>
                </div>
              </div>

              {/* ── Comments Section ── */}
              {activeCommentPostId === post.id && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                  {/* Comments Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Escribe una respuesta o comentario..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!commentText.trim()}
                      className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-semibold text-xs flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Responder</span>
                    </button>
                  </div>

                  {/* Comments List */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {post.comments.map((comment: any) => (
                        <div key={comment.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-300">{comment.authorName}</span>
                            <span className="text-[10px] text-slate-600">
                              {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-slate-200">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
