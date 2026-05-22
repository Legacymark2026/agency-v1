'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Palette,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sun,
  Contrast,
  Droplets,
  Thermometer,
  Layers,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorMatchSuggestion {
  id: string;
  sourceClip: string;
  targetClip: string;
  adjustments: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    temperature?: number;
    tint?: number;
    highlights?: number;
    shadows?: number;
    exposure?: number;
  };
  confidence: number;
  reason: string;
}

interface ColorMatchPanelProps {
  suggestions?: ColorMatchSuggestion[];
  onApply?: (suggestionId: string) => void;
  onReject?: (suggestionId: string) => void;
  onAnalyze?: () => void;
  onPreview?: (suggestionId: string) => void;
  isAnalyzing?: boolean;
}

export function ColorMatchPanel({
  suggestions = [],
  onApply,
  onReject,
  onAnalyze,
  onPreview,
  isAnalyzing = false,
}: ColorMatchPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleApply = useCallback(
    (id: string) => {
      onApply?.(id);
      setAppliedIds((prev) => new Set(prev).add(id));
    },
    [onApply],
  );

  const adjustmentLabels: Record<string, string> = {
    brightness: 'Brillo',
    contrast: 'Contraste',
    saturation: 'Saturación',
    temperature: 'Temperatura',
    tint: 'Tinte',
    highlights: 'Altas luces',
    shadows: 'Sombras',
    exposure: 'Exposición',
  };

  const adjustmentIcons: Record<string, typeof Sun> = {
    brightness: Sun,
    contrast: Contrast,
    saturation: Droplets,
    temperature: Thermometer,
    tint: Palette,
    highlights: Sun,
    shadows: Layers,
    exposure: Eye,
  };

  const getAdjustmentColor = (value: number) => {
    if (Math.abs(value) < 5) return 'text-slate-500';
    if (value > 0) return 'text-emerald-400';
    return 'text-amber-400';
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            Color Match
          </CardTitle>
          <Button
            size="sm"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className={cn(
              'text-xs',
              isAnalyzing
                ? 'bg-slate-700 text-slate-400'
                : 'bg-purple-600 hover:bg-purple-700',
            )}
          >
            {isAnalyzing ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 mr-1" />
            )}
            {isAnalyzing ? 'Analizando...' : 'Emparejar'}
          </Button>
        </div>
        <CardDescription className="text-slate-400">
          Igualación automática de color entre clips
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        {suggestions.length > 0 ? (
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {suggestions.map((suggestion) => {
                const adjustmentEntries = Object.entries(suggestion.adjustments).filter(
                  ([, v]) => v !== undefined && v !== 0,
                );

                return (
                  <Card
                    key={suggestion.id}
                    className={cn(
                      'bg-slate-900/50 border transition-all',
                      expandedId === suggestion.id
                        ? 'border-purple-500/50'
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
                        <Palette className="w-4 h-4 text-purple-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs truncate">
                            {suggestion.sourceClip.slice(0, 8)} →{' '}
                            {suggestion.targetClip.slice(0, 8)}
                          </p>
                        </div>
                        {adjustmentEntries.length > 0 && (
                          <Badge
                            variant="outline"
                            className="border-purple-500/30 text-purple-400 text-[10px]"
                          >
                            {adjustmentEntries.length} ajustes
                          </Badge>
                        )}
                        <span
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
                        </span>
                      </div>
                    </CardHeader>

                    {expandedId === suggestion.id && (
                      <CardContent className="px-3 pb-3 pt-1 space-y-3">
                        <p className="text-xs text-slate-400">{suggestion.reason}</p>

                        <div className="grid grid-cols-2 gap-1.5">
                          {adjustmentEntries.map(([key, value]) => {
                            const Icon = adjustmentIcons[key] || Palette;
                            return (
                              <div
                                key={key}
                                className="flex items-center gap-1.5 bg-slate-950/50 p-1.5 rounded"
                              >
                                <Icon className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="text-[10px] text-slate-500 flex-1">
                                  {adjustmentLabels[key] || key}
                                </span>
                                <span className={cn('text-[10px] font-mono', getAdjustmentColor(value))}>
                                  {value > 0 ? '+' : ''}
                                  {value}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApply(suggestion.id)}
                            disabled={appliedIds.has(suggestion.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {appliedIds.has(suggestion.id) ? 'Aplicado' : 'Aplicar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPreviewId(
                                previewId === suggestion.id ? null : suggestion.id,
                              );
                              onPreview?.(suggestion.id);
                            }}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs h-8"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {previewId === suggestion.id ? 'Ocultar' : 'Prever'}
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
            <Palette className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Sin sugerencias de color</p>
            <p className="text-slate-600 text-xs mt-1">
              Analiza los clips para igualar el color automáticamente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
