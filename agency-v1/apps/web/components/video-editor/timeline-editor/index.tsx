'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GripVertical, Trash2, Plus, Film, Music, Type, Palette,
  Scissors, Magnet, Layers, ZoomIn, ZoomOut, Sparkles, Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface TimelineClip {
  id: string;
  type: 'video' | 'audio' | 'text' | 'transition';
  name: string;
  startTime: number;
  duration: number;
  color: string;
  muted?: boolean;
}

function formatDurationBadge(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}h ${m}m ${s > 0 ? s + 's' : ''}`.trim();
  }
  if (m > 0) {
    return `${m}m ${s > 0 ? s + 's' : ''}`.trim();
  }
  return `${s}s`;
}

function formatRulerTick(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getTickStep(duration: number, pps: number): number {
  const minSpacingPx = 70;
  const minSecPerTick = minSpacingPx / pps;
  const candidates = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800];
  for (const c of candidates) {
    if (c >= minSecPerTick) return c;
  }
  return 1800;
}

interface TimelineEditorProps {
  clips: TimelineClip[];
  totalDuration: number;
  onClipsChange?: (clips: TimelineClip[]) => void;
  onClipSelect?: (clipId: string) => void;
  selectedClipId?: string;
  playheadPosition?: number;
  onPlayheadChange?: (pos: number) => void;
  onApplyAutoZoom?: () => void;
}

const TRACK_COLORS = {
  video: 'bg-teal-500/30 border-teal-500/50 hover:border-teal-400',
  audio: 'bg-purple-500/30 border-purple-500/50 hover:border-purple-400',
  text: 'bg-amber-500/30 border-amber-500/50 hover:border-amber-400',
  transition: 'bg-rose-500/30 border-rose-500/50 hover:border-rose-400',
};

const TRACK_ICONS = {
  video: Film,
  audio: Music,
  text: Type,
  transition: Palette,
};

export function TimelineEditor({
  clips,
  totalDuration,
  onClipsChange,
  onClipSelect,
  selectedClipId,
  playheadPosition = 0,
  onPlayheadChange,
  onApplyAutoZoom,
}: TimelineEditorProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const [draggingClip, setDraggingClip] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(() => {
    if (totalDuration > 1800) return 2;
    if (totalDuration > 300) return 8;
    return 40;
  });
  const [rippleMode, setRippleMode] = useState(true);
  const [magnetSnap, setMagnetSnap] = useState(true);

  const timelineRef = useRef<HTMLDivElement>(null);
  const activeClipId = selectedClipId || internalSelectedId;

  const timelineWidth = Math.max(800, Math.round(totalDuration * pixelsPerSecond));

  // Fit timeline to screen width
  const handleFitTimeline = useCallback(() => {
    if (timelineRef.current && totalDuration > 0) {
      const containerWidth = Math.max(600, timelineRef.current.clientWidth - 40);
      const optimalPps = Math.max(0.5, Math.min(100, Math.round((containerWidth / totalDuration) * 10) / 10));
      setPixelsPerSecond(optimalPps);
      toast.info(`Línea de tiempo ajustada a pantalla (${optimalPps}px/s)`);
    }
  }, [totalDuration]);

  // 1. SPLIT BLADE TOOL (Cuchilla con tecla S o Boton)
  const handleSplitAtPlayhead = useCallback(() => {
    const targetClip = clips.find(c => {
      if (activeClipId && c.id === activeClipId) return true;
      return playheadPosition > c.startTime && playheadPosition < (c.startTime + c.duration);
    });

    if (!targetClip) {
      toast.info('Coloca la aguja sobre un clip para cortarlo');
      return;
    }

    if (playheadPosition <= targetClip.startTime || playheadPosition >= (targetClip.startTime + targetClip.duration)) {
      toast.info('La aguja debe estar dentro del clip para dividirlo');
      return;
    }

    const cutPoint = playheadPosition;
    const firstDuration = parseFloat((cutPoint - targetClip.startTime).toFixed(2));
    const secondDuration = parseFloat((targetClip.duration - firstDuration).toFixed(2));

    if (firstDuration < 0.2 || secondDuration < 0.2) {
      toast.error('El fragmento resultante es demasiado corto para dividir');
      return;
    }

    const clip1: TimelineClip = {
      ...targetClip,
      duration: firstDuration,
    };

    const clip2: TimelineClip = {
      ...targetClip,
      id: `${targetClip.id}_part2_${Date.now()}`,
      name: `${targetClip.name} (Parte 2)`,
      startTime: cutPoint,
      duration: secondDuration,
    };

    const updated = clips.flatMap(c => c.id === targetClip.id ? [clip1, clip2] : [c]);
    onClipsChange?.(updated);
    setInternalSelectedId(clip2.id);
    onClipSelect?.(clip2.id);
    toast.success(`Corte realizado en ${cutPoint.toFixed(1)}s (Cuchilla Split)`);
  }, [clips, activeClipId, playheadPosition, onClipsChange, onClipSelect]);

  // 2. RIPPLE DELETE
  const handleDeleteClip = useCallback((clipId: string) => {
    const clipToDelete = clips.find(c => c.id === clipId);
    if (!clipToDelete) return;

    let updatedClips: TimelineClip[];

    if (rippleMode) {
      updatedClips = clips
        .filter(c => c.id !== clipId)
        .map(c => {
          if (c.type === clipToDelete.type && c.startTime > clipToDelete.startTime) {
            return {
              ...c,
              startTime: Math.max(0, parseFloat((c.startTime - clipToDelete.duration).toFixed(2))),
            };
          }
          return c;
        });
      toast.success('Clip eliminado con Ripple Delete (hueco cerrado)');
    } else {
      updatedClips = clips.filter(c => c.id !== clipId);
      toast.success('Clip eliminado');
    }

    onClipsChange?.(updatedClips);
    if (activeClipId === clipId) {
      setInternalSelectedId(null);
    }
  }, [clips, rippleMode, onClipsChange, activeClipId]);

  // Hotkeys: 'S' = Split, 'Delete' / 'Backspace' = Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSplitAtPlayhead();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeClipId) {
          e.preventDefault();
          handleDeleteClip(activeClipId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSplitAtPlayhead, handleDeleteClip, activeClipId]);

  // Dragging & Magnetic Snapping
  const handleDragStart = useCallback((clipId: string, e: React.MouseEvent) => {
    setDraggingClip(clipId);
    setInternalSelectedId(clipId);
    onClipSelect?.(clipId);
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      setDragOffset(e.clientX - clip.startTime * pixelsPerSecond);
    }
  }, [clips, pixelsPerSecond, onClipSelect]);

  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggingClip || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset;
    let newStartTime = Math.max(0, Math.round((x / pixelsPerSecond) * 10) / 10);

    // Magnetic Snapping
    if (magnetSnap) {
      const snapPoints = [0, playheadPosition];
      clips.forEach(c => {
        if (c.id !== draggingClip) {
          snapPoints.push(c.startTime);
          snapPoints.push(c.startTime + c.duration);
        }
      });

      const currentClip = clips.find(c => c.id === draggingClip);
      for (const pt of snapPoints) {
        if (Math.abs(newStartTime - pt) < 0.35) {
          newStartTime = pt;
          break;
        }
        if (currentClip && Math.abs((newStartTime + currentClip.duration) - pt) < 0.35) {
          newStartTime = Math.max(0, pt - currentClip.duration);
          break;
        }
      }
    }

    const updatedClips = clips.map(c =>
      c.id === draggingClip ? { ...c, startTime: parseFloat(newStartTime.toFixed(2)) } : c,
    );

    onClipsChange?.(updatedClips);
  }, [draggingClip, dragOffset, clips, pixelsPerSecond, magnetSnap, playheadPosition, onClipsChange]);

  const handleDragEnd = useCallback(() => {
    setDraggingClip(null);
    setDragOffset(0);
  }, []);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (draggingClip) return;
    const target = e.target as HTMLElement;
    if (target.closest('.cursor-move') || target.closest('button')) return;

    if (!timelineRef.current || !onPlayheadChange) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const seekTime = Math.max(0, Math.min(totalDuration, x / pixelsPerSecond));
    onPlayheadChange(parseFloat(seekTime.toFixed(1)));
  }, [draggingClip, totalDuration, pixelsPerSecond, onPlayheadChange]);

  const groupedByType = {
    video: clips.filter(c => c.type === 'video'),
    audio: clips.filter(c => c.type === 'audio'),
    text: clips.filter(c => c.type === 'text'),
    transition: clips.filter(c => c.type === 'transition'),
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
      {/* ── TOOLBAR SUPERIOR DEL TIMELINE (ESTILO CAPCUT / PREMIERE) ── */}
      <CardHeader className="pb-2 pt-3 px-4 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm text-white font-bold flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-teal-400" />
              Línea de Tiempo Profesional
            </CardTitle>
            <Badge className="text-[10px] bg-slate-800 text-teal-300 border-slate-700 font-mono">
              {clips.length} clips • {formatDurationBadge(totalDuration)} ({totalDuration}s)
            </Badge>
          </div>

          {/* Quick Editing Tools */}
          <div className="flex items-center gap-1.5">
            {/* Split Blade Button */}
            <Button
              size="sm"
              onClick={handleSplitAtPlayhead}
              className="h-7 px-2.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
              title="Dividir clip en el cabezal (Tecla S)"
            >
              <Scissors className="w-3 h-3 mr-1 text-teal-400" />
              Dividir (S)
            </Button>

            {/* Ripple Edit Toggle */}
            <Button
              size="sm"
              variant={rippleMode ? 'default' : 'outline'}
              onClick={() => setRippleMode(r => !r)}
              className={cn(
                'h-7 px-2 text-[11px] font-semibold cursor-pointer',
                rippleMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'text-slate-400'
              )}
              title="Al eliminar un clip, mueve los siguientes para cerrar huecos"
            >
              <Layers className="w-3 h-3 mr-1" />
              Ripple {rippleMode ? 'ON' : 'OFF'}
            </Button>

            {/* Magnetic Snapping Toggle */}
            <Button
              size="sm"
              variant={magnetSnap ? 'default' : 'outline'}
              onClick={() => setMagnetSnap(m => !m)}
              className={cn(
                'h-7 px-2 text-[11px] font-semibold cursor-pointer',
                magnetSnap ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'text-slate-400'
              )}
              title="Atracción magnética entre clips"
            >
              <Magnet className="w-3 h-3 mr-1" />
              Imán
            </Button>

            {/* Auto Punch-in Zoom IA */}
            {onApplyAutoZoom && (
              <Button
                size="sm"
                onClick={onApplyAutoZoom}
                className="h-7 px-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[11px] font-semibold cursor-pointer"
              >
                <Sparkles className="w-3 h-3 mr-1 text-purple-400" />
                Auto-Zoom IA
              </Button>
            )}

            {/* Fit to screen */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleFitTimeline}
              className="h-7 px-2 text-[11px] text-teal-300 border-teal-500/30 hover:bg-teal-950/40 cursor-pointer"
              title="Ajustar toda la duración a la pantalla"
            >
              <Maximize2 className="w-3 h-3 mr-1" />
              Ajustar
            </Button>

            {/* Zoom Slider / Controls */}
            <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-800">
              <button
                onClick={() => setPixelsPerSecond(p => Math.max(1, p <= 4 ? p - 0.5 : p <= 15 ? p - 3 : p - 10))}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Reducir zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 w-9 text-center">
                {pixelsPerSecond < 10 ? pixelsPerSecond.toFixed(1) : Math.round(pixelsPerSecond)}px
              </span>
              <button
                onClick={() => setPixelsPerSecond(p => Math.min(100, p < 4 ? p + 0.5 : p < 15 ? p + 3 : p + 10))}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-3">
        <div
          ref={timelineRef}
          className="relative overflow-x-auto overflow-y-hidden cursor-pointer pb-2 select-none"
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onClick={handleTimelineClick}
        >
          {/* High-Performance Dynamic Time ruler (optimized for up to 60-min content) */}
          <div className="flex items-center mb-2 border-b border-slate-700/80 pb-1 h-6 relative" style={{ width: timelineWidth }}>
            {(() => {
              const tickStep = getTickStep(totalDuration, pixelsPerSecond);
              const tickCount = Math.floor(totalDuration / tickStep);
              const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickStep);

              return ticks.map((t) => (
                <div
                  key={t}
                  className="absolute flex flex-col items-start"
                  style={{ left: Math.round(t * pixelsPerSecond) }}
                >
                  <div className="h-1.5 w-px bg-slate-600 mb-0.5" />
                  <span className="text-[10px] font-mono text-slate-400 select-none -translate-x-1">
                    {formatRulerTick(t)}
                  </span>
                </div>
              ));
            })()}
          </div>

          {/* Tracks */}
          <div className="space-y-2 relative" style={{ width: timelineWidth }}>
            {(['video', 'audio', 'text', 'transition'] as const).map((trackType) => {
              const trackClips = groupedByType[trackType];
              const Icon = TRACK_ICONS[trackType];

              return (
                <div key={trackType} className="relative h-12 bg-slate-950/60 border border-slate-800/60 rounded-lg">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-60">
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>

                  {trackClips.map((clip) => {
                    const isSelected = activeClipId === clip.id;
                    return (
                      <div
                        key={clip.id}
                        className={cn(
                          'absolute h-10 rounded-md border cursor-move flex items-center px-2 text-xs transition-shadow',
                          TRACK_COLORS[clip.type],
                          isSelected && 'ring-2 ring-teal-400 shadow-md shadow-teal-500/20 z-10',
                          draggingClip === clip.id && 'opacity-70 z-20',
                        )}
                        style={{
                          left: clip.startTime * pixelsPerSecond,
                          width: Math.max(24, clip.duration * pixelsPerSecond),
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInternalSelectedId(clip.id);
                          onClipSelect?.(clip.id);
                        }}
                        onMouseDown={(e) => handleDragStart(clip.id, e)}
                      >
                        <GripVertical className="w-3 h-3 mr-1 opacity-50 shrink-0" />
                        <span className="truncate font-semibold text-[11px] text-white">{clip.name}</span>
                        {clip.muted && (
                          <Badge className="ml-auto text-[9px] bg-red-500/20 text-red-400 border-red-500/30">
                            Muted
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/20 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClip(clip.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
            style={{ left: playheadPosition * pixelsPerSecond }}
          >
            <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
