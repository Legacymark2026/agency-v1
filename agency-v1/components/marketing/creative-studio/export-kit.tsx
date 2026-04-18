"use client";

import { useState } from "react";
import { Package, Download, CheckCircle, Loader2, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateExportKit } from "@/actions/marketing/creative-batch";

const PLATFORM_COLORS: Record<string, string> = {
    Instagram: "text-pink-400",
    Facebook: "text-blue-400",
    LinkedIn: "text-blue-600",
    TikTok: "text-slate-100",
    Google: "text-emerald-400",
    Twitter: "text-sky-400",
    YouTube: "text-red-400",
};

export function ExportKitPanel({ assetId, assetName }: { assetId: string; assetName?: string }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [kit, setKit] = useState<any[]>([]);
    const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

    const handleGenerate = async () => {
        setIsGenerating(true);
        setKit([]);
        try {
            const res = await generateExportKit(assetId);
            if (!res.success) { toast.error(res.error); return; }
            setKit(res.kit || []);
            toast.success(`Kit de ${res.kit?.length} formatos generado.`);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = (item: any) => {
        // In production this would trigger a real download from the processed URL
        const link = document.createElement("a");
        link.href = item.downloadUrl;
        link.download = `${assetName ?? "asset"}-${item.name.replace(/\s+/g, "_")}.jpg`;
        link.target = "_blank";
        link.click();
        setDownloaded(prev => new Set(prev).add(item.name));
        toast.success(`Descargando ${item.name}...`);
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success("URL copiada al portapapeles.");
    };

    const grouped = kit.reduce((acc: Record<string, any[]>, item) => {
        (acc[item.platform] = acc[item.platform] || []).push(item);
        return acc;
    }, {});

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Package className="text-emerald-400" size={16} />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-300">
                        Export Kit Multi-Formato
                    </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                    Genera automáticamente versiones del creativo recortadas y optimizadas para cada plataforma y formato. {kit.length === 0 ? "9 formatos disponibles." : `${kit.length} formatos listos.`}
                </p>
                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !assetId}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider h-10 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                >
                    {isGenerating
                        ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generando formatos...</>
                        : <><Package className="w-4 h-4 mr-2" />Generar Export Kit Completo</>
                    }
                </Button>
            </div>

            {/* Results by platform */}
            {Object.entries(grouped).map(([platform, items]) => (
                <div key={platform} className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold ${PLATFORM_COLORS[platform] ?? "text-slate-400"}`}>
                            {platform}
                        </span>
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-xs text-slate-600 font-mono">{items.length} formato{items.length > 1 ? "s" : ""}</span>
                    </div>
                    <div className="space-y-1.5">
                        {items.map((item: any) => (
                            <div 
                                key={item.name} 
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all
                                    ${downloaded.has(item.name)
                                        ? "border-emerald-500/30 bg-emerald-500/5"
                                        : "border-slate-800 bg-slate-900/50 hover:border-slate-700"}`}
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        {downloaded.has(item.name) && <CheckCircle size={11} className="text-emerald-400" />}
                                        <span className="text-xs font-medium text-slate-200">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-500 mt-0.5">{item.spec}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handleCopyUrl(item.downloadUrl)}
                                        className="p-1.5 rounded text-slate-500 hover:text-teal-400 hover:bg-slate-800 transition"
                                        title="Copiar URL"
                                    >
                                        <Copy size={12} />
                                    </button>
                                    <button
                                        onClick={() => handleDownload(item)}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition"
                                    >
                                        <Download size={11} /> Descargar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Empty state */}
            {kit.length === 0 && !isGenerating && (
                <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center">
                    <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 font-medium">Sin export kit generado</p>
                    <p className="text-xs text-slate-600 mt-1">Selecciona un asset y pulsa "Generar Export Kit" para crear todos los formatos automáticamente.</p>
                </div>
            )}
        </div>
    );
}
