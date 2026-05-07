'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music, Mic, Volume2, Zap, Copy, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AudioTrack } from '@/actions/video-editor';
import { generateVoiceoverScript } from '@/actions/video-editor';

interface AudioMixerProps {
  audioTracks: AudioTrack[];
  onAudioTracksChange: (tracks: AudioTrack[]) => void;
}

const VOICE_TONES = [
  { value: 'warm', label: 'Warm', desc: 'Cálido y cercano' },
  { value: 'authoritative', label: 'Authoritative', desc: 'Profesional y seguro' },
  { value: 'casual', label: 'Casual', desc: 'Despreocupado y amigable' },
  { value: 'mysterious', label: 'Mysterious', desc: 'Misterioso e intrigante' },
] as const;

export function AudioMixer({ audioTracks, onAudioTracksChange }: AudioMixerProps) {
  const [voiceoverScript, setVoiceoverScript] = useState('');
  const [voiceTone, setVoiceTone] = useState<'warm' | 'authoritative' | 'casual' | 'mysterious'>('warm');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  const musicTrack = audioTracks.find(t => t.type === 'music');
  const voiceTrack = audioTracks.find(t => t.type === 'voiceover');
  const sfxTracks = audioTracks.filter(t => t.type === 'sfx');

  const addMusicTrack = () => {
    const newTrack: AudioTrack = {
      type: 'music',
      source: 'uploaded',
      lufs: -14,
      duration: 30,
      bpm: 120
    };
    onAudioTracksChange([...audioTracks, newTrack]);
  };

  const addVoiceover = () => {
    const newTrack: AudioTrack = {
      type: 'voiceover',
      source: 'generated',
      lufs: -16,
      duration: 15
    };
    onAudioTracksChange([...audioTracks, newTrack]);
  };

  const removeTrack = (type: string) => {
    onAudioTracksChange(audioTracks.filter(t => t.type !== type));
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

  return (
    <div className="space-y-6">
      {/* Music Layer */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-emerald-400" />
              <div>
                <CardTitle className="text-base text-white">Música de Fondo</CardTitle>
                <CardDescription className="text-slate-400">Pista musical principal (-14 LUFS)</CardDescription>
              </div>
            </div>
            {!musicTrack && (
              <Button variant="outline" size="sm" onClick={addMusicTrack} className="border-slate-600 text-slate-300">
                + Añadir Música
              </Button>
            )}
          </div>
        </CardHeader>
        {musicTrack && (
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-white">Pista Musical</p>
                  <p className="text-xs text-slate-400">{musicTrack.duration}s • {musicTrack.bpm} BPM</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeTrack('music')} className="text-slate-400 hover:text-red-400">
                ×
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-400">Target LUFS</Label>
                <Slider
                  value={[-musicTrack.lufs]}
                  onValueChange={([val]) => {
                    onAudioTracksChange(audioTracks.map(t => 
                      t.type === 'music' ? { ...t, lufs: -val } : t
                    ));
                  }}
                  min={18}
                  max={10}
                  step={1}
                  className="py-2"
                />
                <span className="text-xs text-slate-400">{musicTrack.lufs} LUFS</span>
              </div>
              <div>
                <Label className="text-xs text-slate-400">BPM</Label>
                <Input
                  type="number"
                  value={musicTrack.bpm}
                  onChange={(e) => onAudioTracksChange(audioTracks.map(t => 
                    t.type === 'music' ? { ...t, bpm: Number(e.target.value) } : t
                  ))}
                  className="h-8 bg-slate-800 border-slate-700 text-white text-sm"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Voiceover Layer */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-blue-400" />
              <div>
                <CardTitle className="text-base text-white">Voiceover</CardTitle>
                <CardDescription className="text-slate-400">Narración o locución (-16 LUFS)</CardDescription>
              </div>
            </div>
            {!voiceTrack && (
              <Button variant="outline" size="sm" onClick={addVoiceover} className="border-slate-600 text-slate-300">
                + Añadir Voiceover
              </Button>
            )}
          </div>
        </CardHeader>
        {voiceTrack && (
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Mic className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-white">Voiceover</p>
                  <p className="text-xs text-slate-400">{voiceTrack.duration}s</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeTrack('voiceover')} className="text-slate-400 hover:text-red-400">
                ×
              </Button>
            </div>

            {/* Voiceover Script Generator */}
            <div className="space-y-3">
              <Label className="text-sm text-slate-300">Generar Guión de Voiceover</Label>
              <div className="flex gap-2">
                <select
                  value={voiceTone}
                  onChange={(e) => setVoiceTone(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                >
                  {VOICE_TONES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <Button 
                  onClick={generateScript} 
                  disabled={isGeneratingScript}
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGeneratingScript ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Generar
                </Button>
              </div>
              {voiceoverScript && (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <p className="text-sm text-white italic">"{voiceoverScript}"</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(voiceoverScript)}
                    className="mt-2 text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copiar
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Audio Summary */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Volume2 className="w-8 h-8 text-teal-400" />
              <div>
                <p className="text-white font-medium">Mezcla de Audio Final</p>
                <p className="text-sm text-slate-400">
                  {audioTracks.length} capa{audioTracks.length !== 1 ? 's' : ''} • Master: -14 LUFS
                </p>
              </div>
            </div>
            <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">
              Configuración Lista
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}