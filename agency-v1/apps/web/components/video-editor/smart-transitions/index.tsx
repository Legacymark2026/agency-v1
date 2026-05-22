'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Film,
  Sparkles,
  Play,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRightLeft,
  Split,
  Blend,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransitionSuggestion {
  id: string;
  type: 'dissolve' | 'fade' | 'wipe' | 'slide' | 'zoom' | 'glitch' | 'morph' | 'lightLeak';
  fromClip: string;
  toClip: string;
  confidence: number;
  reason: string;
  duration: number;
  previewUrl?: string;
}

interface SmartTransitionsPanelProps {
  suggestions?: TransitionSuggestion[];
  onApply?: (transitionId: string) => void;
  onReject?: (transitionId: string) => void;
  onGenerate?: () => void;
  onPreview?: (transitionId: string) => void;
  isGenerating?: boolean;
}

const transitionIcons: Record<string, typeof Blend> = {
  dissolve: Blend,
  fade: Split,
  wipe: ArrowRightLeft,
  slide: ArrowRightLeft,
  zoom: Sparkles,
  glitch: RefreshCw,
  morph: Blend,
  lightLeak: Sparkles,
};

const transitionColors: Record<string, string> = {
  dissolve: 'text-blue-400 border-blue-500/30',
  fade: 'text-purple-400 border-purple-500/30',
  wipe: 'text-emerald-400 border-emerald-500/30',
  slide: 'text-cyan-400 border-cyan-500/30',
  zoom: 'text-amber-400 border-amber-500/30',
  glitch: 'text-rose-400 border-rose-500/30',
  morph: 'text-indigo-400 border-indigo-500/30',
  lightLeak: 'text-orange-400 border-orange-500/30',
};

const transitionNames: Record<string, string> = {
  dissolve: 'Disolvencia',
  fade: 'Fundido',
  wipe: 'Cortinilla',
  slide: 'Deslizamiento',
  zoom: 'Zoom',
  glitch: 'Glitch',
  morph: 'Morfosis',
  lightLeak: 'Fuga de luz',
};

export function SmartTransitionsPanel({
  suggestions = [],
  onApply,
  onReject,
  onGenerate,
  onPreview,
  isGenerating = false,
}: SmartTransitionsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [transitionDuration, setTransitionDuration] = useState(0.5);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const handleApply = useCallback(
    (id: string) => {
      onApply?.(id);
      setAppliedIds((prev) => new Set(prev).add(id));
    },
    [onApply],
  );

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            Transiciones Inteligentes
          </CardTitle>
          <Button
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating}
            className={cn(
              'text-xs',
              isGenerating
                ? 'bg-slate-700 text-slate-400'
                : 'bg-amber-600 hover:bg-amber-700',
            )}
          >
            {isGenerating ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 mr-1" />
            )}
            {isGenerating ? 'Analizando...' : 'Analizar'}
          </Button>
        </div>
        <CardDescription className="text-slate-400">
          Transiciones sugeridas por IA entre clips
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        <div>
          <Label className="text-xs text-slate-400">Duración predeterminada</Label>
          <div className="flex items-center gap-3 mt-1">
            <Slider
              value={[transitionDuration]}
              onValueChange={([v]) => setTransitionDuration(v)}
              min={0.1}
              max={2}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-slate-300 min-w-[40px]">
              {transitionDuration.toFixed(1)}s
            </span>
          </div>
        </div>

        {suggestions.length > 0 ? (
          <ScrollArea className="max-h-80">
            <div className="space-y-2">
              {suggestions.map((suggestion) => {
                const Icon = transitionIcons[suggestion.type] || Blend;
                const color = transitionColors[suggestion.type] || 'text-slate-400';

                return (
                  <Card
                    key={suggestion.id}
                    className={cn(
                      'bg-slate-900/50 border transition-all',
                      expandedId === suggestion.id
                        ? 'border-amber-500/50'
                        : 'border-slate-700/50 hover:border-slate-600',
                      appliedIds.has(suggestion.id) && 'border-emerald-500/30 opacity-60',
                    )}
                  >
                    <CardHeader
                      className="p-3 pb-2 cursor-pointer"
                      onClick={() =>
                        setExpandedId(
                          expandedId === suggestion.id ? null : suggestion.id,
                        )
                      }
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', color.split(' ')[0])} />
                        <Badge variant="outline" className={cn('text-[10px]', color)}>
                          {transitionNames[suggestion.type]}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs truncate">
                            {suggestion.fromClip.slice(0, 8)} →{' '}
                            {suggestion.toClip.slice(0, 8)}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {suggestion.duration.toFixed(1)}s
                        </span>
                        <div
                          className={cn(
                            'text-xs font-mono',
                            suggestion.confidence >= 80
                              ? 'text-emerald-400'
                              : suggestion.confidence >= 60
                                ? 'text-amber-400'
                                : 'text-red-400',
                          )}
                        >
                          {suggestion.confidence}%
                        </div>
                      </div>
                    </CardHeader>

                    {expandedId === suggestion.id && (
                      <CardContent className="px-3 pb-3 pt-1">
                        <p className="text-xs text-slate-400 mb-3">
                          {suggestion.reason}
                        </p>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApply(suggestion.id)}
                            disabled={appliedIds.has(suggestion.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {appliedIds.has(suggestion.id) ? 'Aplicada' : 'Aplicar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onPreview?.(suggestion.id)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs h-8"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Vista previa
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReject?.(suggestion.id)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8"
                          >
                            <XCircle className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <Film className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Sin sugerencias de transiciones</p>
            <p className="text-slate-600 text-xs mt-1">
              Analiza los clips para recibir recomendaciones
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
