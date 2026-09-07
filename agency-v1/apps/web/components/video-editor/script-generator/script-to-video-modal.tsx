'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wand2, Sparkles, RefreshCw, CheckCircle2, Play,
  TrendingUp, Clock, Layers, ArrowRight, Zap
} from 'lucide-react';
import { runScriptToVideoAction } from '@/modules/video/actions/video-enterprise';
import { toast } from 'sonner';

interface ScriptToVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyStoryboard: (project: any) => void;
}

export function ScriptToVideoModal({
  open,
  onOpenChange,
  onApplyStoryboard,
}: ScriptToVideoModalProps) {
  const [topic, setTopic] = useState('Automatización de Contabilidad DIAN con Inteligencia Artificial');
  const [duration, setDuration] = useState<number>(30);
  const [tone, setTone] = useState<'HIGH_CONVERSION' | 'INSPIRATIONAL' | 'EDUCATIONAL'>('HIGH_CONVERSION');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProject, setGeneratedProject] = useState<any>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const res = await runScriptToVideoAction({
        topic,
        targetDurationSec: duration,
        tone,
      });

      if (res.success && res.project) {
        setGeneratedProject(res.project);
        toast.success('Guión y Storyboard de 4 fases generado con éxito');
      }
    } catch {
      toast.error('Error al generar guión');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedProject) return;
    onApplyStoryboard(generatedProject);
    toast.success('Storyboard montado en el timeline');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-slate-950 border border-slate-800 text-white p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Generador "De Idea a Video" (AI Storyboard Pipeline)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Crea automáticamente guiones virales de alta retención (Gancho, Problema, Solución y CTA) y monta el proyecto en 1 clic.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Input Form */}
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">Tema del Video o Propuesta de Valor:</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Ej: Cómo reducir 70% de costos contables con agentes de IA"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-hidden focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Duración Objetivo:</label>
              <div className="flex gap-2">
                {[15, 30, 60].map(d => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant={duration === d ? 'default' : 'outline'}
                    onClick={() => setDuration(d)}
                    className="flex-1 text-xs h-8"
                  >
                    {d} segundos
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Tono de Comunicación:</label>
              <select
                value={tone}
                onChange={(e: any) => setTone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white outline-hidden"
              >
                <option value="HIGH_CONVERSION">🔥 Alta Conversión (Venta Rápida)</option>
                <option value="EDUCATIONAL">🎓 Educativo / Caso de Éxito</option>
                <option value="INSPIRATIONAL">🚀 Inspiracional / Visión</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs h-9 shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
            Generar Storyboard con IA
          </Button>
        </div>

        {/* Result Beats */}
        {generatedProject && (
          <div className="space-y-3 mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-400">Estructura Generada (4 Fases)</span>
              <span className="text-xs font-mono text-slate-500">Duración: {generatedProject.targetDurationSec}s • Formato 9:16</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {generatedProject.beats.map((b: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-teal-500/20 text-teal-400 text-[10px]">{b.phase} ({b.durationSec}s)</Badge>
                    <span className="text-[10px] text-amber-400 font-bold">{b.overlayHeadline}</span>
                  </div>
                  <p className="text-slate-300 font-sans text-[11px] italic">"{b.spokenNarration}"</p>
                  <p className="text-[10px] text-slate-500 font-mono">B-Roll: {b.suggestedBrollKeyword}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={handleApply}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 mt-2"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Auto-Montar Proyecto en la Línea de Tiempo
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
