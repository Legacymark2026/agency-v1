"use client";

import { useState } from "react";
import {
  Share2, MessageSquare, ThumbsUp, Heart, Sparkles, Send,
  Pin, Lock, Eye, MoreHorizontal, Image as ImageIcon, Tag,
  Megaphone, Award, BarChart2, Lightbulb, CheckCircle2,
  Filter, Search, Smile, HelpCircle, Flame
} from "lucide-react";
import {
  createEnterprisePostAction,
  togglePostReactionAction,
  addPostCommentAction,
  voteOnPollAction
} from "@/actions/feed.actions";

interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorRole?: string | null;
  title?: string | null;
  content: string;
  category?: "GENERAL" | "OFFICIAL_ANNOUNCEMENT" | "KUDOS_RECOGNITION" | "LIVE_POLL" | "INNOVATION_IDEA";
  mediaUrls: string[];
  audienceScope: "COMPANY_WIDE" | "DEPARTMENT" | "CONFIDENTIAL_MANAGEMENT";
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  pollQuestion?: string | null;
  pollOptions?: PollOption[] | null;
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
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Form State
  const [activeCategory, setActiveCategory] = useState<"GENERAL" | "OFFICIAL_ANNOUNCEMENT" | "KUDOS_RECOGNITION" | "LIVE_POLL" | "INNOVATION_IDEA">("GENERAL");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostScope, setNewPostScope] = useState<"COMPANY_WIDE" | "DEPARTMENT" | "CONFIDENTIAL_MANAGEMENT">("COMPANY_WIDE");
  const [newPostTags, setNewPostTags] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Comments State
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && activeCategory !== "LIVE_POLL") return;
    if (activeCategory === "LIVE_POLL" && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) return;

    setIsPublishing(true);
    try {
      const tagsArray = newPostTags
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      let formattedPollOptions: PollOption[] | undefined;
      if (activeCategory === "LIVE_POLL") {
        formattedPollOptions = pollOptions
          .filter(o => o.trim())
          .map((text, idx) => ({
            id: 'opt-' + idx + '-' + Date.now(),
            text: text.trim(),
            votes: 0,
            voters: []
          }));
      }

      const res: any = await createEnterprisePostAction({
        title: newPostTitle.trim() || undefined,
        content: newPostContent.trim() || (pollQuestion ? "Encuesta: " + pollQuestion : "Novedad corporativa"),
        category: activeCategory,
        audienceScope: newPostScope,
        tags: tagsArray,
        isPinned: activeCategory === "OFFICIAL_ANNOUNCEMENT",
        pollQuestion: activeCategory === "LIVE_POLL" ? pollQuestion.trim() : undefined,
        pollOptions: formattedPollOptions
      });

      const createdPost = res?.data?.data || (res?.data?.id ? res?.data : (res?.id ? res : null));
      if (createdPost && createdPost.id) {
        setPosts((prev) => [createdPost, ...prev]);
        setNewPostContent("");
        setNewPostTitle("");
        setNewPostTags("");
        setPollQuestion("");
        setPollOptions(["", ""]);
        setActiveCategory("GENERAL");
      } else if (res?.error) {
        alert("Error al publicar: " + res.error);
      }
    } catch (err: any) {
      console.error("Error creating post:", err);
      alert("Error al crear publicación: " + (err.message || "Error desconocido"));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleToggleReaction = async (postId: string, type: "LIKE" | "LOVE" | "CELEBRATE") => {
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

  const handleVote = async (postId: string, optionId: string) => {
    // Optimistic UI update for vote
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId || !p.pollOptions) return p;
        const updated = p.pollOptions.map((opt) => {
          const voters = (opt.voters || []).filter(v => v !== currentUserId);
          if (opt.id === optionId) {
            voters.push(currentUserId);
          }
          return { ...opt, voters, votes: voters.length };
        });
        return { ...p, pollOptions: updated };
      })
    );

    await voteOnPollAction(postId, optionId);
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

  const filteredPosts = posts.filter((p) => {
    if (selectedFilter !== "ALL" && p.category !== selectedFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchContent = p.content?.toLowerCase().includes(q);
      const matchAuthor = p.authorName?.toLowerCase().includes(q);
      const matchTags = p.tags?.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchContent || matchAuthor || matchTags;
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              Intranet & Social Enterprise
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-2 flex items-center gap-2.5">
            Muro de Publicaciones Corporativas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Canal oficial para anuncios estratégicos, reconocimientos, encuestas y colaboración en tiempo real.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por tema o tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-all"
          />
        </div>
      </div>

      {/* ── Create Post Box ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
        {/* Category Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setActiveCategory("GENERAL")}
            className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ' + (
              activeCategory === "GENERAL"
                ? "bg-slate-800 text-teal-400 border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" /> General
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("OFFICIAL_ANNOUNCEMENT")}
            className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ' + (
              activeCategory === "OFFICIAL_ANNOUNCEMENT"
                ? "bg-indigo-950/60 text-indigo-300 border border-indigo-500/40"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Megaphone className="w-3.5 h-3.5 text-indigo-400" /> Comunicado Oficial
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("KUDOS_RECOGNITION")}
            className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ' + (
              activeCategory === "KUDOS_RECOGNITION"
                ? "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" /> Reconocimiento (Kudos)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("LIVE_POLL")}
            className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ' + (
              activeCategory === "LIVE_POLL"
                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" /> Encuesta en Vivo
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("INNOVATION_IDEA")}
            className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ' + (
              activeCategory === "INNOVATION_IDEA"
                ? "bg-purple-950/60 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Lightbulb className="w-3.5 h-3.5 text-purple-400" /> Idea / Innovación
          </button>
        </div>

        <form onSubmit={handleCreatePost} className="space-y-3">
          <input
            type="text"
            placeholder={
              activeCategory === "OFFICIAL_ANNOUNCEMENT"
                ? "Título del comunicado oficial..."
                : activeCategory === "KUDOS_RECOGNITION"
                ? "Ej: ¡Felicitaciones al equipo de Operaciones por el hito Q3!"
                : "Título de la publicación (opcional)..."
            }
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 transition-all font-medium"
          />

          <textarea
            rows={3}
            placeholder={
              activeCategory === "KUDOS_RECOGNITION"
                ? "Dedica unas palabras destacando el esfuerzo, logro o valor demostrado..."
                : '¿Qué novedad deseas compartir con la organización, ' + currentUserName + '?'
            }
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 transition-all resize-none"
          />

          {/* Poll Builder If Category is LIVE_POLL */}
          {activeCategory === "LIVE_POLL" && (
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <BarChart2 className="w-4 h-4" />
                Configurar Encuesta en Vivo
              </div>
              <input
                type="text"
                placeholder="Pregunta de la votación..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="space-y-2">
                {pollOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={'Opción ' + (idx + 1) + '...'}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...pollOptions];
                      updated[idx] = e.target.value;
                      setPollOptions(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ""])}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                + Añadir otra opción
              </button>
            </div>
          )}

          {/* Tags & Scope Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Tags separados por coma (ej. finanzas, q4, logro)..."
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 w-60 placeholder-slate-600 focus:outline-none focus:border-teal-500"
              />

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
              disabled={isPublishing || (!newPostContent.trim() && !pollQuestion.trim())}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isPublishing ? "Publicando..." : "Publicar en Muro"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── Category Filters Rail ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedFilter("ALL")}
          className={'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ' + (
            selectedFilter === "ALL"
              ? "bg-slate-800 text-white border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          Todas las publicaciones ({posts.length})
        </button>
        <button
          onClick={() => setSelectedFilter("OFFICIAL_ANNOUNCEMENT")}
          className={'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ' + (
            selectedFilter === "OFFICIAL_ANNOUNCEMENT"
              ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Megaphone className="w-3.5 h-3.5 text-indigo-400" /> Comunicados
        </button>
        <button
          onClick={() => setSelectedFilter("LIVE_POLL")}
          className={'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ' + (
            selectedFilter === "LIVE_POLL"
              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <BarChart2 className="w-3.5 h-3.5 text-emerald-400" /> Encuestas
        </button>
        <button
          onClick={() => setSelectedFilter("KUDOS_RECOGNITION")}
          className={'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ' + (
            selectedFilter === "KUDOS_RECOGNITION"
              ? "bg-amber-600/30 text-amber-300 border border-amber-500/50"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" /> Reconocimientos
        </button>
        <button
          onClick={() => setSelectedFilter("INNOVATION_IDEA")}
          className={'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ' + (
            selectedFilter === "INNOVATION_IDEA"
              ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Lightbulb className="w-3.5 h-3.5 text-purple-400" /> Ideas
        </button>
      </div>

      {/* ── Feed Stream ── */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 space-y-2">
            <Share2 className="w-10 h-10 mx-auto stroke-1 text-slate-600" />
            <p className="text-base font-medium">No hay publicaciones en esta categoría.</p>
            <p className="text-xs">¡Sé el primero en iniciar la conversación!</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const totalVotes = post.pollOptions?.reduce((acc, opt) => acc + (opt.votes || 0), 0) || 0;
            const hasVotedAny = post.pollOptions?.some(opt => opt.voters?.includes(currentUserId));

            return (
              <article
                key={post.id}
                className={'bg-slate-900/80 border rounded-2xl p-6 shadow-lg backdrop-blur-sm transition-all ' + (
                  post.category === "OFFICIAL_ANNOUNCEMENT" || post.isPinned
                    ? "border-indigo-500/40 bg-indigo-950/10 shadow-[0_0_20px_-3px_rgba(99,102,241,0.15)]"
                    : post.category === "KUDOS_RECOGNITION"
                    ? "border-amber-500/30 bg-amber-950/10"
                    : post.category === "LIVE_POLL"
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : "border-slate-800 hover:border-slate-700/80"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/20 to-indigo-900/40 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-sm">
                      {post.authorName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          {post.authorName}
                        </span>
                        <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80">
                          {post.authorRole || "Colaborador"}
                        </span>
                        {post.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                            <Pin className="w-3 h-3" /> Fijado
                          </span>
                        )}
                        {post.category === "OFFICIAL_ANNOUNCEMENT" && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                            <Megaphone className="w-3 h-3" /> Comunicado
                          </span>
                        )}
                        {post.category === "KUDOS_RECOGNITION" && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                            <Award className="w-3 h-3" /> Kudos
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

                {/* ── Poll Rendering If Active ── */}
                {post.pollOptions && post.pollOptions.length > 0 && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 my-4 space-y-2.5">
                    {post.pollQuestion && (
                      <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4 text-emerald-400" />
                        {post.pollQuestion}
                      </div>
                    )}
                    {post.pollOptions.map((opt) => {
                      const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                      const userVotedThis = opt.voters?.includes(currentUserId);

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleVote(post.id, opt.id)}
                          className={'w-full p-2.5 rounded-lg border text-left text-xs transition-all relative overflow-hidden group ' + (
                            userVotedThis
                              ? 'border-emerald-500 bg-emerald-950/30 text-white'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300'
                          )}
                        >
                          {/* Progress Bar Fill */}
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-emerald-500/15 transition-all duration-500"
                            style={{ width: pct + '%' }}
                          />
                          <div className="relative flex items-center justify-between z-10">
                            <span className="flex items-center gap-1.5 font-medium">
                              {userVotedThis && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                              {opt.text}
                            </span>
                            <span className="font-mono font-bold text-[11px] text-slate-400">
                              {pct}% ({opt.votes})
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    <div className="text-[10px] text-slate-500 text-right pt-1">
                      Total votos emitidos: {totalVotes}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {post.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/60 text-slate-300 text-[11px] font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleReaction(post.id, "LIKE")}
                      className="flex items-center gap-1.5 hover:text-teal-400 transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{post._count?.reactions || 0} Reacciones</span>
                    </button>

                    <button
                      onClick={() => handleToggleReaction(post.id, "CELEBRATE")}
                      className="flex items-center gap-1 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <span>👏</span>
                    </button>

                    <button
                      onClick={() => handleToggleReaction(post.id, "LOVE")}
                      className="flex items-center gap-1 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <span>❤️</span>
                    </button>

                    <button
                      onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                      className="flex items-center gap-1.5 hover:text-teal-400 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
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
                        placeholder="Escribe una respuesta o comentario corporativo..."
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
            );
          })
        )}
      </div>
    </div>
  );
}
