'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Plus, Film, Music, Type, Palette, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineClip {
  id: string;
  type: 'video' | 'audio' | 'text' | 'transition';
  name: string;
  startTime: number;
  duration: number;
  color: string;
  muted?: boolean;
}

interface TimelineEditorProps {
  clips: TimelineClip[];
  totalDuration: number;
  onClipsChange?: (clips: TimelineClip[]) => void;
  onClipSelect?: (clipId: string) => void;
  selectedClipId?: string;
  playheadPosition?: number;
  onPlayheadChange?: (pos: number) => void;
}

const TRACK_COLORS = {
  video: 'bg-teal-500/30 border-teal-500/50',
  audio: 'bg-purple-500/30 border-purple-500/50',
  text: 'bg-amber-500/30 border-amber-500/50',
  transition: 'bg-rose-500/30 border-rose-500/50',
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
}: TimelineEditorProps) {
  const [draggingClip, setDraggingClip] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const pixelsPerSecond = 50;
  const timelineWidth = totalDuration * pixelsPerSecond;

  const handleDragStart = useCallback((clipId: string, e: React.MouseEvent) => {
    setDraggingClip(clipId);
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      setDragOffset(e.clientX - clip.startTime * pixelsPerSecond);
    }
  }, [clips, pixelsPerSecond]);

  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggingClip || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset;
    const newStartTime = Math.max(0, Math.round(x / pixelsPerSecond * 2) / 2);

    const updatedClips = clips.map(c =>
      c.id === draggingClip ? { ...c, startTime: newStartTime } : c,
    );

    onClipsChange?.(updatedClips);
  }, [draggingClip, dragOffset, clips, pixelsPerSecond, onClipsChange]);

  const handleDragEnd = useCallback(() => {
    setDraggingClip(null);
    setDragOffset(0);
  }, []);

  const handleDeleteClip = useCallback((clipId: string) => {
    onClipsChange?.(clips.filter(c => c.id !== clipId));
  }, [clips, onClipsChange]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    // Avoid seeking if clicking directly on a clip, button, or while dragging
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
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Scissors className="w-5 h-5 text-teal-400" />
            Timeline
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
              {clips.length} clips
            </Badge>
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
              {totalDuration}s
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div
          ref={timelineRef}
          className="relative overflow-x-auto overflow-y-hidden cursor-pointer"
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onClick={handleTimelineClick}
        >
          {/* Time ruler */}
          <div className="flex items-center mb-2 border-b border-slate-700 pb-1 h-6 relative" style={{ width: timelineWidth }}>
            {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-[10px] text-slate-500"
                style={{ left: i * pixelsPerSecond }}
              >
                {i}s
              </div>
            ))}
          </div>

          {/* Tracks */}
          <div className="space-y-2 relative" style={{ width: timelineWidth }}>
            {(['video', 'audio', 'text', 'transition'] as const).map((trackType) => {
              const trackClips = groupedByType[trackType];
              const Icon = TRACK_ICONS[trackType];

              return (
                <div key={trackType} className="relative h-12 bg-slate-900/50 rounded-lg">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>

                  {trackClips.map((clip) => (
                    <div
                      key={clip.id}
                      className={cn(
                        'absolute h-10 rounded-md border cursor-move flex items-center px-2 text-xs',
                        TRACK_COLORS[clip.type],
                        selectedClipId === clip.id && 'ring-2 ring-white/50',
                        draggingClip === clip.id && 'opacity-70 z-20',
                      )}
                      style={{
                        left: clip.startTime * pixelsPerSecond,
                        width: clip.duration * pixelsPerSecond,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClipSelect?.(clip.id);
                      }}
                      onMouseDown={(e) => handleDragStart(clip.id, e)}
                    >
                      <GripVertical className="w-3 h-3 mr-1 opacity-50" />
                      <span className="truncate">{clip.name}</span>
                      {clip.muted && (
                        <Badge className="ml-auto text-[9px] bg-red-500/20 text-red-400 border-red-500/30">
                          Muted
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClip(clip.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none transition-all duration-75"
            style={{ left: playheadPosition * pixelsPerSecond }}
          >
            <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
