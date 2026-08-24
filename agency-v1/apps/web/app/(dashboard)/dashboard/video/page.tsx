'use client';

import { useState } from 'react';
import {
  Film, Sparkles, Scissors, Type, Volume2, Crop, Image as ImageIcon,
  Layers, Play, CheckCircle2, RefreshCw, Wand2, Plus, Zap, ArrowRight,
  TrendingUp, Clock, FileVideo
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

export default function VideoStudioProPage() {
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
    "El gran secreto para escalar un SaaS corporativo en 2026 es automatizar la nómina electrónica DIAN y el cierre contable con agentes de IA. Las empresas que no implementen esta estrategia perderán millones en costos operativos."
  );
  const [videoTitle, setVideoTitle] = useState("Cómo Escalar tu Empresa con IA en 2026");

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
        toast.success("Clips virales extraídos y puntuados con éxito.");
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
        toast.success("Subtítulos cinéticos con emojis generados.");
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
        { timestampSec: 1.5, dbLevel: -48 }, // Silence
        { timestampSec: 2.0, dbLevel: -52 }, // Silence
        { timestampSec: 2.5, dbLevel: -8 },
        { timestampSec: 3.0, dbLevel: -9 },
      ];
      const res = await runSilenceRemovalAction({ samples, thresholdDb: -35 });
      if (res.success) {
        setSilenceResult(res.result);
        toast.success("Cortes de silencio calculados exitosamente.");
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
      const voiceEvents = [
        { startSec: 2, endSec: 14 },
        { startSec: 18, endSec: 42 },
      ];
      const res = await runAudioDuckingAction({ voiceEvents, totalDurationSec: 60, duckingDepthDb: -18 });
      if (res.success) {
        setDuckingResult(res.result);
        toast.success("Curva de atenuación espectral aplicada.");
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
      const points = [
        { timestampSec: 0, normalizedX: 0.35, normalizedY: 0.4, confidence: 0.95 },
        { timestampSec: 5, normalizedX: 0.52, normalizedY: 0.42, confidence: 0.98 },
        { timestampSec: 10, normalizedX: 0.65, normalizedY: 0.39, confidence: 0.92 },
      ];
      const res = await runSmartReframeAction({ faceTrackingPoints: points, sourceWidth: 1920, sourceHeight: 1080 });
      if (res.success) {
        setReframeResult(res.result);
        toast.success("Rastreo facial 9:16 calculado.");
      }
    } catch (_) {
      toast.error("Error al calcular re-encuadre.");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Match B-Roll
  const handleRunBrollMatching = async () => {
    setIsLoading(true);
    try {
      const transcript = [
        { keyword: "contabilidad", timestampSec: 4 },
        { keyword: "inteligencia artificial", timestampSec: 12 },
        { keyword: "dinero", timestampSec: 25 },
      ];
      const res = await runBrollMatchingAction({ transcript });
      if (res.success) {
        setBrollResult(res.matched || []);
        toast.success("Tomas de apoyo B-Roll emparejadas.");
      }
    } catch (_) {
      toast.error("Error al buscar B-Rolls.");
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Thumbnail Generator
  const handleRunGenerateThumbnail = async () => {
    setIsLoading(true);
    try {
      const res = await runGenerateThumbnailAction({ videoTitle, targetFormat: "1280x720" });
      if (res.success) {
        setThumbnailDesign(res.design);
        toast.success("Diseño de miniatura de alto CTR generado.");
      }
    } catch (_) {
      toast.error("Error al diseñar miniatura.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ds-page space-y-8 w-full">
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
        <div>
          <div className="mb-3">
            <span className="ds-badge ds-badge-teal">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
              </span>
              <Sparkles size={10} className="text-teal-400" /> Video Studio Pro · Opus Clip & CapCut AI Grade
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Motor de Edición de Video & Clips Virales por IA
          </h1>
          <p className="ds-subtext mt-1">
            Auto-Clipper 9:16 con Viral Scoring, Subtítulos Cinéticos Hormozi, Corte de Silencios, Audio Ducking, Smart Reframe y Miniaturas Alto CTR.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('clipper')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'clipper'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Scissors className="w-4 h-4 text-teal-400" /> 1. Clipper Viral (OpusClip)
        </button>

        <button
          onClick={() => setActiveTab('subtitles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'subtitles'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Type className="w-4 h-4 text-teal-400" /> 2. Subtítulos Cinéticos
        </button>

        <button
          onClick={() => setActiveTab('silence')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'silence'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 text-teal-400" /> 3. Eliminador de Silencios
        </button>

        <button
          onClick={() => setActiveTab('ducking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ducking'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Volume2 className="w-4 h-4 text-teal-400" /> 4. Auto-Ducking Audio
        </button>

        <button
          onClick={() => setActiveTab('reframe')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'reframe'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Crop className="w-4 h-4 text-teal-400" /> 5. Smart Reframe (9:16)
        </button>

        <button
          onClick={() => setActiveTab('broll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'broll'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-teal-400" /> 6. B-Roll Matcher
        </button>

        <button
          onClick={() => setActiveTab('thumbnail')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'thumbnail'
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md shadow-teal-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-teal-400" /> 7. Miniaturas Alto CTR
        </button>
      </div>

      {/* ── TAB 1: CLIPPER VIRAL ── */}
      {activeTab === 'clipper' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Scissors className="w-5 h-5 text-teal-400" /> Extractor de Clips Virales con Viral Scoring
              </h3>
              <p className="text-xs text-slate-400">Analiza ganchos narrativos y energía vocal para extraer los mejores shorts 9:16.</p>
            </div>

            <button
              onClick={handleRunAutoClip}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Extraer Clips con IA
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {viralClips.map(clip => (
              <div key={clip.clipId} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded bg-pink-950 text-pink-400 text-xs font-mono font-bold border border-pink-800/40">
                    Viral Score: {clip.viralityScore}/100
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Duración: {clip.durationSec.toFixed(1)}s
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{clip.title}</h4>
                  <p className="text-xs text-amber-300 font-mono mt-1">🎯 Gancho: "{clip.hookHeadline}"</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-mono text-slate-500">
                  <span>Plataforma: {clip.recommendedPlatform}</span>
                  <span className="text-teal-400 font-bold">Formato 9:16</span>
                </div>
              </div>
            ))}

            {viralClips.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 font-mono text-xs">
                &gt; Haz clic en "Extraer Clips con IA" para procesar el video y generar los shorts automáticamente._
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: KINETIC SUBTITLES ── */}
      {activeTab === 'subtitles' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Type className="w-5 h-5 text-teal-400" /> Subtítulos Cinéticos Animados (Estilo Alex Hormozi)
              </h3>
              <p className="text-xs text-slate-400">Resaltado palabra por palabra con colores neón e inserción automática de emojis contextuales.</p>
            </div>

            <button
              onClick={handleRunKineticSubtitles}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Generar Subtítulos Cinéticos
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase block mb-1">Transcripción del Video:</label>
              <textarea
                rows={3}
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subtitleBlocks.map((b, idx) => (
                <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{b.startSec.toFixed(1)}s - {b.endSec.toFixed(1)}s</span>
                    {b.emoji && <span className="text-base">{b.emoji}</span>}
                  </div>
                  <p className="text-amber-300 font-bold text-sm font-sans tracking-wide">
                    {b.text.toUpperCase()} {b.emoji}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SILENCE REMOVER ── */}
      {activeTab === 'silence' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-teal-400" /> Eliminador Inteligente de Silencios & Muletillas
              </h3>
              <p className="text-xs text-slate-400">Corta silencios superiores a 500ms con micro-crossfades para un ritmo dinámico.</p>
            </div>

            <button
              onClick={handleRunSilenceRemoval}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Calcular Auto-Cortes
            </button>
          </div>

          {silenceResult && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Duración Original</span>
                <span className="text-xl font-bold text-white mt-1">{silenceResult.originalDurationSec}s</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Duración Optimizada</span>
                <span className="text-xl font-bold text-emerald-400 mt-1">{silenceResult.finalDurationSec}s</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Tiempo Ahorrado</span>
                <span className="text-xl font-bold text-teal-400 mt-1">-{silenceResult.savedDurationSec}s ({silenceResult.cutCount} cortes)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: AUDIO DUCKING ── */}
      {activeTab === 'ducking' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-teal-400" /> Auto-Ducking Espectral de Audio
              </h3>
              <p className="text-xs text-slate-400">Atenúa automáticamente la música de fondo a -18dB cuando el locutor habla.</p>
            </div>

            <button
              onClick={handleRunAudioDucking}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Aplicar Curva de Ducking
            </button>
          </div>

          {duckingResult && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
              <span className="text-teal-400 font-bold">Filtro FFmpeg Generado:</span>
              <p className="text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 break-all text-[11px]">
                {duckingResult.ffmpegAevalFilter}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: SMART REFRAME ── */}
      {activeTab === 'reframe' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Crop className="w-5 h-5 text-teal-400" /> Re-encuadre Inteligente 16:9 a 9:16 con Face Tracking
              </h3>
              <p className="text-xs text-slate-400">Centra automáticamente al orador principal en videos verticales.</p>
            </div>

            <button
              onClick={handleRunSmartReframe}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Calcular Crop 9:16
            </button>
          </div>

          {reframeResult && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
              <span className="text-teal-400 font-bold">Dimensiones Finales: {reframeResult.targetResolution}</span>
              <p className="text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 break-all text-[11px]">
                {reframeResult.ffmpegCropFilter}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 6: B-ROLL MATCHER ── */}
      {activeTab === 'broll' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-400" /> Inserción Automática de B-Rolls Contextuales
              </h3>
              <p className="text-xs text-slate-400">Busca en la Bóveda Media clips de apoyo sincronizados con la voz.</p>
            </div>

            <button
              onClick={handleRunBrollMatching}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Emparejar B-Rolls
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {brollResult.map((b, i) => (
              <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-teal-400 font-bold block">Segundo {b.timestampSec}s</span>
                <p className="text-white font-bold font-sans">{b.matchedAssetTitle}</p>
                <span className="text-slate-500 text-[10px]">Confianza: {b.confidenceScore}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 7: THUMBNAIL GENERATOR ── */}
      {activeTab === 'thumbnail' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-400" /> Generador de Miniaturas de Alto CTR
              </h3>
              <p className="text-xs text-slate-400">Detecta el fotograma de mayor emoción y aplica titulares de alto contraste.</p>
            </div>

            <button
              onClick={handleRunGenerateThumbnail}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Diseñar Miniatura
            </button>
          </div>

          {thumbnailDesign && (
            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-amber-400 font-bold text-sm">{thumbnailDesign.badgeTag}</span>
                <span className="text-emerald-400">Calidad: {thumbnailDesign.overallFrameQuality}%</span>
              </div>

              <div className="p-8 bg-slate-900 rounded-xl border border-slate-800 text-center space-y-2">
                <span className="text-2xl font-black text-amber-300 font-sans tracking-wide">
                  {thumbnailDesign.punchyHeadline}
                </span>
                <p className="text-slate-500 text-[11px]">Fotograma Seleccionado: {thumbnailDesign.chosenTimestampSec}s</p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-[10px] text-slate-400 break-all">
                Comando FFmpeg: {thumbnailDesign.ffmpegThumbnailCommand}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
