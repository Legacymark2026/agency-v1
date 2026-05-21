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
import type {
  ProjectConfig, Clip, AudioTrack, TextOverlay,
  ColorGrade, SpeedRamp, Timeline, ClipAnalysis, RenderOutput
} from '@/actions/video-editor';
import { createVideoProject, getVideoProject, updateVideoProject } from '@/actions/video-editor';
import { toast } from 'sonner';

const PANELS = [
  { id: 1, icon: Settings, label: 'Config', color: 'text-slate-400' },
  { id: 2, icon: Film, label: 'Footage', color: 'text-blue-400' },
  { id: 3, icon: ListTodo, label: 'Timeline', color: 'text-teal-400' },
  { id: 4, icon: Zap, label: 'Speed', color: 'text-amber-400' },
  { id: 5, icon: Palette, label: 'Color', color: 'text-purple-400' },
  { id: 6, icon: Volume2, label: 'Audio', color: 'text-green-400' },
  { id: 7, icon: Type, label: 'Texto', color: 'text-pink-400' },
  { id: 8, icon: CheckCircle, label: 'Calidad', color: 'text-emerald-400' },
  { id: 9, icon: Download, label: 'Exportar', color: 'text-orange-400' },
] as const;

interface VideoEditorStudioProps {
  projectId?: string;
  onSave?: (data: any) => void;
}

export function VideoEditorStudio({ projectId, onSave }: VideoEditorStudioProps) {
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
      case 5: return <ColorGradingPanel clips={clips} colorGrades={colorGrades} onColorGradesChange={setColorGrades} />;
      case 6: return <AudioMixer audioTracks={audioTracks} onAudioTracksChange={setAudioTracks} />;
      case 7: return <TextOverlaysEditor textOverlays={textOverlays} onTextOverlaysChange={setTextOverlays} format={config.format} platform={config.platform} />;
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
              if (panel.id === 5) isDone = colorGrades.length > 0;
              if (panel.id === 6) isDone = audioTracks.length > 0;
              if (panel.id === 7) isDone = textOverlays.length > 0;
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

        {/* ===== CANVAS ===== */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main panel content */}
          <div className="flex-1 overflow-y-auto">
            {/* Panel header */}
            <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/60 px-6 py-3 flex items-center gap-3">
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
            <div className="p-6">
              {renderPanel()}
            </div>
          </div>

          {/* ===== AI SUGGESTIONS PANEL ===== */}
          <div className="shrink-0 p-3 hidden xl:block">
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
          </div>
        </div>
      </div>

      {/* ===== BOTTOM TIMELINE STRIP ===== */}
      {timeline && (
        <div className="shrink-0 bg-slate-900 border-t border-slate-800 px-4 py-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[10px] text-slate-500 shrink-0 mr-2">TIMELINE</span>
            {(['hook', 'body', 'climax', 'outro'] as const).map(seg => {
              const segment = timeline.segments[seg];
              if (!segment) return null;
              const widthPercent = Math.round((segment.duration / timeline.totalDuration) * 100);

              const colors: Record<string, string> = {
                hook: 'bg-amber-500',
                body: 'bg-teal-500',
                climax: 'bg-purple-500',
                outro: 'bg-slate-600',
              };

              return (
                <button
                  key={seg}
                  onClick={() => setActivePanel(3)}
                  className={cn(
                    'h-7 rounded flex items-center justify-center text-[9px] font-bold text-white uppercase tracking-wider shrink-0 hover:brightness-110 transition-all',
                    colors[seg]
                  )}
                  style={{ width: `${Math.max(widthPercent, 6)}%`, minWidth: 40 }}
                  title={`${seg}: ${segment.duration}s`}
                >
                  {seg}
                </button>
              );
            })}
            <span className="text-[10px] text-slate-500 shrink-0 ml-2">
              {timeline.totalDuration.toFixed(0)}s · {timeline.cuts} cortes
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
