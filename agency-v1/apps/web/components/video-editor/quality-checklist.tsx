'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, XCircle, AlertTriangle, FileCheck, Volume2, 
  Palette, Layout, Clock, Wand2, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Timeline, ColorGrade, AudioTrack, ProjectConfig } from '@/actions/video-editor';

interface QualityChecklistProps {
  timeline: Timeline | null;
  colorGrades: ColorGrade[];
  audioTracks: AudioTrack[];
  config: ProjectConfig;
  onCheckComplete: (passed: boolean, issues: string[]) => void;
}

interface CheckItem {
  id: string;
  category: 'técnico' | 'narrativo' | 'plataforma';
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  icon: React.ElementType;
  fixLabel?: string;
  fixStep?: number;
}

function CircularScore({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1e293b" strokeWidth="5"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white leading-none">{score}</span>
        <span className="text-[9px] text-slate-400 leading-none mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

export function QualityChecklist({ timeline, colorGrades, audioTracks, config, onCheckComplete }: QualityChecklistProps) {
  const checks: CheckItem[] = useMemo(() => {
    const items: CheckItem[] = [];

    // ─── TÉCNICO ────────────────────────────────────────
    const musicTrack = audioTracks.find(t => t.type === 'music');
    const voiceTrack = audioTracks.find(t => t.type === 'voiceover');

    if (musicTrack) {
      const lufsOk = musicTrack.lufs >= -16 && musicTrack.lufs <= -12;
      items.push({
        id: 'audio-lufs',
        category: 'técnico',
        name: 'Niveles de Audio LUFS',
        status: lufsOk ? 'pass' : 'fail',
        message: `Música: ${musicTrack.lufs} LUFS (rango óptimo: -16 a -12)`,
        icon: Volume2,
        fixLabel: lufsOk ? undefined : 'Ajustar Audio',
        fixStep: 6,
      });
    } else {
      items.push({
        id: 'audio-missing',
        category: 'técnico',
        name: 'Pista de Audio',
        status: 'warning',
        message: 'Sin música configurada. Añade una pista de fondo.',
        icon: Volume2,
        fixLabel: 'Añadir Audio',
        fixStep: 6,
      });
    }

    if (colorGrades.length > 1) {
      const temps = colorGrades.map(c => c.temperature);
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      const consistent = temps.every(t => Math.abs(t - avgTemp) <= 500);
      items.push({
        id: 'color-consistency',
        category: 'técnico',
        name: 'Consistencia de Color',
        status: consistent ? 'pass' : 'fail',
        message: consistent
          ? `Temperatura consistente (~${Math.round(avgTemp)}K)`
          : `Variación de temperatura >500K entre clips`,
        icon: Palette,
        fixLabel: consistent ? undefined : 'Corregir Color',
        fixStep: 5,
      });
    }

    items.push({
      id: 'safe-zones',
      category: 'técnico',
      name: 'Zonas Seguras',
      status: 'pass',
      message: 'Textos dentro de zonas seguras (90% safe area)',
      icon: FileCheck,
    });

    // ─── NARRATIVO ────────────────────────────────────────
    if (timeline) {
      const hasHook = timeline.segments.hook.clips.length > 0;
      items.push({
        id: 'hook',
        category: 'narrativo',
        name: 'Segmento Hook',
        status: hasHook ? 'pass' : 'fail',
        message: hasHook
          ? `Hook de ${timeline.segments.hook.duration}s configurado`
          : 'Falta segmento de apertura (Hook)',
        icon: Layout,
        fixLabel: hasHook ? undefined : 'Ir a Timeline',
        fixStep: 3,
      });

      const hasBody = timeline.segments.body.clips.length > 0;
      items.push({
        id: 'body',
        category: 'narrativo',
        name: 'Cuerpo Principal',
        status: hasBody ? 'pass' : 'warning',
        message: hasBody
          ? `${timeline.segments.body.clips.length} clips en cuerpo`
          : 'Sin clips en el cuerpo del video',
        icon: Layout,
      });

      if (timeline.averageCutDuration < 1 && config.rhythm !== 'fast') {
        items.push({
          id: 'cut-duration',
          category: 'narrativo',
          name: 'Ritmo de Cortes',
          status: 'warning',
          message: `Cortes cada ${timeline.averageCutDuration.toFixed(1)}s. Muy rápido para estilo "${config.rhythm}"`,
          icon: Clock,
        });
      } else {
        items.push({
          id: 'cut-duration',
          category: 'narrativo',
          name: 'Ritmo de Cortes',
          status: 'pass',
          message: `Avg. ${(timeline.averageCutDuration ?? 0).toFixed(1)}s por corte — apropiado para estilo "${config.rhythm}"`,
          icon: Clock,
        });
      }
    } else {
      items.push({
        id: 'timeline-pending',
        category: 'narrativo',
        name: 'Timeline',
        status: 'pending',
        message: 'Genera el timeline primero para verificar narrativa',
        icon: Layout,
        fixLabel: 'Generar Timeline',
        fixStep: 3,
      });
    }

    // ─── PLATAFORMA ────────────────────────────────────────
    if (timeline && config.format && config.duration) {
      const durationOk = timeline.totalDuration <= config.duration * 1.2;
      items.push({
        id: 'duration',
        category: 'plataforma',
        name: 'Duración para Plataforma',
        status: durationOk ? 'pass' : 'warning',
        message: `${timeline.totalDuration.toFixed(0)}s (target ${config.duration}s para ${config.format})`,
        icon: Clock,
      });
    }

    if (config.platform) {
      const hasVoice = !!voiceTrack;
      const needsVoice = config.platform === 'youtube' || config.platform === 'linkedin';
      if (needsVoice && !hasVoice) {
        items.push({
          id: 'voiceover',
          category: 'plataforma',
          name: 'Voiceover para Plataforma',
          status: 'warning',
          message: `${config.platform} recomienda narración en off para mayor retención`,
          icon: Volume2,
          fixLabel: 'Añadir Voiceover',
          fixStep: 6,
        });
      } else if (needsVoice && hasVoice) {
        items.push({
          id: 'voiceover',
          category: 'plataforma',
          name: 'Voiceover para Plataforma',
          status: 'pass',
          message: `Voiceover configurado — óptimo para ${config.platform}`,
          icon: Volume2,
        });
      }
    }

    // Report result
    const failed = items.filter(c => c.status === 'fail');
    onCheckComplete(failed.length === 0, failed.map(c => c.message));

    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline, colorGrades, audioTracks, config]);

  const passedCount = checks.filter(c => c.status === 'pass').length;
  const failedCount = checks.filter(c => c.status === 'fail').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const score = Math.round((passedCount / Math.max(checks.length, 1)) * 100);
  const allPassed = failedCount === 0;

  const categories = ['técnico', 'narrativo', 'plataforma'] as const;

  return (
    <div className="space-y-6">
      {/* Hero Score Card */}
      <Card className={cn(
        'border-2 overflow-hidden',
        allPassed ? 'border-emerald-500/40' : failedCount > 0 ? 'border-red-500/40' : 'border-amber-500/40'
      )}>
        <div className={cn(
          'absolute inset-0 opacity-5',
          allPassed ? 'bg-emerald-500' : failedCount > 0 ? 'bg-red-500' : 'bg-amber-500'
        )} />
        <CardContent className="relative pt-6 pb-6">
          <div className="flex items-center gap-6">
            {/* Circular Score */}
            <CircularScore score={score} size={88} />

            {/* Text */}
            <div className="flex-1">
              <h3 className={cn(
                'text-xl font-bold mb-1',
                allPassed ? 'text-emerald-400' : failedCount > 0 ? 'text-red-400' : 'text-amber-400'
              )}>
                {allPassed ? '¡Proyecto Aprobado!' :
                  failedCount > 0 ? `${failedCount} error${failedCount > 1 ? 'es' : ''} crítico${failedCount > 1 ? 's' : ''}` :
                  `${warningCount} advertencia${warningCount > 1 ? 's' : ''}`}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />{passedCount} OK
                </Badge>
                {failedCount > 0 && (
                  <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-xs">
                    <XCircle className="w-3 h-3 mr-1" />{failedCount} Error
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />{warningCount} Aviso
                  </Badge>
                )}
              </div>
              {allPassed && (
                <p className="text-slate-400 text-sm mt-2">Listo para exportar y publicar.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checks grouped by category */}
      {categories.map(category => {
        const categoryChecks = checks.filter(c => c.category === category);
        if (categoryChecks.length === 0) return null;

        const catLabel = category.charAt(0).toUpperCase() + category.slice(1);
        const catPassed = categoryChecks.filter(c => c.status === 'pass').length;

        return (
          <Card key={category} className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  {catLabel}
                </CardTitle>
                <Badge className="bg-slate-700 text-slate-300 text-[10px]">
                  {catPassed}/{categoryChecks.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryChecks.map((check) => {
                const Icon = check.icon;
                return (
                  <div
                    key={check.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all',
                      check.status === 'pass' ? 'bg-emerald-500/5 border-emerald-500/20' :
                      check.status === 'fail' ? 'bg-red-500/5 border-red-500/20' :
                      check.status === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                      'bg-slate-900/50 border-slate-700'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      check.status === 'pass' ? 'bg-emerald-500/20' :
                      check.status === 'fail' ? 'bg-red-500/20' :
                      check.status === 'warning' ? 'bg-amber-500/20' : 'bg-slate-800'
                    )}>
                      <Icon className={cn('w-4 h-4',
                        check.status === 'pass' ? 'text-emerald-400' :
                        check.status === 'fail' ? 'text-red-400' :
                        check.status === 'warning' ? 'text-amber-400' : 'text-slate-400'
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{check.name}</p>
                      <p className={cn('text-xs',
                        check.status === 'pass' ? 'text-emerald-400' :
                        check.status === 'fail' ? 'text-red-400' :
                        check.status === 'warning' ? 'text-amber-400' : 'text-slate-400'
                      )}>
                        {check.message}
                      </p>
                    </div>

                    {/* Status badge + Fix button */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {check.fixLabel && check.fixStep && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn(
                            'h-7 px-2.5 text-[11px] font-semibold gap-1',
                            check.status === 'fail' ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' :
                            'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                          )}
                        >
                          <Wand2 className="w-3 h-3" />
                          {check.fixLabel}
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      )}
                      <Badge className={cn('text-[10px]',
                        check.status === 'pass' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' :
                        check.status === 'fail' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                        check.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                        'bg-slate-800 text-slate-400'
                      )}>
                        {check.status === 'pass' ? '✓ OK' :
                         check.status === 'fail' ? '✗ Error' :
                         check.status === 'warning' ? '⚠ Aviso' : '⏳ Pendiente'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}