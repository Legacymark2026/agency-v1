'use client';

import React, { useEffect, useState } from 'react';
import { useCampaignWizard, PlatformKey } from './wizard-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Circle, Wifi, WifiOff, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { connectFacebookAds } from '@/actions/marketing/facebook-ads';
import { toast } from 'sonner';
import Link from 'next/link';

// ─── PLATAFORMAS DISPONIBLES ──────────────────────────────────────────────────

const PLATFORMS: {
    key: PlatformKey;
    label: string;
    icon: string;
    settingsPath: string;
    hint: string;
}[] = [
    {
        key: 'FACEBOOK_ADS',
        label: 'Meta Ads',
        icon: '📘',
        settingsPath: '/dashboard/admin/marketing/settings',
        hint: 'Conecta tu cuenta de Meta Business Manager'
    },
    {
        key: 'GOOGLE_ADS',
        label: 'Google Ads',
        icon: '🔍',
        settingsPath: '/dashboard/settings/integrations',
        hint: 'Configura tus credenciales de Google Ads API'
    },
    {
        key: 'TIKTOK_ADS',
        label: 'TikTok Ads',
        icon: '🎵',
        settingsPath: '/dashboard/settings/integrations',
        hint: 'Conecta via TikTok Business Center'
    },
    {
        key: 'LINKEDIN_ADS',
        label: 'LinkedIn Ads',
        icon: '💼',
        settingsPath: '/dashboard/settings/integrations',
        hint: 'Conecta tu cuenta de LinkedIn Campaign Manager'
    },
];

const OBJECTIVES = [
    { value: 'LEAD_GENERATION', label: 'Generación de Leads' },
    { value: 'AWARENESS', label: 'Reconocimiento de Marca' },
    { value: 'CONVERSIONS', label: 'Conversiones' },
    { value: 'TRAFFIC', label: 'Tráfico al Sitio' },
    { value: 'ENGAGEMENT', label: 'Engagement' },
    { value: 'VIDEO_VIEWS', label: 'Vistas de Video' },
];

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type PlatformStatusMap = Record<PlatformKey, boolean>;

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function StepPlatform() {
    const { platforms, objective, name, description, setPlatforms, setObjective, setName, setDescription, nextStep } =
        useCampaignWizard();

    // FIX #4: Connection status from API
    const [connStatus, setConnStatus] = useState<PlatformStatusMap | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);

    // FIX #3: Inline FB Ad Account setup
    const [showFBSetup, setShowFBSetup] = useState(false);
    const [fbAdAccountId, setFbAdAccountId] = useState('');
    const [fbAccessToken, setFbAccessToken] = useState('');
    const [savingFB, setSavingFB] = useState(false);

    // Fetch connection status on mount
    useEffect(() => {
        fetch('/api/marketing/platform-status')
            .then(r => r.json())
            .then(data => setConnStatus(data))
            .catch(() => setConnStatus(null))
            .finally(() => setLoadingStatus(false));
    }, []);

    function togglePlatform(key: PlatformKey) {
        const isConnected = connStatus?.[key] ?? false;

        // If not connected, for Meta show the inline setup; for others redirect
        if (!isConnected && key === 'FACEBOOK_ADS') {
            setShowFBSetup(true);
            return;
        }

        if (platforms.includes(key)) {
            setPlatforms(platforms.filter((p) => p !== key));
        } else {
            setPlatforms([...platforms, key]);
        }
    }

    async function handleSaveFBCredentials() {
        if (!fbAdAccountId || !fbAccessToken) {
            toast.error('Ingresa el Ad Account ID y el Access Token');
            return;
        }
        setSavingFB(true);
        try {
            await connectFacebookAds(fbAdAccountId.trim(), fbAccessToken.trim());
            toast.success('✅ Meta Ads conectado correctamente');
            // Refresh status
            const data = await fetch('/api/marketing/platform-status').then(r => r.json());
            setConnStatus(data);
            setShowFBSetup(false);
            // Auto-select the platform after connecting
            if (!platforms.includes('FACEBOOK_ADS')) {
                setPlatforms([...platforms, 'FACEBOOK_ADS']);
            }
        } catch (err: any) {
            toast.error(err?.message || 'Error al guardar credenciales de Meta');
        } finally {
            setSavingFB(false);
        }
    }

    const canContinue = platforms.length > 0 && name.trim().length > 0 && objective;

    return (
        <div className="space-y-8">
            {/* Campaign Name */}
            <div className="space-y-2">
                <Label htmlFor="campaign-name" className="text-sm font-semibold text-gray-300">
                    Nombre de la Campaña <span className="text-red-400">*</span>
                </Label>
                <Input
                    id="campaign-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Lanzamiento Q2 2026 — Leads Latinoamérica"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-11"
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-300">Descripción (opcional)</Label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Objetivo, contexto o notas para el equipo..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[80px] resize-none"
                />
            </div>

            {/* Platform Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-gray-300">
                        Plataformas de Publicación <span className="text-red-400">*</span>
                    </Label>
                    {/* FIX #4: Connection status legend */}
                    {!loadingStatus && (
                        <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
                            <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-teal-400" /> Conectada</span>
                            <span className="flex items-center gap-1"><WifiOff className="w-3 h-3 text-amber-400" /> Sin configurar</span>
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-500">Selecciona una o más plataformas. Las no conectadas requieren configuración previa.</p>

                <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map(({ key, label, icon, settingsPath, hint }) => {
                        const selected = platforms.includes(key);
                        const isConnected = connStatus?.[key] ?? false;
                        const stillLoading = loadingStatus;

                        return (
                            <div key={key} className="flex flex-col gap-1">
                                <button
                                    id={`platform-${key.toLowerCase()}`}
                                    type="button"
                                    onClick={() => togglePlatform(key)}
                                    className={cn(
                                        'relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                                        selected
                                            ? 'border-teal-500 bg-teal-500/10 shadow-[0_0_20px_rgba(13,148,136,0.2)]'
                                            : isConnected
                                                ? 'border-white/10 bg-white/3 hover:border-teal-800 hover:bg-white/5'
                                                : 'border-white/5 bg-white/2 hover:border-amber-800/50 hover:bg-amber-900/5 opacity-80'
                                    )}
                                >
                                    <span className="text-2xl">{icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white text-sm">{label}</p>
                                        {/* FIX #4: Connection badge */}
                                        <div className="mt-1">
                                            {stillLoading ? (
                                                <span className="flex items-center gap-1 text-xs text-gray-600 font-mono">
                                                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Verificando...
                                                </span>
                                            ) : isConnected ? (
                                                <span className="flex items-center gap-1 text-xs text-teal-400 font-mono font-bold">
                                                    <Wifi className="w-2.5 h-2.5" /> CONECTADA
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-amber-400 font-mono">
                                                    <WifiOff className="w-2.5 h-2.5" /> SIN CONFIGURAR
                                                </span>
                                            )}
                                        </div>
                                        {selected && (
                                            <Badge className="mt-1 bg-violet-500/30 text-teal-300 border-0 text-xs">
                                                Seleccionada
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        {selected ? (
                                            <CheckCircle2 className="w-4 h-4 text-teal-400" />
                                        ) : isConnected ? (
                                            <Circle className="w-4 h-4 text-gray-600" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4 text-amber-500/60" />
                                        )}
                                    </div>
                                </button>

                                {/* FIX #4: Quick connect hint for unconnected platforms */}
                                {!isConnected && !stillLoading && (
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-xs text-gray-600">{hint}</p>
                                        {key === 'FACEBOOK_ADS' ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowFBSetup(v => !v)}
                                                className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 font-mono"
                                            >
                                                Configurar →
                                            </button>
                                        ) : (
                                            <Link
                                                href={settingsPath}
                                                target="_blank"
                                                className="flex items-center gap-0.5 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 font-mono"
                                            >
                                                Configurar <ExternalLink className="w-2.5 h-2.5" />
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FIX #3: Inline Meta Ads Quick-Connect Panel */}
            {showFBSetup && (
                <div
                    style={{
                        background: 'rgba(245,158,11,0.04)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: '12px',
                        padding: '20px',
                    }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>
                                📘 CONFIGURAR META ADS
                            </h4>
                            <p className="text-xs text-gray-500">
                                Ingresa tu Ad Account ID y un Access Token permanente de Meta Business Manager.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFBSetup(false)}
                            className="text-gray-600 hover:text-gray-400 text-xs"
                        >✕</button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-gray-400 font-mono">Ad Account ID</Label>
                            <Input
                                id="fb-ad-account-id"
                                value={fbAdAccountId}
                                onChange={e => setFbAdAccountId(e.target.value)}
                                placeholder="act_123456789 ó 123456789"
                                className="bg-black/30 border-amber-500/20 text-white placeholder:text-gray-600 h-9 font-mono text-xs"
                            />
                            <p className="text-xs text-gray-600">Meta Business Manager → Cuentas publicitarias → ID</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-gray-400 font-mono">Access Token</Label>
                            <Input
                                id="fb-access-token"
                                type="password"
                                value={fbAccessToken}
                                onChange={e => setFbAccessToken(e.target.value)}
                                placeholder="EAAG..."
                                className="bg-black/30 border-amber-500/20 text-white placeholder:text-gray-600 h-9 font-mono text-xs"
                            />
                            <p className="text-xs text-gray-600">System User Token con permisos ads_management</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Link
                            href="https://developers.facebook.com/tools/explorer/"
                            target="_blank"
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                        >
                            <ExternalLink className="w-3 h-3" /> Obtener token en Graph API Explorer
                        </Link>
                        <Button
                            id="fb-quick-connect-save"
                            type="button"
                            disabled={savingFB || !fbAdAccountId || !fbAccessToken}
                            onClick={handleSaveFBCredentials}
                            style={{
                                background: savingFB ? 'rgba(13,148,136,0.1)' : 'linear-gradient(135deg, #b45309, #d97706)',
                                border: '1px solid rgba(245,158,11,0.4)',
                                color: 'white',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                height: '34px',
                                padding: '0 16px',
                            }}
                        >
                            {savingFB ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Guardando...</> : '→ Guardar y Conectar'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Objective */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-300">
                    Objetivo de la Campaña <span className="text-red-400">*</span>
                </Label>
                <Select value={objective} onValueChange={setObjective}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                        <SelectValue placeholder="Selecciona un objetivo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                        {OBJECTIVES.map((o) => (
                            <SelectItem key={o.value} value={o.value} className="text-white hover:bg-white/10">
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4">
                <Button
                    id="wizard-next-step-1"
                    onClick={nextStep}
                    disabled={!canContinue}
                    className="bg-teal-700 hover:bg-teal-600 text-white px-8 h-11 disabled:opacity-40"
                >
                    Continuar →
                </Button>
            </div>
        </div>
    );
}
