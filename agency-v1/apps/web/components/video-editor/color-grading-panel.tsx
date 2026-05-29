'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Film, Palette, Sun, Contrast, Droplets, Sparkles, X, Layers, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { recordUserCorrection } from '@/actions/video-editor';
import type { Clip, ColorGrade } from '@/actions/video-editor';

interface ColorGradingPanelProps {
  clips: Clip[];
  colorGrades: ColorGrade[];
  onColorGradesChange: (grades: ColorGrade[]) => void;
}

const PRESETS = [
  {
    value: 'cinematic',
    label: 'Cinematic',
    desc: 'Film look profesional',
    icon: '🎬',
    swatch: ['#0f2a4a', '#1a3a5c', '#2d5f8a', '#1e4060'],
    preview: 'from-slate-800 via-blue-950 to-slate-900',
  },
  {
    value: 'luxury',
    label: 'Luxury',
    desc: 'Elegante y premium',
    icon: '✨',
    swatch: ['#4a3000', '#6b4500', '#8b6914', '#3d2800'],
    preview: 'from-amber-950 via-yellow-900 to-amber-950',
  },
  {
    value: 'viral',
    label: 'Viral',
    desc: 'Colores vibrantes',
    icon: '⚡',
    swatch: ['#7c0560', '#9d0f87', '#c91bb5', '#6b0052'],
    preview: 'from-pink-700 via-fuchsia-600 to-purple-700',
  },
  {
    value: 'corporate',
    label: 'Corporate',
    desc: 'Limpio y profesional',
    icon: '💼',
    swatch: ['#0d2a4a', '#0f3460', '#174880', '#0a2040'],
    preview: 'from-blue-900 via-blue-800 to-slate-800',
  },
  {
    value: 'warm-artisan',
    label: 'Warm Artisan',
    desc: 'Tono artesanal cálido',
    icon: '🌿',
    swatch: ['#3d1a00', '#5a2800', '#7a3c00', '#2d1200'],
    preview: 'from-orange-950 via-amber-900 to-orange-950',
  },
] as const;

function ColorSwatch({ colors }: { colors: readonly string[] }) {
  return (
    <div className="flex gap-0.5 w-full">
      {colors.map((c, i) => (
        <div key={i} className="flex-1 h-5 rounded-sm" style={{ backgroundColor: c }} />
      ))}
    </div>
  );
}

function getPresetValues(style: string) {
  const map: Record<string, Omit<ColorGrade, 'clipId' | 'style'>> = {
    cinematic: { lut: 'Film-EM', temperature: 5600, tint: 5, contrast: 1.2, saturation: 0.9, highlights: -10, shadows: 15, midtones: 5 },
    luxury: { lut: 'Gold-Premium', temperature: 4500, tint: 10, contrast: 1.3, saturation: 0.85, highlights: -15, shadows: 20, midtones: 10 },
    viral: { lut: 'Pop-Culture', temperature: 6000, tint: 0, contrast: 1.1, saturation: 1.2, highlights: 0, shadows: 5, midtones: 0 },
    corporate: { lut: 'Clean-Pro', temperature: 5500, tint: 0, contrast: 1.05, saturation: 0.95, highlights: 0, shadows: 10, midtones: 0 },
    'warm-artisan': { lut: 'Warm-Authentic', temperature: 4000, tint: 15, contrast: 1.25, saturation: 1.0, highlights: -5, shadows: 18, midtones: 8 },
  };
  return map[style] ?? map['cinematic'];
}

export function ColorGradingPanel({ clips, colorGrades, onColorGradesChange }: ColorGradingPanelProps) {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [applyAll, setApplyAll] = useState(false);
  const [intensity, setIntensity] = useState<Record<string, number>>({});

  const selectedClip = clips.find(c => c.id === selectedClipId);
  const clipGrade = colorGrades.find(g => g.clipId === selectedClipId);

  const applyPreset = (clipId: string, preset: ColorGrade['style'], toAll = false) => {
    const values = getPresetValues(preset);
    const clipIds = toAll ? clips.map(c => c.id) : [clipId];
    const existing = colorGrades.filter(g => !clipIds.includes(g.clipId));

    // Record learning engine corrections
    clipIds.forEach(id => {
      const prev = colorGrades.find(g => g.clipId === id);
      const newGrade = { ...values, clipId: id, style: preset };
      if (prev) {
        recordUserCorrection('color', prev, newGrade).catch(console.error);
      } else {
        const defaultGrade = getPresetValues('corporate');
        recordUserCorrection('color', defaultGrade, newGrade).catch(console.error);
      }
    });

    const newGrades: ColorGrade[] = clipIds.map(id => ({
      ...values, clipId: id, style: preset,
    }));
    onColorGradesChange([...existing, ...newGrades]);
  };

  const removeGrade = (clipId: string) => {
    onColorGradesChange(colorGrades.filter(g => g.clipId !== clipId));
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  const updateGradeField = (clipId: string, field: keyof ColorGrade, value: number | string) => {
    const current = colorGrades.find(g => g.clipId === clipId);
    if (current) {
      const updated = { ...current, [field]: value };
      recordUserCorrection('color', current, updated).catch(console.error);
    }
    onColorGradesChange(
      colorGrades.map(g => g.clipId === clipId ? { ...g, [field]: value } : g)
    );
  };

  const clipIntensity = selectedClipId ? (intensity[selectedClipId] ?? 100) : 100;

  if (clips.length === 0) {
    return (
      <Card className="bg-slate-800/20 border-slate-800 border-dashed">
        <CardContent className="py-16 text-center">
          <Film className="w-14 h-14 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Añade clips de video primero</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                Color Grading
              </CardTitle>
              <CardDescription className="text-slate-400">
                {colorGrades.length}/{clips.length} clips con estilo aplicado
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="apply-all" className="text-xs text-slate-400">Aplicar a todos</Label>
                <Switch
                  id="apply-all"
                  checked={applyAll}
                  onCheckedChange={setApplyAll}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
              {colorGrades.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 text-xs"
                  onClick={() => onColorGradesChange([])}
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpiar Todo
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Clips Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {clips.map(clip => {
              const hasGrade = colorGrades.some(g => g.clipId === clip.id);
              const grade = colorGrades.find(g => g.clipId === clip.id);
              const preset = PRESETS.find(p => p.value === grade?.style);

              return (
                <button
                  key={clip.id}
                  onClick={() => setSelectedClipId(clip.id)}
                  className={cn(
                    'p-2.5 rounded-xl text-left transition-all border relative overflow-hidden',
                    selectedClipId === clip.id
                      ? 'border-purple-500 ring-2 ring-purple-500/30'
                      : hasGrade
                      ? 'border-emerald-500/60'
                      : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  {/* Gradient preview */}
                  {preset && (
                    <div className={cn('absolute inset-0 opacity-15 bg-gradient-to-br', preset.preview)} />
                  )}
                  <div className="relative space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-white font-medium truncate">{clip.type}</span>
                    </div>
                    {hasGrade && grade && preset ? (
                      <>
                        <ColorSwatch colors={preset.swatch} />
                        <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400 w-full justify-center py-0">
                          {grade.style}
                        </Badge>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-8 text-slate-600 text-[10px]">
                        Sin aplicar
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preset Picker */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-purple-400" />
            {applyAll ? 'Aplicar a Todos los Clips' : selectedClip ? `Preset para: ${selectedClip.type}` : 'Selecciona un Clip'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PRESETS.map(preset => {
              const isActive = clipGrade?.style === preset.value;
              return (
                <button
                  key={preset.value}
                  onClick={() => {
                    if (applyAll) {
                      clips.forEach(c => applyPreset(c.id, preset.value as ColorGrade['style'], false));
                      applyPreset(clips[0]?.id ?? '', preset.value as ColorGrade['style'], true);
                    } else if (selectedClipId) {
                      applyPreset(selectedClipId, preset.value as ColorGrade['style']);
                    }
                  }}
                  disabled={!selectedClipId && !applyAll}
                  className={cn(
                    'p-3 rounded-xl text-center transition-all border space-y-2 disabled:opacity-40',
                    isActive && !applyAll
                      ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/30'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
                  )}
                >
                  <div className={cn('w-full h-10 rounded-lg bg-gradient-to-br', preset.preview)} />
                  <ColorSwatch colors={preset.swatch} />
                  <div>
                    <p className="text-xs font-semibold text-white">{preset.icon} {preset.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Intensity Slider */}
          {selectedClipId && clipGrade && (
            <div className="p-4 bg-slate-900 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">Intensidad del Efecto</span>
                </div>
                <Badge variant="outline" className="border-purple-500/40 text-purple-400">
                  {clipIntensity}%
                </Badge>
              </div>
              <Slider
                value={[clipIntensity]}
                onValueChange={([v]) => {
                  setIntensity(prev => ({ ...prev, [selectedClipId]: v }));
                }}
                min={0} max={100} step={5}
                className="py-1"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Sutil (0%)</span>
                <span>Normal (50%)</span>
                <span>Intenso (100%)</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 pt-3 border-t border-slate-800">
                {[
                  { icon: Sun, label: 'Temp', val: `${clipGrade.temperature}K` },
                  { icon: Contrast, label: 'Contraste', val: `${clipGrade.contrast}x` },
                  { icon: Droplets, label: 'Saturación', val: `${Math.round(clipGrade.saturation * 100)}%` },
                  { icon: Palette, label: 'LUT', val: clipGrade.lut },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="text-center">
                    <Icon className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-400">{label}</p>
                    <p className="text-xs font-semibold text-white truncate">{val}</p>
                  </div>
                ))}
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full h-8 text-xs"
                onClick={() => removeGrade(selectedClipId)}
              >
                <X className="w-3 h-3 mr-1" />
                Quitar color grading de este clip
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}