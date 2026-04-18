'use client';

import { useEffect, useState } from 'react';
import { getBrandKit, saveBrandKit, type BrandKitData } from '@/actions/marketing/brand-kit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Palette, CheckCircle2 } from 'lucide-react';

const TONES = ['profesional', 'inspirador', 'urgente', 'amigable', 'autoritativo', 'desafiante', 'cercano', 'lujoso'];
const FONTS = ['Inter', 'Poppins', 'Playfair Display', 'Roboto', 'Montserrat', 'Raleway', 'Nunito', 'DM Sans'];
const BRAND_VALUES_PRESETS = ['Innovación', 'Confianza', 'Calidad', 'Velocidad', 'Sostenibilidad', 'Comunidad', 'Exclusividad', 'Simplicidad'];

interface BrandKitPanelProps {
    onSaved?: (kit: BrandKitData) => void;
    compact?: boolean;
}

export function BrandKitPanel({ onSaved, compact = false }: BrandKitPanelProps) {
    const [kit, setKit] = useState<BrandKitData>({
        primaryColor: '#6D28D9',
        secondaryColor: '#FFFFFF',
        accentColor: '#10B981',
        fontFamily: 'Inter',
        toneOfVoice: 'profesional',
        brandValues: [],
        targetAudience: '',
        logoUrl: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        getBrandKit()
            .then((data) => setKit(data))
            .catch(() => null)
            .finally(() => setLoading(false));
    }, []);

    async function handleSave() {
        setSaving(true);
        try {
            await saveBrandKit(kit);
            setSaved(true);
            onSaved?.(kit);
            setTimeout(() => setSaved(false), 2500);
        } finally {
            setSaving(false);
        }
    }

    function toggleValue(val: string) {
        setKit((prev) => ({
            ...prev,
            brandValues: prev.brandValues?.includes(val)
                ? prev.brandValues.filter((v) => v !== val)
                : [...(prev.brandValues ?? []), val],
        }));
    }

    if (loading) return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        </div>
    );

    if (compact) {
        // ── Inline compact version shown inside generators ──────────────────
        return (
            <div className="flex items-start gap-4 p-3 bg-violet-500/8 border border-violet-500/15 rounded-xl">
                <Palette className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-violet-300 mb-2">Brand Kit</p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: kit.primaryColor }} />
                            <span className="text-xs text-gray-500">{kit.primaryColor}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: kit.secondaryColor }} />
                            <span className="text-xs text-gray-500">{kit.secondaryColor}</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">{kit.fontFamily}</span>
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded capitalize">{kit.toneOfVoice}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Palette className="w-5 h-5 text-violet-400" /> Brand Kit
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Se autocarga en todos los generadores de IA</p>
                </div>
                <Button id="brand-kit-save" onClick={handleSave} disabled={saving}
                    className="bg-violet-600 hover:bg-violet-500 text-white h-9 gap-2 text-sm">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
                    {saved ? '¡Guardado!' : 'Guardar'}
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* ── Left ── */}
                <div className="space-y-5">
                    {/* Brand Name */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-400">Nombre de Marca</Label>
                        <Input value={kit.name ?? ''} onChange={(e) => setKit((k) => ({ ...k, name: e.target.value }))}
                            placeholder="TuMarca Inc." className="bg-white/5 border-white/10 text-white h-10" />
                    </div>

                    {/* Logo URL */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-400">URL del Logo</Label>
                        <Input value={kit.logoUrl ?? ''} onChange={(e) => setKit((k) => ({ ...k, logoUrl: e.target.value }))}
                            placeholder="https://cdn.tudominio.com/logo.png" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                        {kit.logoUrl && <img src={kit.logoUrl} alt="Logo preview" className="h-12 rounded-lg object-contain border border-white/10 p-1 bg-white/5" />}
                    </div>

                    {/* Colors */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-400">Paleta de Colores</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { key: 'primaryColor' as const, label: 'Principal' },
                                { key: 'secondaryColor' as const, label: 'Secundario' },
                                { key: 'accentColor' as const, label: 'Acento' },
                            ].map(({ key, label }) => (
                                <div key={key} className="space-y-1">
                                    <Label className="text-xs text-gray-600">{label}</Label>
                                    <div className="relative">
                                        <input type="color" value={kit[key] ?? '#000000'}
                                            onChange={(e) => setKit((k) => ({ ...k, [key]: e.target.value }))}
                                            className="w-full h-12 rounded-xl border border-white/10 cursor-pointer bg-transparent" />
                                        <span className="absolute bottom-1 left-0 right-0 text-center text-xs text-gray-400 font-mono">
                                            {kit[key]}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Color preview */}
                    <div className="flex gap-2 h-8 rounded-xl overflow-hidden border border-white/10">
                        <div className="flex-1" style={{ background: kit.primaryColor }} />
                        <div className="flex-1" style={{ background: kit.secondaryColor }} />
                        <div className="flex-1" style={{ background: kit.accentColor }} />
                    </div>
                </div>

                {/* ── Right ── */}
                <div className="space-y-5">
                    {/* Font */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-400">Tipografía Principal</Label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {FONTS.map((f) => (
                                <button key={f} type="button" onClick={() => setKit((k) => ({ ...k, fontFamily: f }))}
                                    style={{ fontFamily: f }}
                                    className={`py-2 px-3 rounded-lg text-sm border transition-all text-left ${kit.fontFamily === f ? 'border-violet-500 bg-violet-500/20 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tone */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-400">Tono de Voz</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {TONES.map((t) => (
                                <button key={t} type="button" onClick={() => setKit((k) => ({ ...k, toneOfVoice: t }))}
                                    className={`px-3 py-1 rounded-full text-xs border transition-all capitalize ${kit.toneOfVoice === t ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Brand Values */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-400">Valores de Marca</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {BRAND_VALUES_PRESETS.map((v) => (
                                <button key={v} type="button" onClick={() => toggleValue(v)}
                                    className={`px-3 py-1 rounded-full text-xs border transition-all ${kit.brandValues?.includes(v) ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target Audience */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-400">Audiencia Principal</Label>
                        <Input value={kit.targetAudience ?? ''} onChange={(e) => setKit((k) => ({ ...k, targetAudience: e.target.value }))}
                            placeholder="Ej: Empresas B2B de 50-500 empleados en Latinoamérica" className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                    </div>
                </div>
            </div>
        </div>
    );
}
