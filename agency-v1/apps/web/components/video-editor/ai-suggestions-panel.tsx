'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  Sparkles, ChevronRight, ChevronLeft, Zap, AlertTriangle, 
  CheckCircle2, Info, Wand2, X, Film, Image as ImageIcon, Plus, RefreshCw, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Clip, Timeline, ColorGrade, AudioTrack, ProjectConfig } from '@/actions/video-editor';
import { runSynthesisAudit, approveSynthesisProposal, addClipsToProject } from '@/actions/video-editor';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AISuggestion {
  id: string;
  type: 'warning' | 'tip' | 'optimization' | 'success';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface AISuggestionsPanelProps {
  projectId?: string;
  config: Partial<ProjectConfig>;
  clips: Clip[];
  timeline: Timeline | null;
  colorGrades: ColorGrade[];
  audioTracks: AudioTrack[];
  onNavigate: (step: number) => void;
  onClipsChange?: (clips: Clip[]) => void;
}

const typeConfig = {
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  tip: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  optimization: { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
};

export function AISuggestionsPanel({
  projectId,
  config,
  clips,
  timeline,
  colorGrades,
  audioTracks,
  onNavigate,
  onClipsChange,
}: AISuggestionsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Synthesis Agent States
  const [audit, setAudit] = useState<any | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [processingProposalId, setProcessingProposalId] = useState<string | null>(null);
  const [proposalResults, setProposalResults] = useState<Record<string, any>>({});

  const handleRunGapAudit = async () => {
    if (!projectId) return;
    setIsAuditing(true);
    try {
      const result = await runSynthesisAudit(projectId);
      setAudit(result);
      toast.success('Auditoría de gaps completada por el Síntetizador!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al ejecutar auditoría de gaps');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleApproveProposal = async (gapId: string) => {
    if (!projectId || !audit) return;
    setProcessingProposalId(gapId);
    try {
      const res = await approveSynthesisProposal(projectId, audit, gapId);
      if (res.success) {
        setProposalResults(prev => ({ ...prev, [gapId]: res }));
        toast.success('Propuesta aprobada y procesada con éxito!');
      } else {
        toast.error(res.error || 'Error al procesar propuesta');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al aprobar propuesta');
    } finally {
      setProcessingProposalId(null);
    }
  };

  const handleAddAssetToFootage = async (asset: any, type: 'video' | 'image') => {
    if (!projectId || !onClipsChange) return;
    try {
      const newClip: Clip = {
        id: asset.id || `ai-${Date.now()}`,
        type: type === 'video' ? 'b-roll' : 'hero',
        duration: asset.duration || 5,
        resolution: '1920x1080',
        fps: 30,
        quality: 'excellent',
        focus: 'sharp',
        stability: 'stable',
        lighting: 'natural',
        semanticTags: ['ai_generated', type],
        intention: type === 'video' ? 'texture' : 'hook'
      };

      await addClipsToProject(projectId, [newClip]);
      onClipsChange([...clips, newClip]);
      toast.success('Asset añadido al footage del proyecto con éxito!');
    } catch (err: any) {
      console.error(err);
      toast.error('Error al añadir asset al proyecto');
    }
  };

  const suggestions: AISuggestion[] = useMemo(() => {
    const all: AISuggestion[] = [];

    // Config checks
    if (!config.name) {
      all.push({
        id: 'no-name',
        type: 'warning',
        title: 'Proyecto sin nombre',
        description: 'Asigna un nombre descriptivo para identificar el proyecto fácilmente.',
        actionLabel: 'Ir a Config',
        onAction: () => onNavigate(1),
      });
    }

    // Clips checks
    const hookClips = clips.filter(c => c.type === 'hero' || c.duration < 5);
    if (hookClips.length > 2) {
      all.push({
        id: 'too-many-hooks',
        type: 'warning',
        title: `${hookClips.length} clips de tipo hook`,
        description: 'Un solo hook al inicio es ideal. Considera descartar los extras o convertirlos en B-roll.',
        actionLabel: 'Ver Footage',
        onAction: () => onNavigate(2),
      });
    }

    if (clips.length > 0 && clips.length < 3) {
      all.push({
        id: 'few-clips',
        type: 'tip',
        title: 'Pocos clips para un video completo',
        description: 'Con al menos 4–6 clips lograrás un timeline con hook, cuerpo y cierre bien definidos.',
      });
    }

    const hasNoMacro = clips.length > 0 && !clips.find(c => c.type === 'macro');
    if (hasNoMacro) {
      all.push({
        id: 'no-macro',
        type: 'optimization',
        title: 'Sin clips macro/detalle',
        description: 'Los close-ups de producto aumentan la percepción de calidad. Añade al menos uno.',
        actionLabel: 'Añadir Clip',
        onAction: () => onNavigate(2),
      });
    }

    // Timeline checks
    if (timeline) {
      const dur = timeline.totalDuration;
      const format = config.format;
      const platform = config.platform;

      // 9:16 vertical (Reels/TikTok) — ideal ≤60s
      if (format === '9:16' && dur > 90) {
        all.push({
          id: 'reel-too-long',
          type: 'warning',
          title: 'Video vertical demasiado largo',
          description: `Tu timeline tiene ${dur.toFixed(0)}s. Los videos 9:16 de mayor alcance son ≤60s.`,
          actionLabel: 'Ver Timeline',
          onAction: () => onNavigate(3),
        });
      }

      // Story-like short content
      if ((platform === 'tiktok' || platform === 'reels') && dur > 60 && dur <= 90) {
        all.push({
          id: 'short-form-long',
          type: 'tip',
          title: 'Duración elevada para contenido corto',
          description: `${dur.toFixed(0)}s puede reducir la tasa de reproducción completa en ${platform}.`,
        });
      }

      // YouTube — ideally > 60s for monetization
      if (platform === 'youtube' && dur < 60) {
        all.push({
          id: 'youtube-short',
          type: 'tip',
          title: 'Video corto para YouTube',
          description: `Con ${dur.toFixed(0)}s se procesará como YouTube Short. Considera >60s para contenido de formato largo.`,
        });
      }

      if (timeline.cuts < 3) {
        all.push({
          id: 'few-cuts',
          type: 'tip',
          title: 'Ritmo lento detectado',
          description: `Solo ${timeline.cuts} cortes. Aumenta el número de clips para mejorar el ritmo visual.`,
        });
      }
    }

    if (config.platform) {
      const voiceTrack = audioTracks.find(t => t.type === 'voiceover');
      const hasVoice = !!voiceTrack;
      const needsVoice = config.platform === 'youtube' || config.platform === 'facebook';
      if (needsVoice && !hasVoice) {
        all.push({
          id: 'voiceover',
          type: 'optimization',
          title: 'Voiceover recomendado',
          description: `${config.platform === 'youtube' ? 'YouTube' : 'Facebook'} recomienda narración en off para mayor retención`,
          actionLabel: 'Añadir Voiceover',
          onAction: () => onNavigate(5),
        });
      } else if (needsVoice && hasVoice) {
        all.push({
          id: 'voiceover',
          type: 'success',
          title: 'Voiceover configurado',
          description: `Voiceover activo — óptimo para ${config.platform}`,
        });
      }
    }

    // Color checks
    if (clips.length > 0 && colorGrades.length === 0) {
      all.push({
        id: 'no-color',
        type: 'optimization',
        title: 'Sin color grading',
        description: 'Aplica un preset de color para dar identidad visual al video.',
        actionLabel: 'Ir a Color',
        onAction: () => onNavigate(7),
      });
    }

    const ungradedClips = clips.filter(c => !colorGrades.find(g => g.clipId === c.id));
    if (colorGrades.length > 0 && ungradedClips.length > 0) {
      all.push({
        id: 'inconsistent-color',
        type: 'warning',
        title: `${ungradedClips.length} clips sin color grading`,
        description: 'La inconsistencia de color entre clips reduce la calidad percibida del video.',
        actionLabel: 'Corregir',
        onAction: () => onNavigate(7),
      });
    }

    // Audio checks
    if (audioTracks.length === 0) {
      all.push({
        id: 'no-audio',
        type: 'tip',
        title: 'Sin track de audio',
        description: 'Añade música de fondo para aumentar el tiempo de reproducción hasta un 80%.',
        actionLabel: 'Ir a Audio',
        onAction: () => onNavigate(5),
      });
    }

    // Success
    if (all.length === 0) {
      all.push({
        id: 'all-good',
        type: 'success',
        title: '¡Proyecto optimizado al máximo!',
        description: 'Todas las secciones están configuradas correctamente. Listo para exportar.',
      });
    }

    return all.filter(s => !dismissed.has(s.id));
  }, [config, clips, timeline, colorGrades, audioTracks, dismissed, onNavigate]);

  const warnCount = suggestions.filter(s => s.type === 'warning').length;

  return (
    <div className={cn(
      'bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden transition-all duration-300',
      collapsed ? 'w-12' : 'w-72'
    )}>
      {/* Header */}
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="relative flex-shrink-0">
          <Sparkles className="w-5 h-5 text-purple-400" />
          {warnCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full text-[8px] flex items-center justify-center text-white font-bold">
              {warnCount}
            </span>
          )}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white">IA Sugerencias</p>
              <p className="text-[10px] text-slate-400">{suggestions.length} insights</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </>
        )}
        {collapsed && <ChevronRight className="w-4 h-4 text-slate-500 sr-only" />}
      </div>

      {/* Suggestions List */}
      {!collapsed && (
        <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
          {suggestions.map(s => {
            const { icon: Icon, color, bg } = typeConfig[s.type];
            return (
              <div key={s.id} className={cn('p-3 border-l-2 relative group', bg,
                s.type === 'warning' ? 'border-l-amber-500' :
                s.type === 'tip' ? 'border-l-blue-500' :
                s.type === 'optimization' ? 'border-l-purple-500' :
                'border-l-emerald-500'
              )}>
                {/* Dismiss */}
                {s.type !== 'success' && (
                  <button
                    onClick={() => setDismissed(d => new Set([...d, s.id]))}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                <div className="flex items-start gap-2">
                  <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white leading-tight">{s.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{s.description}</p>
                    {s.actionLabel && s.onAction && (
                      <button
                        onClick={s.onAction}
                        className={cn('mt-1.5 text-[10px] font-semibold flex items-center gap-1 hover:underline', color)}
                      >
                        <Wand2 className="w-3 h-3" />
                        {s.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Síntetizador B-Roll Panel */}
      {!collapsed && projectId && (
        <div className="border-t border-slate-800 p-3 bg-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              Sintetizador B-Roll
            </h4>
            <Button
              size="xs"
              variant="outline"
              className="h-6 text-[10px] gap-1 bg-purple-950/20 hover:bg-purple-900/30 border-purple-500/30 text-purple-300 font-medium"
              disabled={isAuditing}
              onClick={handleRunGapAudit}
            >
              {isAuditing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-2.5 h-2.5" />
              )}
              {audit ? 'Re-auditar' : 'Auditar Gaps'}
            </Button>
          </div>

          {!audit && !isAuditing && (
            <p className="text-[11px] text-slate-400 text-center py-4 bg-slate-900/20 rounded border border-dashed border-slate-800">
              Escanea el timeline para detectar huecos narrativos y rellenarlos con Stock o IA.
            </p>
          )}

          {isAuditing && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400 mb-2" />
              <p className="text-xs text-white font-medium">Buscando huecos narrativos...</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                Analizando voiceover y clips para emparejar la semántica.
              </p>
            </div>
          )}

          {audit && !isAuditing && (
            <div className="space-y-3">
              {/* Resumen */}
              <div className="p-2 bg-slate-900/50 rounded border border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span>Gaps: <span className="font-semibold text-white">{audit.gaps?.length || 0}</span></span>
                <span>Faltante: <span className="font-semibold text-white">{audit.missingDuration?.toFixed(1) || 0}s</span></span>
                <span>Cobertura: <span className="font-semibold text-emerald-400">
                  {audit.missingDuration === 0 ? '100%' : `${Math.max(0, 100 - Math.round((audit.missingDuration / Math.max(1, audit.timelineDuration || 1)) * 100))}%`}
                </span></span>
              </div>

              {/* List of Gaps */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {audit.gaps?.length === 0 ? (
                  <div className="p-3 text-center bg-emerald-500/5 border border-emerald-500/20 rounded">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xs font-medium text-emerald-300">¡Timeline cubierto!</p>
                    <p className="text-[10px] text-slate-400">No se detectaron gaps narrativos.</p>
                  </div>
                ) : (
                  audit.gaps?.map((gap: any) => {
                    const proposal = audit.proposals?.find((p: any) => p.gapId === gap.id);
                    const result = proposalResults[gap.id];
                    const isProcessing = processingProposalId === gap.id;

                    let severityColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                    if (gap.severity === 'critical') severityColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                    else if (gap.severity === 'major') severityColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                    return (
                      <div key={gap.id} className="p-2 bg-slate-900/30 hover:bg-slate-900/50 transition-colors border border-slate-800 rounded space-y-2">
                        {/* Gap details */}
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={cn("text-[9px] px-1 py-0 capitalize font-medium", severityColor)}>
                            {gap.type || 'B-Roll'}
                          </Badge>
                          <span className="text-[9px] text-slate-400 font-mono">{gap.duration?.toFixed(0)}s</span>
                        </div>
                        <p className="text-[11px] text-white leading-tight font-medium">{gap.reason}</p>
                        
                        {gap.relatedScript && (
                          <div className="border-l border-slate-700 pl-1.5 py-0.5 my-1">
                            <p className="text-[10px] text-slate-400 italic leading-normal">
                              "{gap.relatedScript}"
                            </p>
                          </div>
                        )}

                        {/* Proposal details */}
                        {proposal && (
                          <div className="mt-1 pt-1.5 border-t border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between text-[9px] text-slate-400">
                              <span className="capitalize text-slate-300 font-medium flex items-center gap-1">
                                {proposal.source === 'stock' ? (
                                  <>
                                    <Film className="w-2.5 h-2.5 text-blue-400" />
                                    Stock ({proposal.provider})
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="w-2.5 h-2.5 text-purple-400" />
                                    AI Gen ({proposal.provider})
                                  </>
                                )}
                              </span>
                              <span className="font-semibold text-purple-300">⚡ {proposal.estimatedCost} créditos</span>
                            </div>

                            {proposal.searchQuery && (
                              <p className="text-[9px] text-slate-400 bg-slate-950/30 px-1 py-0.5 rounded font-mono truncate">
                                Búsqueda: "{proposal.searchQuery}"
                              </p>
                            )}
                            {proposal.prompt && (
                              <p className="text-[9px] text-slate-400 bg-slate-950/30 px-1 py-0.5 rounded font-mono line-clamp-2">
                                Prompt: "{proposal.prompt}"
                              </p>
                            )}

                            {/* Approval and Generation Actions */}
                            {!result && (
                              <Button
                                size="xs"
                                className="w-full h-7 text-[10px] gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-sm transition-all duration-200"
                                disabled={isProcessing}
                                onClick={() => handleApproveProposal(gap.id)}
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Procesando...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="w-3 h-3" />
                                    Aprobar e Iniciar
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Processing results */}
                            {result && (
                              <div className="mt-2 space-y-2">
                                {result.success ? (
                                  <>
                                    {/* Stock Results */}
                                    {result.provider === 'pexels' && result.results && result.results.length > 0 && (
                                      <div className="space-y-1.5">
                                        <div className="grid grid-cols-2 gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                                          {result.results.slice(0, 4).map((asset: any) => (
                                            <div key={asset.id} className="relative group/asset aspect-video rounded overflow-hidden border border-slate-800 bg-slate-950">
                                              <img
                                                src={asset.thumbnailUrl || '/placeholder.png'}
                                                alt={asset.title}
                                                className="w-full h-full object-cover transition-transform group-hover/asset:scale-105"
                                              />
                                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/asset:opacity-100 flex items-center justify-center transition-opacity gap-1">
                                                <button
                                                  onClick={() => handleAddAssetToFootage(asset, 'video')}
                                                  className="p-1 bg-emerald-500 rounded text-white hover:bg-emerald-400 shadow transition-transform active:scale-95"
                                                  title="Añadir a Footage"
                                                >
                                                  <Plus className="w-3.5 h-3.5" />
                                                </button>
                                                {asset.videoUrl && (
                                                  <a
                                                    href={asset.videoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 bg-slate-800 rounded text-white hover:bg-slate-700 shadow"
                                                  >
                                                    <Play className="w-3.5 h-3.5 fill-current" />
                                                  </a>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* AI Generated Image Result */}
                                    {result.asset && (
                                      <div className="relative group/asset rounded border border-slate-800 overflow-hidden bg-slate-950 p-1">
                                        <img
                                          src={result.asset.thumbnailUrl || result.asset.sourceUrl}
                                          alt="AI Generated"
                                          className="w-full aspect-[9/16] max-h-[160px] object-cover rounded"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/asset:opacity-100 flex flex-col items-center justify-center transition-opacity p-2 gap-1.5 text-center">
                                          <p className="text-[9px] text-white font-medium line-clamp-2">¡Asset listo!</p>
                                          <Button
                                            size="xs"
                                            className="h-6 text-[9px] gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                                            onClick={() => handleAddAssetToFootage(result.asset, 'image')}
                                          >
                                            <Plus className="w-2.5 h-2.5" />
                                            Añadir a Footage
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[10px]">
                                    Error: {result.error || 'Fallo de procesamiento'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
