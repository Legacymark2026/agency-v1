'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Circle, Clock, Scissors } from 'lucide-react';
import type { Clip, Timeline, ColorGrade, AudioTrack, TextOverlay, ProjectConfig } from '@/actions/video-editor';

interface ProjectProgressBarProps {
  config: Partial<ProjectConfig>;
  clips: Clip[];
  timeline: Timeline | null;
  colorGrades: ColorGrade[];
  audioTracks: AudioTrack[];
  textOverlays: TextOverlay[];
  qualityPassed: boolean;
}

interface SectionStatus {
  label: string;
  done: boolean;
  warn: boolean;
}

export function ProjectProgressBar({
  config,
  clips,
  timeline,
  colorGrades,
  audioTracks,
  textOverlays,
  qualityPassed,
}: ProjectProgressBarProps) {
  const sections: SectionStatus[] = useMemo(() => [
    { label: 'Config', done: !!(config.name && config.type && config.format), warn: false },
    { label: 'Clips', done: clips.length > 0, warn: clips.length === 0 },
    { label: 'Timeline', done: !!timeline, warn: clips.length > 0 && !timeline },
    { label: 'Audio', done: audioTracks.length > 0, warn: false },
    { label: 'Texto', done: textOverlays.length > 0, warn: false },
    { label: 'Color', done: colorGrades.length > 0, warn: false },
    { label: 'Calidad', done: qualityPassed, warn: timeline !== null && !qualityPassed },
  ], [config, clips, timeline, colorGrades, audioTracks, textOverlays, qualityPassed]);

  const completedCount = sections.filter(s => s.done).length;
  const percent = Math.round((completedCount / sections.length) * 100);

  const totalDuration = timeline
    ? timeline.totalDuration
    : clips.reduce((sum, c) => sum + c.duration, 0);

  const estimatedRender = Math.round(totalDuration * 0.3); // 30% of duration as render estimate

  return (
    <div className="bg-slate-900/80 border-b border-slate-800 px-4 py-2 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        {/* Overall progress */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle
                cx="16" cy="16" r="12" fill="none"
                stroke={percent === 100 ? '#10b981' : '#14b8a6'}
                strokeWidth="3"
                strokeDasharray={`${(percent / 100) * 75.4} 75.4`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
              {percent}%
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-none">{percent}% completo</p>
            <p className="text-[10px] text-slate-400">{completedCount}/{sections.length} secciones</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-700 hidden md:block" />

        {/* Section indicators */}
        <div className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
          {sections.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1 flex-shrink-0">
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all',
                s.done ? 'bg-emerald-500/15 text-emerald-400' :
                s.warn ? 'bg-amber-500/15 text-amber-400' :
                'bg-slate-800 text-slate-500'
              )}>
                {s.done ? (
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                ) : s.warn ? (
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <Circle className="w-3 h-3 flex-shrink-0" />
                )}
                {s.label}
              </div>
              {i < sections.length - 1 && (
                <div className={cn(
                  'w-4 h-px',
                  s.done ? 'bg-emerald-500/40' : 'bg-slate-700'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-700 hidden md:block" />

        {/* Stats */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Scissors className="w-3 h-3" />
            <span className="text-xs">{clips.length} clips</span>
          </div>
          {totalDuration > 0 && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3 h-3" />
              <span className="text-xs">{totalDuration.toFixed(0)}s</span>
            </div>
          )}
          {estimatedRender > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 text-slate-500">
              <span className="text-[10px]">~{estimatedRender}s render</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
