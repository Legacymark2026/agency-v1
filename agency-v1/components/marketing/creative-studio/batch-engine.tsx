"use client";

import { useState } from "react";
import { Sparkles, Loader2, Wand2, CheckCircle, XCircle, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { generateBatchVariations, generateCreativeBrief, BatchVariationStyle } from "@/actions/marketing/creative-batch";
import Image from "next/image";

// ─── Brief Wizard ─────────────────────────────────────────────────────────────
export function CreativeBriefWizard({ campaignId, onImageReady }: { campaignId?: string; onImageReady?: (url: string) => void }) {
    const [description, setDescription] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [brief, setBrief] = useState<any>(null);
    const [batchResults, setBatchResults] = useState<any[]>([]);
    const [selectedStyle, setSelectedStyle] = useState<BatchVariationStyle>("BOLD");

    const STYLES: { key: BatchVariationStyle; emoji: string; label: string }[] = [
        { key: "MINIMALIST", emoji: "⬜", label: "Minimalista" },
        { key: "BOLD", emoji: "🔥", label: "Bold" },
        { key: "LIFESTYLE", emoji: "📷", label: "Lifestyle" },
        { key: "TYPOGRAPHIC", emoji: "🔤", label: "Tipográfico" },
        { key: "CINEMATIC", emoji: "🎬", label: "Cinematográfico" },
    ];

    const handleGenerateBrief = async () => {
        if (!description.trim()) { toast.error("Describe tu campaña primero."); return; }
        setIsGenerating(true);
        setBrief(null);
        setBatchResults([]);

        try {
            const res = await generateCreativeBrief(description, ["FACEBOOK_ADS", "INSTAGRAM", "TIKTOK"]);
            if (!res.success) { toast.error(res.error); return; }
            setBrief(res.brief);
            toast.success("Brief generado. Ahora creando variaciones...");

            // Auto-launch batch
            const batchRes = await generateBatchVariations({
                basePrompt: res.brief.imagePrompt,
                campaignId,
                platform: "FACEBOOK_ADS",
                aspectRatio: "1:1",
                styles: ["MINIMALIST", "BOLD", "LIFESTYLE", "TYPOGRAPHIC", "CINEMATIC"],
            });
            setBatchResults(batchRes);

            const firstSuccess = batchRes.find(r => r.success);
            if (firstSuccess?.url && onImageReady) onImageReady(firstSuccess.url);
            toast.success(`${batchRes.filter(r => r.success).length}/5 variaciones generadas.`);
        } catch (e: any) {
            toast.error(e.message ?? "Error generando brief.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSingleBatch = async () => {
        if (!brief?.imagePrompt) { toast.error("Genera el brief primero."); return; }
        setIsGenerating(true);
        try {
            const batchRes = await generateBatchVariations({
                basePrompt: brief.imagePrompt,
                campaignId,
                platform: "FACEBOOK_ADS",
                aspectRatio: "1:1",
                styles: [selectedStyle],
            });
            const result = batchRes[0];
            if (result.success && result.url) {
                setBatchResults(prev => [...prev.filter(r => r.style !== selectedStyle), result]);
                if (onImageReady) onImageReady(result.url);
                toast.success(`Variación ${selectedStyle} regenerada.`);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Brief Input ── */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <Wand2 className="text-indigo-400" size={16} />
                    <Label className="text-xs font-mono uppercase tracking-widest text-indigo-300">Brief → Creativo en 1 Click</Label>
                </div>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    placeholder='Ej: "Quiero anunciar mi app de fitness para mujeres de 25-40 años en Instagram y Meta. Tone sofisticado y motivador. CTA: Descarga gratis."'
                    className="w-full bg-slate-950/70 border border-indigo-500/30 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <Button
                    onClick={handleGenerateBrief}
                    disabled={isGenerating || !description.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(99,102,241,0.3)] h-10"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {isGenerating ? "Generando brief y 5 variaciones..." : "Generar Brief + 5 Variaciones AI"}
                </Button>
            </div>

            {/* ── Brief Result ── */}
            {brief && (
                <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-teal-400">Brief Generado por IA</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase font-mono">Headline</p>
                            <p className="text-sm font-bold text-slate-100">{brief.headline}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase font-mono">CTA</p>
                            <p className="text-sm font-bold text-emerald-400">{brief.cta}</p>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase font-mono">Subheadline</p>
                            <p className="text-xs text-slate-300">{brief.subheadline}</p>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase font-mono">Audiencia</p>
                            <p className="text-xs text-slate-400">{brief.targetAudience}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase font-mono">Tono</p>
                            <span className="text-[11px] bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20">{brief.tone}</span>
                        </div>
                        {brief.colorPalette && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-500 uppercase font-mono">Paleta</p>
                                <div className="flex gap-1">
                                    {brief.colorPalette.map((c: string) => (
                                        <div key={c} className="w-5 h-5 rounded border border-slate-700" style={{ backgroundColor: c }} title={c} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {brief.copy && (
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                            <p className="text-[10px] text-slate-500 uppercase font-mono">Copy por Plataforma</p>
                            {Object.entries(brief.copy).map(([plat, text]) => (
                                <div key={plat} className="bg-slate-950 rounded-lg p-3">
                                    <p className="text-[10px] font-mono text-teal-400 mb-1">{plat}</p>
                                    <p className="text-xs text-slate-300">{text as string}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Batch Results ── */}
            {batchResults.length > 0 && (
                <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Variaciones Generadas</h3>
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedStyle}
                                onChange={e => setSelectedStyle(e.target.value as BatchVariationStyle)}
                                className="bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 px-2 py-1 outline-none"
                            >
                                {STYLES.map(s => <option key={s.key} value={s.key} className="bg-slate-900">{s.emoji} {s.label}</option>)}
                            </select>
                            <Button size="sm" variant="outline" onClick={handleSingleBatch} disabled={isGenerating} className="h-7 text-xs border-slate-700 text-slate-400 hover:text-white gap-1">
                                <RefreshCw size={11} /> Regen.
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {STYLES.map(styleInfo => {
                            const result = batchResults.find(r => r.style === styleInfo.key);
                            return (
                                <div key={styleInfo.key} className={`relative group rounded-xl overflow-hidden border aspect-square ${result?.success ? "border-slate-700 hover:border-teal-500/50" : "border-slate-800"} transition-all`}>
                                    {result?.success && result.url ? (
                                        <>
                                            <Image src={result.url} alt={styleInfo.label} fill className="object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                <p className="text-xs font-mono font-bold text-white">{styleInfo.emoji} {styleInfo.label}</p>
                                                <Button
                                                    size="sm"
                                                    className="mt-2 h-7 text-[10px] bg-teal-600 hover:bg-teal-500 font-mono"
                                                    onClick={() => { if (onImageReady) onImageReady(result.url!); toast.success("Imagen seleccionada."); }}
                                                >
                                                    Usar esta
                                                </Button>
                                            </div>
                                        </>
                                    ) : result && !result.success ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-center p-2">
                                            <XCircle className="text-red-400 mb-1" size={20} />
                                            <p className="text-[10px] text-slate-500 font-mono">{styleInfo.label}</p>
                                            <p className="text-[9px] text-red-400 mt-1">Error</p>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50">
                                            <Loader2 className="text-slate-600 animate-spin" size={20} />
                                            <p className="text-[10px] text-slate-600 font-mono mt-2">{styleInfo.label}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
