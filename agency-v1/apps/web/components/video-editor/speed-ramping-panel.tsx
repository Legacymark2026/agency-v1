'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Film, Zap, ArrowRight, ArrowDown, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Clip, SpeedRamp } from '@/actions/video-editor';

interface SpeedRampingPanelProps {
  clips: Clip[];
  speedRamps: SpeedRamp[];
  onSpeedRampsChange: (ramps: SpeedRamp[]) => void;
}

const EASING_OPTIONS = [
  { value: 'linear', label: 'Linear', desc: 'Velocidad constante' },
  { value: 'ease-in', label: 'Ease In', desc: 'Comienza lento, acelera' },
  { value: 'ease-out', label: 'Ease Out', desc: 'Rápido al inicio, desacelera' },
  { value: 'ease-in-out', label: 'Ease In-Out', desc: 'Suave al inicio y final' },
] as const;

export function SpeedRampingPanel({ clips, speedRamps, onSpeedRampsChange }: SpeedRampingPanelProps) {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  const selectedClip = clips.find(c => c.id === selectedClipId);
  const clipRamp = speedRamps.find(r => r.clipId === selectedClipId);

  const addSpeedRamp = (clipId: string) => {
    const existing = speedRamps.find(r => r.clipId === clipId);
    if (existing) return;

    const newRamp: SpeedRamp = {
      clipId,
      startSpeed: 100,
      endSpeed: 150,
      easing: 'ease-in-out'
    };
    onSpeedRampsChange([...speedRamps, newRamp]);
    setSelectedClipId(clipId);
  };

  const updateSpeedRamp = (clipId: string, updates: Partial<SpeedRamp>) => {
    onSpeedRampsChange(
      speedRamps.map(r => r.clipId === clipId ? { ...r, ...updates } : r)
    );
  };

  const removeSpeedRamp = (clipId: string) => {
    onSpeedRampsChange(speedRamps.filter(r => r.clipId !== clipId));
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

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
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Clips con Speed Ramping
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configura efectos de velocidad para tus clips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {clips.map(clip => {
              const hasRamp = speedRamps.some(r => r.clipId === clip.id);
              const ramp = speedRamps.find(r => r.clipId === clip.id);
              
              return (
                <button
                  key={clip.id}
                  onClick={() => hasRamp ? setSelectedClipId(clip.id) : addSpeedRamp(clip.id)}
                  className={cn(
                    "p-3 rounded-lg text-left transition-all border",
                    selectedClipId === clip.id
                      ? "border-amber-500 bg-amber-500/10"
                      : hasRamp
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-800 hover:border-slate-600"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Film className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-white truncate">{clip.type}</span>
                  </div>
                  {hasRamp && ramp ? (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-amber-400">{ramp.startSpeed}%</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-amber-400">{ramp.endSpeed}%</span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                      + Speed Ramp
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedClip && clipRamp && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-white">Configurar: {selectedClip.type}</CardTitle>
                <CardDescription className="text-slate-400">
                  Duración: {selectedClip.duration}s
                </CardDescription>
              </div>
              <button
                onClick={() => removeSpeedRamp(selectedClip.id)}
                className="text-slate-400 hover:text-red-400 text-sm"
              >
                Eliminar
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Speed Start */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-slate-300">Velocidad Inicial</Label>
                <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                  {clipRamp.startSpeed}%
                </Badge>
              </div>
              <Slider
                value={[clipRamp.startSpeed ?? 100]}
                onValueChange={([val]) => updateSpeedRamp(selectedClip.id, { startSpeed: val })}
                min={25}
                max={200}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>25% (Slow-Mo)</span>
                <span>100% (Normal)</span>
                <span>200% (Hyperlapse)</span>
              </div>
            </div>

            {/* Speed End */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-slate-300">Velocidad Final</Label>
                <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                  {clipRamp.endSpeed}%
                </Badge>
              </div>
              <Slider
                value={[clipRamp.endSpeed ?? 100]}
                onValueChange={([val]) => updateSpeedRamp(selectedClip.id, { endSpeed: val })}
                min={25}
                max={200}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>25%</span>
                <span>100%</span>
                <span>200%</span>
              </div>
            </div>

            {/* Easing */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Tipo de Transición</Label>
              <div className="grid grid-cols-4 gap-2">
                {EASING_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateSpeedRamp(selectedClip.id, { easing: opt.value })}
                    className={cn(
                      "p-2 rounded-lg text-center border transition-all",
                      clipRamp.easing === opt.value
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-slate-700 bg-slate-800 hover:border-slate-600"
                    )}
                  >
                    <div className="text-xs font-medium text-white">{opt.label}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Preview */}
            <div className="p-4 bg-slate-900 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                    style={{ width: `${clipRamp.startSpeed}%` }}
                  />
                </div>
                <Play className="w-4 h-4 text-amber-400" />
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                    style={{ width: `${clipRamp.endSpeed}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>Inicio</span>
                <span>Fin</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}