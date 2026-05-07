'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Film, Palette, Sun, Contrast, Droplets, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    preview: 'bg-gradient-to-br from-slate-800 to-blue-900'
  },
  { 
    value: 'luxury', 
    label: 'Luxury', 
    desc: 'Elegante y premium',
    icon: '✨',
    preview: 'bg-gradient-to-br from-amber-900 to-yellow-800'
  },
  { 
    value: 'viral', 
    label: 'Viral', 
    desc: 'Colores vibrantes',
    icon: '⚡',
    preview: 'bg-gradient-to-br from-pink-600 to-purple-600'
  },
  { 
    value: 'corporate', 
    label: 'Corporate', 
    desc: 'Limpio y profesional',
    icon: '💼',
    preview: 'bg-gradient-to-br from-blue-800 to-slate-700'
  },
  { 
    value: 'warm-artisan', 
    label: 'Warm Artisan', 
    desc: 'Tono artesanal cálido',
    icon: '🌿',
    preview: 'bg-gradient-to-br from-orange-800 to-amber-900'
  },
] as const;

export function ColorGradingPanel({ clips, colorGrades, onColorGradesChange }: ColorGradingPanelProps) {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  const selectedClip = clips.find(c => c.id === selectedClipId);
  const clipGrade = colorGrades.find(g => g.clipId === selectedClipId);

  const applyPreset = (clipId: string, preset: ColorGrade['style']) => {
    const grades = colorGrades.filter(g => g.clipId !== clipId);
    
    const newGrade: ColorGrade = {
      clipId,
      style: preset,
      lut: getPresetLut(preset),
      temperature: getPresetTemperature(preset),
      tint: getPresetTint(preset),
      contrast: getPresetContrast(preset),
      saturation: getPresetSaturation(preset),
      highlights: getPresetHighlights(preset),
      shadows: getPresetShadows(preset),
      midtones: getPresetMidtones(preset),
    };

    onColorGradesChange([...grades, newGrade]);
  };

  const removeGrade = (clipId: string) => {
    onColorGradesChange(colorGrades.filter(g => g.clipId !== clipId));
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  function getPresetLut(style: string): string {
    const luts: Record<string, string> = {
      'cinematic': 'Film-EM',
      'luxury': 'Gold-Premium',
      'viral': 'Pop-Culture',
      'corporate': 'Clean-Pro',
      'warm-artisan': 'Warm-Authentic'
    };
    return luts[style] || 'None';
  }

  function getPresetTemperature(style: string): number {
    const temps: Record<string, number> = {
      'cinematic': 5600,
      'luxury': 4500,
      'viral': 6000,
      'corporate': 5500,
      'warm-artisan': 4000
    };
    return temps[style] || 5500;
  }

  function getPresetTint(style: string): number {
    const tints: Record<string, number> = {
      'cinematic': 5,
      'luxury': 10,
      'viral': 0,
      'corporate': 0,
      'warm-artisan': 15
    };
    return tints[style] || 0;
  }

  function getPresetContrast(style: string): number {
    const contrasts: Record<string, number> = {
      'cinematic': 1.2,
      'luxury': 1.3,
      'viral': 1.1,
      'corporate': 1.05,
      'warm-artisan': 1.25
    };
    return contrasts[style] || 1.0;
  }

  function getPresetSaturation(style: string): number {
    const sats: Record<string, number> = {
      'cinematic': 0.9,
      'luxury': 0.85,
      'viral': 1.2,
      'corporate': 0.95,
      'warm-artisan': 1.0
    };
    return sats[style] || 1.0;
  }

  function getPresetHighlights(style: string): number {
    const highs: Record<string, number> = {
      'cinematic': -10,
      'luxury': -15,
      'viral': 0,
      'corporate': 0,
      'warm-artisan': -5
    };
    return highs[style] || 0;
  }

  function getPresetShadows(style: string): number {
    const shadows: Record<string, number> = {
      'cinematic': 15,
      'luxury': 20,
      'viral': 5,
      'corporate': 10,
      'warm-artisan': 18
    };
    return shadows[style] || 10;
  }

  function getPresetMidtones(style: string): number {
    const mids: Record<string, number> = {
      'cinematic': 5,
      'luxury': 10,
      'viral': 0,
      'corporate': 0,
      'warm-artisan': 8
    };
    return mids[style] || 0;
  }

  if (clips.length === 0) {
    return (
      <Card className="bg-slate-800/30 border-slate-700 border-dashed">
        <CardContent className="py-12 text-center">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Añade clips de video primero</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clips Grid */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            Selecciona un clip para aplicar color grading
          </CardTitle>
          <CardDescription className="text-slate-400">
            {colorGrades.length} clip{colorGrades.length !== 1 ? 's' : ''} con color grading aplicado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {clips.map(clip => {
              const hasGrade = colorGrades.some(g => g.clipId === clip.id);
              const grade = colorGrades.find(g => g.clipId === clip.id);
              
              return (
                <button
                  key={clip.id}
                  onClick={() => setSelectedClipId(clip.id)}
                  className={cn(
                    "p-3 rounded-lg text-left transition-all border relative overflow-hidden",
                    selectedClipId === clip.id
                      ? "border-purple-500 ring-2 ring-purple-500/30"
                      : hasGrade
                      ? "border-emerald-500"
                      : "border-slate-700 hover:border-slate-600"
                  )}
                >
                  {hasGrade && grade && (
                    <div className={cn("absolute inset-0 opacity-20", 
                      grade.style === 'cinematic' ? 'bg-blue-900' :
                      grade.style === 'luxury' ? 'bg-amber-900' :
                      grade.style === 'viral' ? 'bg-purple-900' :
                      grade.style === 'corporate' ? 'bg-slate-700' :
                      'bg-orange-900'
                    )} />
                  )}
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <Film className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-white truncate">{clip.type}</span>
                    </div>
                    {hasGrade && grade ? (
                      <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-400">
                        {grade.style}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                        Sin aplicar
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Clip Controls */}
      {selectedClip && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-white">Aplicar a: {selectedClip.type}</CardTitle>
                <CardDescription className="text-slate-400">
                  Selecciona un preset de color grading
                </CardDescription>
              </div>
              {clipGrade && (
                <Button variant="ghost" size="sm" onClick={() => removeGrade(selectedClip.id)} className="text-slate-400 hover:text-red-400">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Presets Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {PRESETS.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => applyPreset(selectedClip.id, preset.value as ColorGrade['style'])}
                  className={cn(
                    "p-3 rounded-lg text-center transition-all border",
                    clipGrade?.style === preset.value
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-slate-700 bg-slate-800 hover:border-slate-600"
                  )}
                >
                  <div className={cn("w-full h-8 rounded mb-2", preset.preview)} />
                  <div className="text-sm font-medium text-white">{preset.label}</div>
                  <div className="text-xs text-slate-400">{preset.desc}</div>
                </button>
              ))}
            </div>

            {/* Current Settings Display */}
            {clipGrade && (
              <div className="p-4 bg-slate-900 rounded-lg space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">Configuración Actual</span>
                  <Badge variant="outline" className="border-purple-500/50 text-purple-400 ml-auto">
                    {clipGrade.lut}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                      <Sun className="w-3 h-3" />
                      Temperatura
                    </div>
                    <p className="text-sm text-white">{clipGrade.temperature}K</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                      <Droplets className="w-3 h-3" />
                      Tinte
                    </div>
                    <p className="text-sm text-white">{clipGrade.tint > 0 ? `+${clipGrade.tint}` : clipGrade.tint}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                      <Contrast className="w-3 h-3" />
                      Contraste
                    </div>
                    <p className="text-sm text-white">{clipGrade.contrast}x</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                      <Palette className="w-3 h-3" />
                      Saturación
                    </div>
                    <p className="text-sm text-white">{Math.round(clipGrade.saturation * 100)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Highlights</div>
                    <p className="text-sm text-white">{clipGrade.highlights > 0 ? `+${clipGrade.highlights}` : clipGrade.highlights}</p>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Shadows</div>
                    <p className="text-sm text-white">+{clipGrade.shadows}</p>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Midtones</div>
                    <p className="text-sm text-white">{clipGrade.midtones > 0 ? `+${clipGrade.midtones}` : clipGrade.midtones}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}