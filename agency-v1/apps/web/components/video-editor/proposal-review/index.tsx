'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  User,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Scissors,
  Palette,
  Type,
  Music,
  Crop,
  Film,
  Image,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore, type ClipEdit, type EditStatus } from '@/lib/stores/editor-store';

interface ProposalReviewProps {
  proposals: ClipEdit[];
  onShowAll?: () => void;
}

const typeIcons: Record<string, typeof Bot> = {
  cut: Scissors,
  speed: ArrowRight,
  color: Palette,
  text: Type,
  audio: Music,
  crop: Crop,
  transition: Film,
  broll: Image,
};

const typeColors: Record<string, string> = {
  cut: 'text-orange-400 border-orange-500/30',
  speed: 'text-cyan-400 border-cyan-500/30',
  color: 'text-purple-400 border-purple-500/30',
  text: 'text-blue-400 border-blue-500/30',
  audio: 'text-pink-400 border-pink-500/30',
  crop: 'text-green-400 border-green-500/30',
  transition: 'text-yellow-400 border-yellow-500/30',
  broll: 'text-indigo-400 border-indigo-500/30',
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 85) return 'text-emerald-400';
  if (confidence >= 70) return 'text-amber-400';
  return 'text-red-400';
};

export function ProposalReview({ proposals, onShowAll }: ProposalReviewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState(true);

  const applyEdit = useEditorStore((s) => s.applyEdit);
  const rejectEdit = useEditorStore((s) => s.rejectEdit);

  const pendingProposals = proposals.filter((p) => p.status === 'pending');
  const otherProposals = proposals.filter((p) => p.status !== 'pending');

  const handleApply = useCallback(
    (editId: string) => {
      applyEdit(editId);
    },
    [applyEdit],
  );

  const handleReject = useCallback(
    (editId: string) => {
      rejectEdit(editId);
    },
    [rejectEdit],
  );

  return (
    <div className="space-y-3">
      {pendingProposals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Propuestas pendientes ({pendingProposals.length})
          </p>

          {pendingProposals.slice(0, 5).map((proposal) => {
            const Icon = typeIcons[proposal.type] || Bot;
            const color = typeColors[proposal.type] || 'text-slate-400';

            return (
              <Card
                key={proposal.id}
                className={cn(
                  'bg-slate-900/50 border transition-all',
                  expandedId === proposal.id
                    ? 'border-indigo-500/50'
                    : 'border-slate-700/50 hover:border-slate-600',
                )}
              >
                <CardHeader
                  className="p-3 pb-2 cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === proposal.id ? null : proposal.id)
                  }
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-4 h-4', color.split(' ')[0])} />
                    <Badge variant="outline" className={cn('text-[10px]', color)}>
                      {proposal.type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{proposal.description}</p>
                    </div>
                    <span
                      className={cn('text-xs font-mono', getConfidenceColor(proposal.confidence))}
                    >
                      {proposal.confidence}%
                    </span>
                  </div>
                </CardHeader>

                {expandedId === proposal.id && (
                  <CardContent className="px-3 pb-3 pt-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        size="sm"
                        onClick={() => handleApply(proposal.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Aplicar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(proposal.id)}
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Rechazar
                      </Button>
                    </div>

                    {showBeforeAfter && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-slate-950/50 rounded border border-slate-700/50">
                          <p className="text-[10px] text-slate-500 mb-1">Estado actual</p>
                          <pre className="text-[10px] text-slate-400 truncate">
                            {JSON.stringify(proposal.beforeState).slice(0, 80)}
                          </pre>
                        </div>
                        <div className="p-2 bg-slate-950/50 rounded border border-indigo-500/20">
                          <p className="text-[10px] text-indigo-400 mb-1">Propuesta</p>
                          <pre className="text-[10px] text-indigo-300 truncate">
                            {JSON.stringify(proposal.afterState).slice(0, 80)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {pendingProposals.length > 5 && onShowAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowAll}
              className="w-full text-indigo-400 hover:text-indigo-300 text-xs"
            >
              Ver todas las {pendingProposals.length} propuestas
            </Button>
          )}
        </div>
      )}

      {pendingProposals.length === 0 && otherProposals.length === 0 && (
        <p className="text-center text-slate-500 text-sm py-8">
          No hay propuestas de IA pendientes
        </p>
      )}

      {otherProposals.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-500 font-medium">
            Historial ({otherProposals.length})
          </p>
          {otherProposals.slice(0, 3).map((proposal) => {
            const Icon = typeIcons[proposal.type] || Bot;
            return (
              <div
                key={proposal.id}
                className="flex items-center gap-2 p-2 rounded bg-slate-900/30"
              >
                <Icon className="w-3 h-3 text-slate-500" />
                <span className="flex-1 text-xs text-slate-400 truncate">
                  {proposal.description}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px]',
                    proposal.status === 'applied' && 'border-emerald-500/20 text-emerald-500',
                    proposal.status === 'rejected' && 'border-red-500/20 text-red-500',
                  )}
                >
                  {proposal.status}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
