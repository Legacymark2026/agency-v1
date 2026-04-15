'use client';

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
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── PLATAFORMAS DISPONIBLES ─────────────────────────────────────────────────

const PLATFORMS: { key: PlatformKey; label: string; color: string; icon: string }[] = [
    { key: 'FACEBOOK_ADS', label: 'Meta Ads', color: 'bg-blue-600', icon: '📘' },
    { key: 'GOOGLE_ADS', label: 'Google Ads', color: 'bg-red-500', icon: '🔍' },
    { key: 'TIKTOK_ADS', label: 'TikTok Ads', color: 'bg-black', icon: '🎵' },
    { key: 'LINKEDIN_ADS', label: 'LinkedIn Ads', color: 'bg-blue-800', icon: '💼' },
];

const OBJECTIVES = [
    { value: 'LEAD_GENERATION', label: 'Generación de Leads' },
    { value: 'AWARENESS', label: 'Reconocimiento de Marca' },
    { value: 'CONVERSIONS', label: 'Conversiones' },
    { value: 'TRAFFIC', label: 'Tráfico al Sitio' },
    { value: 'ENGAGEMENT', label: 'Engagement' },
    { value: 'VIDEO_VIEWS', label: 'Vistas de Video' },
];

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function StepPlatform() {
    const { platforms, objective, name, description, setPlatforms, setObjective, setName, setDescription, nextStep } =
        useCampaignWizard();

    function togglePlatform(key: PlatformKey) {
        if (platforms.includes(key)) {
            setPlatforms(platforms.filter((p) => p !== key));
        } else {
            setPlatforms([...platforms, key]);
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
                <Label className="text-sm font-semibold text-gray-300">
                    Plataformas de Publicación <span className="text-red-400">*</span>
                </Label>
                <p className="text-xs text-gray-500">Selecciona una o más plataformas donde lanzarás esta campaña.</p>
                <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map(({ key, label, icon }) => {
                        const selected = platforms.includes(key);
                        return (
                            <button
                                key={key}
                                id={`platform-${key.toLowerCase()}`}
                                type="button"
                                onClick={() => togglePlatform(key)}
                                className={cn(
                                    'relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                                    selected
                                        ? 'border-teal-500 bg-teal-500/10 shadow-[0_0_20px_rgba(13,148,136,0.2)]'
                                        : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
                                )}
                            >
                                <span className="text-2xl">{icon}</span>
                                <div>
                                    <p className="font-medium text-white text-sm">{label}</p>
                                    {selected && (
                                        <Badge className="mt-1 bg-violet-500/30 text-teal-300 border-0 text-[10px]">
                                            Seleccionada
                                        </Badge>
                                    )}
                                </div>
                                <div className="absolute top-3 right-3">
                                    {selected ? (
                                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                                    ) : (
                                        <Circle className="w-4 h-4 text-gray-600" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

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
