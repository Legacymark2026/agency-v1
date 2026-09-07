'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, Play, Palette, Type, Flame } from 'lucide-react';
import { toast } from 'sonner';

export type SubtitlePresetId = 'hormozi' | 'gadzhi' | 'mrbeast' | 'karaoke_glow';

export interface SubtitlePreset {
  id: SubtitlePresetId;
  name: string;
  creatorTag: string;
  fontFamily: string;
  color: string;
  bgColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  glow?: string;
  animation: 'pop' | 'fade' | 'rotate' | 'glow';
  uppercase: boolean;
  sampleText: string;
}

export const SUBTITLE_PRESETS: SubtitlePreset[] = [
  {
    id: 'hormozi',
    name: 'Alex Hormozi Viral',
    creatorTag: 'Alta Retención • Caja Neón',
    fontFamily: 'Montserrat Black, Impact, sans-serif',
    color: '#FACC15', // Yellow neon
    bgColor: 'rgba(0, 0, 0, 0.88)',
    animation: 'pop',
    uppercase: true,
    sampleText: 'EL SECRETO ES AUTOMATIZAR',
  },
  {
    id: 'gadzhi',
    name: 'Iman Gadzhi Luxury',
    creatorTag: 'Minimalista • Serif Elegante',
    fontFamily: 'Cinzel, Playfair Display, Georgia, serif',
    color: '#F8FAFC',
    glow: '0 0 15px rgba(255,255,255,0.4)',
    animation: 'fade',
    uppercase: false,
    sampleText: 'La disciplina supera al talento',
  },
  {
    id: 'mrbeast',
    name: 'MrBeast Explosive',
    creatorTag: 'Borde Grueso • Shake Dinámico',
    fontFamily: 'Impact, Arial Black, sans-serif',
    color: '#38BDF8', // Vivid blue
    strokeColor: '#000000',
    strokeWidth: 4,
    animation: 'rotate',
    uppercase: true,
    sampleText: '¡TIENES 10 SEGUNDOS!',
  },
  {
    id: 'karaoke_glow',
    name: 'TikTok Karaoke Glow',
    creatorTag: 'Resplandor Neón • Palabra por Palabra',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#00F0FF',
    glow: '0 0 16px #00F0FF, 0 0 30px #00F0FF',
    animation: 'glow',
    uppercase: true,
    sampleText: 'ESCALA TU NEGOCIO HOY',
  },
];

interface ViralSubtitlesPresetsProps {
  currentPreset?: SubtitlePresetId;
  onSelectPreset: (preset: SubtitlePreset) => void;
}

export function ViralSubtitlesPresets({
  currentPreset = 'hormozi',
  onSelectPreset,
}: ViralSubtitlesPresetsProps) {
  const [selected, setSelected] = useState<SubtitlePresetId>(currentPreset);

  const handleSelect = (preset: SubtitlePreset) => {
    setSelected(preset.id);
    onSelectPreset(preset);
    toast.success(`Estilo de subtítulo "${preset.name}" aplicado`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400" /> Presets de Subtítulos Virales 1-Click
        </h4>
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
          Estilos Top Creadores
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SUBTITLE_PRESETS.map((preset) => {
          const isSelected = selected === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => handleSelect(preset)}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 border-teal-500 ring-1 ring-teal-500 shadow-lg shadow-teal-500/10'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    {preset.name}
                    {isSelected && <Check className="w-3 h-3 text-teal-400" />}
                  </p>
                  <span className="text-[10px] text-slate-500">{preset.creatorTag}</span>
                </div>
              </div>

              {/* Visual Preview Box */}
              <div className="h-16 rounded-lg bg-black/80 border border-slate-800/80 flex items-center justify-center p-2 text-center overflow-hidden">
                <span
                  style={{
                    fontFamily: preset.fontFamily,
                    color: preset.color,
                    backgroundColor: preset.bgColor || 'transparent',
                    WebkitTextStroke: preset.strokeWidth ? `${preset.strokeWidth}px ${preset.strokeColor}` : undefined,
                    textShadow: preset.glow || undefined,
                    padding: preset.bgColor ? '2px 8px' : undefined,
                    borderRadius: preset.bgColor ? '4px' : undefined,
                  }}
                  className={`text-xs font-black tracking-wide ${preset.uppercase ? 'uppercase' : ''}`}
                >
                  {preset.sampleText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
