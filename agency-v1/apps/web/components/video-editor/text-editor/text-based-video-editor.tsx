'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, Scissors, Trash2, Wand2, Sparkles, RefreshCw,
  Clock, CheckCircle2, AlertCircle, VolumeX
} from 'lucide-react';
import { toast } from 'sonner';

interface TextSentence {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  isDeleted: boolean;
  isFiller: boolean;
}

interface TextBasedVideoEditorProps {
  onApplyCuts: (cutSegments: { startSec: number; endSec: number }[]) => void;
}

export function TextBasedVideoEditor({ onApplyCuts }: TextBasedVideoEditorProps) {
  const [sentences, setSentences] = useState<TextSentence[]>([
    { id: 's1', startSec: 0, endSec: 4.2, text: 'Hola a todos, hoy les voy a enseñar el gran secreto para automatizar.', isDeleted: false, isFiller: false },
    { id: 's2', startSec: 4.2, endSec: 6.0, text: 'Ehhh... bueno, básicamente...', isDeleted: false, isFiller: true },
    { id: 's3', startSec: 6.0, endSec: 12.5, text: 'El problema de la mayoría de empresas en 2026 es que gastan demasiado tiempo en facturación y nómina DIAN.', isDeleted: false, isFiller: false },
    { id: 's4', startSec: 12.5, endSec: 14.8, text: 'O sea, literalmente pierden horas.', isDeleted: false, isFiller: true },
    { id: 's5', startSec: 14.8, endSec: 22.0, text: 'Con nuestro nuevo agente de inteligencia artificial, todo el cierre de mes se procesa en 30 segundos.', isDeleted: false, isFiller: false },
    { id: 's6', startSec: 22.0, endSec: 28.0, text: 'Comenta la palabra AUTOMATIZAR y te enviamos acceso inmediato.', isDeleted: false, isFiller: false },
  ]);

  const toggleDeleteSentence = (id: string) => {
    setSentences(prev =>
      prev.map(s => s.id === id ? { ...s, isDeleted: !s.isDeleted } : s)
    );
  };

  const handleRemoveAllFillers = () => {
    const fillerCount = sentences.filter(s => s.isFiller).length;
    setSentences(prev =>
      prev.map(s => s.isFiller ? { ...s, isDeleted: true } : s)
    );
    toast.success(`${fillerCount} muletillas marcadas para eliminar`);
  };

  const handleApplyToTimeline = () => {
    // Keep only non-deleted sentences as active segments
    const activeSegments = sentences
      .filter(s => !s.isDeleted)
      .map(s => ({ startSec: s.startSec, endSec: s.endSec }));

    onApplyCuts(activeSegments);
    toast.success('¡Cortes aplicados a la línea de tiempo con borrado de ondulación!');
  };

  const totalOriginalDuration = sentences[sentences.length - 1]?.endSec || 0;
  const deletedDuration = sentences
    .filter(s => s.isDeleted)
    .reduce((acc, s) => acc + (s.endSec - s.startSec), 0);
  const finalDuration = totalOriginalDuration - deletedDuration;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-teal-400" /> Edición Basada en Texto (Estilo Descript)
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Toca cualquier frase para tacharla y eliminar ese trozo de video del timeline.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleRemoveAllFillers}
          className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] h-7 px-2.5 font-bold cursor-pointer"
        >
          <Wand2 className="w-3 h-3 mr-1" />
          Quitar Muletillas (1-Click)
        </Button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
          <span className="text-slate-500 block text-[9px]">Original</span>
          <span className="font-bold text-white">{totalOriginalDuration.toFixed(1)}s</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
          <span className="text-slate-500 block text-[9px]">Eliminado</span>
          <span className="font-bold text-red-400">-{deletedDuration.toFixed(1)}s</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
          <span className="text-slate-500 block text-[9px]">Duración Final</span>
          <span className="font-bold text-emerald-400">{finalDuration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Transcripts List */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {sentences.map((sentence) => (
          <div
            key={sentence.id}
            onClick={() => toggleDeleteSentence(sentence.id)}
            className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              sentence.isDeleted
                ? 'bg-red-950/20 border-red-900/40 text-slate-500 line-through'
                : sentence.isFiller
                ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex-1 text-xs leading-relaxed">
              {sentence.text}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {sentence.isFiller && !sentence.isDeleted && (
                <Badge className="bg-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0 border-amber-500/30">
                  Muletilla
                </Badge>
              )}
              <span className="text-[10px] font-mono text-slate-500">
                {sentence.startSec.toFixed(1)}s
              </span>
              <button
                className={`p-1 rounded ${sentence.isDeleted ? 'text-red-400' : 'text-slate-600 hover:text-white'}`}
              >
                <Scissors className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Apply Button */}
      <Button
        onClick={handleApplyToTimeline}
        className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs h-9 mt-2 shadow-lg shadow-teal-500/20 cursor-pointer"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Aplicar Recortes a la Línea de Tiempo
      </Button>
    </div>
  );
}
