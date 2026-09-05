"use client";

import Link from "next/link";
import { 
  Share2, Pin, MessageSquare, ThumbsUp, ArrowRight, 
  Sparkles, ShieldCheck, Lock, Users, Clock
} from "lucide-react";

interface PostItem {
  id: string;
  authorName: string;
  title?: string | null;
  content: string;
  audienceScope: "COMPANY_WIDE" | "DEPARTMENT" | "CONFIDENTIAL_MANAGEMENT";
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  _count?: { comments: number; reactions: number };
}

export function DashboardFeedWidget({
  posts,
  currentUserId
}: {
  posts: PostItem[];
  currentUserId?: string;
}) {
  return (
    <div className="ds-card p-6 relative overflow-hidden group">
      {/* Decorative gradient header bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-950/60 border border-teal-500/30 text-teal-400 shadow-[0_0_15px_-3px_rgba(20,184,166,0.25)]">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Muro de Publicaciones & Comunicados
              </h2>
              <span className="ds-badge ds-badge-teal text-[10px]">
                <Sparkles className="w-2.5 h-2.5" /> En Vivo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Noticias corporativas, avisos de gerencia y anuncios del equipo
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/feed"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-teal-300 bg-teal-950/50 border border-teal-700/50 hover:bg-teal-900/50 hover:border-teal-400 transition-all w-fit group/btn"
        >
          <span>Ir al Muro Completo</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Posts List */}
      <div className="mt-5 space-y-3.5">
        {posts && posts.length > 0 ? (
          posts.slice(0, 4).map((post) => {
            const isCompanyWide = post.audienceScope === "COMPANY_WIDE";
            const isConfidential = post.audienceScope === "CONFIDENTIAL_MANAGEMENT";

            return (
              <div
                key={post.id}
                className={`p-4 rounded-xl border transition-all ${
                  post.isPinned
                    ? "bg-teal-950/20 border-teal-500/40 shadow-[0_0_20px_-5px_rgba(20,184,166,0.15)]"
                    : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                {/* Meta header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-200">
                      {post.authorName}
                    </span>

                    {post.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <Pin className="w-2.5 h-2.5" /> FIJADO
                      </span>
                    )}

                    {isConfidential ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <Lock className="w-2.5 h-2.5" /> Gerencia
                      </span>
                    ) : isCompanyWide ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        <Users className="w-2.5 h-2.5" /> Toda la Empresa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                        Departamento
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(post.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric"
                    })}
                  </span>
                </div>

                {/* Title & Content */}
                {post.title && (
                  <h3 className="text-sm font-bold text-white mb-1">
                    {post.title}
                  </h3>
                )}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-normal">
                  {post.content}
                </p>

                {/* Footer Reactions / Comments count */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 hover:text-teal-300 transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5 text-teal-400" />
                      <span>{post._count?.reactions ?? 0}</span>
                    </span>
                    <span className="flex items-center gap-1.5 hover:text-teal-300 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>{post._count?.comments ?? 0} comentarios</span>
                    </span>
                  </div>

                  <Link
                    href="/dashboard/feed"
                    className="text-teal-400 hover:text-teal-300 font-medium hover:underline text-[11px]"
                  >
                    Ver hilo &rarr;
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/30">
            <Share2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">
              No hay publicaciones recientes en el muro corporativo
            </p>
            <Link
              href="/dashboard/feed"
              className="inline-block mt-3 text-xs text-teal-400 hover:underline font-semibold"
            >
              Publicar el primer comunicado corporativo &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
