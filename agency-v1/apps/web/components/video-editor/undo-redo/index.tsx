'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Undo2, Redo2, History, Clock, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditHistoryItem {
  id: string;
  action: string;
  description: string;
  timestamp: Date;
  undone: boolean;
}

interface UndoRedoUIProps {
  history: EditHistoryItem[];
  onUndo?: () => void;
  onRedo?: () => void;
  onRestore?: (historyId: string) => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function UndoRedoUI({ history, onUndo, onRedo, onRestore, canUndo, canRedo }: UndoRedoUIProps) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <History className="w-5 h-5 text-teal-400" />
            Historial
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-slate-400 hover:text-white"
          >
            {showHistory ? <ArrowLeft className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="flex gap-2 mb-3">
          <Button
            onClick={onUndo}
            disabled={!canUndo}
            variant="outline"
            size="sm"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            <Undo2 className="w-4 h-4 mr-2" />
            Deshacer
          </Button>
          <Button
            onClick={onRedo}
            disabled={!canRedo}
            variant="outline"
            size="sm"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            <Redo2 className="w-4 h-4 mr-2" />
            Rehacer
          </Button>
        </div>

        {showHistory && (
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg text-sm',
                    item.undone
                      ? 'bg-slate-900/30 text-slate-500'
                      : 'bg-slate-900/50 text-slate-300',
                  )}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] min-w-[60px] justify-center',
                      item.undone
                        ? 'border-slate-700 text-slate-600'
                        : 'border-teal-500/30 text-teal-400',
                    )}
                  >
                    {item.action}
                  </Badge>
                  <span className="flex-1 truncate">{item.description}</span>
                  <span className="text-[10px] text-slate-500">
                    {item.timestamp.toLocaleTimeString()}
                  </span>
                  {item.undone && onRestore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0"
                      onClick={() => onRestore(item.id)}
                    >
                      <Redo2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}

              {history.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-8">
                  No hay acciones en el historial
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
