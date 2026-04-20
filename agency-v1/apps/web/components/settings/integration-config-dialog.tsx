'use client';

// ... imports provided in previous view_file ... 
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Settings,
    Loader2,
    Eye,
    EyeOff,
    Check,
    Key,
    Lock,
    Hash,
    Copy,
    Info,
    Smartphone,
    Globe,
    Shield,
    Activity,
    Terminal,
    Bot
} from "lucide-react";
import { getIntegrationConfig, updateIntegrationConfig, IntegrationConfigData } from "@/actions/integration-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface IntegrationConfigDialogProps {
    // FIX #8: Keep old provider strings for backward compat with existing callers
    provider: 'facebook' | 'whatsapp' | 'instagram' | 'google-analytics' | 'google-tag-manager' | 'facebook-pixel' | 'hotjar' | 'tiktok-pixel' | 'linkedin-insight' | 'google-ads' | 'gemini' | 'ai-models' | string;
    title: string;
}

export function IntegrationConfigDialog({ provider, title }: IntegrationConfigDialogProps) {
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    // FIX #8: Use Record<string, any> internally to avoid 40+ TS2339 errors from
    // the discriminated union type. The save call still passes through correctly.
    const [formData, setFormData] = useState<Record<string, any>>({});

    useEffect(() => {
        setMounted(true);
    }, []);

    // Visibility toggles
    const [showToken, setShowToken] = useState(false);
    const [showPageToken, setShowPageToken] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [showPrivateKey, setShowPrivateKey] = useState(false);

    // Brand Colors & Gradients
    const isWhatsapp = provider === 'whatsapp';
    const isGoogle = provider === 'google-analytics' || provider === 'google-tag-manager';
    const isMeta = provider === 'facebook' || provider === 'instagram' || provider === 'facebook-pixel';
    const isHotjar = provider === 'hotjar';
    const isAiModels = provider === 'ai-models' || provider === 'gemini';

    let brandColor = 'text-gray-600';
    let brandBg = 'bg-gray-50';
    let brandBorder = 'border-gray-100';
    let brandRing = 'focus-visible:ring-gray-500';
    let brandGradient = 'bg-gradient-to-r from-gray-50 via-gray-100 to-white';

    if (isWhatsapp) {
        brandColor = 'text-emerald-600';
        brandBg = 'bg-emerald-50';
        brandBorder = 'border-emerald-100';
        brandRing = 'focus-visible:ring-emerald-500';
        brandGradient = 'bg-gradient-to-r from-emerald-50 via-green-50 to-white';
    } else if (isGoogle) {
        brandColor = provider === 'google-tag-manager' ? 'text-blue-600' : 'text-orange-600';
        brandBg = provider === 'google-tag-manager' ? 'bg-blue-50' : 'bg-orange-50';
        brandBorder = provider === 'google-tag-manager' ? 'border-blue-100' : 'border-orange-100';
        brandRing = provider === 'google-tag-manager' ? 'focus-visible:ring-blue-500' : 'focus-visible:ring-orange-500';
        brandGradient = provider === 'google-tag-manager'
            ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-white'
            : 'bg-gradient-to-r from-orange-50 via-amber-50 to-white';
    } else if (isMeta) {
        brandColor = 'text-blue-600';
        brandBg = 'bg-blue-50';
        brandBorder = 'border-blue-100';
        brandRing = 'focus-visible:ring-blue-500';
        brandGradient = 'bg-gradient-to-r from-blue-50 via-indigo-50 to-white';
    } else if (isHotjar) {
        brandColor = 'text-rose-600';
        brandBg = 'bg-rose-50';
        brandBorder = 'border-rose-100';
        brandRing = 'focus-visible:ring-rose-500';
        brandGradient = 'bg-gradient-to-r from-rose-50 via-red-50 to-white';
    } else if (provider === 'ahrefs') {
        brandColor = 'text-orange-600';
        brandBg = 'bg-orange-50';
        brandBorder = 'border-orange-100';
        brandRing = 'focus-visible:ring-orange-500';
        brandGradient = 'bg-gradient-to-r from-orange-50 via-amber-50 to-white';
    } else if (isAiModels) {
        brandColor = 'text-violet-600';
        brandBg = 'bg-violet-50';
        brandBorder = 'border-violet-100';
        brandRing = 'focus-visible:ring-violet-500';
        brandGradient = 'bg-gradient-to-r from-violet-50 via-fuchsia-50 to-white';
    }

    useEffect(() => {
        // Reset form data when dialog opens
        if (open) {
            setFormData({});
            setSuccess(false);
        }
        
        if (open && provider) {
            console.log(`[Dialog] Loading config for provider: ${provider}`);
            setLoading(true);
            setSuccess(false);
            getIntegrationConfig(provider as any)
                .then(data => {
                    console.log(`[Dialog] Loaded data:`, data);
                    // Only set form data if it's a valid object
                    if (data && typeof data === 'object') {
                        setFormData(data);
                    }
                })
                .catch(err => {
                    console.error(`[Dialog] Load error:`, err);
                    // Don't crash on error, just show empty form
                    setFormData({});
                })
                .finally(() => setLoading(false));
        }
    }, [open, provider]);

    // FIX #8: Accept any string key (not narrowed union key)
    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (saving) return; // Prevent double-click
        
        setSaving(true);
        setSuccess(false);
        try {
            console.log(`[Dialog] Saving ${provider} with data:`, JSON.stringify(formData));
            
            // Filter out undefined values
            const cleanData = Object.fromEntries(
                Object.entries(formData).filter(([_, v]) => v !== undefined && v !== '')
            );
            
            console.log(`[Dialog] Clean data:`, JSON.stringify(cleanData));
            
            // Validate that we have at least some data to save
            if (Object.keys(cleanData).length === 0) {
                throw new Error("No hay datos para guardar");
            }
            
            await updateIntegrationConfig(provider as any, cleanData as any);
            setSuccess(true);
            toast.success(`${title} configuration saved successfully`);
            
            // Close after delay
            setTimeout(() => {
                setOpen(false);
                setSuccess(false);
                setFormData({}); // Reset form after save
            }, 1500);
        } catch (error: any) {
            console.error(`[Dialog] Save error:`, error);
            const errorMessage = error?.message || error?.toString() || "Unknown error";
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const copyToClipboard = (text?: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            // Prevent onOpenChange when saving to avoid race conditions
            if (!saving || isOpen) {
                setOpen(isOpen);
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2 border transition-all hover:bg-opacity-100", brandBg, brandBorder, "bg-opacity-50")}>
                    <Settings className={cn("h-4 w-4", brandColor)} />
                    <span className={cn("font-medium", brandColor)}>Configure</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl">
                {/* Header with Brand Gradient */}
                <div className={cn("px-6 py-6 border-b", brandGradient)}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-tight text-gray-900">
                            <div className={cn("p-2 rounded-xl bg-white shadow-sm ring-1 ring-inset", brandBorder)}>
                                {isWhatsapp ? <Smartphone className={cn("h-6 w-6", brandColor)} /> :
                                    isGoogle ? <Globe className={cn("h-6 w-6", brandColor)} /> :
                                        isHotjar ? <Activity className={cn("h-6 w-6", brandColor)} /> :
                                            isAiModels ? <Bot className={cn("h-6 w-6", brandColor)} /> :
                                                <Globe className={cn("h-6 w-6", brandColor)} />}
                            </div>
                            Configure {title}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 mt-1.5 flex items-center gap-1.5">
                            <Shield className="h-3 w-3" /> Securely manage API credentials
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className={cn("h-10 w-10 animate-spin", brandColor)} />
                            <p className="text-sm text-gray-400 font-medium">Loading credentials...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Provider Specific Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Hash className="h-3 w-3" />
                                        Identity & Access
                                    </h4>
                                    <Badge variant="secondary" className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 pointer-events-none">
                                        Required
                                    </Badge>
                                </div>

                                {provider === 'ai-models' || provider === 'gemini' ? (
                                    <>
                                        {/* OpenAI */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="openAiApiKey" className="text-xs font-semibold text-gray-700">OpenAI API Key (ChatGPT / o1 / o3)</Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input id="openAiApiKey" type={showToken ? "text" : "password"} value={formData.openAiApiKey || ''} onChange={e => handleChange('openAiApiKey', e.target.value)} className={cn("pl-9 pr-10 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-xs focus:bg-white", brandRing)} placeholder="sk-proj-..." />
                                            </div>
                                        </div>
                                        {/* Anthropic */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="anthropicApiKey" className="text-xs font-semibold text-gray-700">Anthropic API Key (Claude 3.5+)</Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input id="anthropicApiKey" type={showToken ? "text" : "password"} value={formData.anthropicApiKey || ''} onChange={e => handleChange('anthropicApiKey', e.target.value)} className={cn("pl-9 pr-10 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-xs focus:bg-white", brandRing)} placeholder="sk-ant-api03-..." />
                                            </div>
                                        </div>
                                        {/* Google Gemini */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="geminiApiKey" className="text-xs font-semibold text-gray-700">Google Gemini API Key</Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input id="geminiApiKey" type={showToken ? "text" : "password"} value={formData.geminiApiKey || ''} onChange={e => handleChange('geminiApiKey', e.target.value)} className={cn("pl-9 pr-10 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-xs focus:bg-white", brandRing)} placeholder="AIzaSy..." />
                                            </div>
                                        </div>
                                        {/* DeepSeek */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="deepseekApiKey" className="text-xs font-semibold text-gray-700">DeepSeek API Key (V3 / R1)</Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input id="deepseekApiKey" type={showToken ? "text" : "password"} value={formData.deepseekApiKey || ''} onChange={e => handleChange('deepseekApiKey', e.target.value)} className={cn("pl-9 pr-10 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-xs focus:bg-white", brandRing)} placeholder="sk-..." />
                                            </div>
                                        </div>
                                        {/* Mistral */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="mistralApiKey" className="text-xs font-semibold text-gray-700">Mistral API Key</Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input id="mistralApiKey" type={showToken ? "text" : "password"} value={formData.mistralApiKey || ''} onChange={e => handleChange('mistralApiKey', e.target.value)} className={cn("pl-9 pr-10 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-xs focus:bg-white", brandRing)} placeholder="..." />
                                            </div>
                                        </div>
                                        {/* xAI Grok */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="xaiApiKey" className="text-xs font-semibold text-gray-700">xAI API Key (Grok)</Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input id="xaiApiKey" type={showToken ? "text" : "password"} value={formData.xaiApiKey || ''} onChange={e => handleChange('xaiApiKey', e.target.value)} className={cn("pl-9 pr-10 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-xs focus:bg-white", brandRing)} placeholder="xai-..." />
                                            </div>
                                        </div>
                                    </>
                                ) : provider === 'google-analytics' ? (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="measurementId" className="text-xs font-semibold text-gray-700">
                                                Measurement ID <span className="text-orange-500 font-bold">(requerido)</span>
                                            </Label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="measurementId"
                                                    value={formData.measurementId || ''}
                                                    onChange={e => handleChange('measurementId', e.target.value)}
                                                    className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white font-mono", brandRing)}
                                                    placeholder="G-XXXXXXXXXX"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                GA4 → Admin → Flujos de datos → tu flujo web → Measurement ID
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="propertyId" className="text-xs font-semibold text-gray-700">
                                                Property ID <span className="text-gray-400">(opcional, para reportería server-side)</span>
                                            </Label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="propertyId"
                                                    value={formData.propertyId || ''}
                                                    onChange={e => handleChange('propertyId', e.target.value)}
                                                    className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                    placeholder="e.g., 345678901"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="apiSecret" className="text-xs font-semibold text-gray-700">
                                                Measurement Protocol API Secret
                                            </Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input
                                                    id="apiSecret"
                                                    type={showToken ? "text" : "password"}
                                                    value={formData.apiSecret || ''}
                                                    onChange={e => handleChange('apiSecret', e.target.value)}
                                                    className={cn("pl-9 pr-20 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-xs focus:bg-white", brandRing)}
                                                    placeholder="e.g. abcdefg123456"
                                                />
                                                <div className="absolute right-2 top-2 flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-gray-400 hover:text-gray-600 rounded-md"
                                                        onClick={() => setShowToken(!showToken)}
                                                    >
                                                        {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                Requerido para el rastreo Server-Side.
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="clientEmail" className="text-xs font-semibold text-gray-700">
                                                Service Account Email
                                            </Label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="clientEmail"
                                                    value={formData.clientEmail || ''}
                                                    onChange={e => handleChange('clientEmail', e.target.value)}
                                                    className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                    placeholder="service-account@project.iam.gserviceaccount.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="privateKey" className="text-xs font-semibold text-gray-700">
                                                Private Key
                                            </Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input
                                                    id="privateKey"
                                                    type={showPrivateKey ? "text" : "password"}
                                                    value={formData.privateKey || ''}
                                                    onChange={e => handleChange('privateKey', e.target.value)}
                                                    className={cn("pl-9 pr-20 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-xs focus:bg-white", brandRing)}
                                                    placeholder="-----BEGIN PRIVATE KEY-----..."
                                                />
                                                <div className="absolute right-2 top-2 flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-gray-400 hover:text-gray-600 rounded-md"
                                                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                                                    >
                                                        {showPrivateKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : provider === 'google-tag-manager' ? (
                                    <div className="grid gap-2">
                                        <Label htmlFor="containerId" className="text-xs font-semibold text-gray-700">
                                            GTM Container ID
                                        </Label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="containerId"
                                                value={formData.containerId || ''}
                                                onChange={e => handleChange('containerId', e.target.value)}
                                                className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                placeholder="e.g., GTM-XXXXXXX"
                                            />
                                        </div>
                                    </div>
                                ) : provider === 'facebook-pixel' ? (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="pixelId" className="text-xs font-semibold text-gray-700">
                                                Pixel ID
                                            </Label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="pixelId"
                                                    value={formData.pixelId || ''}
                                                    onChange={e => handleChange('pixelId', e.target.value)}
                                                    className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                    placeholder="e.g., 123456789012345"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2 mt-4">
                                            <Label htmlFor="capiToken" className="text-xs font-semibold text-gray-700">
                                                Conversions API Token
                                            </Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input
                                                    id="capiToken"
                                                    type={showToken ? "text" : "password"}
                                                    value={formData.capiToken || ''}
                                                    onChange={e => handleChange('capiToken', e.target.value)}
                                                    className={cn("pl-9 pr-20 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-xs focus:bg-white", brandRing)}
                                                    placeholder="EAAG..."
                                                />
                                                <div className="absolute right-2 top-2 flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-gray-400 hover:text-gray-600 rounded-md"
                                                        onClick={() => setShowToken(!showToken)}
                                                    >
                                                        {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                Generado en el Administrador de Eventos para envíos Server-Side.
                                            </p>
                                        </div>
                                    </>
                                ) : provider === 'hotjar' ? (
                                    <div className="grid gap-2">
                                        <Label htmlFor="siteId" className="text-xs font-semibold text-gray-700">
                                            Site ID
                                        </Label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="siteId"
                                                value={formData.siteId || ''}
                                                onChange={e => handleChange('siteId', e.target.value)}
                                                className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                placeholder="e.g., 1234567"
                                            />
                                        </div>
                                    </div>
                                ) : provider === 'ahrefs' ? (
                                    <div className="grid gap-2">
                                        <Label htmlFor="dataKey" className="text-xs font-semibold text-gray-700">
                                            Data Key <span className="text-orange-500 font-bold">(requerido)</span>
                                        </Label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="dataKey"
                                                value={formData.dataKey || ''}
                                                onChange={e => handleChange('dataKey', e.target.value)}
                                                className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white font-mono", brandRing)}
                                                placeholder="e.g., 7l3Vnec/t... viKw"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                            <Info className="h-3 w-3" />
                                            Encuéntralo en el código de tu script de Ahrefs en 'data-key=\"...\"'.
                                        </p>
                                    </div>
                                ) : provider === 'tiktok-pixel' ? (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="tiktokPixelId" className="text-xs font-semibold text-gray-700">
                                                TikTok Pixel ID
                                            </Label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="tiktokPixelId"
                                                    value={formData.tiktokPixelId || ''}
                                                    onChange={e => handleChange('tiktokPixelId', e.target.value)}
                                                    className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                    placeholder="e.g., C01XXXXXXXXXX"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2 mt-4">
                                            <Label htmlFor="tiktokAccessToken" className="text-xs font-semibold text-gray-700">
                                                Events API Access Token
                                            </Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input
                                                    id="tiktokAccessToken"
                                                    type={showToken ? "text" : "password"}
                                                    value={formData.tiktokAccessToken || ''}
                                                    onChange={e => handleChange('tiktokAccessToken', e.target.value)}
                                                    className={cn("pl-9 pr-20 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-xs focus:bg-white", brandRing)}
                                                    placeholder="e.g., bc1234..."
                                                />
                                                <div className="absolute right-2 top-2 flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-gray-400 hover:text-gray-600 rounded-md"
                                                        onClick={() => setShowToken(!showToken)}
                                                    >
                                                        {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                Requerido para envíos Server-Side de TikTok.
                                            </p>
                                        </div>
                                    </>
                                ) : provider === 'linkedin-insight' ? (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="linkedinPartnerId" className="text-xs font-semibold text-gray-700">
                                                LinkedIn Partner ID
                                            </Label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="linkedinPartnerId"
                                                    value={formData.linkedinPartnerId || ''}
                                                    onChange={e => handleChange('linkedinPartnerId', e.target.value)}
                                                    className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                    placeholder="e.g., 1234567"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2 mt-4">
                                            <Label htmlFor="linkedinAccessToken" className="text-xs font-semibold text-gray-700">
                                                Conversions API Token
                                            </Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input
                                                    id="linkedinAccessToken"
                                                    type={showToken ? "text" : "password"}
                                                    value={formData.linkedinAccessToken || ''}
                                                    onChange={e => handleChange('linkedinAccessToken', e.target.value)}
                                                    className={cn("pl-9 pr-20 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-xs focus:bg-white", brandRing)}
                                                    placeholder="Token..."
                                                />
                                                <div className="absolute right-2 top-2 flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-gray-400 hover:text-gray-600 rounded-md"
                                                        onClick={() => setShowToken(!showToken)}
                                                    >
                                                        {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                Requerido para envíos Server-Side.
                                            </p>
                                        </div>
                                        <div className="grid gap-2 mt-4">
                                            <Label htmlFor="linkedinConversionId" className="text-xs font-semibold text-gray-700">
                                                Conversions API Rule ID
                                            </Label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="linkedinConversionId"
                                                    value={formData.linkedinConversionId || ''}
                                                    onChange={e => handleChange('linkedinConversionId', e.target.value)}
                                                    className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                    placeholder="e.g., 12345678"
                                                />
                                            </div>
                                        </div>
                                        <Separator className="my-4 bg-gray-100" />
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                            <Key className="h-3 w-3" /> Lead Gen Webhook
                                        </h4>
                                        <div className="grid gap-2">
                                            <Label htmlFor="linkedinWebhookKey" className="text-xs font-semibold text-gray-700">
                                                Webhook Secret Key
                                            </Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input
                                                    id="linkedinWebhookKey"
                                                    type={showToken ? "text" : "password"}
                                                    value={formData.linkedinWebhookKey || ''}
                                                    onChange={e => handleChange('linkedinWebhookKey', e.target.value)}
                                                    className={cn("pl-9 pr-20 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-xs focus:bg-white", brandRing)}
                                                    placeholder="Secret llave para Webhook..."
                                                />
                                                <div className="absolute right-2 top-2 flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-gray-400 hover:text-gray-600 rounded-md"
                                                        onClick={() => setShowToken(!showToken)}
                                                    >
                                                        {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                Secreto compartido para validar los envíos del webhook de LinkedIn.
                                            </p>
                                        </div>
                                    </>
                                ) : provider === 'google-ads' ? (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="googleAdsId" className="text-xs font-semibold text-gray-700">
                                            Google & YouTube Ads Conversion ID (AW-Tag)
                                        </Label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="googleAdsId"
                                                value={formData.googleAdsId || ''}
                                                onChange={e => handleChange('googleAdsId', e.target.value)}
                                                className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                placeholder="e.g., AW-123456789"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <Info className="h-3 w-3" />
                                            Utilizado para Global Site Tag (gtag.js).
                                        </p>
                                    </div>
                                    <div className="grid gap-2 mt-4">
                                        <Label htmlFor="googleAdsConversionActionId" className="text-xs font-semibold text-gray-700">
                                            Conversion Action ID
                                        </Label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="googleAdsConversionActionId"
                                                value={formData.googleAdsConversionActionId || ''}
                                                onChange={e => handleChange('googleAdsConversionActionId', e.target.value)}
                                                className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                placeholder="e.g., 987654321"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <Info className="h-3 w-3" />
                                            ID de la acción de conversión específica en Google/YouTube Ads.
                                        </p>
                                    </div>
                                    <Separator className="my-4 bg-gray-100" />
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <Key className="h-3 w-3" /> Enhanced Conversions S2S API
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="googleAdsCustomerId" className="text-xs font-semibold text-gray-700">Account Customer ID</Label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input id="googleAdsCustomerId" placeholder="1234567890" value={formData.googleAdsCustomerId || ''} onChange={e => handleChange('googleAdsCustomerId', e.target.value)} className={cn("pl-9 h-10 transition-all bg-gray-50/50 text-xs", brandRing)} />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="googleAdsManagerId" className="text-xs font-semibold text-gray-700">MCC Manager ID</Label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input id="googleAdsManagerId" placeholder="0987654321" value={formData.googleAdsManagerId || ''} onChange={e => handleChange('googleAdsManagerId', e.target.value)} className={cn("pl-9 h-10 transition-all bg-gray-50/50 text-xs", brandRing)} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid gap-2 mt-4">
                                        <Label htmlFor="googleAdsDeveloperToken" className="text-xs font-semibold text-gray-700">Developer Token</Label>
                                        <div className="relative group">
                                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input id="googleAdsDeveloperToken" type={showToken ? "text" : "password"} value={formData.googleAdsDeveloperToken || ''} onChange={e => handleChange('googleAdsDeveloperToken', e.target.value)} className={cn("pl-9 pr-10 h-10 transition-all bg-gray-50/50 font-mono text-xs", brandRing)} placeholder="..." />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 mt-4">
                                        <Label htmlFor="googleAdsAccessToken" className="text-xs font-semibold text-gray-700">OAuth Access Token</Label>
                                        <div className="relative group">
                                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input id="googleAdsAccessToken" type={showSecret ? "text" : "password"} value={formData.googleAdsAccessToken || ''} onChange={e => handleChange('googleAdsAccessToken', e.target.value)} className={cn("pl-9 pr-10 h-10 transition-all bg-gray-50/50 font-mono text-xs", brandRing)} placeholder="ya29..." />
                                        </div>
                                    </div>
                                        <Separator className="my-4 bg-gray-100" />
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                            <Key className="h-3 w-3" /> Lead Form Webhook
                                        </h4>
                                        <div className="grid gap-2">
                                            <Label htmlFor="googleWebhookKey" className="text-xs font-semibold text-gray-700">Google Key (Webhook Secret)</Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input id="googleWebhookKey" type={showSecret ? "text" : "password"} value={formData.googleWebhookKey || ''} onChange={e => handleChange('googleWebhookKey', e.target.value)} className={cn("pl-9 pr-10 h-10 transition-all bg-gray-50/50 font-mono text-xs", brandRing)} placeholder="Llave secreta para Google Lead Forms..." />
                                                <div className="absolute right-2 top-2 flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-gray-400 hover:text-gray-600 rounded-md"
                                                        onClick={() => setShowSecret(!showSecret)}
                                                    >
                                                        {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                El "Google Key" se configura al crear la extensión de Formulario de Clientes Potenciales en Google / YouTube Ads.
                                            </p>
                                        </div>
                                    </>) : isWhatsapp ? (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="phoneNumberId" className="text-xs font-semibold text-gray-700">
                                                Phone Number ID
                                            </Label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="phoneNumberId"
                                                    value={formData.phoneNumberId || ''}
                                                    onChange={e => handleChange('phoneNumberId', e.target.value)}
                                                    className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                    placeholder="e.g., 1083921..."
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="accessToken" className="text-xs font-semibold text-gray-700">
                                                Permanent Access Token
                                            </Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input
                                                    id="accessToken"
                                                    type={showToken ? "text" : "password"}
                                                    value={formData.accessToken || ''}
                                                    onChange={e => handleChange('accessToken', e.target.value)}
                                                    className={cn("pl-9 pr-20 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-sm focus:bg-white", brandRing)}
                                                    placeholder="EAAG..."
                                                />
                                                <div className="absolute right-2 top-2 flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-gray-400 hover:text-gray-600 rounded-md"
                                                        onClick={() => setShowToken(!showToken)}
                                                    >
                                                        {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                Generate this in Meta Business Manager under System Users.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="appId" className="text-xs font-semibold text-gray-700">
                                                App ID
                                            </Label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="appId"
                                                    value={formData.appId || ''}
                                                    onChange={e => handleChange('appId', e.target.value)}
                                                    className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                    placeholder="e.g., 81293..."
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="pageId" className="text-xs font-semibold text-gray-700">
                                                Facebook Page ID <span className="text-blue-500 font-bold">(requerido para Webhooks)</span>
                                            </Label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="pageId"
                                                    value={formData.pageId || ''}
                                                    onChange={e => handleChange('pageId', e.target.value)}
                                                    className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                    placeholder="e.g., 1029384..."
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                Necesario para identificar leads entrantes vía Webhook.
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="pageAccessToken" className="text-xs font-semibold text-gray-700">
                                                Page Access Token <span className="text-gray-400">(Long-lived)</span>
                                            </Label>
                                            <div className="relative group">
                                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input
                                                    id="pageAccessToken"
                                                    type={showPageToken ? "text" : "password"}
                                                    value={formData.accessToken || ''}
                                                    onChange={e => handleChange('accessToken', e.target.value)}
                                                    className={cn("pl-9 pr-20 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-sm focus:bg-white", brandRing)}
                                                    placeholder="EAAG..."
                                                />
                                                <div className="absolute right-2 top-2 flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-gray-400 hover:text-gray-600 rounded-md"
                                                        onClick={() => setShowPageToken(!showPageToken)}
                                                    >
                                                        {showPageToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <Separator className="my-2 bg-gray-100" />
                                        <div className="grid gap-2">
                                            <Label htmlFor="pixelId" className="text-xs font-semibold text-gray-700">
                                                Facebook Pixel ID <span className="text-gray-400">(CAPI)</span>
                                            </Label>
                                            <div className="relative">
                                                <Activity className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="pixelId"
                                                    value={formData.pixelId || ''}
                                                    onChange={e => handleChange('pixelId', e.target.value)}
                                                    className={cn("pl-9 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white focus:bg-white", brandRing)}
                                                    placeholder="e.g., 1234..."
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="capiToken" className="text-xs font-semibold text-gray-700">
                                                Conversions API Token
                                            </Label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input
                                                    id="capiToken"
                                                    type={showToken ? "text" : "password"}
                                                    value={formData.capiToken || ''}
                                                    onChange={e => handleChange('capiToken', e.target.value)}
                                                    className={cn("pl-9 pr-20 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-xs focus:bg-white", brandRing)}
                                                    placeholder="EAAG..."
                                                />
                                                <div className="absolute right-2 top-2 flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-gray-400 hover:text-gray-600 rounded-md"
                                                        onClick={() => setShowToken(!showToken)}
                                                    >
                                                        {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <Separator className="bg-gray-100" />

                            {/* Security Section - Only for Meta Apps (FB, Insta) */}
                            {(provider === 'facebook' || provider === 'instagram') && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Lock className="h-3 w-3" />
                                            Security & Webhooks
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="appSecret" className="text-xs font-semibold text-gray-700">
                                                App Secret
                                            </Label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input
                                                    id="appSecret"
                                                    type={showSecret ? "text" : "password"}
                                                    value={formData.appSecret || ''}
                                                    onChange={e => handleChange('appSecret', e.target.value)}
                                                    className={cn("pl-9 pr-8 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-sm focus:bg-white", brandRing)}
                                                    placeholder="••••••••"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-1 top-1 h-8 w-8 text-gray-400 hover:text-gray-600 rounded-md"
                                                    onClick={() => setShowSecret(!showSecret)}
                                                >
                                                    {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="verifyToken" className="text-xs font-semibold text-gray-700">
                                                Verify Token
                                            </Label>
                                            <div className="relative group">
                                                <Check className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                                                <Input
                                                    id="verifyToken"
                                                    value={formData.verifyToken || ''}
                                                    onChange={e => handleChange('verifyToken', e.target.value)}
                                                    className={cn("pl-9 pr-8 h-10 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-white font-mono text-sm focus:bg-white", brandRing)}
                                                    placeholder="random-string"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-1 top-1 h-8 w-8 text-gray-400 hover:text-gray-600 rounded-md"
                                                    onClick={() => copyToClipboard(formData.verifyToken)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 items-center">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || saving}
                        className={cn("px-6 min-w-[140px] shadow-lg hover:shadow-xl transition-all font-semibold text-white",
                            isWhatsapp ? 'bg-emerald-600 hover:bg-emerald-700' :
                                isGoogle ? (provider === 'google-tag-manager' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700') :
                                    isHotjar ? 'bg-rose-600 hover:bg-rose-700' :
                                        isAiModels ? 'bg-violet-600 hover:bg-violet-700' :
                                            'bg-blue-600 hover:bg-blue-700'
                        )}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : success ? (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Saved!
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
