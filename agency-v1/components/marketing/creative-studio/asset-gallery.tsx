'use client';

import { useState, useCallback } from 'react';
import { getCompanyAssets, uploadManualAsset, deleteAsset } from '@/actions/marketing/creative-assets';
import { useCampaignWizard } from '@/components/marketing/campaign-wizard/wizard-store';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Video, Upload, Trash2, Plus, Check, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type AssetRecord = {
    id: string;
    url: string;
    type: string;
    name?: string | null;
    mimeType?: string | null;
    width?: number | null;
    height?: number | null;
    createdAt: Date;
    metadata?: unknown;
};

interface AssetGalleryProps {
    campaignId?: string;
    onAssetSelected?: (asset: AssetRecord) => void;
    showUpload?: boolean;
}

export function AssetGallery({ campaignId, onAssetSelected, showUpload = true }: AssetGalleryProps) {
    const [assets, setAssets] = useState<AssetRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [filterType, setFilterType] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const { addAssetUrl } = useCampaignWizard();

    const loadAssets = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getCompanyAssets(campaignId);
            setAssets(data as AssetRecord[]);
        } catch (err) {
            console.error('Failed to load assets:', err);
        } finally {
            setLoading(false);
        }
    }, [campaignId]);

    // Load on mount
    useState(() => { loadAssets(); });

    async function handleFileUpload(files: FileList | null) {
        if (!files?.length || !campaignId) return;
        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);
                await uploadManualAsset(formData, campaignId);
            }
            await loadAssets();
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        setIsDraggingOver(true);
    }

    function handleDragLeave() { setIsDraggingOver(false); }

    async function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDraggingOver(false);
        await handleFileUpload(e.dataTransfer.files);
    }

    async function handleDelete(id: string) {
        await deleteAsset(id);
        setAssets((prev) => prev.filter((a) => a.id !== id));
    }

    function toggleSelect(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function useInCampaign(asset: AssetRecord) {
        addAssetUrl(asset.url);
        onAssetSelected?.(asset);
    }

    const filtered = assets.filter((a) => filterType === 'ALL' || a.type === filterType);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {(['ALL', 'IMAGE', 'VIDEO'] as const).map((f) => (
                        <button key={f} type="button" onClick={() => setFilterType(f)}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                                filterType === f ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-white/10 text-gray-400 hover:text-gray-200')}>
                            {f === 'ALL' ? 'Todos' : f === 'IMAGE' ? <><ImageIcon className="w-3 h-3 inline mr-1" />Imágenes</> : <><Video className="w-3 h-3 inline mr-1" />Videos</>}
                        </button>
                    ))}
                </div>
                <button type="button" onClick={loadAssets} disabled={loading}
                    className="text-gray-500 hover:text-violet-400 transition-colors">
                    <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                </button>
            </div>

            {/* Upload zone */}
            {showUpload && campaignId && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        'border-2 border-dashed rounded-xl p-6 text-center transition-all',
                        isDraggingOver ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:border-violet-500/40'
                    )}
                >
                    <Upload className="w-7 h-7 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 mb-2">Arrastra imágenes o videos aquí</p>
                    <label className="cursor-pointer">
                        <input type="file" accept="image/*,video/*" multiple className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files)} />
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-colors">
                            {uploading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            {uploading ? 'Subiendo...' : 'Seleccionar archivos'}
                        </span>
                    </label>
                </div>
            )}

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                    <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No hay assets aún. Genera con IA o sube manualmente.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    {filtered.map((asset) => {
                        const isSelected = selectedIds.has(asset.id);
                        const isVideo = asset.type === 'VIDEO';
                        const meta = asset.metadata as Record<string, unknown> | null;
                        return (
                            <div key={asset.id}
                                className={cn('group relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer',
                                    isSelected ? 'border-violet-500' : 'border-white/10 hover:border-violet-500/40')}
                                onClick={() => toggleSelect(asset.id)}>

                                <div className="aspect-square bg-black relative">
                                    {isVideo ? (
                                        <video src={asset.url} className="absolute inset-0 w-full h-full object-cover" />
                                    ) : (
                                        <Image src={asset.url} alt={asset.name ?? 'Asset'} fill className="object-cover" unoptimized />
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); useInCampaign(asset); }}
                                                className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                                                <Check className="w-3 h-3" /> Usar
                                            </button>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                                                className="bg-red-600/80 hover:bg-red-500 text-white text-xs p-1.5 rounded-lg">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="absolute top-2 left-2 flex gap-1">
                                        <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium',
                                            isVideo ? 'bg-pink-500/80 text-white' : 'bg-violet-500/80 text-white')}>
                                            {isVideo ? 'VIDEO' : 'IMG'}
                                        </span>
                                        {Boolean(meta?.platform) && (
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-black/60 text-gray-300">
                                                {String(meta?.platform).replace('_ADS', '')}
                                            </span>
                                        )}
                                    </div>

                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-2 bg-black/60">
                                    <p className="text-xs text-gray-400 truncate">
                                        {asset.name ?? (meta?.originalPrompt ? String(meta.originalPrompt).slice(0, 40) + '...' : 'Asset')}
                                    </p>
                                    {asset.width && asset.height && (
                                        <p className="text-xs text-gray-600">{asset.width}×{asset.height}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                    <span className="text-sm text-violet-300">{selectedIds.size} seleccionados</span>
                    <Button size="sm" onClick={() => {
                        filtered.filter((a) => selectedIds.has(a.id)).forEach((a) => addAssetUrl(a.url));
                        setSelectedIds(new Set());
                    }} className="bg-violet-600 hover:bg-violet-500 text-white h-7 text-xs gap-1">
                        <Check className="w-3 h-3" /> Añadir todos a campaña
                    </Button>
                </div>
            )}
        </div>
    );
}
