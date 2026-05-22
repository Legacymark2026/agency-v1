'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Subtitles,
  Sparkles,
  Play,
  Pause,
  Download,
  Languages,
  Mic,
  Type,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaptionWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

interface CaptionSegment {
  id: string;
  text: string;
  words: CaptionWord[];
  startTime: number;
  endTime: number;
}

interface AutoCaptionPanelProps {
  captions?: CaptionSegment[];
  onGenerate?: (language: string) => void;
  onUpdate?: (segmentId: string, text: string) => void;
  onExport?: (format: 'srt' | 'vtt' | 'ass') => void;
  isGenerating?: boolean;
  language?: string;
}

export function AutoCaptionPanel({
  captions = [],
  onGenerate,
  onUpdate,
  onExport,
  isGenerating = false,
  language = 'es',
}: AutoCaptionPanelProps) {
  const [showCaptions, setShowCaptions] = useState(true);
  const [fontSize, setFontSize] = useState(24);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const languages = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'Inglés' },
    { value: 'pt', label: 'Portugués' },
    { value: 'fr', label: 'Francés' },
    { value: 'de', label: 'Alemán' },
  ];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}.${Math.floor((seconds % 1) * 100)
      .toString()
      .padStart(2, '0')}`;
  };

  const handleStartEdit = (segment: CaptionSegment) => {
    setEditingId(segment.id);
    setEditText(segment.text);
  };

  const handleSaveEdit = () => {
    if (editingId && onUpdate) {
      onUpdate(editingId, editText);
    }
    setEditingId(null);
    setEditText('');
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Subtitles className="w-5 h-5 text-cyan-400" />
            Auto Subtítulos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCaptions(!showCaptions)}
              className="text-slate-400 hover:text-white w-7 h-7 p-0"
            >
              {showCaptions ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <CardDescription className="text-slate-400">
          Transcripción automática con Whisper AI
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        <div className="flex items-center gap-2">
          <select
            value={language}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
          >
            {languages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={() => onGenerate?.(language)}
            disabled={isGenerating}
            className="bg-cyan-600 hover:bg-cyan-700 text-xs"
          >
            {isGenerating ? (
              <Sparkles className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Mic className="w-3 h-3 mr-1" />
            )}
            {isGenerating ? 'Transcribiendo...' : 'Generar'}
          </Button>
        </div>

        <div className="p-3 bg-slate-900/50 rounded-lg space-y-3">
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Type className="w-3 h-3" />
            Estilo de subtítulos
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-[10px] text-slate-500">Tamaño</Label>
              <Slider
                value={[fontSize]}
                onValueChange={([v]) => setFontSize(v)}
                min={12}
                max={48}
                step={1}
                className="mt-1"
              />
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTextAlign('left')}
                className={cn(
                  'w-7 h-7 p-0',
                  textAlign === 'left'
                    ? 'border-cyan-500/30 text-cyan-400'
                    : 'border-slate-600 text-slate-400',
                )}
              >
                <AlignLeft className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTextAlign('center')}
                className={cn(
                  'w-7 h-7 p-0',
                  textAlign === 'center'
                    ? 'border-cyan-500/30 text-cyan-400'
                    : 'border-slate-600 text-slate-400',
                )}
              >
                <AlignCenter className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTextAlign('right')}
                className={cn(
                  'w-7 h-7 p-0',
                  textAlign === 'right'
                    ? 'border-cyan-500/30 text-cyan-400'
                    : 'border-slate-600 text-slate-400',
                )}
              >
                <AlignRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBold(!bold)}
                className={cn(
                  'w-7 h-7 p-0',
                  bold
                    ? 'border-cyan-500/30 text-cyan-400'
                    : 'border-slate-600 text-slate-400',
                )}
              >
                <Bold className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setItalic(!italic)}
                className={cn(
                  'w-7 h-7 p-0',
                  italic
                    ? 'border-cyan-500/30 text-cyan-400'
                    : 'border-slate-600 text-slate-400',
                )}
              >
                <Italic className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {showCaptions && (
          <ScrollArea className="h-64">
            <div className="space-y-1.5">
              {captions.map((segment) => (
                <div
                  key={segment.id}
                  className={cn(
                    'p-2 rounded transition-colors',
                    editingId === segment.id
                      ? 'bg-cyan-500/10 border border-cyan-500/30'
                      : 'bg-slate-900/50 hover:bg-slate-900 border border-transparent',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatTime(segment.startTime)}
                    </span>
                    <span className="text-[10px] text-slate-600">→</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatTime(segment.endTime)}
                    </span>
                    <div className="flex-1" />
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        segment.words.length > 0 &&
                          segment.words.every((w) => w.confidence > 0.8)
                          ? 'border-emerald-500/20 text-emerald-500'
                          : 'border-amber-500/20 text-amber-500',
                      )}
                    >
                      {segment.words.length > 0
                        ? `${(segment.words.reduce((a, w) => a + w.confidence, 0) / segment.words.length * 100).toFixed(0)}%`
                        : '—'}
                    </Badge>
                  </div>

                  {editingId === segment.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 bg-slate-800 border-slate-700 text-white text-xs h-8"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        className="bg-cyan-600 hover:bg-cyan-700 text-xs h-8"
                      >
                        Guardar
                      </Button>
                    </div>
                  ) : (
                    <p
                      className={cn(
                        'text-sm cursor-pointer hover:text-cyan-300 transition-colors',
                        bold && 'font-bold',
                        italic && 'italic',
                        textAlign === 'center' && 'text-center',
                        textAlign === 'right' && 'text-right',
                      )}
                      style={{ fontSize: `${fontSize}px` }}
                      onClick={() => handleStartEdit(segment)}
                    >
                      {segment.text}
                    </p>
                  )}
                </div>
              ))}

              {captions.length === 0 && !isGenerating && (
                <div className="text-center py-8">
                  <Subtitles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Sin subtítulos</p>
                  <p className="text-slate-600 text-xs mt-1">
                    Genera subtítulos automáticos con Whisper
                  </p>
                </div>
              )}

              {isGenerating && (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-cyan-500 mx-auto mb-2 animate-pulse" />
                  <p className="text-cyan-400 text-sm">Transcribiendo audio...</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {captions.length > 0 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onExport?.('srt')}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 text-xs h-8"
            >
              <Download className="w-3 h-3 mr-1" />
              SRT
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onExport?.('vtt')}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 text-xs h-8"
            >
              <Download className="w-3 h-3 mr-1" />
              VTT
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onExport?.('ass')}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 text-xs h-8"
            >
              <Download className="w-3 h-3 mr-1" />
              ASS
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
