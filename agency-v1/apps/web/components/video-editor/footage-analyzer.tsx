'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Upload, Film, Trash2, Zap, Star, AlertCircle, CheckCircle, 
  GripVertical, Plus, Tag, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Clip, ClipAnalysis } from '@/actions/video-editor';

interface FootageAnalyzerProps {
  clips: Clip[];
  analysis: Map<string, ClipAnalysis>;
  onClipsChange: (clips: Clip[]) => void;
  onAnalysisComplete: (analysis: Map<string, ClipAnalysis>) => void;
}

const CLIP_TYPES = [
  { value: 'macro', label: 'Macro', desc: 'Close-up detallado', emoji: '🔬' },
  { value: 'close-up', label: 'Close-up', desc: 'Primer plano', emoji: '👁️' },
  { value: 'branding', label: 'Branding', desc: 'Logo/identidad', emoji: '🏷️' },
  { value: 'hero', label: 'Hero', desc: 'Shot principal', emoji: '⭐' },
  { value: 'b-roll', label: 'B-Roll', desc: 'Complementario', emoji: '🎞️' },
  { value: 'transition', label: 'Transición', desc: 'Para cortes', emoji: '✂️' },
] as const;

const QUALITIES = [
  { value: 'excellent', label: 'Excellent', color: 'text-emerald-400' },
  { value: 'good', label: 'Good', color: 'text-blue-400' },
  { value: 'fair', label: 'Fair', color: 'text-yellow-400' },
  { value: 'poor', label: 'Poor', color: 'text-red-400' },
] as const;

const CLIP_TYPE_COLORS: Record<string, string> = {
  macro: 'from-blue-600 to-cyan-600',
  'close-up': 'from-purple-600 to-pink-600',
  branding: 'from-amber-600 to-orange-600',
  hero: 'from-rose-600 to-red-600',
  'b-roll': 'from-slate-600 to-slate-500',
  transition: 'from-teal-600 to-emerald-600',
};

function ClipThumbnail({ clip, index }: { clip: Clip; index: number }) {
  const gradient = CLIP_TYPE_COLORS[clip.type] || 'from-slate-600 to-slate-500';
  const emoji = CLIP_TYPES.find(t => t.value === clip.type)?.emoji || '🎞️';

  return (
    <div className={cn('w-full h-full rounded-lg bg-gradient-to-br flex flex-col items-center justify-center relative overflow-hidden', gradient)}>
      {/* Film grain overlay */}
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: 'cover' }}
      />
      {/* Film strip holes */}
      <div className="absolute top-1 left-0 right-0 flex justify-around">
        {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 bg-black/40 rounded-sm" />)}
      </div>
      <div className="absolute bottom-1 left-0 right-0 flex justify-around">
        {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 bg-black/40 rounded-sm" />)}
      </div>
      <span className="text-2xl relative z-10">{emoji}</span>
      <span className="text-white text-[10px] font-bold relative z-10 mt-1 uppercase tracking-wider">{clip.type}</span>
      <div className="absolute bottom-3 right-2 bg-black/50 rounded px-1 text-[9px] text-white font-mono">
        {clip.duration}s
      </div>
      <div className="absolute top-3 right-2 bg-black/50 rounded px-1 text-[9px] text-white font-mono">
        #{index + 1}
      </div>
    </div>
  );
}

export function FootageAnalyzer({ clips, analysis, onClipsChange, onAnalysisComplete }: FootageAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [expandedClip, setExpandedClip] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addClip = useCallback(() => {
    const types: Clip['type'][] = ['b-roll', 'close-up', 'macro', 'hero', 'branding', 'transition'];
    const newClip: Clip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      type: types[Math.floor(Math.random() * types.length)],
      duration: Math.floor(Math.random() * 12) + 3,
      resolution: ['1920x1080', '3840x2160', '1080x1080'][Math.floor(Math.random() * 3)],
      fps: [24, 30, 60][Math.floor(Math.random() * 3)],
      quality: ['good', 'excellent', 'fair'][Math.floor(Math.random() * 3)] as Clip['quality'],
      focus: 'sharp',
      stability: 'stable',
      lighting: 'natural',
      semanticTags: [],
    };
    onClipsChange([...clips, newClip]);
  }, [clips, onClipsChange]);

  const removeClip = useCallback((clipId: string) => {
    onClipsChange(clips.filter(c => c.id !== clipId));
    const newAnalysis = new Map(analysis);
    newAnalysis.delete(clipId);
    onAnalysisComplete(newAnalysis);
  }, [clips, analysis, onClipsChange, onAnalysisComplete]);

  const updateClip = useCallback((clipId: string, updates: Partial<Clip>) => {
    onClipsChange(clips.map(c => c.id === clipId ? { ...c, ...updates } : c));
  }, [clips, onClipsChange]);

  const addTag = useCallback((clipId: string) => {
    const tag = tagInput[clipId]?.trim();
    if (!tag) return;
    const clip = clips.find(c => c.id === clipId);
    if (!clip || clip.semanticTags.includes(tag)) return;
    updateClip(clipId, { semanticTags: [...clip.semanticTags, tag] });
    setTagInput(prev => ({ ...prev, [clipId]: '' }));
  }, [clips, tagInput, updateClip]);

  const removeTag = useCallback((clipId: string, tag: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    updateClip(clipId, { semanticTags: clip.semanticTags.filter(t => t !== tag) });
  }, [clips, updateClip]);

  const analyzeClips = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalyzeProgress(0);

    const total = clips.length;
    const mockAnalysis = new Map<string, ClipAnalysis>();

    for (let i = 0; i < total; i++) {
      const clip = clips[i];
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      setAnalyzeProgress(Math.round(((i + 1) / total) * 100));

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
      score = Math.min(score + clip.semanticTags.length * 3, 100);

      const heroShot = clip.type === 'hero' || score > 75;
      const intention = clip.type === 'macro' ? 'texture' :
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
          score > 40 ? 'SECONDARY: Usar como B-roll' : 'DISCARD: No suitable',
      });
    }

    onAnalysisComplete(mockAnalysis);
    setIsAnalyzing(false);
    setAnalyzeProgress(100);
  }, [clips, onAnalysisComplete]);

  // Drag and drop reordering
  const handleDragStart = (clipId: string) => setDraggingId(clipId);
  const handleDragOver = (e: React.DragEvent, clipId: string) => {
    e.preventDefault();
    setDragOverId(clipId);
  };
  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    const fromIdx = clips.findIndex(c => c.id === draggingId);
    const toIdx = clips.findIndex(c => c.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...clips];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onClipsChange(next);
    setDraggingId(null);
    setDragOverId(null);
  };

  // Check for duplicate clips
  const getDuplicateWarning = (clip: Clip) => {
    const similar = clips.filter(c =>
      c.id !== clip.id &&
      c.type === clip.type &&
      Math.abs(c.duration - clip.duration) < 1
    );
    return similar.length > 0 ? `Similar a Clip #${clips.indexOf(similar[0]) + 1}` : null;
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className={cn(
        'border-2 border-dashed transition-colors',
        isDragOver ? 'border-teal-500 bg-teal-500/5' : 'border-slate-700 bg-slate-800/30'
      )}>
        <CardContent className="pt-6 pb-6">
          <div
            className="text-center cursor-pointer"
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); addClip(); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden" onChange={addClip} />
            <div className={cn(
              'w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all',
              isDragOver ? 'bg-teal-500/20 scale-110' : 'bg-slate-800'
            )}>
              <Upload className={cn('w-8 h-8 transition-colors', isDragOver ? 'text-teal-400' : 'text-slate-500')} />
            </div>
            <p className="text-white font-semibold">Arrastra clips de video aquí</p>
            <p className="text-slate-400 text-sm mt-1">o haz clic para explorar · MP4, MOV, MKV</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-slate-600 text-slate-300 hover:border-teal-500 hover:text-teal-400"
              onClick={(e) => { e.stopPropagation(); addClip(); }}
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              Añadir Clip de Ejemplo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clips list */}
      {clips.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-blue-400" />
                  Footage ({clips.length} clips)
                  {analysis.size > 0 && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                      Analizado
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Arrastra para reordenar · Haz clic para expandir configuración
                </CardDescription>
              </div>
              <Button
                onClick={analyzeClips}
                disabled={isAnalyzing || clips.length === 0}
                className="bg-teal-600 hover:bg-teal-700 h-9"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    {analyzeProgress}%
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Analizar con IA
                  </>
                )}
              </Button>
            </div>

            {/* Analysis progress */}
            {isAnalyzing && (
              <div className="mt-3">
                <Progress value={analyzeProgress} className="h-1.5 bg-slate-700" />
                <p className="text-xs text-slate-400 mt-1">
                  Analizando clip {Math.ceil((analyzeProgress / 100) * clips.length)} de {clips.length}...
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-3">
            {clips.map((clip, index) => {
              const clipAnalysis = analysis.get(clip.id);
              const isExpanded = expandedClip === clip.id;
              const isDragging = draggingId === clip.id;
              const isDragTarget = dragOverId === clip.id;
              const dupWarning = getDuplicateWarning(clip);

              return (
                <div
                  key={clip.id}
                  draggable
                  onDragStart={() => handleDragStart(clip.id)}
                  onDragOver={(e) => handleDragOver(e, clip.id)}
                  onDrop={() => handleDrop(clip.id)}
                  onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                  className={cn(
                    'rounded-xl border transition-all duration-150',
                    isDragging ? 'opacity-40 scale-95' : 'opacity-100',
                    isDragTarget ? 'border-teal-500 ring-1 ring-teal-500/30' : 'border-slate-700',
                    'bg-slate-900/60'
                  )}
                >
                  {/* Clip header row */}
                  <div className="flex items-center gap-3 p-3">
                    {/* Drag handle */}
                    <GripVertical className="w-4 h-4 text-slate-600 cursor-grab flex-shrink-0" />

                    {/* Thumbnail */}
                    <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <ClipThumbnail clip={clip} index={index} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">
                          Clip {index + 1}
                        </p>
                        {clipAnalysis?.heroShot && (
                          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
                            <Star className="w-2.5 h-2.5 mr-1" />
                            Hero
                          </Badge>
                        )}
                        {dupWarning && (
                          <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 text-[10px]">
                            ⚠ {dupWarning}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{clip.duration}s
                        </span>
                        <span className="text-xs text-slate-500">{clip.resolution}</span>
                        <span className="text-xs text-slate-500">{clip.fps}fps</span>
                        {clip.semanticTags.length > 0 && (
                          <span className="text-xs text-teal-400 flex items-center gap-1">
                            <Tag className="w-3 h-3" />{clip.semanticTags.length}
                          </span>
                        )}
                      </div>

                      {/* Analysis score (if available) */}
                      {clipAnalysis && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-700',
                                clipAnalysis.score > 70 ? 'bg-emerald-500' :
                                clipAnalysis.score > 40 ? 'bg-amber-500' : 'bg-red-500'
                              )}
                              style={{ width: `${clipAnalysis.score}%` }}
                            />
                          </div>
                          <span className={cn(
                            'text-[10px] font-bold',
                            clipAnalysis.score > 70 ? 'text-emerald-400' :
                            clipAnalysis.score > 40 ? 'text-amber-400' : 'text-red-400'
                          )}>
                            {clipAnalysis.score}/100
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpandedClip(isExpanded ? null : clip.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => removeClip(clip.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Config */}
                  {isExpanded && (
                    <div className="border-t border-slate-700/60 px-3 pb-4 pt-3 space-y-4">
                      {/* Clip type */}
                      <div>
                        <label className="text-xs text-slate-400 block mb-2 font-medium">Tipo de Clip</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {CLIP_TYPES.map(t => (
                            <button
                              key={t.value}
                              onClick={() => updateClip(clip.id, { type: t.value as Clip['type'] })}
                              className={cn(
                                'p-2 rounded-lg text-left transition-all border text-xs',
                                clip.type === t.value
                                  ? 'border-teal-500 bg-teal-500/10 text-white'
                                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                              )}
                            >
                              <span className="mr-1">{t.emoji}</span>{t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Grid settings */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Duración (s)</label>
                          <input
                            type="number"
                            value={clip.duration}
                            onChange={(e) => updateClip(clip.id, { duration: Number(e.target.value) })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:border-teal-500 focus:outline-none"
                            min={1} max={120}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Calidad</label>
                          <select
                            value={clip.quality}
                            onChange={(e) => updateClip(clip.id, { quality: e.target.value as Clip['quality'] })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:border-teal-500 focus:outline-none"
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
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:border-teal-500 focus:outline-none"
                          >
                            <option value={24}>24 fps</option>
                            <option value={30}>30 fps</option>
                            <option value={60}>60 fps</option>
                            <option value={120}>120 fps</option>
                          </select>
                        </div>
                      </div>

                      {/* Semantic Tags */}
                      <div>
                        <label className="text-xs text-slate-400 block mb-2 font-medium flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Tags semánticos
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {clip.semanticTags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 rounded-full text-[10px] text-teal-400">
                              {tag}
                              <button onClick={() => removeTag(clip.id, tag)} className="hover:text-red-400">×</button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={tagInput[clip.id] || ''}
                            onChange={(e) => setTagInput(prev => ({ ...prev, [clip.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && addTag(clip.id)}
                            placeholder="Añadir tag... (Enter)"
                            className="h-8 text-xs bg-slate-800 border-slate-700 text-white flex-1"
                          />
                          <Button size="sm" variant="outline" className="h-8 border-slate-700" onClick={() => addTag(clip.id)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Analysis result */}
                      {clipAnalysis && (
                        <div className="p-3 bg-slate-950 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            {clipAnalysis.heroShot ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-slate-500" />
                            )}
                            <span className="text-xs font-semibold text-white">Resultado del Análisis</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="border-slate-600 text-slate-300 text-[10px]">
                              Intención: {clipAnalysis.intention}
                            </Badge>
                            <Badge
                              className={cn('text-[10px]',
                                clipAnalysis.score > 70 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                                clipAnalysis.score > 40 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                'bg-red-500/15 text-red-400 border-red-500/30'
                              )}
                            >
                              Score: {clipAnalysis.score}/100
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2">{clipAnalysis.recommendation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {clips.length === 0 && (
        <Card className="bg-slate-800/20 border-slate-800 border-dashed">
          <CardContent className="py-16 text-center">
            <Film className="w-14 h-14 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Sin clips aún</p>
            <p className="text-slate-600 text-sm mt-1">Sube o añade clips para comenzar el análisis</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}