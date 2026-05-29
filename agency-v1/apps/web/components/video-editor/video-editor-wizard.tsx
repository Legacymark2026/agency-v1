'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Film, 
  ListTodo, 
  Zap, 
  Palette, 
  Volume2, 
  Type, 
  CheckCircle, 
  Download,
  ChevronLeft,
  ChevronRight,
  Save,
  FolderOpen,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectConfigPanel } from './project-config-panel';
import { FootageAnalyzer } from './footage-analyzer';
import { TimelineGenerator } from './timeline-generator';
import { SpeedRampingPanel } from './speed-ramping-panel';
import { ColorGradingPanel } from './color-grading-panel';
import { AudioMixer } from './audio-mixer';
import { TextOverlaysEditor } from './text-overlays-editor';
import { QualityChecklist } from './quality-checklist';
import { ExportPanel } from './export-panel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AutoCaptionPanel } from './auto-caption';
import { ColorMatchPanel } from './color-match';
import type { 
  ProjectConfig, 
  Clip, 
  AudioTrack, 
  TextOverlay, 
  ColorGrade, 
  SpeedRamp, 
  Timeline,
  ClipAnalysis,
  RenderOutput
} from '@/actions/video-editor';
import { 
  createVideoProject, 
  getVideoProject, 
  updateVideoProject,
  generateAutoCaptions,
  translateCaptions,
  getColorMatchSuggestions
} from '@/actions/video-editor';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, name: 'Config', icon: Settings, label: 'Configuración' },
  { id: 2, name: 'Footage', icon: Film, label: 'Footage' },
  { id: 3, name: 'Timeline', icon: ListTodo, label: 'Timeline' },
  { id: 4, name: 'Speed', icon: Zap, label: 'Speed Ramp' },
  { id: 5, name: 'Audio', icon: Volume2, label: 'Audio' },
  { id: 6, name: 'Text', icon: Type, label: 'Texto' },
  { id: 7, name: 'Color', icon: Palette, label: 'Color' },
  { id: 8, name: 'Quality', icon: CheckCircle, label: 'Calidad' },
  { id: 9, name: 'Export', icon: Download, label: 'Exportar' },
] as const;

interface VideoEditorWizardProps {
  projectId?: string;
  onSave?: (data: any) => void;
}

export function VideoEditorWizard({ projectId, onSave }: VideoEditorWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
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

  // Load project if projectId is provided
  useEffect(() => {
    if (projectId) {
      setIsLoading(true);
      getVideoProject(projectId)
        .then(project => {
          if (project) {
            setConfig(project.config as Partial<ProjectConfig>);
            setClips(project.clips as Clip[] || []);
            setAudioTracks(project.audioTracks as AudioTrack[] || []);
            setTextOverlays(project.textOverlays as TextOverlay[] || []);
            setColorGrades(project.colorGrades as ColorGrade[] || []);
            setSpeedRamps(project.speedRamps as SpeedRamp[] || []);
            setTimeline(project.timeline as Timeline || null);
            if (project.qualityCheck) {
              setQualityPassed(project.qualityCheck.passed);
              setQualityIssues(project.qualityCheck.issues || []);
            }
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [projectId]);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!config.name && !!config.type && !!config.format;
      case 2: return clips.length > 0;
      case 3: return !!timeline;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      case 7: return true;
      case 8: return qualityPassed;
      case 9: return true;
      default: return true;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
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
        qualityCheck: { passed: qualityPassed, issues: qualityIssues }
      };
      
      if (projectId) {
        // Update existing project
        await updateVideoProject(projectId, projectData as any);
      } else if (onSave) {
        onSave(projectData as any);
      } else {
        await createVideoProject(projectData as any);
      }
      alert('Proyecto guardado correctamente');
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error al guardar el proyecto');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ProjectConfigPanel config={config} onChange={setConfig} />;
      case 2:
        return (
          <FootageAnalyzer 
            clips={clips} 
            analysis={analysis}
            onClipsChange={setClips}
            onAnalysisComplete={setAnalysis}
          />
        );
      case 3:
        return (
          <TimelineGenerator 
            clips={clips}
            config={config as ProjectConfig}
            timeline={timeline}
            onTimelineGenerated={setTimeline}
          />
        );
      case 4:
        return (
          <SpeedRampingPanel 
            clips={clips}
            speedRamps={speedRamps}
            onSpeedRampsChange={setSpeedRamps}
          />
        );
      case 5:
        return (
          <AudioMixer 
            audioTracks={audioTracks}
            onAudioTracksChange={setAudioTracks}
          />
        );
      case 6:
        return (
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid grid-cols-2 bg-slate-900 border border-slate-800 mb-4 p-1 rounded-lg">
              <TabsTrigger value="manual" className="text-xs">Edición Manual</TabsTrigger>
              <TabsTrigger value="auto" className="text-xs">Subtítulos IA</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="mt-0">
              <TextOverlaysEditor 
                textOverlays={textOverlays}
                onTextOverlaysChange={setTextOverlays}
                format={config.format}
                platform={config.platform}
              />
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
      case 7:
        return (
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid grid-cols-2 bg-slate-900 border border-slate-800 mb-4 p-1 rounded-lg">
              <TabsTrigger value="manual" className="text-xs">Grading Manual</TabsTrigger>
              <TabsTrigger value="match" className="text-xs">Color Match IA</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="mt-0">
              <ColorGradingPanel 
                clips={clips}
                colorGrades={colorGrades}
                onColorGradesChange={setColorGrades}
              />
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
      case 8:
        return (
          <QualityChecklist 
            timeline={timeline}
            colorGrades={colorGrades}
            audioTracks={audioTracks}
            config={config as ProjectConfig}
            onCheckComplete={(passed, issues) => {
              setQualityPassed(passed);
              setQualityIssues(issues);
            }}
          />
        );
      case 9:
        return (
          <ExportPanel 
            config={config as ProjectConfig}
            timeline={timeline}
            qualityPassed={qualityPassed}
            onExport={(outputs) => console.log('Exported:', outputs)}
          />
        );
      default:
        return null;
    }
  };

  const currentStepInfo = STEPS.find(s => s.id === currentStep);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Film className="w-8 h-8 text-teal-400" />
            Video Editor
          </h1>
          <p className="text-slate-400 mt-1">Crea videos profesionales con IA</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-700 text-slate-300">
            <FolderOpen className="w-4 h-4 mr-2" />
            Cargar Proyecto
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  currentStep === step.id
                    ? "bg-teal-600 text-white"
                    : currentStep > step.id
                    ? "bg-emerald-600/20 text-emerald-400"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                {currentStep > step.id ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
                <span className="hidden md:inline text-sm font-medium">{step.label}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-1",
                  currentStep > step.id ? "bg-emerald-600" : "bg-slate-700"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Title */}
      <div className="text-center mb-6">
        <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">
          Paso {currentStep} de {STEPS.length}
        </Badge>
        <h2 className="text-2xl font-bold mt-2">{currentStepInfo?.label}</h2>
      </div>

      {/* Main Content */}
      <Card className="bg-slate-900/50 border-slate-800 max-w-4xl mx-auto">
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between max-w-4xl mx-auto mt-6">
        <Button
          onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
          disabled={currentStep === 1}
          variant="outline"
          className="border-slate-700 text-slate-300"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <div className="flex items-center gap-2">
          {STEPS.map(s => (
            <div 
              key={s.id}
              className={cn(
                "w-2 h-2 rounded-full",
                s.id === currentStep ? "bg-teal-400" :
                s.id < currentStep ? "bg-emerald-500" : "bg-slate-700"
              )}
            />
          ))}
        </div>

        {currentStep < STEPS.length ? (
          <Button
            onClick={() => setCurrentStep(s => Math.min(STEPS.length, s + 1))}
            disabled={!canProceed()}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Finalizar
          </Button>
        )}
      </div>
    </div>
  );
}