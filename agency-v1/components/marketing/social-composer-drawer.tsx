"use client";

import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, Upload, Loader2, Send, ShieldCheck, Link2, MessageSquare, Megaphone, Settings2, Sparkles, LayoutPanelLeft, TrendingUp, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { createSocialPost, updateSocialPost, SocialPostPayload } from "@/actions/social-publisher";
import { generateSocialCopy } from "@/actions/social-ai";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { FaFacebook, FaLinkedin, FaTiktok, FaGoogle } from "react-icons/fa";
import { SocialLivePreview } from "./social-live-preview";
import { PostAnalyticsCard } from "./post-analytics-card";
import { SocialComments } from "./social-comments";
import { createShortLinkAction } from "@/actions/marketing/short-links";
import { AssetLibraryModal } from "./asset-library-modal";

type ComposerDrawerProps = {
    companyId: string;
    authorId: string;
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    selectedDate: Date | null;
    existingPost?: any | null; // Si se está editando un post
};

const PLATFORMS = [
    { id: "FACEBOOK", label: "Facebook", icon: FaFacebook, color: "text-blue-500" },
    { id: "LINKEDIN", label: "LinkedIn", icon: FaLinkedin, color: "text-blue-700" },
    { id: "TIKTOK",   label: "TikTok",   icon: FaTiktok,   color: "text-white" },
    { id: "GOOGLE",   label: "Google",   icon: FaGoogle,   color: "text-red-500" },
];

export function SocialComposerDrawer({ companyId, authorId, open, onClose, onSaved, selectedDate, existingPost }: ComposerDrawerProps) {
    const [activeTab, setActiveTab] = useState<"CONTENT" | "GOVERNANCE" | "ADVANCED" | "ANALYTICS" | "COMMENTS">("CONTENT");

    // Eje Central: Contenido
    const [platformContent, setPlatformContent] = useState<Record<string, any>>({});
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [status, setStatus] = useState<"DRAFT" | "SCHEDULED" | "PUBLISHED">("DRAFT");
    const [isEvergreen, setIsEvergreen] = useState(false);
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [campaignId, setCampaignId] = useState("");

    // Eje 5: Gobernanza
    const [approvalStatus, setApprovalStatus] = useState<"PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED">("PENDING");
    const [internalNotes, setInternalNotes] = useState("");

    // Eje 3: Nativas
    const [firstComment, setFirstComment] = useState("");
    const [targetUrl, setTargetUrl] = useState("");
    const [tiktokAudioId, setTiktokAudioId] = useState("");

    const [utmCampaign, setUtmCampaign] = useState("");
    const [utmSource, setUtmSource] = useState("");
    const [utmMedium, setUtmMedium] = useState("");
    
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isShortening, setIsShortening] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [previewPlatform, setPreviewPlatform] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            if (existingPost) {
                try {
                    const parsed = JSON.parse(existingPost.content);
                    if (typeof parsed === "object" && parsed !== null) {
                        setPlatformContent(parsed);
                    } else {
                        setPlatformContent({ default: existingPost.content });
                    }
                } catch {
                    setPlatformContent({ default: existingPost.content || "" });
                }
                
                setSelectedPlatforms(existingPost.platforms || []);
                setPreviewPlatform(existingPost.platforms?.[0] || null);
                setMediaUrls(existingPost.mediaUrls || []);
                setStatus(existingPost.status as "DRAFT" | "SCHEDULED" | "PUBLISHED" || "DRAFT");
                setApprovalStatus(existingPost.approvalStatus || "PENDING");
                setInternalNotes(existingPost.internalNotes || "");
                setIsEvergreen(existingPost.isEvergreen || false);
                setTimezone(existingPost.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
                setCampaignId(existingPost.campaignId || "");
                setFirstComment(existingPost.firstComment || "");
                setTargetUrl(existingPost.targetUrl || "");
                setTiktokAudioId(existingPost.tiktokAudioId || "");
                setUtmCampaign(existingPost.utmCampaign || "");
                setUtmSource(existingPost.utmSource || "");
                setUtmMedium(existingPost.utmMedium || "");
            } else {
                setPlatformContent({});
                setSelectedPlatforms(["FACEBOOK", "LINKEDIN"]);
                setPreviewPlatform("FACEBOOK");
                setMediaUrls([]);
                setStatus("DRAFT");
                setApprovalStatus("PENDING");
                setInternalNotes("");
                setIsEvergreen(false);
                setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
                setCampaignId("");
                setFirstComment("");
                setTargetUrl("");
                setTiktokAudioId("");
                setUtmCampaign("");
                setUtmSource("");
                setUtmMedium("");
            }
            setActiveTab("CONTENT");
        }
    }, [open, existingPost]);

    const togglePlatform = (id: string) => {
        setSelectedPlatforms(prev => {
            const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
            if (next.length > 0 && !next.includes(previewPlatform || "")) {
                setPreviewPlatform(next[0]);
            } else if (next.length === 0) {
                setPreviewPlatform(null);
            }
            return next;
        });
    };

    const handleGenerateAI = async () => {
        if (!aiPrompt.trim()) {
            toast.error("Ingresa una idea base para que la IA la desarrolle.");
            return;
        }

        setIsGenerating(true);
        const res = await generateSocialCopy(aiPrompt);
        setIsGenerating(false);

        if (res.success && res.data) {
            setPlatformContent(prev => {
                const updated = { ...prev };
                if (res.data?.FACEBOOK) updated.FACEBOOK = Array.isArray(updated.FACEBOOK) ? [res.data.FACEBOOK, ...updated.FACEBOOK.slice(1)] : res.data.FACEBOOK;
                if (res.data?.LINKEDIN) updated.LINKEDIN = Array.isArray(updated.LINKEDIN) ? [res.data.LINKEDIN, ...updated.LINKEDIN.slice(1)] : res.data.LINKEDIN;
                if (res.data?.TIKTOK) updated.TIKTOK = Array.isArray(updated.TIKTOK) ? [res.data.TIKTOK, ...updated.TIKTOK.slice(1)] : res.data.TIKTOK;
                return updated;
            });
            toast.success("Copys generados y adaptados por plataforma.");
        } else {
            toast.error(res.error || "Error generando con IA.");
        }
    };

    const handleShortenLinks = async () => {
        const platformKey = previewPlatform || "default";
        const content = platformContent[platformKey];
        if (!content) return;

        setIsShortening(true);

        const processText = async (text: string) => {
            const urls = text.match(/https?:\/\/[^\s]+/g);
            if (!urls || urls.length === 0) return text;
            let newText = text;
            for (const url of urls) {
                if (url.includes(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")) continue;
                const res = await createShortLinkAction({
                    companyId, destinationUrl: url, utmCampaign, utmSource, utmMedium
                });
                if (res.success && res.data?.shortUrl) {
                    newText = newText.replace(url, res.data.shortUrl);
                }
            }
            return newText;
        };

        if (Array.isArray(content)) {
            const newArray = await Promise.all(content.map(processText));
            setPlatformContent(prev => ({ ...prev, [platformKey]: newArray }));
        } else {
            const newText = await processText(content);
            setPlatformContent(prev => ({ ...prev, [platformKey]: newText }));
        }

        setIsShortening(false);
        toast.success("Links acortados e inyectados con UTMs.");
    };

    const handleSave = async (forceStatus?: "DRAFT" | "SCHEDULED" | "PUBLISHED") => {
        if (selectedPlatforms.length === 0) {
            toast.error("Selecciona al menos una plataforma");
            return;
        }

        const serializedContent = JSON.stringify(platformContent);
        if (serializedContent === "{}" || Object.values(platformContent).every(v => !v.trim())) {
            toast.error("El contenido no puede estar vacío");
            return;
        }

        setIsSaving(true);
        const targetStatus = forceStatus || status;

        const payload: SocialPostPayload = {
            content: serializedContent,
            platforms: selectedPlatforms,
            mediaUrls,
            status: targetStatus,
            scheduledAt: selectedDate,
            approvalStatus,
            internalNotes,
            isEvergreen,
            timezone,
            campaignId,
            targetUrl,
            tiktokAudioId,
            firstComment,
            utmCampaign,
            utmSource,
            utmMedium
        };

        let res;
        if (existingPost?.id) {
            res = await updateSocialPost(existingPost.id, authorId, payload);
        } else {
            res = await createSocialPost(companyId, authorId, payload);
        }

        setIsSaving(false);

        if (res.success) {
            toast.success(existingPost ? "Publicación actualizada" : "Publicación creada con éxito");
            onSaved();
            onClose();
        } else {
            toast.error(res.error || "Error al procesar la publicación");
        }
    };

    if (!open) return null;

    const rawCurrentContent = platformContent[previewPlatform || "default"] || platformContent["default"] || "";
    const currentPlatformText = Array.isArray(rawCurrentContent) ? rawCurrentContent.join("\n\n---\n\n") : rawCurrentContent;
    const isThread = Array.isArray(rawCurrentContent);
    const threadItems = isThread ? rawCurrentContent : [rawCurrentContent];

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]" onClick={onClose} />

            {/* Panel Ampliado para Split-Screen */}
            <div className={`fixed top-0 right-0 h-full w-[1000px] bg-slate-950 border-l border-slate-800 shadow-2xl z-[90] flex flex-col transform transition-transform duration-300`}>
                {/* Header */}
                <div className="flex flex-col border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center justify-between p-5 pb-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                {existingPost ? "Editar Publicación" : "Nueva Publicación"}
                                {approvalStatus === "APPROVED" && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                            </h2>
                            {selectedDate && (
                                <p className="text-sm font-mono text-teal-400 mt-1 flex items-center gap-1.5">
                                    <CalendarIcon size={14} /> 
                                    {format(selectedDate, "MMM dd, yyyy · HH:mm")}
                                </p>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800">
                            <X size={20} />
                        </Button>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex gap-4 px-5">
                        <button 
                            onClick={() => setActiveTab("CONTENT")}
                            className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${activeTab === "CONTENT" ? "border-teal-400 text-teal-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                        >
                            <Megaphone size={14} /> Contenido & IA
                        </button>
                        <button 
                            onClick={() => setActiveTab("GOVERNANCE")}
                            className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${activeTab === "GOVERNANCE" ? "border-teal-400 text-teal-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                        >
                            <ShieldCheck size={14} /> Gobernanza & Notas
                        </button>
                        <button 
                            onClick={() => setActiveTab("ADVANCED")}
                            className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${activeTab === "ADVANCED" ? "border-teal-400 text-teal-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                        >
                            <Settings2 size={14} /> Avanzado / UTMs
                        </button>
                        {existingPost?.status === "PUBLISHED" && (
                            <button 
                                onClick={() => setActiveTab("ANALYTICS")}
                                className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${activeTab === "ANALYTICS" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                            >
                                <TrendingUp size={14} /> Analítica
                            </button>
                        )}
                        {existingPost && (
                            <button 
                                onClick={() => setActiveTab("COMMENTS")}
                                className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${activeTab === "COMMENTS" ? "border-pink-400 text-pink-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                            >
                                <MessageSquare size={14} /> Equipo
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area - Split Screen Layout */}
                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT COLUMN: Controls */}
                    <div className="w-[55%] border-r border-slate-800 overflow-y-auto p-5 space-y-6 bg-slate-950">
                        {activeTab === "CONTENT" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Platforms */}
                                <div className="space-y-3">
                                    <Label className="text-xs uppercase font-mono tracking-widest text-slate-400">Canales de Destino</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {PLATFORMS.map(p => {
                                            const active = selectedPlatforms.includes(p.id);
                                            return (
                                                <button
                                                    key={p.id}
                                                    onClick={() => togglePlatform(p.id)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                                                        active 
                                                        ? 'bg-slate-800 border-slate-700 text-slate-100' 
                                                        : 'bg-slate-900/50 border-slate-800/50 text-slate-500 hover:bg-slate-900'
                                                    }`}
                                                >
                                                    <p.icon className={active ? p.color : "text-slate-500"} />
                                                    {p.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* AI Magic Generator */}
                                <div className="space-y-3 border border-indigo-500/20 bg-indigo-500/5 rounded-lg p-4">
                                    <Label className="text-xs uppercase font-mono tracking-widest text-indigo-400 flex items-center gap-2">
                                        <Sparkles size={14} /> Copywriter AI (Gemini)
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={aiPrompt}
                                            onChange={e => setAiPrompt(e.target.value)}
                                            placeholder="De qué tratara este post? Ej: Lanzamiento de nueva app v2.0"
                                            className="bg-slate-900/80 border-slate-800 text-sm h-10 flex-1"
                                        />
                                        <Button 
                                            onClick={handleGenerateAI} 
                                            disabled={isGenerating || !aiPrompt.trim()}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs shadow-[0_0_10px_rgba(79,70,229,0.2)]"
                                        >
                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generar"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Content Granular Editor */}
                                <div className="space-y-3">
                                    {selectedPlatforms.length > 0 && (
                                        <div className="flex rounded-md overflow-hidden border border-slate-800">
                                            {selectedPlatforms.map(platId => {
                                                const p = PLATFORMS.find(x => x.id === platId);
                                                return (
                                                    <button 
                                                        key={platId}
                                                        onClick={() => setPreviewPlatform(platId)}
                                                        className={`flex-1 py-2 text-xs font-mono flex items-center justify-center gap-2 transition-colors ${
                                                            previewPlatform === platId ? "bg-slate-800 text-white" : "bg-slate-900 text-slate-500 hover:bg-slate-800/50"
                                                        }`}
                                                    >
                                                        {p && <p.icon />} {p?.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}

                                        {threadItems.map((itemText, index) => (
                                            <div key={index} className="relative mb-3">
                                                {isThread && (
                                                    <div className="flex justify-between items-center bg-slate-800/50 px-3 py-1.5 rounded-t-md border border-slate-700 border-b-0">
                                                        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Slide/Post {index + 1}</span>
                                                        {threadItems.length > 1 && (
                                                            <button 
                                                                onClick={() => {
                                                                    const newArr = [...threadItems];
                                                                    newArr.splice(index, 1);
                                                                    setPlatformContent(prev => ({...prev, [previewPlatform || "default"]: newArr.length === 1 ? newArr[0] : newArr}));
                                                                }}
                                                                className="text-slate-500 hover:text-red-400 text-xs"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="relative">
                                                    <textarea 
                                                        value={itemText}
                                                        onChange={(e) => {
                                                            if (isThread) {
                                                                const newArr = [...threadItems];
                                                                newArr[index] = e.target.value;
                                                                setPlatformContent(prev => ({...prev, [previewPlatform || "default"]: newArr}));
                                                            } else {
                                                                setPlatformContent(prev => ({...prev, [previewPlatform || "default"]: e.target.value}));
                                                            }
                                                        }}
                                                        rows={isThread ? 4 : 8}
                                                        placeholder={`Edita el contenido específico para ${previewPlatform || "la plataforma"}...`}
                                                        className={`w-full bg-slate-900 border border-slate-800 p-4 pb-12 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-none font-mono ${isThread ? 'rounded-b-md' : 'rounded-md'}`}
                                                    />
                                                    
                                                    {(itemText || "").match(/https?:\/\/[^\s]+/g)?.some((u: string) => !u.includes("/l/")) && (
                                                        <div className="absolute bottom-3 right-3 animate-in fade-in zoom-in slide-in-from-bottom-2">
                                                            <Button 
                                                                size="sm" 
                                                                onClick={handleShortenLinks}
                                                                disabled={isShortening}
                                                                className="h-8 text-[10px] font-mono bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 shadow-[0_4px_10px_rgba(45,212,191,0.1)] transition-all"
                                                            >
                                                                {isShortening ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Link2 className="w-3 h-3 mr-1.5" />}
                                                                {isShortening ? "ACORTANDO..." : "AUTO-SHORTEN & UTM"}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <div className="flex justify-end mt-2">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                                                onClick={() => {
                                                    const newArr = [...threadItems, ""];
                                                    setPlatformContent(prev => ({...prev, [previewPlatform || "default"]: newArr}));
                                                }}
                                            >
                                                + Añadir Slide / Hilo
                                            </Button>
                                        </div>
                                    </div>

                                {/* Media */}
                                <div className="space-y-3">
                                    <Label className="text-xs uppercase font-mono tracking-widest text-slate-400">Multimedia (Ads / Creativos)</Label>
                                    <div className="border border-dashed border-slate-700 rounded-lg bg-slate-900/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800/50 transition-colors">
                                        <Upload className="w-8 h-8 text-slate-500 mb-2" />
                                        <p className="text-sm font-medium text-slate-300">Sube imágenes o videos cortos</p>
                                        <p className="text-xs text-slate-500 mt-1">Soporta JPG, PNG, MP4 (Max 50MB)</p>
                                        
                                        {mediaUrls.length > 0 && (
                                            <div className="mt-4 flex gap-2">
                                                {mediaUrls.map((url, i) => (
                                                    <div key={i} className="w-16 h-16 rounded bg-slate-800 overflow-hidden border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 break-all p-1">
                                                        {url.substring(0, 15)}...
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <Button size="sm" variant="outline" className="border-teal-500/30 text-teal-400 hover:text-teal-300 hover:border-teal-500/50 mt-2 bg-teal-500/10" onClick={() => setIsAssetModalOpen(true)}>
                                            <ImageIcon className="w-4 h-4 mr-2" /> Explorar Media Hub
                                        </Button>
                                        <Button size="sm" variant="outline" className="border-slate-800 text-slate-400 hover:text-white mt-2" onClick={() => setMediaUrls(['https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop'])}>
                                            + URL / Demo
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "GOVERNANCE" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
                                <Label className="flex items-center gap-2 text-xs uppercase font-mono tracking-widest text-slate-400 mb-4">
                                    <ShieldCheck size={14} className="text-indigo-400" /> C-Level Approval Flow
                                </Label>
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    {(["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"] as const).map(astatus => (
                                        <div 
                                            key={astatus}
                                            onClick={() => setApprovalStatus(astatus)}
                                            className={`p-3 rounded-md border cursor-pointer transition-all ${
                                                approvalStatus === astatus 
                                                    ? astatus === "APPROVED" ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300" :
                                                      astatus === "REJECTED" ? "bg-red-500/10 border-red-500/50 text-red-300" :
                                                      "bg-indigo-500/10 border-indigo-500/50 text-indigo-300"
                                                    : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${astatus === "APPROVED" ? "bg-emerald-500" : astatus === "REJECTED" ? "bg-red-500" : astatus === "IN_REVIEW" ? "bg-indigo-500" : "bg-slate-600"}`} />
                                                <span className="text-xs font-bold font-mono">{astatus}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2">Los posts con rol PENDING o REJECTED no se publicarán, incluso si llega la fecha programada.</p>
                            </div>

                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 text-xs uppercase font-mono tracking-widest text-slate-400">
                                    <MessageSquare size={14} /> Notas Internas & Feedback
                                </Label>
                                <textarea 
                                    value={internalNotes}
                                    onChange={(e) => setInternalNotes(e.target.value)}
                                    rows={4}
                                    placeholder="Instrucciones para edición, notas del cliente, feedback de rechazo..."
                                    className="w-full bg-slate-900 border border-slate-800 rounded-md p-4 text-sm text-yellow-500/80 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 resize-none font-mono"
                                />
                                <p className="text-[10px] text-slate-600 font-mono">Visible solo para el equipo. No se publicará.</p>
                            </div>

                            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-5 space-y-3">
                                <Label className="text-xs uppercase font-mono tracking-widest text-indigo-400 flex items-center gap-2">
                                    <MessageSquare size={14} /> Primer Comentario (Auto-Comment)
                                </Label>
                                <textarea 
                                    value={firstComment}
                                    onChange={(e) => setFirstComment(e.target.value)}
                                    rows={2}
                                    placeholder="Ej: Link en nuestra biografía / Más info en: https..."
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-md p-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                />
                                <p className="text-[10px] text-slate-500">Se publicará automáticamente como 1er comentario tras postear (Meta/LinkedIn).</p>
                            </div>
                        </div>
                        )}

                        {activeTab === "ADVANCED" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            
                            <div className="space-y-4 bg-slate-900/50 border border-slate-800 rounded-lg p-5">
                                <h3 className="text-xs uppercase font-mono tracking-widest text-teal-400 mb-2">Tracking & UTMs</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="text-xs text-slate-400">Campaign ID (Link a Campaign Tower)</Label>
                                        <Input value={campaignId} onChange={e => setCampaignId(e.target.value)} placeholder="Agrega el ID de la campaña para vincularla (Opcional)" className="bg-slate-950 border-slate-800 text-xs font-mono h-8" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-400">UTM Campaign</Label>
                                        <Input value={utmCampaign} onChange={e => setUtmCampaign(e.target.value)} placeholder="Ej: black_friday" className="bg-slate-950 border-slate-800 text-xs font-mono h-8" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-400">UTM Source</Label>
                                        <Input value={utmSource} onChange={e => setUtmSource(e.target.value)} placeholder="Ej: facebook" className="bg-slate-950 border-slate-800 text-xs font-mono h-8" />
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="text-xs text-slate-400">UTM Medium</Label>
                                        <Input value={utmMedium} onChange={e => setUtmMedium(e.target.value)} placeholder="Ej: social_post" className="bg-slate-950 border-slate-800 text-xs font-mono h-8" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs uppercase font-mono tracking-widest text-slate-400 mb-2 border-b border-slate-800 pb-2">Capacidades Plataforma</h3>
                                
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-slate-400 flex items-center gap-2"><Link2 size={12} /> Target URL (GMB / LinkedIn)</Label>
                                    <Input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://..." className="bg-slate-950 border-slate-800 text-xs" />
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <Label className="text-xs text-slate-400 flex items-center gap-2"><FaTiktok className="text-white" /> TikTok Audio ID</Label>
                                    <Input value={tiktokAudioId} onChange={e => setTiktokAudioId(e.target.value)} placeholder="Ej: 69784..." className="bg-slate-950 border-slate-800 text-xs font-mono" />
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-md">
                                    <Checkbox id="evergreen" checked={isEvergreen} onCheckedChange={(c) => setIsEvergreen(Boolean(c))} className="border-emerald-500/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-black" />
                                    <label htmlFor="evergreen" className="text-sm font-medium leading-none text-emerald-400 cursor-pointer">
                                        Evergreen Content Recycling
                                    </label>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1 ml-6">El motor republicará este contenido automáticamente cada "X" semanas para rellenar vacíos en el calendario.</p>
                            </div>

                        </div>
                        )}

                        {activeTab === "ANALYTICS" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
                                <PostAnalyticsCard postId={existingPost?.id} platform={previewPlatform || undefined} />
                            </div>
                        )}

                        {activeTab === "COMMENTS" && existingPost && (
                            <div className="h-full">
                                <SocialComments postId={existingPost.id} authorId={authorId} />
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Live Preview */}
                    <div className="w-[45%] bg-slate-900 border-l border-slate-800/50 p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-50 pointer-events-none">
                            <LayoutPanelLeft className="w-24 h-24 text-slate-800" />
                        </div>
                        <h3 className="text-xs uppercase font-mono tracking-widest text-slate-400 mb-6 flex items-center gap-2 relative z-10">
                            Live Preview
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pt-4 relative z-10">
                            {previewPlatform ? (
                                <SocialLivePreview 
                                    platform={previewPlatform}
                                    content={currentPlatformText}
                                    mediaUrl={mediaUrls.length > 0 ? mediaUrls[0] : undefined}
                                    authorName={"LegacyMark Agency"}
                                />
                            ) : (
                                <div className="text-center text-slate-500 max-w-xs mt-20">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="text-slate-600" />
                                    </div>
                                    <p className="text-sm">Selecciona una plataforma para ver la vista previa en tiempo real de tu publicación.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        {selectedDate && <span className="text-xs text-slate-500 font-mono">Modo: Local Timezone</span>}
                        <select 
                            value={timezone} 
                            onChange={e => setTimezone(e.target.value)}
                            className="bg-transparent border border-slate-800 text-xs text-slate-400 rounded-md py-1 px-2 focus:outline-none focus:border-teal-500"
                        >
                            <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>Local ({Intl.DateTimeFormat().resolvedOptions().timeZone})</option>
                            <option value="America/Bogota">Colombia (America/Bogota)</option>
                            <option value="America/Mexico_City">Mexico (America/Mexico_City)</option>
                            <option value="Europe/Madrid">España (Europe/Madrid)</option>
                            <option value="America/New_York">US Este (America/New_York)</option>
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} disabled={isSaving} className="text-slate-400 hover:text-white">
                            Cancelar
                        </Button>
                        <Button 
                            variant="outline" 
                            disabled={isSaving}
                            onClick={() => handleSave("DRAFT")}
                            className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 font-mono text-xs font-bold"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            DRAFT
                        </Button>
                        <Button 
                            disabled={isSaving || status === "PUBLISHED"}
                            onClick={() => handleSave("SCHEDULED")}
                            className="bg-teal-600 hover:bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)] font-mono text-xs font-bold uppercase tracking-wider"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            {existingPost ? "Actualizar" : "Programar"}
                        </Button>
                    </div>
                </div>
            </div>
            
            <AssetLibraryModal 
                open={isAssetModalOpen} 
                onClose={() => setIsAssetModalOpen(false)} 
                onSelectAsset={(url) => setMediaUrls(prev => [...prev, url])} 
            />
        </>
    );
}
