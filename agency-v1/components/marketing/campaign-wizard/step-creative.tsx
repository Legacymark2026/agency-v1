'use client';

import { useCampaignWizard } from './wizard-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, Link2, Trash2, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { generateSocialCopy } from '@/actions/social-ai';
import { createShortLinkAction } from '@/actions/marketing/short-links';
import { useSession } from 'next-auth/react';
import { AssetLibraryModal } from '../asset-library-modal';
import { AdGroupManager } from './ad-group-manager';
import Image from 'next/image';

const PLATFORM_ICON: Record<string, string> = {
    FACEBOOK_ADS: '📘',
    GOOGLE_ADS: '🔍',
    TIKTOK_ADS: '🎵',
    LINKEDIN_ADS: '💼',
};

const UTM_SOURCE_MAP: Record<string, string> = {
    FACEBOOK_ADS: 'facebook',
    GOOGLE_ADS: 'google',
    TIKTOK_ADS: 'tiktok',
    LINKEDIN_ADS: 'linkedin',
};

export function StepCreative() {
    const { platforms, creative, name, objective, setCreative, addAssetUrl, removeAssetUrl, nextStep, prevStep, generateAIVariants, abTestConfig } =
        useCampaignWizard();
    
    const { data: session } = useSession();
    const companyId = session?.user?.companyId || '';
    
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isShortening, setIsShortening] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const assetFileInputRef = useRef<HTMLInputElement>(null);
    
    async function handleAssetUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        setIsUploading(true);
        
        try {
            for (const file of Array.from(files)) {
                const objectUrl = URL.createObjectURL(file);
                addAssetUrl(objectUrl);
            }
            toast.success(`${files.length} archivo(s) cargado(s)`);
        } catch (error) {
            toast.error('Error al cargar archivos');
        } finally {
            setIsUploading(false);
        }
    }

    // AI Copy Generator with new options
    const [aiTone, setAiTone] = useState<'professional' | 'casual' | 'urgent' | 'friendly'>('professional');
    const [aiHookStyle, setAiHookStyle] = useState<'question' | 'statement' | 'benefit' | 'pain_point'>('benefit');
    const [generateCount, setGenerateCount] = useState(3);

    async function handleAIGenerate() {
        if (!name || platforms.length === 0) {
            toast.error("Por favor ingresa un nombre de campaña y selecciona al menos una plataforma primero.");
            return;
        }
        setIsGeneratingAI(true);
        try {
            const toneLabels = { professional: 'profesional y corporativo', casual: 'casual y cercano', urgent: 'urgente y persuasivo', friendly: 'amigable y cálido' };
            const hookLabels = { question: 'pregunta intrigante', statement: 'declaración impactante', benefit: 'propuesta de beneficio', pain_point: 'identificación de dolor' };
            
            const prompt = `Campaña: ${name}. Objetivo: ${objective}. Escribe un copy publicitario con un ${hookLabels[aiHookStyle]} con tono ${toneLabels[aiTone]}. Genera ${generateCount} variantes. Cada variante debe incluir: headline (máx 40 chars), descripción (máx 125 chars), y texto primario (máx 150 chars). Formato: JSON array.`;
            const primaryPlatform = platforms[0] === 'FACEBOOK_ADS' ? 'Facebook' : platforms[0] === 'LINKEDIN_ADS' ? 'LinkedIn' : platforms[0] === 'TIKTOK_ADS' ? 'TikTok' : 'Google';
            
            const res = await generateSocialCopy(prompt);
            if (res.success && res.data) {
                const generated = res.data[primaryPlatform.toLowerCase()] || Object.values(res.data)[0];
                if (generated) {
                    const newHeadlines = [...(creative.headlines || []), generated.substring(0, 40)];
                    const newDescriptions = [...(creative.descriptions || []), generated.substring(40, 165)];
                    setCreative({
                        headlines: newHeadlines.slice(0, generateCount),
                        descriptions: newDescriptions.slice(0, generateCount),
                        aiDynamicVariables: { enabled: true, variables: ['headline', 'description'] }
                    });
                    toast.success(`✨ ${generateCount} variantes generadas con IA correctamente`);
                }
            } else {
                toast.error("Error al generar textos con IA.");
            }
        } catch (error) {
            toast.error("Error inesperado al conectar con Gemini.");
        } finally {
            setIsGeneratingAI(false);
        }
    }

    // Quick generate multiple variants
    async function handleGenerateVariants() {
        if (!name) return;
        setIsGeneratingAI(true);
        await new Promise(r => setTimeout(r, 1000));
        
        const variants = [
            { headline: `Transforma tu negocio con ${name}`, description: 'La solución que buscas está aquí' },
            { headline: `El secreto del éxito: ${name}`, description: 'Únete a los que ya transformaron' },
            { headline: `${name}: La elección inteligente`, description: 'Resultados garantizados' },
        ];
        
        setCreative({
            headlines: variants.map(v => v.headline),
            descriptions: variants.map(v => v.description),
            aiDynamicVariables: { enabled: true, variables: ['headline', 'description'] }
        });
        setIsGeneratingAI(false);
        toast.success("✨ 3 variantes generadas");
    }

    function generateUTMs() {
        const utmCampaign = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const primaryPlatform = platforms[0];
        setCreative({
            utmConfig: {
                source: UTM_SOURCE_MAP[primaryPlatform] ?? 'paid',
                medium: 'cpc',
                campaign: utmCampaign || 'campaign',
                content: ''
            },
        });
    }

    const destinationWithUtm = creative.destinationUrl
        ? `${creative.destinationUrl}${creative.destinationUrl.includes('?') ? '&' : '?'}utm_source=${creative.utmConfig.source}&utm_medium=${creative.utmConfig.medium}&utm_campaign=${creative.utmConfig.campaign}${creative.utmConfig.content ? `&utm_content=${creative.utmConfig.content}` : ''}`
        : '';

    async function handleAutoShorten() {
        if (!destinationWithUtm || !companyId) return;
        setIsShortening(true);
        try {
            const res = await createShortLinkAction({
                companyId,
                destinationUrl: destinationWithUtm,
                utmSource: creative.utmConfig.source,
                utmMedium: creative.utmConfig.medium,
                utmCampaign: creative.utmConfig.campaign
            });
            if (res.success && res.data?.shortUrl) {
                setCreative({ destinationUrl: res.data.shortUrl });
                toast.success("🔗 URL acortada y UTMs inyectadas!");
            } else {
                toast.error(res.error || "Error al acortar URL");
            }
        } catch (error) {
            toast.error("Error al acortar URL");
        } finally {
            setIsShortening(false);
        }
    }

    function updateArray(field: 'headlines' | 'descriptions' | 'primaryTexts', index: number, value: string) {
        const arr = [...(creative[field] || [])];
        arr[index] = value;
        setCreative({ [field]: arr } as any);
    }
    
    function addVariant(field: 'headlines' | 'descriptions' | 'primaryTexts') {
        setCreative({ [field]: [...(creative[field] || []), ''] } as any);
    }

    function removeVariant(field: 'headlines' | 'descriptions' | 'primaryTexts', index: number) {
        if ((creative[field] || []).length <= 1) return;
        const arr = [...(creative[field] || [])];
        arr.splice(index, 1);
        setCreative({ [field]: arr } as any);
    }

    const canContinue = (creative.headlines?.[0] || creative.headline) && creative.destinationUrl;

    return (
        <div className="space-y-8">
            {/* Asset Upload */}
            <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-300">Creativos (Imágenes / Videos)</Label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-teal-500/40 transition-colors">
                    <Upload className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Arrastra archivos aquí, o ingresa una URL de asset</p>
                    <div className="flex gap-2 mt-4 max-w-md mx-auto flex-wrap justify-center">
                        <input 
                            ref={assetFileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleAssetUpload}
                            className="hidden"
                        />
                        <Button 
                            type="button"
                            variant="outline"
                            onClick={() => assetFileInputRef.current?.click()}
                            disabled={isUploading}
                            className="h-10 border-teal-500/30 text-teal-400 hover:text-teal-300 hover:border-teal-500/50 bg-teal-500/10 shrink-0"
                        >
                            {isUploading ? (
                                <span>Cargando...</span>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Subir Archivos
                                </>
                            )}
                        </Button>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsAssetModalOpen(true)}
                            className="h-10 border-teal-500/30 text-teal-400 hover:text-teal-300 hover:border-teal-500/50 bg-teal-500/10 shrink-0"
                        >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Media Hub
                        </Button>
                        <Input
                            id="asset-url-input"
                            placeholder="https://cdn.example.com/imagen.jpg"
                            className="bg-white/5 border-white/10 text-white h-10 text-sm flex-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    addAssetUrl((e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).value = '';
                                }
                            }}
                        />
                        <Button
                            type="button"
                            id="add-asset-url"
                            variant="outline"
                            onClick={(e) => {
                                const input = document.getElementById('asset-url-input') as HTMLInputElement;
                                if (input?.value) { addAssetUrl(input.value); input.value = ''; }
                            }}
                            className="h-10 border-white/10 text-gray-300 hover:bg-white/5 shrink-0"
                        >
                            <Link2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Asset Previews */}
                {creative.assetUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                        {creative.assetUrls.map((url) => (
                            <div key={url} className="relative group rounded-lg overflow-hidden bg-white/5 border border-white/10">
                                <div className="aspect-video relative">
                                    <Image src={url} alt="Asset preview" fill className="object-cover" unoptimized />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeAssetUrl(url)}
                                    className="absolute top-1 right-1 bg-red-500/80 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3 text-white" />
                                </button>
                                <div className="absolute bottom-1 left-1 flex gap-1">
                                    {platforms.map((p) => (
                                        <span key={p} className="text-xs" title={p}>{PLATFORM_ICON[p]}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Dynamic Variables */}
            <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm font-semibold text-gray-300">Variables Dinámicas de CRM (A/B Matrix)</Label>
                        <p className="text-xs text-gray-500 mt-1">Inserta datos del prospecto (Lead Score, Nombre) en tus textos.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCreative({ aiDynamicVariables: { ...creative.aiDynamicVariables, enabled: !creative.aiDynamicVariables?.enabled } as any })}
                        className={`w-11 h-6 rounded-full transition-colors relative ${creative.aiDynamicVariables?.enabled ? 'bg-teal-500' : 'bg-gray-700'}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${creative.aiDynamicVariables?.enabled ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
                {creative.aiDynamicVariables?.enabled && (
                    <div className="flex gap-2 flex-wrap">
                        {['{{lead_score}}', '{{first_name}}', '{{company_industry}}', '{{city}}'].map(v => (
                            <Badge key={v} className="cursor-pointer bg-white/5 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20" onClick={() => {
                                // Add logic to append to active focused input if needed, or just copy to clipboard
                                navigator.clipboard.writeText(v);
                                toast.success(`Copiado ${v}`);
                            }}>{v}</Badge>
                        ))}
                        <span className="text-xs text-gray-500 ml-2 self-center">Haz clic para copiar</span>
                    </div>
                )}
            </div>

            {/* Ad Copy */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                        <Label className="text-sm font-semibold text-gray-300">
                            Titular (A/B) <span className="text-red-400">*</span>
                        </Label>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleAIGenerate} 
                            disabled={isGeneratingAI}
                            className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 h-6 px-2 text-xs font-mono border border-indigo-500/20"
                        >
                            {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Sparkles className="w-3 h-3 mr-1"/>}
                            {isGeneratingAI ? "Generando..." : "Copilot AI"}
                        </Button>
                    </div>
                    {(creative.headlines || [creative.headline || '']).map((hl, i, arr) => (
                        <div key={i} className="relative flex items-center gap-2 mb-2">
                            <span className="text-xs text-slate-500 font-mono w-6">v{i+1}.</span>
                            <div className="relative flex-1">
                                <Input
                                    value={hl}
                                    onChange={(e) => updateArray('headlines', i, e.target.value)}
                                    placeholder="Ej: Transforma tu negocio hoy"
                                    maxLength={40}
                                    className="bg-white/5 border-white/10 text-white h-11 pr-10"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                    {hl.length}/40
                                </span>
                            </div>
                            {arr.length > 1 && (
                                <button type="button" onClick={() => removeVariant('headlines', i)} className="text-gray-500 hover:text-red-400">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => addVariant('headlines')} className="text-xs text-teal-400">
                        + Añadir Variante
                    </Button>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ad-cta" className="text-sm font-semibold text-gray-300">Call to Action</Label>
                    <Input
                        id="ad-cta"
                        value={creative.callToAction ?? ''}
                        onChange={(e) => setCreative({ callToAction: e.target.value })}
                        placeholder="Ej: Saber más, Contactar, Empezar"
                        className="bg-white/5 border-white/10 text-white h-11"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-300">Descripción / Texto Principal (A/B)</Label>
                {(creative.descriptions || [creative.description || '']).map((desc, i, arr) => (
                    <div key={i} className="relative flex gap-2 mb-2">
                        <span className="text-xs text-slate-500 font-mono w-6 pt-3">v{i+1}.</span>
                        <div className="relative flex-1">
                            <Textarea
                                value={desc}
                                onChange={(e) => updateArray('descriptions', i, e.target.value)}
                                placeholder="Describe tu propuesta de valor..."
                                maxLength={125}
                                className="bg-white/5 border-white/10 text-white resize-none min-h-[80px]"
                            />
                            <div className="absolute right-3 bottom-2 text-xs text-gray-500">
                                {desc.length}/125
                            </div>
                        </div>
                        {arr.length > 1 && (
                            <button type="button" onClick={() => removeVariant('descriptions', i)} className="text-gray-500 hover:text-red-400 self-start mt-3">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => addVariant('descriptions')} className="text-xs text-teal-400">
                    + Añadir Variante
                </Button>
            </div>

            {/* Destination URL + UTMs */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-300">
                        URL de Destino <span className="text-red-400">*</span>
                    </Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={generateUTMs}
                        className="text-xs text-teal-400 hover:text-teal-300 h-auto py-1"
                    >
                        ✨ Auto-generar UTMs
                    </Button>
                </div>
                <Input
                    id="destination-url"
                    value={creative.destinationUrl ?? ''}
                    onChange={(e) => setCreative({ destinationUrl: e.target.value })}
                    placeholder="https://tudominio.com/landing"
                    className="bg-white/5 border-white/10 text-white h-11"
                />

                <div className="grid grid-cols-2 gap-3">
                    {(['source', 'medium', 'campaign', 'content'] as const).map((key) => (
                        <div key={key} className="space-y-1">
                            <Label className="text-xs text-gray-500">utm_{key}</Label>
                            <Input
                                value={creative.utmConfig[key] ?? ''}
                                onChange={(e) => setCreative({ utmConfig: { ...creative.utmConfig, [key]: e.target.value } })}
                                className="bg-white/5 border-white/10 text-white h-9 text-sm"
                            />
                        </div>
                    ))}
                </div>

                {destinationWithUtm && !creative.destinationUrl?.includes('/l/') && (
                    <div className="flex items-start justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <div className="flex gap-2 min-w-0 pr-4">
                            <ExternalLink className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-emerald-300 break-all font-mono leading-relaxed truncate whitespace-normal overflow-hidden max-h-16">{destinationWithUtm}</p>
                        </div>
                        <Button 
                            size="sm" 
                            disabled={isShortening}
                            onClick={handleAutoShorten}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.3)] h-8 font-mono text-xs tracking-wide"
                        >
                            {isShortening ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Link2 className="w-3 h-3 mr-1.5" />}
                            {isShortening ? "ACORTANDO..." : "ACORTAR LINK"}
                        </Button>
                    </div>
                )}
            </div>

            {/* Advanced: Multiple Ad Groups */}
            <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm font-semibold text-gray-300">Múltiples Ad Groups y Ads</Label>
                        <p className="text-xs text-gray-500 mt-1">Crea múltiples grupos de anuncios y variations.</p>
                    </div>
                </div>
                <AdGroupManager />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep} className="text-gray-400 hover:text-white">
                    ← Atrás
                </Button>
                <Button
                    id="wizard-next-step-4"
                    onClick={nextStep}
                    disabled={!canContinue}
                    className="bg-teal-700 hover:bg-teal-600 text-white px-8 h-11 disabled:opacity-40"
                >
                    Validar →
                </Button>
            </div>

            <AssetLibraryModal
                open={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
                onSelectAsset={(url: string) => addAssetUrl(url)}
            />
        </div>
    );
}
