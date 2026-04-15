"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, CheckCircle2, X, Plus, Trash2, Loader2, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    addAnnotation,
    resolveAnnotation,
    deleteAnnotation,
    getAnnotations,
} from "@/actions/marketing/creative-collaboration";
import Image from "next/image";

type Annotation = {
    id: string;
    content: string;
    xPercent: number;
    yPercent: number;
    status: string;
    author: { id: string; name: string | null; image: string | null };
    createdAt: Date;
};

export function AnnotationCanvas({
    assetUrl,
    assetId,
    currentUserId,
}: {
    assetUrl: string;
    assetId: string;
    currentUserId: string;
}) {
    const imgRef = useRef<HTMLDivElement>(null);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
    const [draftContent, setDraftContent] = useState("");
    const [activePin, setActivePin] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [addMode, setAddMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getAnnotations(assetId).then(data => {
            setAnnotations(data as unknown as Annotation[]);
            setIsLoading(false);
        });
    }, [assetId]);

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!addMode) return;
        const rect = imgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setPendingPin({ x, y });
        setDraftContent("");
    };

    const submitAnnotation = async () => {
        if (!pendingPin || !draftContent.trim()) return;
        setIsAdding(true);
        const res = await addAnnotation({
            assetId,
            content: draftContent,
            xPercent: pendingPin.x,
            yPercent: pendingPin.y,
        });
        setIsAdding(false);
        if (res.success && res.annotation) {
            setAnnotations(prev => [...prev, res.annotation as unknown as Annotation]);
            setPendingPin(null);
            setDraftContent("");
            setAddMode(false);
            toast.success("Comentario añadido.");
        } else {
            toast.error("No se pudo añadir el comentario.");
        }
    };

    const handleResolve = async (id: string) => {
        await resolveAnnotation(id);
        setAnnotations(prev => prev.map(a => a.id === id ? { ...a, status: "RESOLVED" } : a));
        toast.success("Resolución marcada.");
    };

    const handleDelete = async (id: string) => {
        await deleteAnnotation(id);
        setAnnotations(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="text-teal-400" size={14} />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                        Anotaciones ({annotations.filter(a => a.status === "OPEN").length} abiertas)
                    </span>
                </div>
                <Button
                    size="sm"
                    onClick={() => { setAddMode(!addMode); setPendingPin(null); }}
                    className={`h-7 text-xs font-mono gap-1.5 ${addMode ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"}`}
                >
                    <Pin size={11} /> {addMode ? "Cancelar" : "Añadir Pin"}
                </Button>
            </div>

            {/* Canvas */}
            <div
                ref={imgRef}
                className={`relative w-full aspect-square rounded-xl overflow-hidden border ${addMode ? "border-teal-500/50 cursor-crosshair" : "border-slate-700"} bg-slate-950`}
                onClick={handleImageClick}
            >
                {assetUrl && (
                    <Image src={assetUrl} alt="Asset" fill className="object-contain" draggable={false} />
                )}

                {addMode && (
                    <div className="absolute top-2 left-2 bg-teal-600/80 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-1 rounded-full">
                        Click en la imagen para fijar un comentario
                    </div>
                )}

                {/* Existing pins */}
                {annotations.map((ann, idx) => (
                    <div
                        key={ann.id}
                        style={{ left: `${ann.xPercent}%`, top: `${ann.yPercent}%`, transform: "translate(-50%, -50%)" }}
                        className="absolute z-20"
                        onClick={e => { e.stopPropagation(); setActivePin(activePin === ann.id ? null : ann.id); }}
                    >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all shadow-lg
                            ${ann.status === "RESOLVED"
                                ? "bg-emerald-500 border-emerald-300 text-white"
                                : "bg-slate-900 border-indigo-400 text-indigo-300 hover:scale-110"}`}>
                            {idx + 1}
                        </div>

                        {/* Tooltip */}
                        {activePin === ann.id && (
                            <div className="absolute z-30 top-8 left-1/2 -translate-x-1/2 w-64 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl space-y-2 animate-in fade-in zoom-in-95">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-mono text-teal-400 font-bold">{ann.author.name || "Usuario"}</p>
                                    <div className="flex gap-1">
                                        {ann.status === "OPEN" && (
                                            <button onClick={() => handleResolve(ann.id)} className="text-emerald-400 hover:text-emerald-300 transition">
                                                <CheckCircle2 size={13} />
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(ann.id)} className="text-slate-500 hover:text-red-400 transition">
                                            <Trash2 size={13} />
                                        </button>
                                        <button onClick={() => setActivePin(null)} className="text-slate-500 hover:text-white transition">
                                            <X size={13} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-200">{ann.content}</p>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${ann.status === "RESOLVED" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                                    {ann.status}
                                </span>
                            </div>
                        )}
                    </div>
                ))}

                {/* Pending pin */}
                {pendingPin && (
                    <div
                        style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%`, transform: "translate(-50%, -50%)" }}
                        className="absolute z-30"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-amber-300 animate-pulse shadow-lg" />
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-60 bg-slate-900 border border-amber-500/40 rounded-xl p-3 shadow-2xl space-y-2">
                            <p className="text-[10px] font-mono text-amber-400">Nuevo comentario</p>
                            <textarea
                                value={draftContent}
                                onChange={e => setDraftContent(e.target.value)}
                                rows={2}
                                autoFocus
                                placeholder="Escribe tu comentario..."
                                className="w-full bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 p-2 resize-none focus:outline-none focus:border-amber-500"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={submitAnnotation} disabled={isAdding || !draftContent.trim()} className="flex-1 h-7 text-[10px] bg-amber-600 hover:bg-amber-500 font-mono">
                                    {isAdding ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />} Añadir
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setPendingPin(null)} className="h-7 text-[10px] text-slate-400">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            {annotations.length > 0 && (
                <div className="space-y-2">
                    {annotations.map((ann, idx) => (
                        <div key={ann.id} className={`flex gap-3 p-3 rounded-lg border text-sm transition-all ${ann.status === "RESOLVED" ? "border-slate-800 opacity-50" : "border-slate-700 bg-slate-900/50 hover:border-indigo-500/30"}`}>
                            <div className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${ann.status === "RESOLVED" ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white"}`}>
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-mono text-teal-400">{ann.author.name}</p>
                                    {ann.status === "OPEN" ? (
                                        <button onClick={() => handleResolve(ann.id)} className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                                            <CheckCircle2 size={10} /> Resolver
                                        </button>
                                    ) : (
                                        <span className="text-[10px] font-mono text-emerald-600">✓ Resuelto</span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-300 mt-0.5">{ann.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
