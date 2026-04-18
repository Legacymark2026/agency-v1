'use client';

import { useState } from 'react';
import { generateVideoAsset } from '@/actions/marketing/creative-assets';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Video, Play, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORM_HINTS: Record<string, string> = {
    TIKTOK_ADS: '9:16 recomendado · Ritmo rápido, cortes dinámicos, audio sincronizado',
    FACEBOOK_ADS: '16:9 o 1:1 · Primera escena impactante en 3 segundos',
    LINKEDIN_ADS: '16:9 · Tono profesional, mensaje B2B claro',
    GOOGLE_ADS: '16:9 · Producto protagonista, CTA al final',
};

const DURATIONS = [6, 10, 15] as const;
const ASPECT_OPTIONS = [
    { value: '9:16', label: '9:16 (Vertical)' },
    { value: '16:9', label: '16:9 (Horizontal)' },
    { value: '1:1', label: '1:1 (Cuadrado)' },
] as const;

interface VideoGeneratorProps {
    campaignId?: string;
    platform?: string;
    onAssetGenerated?: (url: string, assetId?: string) => void;
}

export function VideoGenerator({ campaignId, platform = 'TIKTOK_ADS', onAssetGenerated }: VideoGeneratorProps) {
    const [script, setScript] = useState('');
    const [referenceImageUrl, setReferenceImageUrl] = useState('');
    const [duration, setDuration] = useState<6 | 10 | 15>(10);
    const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ url: string | null; mode?: string; message?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function generate() {
        setLoading(true);
        setError(null);
        try {
            const data = await generateVideoAsset({ campaignId, script, referenceImageUrl: referenceImageUrl || undefined, duration, aspectRatio, platform });
            setResult(data as { url: string | null; mode?: string; message?: string });
            if ((data as Record<string, unknown>).url) {
                onAssetGenerated?.(
                    (data as Record<string, unknown>).url as string,
                    (data as Record<string, unknown>).assetId as string | undefined
                );
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Video generation failed');
        } finally {
            setLoading(false);
        }
    }

    const hint = PLATFORM_HINTS[platform];

    return (
        <div className="space-y-6">
            {/* Platform hint */}
            {hint && (
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300">{hint}</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-6">
                {/* Controls */}
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-300">Guión del Video</Label>
                        <Textarea
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            placeholder={`Ej: [Escena 1] Profesional en escritorio frustrado con múltiples herramientas abiertas. [Escena 2] Descubre LegacyMark. [Escena 3] Todo unificado, sonrisa de satisfacción. [CTA] Pruébalo gratis hoy.`}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 resize-none min-h-[140px]"
                        />
                        <p className="text-xs text-gray-600">Usa [Escena N] para indicar cortes visuales. Veo interpretará los cambios.</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-300">Imagen de Referencia (opcional)</Label>
                        <Input
                            value={referenceImageUrl}
                            onChange={(e) => setReferenceImageUrl(e.target.value)}
                            placeholder="https://cdn.ejemplo.com/brand-image.jpg"
                            className="bg-white/5 border-white/10 text-white h-10 text-sm"
                        />
                        <p className="text-xs text-gray-600">Veo usará esta imagen como estética de referencia.</p>
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-300">Duración</Label>
                        <div className="flex gap-2">
                            {DURATIONS.map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDuration(d)}
                                    className={cn(
                                        'flex-1 py-2 rounded-lg text-sm font-medium border transition-all',
                                        duration === d
                                            ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                                            : 'border-white/10 text-gray-400 hover:border-white/20'
                                    )}
                                >
                                    {d}s
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-300">Orientación</Label>
                        <div className="flex gap-2">
                            {ASPECT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setAspectRatio(opt.value)}
                                    className={cn(
                                        'flex-1 py-2 px-2 rounded-lg text-xs font-medium border transition-all text-center',
                                        aspectRatio === opt.value
                                            ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                                            : 'border-white/10 text-gray-400 hover:border-white/20'
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        id="generate-video-btn"
                        onClick={generate}
                        disabled={loading || !script.trim()}
                        className="w-full bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white h-11 gap-2 disabled:opacity-40"
                    >
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando con Veo 2...</> : <><Video className="w-4 h-4" /> Generar Video</>}
                    </Button>

                    {error && <p className="text-red-400 text-xs p-3 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</p>}
                </div>

                {/* Preview */}
                <div className="space-y-3">
                    <div className={cn(
                        'relative bg-white/3 border-2 border-dashed border-white/10 rounded-xl overflow-hidden flex items-center justify-center',
                        aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '16:9' ? 'aspect-video' : 'aspect-square'
                    )}>
                        {result?.url ? (
                            <video src={result.url} controls className="absolute inset-0 w-full h-full object-cover" />
                        ) : result?.mode === 'stub' ? (
                            <div className="text-center p-6">
                                <Video className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                                <p className="text-amber-300 text-sm font-medium mb-1">Veo 2 no configurado</p>
                                <p className="text-gray-500 text-xs">{result.message}</p>
                            </div>
                        ) : loading ? (
                            <div className="text-center">
                                <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-3" />
                                <p className="text-gray-500 text-xs">Veo puede tardar 30-90 segundos...</p>
                            </div>
                        ) : (
                            <div className="text-center p-8">
                                <Play className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-600 text-sm">El video generado aparecerá aquí</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
