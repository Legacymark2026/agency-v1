'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bot, User, Lock, Edit3, MousePointer2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore, type PresenceInfo } from '@/lib/stores/editor-store';

interface PresenceIndicatorsProps {
  compact?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorForUser(userId: string): string {
  const colors = [
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function PresenceIndicators({ compact = false }: PresenceIndicatorsProps) {
  const [showAll, setShowAll] = useState(false);

  const presence = useEditorStore((s) => s.presence);
  const editLocks = useEditorStore((s) => s.editLocks);

  const aiPresence = presence.filter((p) => p.userType === 'ai');
  const humanPresence = presence.filter((p) => p.userType === 'human');

  const displayPresence = showAll ? presence : presence.slice(0, 6);
  const hiddenCount = presence.length - 6;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className={cn('pb-2', compact && 'p-2')}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn('text-base text-white flex items-center gap-2', compact && 'text-sm')}>
            <Wifi className="w-4 h-4 text-emerald-400" />
            En vivo
            <Badge
              variant="outline"
              className="text-[10px] border-slate-600 text-slate-400 ml-1"
            >
              {presence.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className={cn('px-4 pb-4', compact && 'p-2 pt-0')}>
        {presence.length > 0 ? (
          <div className="space-y-3">
            {humanPresence.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">Editores</p>
                <div className="space-y-1.5">
                  {humanPresence.map((p) => (
                    <TooltipProvider key={p.userId}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'flex items-center gap-2 p-1.5 rounded transition-colors',
                              p.editingClip ? 'bg-slate-900/50' : 'hover:bg-slate-900/30',
                            )}
                          >
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className={cn('text-[10px] text-white', getColorForUser(p.userId))}>
                                {getInitials(p.userName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs truncate">{p.userName}</p>
                            </div>
                            {p.isTyping && (
                              <span className="text-[10px] text-emerald-400 animate-pulse">
                                escribiendo...
                              </span>
                            )}
                            {p.editingClip && (
                              <Edit3 className="w-3 h-3 text-amber-400 shrink-0" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-slate-900 border-slate-700 text-xs">
                          {p.editingClip
                            ? `Editando clip ${p.editingClip.slice(0, 8)}`
                            : 'Navegando'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}

            {aiPresence.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">Agentes IA</p>
                <div className="space-y-1.5">
                  {aiPresence.map((p) => (
                    <div
                      key={p.userId}
                      className="flex items-center gap-2 p-1.5 rounded bg-indigo-500/5"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-indigo-600 text-white text-[10px]">
                          AI
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-indigo-300 text-xs truncate">{p.userName}</p>
                      </div>
                      {p.isTyping && (
                        <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editLocks.size > 0 && (
              <div className="pt-1">
                <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">
                  Bloques activos
                </p>
                <div className="space-y-1">
                  {Array.from(editLocks.entries()).map(([clipId, userId]) => {
                    const user = presence.find((p) => p.userId === userId);
                    return (
                      <div key={clipId} className="flex items-center gap-1.5 text-xs text-amber-400">
                        <Lock className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          Clip {clipId.slice(0, 8)} — {user?.userName || userId.slice(0, 8)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!showAll && presence.length > 6 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-1"
              >
                +{hiddenCount} más
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-4">
            <WifiOff className="w-4 h-4 text-slate-600" />
            <p className="text-slate-500 text-xs">Sin conexiones activas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
