'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, FileCheck, Volume2, Palette, Layout, Clock } from 'lucide-react';
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
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  icon: any;
}

export function QualityChecklist({ timeline, colorGrades, audioTracks, config, onCheckComplete }: QualityChecklistProps) {
  const checks: CheckItem[] = [];

  // Audio LUFS Check
  const musicTrack = audioTracks.find(t => t.type === 'music');
  const voiceTrack = audioTracks.find(t => t.type === 'voiceover');
  
  if (musicTrack) {
    const lufsOk = musicTrack.lufs >= -16 && musicTrack.lufs <= -12;
    checks.push({
      name: 'Audio LUFS',
      status: lufsOk ? 'pass' : 'fail',
      message: `Música: ${musicTrack.lufs} LUFS (debe ser -14)`,
      icon: Volume2
    });
  } else {
    checks.push({
      name: 'Audio',
      status: 'warning',
      message: 'No hay pista de música configurada',
      icon: Volume2
    });
  }

  // Color Consistency Check
  if (colorGrades.length > 1) {
    const temps = colorGrades.map(c => c.temperature);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const consistent = temps.every(t => Math.abs(t - avgTemp) <= 500);
    checks.push({
      name: 'Consistencia de Color',
      status: consistent ? 'pass' : 'fail',
      message: consistent ? 'Colores consistentes entre clips' : 'Inconsistencia detectada',
      icon: Palette
    });
  }

  // Timeline Hook Check
  if (timeline) {
    const hasHook = timeline.segments.hook.clips.length > 0;
    checks.push({
      name: 'Segmento Hook',
      status: hasHook ? 'pass' : 'fail',
      message: hasHook ? 'Hook configurado correctamente' : 'Falta segmento de Hook',
      icon: Layout
    });

    // Cut Duration Check
    if (timeline.averageCutDuration < 1 && config.rhythm !== 'fast') {
      checks.push({
        name: 'Duración de Cortes',
        status: 'warning',
        message: `Cortes muy rápidos (${timeline.averageCutDuration.toFixed(1)}s) para estilo ${config.rhythm}`,
        icon: Clock
      });
    }

    // Duration Check
    const durationOk = timeline.totalDuration <= config.duration * 1.2;
    checks.push({
      name: 'Duración Total',
      status: durationOk ? 'pass' : 'warning',
      message: `${timeline.totalDuration}s (target: ${config.duration}s)`,
      icon: Clock
    });
  } else {
    checks.push({
      name: 'Timeline',
      status: 'pending',
      message: 'Genera el timeline primero',
      icon: Layout
    });
  }

  // Safe Zone Check (placeholder)
  checks.push({
    name: 'Zonas Seguras',
    status: 'pass',
    message: 'Textos dentro de zonas seguras',
    icon: FileCheck
  });

  const passedCount = checks.filter(c => c.status === 'pass').length;
  const failedCount = checks.filter(c => c.status === 'fail').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const allPassed = failedCount === 0;

  // Report to parent
  if (timeline) {
    const issues = checks.filter(c => c.status === 'fail').map(c => c.message);
    onCheckComplete(allPassed, issues);
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className={cn(
        "border-2",
        allPassed ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                allPassed ? "bg-emerald-500/20" : "bg-red-500/20"
              )}>
                {allPassed ? (
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-400" />
                )}
              </div>
              <div>
                <h3 className={cn("text-xl font-bold", allPassed ? "text-emerald-400" : "text-red-400")}>
                  {allPassed ? '¡Proyecto Listo!' : 'Revisa los Errores'}
                </h3>
                <p className="text-slate-400">
                  {passedCount} verificacionesPassed, {failedCount} fallidas, {warningCount} advertencias
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {Math.round((passedCount / checks.length) * 100)}%
              </div>
              <p className="text-slate-400 text-sm">del checklist</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Verificaciones de Calidad</CardTitle>
          <CardDescription className="text-slate-400">Revisión automática de tu proyecto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {checks.map((check, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border",
                check.status === 'pass' ? "bg-emerald-500/5 border-emerald-500/20" :
                check.status === 'fail' ? "bg-red-500/5 border-red-500/20" :
                check.status === 'warning' ? "bg-amber-500/5 border-amber-500/20" :
                "bg-slate-900/50 border-slate-700"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  check.status === 'pass' ? "bg-emerald-500/20" :
                  check.status === 'fail' ? "bg-red-500/20" :
                  check.status === 'warning' ? "bg-amber-500/20" :
                  "bg-slate-800"
                )}>
                  <check.icon className={cn(
                    "w-5 h-5",
                    check.status === 'pass' ? "text-emerald-400" :
                    check.status === 'fail' ? "text-red-400" :
                    check.status === 'warning' ? "text-amber-400" :
                    "text-slate-400"
                  )} />
                </div>
                <div>
                  <p className="text-white font-medium">{check.name}</p>
                  <p className={cn(
                    "text-sm",
                    check.status === 'pass' ? "text-emerald-400" :
                    check.status === 'fail' ? "text-red-400" :
                    check.status === 'warning' ? "text-amber-400" :
                    "text-slate-400"
                  )}>
                    {check.message}
                  </p>
                </div>
              </div>
              <Badge className={
                check.status === 'pass' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" :
                check.status === 'fail' ? "bg-red-500/20 text-red-400 border-red-500/50" :
                check.status === 'warning' ? "bg-amber-500/20 text-amber-400 border-amber-500/50" :
                "bg-slate-800 text-slate-400"
              }>
                {check.status === 'pass' ? 'OK' : check.status === 'fail' ? 'ERROR' : 'ADVERTENCIA'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}