'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Film, Trash2, Zap, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Clip, ClipAnalysis } from '@/actions/video-editor';

interface FootageAnalyzerProps {
  clips: Clip[];
  analysis: Map<string, ClipAnalysis>;
  onClipsChange: (clips: Clip[]) => void;
  onAnalysisComplete: (analysis: Map<string, ClipAnalysis>) => void;
}

const CLIP_TYPES = [
  { value: 'macro', label: 'Macro', desc: 'Close-up detallado' },
  { value: 'close-up', label: 'Close-up', desc: 'Primer plano' },
  { value: 'branding', label: 'Branding', desc: 'Logo/identidad' },
  { value: 'hero', label: 'Hero', desc: 'Shot principal' },
  { value: 'b-roll', label: 'B-Roll', desc: '素材 complementario' },
  { value: 'transition', label: 'Transición', desc: 'Para cortes' },
] as const;

const QUALITIES = [
  { value: 'excellent', label: 'Excellent', color: 'text-emerald-400' },
  { value: 'good', label: 'Good', color: 'text-blue-400' },
  { value: 'fair', label: 'Fair', color: 'text-yellow-400' },
  { value: 'poor', label: 'Poor', color: 'text-red-400' },
] as const;

const FOCUS_OPTIONS = [
  { value: 'sharp', label: 'Sharp', desc: 'Foco nítido' },
  { value: 'soft', label: 'Soft', desc: 'Foco suave/bokeh' },
  { value: 'drifting', label: 'Drifting', desc: 'Foco en movimiento' },
] as const;

const STABILITY_OPTIONS = [
  { value: 'stable', label: 'Stable', desc: 'Sin movimiento' },
  { value: 'slight-jitter', label: 'Slight Jitter', desc: 'Movimiento leve' },
  { value: 'unstable', label: 'Unstable', desc: 'Movimiento excesivo' },
] as const;

const LIGHTING_OPTIONS = [
  { value: 'dramatic', label: 'Dramatic', desc: 'Alto contraste' },
  { value: 'natural', label: 'Natural', desc: 'Luz natural' },
  { value: 'artificial', label: 'Artificial', desc: 'Luz controlada' },
  { value: 'mixed', label: 'Mixed', desc: 'Mezcla de fuentes' },
] as const;

export function FootageAnalyzer({ clips, analysis, onClipsChange, onAnalysisComplete }: FootageAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const addClip = useCallback(() => {
    const newClip: Clip = {
      id: `clip_${Date.now()}`,
      type: 'b-roll',
      duration: Math.floor(Math.random() * 10) + 3,
      resolution: '1920x1080',
      fps: 30,
      quality: 'good',
      focus: 'sharp',
      stability: 'stable',
      lighting: 'natural',
      semanticTags: [],
    };
    onClipsChange([...clips, newClip]);
  }, [clips, onClipsChange]);

  const removeClip = useCallback((clipId: string) => {
    onClipsChange(clips.filter(c => c.id !== clipId));
  }, [clips, onClipsChange]);

  const updateClip = useCallback((clipId: string, updates: Partial<Clip>) => {
    onClipsChange(clips.map(c => c.id === clipId ? { ...c, ...updates } : c));
  }, [clips, onClipsChange]);

  const analyzeClips = useCallback(async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis (in production this would call an API)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockAnalysis = new Map<string, ClipAnalysis>();
    
    clips.forEach(clip => {
      let score = 0;
      if (clip.quality === 'excellent') score += 30;
      else if (clip.quality === 'good') score += 20;
      else if (clip.quality === 'fair') score += 10;

      if (clip.focus === 'sharp') score += 20;
      else if (clip.focus === 'soft') score += 10;

      if (clip.stability === 'stable') score += 20;
      else if (clip.stability === 'slight-jitter') score += 10;

      if (clip.lighting === 'dramatic') score += 15;
      else if (clip.lighting === 'natural') score += 10;

      if (clip.fps >= 60) score += 15;

      score = Math.min(score, 100);

      const heroShot = clip.type === 'hero' || score > 75;
      let intention = clip.type === 'macro' ? 'texture' : 
                      clip.type === 'close-up' ? 'process' : 
                      clip.type === 'branding' ? 'reward' :
                      clip.duration < 5 ? 'hook' : 'general';

      mockAnalysis.set(clip.id, {
        clipId: clip.id,
        score,
        heroShot,
        intention,
        recommendation: heroShot && score > 70 ? 'PRIORITY: Usar como Hero Shot' :
                        score > 60 ? 'PRIMARY: Usar en timeline principal' :
                        score > 40 ? 'SECONDARY: Usar como B-roll' :
                        'DISCARD: No suitable'
      });
    });

    onAnalysisComplete(mockAnalysis);
    setIsAnalyzing(false);
  }, [clips, onAnalysisComplete]);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-teal-500 transition-colors cursor-pointer">
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-white font-medium">Arrastra clips de video aquí</p>
            <p className="text-slate-400 text-sm mt-1">o haz clic para explorar</p>
            <Button variant="outline" className="mt-4 border-slate-600 text-slate-300" onClick={addClip}>
              <Film className="w-4 h-4 mr-2" />
              Añadir Clip de Ejemplo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clips List */}
      {clips.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-white">Clips Subidos ({clips.length})</CardTitle>
                <CardDescription className="text-slate-400">Configura los parámetros de cada clip</CardDescription>
              </div>
              <Button 
                onClick={analyzeClips} 
                disabled={isAnalyzing || clips.length === 0}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Analizando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Analizar Footage
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {clips.map((clip, index) => {
              const clipAnalysis = analysis.get(clip.id);
              
              return (
                <div key={clip.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                        <Film className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Clip {index + 1}</p>
                        <p className="text-slate-400 text-sm">{clip.duration}s • {clip.resolution} • {clip.fps}fps</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeClip(clip.id)} className="text-slate-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Clip Settings */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Tipo</label>
                      <select
                        value={clip.type}
                        onChange={(e) => updateClip(clip.id, { type: e.target.value as Clip['type'] })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                      >
                        {CLIP_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Duración (s)</label>
                      <input
                        type="number"
                        value={clip.duration}
                        onChange={(e) => updateClip(clip.id, { duration: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                        min={1}
                        max={60}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Calidad</label>
                      <select
                        value={clip.quality}
                        onChange={(e) => updateClip(clip.id, { quality: e.target.value as Clip['quality'] })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                      >
                        {QUALITIES.map(q => (
                          <option key={q.value} value={q.value}>{q.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">FPS</label>
                      <select
                        value={clip.fps}
                        onChange={(e) => updateClip(clip.id, { fps: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                      >
                        <option value={24}>24 fps</option>
                        <option value={30}>30 fps</option>
                        <option value={60}>60 fps</option>
                      </select>
                    </div>
                  </div>

                  {/* Analysis Results */}
                  {clipAnalysis && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">Score de Calidad</span>
                            <span className={cn(
                              "text-sm font-bold",
                              clipAnalysis.score > 70 ? "text-emerald-400" :
                              clipAnalysis.score > 40 ? "text-yellow-400" : "text-red-400"
                            )}>
                              {clipAnalysis.score}/100
                            </span>
                          </div>
                          <Progress value={clipAnalysis.score} className="h-2 bg-slate-800" 
                            // @ts-ignore - variant prop
                            variant={clipAnalysis.score > 70 ? "success" : clipAnalysis.score > 40 ? "warning" : "destructive"}
                          />
                        </div>
                        {clipAnalysis.heroShot && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
                            <Star className="w-3 h-3 mr-1" />
                            Hero Shot
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          Intención: {clipAnalysis.intention}
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          {clipAnalysis.heroShot ? (
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-slate-500" />
                          )}
                          {clipAnalysis.recommendation}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {clips.length === 0 && (
        <Card className="bg-slate-800/30 border-slate-700 border-dashed">
          <CardContent className="py-12 text-center">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Sube clips de video para comenzar el análisis</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}