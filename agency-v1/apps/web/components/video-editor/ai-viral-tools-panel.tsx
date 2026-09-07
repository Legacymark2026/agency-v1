'use client';

import { useState } from 'react';
import {
  Scissors, Type, Zap, Volume2, Crop, Layers, Image as ImageIcon,
  Sparkles, RefreshCw, Wand2, ArrowRight, Play
} from 'lucide-react';
import {
  runAutoClipAction,
  runKineticSubtitlesAction,
  runSilenceRemovalAction,
  runAudioDuckingAction,
  runSmartReframeAction,
  runBrollMatchingAction,
  runGenerateThumbnailAction,
} from '@/modules/video/actions/video-enterprise';
import { toast } from 'sonner';

export function AIViralToolsPanel() {
  const [activeTab, setActiveTab] = useState<
    'clipper' | 'subtitles' | 'silence' | 'ducking' | 'reframe' | 'broll' | 'thumbnail'
  >('clipper');

  const [isLoading, setIsLoading] = useState(false);

  // Results State
  const [viralClips, setViralClips] = useState<any[]>([]);
  const [subtitleBlocks, setSubtitleBlocks] = useState<any[]>([]);
  const [silenceResult, setSilenceResult] = useState<any>(null);
  const [duckingResult, setDuckingResult] = useState<any>(null);
  const [reframeResult, setReframeResult] = useState<any>(null);
  const [brollResult, setBrollResult] = useState<any[]>([]);
  const [thumbnailDesign, setThumbnailDesign] = useState<any>(null);

  // Forms State
  const [transcriptText, setTranscriptText] = useState(
    "El gran secreto para escalar un SaaS en 2026 es automatizar la contabilidad con IA y la nómina electrónica DIAN."
  );

  // 1. Auto-Clip
  const handleRunAutoClip = async () => {
    setIsLoading(true);
    try {
      const sentences = [
        { text: "El gran secreto para escalar un SaaS en 2026...", startSec: 0, endSec: 8, energyLevel: 0.95 },
        { text: "es automatizar la nómina electrónica DIAN y el cierre contable con IA.", startSec: 8, endSec: 22, energyLevel: 0.90 },
        { text: "Las empresas que no implementen esta estrategia perderán millones.", startSec: 22, endSec: 35, energyLevel: 0.88 },
      ];
      const res = await runAutoClipAction({ sentences, targetDuration: 30 });
      if (res.success) {
        setViralClips(res.clips || []);
        toast.success("Clips virales extraídos con éxito.");
      }
    } catch (_) {
      toast.error("Error al procesar clips.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Kinetic Subtitles
  const handleRunKineticSubtitles = async () => {
    setIsLoading(true);
    try {
      const words = transcriptText.split(" ").map((w, idx) => ({
        word: w,
        startSec: idx * 0.4,
        endSec: (idx + 1) * 0.4,
      }));
      const res = await runKineticSubtitlesAction({ words, wordsPerBlock: 4 });
      if (res.success) {
        setSubtitleBlocks(res.blocks || []);
        toast.success("Subtítulos cinéticos generados.");
      }
    } catch (_) {
      toast.error("Error al generar subtítulos.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Remove Silence
  const handleRunSilenceRemoval = async () => {
    setIsLoading(true);
    try {
      const samples = [
        { timestampSec: 0.5, dbLevel: -12 },
        { timestampSec: 1.0, dbLevel: -10 },
        { timestampSec: 1.5, dbLevel: -48 },
        { timestampSec: 2.0, dbLevel: -52 },
        { timestampSec: 2.5, dbLevel: -8 },
        { timestampSec: 3.0, dbLevel: -9 },
      ];
      const res = await runSilenceRemovalAction({ samples, thresholdDb: -35 });
      if (res.success) {
        setSilenceResult(res.result);
        toast.success("Cortes de silencio calculados.");
      }
    } catch (_) {
      toast.error("Error al remover silencios.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Audio Ducking
  const handleRunAudioDucking = async () => {
    setIsLoading(true);
    try {
      const speechSegments = [
        { startSec: 2, endSec: 14 },
        { startSec: 18, endSec: 42 },
      ];
      const res = await runAudioDuckingAction({ speechSegments, totalDurationSec: 60, duckedLevel: 0.15, normalLevel: 0.8 });
      if (res.success) {
        setDuckingResult(res.result);
        toast.success("Curva de ducking calculada.");
      }
    } catch (_) {
      toast.error("Error al calcular audio ducking.");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Smart Reframe
  const handleRunSmartReframe = async () => {
    setIsLoading(true);
    try {
      const res = await runSmartReframeAction({ targetRatio: "9:16", fitMode: "SMART_CENTER_CROP", sourceWidth: 1920, sourceHeight: 1080 });
      if (res.success) {
        setReframeResult(res.result);
        toast.success("Reencuadre 9:16 calculado.");
      }
    } catch (_) {
      toast.error("Error al calcular re-encuadre.");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. B-Roll Matcher
  const handleRunBrollMatching = async () => {
    setIsLoading(true);
    try {
      const transcriptSegments = [
        { text: "nuestro software de inteligencia artificial empresarial", startSec: 2, endSec: 8 },
        { text: "reportes contables y análisis predictivo", startSec: 12, endSec: 18 },
      ];
      const res = await runBrollMatchingAction({ transcriptSegments });
      if (res.success) {
        setBrollResult(res.matched || []);
        toast.success("B-Rolls emparejados.");
      }
    } catch (_) {
      toast.error("Error al emparejar B-Rolls.");
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Thumbnail Generator
  const handleRunGenerateThumbnail = async () => {
    setIsLoading(true);
    try {
      const res = await runGenerateThumbnailAction({ videoTitle: "Video Viral con IA" });
      if (res.success) {
        setThumbnailDesign(res.design);
        toast.success("Miniatura diseñada.");
      }
    } catch (_) {
      toast.error("Error al diseñar miniatura.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
        <button
          onClick={() => setActiveTab('clipper')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
            activeTab === 'clipper' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scissors className="w-3 h-3 text-teal-400" /> Clipper
        </button>

        <button
          onClick={() => setActiveTab('subtitles')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
            activeTab === 'subtitles' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Type className="w-3 h-3 text-teal-400" /> Subtítulos
        </button>

        <button
          onClick={() => setActiveTab('silence')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
            activeTab === 'silence' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3 h-3 text-teal-400" /> Silencios
        </button>

        <button
          onClick={() => setActiveTab('ducking')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
            activeTab === 'ducking' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Volume2 className="w-3 h-3 text-teal-400" /> Ducking
        </button>

        <button
          onClick={() => setActiveTab('reframe')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
            activeTab === 'reframe' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Crop className="w-3 h-3 text-teal-400" /> 9:16
        </button>

        <button
          onClick={() => setActiveTab('broll')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
            activeTab === 'broll' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3 h-3 text-teal-400" /> B-Roll
        </button>

        <button
          onClick={() => setActiveTab('thumbnail')}
          className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
            activeTab === 'thumbnail' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3 h-3 text-teal-400" /> Miniatura
        </button>
      </div>

      {/* Clipper Tab */}
      {activeTab === 'clipper' && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-400">Analiza el guion del video y extrae los mejores ganchos virales 9:16.</p>
          <button
            onClick={handleRunAutoClip}
            disabled={isLoading}
            className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            Extraer Clips Virales
          </button>

          <div className="space-y-2 mt-2 max-h-72 overflow-y-auto">
            {viralClips.map((c, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-teal-400 text-[11px]">{c.title}</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">{c.viralityScore} pts</span>
                </div>
                <p className="text-slate-400 text-[10px]">{c.durationSec}s · {c.hookHeadline}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtitles Tab */}
      {activeTab === 'subtitles' && (
        <div className="space-y-3">
          <textarea
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            rows={3}
            className="w-full p-2 bg-slate-950 rounded border border-slate-800 text-slate-200 text-xs focus:border-teal-500 outline-none"
            placeholder="Texto de voz para subtitular..."
          />
          <button
            onClick={handleRunKineticSubtitles}
            disabled={isLoading}
            className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Type className="w-3.5 h-3.5" />}
            Generar Subtítulos Cinéticos
          </button>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {subtitleBlocks.map((b, i) => (
              <div key={i} className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
                <span className="text-white font-medium">{b.text} {b.emoji}</span>
                <span className="text-slate-500 text-[10px] font-mono">{b.startSec.toFixed(1)}s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Silence Remover Tab */}
      {activeTab === 'silence' && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-400">Elimina pausas muertas y tartamudeos para ritmo ágil estilo Descript.</p>
          <button
            onClick={handleRunSilenceRemoval}
            disabled={isLoading}
            className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Detectar y Recortar Silencios
          </button>

          {silenceResult && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Tiempo Ahorrado:</span>
                <span className="text-emerald-400 font-bold">-{silenceResult.savedDurationSec.toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cortes Aplicados:</span>
                <span className="text-white">{silenceResult.cutCount}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ducking Tab */}
      {activeTab === 'ducking' && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-400">Atenúa automáticamente la música de fondo cuando hay voz.</p>
          <button
            onClick={handleRunAudioDucking}
            disabled={isLoading}
            className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
            Aplicar Ducking de Audio
          </button>

          {duckingResult && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] space-y-1">
              <span className="text-teal-400 font-bold">Atenuación: {(duckingResult.duckedLevel * 100).toFixed(0)}%</span>
              <p className="text-slate-400">Filtro FFmpeg generado para mezcla balanceada.</p>
            </div>
          )}
        </div>
      )}

      {/* Reframe Tab */}
      {activeTab === 'reframe' && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-400">Reencuadra videos 16:9 a 9:16 con seguimiento facial dinámico.</p>
          <button
            onClick={handleRunSmartReframe}
            disabled={isLoading}
            className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Crop className="w-3.5 h-3.5" />}
            Calcular Reencuadre 9:16
          </button>

          {reframeResult && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
              <span className="text-emerald-400 font-bold">Resolución: {reframeResult.recommendedResolution}</span>
              <p className="text-slate-400 mt-1 font-mono text-[10px]">Crop: {reframeResult.targetWidth}x{reframeResult.targetHeight}</p>
            </div>
          )}
        </div>
      )}

      {/* B-Roll Tab */}
      {activeTab === 'broll' && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-400">Inyecta recursos y planos de apoyo B-Roll en base a palabras clave.</p>
          <button
            onClick={handleRunBrollMatching}
            disabled={isLoading}
            className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
            Emparejar Planos B-Roll
          </button>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {brollResult.map((b, i) => (
              <div key={i} className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-teal-400 font-bold block">{b.matchedAssetTitle}</span>
                <span className="text-slate-400 text-[10px]">{b.timestampSec}s · Confianza {b.confidenceScore}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thumbnail Tab */}
      {activeTab === 'thumbnail' && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-400">Diseña miniaturas de alto CTR con titulares de alto contraste.</p>
          <button
            onClick={handleRunGenerateThumbnail}
            disabled={isLoading}
            className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
            Diseñar Miniatura Viral
          </button>

          {thumbnailDesign && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center space-y-1">
              <span className="text-amber-300 font-bold text-sm block">{thumbnailDesign.punchyHeadline}</span>
              <span className="text-slate-400 text-[10px]">{thumbnailDesign.badgeTag} · Calidad {thumbnailDesign.overallFrameQuality}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
