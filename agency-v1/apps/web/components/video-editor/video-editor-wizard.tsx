'use client';

import { useState } from 'react';
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
  FolderOpen
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
import { createVideoProject } from '@/actions/video-editor';

const STEPS = [
  { id: 1, name: 'Config', icon: Settings, label: 'Configuración' },
  { id: 2, name: 'Footage', icon: Film, label: 'Footage' },
  { id: 3, name: 'Timeline', icon: ListTodo, label: 'Timeline' },
  { id: 4, name: 'Speed', icon: Zap, label: 'Speed Ramp' },
  { id: 5, name: 'Color', icon: Palette, label: 'Color' },
  { id: 6, name: 'Audio', icon: Volume2, label: 'Audio' },
  { id: 7, name: 'Text', icon: Type, label: 'Texto' },
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
      
      if (onSave) {
        onSave(projectData);
      } else {
        await createVideoProject(projectData as ProjectConfig);
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
          <ColorGradingPanel 
            clips={clips}
            colorGrades={colorGrades}
            onColorGradesChange={setColorGrades}
          />
        );
      case 6:
        return (
          <AudioMixer 
            audioTracks={audioTracks}
            onAudioTracksChange={setAudioTracks}
          />
        );
      case 7:
        return (
          <TextOverlaysEditor 
            textOverlays={textOverlays}
            onTextOverlaysChange={setTextOverlays}
            format={config.format}
            platform={config.platform}
          />
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