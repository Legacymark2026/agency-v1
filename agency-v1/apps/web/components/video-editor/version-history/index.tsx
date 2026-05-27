'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History,
  Clock,
  RotateCcw,
  Trash2,
  CheckCircle2,
  XCircle,
  Camera,
  ChevronRight,
  Star,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore, type VersionSnapshot } from '@/lib/stores/editor-store';

interface VersionHistoryProps {
  versions: VersionSnapshot[];
  onShowAll?: () => void;
}

export function VersionHistory({ versions, onShowAll }: VersionHistoryProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const activeVersionId = useEditorStore((s) => s.activeVersionId);
  const restoreVersion = useEditorStore((s) => s.restoreVersion);
  const deleteVersion = useEditorStore((s) => s.deleteVersion);
  const createSnapshot = useEditorStore((s) => s.createSnapshot);

  const handleRestore = useCallback(
    (versionId: string) => {
      setRestoringId(versionId);
      setTimeout(() => {
        restoreVersion(versionId);
        setRestoringId(null);
      }, 500);
    },
    [restoreVersion],
  );

  const handleDelete = useCallback(
    (versionId: string) => {
      deleteVersion(versionId);
      setConfirmDelete(null);
    },
    [deleteVersion],
  );

  const handleCreateSnapshot = useCallback(() => {
    const name = `Versión ${versions.length + 1}`;
    createSnapshot(name, `Captura automática del estado actual`);
  }, [versions.length, createSnapshot]);

  return (
    <div className="space-y-3">
      <Button
        size="sm"
        onClick={handleCreateSnapshot}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs h-8 mb-2"
      >
        <Camera className="w-3 h-3 mr-1" />
        Capturar instantánea
      </Button>

      {versions.length > 0 ? (
        <ScrollArea className="max-h-80">
          <div className="space-y-2">
            {versions
              .slice()
              .reverse()
              .slice(0, onShowAll ? versions.length : 10)
              .map((version) => (
                <Card
                  key={version.id}
                  className={cn(
                    'bg-slate-900/50 border transition-all',
                    activeVersionId === version.id
                      ? 'border-indigo-500/50'
                      : 'border-slate-700/50 hover:border-slate-600',
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                          activeVersionId === version.id
                            ? 'bg-indigo-500/20'
                            : 'bg-slate-800',
                        )}
                      >
                        {activeVersionId === version.id ? (
                          <Star className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium truncate">
                            {version.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px]',
                              version.author === 'ai'
                                ? 'border-indigo-500/30 text-indigo-400'
                                : 'border-emerald-500/30 text-emerald-400',
                            )}
                          >
                            {version.author}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-xs truncate mt-0.5">
                          {version.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(version.createdAt).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {version.clipCount} clips
                          </span>
                          {version.duration > 0 && (
                            <span className="text-[10px] text-slate-500">
                              {version.duration.toFixed(1)}s
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {activeVersionId !== version.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRestore(version.id)}
                            disabled={restoringId === version.id}
                            className="w-7 h-7 p-0 text-slate-400 hover:text-indigo-400"
                          >
                            {restoringId === version.id ? (
                              <Clock className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                        {activeVersionId !== version.id && (
                          <>
                            {confirmDelete === version.id ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(version.id)}
                                  className="w-7 h-7 p-0 text-red-400 hover:text-red-300"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setConfirmDelete(null)}
                                  className="w-7 h-7 p-0 text-slate-500"
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmDelete(version.id)}
                                className="w-7 h-7 p-0 text-slate-500 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </>
                        )}
                        {activeVersionId === version.id && (
                          <Badge className="bg-indigo-500/20 text-indigo-400 text-[10px] border-0">
                            Actual
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-8">
          <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No hay versiones guardadas</p>
          <p className="text-slate-600 text-xs mt-1">
            Captura instantáneas para poder retroceder
          </p>
        </div>
      )}

      {!onShowAll && versions.length > 10 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-indigo-400 hover:text-indigo-300 text-xs"
        >
          Ver todas las {versions.length} versiones <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      )}
    </div>
  );
}
