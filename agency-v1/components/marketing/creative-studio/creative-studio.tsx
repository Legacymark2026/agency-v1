'use client';

import { useState } from 'react';
import { ImageGenerator } from './image-generator';
import { VideoGenerator } from './video-generator';
import { CopyGenerator } from './copy-generator';
import { LayerEditor } from './layer-editor';
import { AssetGallery } from './asset-gallery';
import { PlatformPreview } from './platform-preview';
import { BrandKitPanel } from './brand-kit-panel';
import { ABTestDashboard } from './ab-test-dashboard';
import { CreativeInsights } from './creative-insights';
import { DriveImporter } from './drive-importer';
import { CreativeBriefWizard } from './batch-engine';
import { AnnotationCanvas } from './annotation-canvas';
import { ExportKitPanel } from './export-kit';
import { AssetCollectionsPanel } from './asset-collections-panel';
import { AssetVersionHistory } from './version-history';
import { useCampaignWizard } from '@/components/marketing/campaign-wizard/wizard-store';
import {
    Sparkles, Upload, Layers, Eye, Image as ImageIcon, Video, Type,
    ChevronRight, Wand2, Palette, BarChart3, TrendingUp, FolderOpen,
    FlaskConical, Package, MessageSquare, History, FolderKanban,
    Zap, Bot
} from 'lucide-react';

type MainTab = 'AI' | 'BATCH' | 'MANUAL' | 'LAYER' | 'PREVIEW' | 'BRAND' | 'ABTEST' | 'INSIGHTS' | 'COLLAB' | 'EXPORT';
type AISubTab = 'IMAGE' | 'VIDEO' | 'COPY';
type CollabSubTab = 'ANNOTATIONS' | 'VERSIONS' | 'COLLECTIONS';

interface CreativeStudioProps {
    campaignId?: string;
    abTestId?: string;
    currentUserId?: string;
}

export function CreativeStudio({ campaignId, abTestId, currentUserId }: CreativeStudioProps) {
    const [mainTab, setMainTab] = useState<MainTab>('AI');
    const [aiSubTab, setAISubTab] = useState<AISubTab>('IMAGE');
    const [collabSubTab, setCollabSubTab] = useState<CollabSubTab>('ANNOTATIONS');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>();
    const [previewHeadline, setPreviewHeadline] = useState<string | undefined>();
    const [layerBaseImage, setLayerBaseImage] = useState<string | undefined>();
    const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>();

    const { creative, platforms } = useCampaignWizard();
    const wizardAssets = creative.assetUrls;
    const primaryPlatform = platforms[0] ?? 'FACEBOOK_ADS';

    function handleImageGenerated(url: string, assetId?: string) {
        setPreviewImageUrl(url);
        setLayerBaseImage(url);
        if (assetId) setSelectedAssetId(assetId);
    }

    function handleCopyApplied(_platform: string, copy: Record<string, unknown>) {
        setPreviewHeadline(String(copy.headline ?? copy.intro ?? ''));
    }

    const MAIN_TABS = [
        { key: 'AI' as const, icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Generación IA' },
        { key: 'BATCH' as const, icon: <Bot className="w-3.5 h-3.5" />, label: 'Brief → Batch', badge: 'NEW' },
        { key: 'MANUAL' as const, icon: <Upload className="w-3.5 h-3.5" />, label: 'Galería / Upload' },
        { key: 'LAYER' as const, icon: <Layers className="w-3.5 h-3.5" />, label: 'Editor de Capas' },
        { key: 'PREVIEW' as const, icon: <Eye className="w-3.5 h-3.5" />, label: 'Preview' },
        { key: 'BRAND' as const, icon: <Palette className="w-3.5 h-3.5" />, label: 'Brand Kit' },
        { key: 'ABTEST' as const, icon: <FlaskConical className="w-3.5 h-3.5" />, label: 'A/B Tests' },
        { key: 'INSIGHTS' as const, icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Insights' },
        { key: 'COLLAB' as const, icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'Colaboración', badge: 'NEW' },
        { key: 'EXPORT' as const, icon: <Package className="w-3.5 h-3.5" />, label: 'Export Kit', badge: 'NEW' },
    ];

    const AI_SUBTABS = [
        { key: 'IMAGE' as const, icon: <ImageIcon className="w-3.5 h-3.5" />, label: 'Imagen' },
        { key: 'VIDEO' as const, icon: <Video className="w-3.5 h-3.5" />, label: 'Video' },
        { key: 'COPY' as const, icon: <Type className="w-3.5 h-3.5" />, label: 'Copywriting' },
    ];

    const COLLAB_SUBTABS = [
        { key: 'ANNOTATIONS' as const, icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'Anotaciones' },
        { key: 'VERSIONS' as const, icon: <History className="w-3.5 h-3.5" />, label: 'Versiones' },
        { key: 'COLLECTIONS' as const, icon: <FolderKanban className="w-3.5 h-3.5" />, label: 'Colecciones' },
    ];

    return (
        <div style={{ minHeight: "100vh", background: "transparent", color: "white" }}>
            {/* ── Header ── */}
            <div style={{ borderBottom: "1px solid rgba(30,41,59,0.8)", background: "rgba(11,15,25,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #0d9488, #2dd4bf)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Wand2 style={{ width: "18px", height: "18px", color: "white" }} />
                        </div>
                        <div>
                            <h1 style={{ fontWeight: 800, fontSize: "16px", color: "#e2e8f0", margin: 0 }}>Creative Studio</h1>
                            <p style={{ fontSize: "11px", color: "#334155", fontFamily: "monospace", margin: 0 }}>Gemini Imagen 3 · Veo 2 · Batch Engine · Collab</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {selectedAssetId && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#475569", fontFamily: "monospace" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />
                                Asset seleccionado
                            </div>
                        )}
                        {campaignId && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#475569", fontFamily: "monospace" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                                Vinculado a campaña
                                {wizardAssets.length > 0 && (
                                    <span style={{ marginLeft: "6px", padding: "1px 8px", background: "rgba(13,148,136,0.15)", color: "#2dd4bf", borderRadius: "99px", border: "1px solid rgba(13,148,136,0.3)" }}>
                                        {wizardAssets.length} assets
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main tabs — scrollable */}
                <div className="max-w-7xl mx-auto px-6 flex gap-0 overflow-x-auto pb-0 scrollbar-hide">
                    {MAIN_TABS.map((tab) => (
                        <button key={tab.key} id={`creative-tab-${tab.key.toLowerCase()}`} type="button"
                            onClick={() => setMainTab(tab.key)}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "10px 14px", fontSize: "12px", fontWeight: 600,
                                borderBottom: mainTab === tab.key ? "2px solid #2dd4bf" : "2px solid transparent",
                                color: mainTab === tab.key ? "#2dd4bf" : "#475569",
                                background: "transparent", border: "none",
                                cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
                                fontFamily: "monospace",
                            }}>
                            {tab.icon} {tab.label}
                            {tab.badge && (
                                <span style={{ fontSize: "8px", padding: "1px 5px", background: "rgba(99,102,241,0.2)", color: "#818cf8", borderRadius: "99px", border: "1px solid rgba(99,102,241,0.3)" }}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* ── AI Generation ── */}
                {mainTab === 'AI' && (
                    <div className="space-y-6">
                        <div style={{ display: "flex", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "12px", padding: "4px", gap: "4px", maxWidth: "320px" }}>
                            {AI_SUBTABS.map((sub) => (
                                <button key={sub.key} id={`ai-subtab-${sub.key.toLowerCase()}`} type="button"
                                    onClick={() => setAISubTab(sub.key)}
                                    style={{
                                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                                        gap: "6px", padding: "8px", borderRadius: "8px", fontSize: "12px",
                                        fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                                        background: aiSubTab === sub.key ? "rgba(13,148,136,0.2)" : "transparent",
                                        border: aiSubTab === sub.key ? "1px solid rgba(13,148,136,0.4)" : "1px solid transparent",
                                        color: aiSubTab === sub.key ? "#2dd4bf" : "#475569",
                                        boxShadow: aiSubTab === sub.key ? "0 0 12px rgba(13,148,136,0.2)" : undefined,
                                        fontFamily: "monospace",
                                    }}>
                                    {sub.icon} {sub.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "16px", padding: "24px" }}>
                            {aiSubTab === 'IMAGE' && (
                                <>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                                        <ImageIcon style={{ width: "18px", height: "18px", color: "#2dd4bf" }} />
                                        <h2 style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "15px", margin: 0 }}>Generación de Imagen</h2>
                                        <span style={{ fontSize: "10px", padding: "2px 8px", background: "rgba(13,148,136,0.15)", color: "#2dd4bf", borderRadius: "99px", border: "1px solid rgba(13,148,136,0.3)", fontFamily: "monospace" }}>Gemini Imagen 3</span>
                                    </div>
                                    <ImageGenerator campaignId={campaignId} onAssetGenerated={(url, assetId) => handleImageGenerated(url, assetId)} />
                                </>
                            )}
                            {aiSubTab === 'VIDEO' && (
                                <>
                                    <div className="flex items-center gap-2 mb-6">
                                        <Video className="w-5 h-5 text-pink-400" />
                                        <h2 className="font-semibold text-white">Generación de Video</h2>
                                        <span className="text-xs px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded-full border border-pink-500/30">Veo 2</span>
                                    </div>
                                    <VideoGenerator campaignId={campaignId} platform={primaryPlatform} />
                                </>
                            )}
                            {aiSubTab === 'COPY' && (
                                <>
                                    <div className="flex items-center gap-2 mb-6">
                                        <Type className="w-5 h-5 text-emerald-400" />
                                        <h2 className="font-semibold text-white">Generador de Copy</h2>
                                        <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">Gemini Flash</span>
                                    </div>
                                    <CopyGenerator campaignId={campaignId} defaultPlatform={primaryPlatform} onCopyApplied={handleCopyApplied} />
                                </>
                            )}
                        </div>

                        {previewImageUrl && (
                            <button type="button" onClick={() => setMainTab('PREVIEW')}
                                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#2dd4bf", background: "none", border: "none", cursor: "pointer", fontFamily: "monospace" }}>
                                <Eye style={{ width: "14px", height: "14px" }} /> Ver preview en plataforma
                                <ChevronRight style={{ width: "14px", height: "14px" }} />
                            </button>
                        )}
                    </div>
                )}

                {/* ── Batch Engine (NEW Pillar 1) ── */}
                {mainTab === 'BATCH' && (
                    <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "16px", padding: "24px" }}>
                        <div className="flex items-center gap-2 mb-6">
                            <Bot className="w-5 h-5 text-indigo-400" />
                            <h2 className="font-semibold text-white">Brief → Creativo + Batch Engine</h2>
                            <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">Gemini + 5 Estilos</span>
                        </div>
                        <CreativeBriefWizard campaignId={campaignId} onImageReady={(url) => handleImageGenerated(url)} />
                    </div>
                )}

                {/* ── Gallery / Upload ── */}
                {mainTab === 'MANUAL' && (
                    <div className="space-y-6">
                        <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "16px", padding: "24px" }}>
                            <div className="flex items-center gap-2 mb-6">
                                <Upload className="w-5 h-5 text-blue-400" />
                                <h2 className="font-semibold text-white">Galería de Assets</h2>
                            </div>
                            <AssetGallery campaignId={campaignId}
                                onAssetSelected={(asset) => {
                                    setPreviewImageUrl(asset.url);
                                    setLayerBaseImage(asset.url);
                                    setSelectedAssetId(asset.id);
                                }}
                                showUpload={!!campaignId} />
                        </div>
                        <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "16px", padding: "24px" }}>
                            <div className="flex items-center gap-2 mb-6">
                                <FolderOpen className="w-5 h-5 text-yellow-400" />
                                <h2 className="font-semibold text-white">Importar desde Google Drive / URL</h2>
                            </div>
                            <DriveImporter onImport={(urls) => urls.forEach((url) => setPreviewImageUrl(url))} />
                        </div>
                    </div>
                )}

                {/* ── Layer Editor ── */}
                {mainTab === 'LAYER' && (
                    <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "16px", padding: "24px" }}>
                        <div className="flex items-center gap-2 mb-6">
                            <Layers className="w-5 h-5 text-orange-400" />
                            <h2 className="font-semibold text-white">Editor de Capas</h2>
                            <span className="text-xs text-gray-500">Logo · CTA · Texto Legal · Overlays</span>
                        </div>
                        {!layerBaseImage && (
                            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <p className="text-amber-300 text-xs">💡 Genera o selecciona una imagen primero como base del editor.</p>
                            </div>
                        )}
                        <LayerEditor baseImageUrl={layerBaseImage} onExport={(dataUrl) => setPreviewImageUrl(dataUrl)} />
                    </div>
                )}

                {/* ── Preview ── */}
                {mainTab === 'PREVIEW' && (
                    <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "16px", padding: "24px" }}>
                        <div className="flex items-center gap-2 mb-6">
                            <Eye className="w-5 h-5 text-cyan-400" />
                            <h2 className="font-semibold text-white">Preview Interactivo en Plataforma</h2>
                            <span className="text-xs px-2 py-0.5 bg-cyan-500/15 text-cyan-400 rounded-full border border-cyan-500/20">Animado</span>
                        </div>
                        {!previewImageUrl && (
                            <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-blue-300 text-sm">Genera una imagen con IA o selecciona un asset de la galería.</p>
                            </div>
                        )}
                        <PlatformPreview imageUrl={previewImageUrl} headline={previewHeadline} />
                    </div>
                )}

                {/* ── Brand Kit ── */}
                {mainTab === 'BRAND' && (
                    <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "16px", padding: "24px" }}>
                        <BrandKitPanel onSaved={() => null} />
                    </div>
                )}

                {/* ── A/B Tests ── */}
                {mainTab === 'ABTEST' && (
                    <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "16px", padding: "24px" }}>
                        <div className="flex items-center gap-2 mb-6">
                            <FlaskConical className="w-5 h-5 text-violet-400" />
                            <h2 className="font-semibold text-white">Dashboard A/B Tests</h2>
                        </div>
                        {abTestId ? (
                            <ABTestDashboard abTestId={abTestId} />
                        ) : (
                            <div className="text-center py-16">
                                <FlaskConical className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">Selecciona un A/B Test para ver sus métricas.</p>
                                <p className="text-gray-600 text-xs mt-1">Crea tests desde la galería de assets seleccionando 2+ creativos.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Insights ── */}
                {mainTab === 'INSIGHTS' && (
                    <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "16px", padding: "24px" }}>
                        <CreativeInsights />
                    </div>
                )}

                {/* ── Collaboration (NEW Pillar 3) ── */}
                {mainTab === 'COLLAB' && (
                    <div className="space-y-6">
                        {/* Sub-tabs */}
                        <div className="flex bg-slate-900/80 border border-slate-800 rounded-xl p-1 gap-1 max-w-sm">
                            {COLLAB_SUBTABS.map(sub => (
                                <button key={sub.key} type="button"
                                    onClick={() => setCollabSubTab(sub.key)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                                        collabSubTab === sub.key
                                            ? "bg-indigo-600 text-white shadow"
                                            : "text-slate-500 hover:text-slate-300"
                                    }`}>
                                    {sub.icon} {sub.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "16px", padding: "24px" }}>
                            {collabSubTab === 'ANNOTATIONS' && (
                                <>
                                    {previewImageUrl && selectedAssetId && currentUserId ? (
                                        <AnnotationCanvas
                                            assetUrl={previewImageUrl}
                                            assetId={selectedAssetId}
                                            currentUserId={currentUserId}
                                        />
                                    ) : (
                                        <div className="text-center py-12 text-slate-500">
                                            <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                            <p className="text-sm">Selecciona un asset desde la Galería o genera uno con IA para ver el panel de anotaciones.</p>
                                        </div>
                                    )}
                                </>
                            )}
                            {collabSubTab === 'VERSIONS' && (
                                <>
                                    {previewImageUrl && selectedAssetId ? (
                                        <AssetVersionHistory
                                            assetId={selectedAssetId}
                                            currentUrl={previewImageUrl}
                                            onRestored={(url) => {
                                                setPreviewImageUrl(url);
                                                setLayerBaseImage(url);
                                            }}
                                        />
                                    ) : (
                                        <div className="text-center py-12 text-slate-500">
                                            <History className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                            <p className="text-sm">Selecciona un asset para ver su historial de versiones.</p>
                                        </div>
                                    )}
                                </>
                            )}
                            {collabSubTab === 'COLLECTIONS' && (
                                <AssetCollectionsPanel currentAssetId={selectedAssetId} />
                            )}
                        </div>
                    </div>
                )}

                {/* ── Export Kit (NEW Pillar 4) ── */}
                {mainTab === 'EXPORT' && (
                    <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "16px", padding: "24px" }}>
                        <div className="flex items-center gap-2 mb-6">
                            <Package className="w-5 h-5 text-emerald-400" />
                            <h2 className="font-semibold text-white">Export Kit Automático</h2>
                            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">9 formatos</span>
                        </div>
                        {selectedAssetId ? (
                            <ExportKitPanel assetId={selectedAssetId} assetName={previewImageUrl?.split('/').pop()} />
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                <p className="text-sm">Selecciona o genera un asset para crear el Export Kit automático.</p>
                                <p className="text-xs mt-1 text-slate-600">Generará versiones para Instagram, Facebook, LinkedIn, TikTok, Google, Twitter y YouTube.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
