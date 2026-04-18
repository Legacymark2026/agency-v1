"use client";

import { useState, useEffect } from "react";
import { History, RotateCcw, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAssetVersions, restoreAssetVersion } from "@/actions/marketing/creative-collaboration";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Version = Awaited<ReturnType<typeof getAssetVersions>>[number];

export function AssetVersionHistory({
    assetId,
    currentUrl,
    onRestored,
}: {
    assetId: string;
    currentUrl: string;
    onRestored?: (url: string) => void;
}) {
    const [versions, setVersions] = useState<Version[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        getAssetVersions(assetId).then(data => {
            setVersions(data);
            setIsLoading(false);
        });
    }, [assetId]);

    const handleRestore = async (version: Version) => {
        setRestoringId(version.id);
        const res = await restoreAssetVersion(assetId, version.id);
        setRestoringId(null);
        if (res.success) {
            toast.success(`Restaurado a v${version.version}.`);
            if (onRestored) onRestored(version.url);
            // Reload versions
            getAssetVersions(assetId).then(setVersions);
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <History className="text-violet-400" size={14} />
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                    Historial de Versiones
                </span>
            </div>

            {/* Preview diff */}
            {previewUrl && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                    <div className="space-y-1">
                        <p className="text-xs font-mono text-slate-500">Actual</p>
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-700">
                            <Image src={currentUrl} alt="Actual" fill className="object-cover" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-mono text-violet-400">Vista previa v.anterior</p>
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-violet-500/30">
                            <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                        </div>
                    </div>
                </div>
            )}

            {/* Version list */}
            {isLoading ? (
                <div className="flex items-center justify-center h-24 text-slate-600">
                    <Loader2 size={18} className="animate-spin" />
                </div>
            ) : versions.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center">
                    <History className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Sin historial de versiones aún.</p>
                    <p className="text-xs text-slate-600 mt-1">Cada regeneración guarda automáticamente una nueva versión.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {versions.map((v) => (
                        <div
                            key={v.id}
                            onMouseEnter={() => setPreviewUrl(v.url)}
                            onMouseLeave={() => setPreviewUrl(null)}
                            className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-violet-500/30 transition-all group cursor-pointer"
                        >
                            <div className="relative w-12 h-12 rounded-md overflow-hidden border border-slate-700 flex-shrink-0">
                                <Image src={v.url} alt={`v${v.version}`} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-violet-400">v{v.version}</span>
                                    <span className="text-xs text-slate-500">
                                        {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true, locale: es })}
                                    </span>
                                </div>
                                {v.changeNote && (
                                    <p className="text-xs text-slate-400 truncate mt-0.5">{v.changeNote}</p>
                                )}
                                {v.prompt && (
                                    <p className="text-xs text-slate-600 truncate font-mono mt-0.5">{v.prompt}</p>
                                )}
                                <p className="text-xs text-slate-600 mt-0.5">por {v.createdBy.name}</p>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRestore(v)}
                                disabled={!!restoringId}
                                className="h-7 text-xs text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-all font-mono gap-1"
                            >
                                {restoringId === v.id
                                    ? <Loader2 size={10} className="animate-spin" />
                                    : <RotateCcw size={10} />}
                                Restaurar
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
