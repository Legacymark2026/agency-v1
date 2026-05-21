'use client';

import { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AudioWaveformProps {
  audioUrl?: string;
  duration: number;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
}

export function AudioWaveform({ audioUrl, duration, volume = 80, onVolumeChange }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const bars = 100;
    const barWidth = width / bars - 2;

    for (let i = 0; i < bars; i++) {
      const barHeight = Math.random() * height * 0.8 + height * 0.1;
      const x = i * (barWidth + 2);
      const y = (height - barHeight) / 2;

      const progress = i / bars;
      const isActive = progress <= currentTime / duration;

      ctx.fillStyle = isActive ? 'rgba(20, 184, 166, 0.8)' : 'rgba(100, 116, 139, 0.4)';
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [currentTime, duration]);

  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - currentTime * 1000;

      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= duration) {
          setIsPlaying(false);
          setCurrentTime(0);
          return;
        }
        setCurrentTime(elapsed);
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-purple-400" />
          Audio Waveform
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          <canvas
            ref={canvasRef}
            width={600}
            height={80}
            className="w-full h-20 bg-slate-900/50 rounded-lg"
          />

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-slate-400 hover:text-white"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={([v]) => onVolumeChange?.(v)}
              max={100}
              step={1}
              className="flex-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
