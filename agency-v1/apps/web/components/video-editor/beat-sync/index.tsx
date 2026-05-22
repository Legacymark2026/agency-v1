'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Music,
  Sparkles,
  Play,
  Pause,
  Waves,
  Zap,
  RefreshCw,
  Scissors,
  Clock,
  Disc3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeatMarker {
  time: number;
  strength: number;
  frequency: number;
}

interface BeatSyncPanelProps {
  beats?: BeatMarker[];
  duration?: number;
  onDetect?: () => void;
  onSnapToBeat?: (time: number) => void;
  onAutoCut?: (beatInterval: number) => void;
  isDetecting?: boolean;
  bpm?: number;
}

export function BeatSyncPanel({
  beats = [],
  duration = 0,
  onDetect,
  onSnapToBeat,
  onAutoCut,
  isDetecting = false,
  bpm = 0,
}: BeatSyncPanelProps) {
  const [showBeats, setShowBeats] = useState(true);
  const [snapToBeat, setSnapToBeat] = useState(true);
  const [autoCutInterval, setAutoCutInterval] = useState(4);
  const [selectedBeat, setSelectedBeat] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}.${Math.floor((seconds % 1) * 10)}`;
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'bg-rose-500';
    if (strength >= 0.6) return 'bg-amber-500';
    return 'bg-cyan-500';
  };

  const getStrengthWidth = (strength: number) => {
    return Math.max(2, Math.round(strength * 8));
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-rose-400" />
            Beat Sync
          </CardTitle>
          <Button
            size="sm"
            onClick={onDetect}
            disabled={isDetecting}
            className={cn(
              'text-xs',
              isDetecting
                ? 'bg-slate-700 text-slate-400'
                : 'bg-rose-600 hover:bg-rose-700',
            )}
          >
            {isDetecting ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Waves className="w-3 h-3 mr-1" />
            )}
            {isDetecting ? 'Detectando...' : 'Detectar BPM'}
          </Button>
        </div>
        {bpm > 0 && (
          <CardDescription className="text-slate-400">
            <span className="text-rose-400 font-semibold">{bpm} BPM</span> detectados —{' '}
            {beats.length} beats
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={snapToBeat}
              onCheckedChange={setSnapToBeat}
              id="snap-beat"
            />
            <Label htmlFor="snap-beat" className="text-xs text-slate-300">
              Snap al beat
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={showBeats}
              onCheckedChange={setShowBeats}
              id="show-beats"
            />
            <Label htmlFor="show-beats" className="text-xs text-slate-300">
              Mostrar beats
            </Label>
          </div>
        </div>

        {showBeats && beats.length > 0 && (
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Línea de tiempo de beats</p>
              <Badge variant="outline" className="border-rose-500/30 text-rose-400 text-[10px]">
                <Disc3 className="w-3 h-3 mr-1" />
                {bpm} BPM
              </Badge>
            </div>
            <div className="relative h-16 bg-slate-950 rounded border border-slate-700/50 overflow-hidden">
              <div className="absolute inset-0 flex items-end px-1">
                {beats
                  .filter((b) => duration === 0 || b.time <= duration)
                  .map((beat, i) => {
                    const left = duration > 0 ? (beat.time / duration) * 100 : 0;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedBeat(beat.time);
                          onSnapToBeat?.(beat.time);
                        }}
                        className={cn(
                          'absolute bottom-0 rounded-t transition-all hover:opacity-80',
                          getStrengthColor(beat.strength),
                          selectedBeat === beat.time && 'ring-2 ring-white',
                        )}
                        style={{
                          left: `${left}%`,
                          width: `${getStrengthWidth(beat.strength)}px`,
                          height: `${Math.max(20, Math.round(beat.strength * 100))}%`,
                          marginLeft: `${-getStrengthWidth(beat.strength) / 2}px`,
                        }}
                      />
                    );
                  })}
              </div>
              {selectedBeat !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                  style={{ left: `${(selectedBeat / duration) * 100}%` }}
                />
              )}
            </div>
            {selectedBeat !== null && (
              <p className="text-[10px] text-slate-500 mt-1 text-center">
                Beat seleccionado: {formatTime(selectedBeat)}
              </p>
            )}
          </div>
        )}

        {beats.length === 0 && !isDetecting && (
          <div className="text-center py-6">
            <Music className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No se detectaron beats</p>
            <p className="text-slate-600 text-xs mt-1">
              Analiza el audio para detectar el ritmo
            </p>
          </div>
        )}

        {isDetecting && (
          <div className="text-center py-6">
            <Disc3 className="w-8 h-8 text-rose-500 mx-auto mb-2 animate-spin" />
            <p className="text-rose-400 text-sm">Analizando frecuencia de audio...</p>
          </div>
        )}

        {beats.length > 0 && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-slate-400">
                Cortes automáticos cada X beats
              </Label>
              <div className="flex items-center gap-3 mt-1">
                <Slider
                  value={[autoCutInterval]}
                  onValueChange={([v]) => setAutoCutInterval(v)}
                  min={1}
                  max={16}
                  step={1}
                  className="flex-1"
                />
                <Badge className="bg-rose-500/20 text-rose-400 text-xs min-w-[40px] justify-center">
                  {autoCutInterval}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onAutoCut?.(autoCutInterval)}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-xs h-8"
              >
                <Scissors className="w-3 h-3 mr-1" />
                Cortar en beats
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsPlaying(!isPlaying);
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs h-8"
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3 mr-1" />
                ) : (
                  <Play className="w-3 h-3 mr-1" />
                )}
                {isPlaying ? 'Pausar' : 'Previsualizar'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
