'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mic, Sparkles, Wand2, Volume2, ShieldCheck, RefreshCw,
  Sliders, Play, CheckCircle2, SlidersHorizontal
} from 'lucide-react';
import {
  runVoiceIsolationAction,
  runVoiceoverSynthesisAction
} from '@/modules/video/actions/video-enterprise';
import { toast } from 'sonner';

interface AIVoiceoverPanelProps {
  onAddAudioTrack: (track: { id: string; name: string; duration: number; url: string; type: 'audio' }) => void;
}

export function AIVoiceoverPanel({ onAddAudioTrack }: AIVoiceoverPanelProps) {
  const [scriptText, setScriptText] = useState(
    'Descubre el poder de escalar tu empresa con inteligencia artificial en 2026. Menos costos, máxima velocidad.'
  );
  const [emotion, setEmotion] = useState<'CORPORATE_PROFESSIONAL' | 'HIGH_ENERGY_ENTHUSIASTIC' | 'CALM_NARRATIVE' | 'DRAMATIC_URGENT'>('HIGH_ENERGY_ENTHUSIASTIC');
  const [language, setLanguage] = useState<'es-CO' | 'es-MX' | 'es-ES' | 'en-US'>('es-CO');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Audio Enhancer state
  const [aggressiveness, setAggressiveness] = useState<'LIGHT' | 'MODERATE' | 'AGGRESSIVE'>('MODERATE');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState<any>(null);

  const handleSynthesizeVoice = async () => {
    if (!scriptText.trim()) return;
    setIsSynthesizing(true);
    try {
      const res = await runVoiceoverSynthesisAction({
        scriptText,
        language,
        emotion,
        speedRate: 1.0,
      });

      if (res.success && res.track) {
        onAddAudioTrack({
          id: res.track.trackId,
          name: `Locución IA (${emotion.slice(0, 10)})`,
          duration: res.track.totalDurationSec,
          url: '/audio/synthesized_sample.mp3',
          type: 'audio',
        });
        toast.success(`Locución de ${res.track.totalDurationSec}s insertada en pista de audio`);
      }
    } catch {
      toast.error('Error al sintetizar locución');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleEnhanceAudio = async () => {
    setIsEnhancing(true);
    try {
      const res = await runVoiceIsolationAction({
        aggressiveness,
        targetLufs: -14,
        deEsser: true,
        deReverb: true,
      });

      if (res.success) {
        setEnhanceResult(res.result);
        toast.success('Audio mejorado con calidad Broadcast (-14 LUFS)');
      }
    } catch {
      toast.error('Error al procesar aislamiento de voz');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. GENERADOR DE VOZ IA (TTS) ── */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-teal-400" /> Locución IA Ultra-Realista
          </h4>
          <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[10px]">
            TTS Emocional
          </Badge>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-400 block mb-1">Guión para locución:</label>
          <textarea
            rows={3}
            value={scriptText}
            onChange={e => setScriptText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Acento Regional:</label>
            <select
              value={language}
              onChange={(e: any) => setLanguage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white outline-hidden"
            >
              <option value="es-CO">🇨🇴 Colombia (Neutro)</option>
              <option value="es-MX">🇲🇽 México</option>
              <option value="es-ES">🇪🇸 España</option>
              <option value="en-US">🇺🇸 Estados Unidos</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Emoción / Tono:</label>
            <select
              value={emotion}
              onChange={(e: any) => setEmotion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white outline-hidden"
            >
              <option value="HIGH_ENERGY_ENTHUSIASTIC">⚡ Alta Energía (Viral)</option>
              <option value="CORPORATE_PROFESSIONAL">💼 Corporativo B2B</option>
              <option value="CALM_NARRATIVE">☕ Calma Narrativa</option>
              <option value="DRAMATIC_URGENT">🚨 Urgencia / Alerta</option>
            </select>
          </div>
        </div>

        <Button
          onClick={handleSynthesizeVoice}
          disabled={isSynthesizing}
          className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs h-8"
        >
          {isSynthesizing ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1.5" />}
          Generar Pista de Voz
        </Button>
      </div>

      {/* ── 2. AISLADOR DE VOZ & ENHANCE BROADCAST ── */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Aislador de Voz & Broadcast Enhance
          </h4>
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px]">
            Adobe Enhance Grade
          </Badge>
        </div>

        <p className="text-[11px] text-slate-400">
          Elimina ruido ambiental, eco de sala y normaliza el audio a -14 LUFS estándar para plataformas.
        </p>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={aggressiveness === 'LIGHT' ? 'default' : 'outline'}
            onClick={() => setAggressiveness('LIGHT')}
            className="text-[10px] h-7 flex-1"
          >
            Ligero
          </Button>
          <Button
            size="sm"
            variant={aggressiveness === 'MODERATE' ? 'default' : 'outline'}
            onClick={() => setAggressiveness('MODERATE')}
            className="text-[10px] h-7 flex-1"
          >
            Moderado
          </Button>
          <Button
            size="sm"
            variant={aggressiveness === 'AGGRESSIVE' ? 'default' : 'outline'}
            onClick={() => setAggressiveness('AGGRESSIVE')}
            className="text-[10px] h-7 flex-1"
          >
            Agresivo
          </Button>
        </div>

        <Button
          onClick={handleEnhanceAudio}
          disabled={isEnhancing}
          variant="secondary"
          className="w-full text-xs h-8 font-bold"
        >
          {isEnhancing ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />}
          Limpiar y Masterizar Pista de Audio
        </Button>

        {enhanceResult && (
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 font-mono text-[10px]">
            <p className="text-emerald-400">✅ Reducción de Ruido: -{enhanceResult.noiseFloorReductionDb}dB</p>
            <p className="text-teal-400">⚡ Claridad Vocal: +{enhanceResult.speechClarityBoostPercent}%</p>
            <p className="text-slate-400">🎙️ Norma LUFS: {enhanceResult.targetLufs} dB</p>
          </div>
        )}
      </div>
    </div>
  );
}
