'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  Sparkles, ChevronRight, ChevronLeft, Zap, AlertTriangle, 
  CheckCircle2, Info, Wand2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Clip, Timeline, ColorGrade, AudioTrack, ProjectConfig } from '@/actions/video-editor';

interface AISuggestion {
  id: string;
  type: 'warning' | 'tip' | 'optimization' | 'success';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface AISuggestionsPanelProps {
  config: Partial<ProjectConfig>;
  clips: Clip[];
  timeline: Timeline | null;
  colorGrades: ColorGrade[];
  audioTracks: AudioTrack[];
  onNavigate: (step: number) => void;
}

const typeConfig = {
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  tip: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  optimization: { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
};

export function AISuggestionsPanel({
  config,
  clips,
  timeline,
  colorGrades,
  audioTracks,
  onNavigate,
}: AISuggestionsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

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
          onAction: () => onNavigate(6),
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
        onAction: () => onNavigate(5),
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
        onAction: () => onNavigate(5),
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
        onAction: () => onNavigate(6),
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
    </div>
  );
}
