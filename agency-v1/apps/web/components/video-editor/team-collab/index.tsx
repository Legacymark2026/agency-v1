'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Settings,
  Share2,
  Link,
  Copy,
  CheckCircle2,
  XCircle,
  Shield,
  Edit3,
  Eye,
  Ban,
  Mail,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/stores/editor-store';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  isOnline: boolean;
  isEditing: boolean;
  joinedAt: Date;
}

interface TeamCollabPanelProps {
  members?: TeamMember[];
  onInvite?: (email: string, role: TeamMember['role']) => void;
  onRemove?: (memberId: string) => void;
  onChangeRole?: (memberId: string, role: TeamMember['role']) => void;
  sessionId?: string;
}

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  editor: Edit3,
  viewer: Eye,
  commenter: Ban,
};

const roleColors: Record<string, string> = {
  owner: 'text-amber-400 border-amber-500/30',
  editor: 'text-emerald-400 border-emerald-500/30',
  viewer: 'text-blue-400 border-blue-500/30',
  commenter: 'text-purple-400 border-purple-500/30',
};

const roleLabels: Record<string, string> = {
  owner: 'Propietario',
  editor: 'Editor',
  viewer: 'Espectador',
  commenter: 'Comentarista',
};

const roleDescriptions: Record<string, string> = {
  owner: 'Acceso total, puede gestionar miembros',
  editor: 'Puede editar y comentar',
  viewer: 'Solo puede ver',
  commenter: 'Puede comentar, no editar',
};

export function TeamCollabPanel({
  members = [],
  onInvite,
  onRemove,
  onChangeRole,
  sessionId,
}: TeamCollabPanelProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('editor');
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);

  const presence = useEditorStore((s) => s.presence);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-indigo-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-cyan-500',
      'bg-purple-500',
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleCopyLink = () => {
    if (sessionId) {
      const link = `${window.location.origin}/video-editor?session=${sessionId}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      onInvite?.(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      setShowInvite(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Colaboración en equipo
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs h-7"
            >
              {copied ? (
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
              ) : (
                <Link className="w-3 h-3 mr-1" />
              )}
              {copied ? 'Copiado' : 'Invitar'}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowInvite(!showInvite)}
              className="bg-blue-600 hover:bg-blue-700 text-xs h-7"
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Añadir
            </Button>
          </div>
        </div>
        <CardDescription className="text-slate-400">
          {members.length} miembro{members.length !== 1 ? 's' : ''} en este proyecto
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        {showInvite && (
          <div className="p-4 bg-slate-900/50 rounded-lg space-y-3">
            <div>
              <Label className="text-slate-300 text-xs">Correo electrónico</Label>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colaborador@ejemplo.com"
                className="bg-slate-800 border-slate-700 text-white text-sm mt-1"
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Rol</Label>
              <div className="flex gap-2 mt-1">
                {(['editor', 'viewer', 'commenter'] as const).map((role) => {
                  const Icon = roleIcons[role];
                  return (
                    <Button
                      key={role}
                      size="sm"
                      variant="outline"
                      onClick={() => setInviteRole(role)}
                      className={cn(
                        'flex-1 text-xs h-8',
                        inviteRole === role
                          ? roleColors[role]
                          : 'border-slate-600 text-slate-400',
                      )}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {roleLabels[role]}
                    </Button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {roleDescriptions[inviteRole]}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInvite}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs h-8"
              >
                <Mail className="w-3 h-3 mr-1" />
                Enviar invitación
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInvite(false)}
                className="border-slate-600 text-slate-400 text-xs h-8"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-72">
          <div className="space-y-1.5">
            {members.map((member) => {
              const RoleIcon = roleIcons[member.role];
              const isOnline = member.isOnline || presence.some((p) => p.userId === member.id);

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={cn('text-xs text-white', getAvatarColor(member.id))}>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900',
                        isOnline ? 'bg-emerald-400' : 'bg-slate-600',
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm truncate">{member.name}</p>
                      {member.role === 'owner' && (
                        <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-slate-500 text-xs truncate">{member.email}</p>
                  </div>

                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setShowRoleMenu(showRoleMenu === member.id ? null : member.id)
                      }
                      className={cn(
                        'text-[10px] h-7 px-2 border',
                        roleColors[member.role],
                      )}
                    >
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {roleLabels[member.role]}
                    </Button>

                    {showRoleMenu === member.id && member.role !== 'owner' && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10">
                        {(['editor', 'viewer', 'commenter'] as const).map((role) => (
                          <button
                            key={role}
                            onClick={() => {
                              onChangeRole?.(member.id, role);
                              setShowRoleMenu(null);
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-800 transition-colors',
                              role === member.role
                                ? roleColors[role]
                                : 'text-slate-400',
                            )}
                          >
                            {roleLabels[role]}
                          </button>
                        ))}
                        <div className="border-t border-slate-700" />
                        <button
                          onClick={() => {
                            onRemove?.(member.id);
                            setShowRoleMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <UserMinus className="w-3 h-3" />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {members.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Sin miembros</p>
                <p className="text-slate-600 text-xs mt-1">
                  Invita a tu equipo a colaborar en este proyecto
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 font-medium">Compartir sesión</p>
            <Share2 className="w-3 h-3 text-slate-500" />
          </div>
          <div className="flex gap-2">
            <Input
              value={sessionId ? `${window.location.origin}/video-editor?session=${sessionId}` : ''}
              readOnly
              className="flex-1 bg-slate-800 border-slate-700 text-slate-400 text-xs h-8"
            />
            <Button
              size="sm"
              onClick={handleCopyLink}
              className={cn(
                'text-xs h-8',
                copied
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700',
              )}
            >
              {copied ? (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              ) : (
                <Copy className="w-3 h-3 mr-1" />
              )}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
