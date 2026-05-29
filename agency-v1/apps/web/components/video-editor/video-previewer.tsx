'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, Film } from 'lucide-react';
import { useEditorStore } from '@/lib/stores/editor-store';
import type { TextOverlay, ColorGrade, Clip } from '@/actions/video-editor';
import { cn } from '@/lib/utils';

interface VideoPreviewerProps {
  totalDuration: number;
}

export function VideoPreviewer({ totalDuration }: VideoPreviewerProps) {
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const playheadPosition = useEditorStore((s) => s.playheadPosition);
  const setPlayheadPosition = useEditorStore((s) => s.setPlayheadPosition);
  const textOverlays = useEditorStore((s) => s.textOverlays);
  const colorGrades = useEditorStore((s) => s.colorGrades);
  const clips = useEditorStore((s) => s.clips);

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setPlayheadPosition(playheadPosition + 0.1 >= totalDuration ? 0 : playheadPosition + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playheadPosition, totalDuration, setPlayheadPosition]);

  // Find the active clip and its color grade
  const activeClip = clips.find(
    (c) =>
      playheadPosition >= (c.startTime || 0) &&
      playheadPosition <= (c.startTime || 0) + (c.duration || 5)
  );

  const activeGrade = colorGrades.find((g) => g.clipId === activeClip?.id) || colorGrades[0];

  // Map active grade parameters to CSS filters
  const getFilterStyle = (grade?: ColorGrade) => {
    if (!grade) return {};
    const contrast = grade.contrast !== undefined ? grade.contrast : 1;
    const saturation = grade.saturation !== undefined ? grade.saturation : 1;
    
    let sepia = 0;
    let hueRotate = 0;
    if (grade.temperature) {
      if (grade.temperature < 5500) {
        sepia = Math.min(0.5, (5500 - grade.temperature) / 4000);
        hueRotate = -((5500 - grade.temperature) / 200);
      } else if (grade.temperature > 5500) {
        hueRotate = (grade.temperature - 5500) / 200;
      }
    }

    let brightness = 1;
    if (grade.style === 'cinematic') {
      brightness = 0.92;
    } else if (grade.style === 'luxury') {
      brightness = 1.05;
    } else if (grade.style === 'viral') {
      brightness = 1.12;
    } else if (grade.style === 'corporate') {
      brightness = 0.98;
    } else if (grade.style === 'warm-artisan') {
      brightness = 1.02;
    }

    return {
      filter: `contrast(${contrast}) saturate(${saturation}) sepia(${sepia}) hue-rotate(${hueRotate}deg) brightness(${brightness})`,
    };
  };

  const filterStyle = getFilterStyle(activeGrade);

  // Active subtitles synced to playhead
  const activeSubtitles = textOverlays.filter(
    (o) =>
      playheadPosition >= (o.startTime || 0) &&
      playheadPosition <= (o.startTime || 0) + (o.duration || 3)
  );

  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden flex flex-col h-full">
      {/* Viewport container */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden min-h-[220px]">
        {/* Abstract animated gradient canvas representing video footage */}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-300 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900",
            isPlaying && "animate-pulse"
          )}
          style={filterStyle}
        >
          {/* Animated decorative patterns to simulate video action */}
          <div className="absolute inset-0 flex items-center justify-center opacity-25">
            <div className={cn(
              "w-48 h-48 rounded-full bg-teal-500/10 blur-3xl transition-transform duration-1000",
              isPlaying ? "scale-150 rotate-180" : "scale-100"
            )} />
            <div className={cn(
              "w-72 h-72 rounded-full bg-purple-500/10 blur-3xl transition-transform duration-1000 ml-12",
              isPlaying ? "scale-125 -rotate-90" : "scale-100"
            )} />
          </div>
          
          {/* Grid lines to represent canvas */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
        </div>

        {/* Cinematic Clip Details Watermark */}
        <div className="absolute top-3 left-3 text-[10px] text-slate-500 bg-slate-950/60 backdrop-blur-xs px-2 py-0.5 rounded flex items-center gap-1.5 z-10">
          <Film className="w-3.5 h-3.5 text-teal-400" />
          <span>{activeClip ? `CLIP: ${activeClip.type.toUpperCase()}` : 'FOOTAGE'}</span>
          {activeGrade && (
            <>
              <span className="text-slate-700">|</span>
              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
              <span className="text-purple-400">{activeGrade.style?.toUpperCase() || 'LUT'}</span>
            </>
          )}
        </div>

        {/* Subtitle overlays */}
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-20">
          {/* Top subtitle */}
          <div className="h-10 flex items-center justify-center">
            {activeSubtitles
              .filter((o) => o.position === 'top')
              .map((o) => (
                <div
                  key={o.id}
                  className="px-3 py-1 bg-black/60 rounded text-center text-sm font-semibold max-w-[90%] shadow-lg border border-white/5 animate-fade-in"
                  style={{ color: o.color || '#FFFFFF', fontFamily: o.font || 'Inter' }}
                >
                  {o.text}
                </div>
              ))}
          </div>

          {/* Center subtitle */}
          <div className="flex-1 flex items-center justify-center">
            {activeSubtitles
              .filter((o) => o.position === 'center' || !o.position)
              .map((o) => (
                <div
                  key={o.id}
                  className="px-4 py-1.5 bg-black/70 rounded text-center text-base font-bold max-w-[90%] shadow-xl border border-white/10 animate-fade-in"
                  style={{ color: o.color || '#FFFFFF', fontFamily: o.font || 'Inter' }}
                >
                  {o.text}
                </div>
              ))}
          </div>

          {/* Bottom subtitle */}
          <div className="h-10 flex items-center justify-center">
            {activeSubtitles
              .filter((o) => o.position === 'bottom')
              .map((o) => (
                <div
                  key={o.id}
                  className="px-3 py-1 bg-black/60 rounded text-center text-sm font-semibold max-w-[90%] shadow-lg border border-white/5 animate-fade-in"
                  style={{ color: o.color || '#FFFFFF', fontFamily: o.font || 'Inter' }}
                >
                  {o.text}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
        {/* Playhead slider */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-mono w-8">
            {playheadPosition.toFixed(1)}s
          </span>
          <Slider
            value={[playheadPosition]}
            onValueChange={([val]) => setPlayheadPosition(parseFloat(val.toFixed(1)))}
            min={0}
            max={totalDuration}
            step={0.1}
            className="flex-1 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 font-mono w-8 text-right">
            {totalDuration.toFixed(1)}s
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-teal-400" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </Button>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-slate-300" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={([val]) => {
                  setVolume(val);
                  if (val > 0) setIsMuted(false);
                }}
                min={0}
                max={100}
                step={5}
                className="w-16 cursor-pointer"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Maximize2 className="w-4 h-4 text-slate-400" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
