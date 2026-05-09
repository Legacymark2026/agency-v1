'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music, Mic, Volume2, Zap, Copy, RefreshCw, Plus, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AudioTrack } from '@/actions/video-editor';
import { generateVoiceoverScript } from '@/actions/video-editor';

interface AudioMixerProps {
  audioTracks: AudioTrack[];
  onAudioTracksChange: (tracks: AudioTrack[]) => void;
}

const VOICE_TONES = [
  { value: 'warm', label: 'Warm', emoji: '🌟' },
  { value: 'authoritative', label: 'Authoritative', emoji: '💼' },
  { value: 'casual', label: 'Casual', emoji: '😊' },
  { value: 'mysterious', label: 'Mysterious', emoji: '🌙' },
] as const;

const DUCKING_PRESETS = [
  { label: 'Bajo Voz', musicVol: -20, voiceVol: -14, desc: 'Música muy baja, voz protagonista' },
  { label: 'Balance', musicVol: -14, voiceVol: -16, desc: 'Mezcla equilibrada estándar' },
  { label: 'Full Track', musicVol: -12, voiceVol: -20, desc: 'Música dominante, voz sutil' },
] as const;

// Animated VU Meter
function VuMeter({ level, color = 'emerald' }: { level: number; color?: string }) {
  const bars = 12;
  return (
    <div className="flex gap-0.5 items-end h-10">
      {Array.from({ length: bars }).map((_, i) => {
        const barLevel = ((i + 1) / bars) * 100;
        const isActive = barLevel <= level;
        const barColor = i < 7 ? `bg-${color}-500` : i < 10 ? 'bg-yellow-500' : 'bg-red-500';
        return (
          <div
            key={i}
            className={cn(
              'w-1.5 rounded-sm transition-all duration-100',
              isActive ? barColor : 'bg-slate-700'
            )}
            style={{ height: `${30 + i * 5}%` }}
          />
        );
      })}
    </div>
  );
}

// Animated VU with pulsing
function AnimatedVu({ lufs }: { lufs: number }) {
  const [displayLevel, setDisplayLevel] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Convert LUFS (-18 to -10) to percentage (0-100)
  const baseLevel = Math.max(0, Math.min(100, ((lufs + 20) / 12) * 100));

  useEffect(() => {
    setIsAnimating(true);
    let frame = 0;
    animRef.current = setInterval(() => {
      const noise = (Math.random() - 0.5) * 15;
      setDisplayLevel(Math.max(0, Math.min(100, baseLevel + noise)));
      frame++;
      if (frame > 60) setIsAnimating(false);
    }, 80);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [baseLevel]);

  return (
    <div onClick={() => setIsAnimating(true)} className="cursor-pointer" title="Click para simular">
      <VuMeter level={isAnimating ? displayLevel : baseLevel} />
    </div>
  );
}

export function AudioMixer({ audioTracks, onAudioTracksChange }: AudioMixerProps) {
  const [voiceoverScript, setVoiceoverScript] = useState('');
  const [voiceTone, setVoiceTone] = useState<'warm' | 'authoritative' | 'casual' | 'mysterious'>('warm');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [activeDucking, setActiveDucking] = useState<string | null>(null);

  const musicTrack = audioTracks.find(t => t.type === 'music');
  const voiceTrack = audioTracks.find(t => t.type === 'voiceover');

  const addMusicTrack = () => {
    if (musicTrack) return;
    onAudioTracksChange([...audioTracks, {
      type: 'music', source: 'uploaded', lufs: -14, duration: 30, bpm: 120
    }]);
  };

  const addVoiceover = () => {
    if (voiceTrack) return;
    onAudioTracksChange([...audioTracks, {
      type: 'voiceover', source: 'generated', lufs: -16, duration: 15
    }]);
  };

  const removeTrack = (type: string) => {
    onAudioTracksChange(audioTracks.filter(t => t.type !== type));
  };

  const updateTrack = (type: string, updates: Partial<AudioTrack>) => {
    onAudioTracksChange(audioTracks.map(t => t.type === type ? { ...t, ...updates } : t));
  };

  const applyDucking = (preset: typeof DUCKING_PRESETS[number]) => {
    setActiveDucking(preset.label);
    onAudioTracksChange(audioTracks.map(t => {
      if (t.type === 'music') return { ...t, lufs: preset.musicVol };
      if (t.type === 'voiceover') return { ...t, lufs: preset.voiceVol };
      return t;
    }));
  };

  const generateScript = async () => {
    setIsGeneratingScript(true);
    try {
      const script = await generateVoiceoverScript('product showcase', voiceTone);
      setVoiceoverScript(script);
    } catch (error) {
      console.error('Error generating script:', error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const masterLufs = audioTracks.length > 0
    ? Math.round(audioTracks.reduce((sum, t) => sum + t.lufs, 0) / audioTracks.length)
    : -14;
  const masterLevel = Math.max(0, Math.min(100, ((masterLufs + 20) / 12) * 100));

  return (
    <div className="space-y-6">
      {/* Master Bus */}
      <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-700">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <AnimatedVu lufs={masterLufs} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-teal-400" />
                  Master Bus
                </p>
                <Badge className={cn('text-xs',
                  masterLufs >= -16 && masterLufs <= -12
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                )}>
                  {masterLufs} LUFS
                </Badge>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', masterLevel > 80 ? 'bg-red-500' : masterLevel > 60 ? 'bg-amber-500' : 'bg-emerald-500')}
                  style={{ width: `${masterLevel}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{audioTracks.length} tracks · Click en VU Meter para simular</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ducking Presets */}
      {audioTracks.length >= 2 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-300 font-semibold uppercase tracking-wider">
              Presets de Ducking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {DUCKING_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => applyDucking(preset)}
                  className={cn(
                    'p-3 rounded-xl text-left transition-all border text-xs',
                    activeDucking === preset.label
                      ? 'border-teal-500 bg-teal-500/10 text-white'
                      : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                  )}
                >
                  <p className="font-semibold mb-1">{preset.label}</p>
                  <p className="text-slate-400 text-[10px]">{preset.desc}</p>
                  <div className="flex gap-1 mt-2">
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">
                      M:{preset.musicVol}
                    </span>
                    <span className="text-[9px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded">
                      V:{preset.voiceVol}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Music Track */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500/15 rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-sm text-white">Música de Fondo</CardTitle>
                <CardDescription className="text-xs text-slate-400">Pista musical principal</CardDescription>
              </div>
            </div>
            {!musicTrack ? (
              <Button size="sm" variant="outline" onClick={addMusicTrack} className="border-slate-600 text-slate-300 h-8 text-xs">
                <Plus className="w-3 h-3 mr-1" />Añadir
              </Button>
            ) : (
              <button onClick={() => removeTrack('music')} className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardHeader>
        {musicTrack && (
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-slate-900 rounded-xl">
              {/* Vertical fader simulation */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500">dB</span>
                <div className="relative h-20 w-6 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-full transition-all"
                    style={{ height: `${Math.max(0, Math.min(100, ((musicTrack.lufs + 20) / 12) * 100))}%` }}
                  />
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">{musicTrack.lufs}</span>
              </div>

              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <Label className="text-xs text-slate-400">LUFS</Label>
                  <AnimatedVu lufs={musicTrack.lufs} />
                </div>
                <Slider
                  value={[-musicTrack.lufs]}
                  onValueChange={([v]) => updateTrack('music', { lufs: -v })}
                  min={10} max={18} step={1}
                  className="py-1"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>Fuerte</span><span>Normal</span><span>Silencioso</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-400 block mb-1">BPM</Label>
                <Input
                  type="number"
                  value={musicTrack.bpm ?? 120}
                  onChange={(e) => updateTrack('music', { bpm: Number(e.target.value) })}
                  className="h-8 bg-slate-800 border-slate-700 text-white text-sm"
                  min={60} max={200}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400 block mb-1">Duración (s)</Label>
                <Input
                  type="number"
                  value={musicTrack.duration}
                  onChange={(e) => updateTrack('music', { duration: Number(e.target.value) })}
                  className="h-8 bg-slate-800 border-slate-700 text-white text-sm"
                />
              </div>
            </div>

            {/* Fade visualization */}
            <div className="p-3 bg-slate-900 rounded-xl">
              <p className="text-xs text-slate-400 mb-2">Curva de Fade</p>
              <svg viewBox="0 0 200 40" className="w-full h-10">
                <defs>
                  <linearGradient id="fadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                    <stop offset="15%" stopColor="#10b981" stopOpacity="0.8"/>
                    <stop offset="85%" stopColor="#10b981" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                <path d="M0,38 Q20,38 30,5 L170,5 Q180,5 200,38 Z" fill="url(#fadeGrad)" />
                <path d="M0,38 Q20,38 30,5 L170,5 Q180,5 200,38" fill="none" stroke="#10b981" strokeWidth="1.5"/>
              </svg>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Voiceover Track */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-sm text-white">Voiceover</CardTitle>
                <CardDescription className="text-xs text-slate-400">Narración o locución</CardDescription>
              </div>
            </div>
            {!voiceTrack ? (
              <Button size="sm" variant="outline" onClick={addVoiceover} className="border-slate-600 text-slate-300 h-8 text-xs">
                <Plus className="w-3 h-3 mr-1" />Añadir
              </Button>
            ) : (
              <button onClick={() => removeTrack('voiceover')} className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardHeader>
        {voiceTrack && (
          <CardContent className="space-y-4">
            {/* Voice tone selector */}
            <div>
              <Label className="text-xs text-slate-400 block mb-2">Tono de Voz</Label>
              <div className="grid grid-cols-4 gap-2">
                {VOICE_TONES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setVoiceTone(t.value)}
                    className={cn(
                      'p-2 rounded-lg text-center transition-all border text-xs',
                      voiceTone === t.value
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    )}
                  >
                    <span className="text-base block mb-0.5">{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Script generator */}
            <div className="p-3 bg-slate-900 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-300 font-semibold">Guión de Voiceover</Label>
                <Button
                  onClick={generateScript}
                  disabled={isGeneratingScript}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 h-7 text-xs px-3"
                >
                  {isGeneratingScript ? (
                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Zap className="w-3 h-3 mr-1" />
                  )}
                  Generar con IA
                </Button>
              </div>
              {voiceoverScript && (
                <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-sm text-white italic leading-relaxed">"{voiceoverScript}"</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(voiceoverScript)}
                    className="mt-2 text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar guión
                  </button>
                </div>
              )}
            </div>

            {/* LUFS for voiceover */}
            <div>
              <div className="flex justify-between mb-1">
                <Label className="text-xs text-slate-400">Nivel de Voz</Label>
                <span className="text-xs text-blue-400 font-mono">{voiceTrack.lufs} LUFS</span>
              </div>
              <Slider
                value={[-voiceTrack.lufs]}
                onValueChange={([v]) => updateTrack('voiceover', { lufs: -v })}
                min={10} max={20} step={1}
                className="py-1"
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}