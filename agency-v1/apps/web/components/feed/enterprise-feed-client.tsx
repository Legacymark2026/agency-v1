"use client";

import { useState, useRef } from "react";
import {
  Share2, MessageSquare, ThumbsUp, Heart, Sparkles, Send,
  Pin, Lock, Eye, MoreHorizontal, Image as ImageIcon, Video,
  Music, FileText, X, ChevronLeft, ChevronRight, Download,
  Megaphone, Award, BarChart2, Lightbulb, CheckCircle2,
  Filter, Search, Smile, HelpCircle, Flame, Paperclip, Loader2,
  ExternalLink, Play
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

interface MediaItem {
  url: string;
  type: "image" | "video" | "audio" | "document" | "other";
  name?: string;
  sizeBytes?: number;
  mimeType?: string;
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
  mediaUrls: any; // string[] or MediaItem[] or string
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

function parseMediaItems(rawMedia: any): MediaItem[] {
  if (!rawMedia) return [];
  let parsed = rawMedia;
  if (typeof rawMedia === "string") {
    try {
      parsed = JSON.parse(rawMedia);
    } catch {
      parsed = [rawMedia];
    }
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item) => {
    if (typeof item === "string") {
      const url = item;
      const cleanUrl = url.split("?")[0].toLowerCase();
      const ext = cleanUrl.split(".").pop() || "";
      let type: MediaItem["type"] = "document";

      if (["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"].includes(ext) || cleanUrl.includes("/image/")) {
        type = "image";
      } else if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext) || cleanUrl.includes("/video/")) {
        type = "video";
      } else if (["mp3", "wav", "ogg", "m4a", "aac", "opus", "flac"].includes(ext) || cleanUrl.includes("/audio/")) {
        type = "audio";
      } else if (["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "zip", "rar"].includes(ext) || cleanUrl.includes("/document/")) {
        type = "document";
      }

      const filename = url.split("/").pop()?.replace(/^\d+_[a-f0-9]+_/, "") || "Archivo adjunto";
      return { url, type, name: filename };
    }
    return item as MediaItem;
  });
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ─── Sub-Component: Post Media Renderer (Carruseles, Videos, Audios, Docs) ───
function PostMediaRenderer({ mediaUrls }: { mediaUrls: any }) {
  const mediaItems = parseMediaItems(mediaUrls);
  const [carouselIndex, setCarouselIndex] = useState(0);

  if (!mediaItems || mediaItems.length === 0) return null;

  const images = mediaItems.filter((m) => m.type === "image");
  const videos = mediaItems.filter((m) => m.type === "video");
  const audios = mediaItems.filter((m) => m.type === "audio");
  const docs = mediaItems.filter((m) => m.type === "document" || m.type === "other");

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3.5 my-3.5">
      {/* ── 1. Carrusel interactivo para Imágenes ── */}
      {images.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 group">
          <div className="flex items-center justify-center bg-slate-950/60 max-h-[500px]">
            {/* Imagen principal activa */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[carouselIndex]?.url}
              alt={images[carouselIndex]?.name || `Imagen ${carouselIndex + 1}`}
              className="w-full max-h-[480px] object-contain transition-all duration-300"
              loading="lazy"
            />
          </div>

          {/* Flechas de Navegación del Carrusel (si hay más de 1 imagen) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 shadow-lg cursor-pointer"
                title="Imagen anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 shadow-lg cursor-pointer"
                title="Siguiente imagen"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Indicador de posición / Contador de Carrusel */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/85 border border-slate-700/80 text-white text-[11px] font-mono tracking-wider flex items-center gap-1.5 shadow-md backdrop-blur-md">
                <span>{carouselIndex + 1}</span>
                <span className="text-slate-500">/</span>
                <span>{images.length}</span>
              </div>
            </>
          )}

          {/* Miniaturas tipo carrusel inferior si son varias */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 p-2 bg-slate-950/90 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCarouselIndex(idx)}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                    idx === carouselIndex ? "border-teal-400 opacity-100 scale-105" : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 2. Reproductor de Videos ── */}
      {videos.map((vid, idx) => (
        <div key={idx} className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
          <video
            src={vid.url}
            controls
            preload="metadata"
            className="w-full max-h-[460px] object-contain rounded-xl"
          >
            Tu navegador no soporta reproducción de video.
          </video>
          {vid.name && (
            <div className="px-3 py-1.5 bg-slate-900/60 text-[11px] text-slate-400 font-mono flex items-center gap-1.5 border-t border-slate-800/60">
              <Play className="w-3 h-3 text-teal-400" />
              <span className="truncate">{vid.name}</span>
            </div>
          )}
        </div>
      ))}

      {/* ── 3. Reproductor de Audios (Notas de voz / Podcasts internos) ── */}
      {audios.map((aud, idx) => (
        <div
          key={idx}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800/80 shadow-md space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-2 text-teal-400">
              <Music className="w-4 h-4" />
              <span className="font-semibold text-white truncate max-w-xs">{aud.name || `Audio corporativo ${idx + 1}`}</span>
            </div>
            {aud.sizeBytes && <span className="text-[10px] text-slate-500 font-mono">{formatBytes(aud.sizeBytes)}</span>}
          </div>
          <audio src={aud.url} controls className="w-full h-10 rounded-lg accent-teal-500">
            Tu navegador no soporta el reproductor de audio.
          </audio>
        </div>
      ))}

      {/* ── 4. Tarjetas Descargables para Documentos (PDF, Word, Excel, etc.) ── */}
      {docs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {docs.map((doc, idx) => (
            <a
              key={idx}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-teal-300 transition-colors">
                    {doc.name || `Documento_${idx + 1}`}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {doc.sizeBytes ? formatBytes(doc.sizeBytes) : "Documento adjunto"}
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-500 group-hover:text-teal-400 flex-shrink-0 transition-colors" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Feed Client Component ───
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

  // Media Attachment State
  const [attachedMedia, setAttachedMedia] = useState<MediaItem[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Hidden File Inputs Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Comments State
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // ── Subir Archivos al Servidor ──
  const handleFilesUpload = async (files: FileList | null, expectedType: MediaItem["type"]) => {
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);
    setUploadError(null);

    try {
      const uploadedList: MediaItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("metadata", JSON.stringify({ name: file.name }));

        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error || `Error subiendo ${file.name}`);
        }

        const data = await response.json();
        if (data.success && data.asset?.url) {
          uploadedList.push({
            url: data.asset.url,
            type: data.asset.type || expectedType,
            name: file.name,
            sizeBytes: file.size,
            mimeType: file.type
          });
        }
      }

      setAttachedMedia((prev) => [...prev, ...uploadedList]);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Error al subir archivo adjunto");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const removeMedia = (index: number) => {
    setAttachedMedia((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && activeCategory !== "LIVE_POLL" && attachedMedia.length === 0) return;
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
        content: newPostContent.trim() || (pollQuestion ? "Encuesta: " + pollQuestion : (attachedMedia.length > 0 ? "Archivo adjunto compartido" : "Novedad corporativa")),
        category: activeCategory,
        mediaUrls: attachedMedia as any,
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
        setAttachedMedia([]);
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
      {/* ── Hidden File Inputs para Carga Multimedia ── */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFilesUpload(e.target.files, "image")}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFilesUpload(e.target.files, "video")}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => handleFilesUpload(e.target.files, "audio")}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar"
        multiple
        className="hidden"
        onChange={(e) => handleFilesUpload(e.target.files, "document")}
      />

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
            Canal oficial para anuncios estratégicos, fotos, videos, audios, documentos y encuestas en tiempo real.
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

          {/* ── Poll Builder If Category is LIVE_POLL ── */}
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
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
              >
                + Añadir otra opción
              </button>
            </div>
          )}

          {/* ── Vista Previa de Archivos Adjuntos (con chip de eliminación) ── */}
          {attachedMedia.length > 0 && (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Archivos adjuntos ({attachedMedia.length})</span>
                <span className="text-[10px] text-teal-400">
                  {attachedMedia.filter(m => m.type === "image").length > 1 ? "Se publicará como Carrusel interactivo" : ""}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {attachedMedia.map((media, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 group"
                  >
                    {media.type === "image" && <ImageIcon className="w-3.5 h-3.5 text-sky-400" />}
                    {media.type === "video" && <Video className="w-3.5 h-3.5 text-purple-400" />}
                    {media.type === "audio" && <Music className="w-3.5 h-3.5 text-emerald-400" />}
                    {media.type === "document" && <FileText className="w-3.5 h-3.5 text-amber-400" />}
                    <span className="truncate max-w-[140px] font-mono text-[11px]">{media.name}</span>
                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="p-1 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-colors text-slate-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado de Carga o Error Multimedia */}
          {isUploadingMedia && (
            <div className="flex items-center gap-2 text-xs text-teal-400 p-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Subiendo archivo al almacenamiento corporativo...</span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center justify-between text-xs text-rose-400 p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
              <span>{uploadError}</span>
              <button onClick={() => setUploadError(null)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Barra de Herramientas Multimedia & Tags ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
            {/* Botones de Selección Multimedia */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-sky-400 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title="Subir imágenes (1 o varias para carrusel)"
              >
                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Foto / Carrusel</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-purple-400 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title="Subir video (MP4, WebM, MOV)"
              >
                <Video className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Video</span>
              </button>

              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title="Subir audio o nota de voz (MP3, WAV, OGG, Opus)"
              >
                <Music className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Audio</span>
              </button>

              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title="Adjuntar documentos (PDF, Excel, Word, ZIP)"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Documento</span>
              </button>
            </div>

            {/* Tags & Scope Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Tags (ej. finanzas, q4)..."
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 w-40 placeholder-slate-600 focus:outline-none focus:border-teal-500"
              />

              <select
                value={newPostScope}
                onChange={(e: any) => setNewPostScope(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-teal-500"
              >
                <option value="COMPANY_WIDE">Toda la Organización</option>
                <option value="DEPARTMENT">Mi Departamento</option>
                <option value="CONFIDENTIAL_MANAGEMENT">Confidencial Directiva</option>
              </select>

              <button
                type="submit"
                disabled={isPublishing || isUploadingMedia || (!newPostContent.trim() && !pollQuestion.trim() && attachedMedia.length === 0)}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20 ml-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isPublishing ? "Publicando..." : "Publicar"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Category Filters Rail ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedFilter("ALL")}
          className={'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ' + (
            selectedFilter === "ALL"
              ? "bg-slate-800 text-white border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          Todas las publicaciones ({posts.length})
        </button>
        <button
          onClick={() => setSelectedFilter("OFFICIAL_ANNOUNCEMENT")}
          className={'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ' + (
            selectedFilter === "OFFICIAL_ANNOUNCEMENT"
              ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Megaphone className="w-3.5 h-3.5 text-indigo-400" /> Comunicados
        </button>
        <button
          onClick={() => setSelectedFilter("LIVE_POLL")}
          className={'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ' + (
            selectedFilter === "LIVE_POLL"
              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <BarChart2 className="w-3.5 h-3.5 text-emerald-400" /> Encuestas
        </button>
        <button
          onClick={() => setSelectedFilter("KUDOS_RECOGNITION")}
          className={'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ' + (
            selectedFilter === "KUDOS_RECOGNITION"
              ? "bg-amber-600/30 text-amber-300 border border-amber-500/50"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" /> Reconocimientos
        </button>
        <button
          onClick={() => setSelectedFilter("INNOVATION_IDEA")}
          className={'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ' + (
            selectedFilter === "INNOVATION_IDEA"
              ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Lightbulb className="w-3.5 h-3.5 text-purple-400" /> Ideas
        </button>
      </div>

      {/* ── Posts Feed Stream ── */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <Share2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No hay publicaciones corporativas en esta categoría.</p>
            <p className="text-xs text-slate-600 mt-1">Sé el primero en compartir un comunicado, imagen, video o idea.</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const totalVotes = post.pollOptions?.reduce((acc, opt) => acc + (opt.votes || 0), 0) || 0;

            return (
              <article
                key={post.id}
                className={'bg-slate-900/80 border rounded-2xl p-5 shadow-lg backdrop-blur-md transition-all ' + (
                  post.isPinned
                    ? "border-indigo-500/40 shadow-indigo-500/5"
                    : post.category === "OFFICIAL_ANNOUNCEMENT"
                    ? "border-indigo-500/30"
                    : post.category === "KUDOS_RECOGNITION"
                    ? "border-amber-500/30"
                    : post.category === "LIVE_POLL"
                    ? "border-emerald-500/30"
                    : post.category === "INNOVATION_IDEA"
                    ? "border-purple-500/30"
                    : "border-slate-800"
                )}
              >
                {/* ── Post Header ── */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-sm">
                      {post.authorName?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {post.authorName}
                        </span>
                        {post.authorRole && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-teal-400 font-medium">
                            {post.authorRole}
                          </span>
                        )}
                        {post.isPinned && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
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
                {post.content && (
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line mb-3">
                    {post.content}
                  </p>
                )}

                {/* ── Media Rendering (Imágenes, Carruseles, Videos, Audios, Docs) ── */}
                <PostMediaRenderer mediaUrls={post.mediaUrls} />

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
                          className={'w-full p-2.5 rounded-lg border text-left text-xs transition-all relative overflow-hidden group cursor-pointer ' + (
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
                        className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-semibold text-xs flex items-center gap-1 cursor-pointer"
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
