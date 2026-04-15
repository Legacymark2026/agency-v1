"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Plus, CheckCircle2, Loader2, MessageSquare, ExternalLink } from "lucide-react";
import { addAssetAnnotation, getAssetAnnotations, resolveAnnotation } from "@/actions/kanban-archive";

interface Annotation {
  id: string;
  xPercent: number;
  yPercent: number;
  comment: string;
  resolved: boolean;
  timestamp?: number;
  author: { name?: string; firstName?: string; lastName?: string; image?: string };
  createdAt: string;
}

interface AssetProofingProps {
  taskId: string;
  assetUrl: string;
  assetVersion?: string;
  onClose: () => void;
}

export function AssetProofing({ taskId, assetUrl, assetVersion, onClose }: AssetProofingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(assetUrl);

  const loadAnnotations = useCallback(async () => {
    const res = await getAssetAnnotations(taskId, assetUrl);
    if (res.success) setAnnotations(res.data as Annotation[]);
    setLoading(false);
  }, [taskId, assetUrl]);

  useEffect(() => { loadAnnotations(); }, [loadAnnotations]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pending) { setPending(null); return; }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPending({ x, y });
    setComment("");
  };

  const handleSubmit = async () => {
    if (!pending || !comment.trim()) return;
    setSubmitting(true);
    await addAssetAnnotation(taskId, assetUrl, pending.x, pending.y, comment.trim());
    await loadAnnotations();
    setPending(null);
    setComment("");
    setSubmitting(false);
  };

  const handleResolve = async (id: string) => {
    await resolveAnnotation(id);
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  const visible = annotations.filter(a => showResolved || !a.resolved);

  return (
    <div className="fixed inset-0 z-[90] flex bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative m-auto w-full max-w-5xl h-[90vh] bg-slate-950 rounded-2xl border border-slate-800 flex overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Image Panel */}
        <div className="flex-1 relative overflow-hidden bg-slate-900/50">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">Asset Proofing</span>
              {assetVersion && <span className="text-[10px] px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded font-bold">{assetVersion}</span>}
            </div>
            <div className="flex items-center gap-2">
              <a href={assetUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Clickable asset */}
          <div
            ref={containerRef}
            className="absolute inset-0 mt-12 cursor-crosshair overflow-hidden flex items-center justify-center"
            onClick={handleImageClick}
          >
            {isImage ? (
              <img src={assetUrl} alt="Asset" className="max-w-full max-h-full object-contain select-none" draggable={false} />
            ) : (
              <video src={assetUrl} controls className="max-w-full max-h-full" onClick={e => e.stopPropagation()} />
            )}

            {/* Annotation pins */}
            {visible.map((ann, idx) => (
              <div
                key={ann.id}
                className="absolute"
                style={{ left: `${ann.xPercent}%`, top: `${ann.yPercent}%`, transform: "translate(-50%, -50%)" }}
                onMouseEnter={() => setHovered(ann.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={e => { e.stopPropagation(); }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 cursor-pointer transition-all ${
                  ann.resolved
                    ? "bg-teal-500 border-teal-400 text-white"
                    : "bg-red-500 border-red-400 text-white hover:scale-125"
                }`}>
                  {idx + 1}
                </div>
                {hovered === ann.id && (
                  <div className="absolute z-20 left-8 top-0 w-56 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl">
                    <p className="text-xs text-slate-300 leading-relaxed">{ann.comment}</p>
                    <p className="text-[10px] text-slate-600 mt-1">{ann.author?.name || `${ann.author?.firstName} ${ann.author?.lastName}`}</p>
                    {!ann.resolved && (
                      <button onClick={() => handleResolve(ann.id)} className="mt-2 flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300">
                        <CheckCircle2 className="w-3 h-3" /> Marcar resuelto
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Pending pin */}
            {pending && (
              <div
                className="absolute w-6 h-6 rounded-full bg-yellow-500 border-2 border-yellow-400 flex items-center justify-center text-[10px] font-black text-white animate-pulse"
                style={{ left: `${pending.x}%`, top: `${pending.y}%`, transform: "translate(-50%, -50%)" }}
                onClick={e => e.stopPropagation()}
              >
                <Plus className="w-3 h-3" />
              </div>
            )}
          </div>

          {isImage && (
            <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-slate-600 pointer-events-none">
              Click en la imagen para agregar un comentario de revisión
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-400" />
              Revisiones ({visible.length})
            </h3>
            <button onClick={() => setShowResolved(v => !v)} className={`text-[10px] transition-colors ${showResolved ? "text-teal-400" : "text-slate-500"}`}>
              {showResolved ? "Ocultar resueltos" : "Ver resueltos"}
            </button>
          </div>

          {/* Pending annotation form */}
          {pending && (
            <div className="p-3 bg-yellow-500/5 border-b border-yellow-500/20 space-y-2">
              <p className="text-[10px] text-yellow-400 font-medium">Nueva revisión en punto #{annotations.length + 1}</p>
              <textarea
                autoFocus
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Describe el cambio a realizar..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-yellow-500/50 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={() => setPending(null)} className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 transition-colors">Cancelar</button>
                <button onClick={handleSubmit} disabled={!comment.trim() || submitting}
                  className="flex-1 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                  {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Agregar
                </button>
              </div>
            </div>
          )}

          {/* Annotations list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {loading && <div className="p-4 text-center text-slate-500 text-xs"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>}
            {!loading && visible.length === 0 && (
              <div className="p-6 text-center text-slate-600 text-xs">Sin revisiones. Haz click en el asset para agregar una.</div>
            )}
            {visible.map((ann, idx) => (
              <div key={ann.id} className={`p-3 space-y-1 ${ann.resolved ? "opacity-50" : ""}`} onMouseEnter={() => setHovered(ann.id)} onMouseLeave={() => setHovered(null)}>
                <div className="flex items-start gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5 ${ann.resolved ? "bg-teal-500/20 text-teal-400" : "bg-red-500 text-white"}`}>{idx + 1}</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed flex-1">{ann.comment}</p>
                </div>
                <div className="flex items-center justify-between pl-7">
                  <span className="text-[9px] text-slate-600">{ann.author?.name || `${ann.author?.firstName} ${ann.author?.lastName}`}</span>
                  {!ann.resolved && (
                    <button onClick={() => handleResolve(ann.id)} className="text-[9px] text-teal-500 hover:text-teal-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Resolver
                    </button>
                  )}
                  {ann.resolved && <span className="text-[9px] text-teal-500 flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> Resuelto</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
