'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Film, Clock, Scissors, Zap, Play, Layers, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Clip, ProjectConfig, Timeline, TimelineSegment } from '@/actions/video-editor';

interface TimelineGeneratorProps {
  clips: Clip[];
  config: ProjectConfig;
  timeline: Timeline | null;
  onTimelineGenerated: (timeline: Timeline) => void;
}

export function TimelineGenerator({ clips, config, timeline, onTimelineGenerated }: TimelineGeneratorProps) {
  const hasAnalysis = clips.length > 0;
  const hasConfig = !!config.type && !!config.format && !!config.style && !!config.platform;

  // Calculate timeline when we have clips and config
  const generatedTimeline = useMemo(() => {
    if (!hasAnalysis || !hasConfig) return null;
    
    // AI Tier processing variables
    const aiTier = config.aiTier || 'skill';
    const complexityMultiplier = 
      aiTier === 'prompt' ? 1 : 
      aiTier === 'skill' ? 2 : 
      aiTier === 'skill-chain' ? 3 : 
      aiTier === 'agent' ? 4 : 5;

    const heroClips = clips.filter(c => c.type === 'hero' || c.quality === 'excellent');
    const hookClip = heroClips[0] || clips[0];
    const bodyClips = clips.filter(c => c.type !== 'hero');
    const rewardClips = clips.filter(c => c.type === 'branding');

    // Strict config application
    const hookDuration = config.hookDuration || 3;
    let bodyDuration = Math.max(bodyClips.length * (config.rhythm === 'fast' ? 1.5 : config.rhythm === 'cinematic' ? 5 : 3), 6);
    let climaxDuration = Math.max(rewardClips.length * 2.5, 4);
    const outroDuration = 2;

    // Agent Optimization: strictly fit to requested total duration if Agent or Agent Team
    if (aiTier === 'agent' || aiTier === 'agent-team') {
      const targetDuration = config.duration || 20;
      const currentTotal = hookDuration + bodyDuration + climaxDuration + outroDuration;
      if (currentTotal > targetDuration) {
        const excess = currentTotal - targetDuration;
        bodyDuration = Math.max(bodyDuration - (excess * 0.7), 2);
        climaxDuration = Math.max(climaxDuration - (excess * 0.3), 1);
      }
    }

    const transitions = aiTier === 'prompt' ? bodyClips.map(() => 'cut') :
                        aiTier === 'skill' ? bodyClips.map((_, i) => i % 2 === 0 ? 'cut' : 'fade') :
                        bodyClips.map((_, i) => i % 3 === 0 ? 'zoom' : i % 2 === 0 ? 'whip' : 'cut');

    const timelineData: Timeline = {
      segments: {
        hook: {
          clips: hookClip ? [hookClip] : [],
          duration: hookDuration,
          type: 'hook',
          transitions: ['none'],
          speedRamp: complexityMultiplier > 2 ? { start: 30, end: 50, duration: hookDuration } : undefined
        },
        body: {
          clips: bodyClips,
          duration: bodyDuration,
          type: 'body',
          transitions: transitions,
          speedRamp: complexityMultiplier > 3 ? { start: 100, end: 150, duration: 2 } : undefined
        },
        climax: {
          clips: rewardClips,
          duration: climaxDuration,
          type: 'climax',
          transitions: complexityMultiplier > 1 ? ['flash'] : ['cut'],
          emphasis: true
        },
        outro: {
          clips: [],
          duration: outroDuration,
          type: 'outro',
          transitions: ['fade'],
          fadeToBlack: true
        }
      },
      totalDuration: hookDuration + bodyDuration + climaxDuration + outroDuration,
      cuts: ((hookClip ? 1 : 0) + bodyClips.length + rewardClips.length) * (complexityMultiplier > 3 ? 1.5 : 1),
      averageCutDuration: (hookDuration + bodyDuration + climaxDuration) / (((hookClip ? 1 : 0) + bodyClips.length + rewardClips.length || 1) * (complexityMultiplier > 3 ? 1.5 : 1))
    };

    return timelineData;
  }, [clips, config, hasAnalysis, hasConfig]);

  const handleGenerate = () => {
    if (generatedTimeline) {
      onTimelineGenerated(generatedTimeline);
    }
  };

  const getSegmentColor = (type: TimelineSegment['type']) => {
    switch (type) {
      case 'hook': return 'bg-red-500';
      case 'body': return 'bg-blue-500';
      case 'climax': return 'bg-amber-500';
      case 'outro': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  if (!hasAnalysis) {
    return (
      <Card className="bg-slate-800/30 border-slate-700 border-dashed">
        <CardContent className="py-12 text-center">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Sube y analiza clips de video primero</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasConfig) {
    return (
      <Card className="bg-slate-800/30 border-slate-700 border-dashed">
        <CardContent className="py-12 text-center">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Configura el proyecto primero</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Duración Total</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {generatedTimeline?.totalDuration || 0}s
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Scissors className="w-4 h-4" />
              <span className="text-xs">Cortes</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {generatedTimeline?.cuts || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Promedio/Corte</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {generatedTimeline?.averageCutDuration.toFixed(1) || 0}s
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs">Clips Usados</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {clips.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Timeline */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" />
            Timeline Generado
          </CardTitle>
          <CardDescription className="text-slate-400">
            Estructura automática basada en análisis de footage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Timeline Visualization */}
          <div className="relative h-24 bg-slate-900 rounded-lg overflow-hidden mb-6">
            <div className="absolute inset-0 flex">
              {generatedTimeline && (
                <>
                  {/* Hook Segment */}
                  <div 
                    className={cn("h-full flex items-center justify-center text-xs font-medium", getSegmentColor('hook'))}
                    style={{ width: `${(generatedTimeline.segments.hook.duration / generatedTimeline.totalDuration) * 100}%` }}
                  >
                    <span className="text-white/90">HOOK {generatedTimeline.segments.hook.duration}s</span>
                  </div>
                  {/* Body Segment */}
                  <div 
                    className={cn("h-full flex items-center justify-center text-xs font-medium border-l border-white/10", getSegmentColor('body'))}
                    style={{ width: `${(generatedTimeline.segments.body.duration / generatedTimeline.totalDuration) * 100}%` }}
                  >
                    <span className="text-white/90">BODY {generatedTimeline.segments.body.duration}s</span>
                  </div>
                  {/* Climax Segment */}
                  <div 
                    className={cn("h-full flex items-center justify-center text-xs font-medium border-l border-white/10", getSegmentColor('climax'))}
                    style={{ width: `${(generatedTimeline.segments.climax.duration / generatedTimeline.totalDuration) * 100}%` }}
                  >
                    <span className="text-white/90">CLIMAX {generatedTimeline.segments.climax.duration}s</span>
                  </div>
                  {/* Outro Segment */}
                  <div 
                    className={cn("h-full flex items-center justify-center text-xs font-medium border-l border-white/10", getSegmentColor('outro'))}
                    style={{ width: `${(generatedTimeline.segments.outro.duration / generatedTimeline.totalDuration) * 100}%` }}
                  >
                    <span className="text-white/90">OUTRO {generatedTimeline.segments.outro.duration}s</span>
                  </div>
                </>
              )}
            </div>
            {/* Time markers */}
            <div className="absolute bottom-0 left-0 right-0 h-4 border-t border-slate-700 flex text-[10px] text-slate-500">
              <span className="pl-2">0s</span>
              <span className="flex-1 text-center">15s</span>
              <span className="pr-2">{generatedTimeline?.totalDuration}s</span>
            </div>
          </div>

          {/* Segment Details */}
          <div className="space-y-4">
            {generatedTimeline && Object.entries(generatedTimeline.segments).map(([key, segment]) => (
              <div key={key} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", getSegmentColor(segment.type as any))} />
                    <span className="text-white font-medium capitalize">{segment.type}</span>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {segment.duration}s
                    </Badge>
                  </div>
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    {segment.transitions.join(', ')}
                  </Badge>
                </div>
                
                {segment.clips.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {segment.clips.map((clip, i) => (
                      <div key={clip.id} className="flex items-center gap-2 px-2 py-1 bg-slate-800 rounded text-xs">
                        <Film className="w-3 h-3 text-teal-400" />
                        <span className="text-slate-300">{clip.type}</span>
                        <span className="text-slate-500">{clip.duration}s</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Sin clips asignados</p>
                )}

                {segment.type === 'hook' && segment.speedRamp && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Speed Ramp: {segment.speedRamp.start}% → {segment.speedRamp.end}%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {timeline !== generatedTimeline && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Aplicar Timeline
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}