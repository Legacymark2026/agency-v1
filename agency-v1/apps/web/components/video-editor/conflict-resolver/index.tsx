'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  Bot,
  User,
  CheckCircle2,
  XCircle,
  GitMerge,
  Trash2,
  ChevronDown,
  ChevronUp,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore, type EditConflict } from '@/lib/stores/editor-store';

interface ConflictResolverProps {
  conflicts: EditConflict[];
  onShowAll?: () => void;
}

export function ConflictResolver({ conflicts, onShowAll }: ConflictResolverProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  const resolveConflict = useEditorStore((s) => s.resolveConflict);

  const unresolved = conflicts.filter((c) => !c.resolved);
  const resolved = conflicts.filter((c) => c.resolved);

  const handleResolve = useCallback(
    (conflictId: string, resolution: 'ai' | 'human' | 'merged' | 'discarded') => {
      resolveConflict(conflictId, resolution);
    },
    [resolveConflict],
  );

  return (
    <div className="space-y-3">
      {unresolved.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            Conflictos sin resolver ({unresolved.length})
          </p>

          {unresolved.slice(0, 5).map((conflict) => (
            <Card
              key={conflict.id}
              className={cn(
                'border transition-all bg-slate-900/50',
                expandedId === conflict.id
                  ? 'border-red-500/50'
                  : 'border-red-500/20 hover:border-red-500/30',
              )}
            >
              <CardHeader
                className="p-3 pb-2 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === conflict.id ? null : conflict.id)
                }
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <Badge variant="outline" className="border-red-500/30 text-red-400 text-[10px]">
                    {conflict.elementType}
                  </Badge>
                  <span className="text-white text-sm flex-1 truncate">
                    Conflicto en elemento {conflict.elementId.slice(0, 8)}
                  </span>
                  {expandedId === conflict.id ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </CardHeader>

              {expandedId === conflict.id && (
                <CardContent className="px-3 pb-3 pt-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-indigo-500/5 rounded border border-indigo-500/20">
                      <div className="flex items-center gap-1.5 text-indigo-400 text-xs mb-2">
                        <Bot className="w-3 h-3" />
                        Edición de IA
                      </div>
                      <pre className="text-[10px] text-indigo-300/70 max-h-24 overflow-hidden">
                        {JSON.stringify(conflict.aiEdit.afterState, null, 1).slice(0, 200)}
                      </pre>
                    </div>

                    <div className="p-3 bg-emerald-500/5 rounded border border-emerald-500/20">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs mb-2">
                        <User className="w-3 h-3" />
                        Edición Humana
                      </div>
                      <pre className="text-[10px] text-emerald-300/70 max-h-24 overflow-hidden">
                        {JSON.stringify(conflict.humanEdit.afterState, null, 1).slice(0, 200)}
                      </pre>
                    </div>
                  </div>

                  <Textarea
                    placeholder="Notas sobre la resolución..."
                    value={resolutionNotes[conflict.id] || ''}
                    onChange={(e) =>
                      setResolutionNotes((prev) => ({
                        ...prev,
                        [conflict.id]: e.target.value,
                      }))
                    }
                    className="bg-slate-800 border-slate-700 text-white text-xs min-h-[60px]"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleResolve(conflict.id, 'ai')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-xs h-8"
                    >
                      <Bot className="w-3 h-3 mr-1" />
                      Usar IA
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResolve(conflict.id, 'human')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                    >
                      <User className="w-3 h-3 mr-1" />
                      Usar Humano
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(conflict.id, 'merged')}
                      className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-xs h-8"
                    >
                      <GitMerge className="w-3 h-3 mr-1" />
                      Fusionar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(conflict.id, 'discarded')}
                      className="border-slate-600 text-slate-400 hover:bg-slate-700 text-xs h-8"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Descartar
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {unresolved.length > 5 && onShowAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowAll}
              className="w-full text-red-400 hover:text-red-300 text-xs"
            >
              Ver todos los {unresolved.length} conflictos
            </Button>
          )}
        </div>
      )}

      {unresolved.length === 0 && (
        <div className="flex items-center justify-center gap-2 py-6">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <p className="text-emerald-400 text-sm">No hay conflictos sin resolver</p>
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-1.5 mt-4">
          <p className="text-xs text-slate-500 font-medium">
            Resueltos ({resolved.length})
          </p>
          {resolved.slice(0, 3).map((conflict) => (
            <div
              key={conflict.id}
              className="flex items-center gap-2 p-2 rounded bg-slate-900/30"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="flex-1 text-xs text-slate-400">
                {conflict.elementType} - {conflict.resolution}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  conflict.resolution === 'ai' && 'border-indigo-500/20 text-indigo-500',
                  conflict.resolution === 'human' && 'border-emerald-500/20 text-emerald-500',
                  conflict.resolution === 'merged' && 'border-purple-500/20 text-purple-500',
                )}
              >
                {conflict.resolution}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
