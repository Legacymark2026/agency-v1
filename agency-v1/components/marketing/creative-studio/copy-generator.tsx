'use client';

import { useState } from 'react';
import { generateCopyForPlatform } from '@/actions/marketing/creative-assets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Copy, RefreshCw, Check } from 'lucide-react';
import { CopyScorer } from './copy-scorer';
import { cn } from '@/lib/utils';

const PLATFORMS = [
    { key: 'FACEBOOK_ADS', label: '📘 Meta', shortLabel: 'Meta' },
    { key: 'TIKTOK_ADS', label: '🎵 TikTok', shortLabel: 'TikTok' },
    { key: 'LINKEDIN_ADS', label: '💼 LinkedIn', shortLabel: 'LinkedIn' },
    { key: 'GOOGLE_ADS', label: '🔍 Google', shortLabel: 'Google' },
];

const TONES = ['Profesional', 'Inspirador', 'Urgente', 'Amigable', 'Autoritario', 'Desafiante'];

// ─── COPY FIELD ───────────────────────────────────────────────────────────────
function CopyField({ label, value, maxLen }: { label: string; value: string; maxLen?: number }) {
    const [copied, setCopied] = useState(false);

    function copyText() {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-500">{label}</Label>
                <div className="flex items-center gap-2">
                    {maxLen && (
                        <span className={cn('text-xs', value.length > maxLen ? 'text-red-400' : 'text-gray-600')}>
                            {value.length}/{maxLen}
                        </span>
                    )}
                    <button type="button" onClick={copyText} className="text-gray-500 hover:text-violet-400 transition-colors">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>
            <div className="p-3 bg-white/3 border border-white/8 rounded-lg text-sm text-white leading-relaxed">
                {value}
            </div>
        </div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
interface CopyGeneratorProps {
    campaignId?: string;
    defaultPlatform?: string;
    onCopyApplied?: (platform: string, copy: Record<string, unknown>) => void;
}

export function CopyGenerator({ campaignId, defaultPlatform = 'FACEBOOK_ADS', onCopyApplied }: CopyGeneratorProps) {
    const [platform, setPlatform] = useState(defaultPlatform);
    const [product, setProduct] = useState('');
    const [objective, setObjective] = useState('Generar leads y aumentar conversiones');
    const [tone, setTone] = useState('Profesional');
    const [audience, setAudience] = useState('Dueños de negocios y profesionales de marketing');
    const [brandName, setBrandName] = useState('');

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ copy: Record<string, unknown>; variations: Record<string, unknown>[] } | null>(null);
    const [activeVariation, setActiveVariation] = useState(0);
    const [error, setError] = useState<string | null>(null);

    async function generate() {
        if (!product.trim()) return;
        setLoading(true);
        setError(null);
        setActiveVariation(0);
        try {
            const data = await generateCopyForPlatform({ platform, product, objective, tone: tone.toLowerCase(), audience, brandName, campaignId });
            setResult({ copy: data.copy as Record<string, unknown>, variations: data.variations as Record<string, unknown>[] });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Copy generation failed');
        } finally {
            setLoading(false);
        }
    }

    const activeCopy = result
        ? (activeVariation === 0 ? result.copy : result.variations[activeVariation - 1]) ?? {}
        : {};

    const allVersions = result ? [result.copy, ...result.variations] : [];

    return (
        <div className="space-y-6">
            {/* Platform tabs */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                {PLATFORMS.map((p) => (
                    <button
                        key={p.key}
                        id={`copy-platform-${p.key.toLowerCase()}`}
                        type="button"
                        onClick={() => { setPlatform(p.key); setResult(null); }}
                        className={cn(
                            'flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all',
                            platform === p.key ? 'bg-violet-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                        )}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* ─ Form ─ */}
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-300">Producto / Servicio <span className="text-red-400">*</span></Label>
                        <Textarea
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            placeholder="Ej: Software de CRM integrado con IA para agencias de marketing que centraliza campañas en Meta, Google, TikTok y LinkedIn..."
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 resize-none min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-300">Objetivo</Label>
                        <Input value={objective} onChange={(e) => setObjective(e.target.value)} className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-300">Audiencia</Label>
                        <Input value={audience} onChange={(e) => setAudience(e.target.value)} className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-300">Marca</Label>
                            <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="TuMarca" className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-300">Tono</Label>
                            <div className="flex flex-wrap gap-1">
                                {TONES.map((t) => (
                                    <button key={t} type="button" onClick={() => setTone(t)}
                                        className={cn('px-2 py-0.5 rounded text-xs border transition-all',
                                            tone === t ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-white/10 text-gray-500 hover:border-white/20'
                                        )}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Button id="generate-copy-btn" onClick={generate} disabled={loading || !product.trim()}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white h-11 gap-2 disabled:opacity-40">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando Copy...</> : <><Sparkles className="w-4 h-4" /> Generar Copy</>}
                    </Button>

                    {error && <p className="text-red-400 text-xs">{error}</p>}
                </div>

                {/* ─ Results ─ */}
                <div className="space-y-4">
                    {result ? (
                        <>
                            {/* Version selector */}
                            <div className="flex gap-2">
                                {allVersions.map((_, i) => (
                                    <button key={i} type="button" onClick={() => setActiveVariation(i)}
                                        className={cn('px-3 py-1 rounded-lg text-xs font-medium border transition-all',
                                            activeVariation === i ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-white/10 text-gray-500 hover:text-gray-300'
                                        )}>
                                        {i === 0 ? 'Principal' : `Variante ${i}`}
                                    </button>
                                ))}
                                <button type="button" onClick={generate} disabled={loading}
                                    className="ml-auto text-gray-500 hover:text-violet-400 transition-colors">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Copy fields — Meta */}
                            {platform === 'FACEBOOK_ADS' && (
                                <div className="space-y-3">
                                    <CopyField label="Titular" value={String(activeCopy.headline ?? '')} maxLen={40} />
                                    <CopyField label="Texto Principal" value={String(activeCopy.primaryText ?? '')} maxLen={125} />
                                    <CopyField label="Descripción" value={String(activeCopy.description ?? '')} maxLen={30} />
                                    <CopyField label="CTA" value={String(activeCopy.callToAction ?? '')} />
                                </div>
                            )}

                            {/* TikTok */}
                            {platform === 'TIKTOK_ADS' && (
                                <div className="space-y-3">
                                    <CopyField label="Hook (3 segundos)" value={String(activeCopy.hook ?? '')} />
                                    <CopyField label="Guión Completo" value={String(activeCopy.script ?? '')} />
                                    {Array.isArray(activeCopy.hashtags) && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {(activeCopy.hashtags as string[]).map((tag) => (
                                                <Badge key={tag} className="bg-pink-500/20 text-pink-300 border-pink-500/30">#{tag}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* LinkedIn */}
                            {platform === 'LINKEDIN_ADS' && (
                                <div className="space-y-3">
                                    <CopyField label="Titular" value={String(activeCopy.headline ?? '')} maxLen={70} />
                                    <CopyField label="Introducción" value={String(activeCopy.intro ?? '')} maxLen={600} />
                                    <CopyField label="Cuerpo" value={String(activeCopy.body ?? '')} />
                                </div>
                            )}

                            {/* Google */}
                            {platform === 'GOOGLE_ADS' && (
                                <div className="space-y-3">
                                    {Array.isArray(activeCopy.headlines) && (activeCopy.headlines as string[]).map((h, i) => (
                                        <CopyField key={i} label={`Titular ${i + 1}`} value={h} maxLen={30} />
                                    ))}
                                    {Array.isArray(activeCopy.descriptions) && (activeCopy.descriptions as string[]).map((d, i) => (
                                        <CopyField key={i} label={`Descripción ${i + 1}`} value={d} maxLen={90} />
                                    ))}
                                </div>
                            )}

                            <Button variant="outline" onClick={() => onCopyApplied?.(platform, activeCopy)}
                                className="w-full border-white/10 text-gray-300 hover:bg-white/5 gap-2">
                                <Check className="w-4 h-4" /> Aplicar a la Campaña
                            </Button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <Sparkles className="w-10 h-10 text-gray-700 mb-3" />
                            <p className="text-gray-600 text-sm">El copy generado aparecerá aquí</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
