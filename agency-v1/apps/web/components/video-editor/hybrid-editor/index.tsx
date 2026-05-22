'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  User,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Filter,
  Brain,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore, type EditAuthor } from '@/lib/stores/editor-store';
import { useHybridWebSocket } from '@/lib/video/hybrid-websocket';
import { ProposalReview } from '../proposal-review';
import { ConflictResolver } from '../conflict-resolver';
import { VersionHistory } from '../version-history';

interface HybridEditorPanelProps {
  projectId: string;
  sessionId: string;
  userId: string;
  userName: string;
}

export function HybridEditorPanel({
  projectId,
  sessionId,
  userId,
  userName,
}: HybridEditorPanelProps) {
  const [activeTab, setActiveTab] = useState('proposals');
  const { isConnected } = useHybridWebSocket({
    projectId,
    sessionId,
    userId,
    userName,
    enabled: true,
  });

  const edits = useEditorStore((s) => s.edits);
  const conflicts = useEditorStore((s) => s.conflicts);
  const unresolvedConflictCount = useEditorStore((s) => s.unresolvedConflictCount);
  const versions = useEditorStore((s) => s.versions);
  const aiWorking = useEditorStore((s) => s.aiWorking);
  const aiProgress = useEditorStore((s) => s.aiProgress);
  const aiCurrentTask = useEditorStore((s) => s.aiCurrentTask);
  const filterByAuthor = useEditorStore((s) => s.filterByAuthor);
  const setFilterByAuthor = useEditorStore((s) => s.setFilterByAuthor);
  const setShowProposalReview = useEditorStore((s) => s.setShowProposalReview);
  const setShowVersionHistory = useEditorStore((s) => s.setShowVersionHistory);
  const setShowConflictResolver = useEditorStore((s) => s.setShowConflictResolver);

  const pendingProposals = edits.filter((e) => e.status === 'pending' && e.author === 'ai');
  const appliedEdits = edits.filter((e) => e.status === 'applied');

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Editor Híbrido
          </CardTitle>
          <div className="flex items-center gap-2">
            {aiWorking && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 animate-pulse">
                <Sparkles className="w-3 h-3 mr-1" />
                IA trabajando
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                isConnected ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400',
              )}
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full mr-1',
                  isConnected ? 'bg-emerald-400' : 'bg-red-400',
                )}
              />
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {aiWorking && (
          <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              {aiCurrentTask}
            </div>
            <Progress value={aiProgress} className="h-1.5 bg-slate-700" />
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterByAuthor('all')}
            className={cn(
              'border-slate-600',
              filterByAuthor === 'all' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400',
            )}
          >
            <Layers className="w-3 h-3 mr-1" />
            Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterByAuthor('ai')}
            className={cn(
              'border-slate-600',
              filterByAuthor === 'ai' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400',
            )}
          >
            <Bot className="w-3 h-3 mr-1" />
            IA
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterByAuthor('human')}
            className={cn(
              'border-slate-600',
              filterByAuthor === 'human' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400',
            )}
          >
            <User className="w-3 h-3 mr-1" />
            Humano
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900/50 border border-slate-700">
            <TabsTrigger value="proposals" className="text-xs">
              Propuestas
              {pendingProposals.length > 0 && (
                <Badge className="ml-1.5 bg-indigo-500 text-white text-[10px] w-4 h-4 p-0 flex items-center justify-center">
                  {pendingProposals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="text-xs relative">
              Conflictos
              {unresolvedConflictCount > 0 && (
                <Badge className="ml-1.5 bg-red-500 text-white text-[10px] w-4 h-4 p-0 flex items-center justify-center animate-pulse">
                  {unresolvedConflictCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="versions" className="text-xs">
              Versiones
              <Badge className="ml-1.5 bg-slate-600 text-white text-[10px]">
                {versions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="mt-3">
            <ProposalReview
              proposals={edits.filter((e) => filterByAuthor === 'all' || e.author === filterByAuthor)}
              onShowAll={() => setShowProposalReview(true)}
            />
          </TabsContent>

          <TabsContent value="conflicts" className="mt-3">
            <ConflictResolver
              conflicts={conflicts}
              onShowAll={() => setShowConflictResolver(true)}
            />
          </TabsContent>

          <TabsContent value="versions" className="mt-3">
            <VersionHistory
              versions={versions}
              onShowAll={() => setShowVersionHistory(true)}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {edits
                  .filter((e) => filterByAuthor === 'all' || e.author === filterByAuthor)
                  .slice()
                  .reverse()
                  .map((edit) => (
                    <div
                      key={edit.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50"
                    >
                      {edit.author === 'ai' ? (
                        <Bot className="w-4 h-4 text-indigo-400 shrink-0" />
                      ) : (
                        <User className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{edit.description}</p>
                        <p className="text-slate-500 text-xs">
                          {new Date(edit.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          edit.status === 'applied' && 'border-emerald-500/30 text-emerald-400',
                          edit.status === 'pending' && 'border-amber-500/30 text-amber-400',
                          edit.status === 'rejected' && 'border-red-500/30 text-red-400',
                          edit.status === 'conflicted' && 'border-purple-500/30 text-purple-400',
                        )}
                      >
                        {edit.status}
                      </Badge>
                    </div>
                  ))}

                {edits.length === 0 && (
                  <p className="text-center text-slate-500 text-sm py-8">
                    No hay ediciones registradas
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
