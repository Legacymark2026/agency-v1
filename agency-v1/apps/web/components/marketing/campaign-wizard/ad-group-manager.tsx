'use client';

import { useCampaignWizard, AdGroup, Ad, AIGenerationConfig, BrandPreset } from './wizard-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
    Plus, Trash2, Copy, Image, Video, 
    LayoutGrid, Layers, Play, Pause, 
    MoreHorizontal, Edit, Eye, Wand2,
    Download, Upload, FlaskConical, 
    GripVertical, CheckCircle, AlertCircle,
    ExternalLink, Facebook, Trash, RefreshCw, Building2
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { generateSocialCopy } from '@/actions/social-ai';
import { AssetLibraryModal } from '../asset-library-modal';
import { BrandManualPanel } from './brand-manual-panel';
import { AdPreview, AdPreviewModal } from './ad-preview';

const AD_FORMATS = [
    { value: 'IMAGE', label: 'Imagen', icon: Image, desc: 'Anuncio estático de imagen' },
    { value: 'VIDEO', label: 'Video', icon: Video, desc: 'Video de 15-60 segundos' },
    { value: 'CAROUSEL', label: 'Carrusel', icon: LayoutGrid, desc: 'Múltiples imágenes' },
    { value: 'STORY', label: 'Story', icon: Play, desc: 'Formato vertical' },
    { value: 'REEL', label: 'Reel', icon: Play, desc: 'Video corto vertical' },
    { value: 'COLLECTION', label: 'Colección', icon: Layers, desc: 'Catálogo productos' },
];

const PLATFORM_PREVIEWS = [
    { id: 'FACEBOOK_ADS', label: 'Facebook', icon: Facebook, color: '#1877F2' },
    { id: 'GOOGLE_ADS', label: 'Google', icon: Facebook, color: '#4285F4' },
    { id: 'TIKTOK_ADS', label: 'TikTok', icon: Facebook, color: '#000000' },
    { id: 'LINKEDIN_ADS', label: 'LinkedIn', icon: Facebook, color: '#0A66C2' },
];

interface AdGroupManagerProps {
    platform?: string;
}

interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export function AdGroupManager({ platform }: AdGroupManagerProps) {
    const { 
        creative, 
        setCreative,
        addAdGroup, 
        removeAdGroup, 
        setActiveAdGroup,
        addAdToGroup,
        removeAd,
        platforms,
        name: campaignName,
        objective,
        generateAIVariants,
        setAIGenerationConfig,
        brandPresets,
        saveBrandPreset,
        loadBrandPreset
    } = useCampaignWizard();

    const [newGroupName, setNewGroupName] = useState('');
    const [selectedFormat, setSelectedFormat] = useState<Ad['format']>('IMAGE');
    const [isCreatingAd, setIsCreatingAd] = useState(false);
    const [newAdName, setNewAdName] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState<string>(platforms[0] || 'FACEBOOK_ADS');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [bulkCount, setBulkCount] = useState(3);
    const [bulkFormat, setBulkFormat] = useState<Ad['format']>('IMAGE');
    const [showBulk, setShowBulk] = useState(false);
    const [abTestEnabled, setAbTestEnabled] = useState(false);
    const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
    const [adToClone, setAdToClone] = useState<Ad | null>(null);
    const [expandedAd, setExpandedAd] = useState<string | null>(null);
    const [previewAd, setPreviewAd] = useState<Ad | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    const adGroups = creative.adGroups || [];
    const activeGroup = adGroups.find(g => g.id === creative.activeAdGroupId) || adGroups[0];

    function handleCreateGroup() {
        if (!newGroupName.trim()) {
            toast.error('Ingresa un nombre para el grupo');
            return;
        }
        addAdGroup(newGroupName);
        setNewGroupName('');
        toast.success('Grupo de anuncios creado');
    }

    function handleCreateAd() {
        if (!activeGroup) {
            toast.error('Selecciona un grupo primero');
            return;
        }
        if (!newAdName.trim()) {
            toast.error('Ingresa un nombre para el anuncio');
            return;
        }
        
        addAdToGroup(activeGroup.id, {
            name: newAdName,
            status: 'ACTIVE',
            format: selectedFormat,
            headlines: [''],
            descriptions: [''],
            primaryTexts: [''],
            assetUrls: [],
            generatedWithAI: false,
        });
        
        setNewAdName('');
        setIsCreatingAd(false);
        toast.success('Anuncio creado');
    }

    function handleCloneAd(ad: Ad) {
        if (!activeGroup) {
            toast.error('Selecciona un grupo primero');
            return;
        }
        addAdToGroup(activeGroup.id, {
            name: `${ad.name} (copia)`,
            status: 'PAUSED',
            format: ad.format,
            headlines: [...ad.headlines],
            descriptions: [...ad.descriptions],
            primaryTexts: [...ad.primaryTexts],
            assetUrls: [...ad.assetUrls],
            videoUrls: ad.videoUrls ? [...ad.videoUrls] : undefined,
            generatedWithAI: false,
        });
        toast.success('Anuncio clonado');
    }

    function handleBulkCreate() {
        if (!activeGroup) {
            toast.error('Selecciona un grupo primero');
            return;
        }
        const prefixes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        for (let i = 0; i < Math.min(bulkCount, 8); i++) {
            addAdToGroup(activeGroup.id, {
                name: `Variante ${prefixes[i]}`,
                status: 'ACTIVE',
                format: bulkFormat,
                headlines: [''],
                descriptions: [''],
                primaryTexts: [''],
                assetUrls: [],
                generatedWithAI: false,
            });
        }
        toast.success(`${bulkCount} anuncios creados`);
        setShowBulk(false);
    }

    async function handleAIGenerate() {
        if (!activeGroup) {
            toast.error('Selecciona un grupo primero');
            return;
        }
        if (!campaignName) {
            toast.error('Ingresa el nombre de la campaña');
            return;
        }
        
        const config = creative.aiGenerated;
        const brand = creative.brandIdentity;
        const manual = creative.brandManual;
        
        setIsGeneratingAI(true);
        try {
            const count = Math.min(bulkCount, 8);
            
            const ctaMap: Record<string, string> = {
                learn_more: 'Saiba mais',
                sign_up: 'Cadastre-se',
                contact: 'Fale conosco',
                buy_now: 'Compre agora',
                download: 'Baixar',
                apply_now: 'Candidate-se',
                get_quote: 'Solicitar orçamento',
            };
            
            // Brand Manual Context (Full)
            const companyContext = manual?.companyName || brand?.companyName ? `Empresa: ${manual?.companyName || brand?.companyName}.` : '';
            const taglineContext = manual?.tagline || brand?.tagline ? `Tagline: "${manual?.tagline || brand?.tagline}".` : '';
            const historyContext = manual?.history ? `Historia: ${manual.history}` : '';
            const missionContext = manual?.mission ? `Misión: ${manual.mission}` : '';
            const personalityContext = manual?.personality ? `Personalidad: ${manual.personality}` : '';
            const audienceContextManual = manual?.audienceIdeal ? `Cliente ideal: ${manual.audienceIdeal}` : '';
            
            // Values
            const valuesContext = manual?.values?.length ? `Valores: ${manual.values.join(', ')}.` : '';
            
            // Do's and Don'ts
            const dosContext = manual?.dos?.length ? `HACER: ${manual.dos.join(', ')}.` : '';
            const dontsContext = manual?.donts?.length ? `NO HACER: ${manual.donts.join(', ')}.` : '';
            const forbiddenContext = manual?.forbiddenWords?.length ? `EVITAR palabras: ${manual.forbiddenWords.join(', ')}.` : '';
            
            // Few-shot examples
            let fewShotContext = '';
            if (manual?.fewShotExamples?.length) {
                fewShotContext = '\nEJEMPLOS DE COPY:\n';
                manual.fewShotExamples.forEach((ex, idx) => {
                    fewShotContext += `${idx + 1}. Headline: "${ex.headline}" | Desc: "${ex.description}" | CTA: "${ex.cta}"\n`;
                });
            }
            
            // IA Config Context
            const industryContext = config?.industry ? `Industria: ${config.industry.replace('_', ' ')}.` : '';
            const audienceAgeContext = config?.audienceAge || config?.audienceGender 
                ? `Audiencia: ${config?.audienceAge || ''} ${config?.audienceGender || ''}.` 
                : '';
            const keywordsContext = config?.keywords?.length 
                ? `Palabras clave: ${config.keywords.join(', ')}.` 
                : '';
            const brandVoiceContext = config?.brandVoice 
                ? `Voz: ${config.brandVoice}.` 
                : '';
            const objectiveContext = config?.objective 
                ? `Objetivo: ${config.objective.replace('_', ' ')}.` 
                : '';
            const ctaContext = config?.desiredCTA 
                ? `CTA: ${ctaMap[config.desiredCTA] || 'Saiba mais'}.` 
                : '';
            
            const prompt = `Eres copywriter experto. Genera copy publicitario para campaña "${campaignName}".

IDENTIDAD DE MARCA:
${companyContext}
${taglineContext}

MARCA Y PROPÓSITO:
${historyContext}
${missionContext}

PERSONALIDAD:
${personalityContext}
${valuesContext}
${audienceContextManual}

DIRECTRICES:
${dosContext}
${dontsContext}
${forbiddenContext}

CAMPAÑA:
${objectiveContext} ${industryContext} ${audienceAgeContext} ${keywordsContext}

REQUISITOS:
- Voz: ${brandVoiceContext}
- CTA: ${ctaContext}
- Evita las palabras prohibidaslisted

${fewShotContext}

Genera ${count} variants de copy en español, seguindo as directrices de marca. Formato JSON: {headline, description, primaryText, cta}.`;
            
            const res = await generateSocialCopy(prompt);
            let generatedCount = 0;
            
            if (res.success && res.data) {
                const platformData = res.data[selectedPlatform.toLowerCase()] || Object.values(res.data)[0];
                if (platformData) {
                    const variants = platformData.split('\n').filter(Boolean).slice(0, count);
                    for (let i = 0; i < variants.length; i++) {
                        const text = variants[i];
                        addAdToGroup(activeGroup.id, {
                            name: `IA Variant ${i + 1}`,
                            status: 'ACTIVE',
                            format: bulkFormat,
                            headlines: [text.substring(0, 40)],
                            descriptions: [text.substring(40, 125).trim()],
                            primaryTexts: [text],
                            assetUrls: brand?.brandLogo ? [brand.brandLogo] : [],
                            callToAction: ctaMap[config?.desiredCTA || 'learn_more'],
                            generatedWithAI: true,
                        });
                        generatedCount++;
                    }
                }
            }
            
            if (generatedCount === 0) {
                const cta = ctaMap[config?.desiredCTA || 'learn_more'];
                const companyName = brand?.companyName || campaignName;
                for (let i = 0; i < count; i++) {
                    addAdToGroup(activeGroup.id, {
                        name: `IA Variant ${i + 1}`,
                        status: 'ACTIVE',
                        format: bulkFormat,
                        headlines: [`${campaignName}: La solución ideal para ti`],
                        descriptions: [`Descubre cómo transformar tu negocio con nuestra solución. ${config?.objective === 'conversions' ? '¡ Resultados garantizados!' : '¡Contáctanos hoy!'}`],
                        primaryTexts: [`Campaña: ${campaignName}`],
                        assetUrls: [],
                        callToAction: cta,
                        generatedWithAI: true,
                    });
                }
                generatedCount = count;
            }
            
            toast.success(`✨ ${generatedCount} variantes generadas con IA (coherentes con la marca)`);
        } catch (error) {
            toast.error('Error al generar con IA');
        } finally {
            setIsGeneratingAI(false);
        }
    }

    function validateAd(ad: Ad): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        if (!ad.headlines[0]?.trim()) errors.push('Falta headline principal');
        if (!ad.descriptions[0]?.trim()) warnings.push('Descripción vacía');
        
        if (ad.headlines[0]?.length > 40) errors.push('Headline excede 40 caracteres');
        if (ad.descriptions[0]?.length > 125) warnings.push('Descripción excede 125 caracteres');
        
        if (ad.format === 'IMAGE' && ad.assetUrls.length === 0) warnings.push('Sin imagen');
        if (ad.format === 'VIDEO' && (!ad.videoUrls || ad.videoUrls.length === 0)) warnings.push('Sin video');
        
        return { valid: errors.length === 0, errors, warnings };
    }

    function handleExportAds() {
        const data = JSON.stringify(adGroups, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ads-${campaignName || 'export'}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Ads exportados');
    }

    function handleImportAds(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target?.result as string);
                if (Array.isArray(imported)) {
                    if (!activeGroup) {
                        addAdGroup('Importados');
                    }
                    const targetGroupId = activeGroup?.id || adGroups[0]?.id;
                    if (targetGroupId) {
                        imported.forEach((ad: Omit<Ad, 'id' | 'createdAt'>) => {
                            addAdToGroup(targetGroupId, {
                                name: ad.name,
                                status: ad.status || 'ACTIVE',
                                format: ad.format || 'IMAGE',
                                headlines: ad.headlines || [''],
                                descriptions: ad.descriptions || [''],
                                primaryTexts: ad.primaryTexts || [''],
                                assetUrls: ad.assetUrls || [],
                                videoUrls: ad.videoUrls,
                                generatedWithAI: false,
                            });
                        });
                        toast.success(`${imported.length} anuncios importados`);
                    }
                }
            } catch (error) {
                toast.error('Error al importar JSON');
            }
        };
        reader.readAsText(file);
    }

    function toggleAdSelection(adId: string) {
        setSelectedAdIds(prev => 
            prev.includes(adId) 
                ? prev.filter(id => id !== adId)
                : [...prev, adId]
        );
    }

    function moveAd(fromIndex: number, toIndex: number) {
        if (!activeGroup) return;
        const ads = [...activeGroup.ads];
        const [moved] = ads.splice(fromIndex, 1);
        ads.splice(toIndex, 0, moved);
        
        setCreative({
            adGroups: adGroups.map(g => 
                g.id === activeGroup.id ? { ...g, ads } : g
            )
        });
    }

    const totalAds = adGroups.reduce((sum, g) => sum + g.ads.length, 0);

    return (
        <div className="space-y-6">
            <Tabs defaultValue="ads" className="w-full">
                <TabsList className="bg-slate-800 border-slate-700">
                    <TabsTrigger value="ads" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <Layers className="w-4 h-4 mr-2" />
                        Ads ({totalAds})
                    </TabsTrigger>
                    <TabsTrigger value="brand" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <Building2 className="w-4 h-4 mr-2" />
                        Marca
                    </TabsTrigger>
                    <TabsTrigger value="config" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <Wand2 className="w-4 h-4 mr-2" />
                        IA Config
                    </TabsTrigger>
                    <TabsTrigger value="ab" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <FlaskConical className="w-4 h-4 mr-2" />
                        A/B
                    </TabsTrigger>
                    <TabsTrigger value="tools" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Tools
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ads" className="space-y-6 mt-4">
                    {/* Header Stats */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Layers className="w-5 h-5 text-purple-400" />
                                <span className="text-white font-semibold">Grupos de Anuncios</span>
                            </div>
                            <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                                {adGroups.length} grupos
                            </Badge>
                            <Badge variant="outline" className="border-teal-500/30 text-teal-400">
                                {totalAds} anuncios
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <Input
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Nombre del grupo"
                                    className="w-40 h-9 bg-slate-800 border-slate-700 text-white text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                                />
                                <Button 
                                    onClick={handleCreateGroup}
                                    size="sm"
                                    className="h-9 bg-purple-600 hover:bg-purple-500"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Ad Groups Tabs */}
                    {adGroups.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {adGroups.map((group) => (
                                    <button
                                        key={group.id}
                                        type="button"
                                        onClick={() => setActiveAdGroup(group.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                                            creative.activeAdGroupId === group.id
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                        <span>{group.name}</span>
                                        <Badge variant="outline" className={`text-xs ${creative.activeAdGroupId === group.id ? 'bg-white/20 border-white/30' : 'border-slate-600'}`}>
                                            {group.ads.length}
                                        </Badge>
                                        {group.status === 'PAUSED' && <Pause className="w-3 h-3" />}
                                    </button>
                                ))}
                            </div>

                            {/* Active Group Content */}
                            {activeGroup && (
                                <Card className="bg-slate-900 border-slate-800">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-white font-semibold">{activeGroup.name}</h3>
                                                <p className="text-sm text-slate-400">{activeGroup.ads.length} anuncios en este grupo</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => setIsCreatingAd(!isCreatingAd)}
                                                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Nuevo Anuncio
                                                </Button>
                                                <Button 
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowBulk(!showBulk)}
                                                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                                >
                                                    <RefreshCw className="w-4 h-4 mr-1" />
                                                    Bulk Create
                                                </Button>
                                                <Button 
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsGeneratingAI(true)}
                                                    disabled={isGeneratingAI}
                                                    className="border-purple-700 text-purple-400 hover:bg-purple-500/20"
                                                >
                                                    <Wand2 className="w-4 h-4 mr-1" />
                                                    IA Generate
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => {
                                                        removeAdGroup(activeGroup.id);
                                                        toast.success('Grupo eliminado');
                                                    }}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* AI Generation Modal */}
                                        {isGeneratingAI && (
                                            <div className="mb-6 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Wand2 className="w-5 h-5 text-purple-400" />
                                                        <span className="text-white font-semibold">Generar con IA</span>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => setIsGeneratingAI(false)}
                                                        className="text-slate-400"
                                                    >
                                                        ✕
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div>
                                                        <Label className="text-slate-400 text-xs">Cantidad de variants</Label>
                                                        <Input
                                                            type="number"
                                                            value={bulkCount}
                                                            onChange={(e) => setBulkCount(parseInt(e.target.value) || 3)}
                                                            min={1}
                                                            max={8}
                                                            className="bg-slate-950 border-slate-700 text-white mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-slate-400 text-xs">Formato</Label>
                                                        <div className="flex gap-2 mt-1 flex-wrap">
                                                            {AD_FORMATS.slice(0, 3).map((format) => (
                                                                <button
                                                                    key={format.value}
                                                                    type="button"
                                                                    onClick={() => setBulkFormat(format.value as Ad['format'])}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs ${
                                                                        bulkFormat === format.value
                                                                            ? 'bg-purple-600 text-white'
                                                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                                    }`}
                                                                >
                                                                    {format.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-slate-400 text-xs">Plataforma</Label>
                                                        <div className="flex gap-2 mt-1 flex-wrap">
                                                            {PLATFORM_PREVIEWS.slice(0, 2).map((p) => (
                                                                <button
                                                                    key={p.id}
                                                                    type="button"
                                                                    onClick={() => setSelectedPlatform(p.id)}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs ${
                                                                        selectedPlatform === p.id
                                                                            ? 'bg-blue-600 text-white'
                                                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                                    }`}
                                                                >
                                                                    {p.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button 
                                                        onClick={handleAIGenerate}
                                                        className="bg-purple-600 hover:bg-purple-500"
                                                    >
                                                        <Wand2 className="w-4 h-4 mr-1" />
                                                        Generar {bulkCount} Variantes
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Bulk Create */}
                                        {showBulk && (
                                            <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <Label className="text-slate-400 text-xs">Cantidad a crear</Label>
                                                        <Input
                                                            type="number"
                                                            value={bulkCount}
                                                            onChange={(e) => setBulkCount(parseInt(e.target.value) || 3)}
                                                            min={1}
                                                            max={8}
                                                            className="bg-slate-950 border-slate-700 text-white mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-slate-400 text-xs">Formato</Label>
                                                        <div className="flex gap-2 mt-1 flex-wrap">
                                                            {AD_FORMATS.map((format) => (
                                                                <button
                                                                    key={format.value}
                                                                    type="button"
                                                                    onClick={() => setBulkFormat(format.value as Ad['format'])}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 ${
                                                                        bulkFormat === format.value
                                                                            ? 'bg-teal-600 text-white'
                                                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                                    }`}
                                                                >
                                                                    <format.icon className="w-3 h-3" />
                                                                    {format.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        onClick={() => setShowBulk(false)}
                                                        className="text-slate-400"
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button 
                                                        onClick={handleBulkCreate}
                                                        className="bg-teal-600 hover:bg-teal-500"
                                                    >
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        Crear {bulkCount} Anuncios
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Create Ad Form */}
                                        {isCreatingAd && (
                                            <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <Label className="text-slate-400 text-xs">Nombre del anuncio</Label>
                                                        <Input
                                                            value={newAdName}
                                                            onChange={(e) => setNewAdName(e.target.value)}
                                                            placeholder="Ej: Anuncio Principal Variant A"
                                                            className="bg-slate-950 border-slate-700 text-white mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-slate-400 text-xs">Formato</Label>
                                                        <div className="flex gap-2 mt-1 flex-wrap">
                                                            {AD_FORMATS.map((format) => (
                                                                <button
                                                                    key={format.value}
                                                                    type="button"
                                                                    onClick={() => setSelectedFormat(format.value as Ad['format'])}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                                                                        selectedFormat === format.value
                                                                            ? 'bg-teal-600 text-white'
                                                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                                    }`}
                                                                >
                                                                    <format.icon className="w-3 h-3" />
                                                                    {format.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        onClick={() => setIsCreatingAd(false)}
                                                        className="text-slate-400"
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button 
                                                        onClick={handleCreateAd}
                                                        className="bg-teal-600 hover:bg-teal-500"
                                                    >
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        Crear Anuncio
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Ads List with Drag & Drop */}
                                        {activeGroup.ads.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {activeGroup.ads.map((ad, idx) => {
                                                    const formatConfig = AD_FORMATS.find(f => f.value === ad.format);
                                                    const FormatIcon = formatConfig?.icon || Image;
                                                    const validation = validateAd(ad);
                                                    
                                                    return (
                                                        <div 
                                                            key={ad.id}
                                                            className={`p-4 bg-slate-800/50 rounded-lg border transition-colors ${
                                                                validation.valid ? 'border-slate-700 hover:border-slate-600' : 'border-red-500/30'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <button className="cursor-grab text-slate-600 hover:text-slate-400">
                                                                        <GripVertical className="w-4 h-4" />
                                                                    </button>
                                                                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                                                                        <FormatIcon className="w-4 h-4 text-slate-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-white text-sm font-medium">{ad.name}</p>
                                                                        <p className="text-xs text-slate-500">{formatConfig?.label}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCloneAd(ad)}
                                                                        className="p-1 text-slate-500 hover:text-purple-400"
                                                                        title="Clonar"
                                                                    >
                                                                        <Copy className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setExpandedAd(expandedAd === ad.id ? null : ad.id)}
                                                                        className={`p-1 ${expandedAd === ad.id ? 'text-teal-400' : 'text-slate-500 hover:text-teal-400'}`}
                                                                        title="Editar"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setPreviewAd(ad);
                                                                            setIsPreviewModalOpen(true);
                                                                        }}
                                                                        className="p-1 text-slate-500 hover:text-blue-400"
                                                                        title="Vista Previa"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeAd(activeGroup.id, ad.id)}
                                                                        className="p-1 text-slate-500 hover:text-red-400"
                                                                        title="Eliminar"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Validation Status */}
                                                            {(!validation.valid || validation.warnings.length > 0) && (
                                                                <div className="mb-3 flex flex-wrap gap-1">
                                                                    {validation.errors.map((err, i) => (
                                                                        <Badge key={i} variant="outline" className="border-red-500/30 text-red-400 text-xs">
                                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                                            {err}
                                                                        </Badge>
                                                                    ))}
                                                                    {validation.warnings.map((warn, i) => (
                                                                        <Badge key={i} variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                                                                            {warn}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Ad Preview */}
                                                            <div className="aspect-video bg-slate-900 rounded-lg mb-3 flex items-center justify-center relative">
                                                                {ad.assetUrls.length > 0 ? (
                                                                    <img 
                                                                        src={ad.assetUrls[0]} 
                                                                        alt={ad.name}
                                                                        className="w-full h-full object-cover rounded-lg"
                                                                    />
                                                                ) : (
                                                                    <div className="text-center p-2">
                                                                        <Image className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                                                        <p className="text-xs text-slate-500">Sin assets</p>
                                                                    </div>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setIsAssetModalOpen(true)}
                                                                    className="absolute bottom-1 right-1 p-1.5 bg-slate-800/80 rounded-lg text-slate-300 hover:text-white"
                                                                >
                                                                    <Upload className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            
                                                            {/* Headline/Description Preview */}
                                                            {expandedAd === ad.id && (
                                                                <div className="space-y-2 mb-3 p-2 bg-slate-900 rounded-lg">
                                                                    <div>
                                                                        <Label className="text-slate-500 text-xs">Headline</Label>
                                                                        <Input
                                                                            value={ad.headlines[0] || ''}
                                                                            onChange={(e) => {
                                                                                const newHeadlines = [...ad.headlines];
                                                                                newHeadlines[0] = e.target.value;
                                                                                setCreative({
                                                                                    adGroups: adGroups.map(g => 
                                                                                        g.id === activeGroup.id 
                                                                                            ? { ...g, ads: g.ads.map(a => a.id === ad.id ? { ...a, headlines: newHeadlines } : a) }
                                                                                            : g
                                                                                    )
                                                                                });
                                                                            }}
                                                                            placeholder="Headline principal"
                                                                            className="bg-slate-950 border-slate-700 text-white text-sm h-8"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-slate-500 text-xs">Descripción</Label>
                                                                        <Input
                                                                            value={ad.descriptions[0] || ''}
                                                                            onChange={(e) => {
                                                                                const newDescriptions = [...ad.descriptions];
                                                                                newDescriptions[0] = e.target.value;
                                                                                setCreative({
                                                                                    adGroups: adGroups.map(g => 
                                                                                        g.id === activeGroup.id 
                                                                                            ? { ...g, ads: g.ads.map(a => a.id === ad.id ? { ...a, descriptions: newDescriptions } : a) }
                                                                                            : g
                                                                                    )
                                                                                });
                                                                            }}
                                                                            placeholder="Descripción"
                                                                            className="bg-slate-950 border-slate-700 text-white text-sm h-8"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Platform Preview Toggle */}
                                                            <div className="flex gap-1 mb-3">
                                                                {PLATFORM_PREVIEWS.slice(0, 2).map((p) => (
                                                                    <button
                                                                        key={p.id}
                                                                        type="button"
                                                                        className="flex-1 py-1 bg-slate-700/50 rounded text-xs text-slate-400 hover:bg-slate-700"
                                                                    >
                                                                        {p.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            
                                                            {/* Status & Actions */}
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge 
                                                                        variant={ad.status === 'ACTIVE' ? 'default' : 'outline'}
                                                                        className={ad.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'border-slate-600 text-slate-400'}
                                                                    >
                                                                        {ad.status === 'ACTIVE' ? 'Activo' : 'Pausado'}
                                                                    </Badge>
                                                                    {ad.generatedWithAI && (
                                                                        <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                                                                            <Wand2 className="w-3 h-3 mr-1" />
                                                                            IA
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleAdSelection(ad.id)}
                                                                        className={`p-1 rounded ${selectedAdIds.includes(ad.id) ? 'bg-teal-600 text-white' : 'text-slate-500 hover:text-teal-400'}`}
                                                                    >
                                                                        <CheckCircle className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
                                                <Image className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                                <p className="text-slate-400">No hay anuncios en este grupo</p>
                                                <p className="text-xs text-slate-500 mt-1">Crea tu primer anuncio para este grupo</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
                            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400">No hay grupos de anuncios</p>
                            <p className="text-xs text-slate-500 mt-1 mb-4">Crea un grupo para organizar tus anuncios</p>
                            <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
                                <Input
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Nombre del grupo (ej: SegmentoMujeres)"
                                    className="bg-slate-800 border-slate-700 text-white"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                                />
                                <Button onClick={handleCreateGroup} className="bg-purple-600 hover:bg-purple-500">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="brand" className="space-y-4 mt-4">
                    <BrandManualPanel />
                </TabsContent>

                <TabsContent value="config" className="space-y-4 mt-4">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-purple-400" />
                                Configuración IA
                            </CardTitle>
                            <p className="text-slate-400 text-sm">Parámetros para generación coherente con la marca</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Brand Voice */}
                            <div className="space-y-3">
                                <Label className="text-slate-300 text-sm font-medium">Voz de Marca</Label>
                                <div className="flex flex-wrap gap-2">
                                    {(['professional', 'casual', 'innovative', 'premium', 'friendly', 'urgent'] as const).map((voice) => (
                                        <button
                                            key={voice}
                                            type="button"
                                            onClick={() => setAIGenerationConfig({ brandVoice: voice })}
                                            className={`px-4 py-2 rounded-lg text-sm transition-all ${
                                                creative.aiGenerated?.brandVoice === voice
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                            }`}
                                        >
                                            {voice.charAt(0).toUpperCase() + voice.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Industry */}
                            <div className="space-y-3">
                                <Label className="text-slate-300 text-sm font-medium">Industria</Label>
                                <div className="flex flex-wrap gap-2">
                                    {(['b2b', 'saas', 'ecommerce', 'services', 'healthcare', 'education', 'real_estate', 'finance', 'food', 'travel', 'other'] as const).map((ind) => (
                                        <button
                                            key={ind}
                                            type="button"
                                            onClick={() => setAIGenerationConfig({ industry: ind })}
                                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                                                creative.aiGenerated?.industry === ind
                                                    ? 'bg-teal-600 text-white'
                                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                            }`}
                                        >
                                            {ind.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Objective & CTA */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-slate-300 text-sm font-medium">Objetivo</Label>
                                    <select
                                        value={creative.aiGenerated?.objective || 'lead_generation'}
                                        onChange={(e) => setAIGenerationConfig({ objective: e.target.value as AIGenerationConfig['objective'] })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                    >
                                        <option value="lead_generation">Lead Generation</option>
                                        <option value="conversions">Conversiones</option>
                                        <option value="traffic">Tráfico</option>
                                        <option value="brand_awareness"> awareness de Marca</option>
                                        <option value="engagement">Engagement</option>
                                        <option value="retargeting">Remarketing</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-slate-300 text-sm font-medium">CTA Deseado</Label>
                                    <select
                                        value={creative.aiGenerated?.desiredCTA || 'learn_more'}
                                        onChange={(e) => setAIGenerationConfig({ desiredCTA: e.target.value as AIGenerationConfig['desiredCTA'] })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                    >
                                        <option value="learn_more">Saber más</option>
                                        <option value="sign_up">Registrarse</option>
                                        <option value="contact">Contactar</option>
                                        <option value="buy_now">Comprar ahora</option>
                                        <option value="download">Descargar</option>
                                        <option value="apply_now">Aplicar ahora</option>
                                        <option value="get_quote">Obtener cotización</option>
                                    </select>
                                </div>
                            </div>

                            {/* Audience */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-slate-300 text-sm font-medium">Audiencia: Edad</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {(['18-24', '25-34', '35-44', '45-54', '55+'] as const).map((age) => (
                                            <button
                                                key={age}
                                                type="button"
                                                onClick={() => setAIGenerationConfig({ audienceAge: age })}
                                                className={`px-3 py-1 rounded-lg text-xs ${
                                                    creative.aiGenerated?.audienceAge === age
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                }`}
                                            >
                                                {age}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-slate-300 text-sm font-medium">Audiencia: Género</Label>
                                    <div className="flex gap-2">
                                        {(['male', 'female', 'all'] as const).map((gen) => (
                                            <button
                                                key={gen}
                                                type="button"
                                                onClick={() => setAIGenerationConfig({ audienceGender: gen })}
                                                className={`px-3 py-1 rounded-lg text-xs ${
                                                    creative.aiGenerated?.audienceGender === gen
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                }`}
                                            >
                                                {gen === 'all' ? 'Todos' : gen === 'male' ? 'Masculino' : 'Femenino'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Copy Style */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-slate-300 text-sm font-medium">Estilo de Hook</Label>
                                    <div className="flex flex-wrap gap-1">
                                        {(['question', 'statement', 'benefit', 'pain_point', 'statistic', 'testimonial'] as const).map((hook) => (
                                            <button
                                                key={hook}
                                                type="button"
                                                onClick={() => setAIGenerationConfig({ hookStyle: hook })}
                                                className={`px-2 py-1 rounded text-xs ${
                                                    creative.aiGenerated?.hookStyle === hook
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                }`}
                                            >
                                                {hook.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-slate-300 text-sm font-medium">Estilo de Headline</Label>
                                    <div className="flex flex-wrap gap-1">
                                        {(['how_to', 'question', 'scarcity', 'social_proof', 'urgency', 'curiosity'] as const).map((style) => (
                                            <button
                                                key={style}
                                                type="button"
                                                onClick={() => setAIGenerationConfig({ headlineStyle: style })}
                                                className={`px-2 py-1 rounded text-xs ${
                                                    creative.aiGenerated?.headlineStyle === style
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                }`}
                                            >
                                                {style.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Keywords */}
                            <div className="space-y-3">
                                <Label className="text-slate-300 text-sm font-medium">Palabras Clave (separadas por coma)</Label>
                                <Input
                                    value={creative.aiGenerated?.keywords?.join(', ') || ''}
                                    onChange={(e) => setAIGenerationConfig({ keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                                    placeholder="ej: marketing digital, leads, crecimiento, ventas"
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>

                            {/* Brand Presets */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-300 text-sm font-medium">Presets de Marca</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="preset-name"
                                            placeholder="Nombre del preset"
                                            className="w-32 h-8 bg-slate-800 border-slate-700 text-white text-xs"
                                        />
                                        <Button 
                                            size="sm"
                                            onClick={() => {
                                                const name = (document.getElementById('preset-name') as HTMLInputElement)?.value;
                                                if (name) saveBrandPreset(name);
                                            }}
                                            className="h-8 bg-purple-600 hover:bg-purple-500"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {brandPresets.map((preset) => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => loadBrandPreset(preset)}
                                            className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 flex items-center gap-2"
                                        >
                                            {preset.name}
                                        </button>
                                    ))}
                                    {brandPresets.length === 0 && (
                                        <p className="text-slate-500 text-xs">Sin presets guardados</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ab" className="space-y-4 mt-4">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-white text-lg">A/B Testing</CardTitle>
                                    <p className="text-slate-400 text-sm">Selecciona anuncios para testear</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-sm">Activado</span>
                                    <Switch 
                                        checked={abTestEnabled}
                                        onCheckedChange={setAbTestEnabled}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {selectedAdIds.length < 2 ? (
                                <div className="text-center py-8">
                                    <FlaskConical className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400">Selecciona al menos 2 anuncios para A/B Testing</p>
                                    <p className="text-xs text-slate-500 mt-1">Haz clic en el check de cada anuncio</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-800/50 rounded-lg">
                                            <Label className="text-slate-400 text-xs">Variante A (Control)</Label>
                                            <p className="text-white mt-1">50% del tráfico</p>
                                        </div>
                                        <div className="p-4 bg-slate-800/50 rounded-lg">
                                            <Label className="text-slate-400 text-xs">Variante B (Test)</Label>
                                            <p className="text-white mt-1">50% del tráfico</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedAdIds.map((id, idx) => (
                                            <Badge key={id} className="bg-teal-600 text-white">
                                                {idx === 0 ? 'A' : 'B'}: {id.substring(0, 8)}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tools" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white text-lg flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    Exportar
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-400 text-sm mb-4">Descarga todos los grupos y anuncios como JSON</p>
                                <Button 
                                    onClick={handleExportAds}
                                    className="w-full bg-teal-600 hover:bg-teal-500"
                                    disabled={totalAds === 0}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Exportar ({totalAds} ads)
                                </Button>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white text-lg flex items-center gap-2">
                                    <Upload className="w-5 h-5" />
                                    Importar
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-400 text-sm mb-4">Carga anuncios desde un archivo JSON</p>
                                <label className="flex items-center justify-center w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                                    <Upload className="w-4 h-4 mr-2 text-slate-400" />
                                    <span className="text-slate-300 text-sm">Seleccionar archivo</span>
                                    <input 
                                        type="file" 
                                        accept=".json" 
                                        onChange={handleImportAds}
                                        className="hidden"
                                    />
                                </label>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <AssetLibraryModal
                open={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
                onSelectAsset={(url: string) => {
                    if (activeGroup && activeGroup.ads.length > 0) {
                        const adId = activeGroup.ads[0].id;
                        setCreative({
                            adGroups: adGroups.map(g => 
                                g.id === activeGroup.id 
                                    ? { ...g, ads: g.ads.map(a => a.id === adId ? { ...a, assetUrls: [...a.assetUrls, url] } : a) }
                                    : g
                            )
                        });
                    }
                    toast.success('Asset agregado');
                }}
            />
            
            {/* Preview Modal */}
            {isPreviewModalOpen && previewAd && (
                <div 
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setIsPreviewModalOpen(false)}
                >
                    <div 
                        className="bg-slate-900 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold text-lg">Vista Previa del Anuncio</h3>
                            <button 
                                onClick={() => setIsPreviewModalOpen(false)} 
                                className="text-slate-400 hover:text-white text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        <AdPreview 
                            ad={previewAd} 
                            brand={creative.brandIdentity} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}