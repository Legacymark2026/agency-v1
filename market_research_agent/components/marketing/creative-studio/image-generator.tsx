'use client';

import { useState, useCallback } from 'react';
import { useCampaignWizard } from '@/components/marketing/campaign-wizard/wizard-store';
import { generateImageAsset } from '@/actions/marketing/creative-assets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, RefreshCw, Download, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AspectRatio = '1:1' | '9:16' | '16:9' | '4:5' | '1.91:1';

const ASPECT_OPTIONS: { value: AspectRatio; label: string; placement: string }[] = [
    { value: '1:1', label: '1:1', placement: 'Feed (Facebook, Instagram, TikTok)' },
    { value: '9:16', label: '9:16', placement: 'Stories / Reels / TikTok' },
    { value: '16:9', label: '16:9', placement: 'YouTube / Banner' },
    { value: '4:5', label: '4:5', placement: 'Meta Feed (Optimized)' },
    { value: '1.91:1', label: '1.91:1', placement: 'Google Display / Link Preview' },
];

const STYLES = ['Photorealistic', 'Cinematic', 'Flat Design', 'Minimalist', 'Bold & Graphic', 'Watercolor', 'Dark Luxury'];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

interface ImageGeneratorProps {
    campaignId?: string;
    onAssetGenerated?: (url: string, assetId?: string) => void;
}

export function ImageGenerator({ campaignId, onAssetGenerated }: ImageGeneratorProps) {
    const { platforms, name: campaignName, addAssetUrl } = useCampaignWizard();

    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [style, setStyle] = useState('Photorealistic');
    const [brandColors, setBrandColors] = useState<string[]>(['#6D28D9', '#FFFFFF']);
    const [brandName, setBrandName] = useState('');
    const [platform, setPlatform] = useState(platforms[0] ?? 'FACEBOOK_ADS');

    const [loading, setLoading] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [variants, setVariants] = useState<string[]>([]);

    const generate = useCallback(async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);

        try {
            const result = await generateImageAsset({
                campaignId,
                prompt,
                aspectRatio,
                platform,
                style: style.toLowerCase(),
                brandColors,
                brandName,
            });

            setGeneratedUrl(result.url);
            setVariants((prev) => [result.url, ...prev.filter((u) => u !== result.url)].slice(0, 4));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setLoading(false);
        }
    }, [prompt, aspectRatio, platform, style, brandColors, brandName, campaignId]);

    function handleUseAsset(url: string) {
        addAssetUrl(url);
        onAssetGenerated?.(url);
    }

    // Auto-suggest prompt based on campaign name
    const suggestedPrompt = campaignName
        ? `Professional advertisement for "${campaignName}". High-quality product/service visual with clear call to action.`
        : '';

    return (
        <div className="grid grid-cols-2 gap-6">
            {/* ─ Controls ─ */}
            <div className="space-y-5">
                {/* Prompt */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-300">Prompt de Imagen</Label>
                        {suggestedPrompt && (
                            <button
                                type="button"
                                onClick={() => setPrompt(suggestedPrompt)}
                                className="text-xs text-violet-400 hover:text-violet-300"
                            >
                                ✨ Auto-sugerido
                            </button>
                        )}
                    </div>
                    <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ej: Ejecutivo profesional usando laptop en oficina moderna, iluminación natural suave, colores corporativos azul y blanco..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 resize-none min-h-[100px]"
                    />
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-300">Dimensiones / Placement</Label>
                    <div className="grid grid-cols-1 gap-1.5">
                        {ASPECT_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setAspectRatio(opt.value)}
                                className={cn(
                                    'flex items-center justify-between p-2.5 rounded-lg border text-left transition-all',
                                    aspectRatio === opt.value
                                        ? 'border-violet-500 bg-violet-500/10 text-white'
                                        : 'border-white/8 text-gray-400 hover:border-white/15'
                                )}
                            >
                                <span className="font-mono text-sm">{opt.label}</span>
                                <span className="text-xs opacity-70">{opt.placement}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Style */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-300">Estilo Visual</Label>
                    <div className="flex flex-wrap gap-1.5">
                        {STYLES.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStyle(s)}
                                className={cn(
                                    'px-3 py-1 rounded-full text-xs transition-all border',
                                    style === s
                                        ? 'bg-violet-600 border-violet-500 text-white'
                                        : 'border-white/10 text-gray-400 hover:border-violet-500/40 hover:text-gray-200'
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Brand */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Nombre de Marca</Label>
                        <Input
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            placeholder="TuMarca"
                            className="bg-white/5 border-white/10 text-white h-9 text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Color Principal</Label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={brandColors[0]}
                                onChange={(e) => setBrandColors([e.target.value, brandColors[1] ?? '#FFFFFF'])}
                                className="w-9 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                            />
                            <input
                                type="color"
                                value={brandColors[1] ?? '#FFFFFF'}
                                onChange={(e) => setBrandColors([brandColors[0], e.target.value])}
                                className="w-9 h-9 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Generate */}
                <Button
                    id="generate-image-btn"
                    onClick={generate}
                    disabled={loading || !prompt.trim()}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white h-11 gap-2 shadow-[0_0_30px_rgba(139,92,246,0.3)] disabled:opacity-40"
                >
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generando con Imagen 3...</>
                    ) : (
                        <><Sparkles className="w-4 h-4" /> Generar Imagen</>
                    )}
                </Button>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-xs">{error}</p>
                    </div>
                )}
            </div>

            {/* ─ Preview ─ */}
            <div className="space-y-4">
                {/* Main preview */}
                <div className={cn(
                    'relative bg-white/3 border-2 border-dashed border-white/10 rounded-xl overflow-hidden flex items-center justify-center',
                    aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '16:9' ? 'aspect-video' : 'aspect-square'
                )}>
                    {generatedUrl ? (
                        <>
                            <Image src={generatedUrl} alt="Generated creative" fill className="object-cover" unoptimized />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all group flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => handleUseAsset(generatedUrl)}
                                        className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Usar en campaña
                                    </button>
                                    <a
                                        href={generatedUrl}
                                        download
                                        className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Descargar
                                    </a>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-8">
                            {loading ? (
                                <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto" />
                            ) : (
                                <>
                                    <Sparkles className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                    <p className="text-gray-600 text-sm">La imagen generada aparecerá aquí</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Variant history */}
                {variants.length > 1 && (
                    <div>
                        <p className="text-xs text-gray-500 mb-2">Versiones anteriores</p>
                        <div className="grid grid-cols-3 gap-2">
                            {variants.slice(1).map((url) => (
                                <button
                                    key={url}
                                    type="button"
                                    onClick={() => setGeneratedUrl(url)}
                                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-white/10 hover:border-violet-500 transition-colors"
                                >
                                    <Image src={url} alt="Variant" fill className="object-cover" unoptimized />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Regenerate */}
                {generatedUrl && (
                    <Button
                        variant="outline"
                        onClick={generate}
                        disabled={loading}
                        className="w-full border-white/10 text-gray-300 hover:bg-white/5 gap-2"
                    >
                        <RefreshCw className="w-4 h-4" /> Regenerar Variante
                    </Button>
                )}
            </div>
        </div>
    );
}
