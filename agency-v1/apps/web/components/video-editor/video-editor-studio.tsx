'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Settings, Film, ListTodo, Zap, Palette, Volume2, Type,
  CheckCircle, Download, Save, FolderOpen, Loader2, Sparkles,
  Menu, X, ChevronDown
} from 'lucide-react';
import { ProjectConfigPanel } from './project-config-panel';
import { FootageAnalyzer } from './footage-analyzer';
import { TimelineGenerator } from './timeline-generator';
import { SpeedRampingPanel } from './speed-ramping-panel';
import { ColorGradingPanel } from './color-grading-panel';
import { AudioMixer } from './audio-mixer';
import { TextOverlaysEditor } from './text-overlays-editor';
import { QualityChecklist } from './quality-checklist';
import { ExportPanel } from './export-panel';
import { ProjectProgressBar } from './project-progress-bar';
import { AISuggestionsPanel } from './ai-suggestions-panel';
import { useSession } from 'next-auth/react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { HybridEditorPanel } from './hybrid-editor';
import { VideoPreviewer } from './video-previewer';
import { TimelineEditor } from './timeline-editor';
import { AutoCaptionPanel } from './auto-caption';
import { ColorMatchPanel } from './color-match';
import type {
  ProjectConfig, Clip, AudioTrack, TextOverlay,
  ColorGrade, SpeedRamp, Timeline, ClipAnalysis, RenderOutput
} from '@/actions/video-editor';
import { 
  createVideoProject, 
  getVideoProject, 
  updateVideoProject, 
  recordUserCorrection,
  generateAutoCaptions,
  translateCaptions,
  getColorMatchSuggestions
} from '@/actions/video-editor';
import { toast } from 'sonner';

const PANELS = [
  { id: 1, icon: Settings, label: 'Config', color: 'text-slate-400' },
  { id: 2, icon: Film, label: 'Footage', color: 'text-blue-400' },
  { id: 3, icon: ListTodo, label: 'Timeline', color: 'text-teal-400' },
  { id: 4, icon: Zap, label: 'Speed', color: 'text-amber-400' },
  { id: 5, icon: Volume2, label: 'Audio', color: 'text-green-400' },
  { id: 6, icon: Type, label: 'Texto', color: 'text-pink-400' },
  { id: 7, icon: Palette, label: 'Color', color: 'text-purple-400' },
  { id: 8, icon: CheckCircle, label: 'Calidad', color: 'text-emerald-400' },
  { id: 9, icon: Download, label: 'Exportar', color: 'text-orange-400' },
] as const;

interface VideoEditorStudioProps {
  projectId?: string;
  onSave?: (data: any) => void;
}

export function VideoEditorStudio({ projectId, onSave }: VideoEditorStudioProps) {
  const { data: session } = useSession();
  const [sessionId] = useState(() => `sess_${Math.random().toString(36).substring(2, 15)}`);

  const [activePanel, setActivePanel] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [config, setConfig] = useState<Partial<ProjectConfig>>({});
  const [clips, setClips] = useState<Clip[]>([]);
  const [analysis, setAnalysis] = useState<Map<string, ClipAnalysis>>(new Map());
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [speedRamps, setSpeedRamps] = useState<SpeedRamp[]>([]);
  const [colorGrades, setColorGrades] = useState<ColorGrade[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [qualityPassed, setQualityPassed] = useState(false);
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveAnimation, setSaveAnimation] = useState(false);
  const hasChanges = useRef(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const [captions, setCaptions] = useState<any[]>([]);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [colorMatchSuggestions, setColorMatchSuggestions] = useState<any[]>([]);
  const [isAnalyzingColor, setIsAnalyzingColor] = useState(false);

  const handleGenerateCaptions = async (lang: string) => {
    setIsGeneratingCaptions(true);
    try {
      const generated = await generateAutoCaptions(projectId || 'demo', lang);
      setCaptions(generated);
      
      const overlaysFromCaptions = generated.map((seg: any) => ({
        id: seg.id,
        text: seg.text,
        position: 'bottom' as const,
        animation: 'none' as const,
        font: 'Inter',
        color: '#FFFFFF',
        safeZone: true,
        duration: seg.endTime - seg.startTime,
        startTime: seg.startTime,
      }));
      const otherOverlays = textOverlays.filter(o => !o.id.startsWith('seg_'));
      setTextOverlays([...otherOverlays, ...overlaysFromCaptions]);
      toast.success('Subtítulos generados con éxito');
    } catch {
      toast.error('Error al generar subtítulos');
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  const handleTranslateCaptions = async (lang: string) => {
    setIsGeneratingCaptions(true);
    try {
      const translated = await translateCaptions(captions, lang);
      setCaptions(translated);
      
      const updatedOverlays = textOverlays.map(o => {
        if (o.id.startsWith('seg_')) {
          const match = translated.find(t => t.id === o.id);
          if (match) return { ...o, text: match.text };
        }
        return o;
      });
      setTextOverlays(updatedOverlays);
      toast.success(`Subtítulos traducidos al ${lang}`);
    } catch {
      toast.error('Error al traducir subtítulos');
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  const handleUpdateCaption = (segmentId: string, text: string) => {
    const updatedCaptions = captions.map(c => c.id === segmentId ? { ...c, text } : c);
    setCaptions(updatedCaptions);

    const updatedOverlays = textOverlays.map(o => o.id === segmentId ? { ...o, text } : o);
    setTextOverlays(updatedOverlays);
  };

  const handleExportCaptions = (format: 'srt' | 'vtt' | 'ass') => {
    const text = captions.map((c, i) => `${i+1}\n00:00:${c.startTime.toFixed(2)} --> 00:00:${c.endTime.toFixed(2)}\n${c.text}\n`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subtitles.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exportado como ${format.toUpperCase()}`);
  };

  const handleAnalyzeColor = async () => {
    setIsAnalyzingColor(true);
    try {
      const suggestions = await getColorMatchSuggestions(clips);
      setColorMatchSuggestions(suggestions);
      toast.success('Análisis de color completado');
    } catch {
      toast.error('Error al analizar color');
    } finally {
      setIsAnalyzingColor(false);
    }
  };

  const handleApplyColorSuggestion = (suggestionId: string) => {
    const suggestion = colorMatchSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    const updatedGrades = [...colorGrades];
    const targetGradeIndex = updatedGrades.findIndex(g => g.clipId === suggestion.targetClip);

    const newGrade: ColorGrade = {
      clipId: suggestion.targetClip,
      style: 'cinematic',
      lut: 'Film-EM',
      temperature: 5600 + (suggestion.adjustments.temperature || 0),
      contrast: suggestion.adjustments.contrast || 1.2,
      highlights: suggestion.adjustments.highlights || -10,
      shadows: suggestion.adjustments.shadows || 15,
      saturation: suggestion.adjustments.saturation || 0.9,
      tint: suggestion.adjustments.tint || 5,
      midtones: 5,
    };

    if (targetGradeIndex > -1) {
      updatedGrades[targetGradeIndex] = newGrade;
    } else {
      updatedGrades.push(newGrade);
    }

    setColorGrades(updatedGrades);
    toast.success('Ajustes de color aplicados');
  };

  const handleRejectColorSuggestion = (suggestionId: string) => {
    setColorMatchSuggestions(colorMatchSuggestions.filter(s => s.id !== suggestionId));
    toast.info('Sugerencia rechazada');
  };

  const handlePreviewColorSuggestion = (suggestionId: string) => {
    toast.info('Previsualizando ajuste de color...');
  };

  // Zustand Store variables and sync handlers
  const storeConfig = useEditorStore((s) => s.config);
  const setStoreConfig = useEditorStore((s) => s.setConfig);
  const storeClips = useEditorStore((s) => s.clips);
  const setStoreClips = useEditorStore((s) => s.setClips);
  const storeAudioTracks = useEditorStore((s) => s.audioTracks);
  const setStoreAudioTracks = useEditorStore((s) => s.setAudioTracks);
  const storeTextOverlays = useEditorStore((s) => s.textOverlays);
  const setStoreTextOverlays = useEditorStore((s) => s.setTextOverlays);
  const storeColorGrades = useEditorStore((s) => s.colorGrades);
  const setStoreColorGrades = useEditorStore((s) => s.setColorGrades);
  const storeSpeedRamps = useEditorStore((s) => s.speedRamps);
  const setStoreSpeedRamps = useEditorStore((s) => s.setSpeedRamps);
  const storeTimeline = useEditorStore((s) => s.timeline);
  const setStoreTimeline = useEditorStore((s) => s.setTimeline);
  const setStoreProjectId = useEditorStore((s) => s.setProjectId);
  const setStoreSessionId = useEditorStore((s) => s.setSessionId);
  const playheadPosition = useEditorStore((s) => s.playheadPosition);
  const setPlayheadPosition = useEditorStore((s) => s.setPlayheadPosition);

  // Sync projectId and sessionId
  useEffect(() => {
    if (projectId) {
      setStoreProjectId(projectId);
    }
    setStoreSessionId(sessionId);
  }, [projectId, sessionId, setStoreProjectId, setStoreSessionId]);

  // Sync config
  useEffect(() => {
    if (JSON.stringify(config) !== JSON.stringify(storeConfig)) {
      setStoreConfig(config);
    }
  }, [config, storeConfig, setStoreConfig]);

  useEffect(() => {
    if (JSON.stringify(storeConfig) !== JSON.stringify(config)) {
      setConfig(storeConfig || {});
    }
  }, [storeConfig, config]);

  // Sync clips
  useEffect(() => {
    if (JSON.stringify(clips) !== JSON.stringify(storeClips)) {
      setStoreClips(clips);
    }
  }, [clips, storeClips, setStoreClips]);

  useEffect(() => {
    if (JSON.stringify(storeClips) !== JSON.stringify(clips)) {
      setClips(storeClips || []);
    }
  }, [storeClips, clips]);

  // Sync audioTracks
  useEffect(() => {
    if (JSON.stringify(audioTracks) !== JSON.stringify(storeAudioTracks)) {
      setStoreAudioTracks(audioTracks);
    }
  }, [audioTracks, storeAudioTracks, setStoreAudioTracks]);

  useEffect(() => {
    if (JSON.stringify(storeAudioTracks) !== JSON.stringify(audioTracks)) {
      setAudioTracks(storeAudioTracks || []);
    }
  }, [storeAudioTracks, audioTracks]);

  // Sync textOverlays
  useEffect(() => {
    if (JSON.stringify(textOverlays) !== JSON.stringify(storeTextOverlays)) {
      setStoreTextOverlays(textOverlays);
    }
  }, [textOverlays, storeTextOverlays, setStoreTextOverlays]);

  useEffect(() => {
    if (JSON.stringify(storeTextOverlays) !== JSON.stringify(textOverlays)) {
      setTextOverlays(storeTextOverlays || []);
    }
  }, [storeTextOverlays, textOverlays]);

  // Sync colorGrades
  useEffect(() => {
    if (JSON.stringify(colorGrades) !== JSON.stringify(storeColorGrades)) {
      setStoreColorGrades(colorGrades);
    }
  }, [colorGrades, storeColorGrades, setStoreColorGrades]);

  useEffect(() => {
    if (JSON.stringify(storeColorGrades) !== JSON.stringify(colorGrades)) {
      setColorGrades(storeColorGrades || []);
    }
  }, [storeColorGrades, colorGrades]);

  // Sync speedRamps
  useEffect(() => {
    if (JSON.stringify(speedRamps) !== JSON.stringify(storeSpeedRamps)) {
      setStoreSpeedRamps(speedRamps);
    }
  }, [speedRamps, storeSpeedRamps, setStoreSpeedRamps]);

  useEffect(() => {
    if (JSON.stringify(storeSpeedRamps) !== JSON.stringify(speedRamps)) {
      setSpeedRamps(storeSpeedRamps || []);
    }
  }, [storeSpeedRamps, speedRamps]);

  // Sync timeline
  useEffect(() => {
    if (JSON.stringify(timeline) !== JSON.stringify(storeTimeline)) {
      setStoreTimeline(timeline);
    }
  }, [timeline, storeTimeline, setStoreTimeline]);

  useEffect(() => {
    if (JSON.stringify(storeTimeline) !== JSON.stringify(timeline)) {
      setTimeline(storeTimeline || null);
    }
  }, [storeTimeline, timeline]);

  // Map clips, audioTracks, and textOverlays into TimelineClip models for interactive TimelineEditor
  const timelineClips = [
    ...clips.map((c) => ({
      id: c.id,
      type: 'video' as const,
      name: c.name || `Clip ${c.id.substring(0, 4)}`,
      startTime: c.startTime || 0,
      duration: c.duration || 5,
      color: 'teal',
    })),
    ...audioTracks.map((t) => ({
      id: t.id || `audio-${Math.random()}`,
      type: 'audio' as const,
      name: t.name || `Audio ${(t.id || '').substring(0, 4)}`,
      startTime: t.startTime || 0,
      duration: t.duration || 5,
      color: 'purple',
      muted: t.muted,
    })),
    ...textOverlays.map((o) => ({
      id: o.id,
      type: 'text' as const,
      name: o.text || `Texto ${o.id.substring(0, 4)}`,
      startTime: o.startTime || 0,
      duration: o.duration || 3,
      color: 'amber',
    })),
  ];

  const calculatedDuration = Math.max(
    15, // minimum duration
    timeline?.totalDuration || 0,
    ...clips.map((c) => (c.startTime || 0) + (c.duration || 5)),
    ...audioTracks.map((t) => (t.startTime || 0) + (t.duration || 5)),
    ...textOverlays.map((o) => (o.startTime || 0) + (o.duration || 3))
  );

  const handleTimelineClipsChange = (updatedTimelineClips: any[]) => {
    // Record corrections for modified clips
    updatedTimelineClips.forEach(tc => {
      if (tc.type === 'video') {
        const original = clips.find(c => c.id === tc.id);
        if (original && original.startTime !== tc.startTime) {
          recordUserCorrection('cut', original, { ...original, startTime: tc.startTime }).catch(console.error);
        }
      } else if (tc.type === 'audio') {
        const original = audioTracks.find(a => a.id === tc.id);
        if (original && original.startTime !== tc.startTime) {
          recordUserCorrection('audio', original, { ...original, startTime: tc.startTime }).catch(console.error);
        }
      } else if (tc.type === 'text') {
        const original = textOverlays.find(o => o.id === tc.id);
        if (original && original.startTime !== tc.startTime) {
          recordUserCorrection('text', original, { ...original, startTime: tc.startTime }).catch(console.error);
        }
      }
    });

    // Update clips
    const updatedClips = clips.map(c => {
      const match = updatedTimelineClips.find(tc => tc.id === c.id && tc.type === 'video');
      return match ? { ...c, startTime: match.startTime } : c;
    });
    setClips(updatedClips);

    // Update audioTracks
    const updatedAudio = audioTracks.map(a => {
      const match = updatedTimelineClips.find(tc => tc.id === a.id && tc.type === 'audio');
      return match ? { ...a, startTime: match.startTime } : a;
    });
    setAudioTracks(updatedAudio);

    // Update textOverlays
    const updatedText = textOverlays.map(t => {
      const match = updatedTimelineClips.find(tc => tc.id === t.id && tc.type === 'text');
      return match ? { ...t, startTime: match.startTime } : t;
    });
    setTextOverlays(updatedText);
  };

  // Marcar cambios cuando cambia el estado
  useEffect(() => { hasChanges.current = true; }, [config, clips, audioTracks, textOverlays, colorGrades, speedRamps, timeline]);

  // Auto-guardado cada 30 segundos si hay cambios y hay projectId
  useEffect(() => {
    if (!projectId) return;
    autoSaveTimer.current = setInterval(() => {
      if (hasChanges.current) {
        hasChanges.current = false;
        handleSave();
      }
    }, 30_000);
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Hotkeys: Ctrl+S = guardar, ← → = navegar paneles
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'ArrowRight' && e.altKey) {
        e.preventDefault();
        setActivePanel(p => Math.min(PANELS.length, p + 1));
      }
      if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault();
        setActivePanel(p => Math.max(1, p - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    getVideoProject(projectId)
      .then(project => {
        if (!project) return;
        setConfig(project.config as Partial<ProjectConfig>);
        setClips((project.clips as Clip[]) || []);
        setAudioTracks((project.audioTracks as AudioTrack[]) || []);
        setTextOverlays((project.textOverlays as TextOverlay[]) || []);
        setColorGrades((project.colorGrades as ColorGrade[]) || []);
        setSpeedRamps((project.speedRamps as SpeedRamp[]) || []);
        setTimeline((project.timeline as Timeline) || null);
        if (project.qualityCheck) {
          setQualityPassed(project.qualityCheck.passed);
          setQualityIssues(project.qualityCheck.issues || []);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [projectId]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveAnimation(true);
    try {
      const projectData = {
        name: config.name || 'Untitled',
        config,
        clips,
        audioTracks,
        textOverlays,
        colorGrades,
        speedRamps,
        timeline,
        qualityCheck: { passed: qualityPassed, issues: qualityIssues },
      };
      if (projectId) {
        await updateVideoProject(projectId, projectData as any);
      } else if (onSave) {
        onSave(projectData as any);
      } else {
        await createVideoProject(projectData as any);
      }
      toast.success('Proyecto guardado correctamente');
    } catch {
      toast.error('Error al guardar el proyecto');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveAnimation(false), 1500);
    }
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 1: return <ProjectConfigPanel config={config} onChange={setConfig} />;
      case 2: return <FootageAnalyzer clips={clips} analysis={analysis} onClipsChange={setClips} onAnalysisComplete={setAnalysis} />;
      case 3: return <TimelineGenerator clips={clips} config={config as ProjectConfig} timeline={timeline} projectId={projectId} onTimelineGenerated={setTimeline} />;
      case 4: return <SpeedRampingPanel clips={clips} speedRamps={speedRamps} onSpeedRampsChange={setSpeedRamps} />;
      case 5: return <AudioMixer audioTracks={audioTracks} onAudioTracksChange={setAudioTracks} />;
      case 6: return (
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid grid-cols-2 bg-slate-900 border border-slate-800 mb-4 p-1 rounded-lg">
            <TabsTrigger value="manual" className="text-xs">Edición Manual</TabsTrigger>
            <TabsTrigger value="auto" className="text-xs">Subtítulos IA</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="mt-0">
            <TextOverlaysEditor textOverlays={textOverlays} onTextOverlaysChange={setTextOverlays} format={config.format} platform={config.platform} />
          </TabsContent>
          <TabsContent value="auto" className="mt-0">
            <AutoCaptionPanel
              captions={captions}
              onGenerate={handleGenerateCaptions}
              onTranslate={handleTranslateCaptions}
              onUpdate={handleUpdateCaption}
              onExport={handleExportCaptions}
              isGenerating={isGeneratingCaptions}
            />
          </TabsContent>
        </Tabs>
      );
      case 7: return (
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid grid-cols-2 bg-slate-900 border border-slate-800 mb-4 p-1 rounded-lg">
            <TabsTrigger value="manual" className="text-xs">Grading Manual</TabsTrigger>
            <TabsTrigger value="match" className="text-xs">Color Match IA</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="mt-0">
            <ColorGradingPanel clips={clips} colorGrades={colorGrades} onColorGradesChange={setColorGrades} />
          </TabsContent>
          <TabsContent value="match" className="mt-0">
            <ColorMatchPanel
              suggestions={colorMatchSuggestions}
              onApply={handleApplyColorSuggestion}
              onReject={handleRejectColorSuggestion}
              onAnalyze={handleAnalyzeColor}
              onPreview={handlePreviewColorSuggestion}
              isAnalyzing={isAnalyzingColor}
            />
          </TabsContent>
        </Tabs>
      );
      case 8: return (
        <QualityChecklist
          timeline={timeline} colorGrades={colorGrades} audioTracks={audioTracks}
          config={config as ProjectConfig}
          onCheckComplete={(passed, issues) => { setQualityPassed(passed); setQualityIssues(issues); }}
        />
      );
      case 9: return (
        <ExportPanel
          config={config as ProjectConfig} timeline={timeline} qualityPassed={qualityPassed}
          projectId={projectId}
          onExport={(outputs) => console.log('Exported:', outputs)}
        />
      );
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-teal-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
            <Film className="absolute inset-4 w-8 h-8 text-teal-400" />
          </div>
          <p className="text-slate-400 text-sm">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  const currentPanel = PANELS.find(p => p.id === activePanel);

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* ===== TOP TOOLBAR ===== */}
      <header className="shrink-0 bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center gap-3 z-20">
        {/* Logo / Title */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-teal-500 to-cyan-600 flex items-center justify-center shrink-0">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">
              {config.name || 'Nuevo Proyecto'}
            </h1>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Video Studio</p>
          </div>
        </div>

        {/* Platform badge */}
        {config.platform && (
          <Badge className="bg-teal-500/15 text-teal-400 border-teal-500/30 text-[10px]">
            {config.platform}
          </Badge>
        )}
        {config.format && (
          <Badge className="bg-slate-700 text-slate-300 text-[10px]">
            {config.format?.toUpperCase()}
          </Badge>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white text-xs h-8 px-3"
          >
            <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
            Cargar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className={cn(
              'h-8 px-3 text-xs transition-all duration-300',
              saveAnimation
                ? 'bg-emerald-600 hover:bg-emerald-600'
                : 'bg-teal-600 hover:bg-teal-700'
            )}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : saveAnimation ? (
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {saveAnimation ? 'Guardado' : isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </header>

      {/* ===== PROGRESS BAR ===== */}
      <ProjectProgressBar
        config={config}
        clips={clips}
        timeline={timeline}
        colorGrades={colorGrades}
        audioTracks={audioTracks}
        textOverlays={textOverlays}
        qualityPassed={qualityPassed}
      />

      {/* ===== MAIN LAYOUT ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ===== SIDEBAR ===== */}
        <aside className={cn(
          'shrink-0 bg-slate-900/80 border-r border-slate-800 flex flex-col transition-all duration-300 overflow-hidden',
          sidebarOpen ? 'w-52' : 'w-14'
        )}>
          {/* Panel navigation */}
          <nav className="flex-1 py-2 space-y-0.5 px-1.5">
            {PANELS.map(panel => {
              const Icon = panel.icon;
              const isActive = activePanel === panel.id;

              // Compute completion status
              let isDone = false;
              if (panel.id === 1) isDone = !!(config.name && config.type);
              if (panel.id === 2) isDone = clips.length > 0;
              if (panel.id === 3) isDone = !!timeline;
              if (panel.id === 5) isDone = audioTracks.length > 0;
              if (panel.id === 6) isDone = textOverlays.length > 0;
              if (panel.id === 7) isDone = colorGrades.length > 0;
              if (panel.id === 8) isDone = qualityPassed;

              return (
                <button
                  key={panel.id}
                  onClick={() => setActivePanel(panel.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-left transition-all duration-150 group relative',
                    isActive
                      ? 'bg-teal-600/20 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-teal-400 rounded-r" />
                  )}

                  <div className="relative shrink-0">
                    <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-teal-400' : panel.color)} />
                    {isDone && !isActive && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                    )}
                  </div>

                  {sidebarOpen && (
                    <span className={cn('text-sm font-medium truncate', isActive && 'text-white')}>
                      {panel.label}
                    </span>
                  )}

                  {/* Tooltip on collapsed */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      {panel.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          {sidebarOpen && (
            <div className="p-3 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>IA activa</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-auto" />
              </div>
            </div>
          )}
        </aside>

        {/* ===== CANVAS & VIEWPORT & TIMELINE ===== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Half: active panel and video previewer */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left: Active Panel */}
            <div className="flex-1 flex flex-col overflow-y-auto border-r border-slate-800/60">
              {/* Panel header */}
              <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/60 px-6 py-3 flex items-center gap-3 shrink-0">
                {currentPanel && (
                  <>
                    <currentPanel.icon className={cn('w-5 h-5', currentPanel.color)} />
                    <h2 className="text-base font-semibold text-white">{currentPanel.label}</h2>
                    <Badge className="bg-slate-800 text-slate-400 text-[10px]">
                      {activePanel}/{PANELS.length}
                    </Badge>
                  </>
                )}
                <div className="flex-1" />
                {/* Mini step navigator */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActivePanel(p => Math.max(1, p - 1))}
                    disabled={activePanel === 1}
                    className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                  </button>
                  <button
                    onClick={() => setActivePanel(p => Math.min(PANELS.length, p + 1))}
                    disabled={activePanel === PANELS.length}
                    className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </button>
                </div>
              </div>

              {/* Panel content */}
              <div className="p-6 flex-1 overflow-y-auto">
                {renderPanel()}
              </div>
            </div>

            {/* Right: Video Viewport */}
            <div className="w-full lg:w-96 shrink-0 border-l border-slate-800 bg-slate-900/30 flex flex-col p-4">
              <VideoPreviewer totalDuration={calculatedDuration} />
            </div>
          </div>

          {/* Bottom Half: Interactive Timeline Editor */}
          <div className="shrink-0 border-t border-slate-800 p-4 bg-slate-950/80">
            <TimelineEditor
              clips={timelineClips}
              totalDuration={calculatedDuration}
              onClipsChange={handleTimelineClipsChange}
              playheadPosition={playheadPosition}
              onPlayheadChange={setPlayheadPosition}
            />
          </div>
        </div>

        {/* ===== AI & HYBRID PANEL SIDEBAR ===== */}
        <div className="shrink-0 w-80 p-3 hidden xl:block border-l border-slate-800 bg-slate-900/40">
          <Tabs defaultValue="suggestions" className="w-full h-full flex flex-col">
            <TabsList className="grid grid-cols-2 bg-slate-950 border border-slate-800/80 mb-3 p-1 rounded-lg">
              <TabsTrigger value="suggestions" className="text-xs data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                Sugerencias IA
              </TabsTrigger>
              <TabsTrigger value="hybrid" className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                Editor Híbrido
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="flex-1 overflow-y-auto mt-0 outline-hidden">
              <AISuggestionsPanel
                projectId={projectId}
                config={config}
                clips={clips}
                timeline={timeline}
                colorGrades={colorGrades}
                audioTracks={audioTracks}
                onNavigate={setActivePanel}
                onClipsChange={setClips}
              />
            </TabsContent>

            <TabsContent value="hybrid" className="flex-1 overflow-y-auto mt-0 outline-hidden">
              <HybridEditorPanel
                projectId={projectId || 'demo'}
                sessionId={sessionId}
                userId={session?.user?.id || 'user'}
                userName={session?.user?.name || 'Usuario'}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
