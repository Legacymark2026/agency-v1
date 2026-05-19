'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Film, Plus, Clock, Zap, Play, Trash2, MoreVertical,
  Loader2, Sparkles, Video, Copy, Search, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getVideoProjects, createVideoProject, deleteVideoProject } from '@/actions/video-editor';
import type { VideoProject } from '@/actions/video-editor';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const PLATFORM_COLORS: Record<string, string> = {
  reels:     'bg-pink-500/20 text-pink-400 border-pink-500/30',
  tiktok:    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  youtube:   'bg-red-500/20 text-red-400 border-red-500/30',
  facebook:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  stories:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const STYLE_GRADIENTS: Record<string, string> = {
  cinematic:     'from-slate-800 to-slate-900',
  luxury:        'from-amber-950 to-slate-900',
  viral:         'from-pink-950 to-slate-900',
  corporate:     'from-blue-950 to-slate-900',
  'warm-artisan':'from-orange-950 to-slate-900',
};

function ProjectCard({
  project,
  onOpen,
  onDelete,
}: {
  project: VideoProject;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const config = project.config as any;
  const gradient = STYLE_GRADIENTS[config?.style ?? 'cinematic'];
  const platformColor = PLATFORM_COLORS[config?.platform ?? ''] ?? 'bg-slate-700 text-slate-300';
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative rounded-2xl border border-slate-800 overflow-hidden hover:border-teal-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/5">
      {/* Thumbnail */}
      <div className={cn('h-40 bg-gradient-to-br relative', gradient)}>
        {/* Film grain */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: 'cover' }}
        />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Film className="w-7 h-7 text-white/80" />
          </div>
        </div>
        {/* Format badge */}
        {config?.format && (
          <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[10px] font-mono text-white/80">
            {config.format}
          </div>
        )}
        {/* Duration */}
        {project.timeline && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[10px] text-white/80">
            <Clock className="w-3 h-3" />
            {(project.timeline as any)?.totalDuration?.toFixed(0) ?? '?'}s
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" onClick={onOpen} className="bg-teal-600 hover:bg-teal-700 h-8">
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Abrir
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-slate-900">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: es })}
            </p>
          </div>
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-10 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-32">
                <button
                  onClick={() => { setMenuOpen(false); onOpen(); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" /> Abrir editor
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {config?.platform && (
            <Badge className={cn('text-[10px] border', platformColor)}>
              {config.platform}
            </Badge>
          )}
          {config?.style && (
            <Badge className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
              {config.style}
            </Badge>
          )}
          {project.qualityCheck?.passed && (
            <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
              ✓ QA OK
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>{(project.clips as any[])?.length ?? 0} clips</span>
            <span>{(project.audioTracks as any[])?.length ?? 0} tracks</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all"
              style={{
                width: `${Math.min(
                  (((project.clips as any[])?.length > 0 ? 20 : 0)
                    + (project.timeline ? 30 : 0)
                    + ((project.colorGrades as any[])?.length > 0 ? 15 : 0)
                    + ((project.audioTracks as any[])?.length > 0 ? 15 : 0)
                    + ((project.textOverlays as any[])?.length > 0 ? 10 : 0)
                    + (project.qualityCheck?.passed ? 10 : 0)),
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  useEffect(() => {
    getVideoProjects()
      .then(setProjects)
      .catch(() => toast.error('Error cargando proyectos'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const project = await createVideoProject({
        name: `Proyecto ${new Date().toLocaleDateString('es')}`,
        config: {} as any,
        clips: [],
        audioTracks: [],
        textOverlays: [],
        colorGrades: [],
        speedRamps: [],
        soundLayers: [],
      });
      router.push(`/dashboard/video/${project.id}`);
    } catch {
      toast.error('Error creando proyecto');
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proyecto permanentemente?')) return;
    try {
      await deleteVideoProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Proyecto eliminado');
    } catch {
      toast.error('Error eliminando proyecto');
    }
  };

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const config = p.config as any;
    const matchPlatform = filterPlatform === 'all' || config?.platform === filterPlatform;
    return matchSearch && matchPlatform;
  });

  return (
    <div className="ds-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="ds-heading-1 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            Video Studio
          </h1>
          <p className="ds-body-text mt-1 text-slate-400">
            Crea y gestiona proyectos de edición de video con IA
          </p>
        </div>
        <Button
          onClick={handleCreate}
          disabled={isCreating}
          className="bg-teal-600 hover:bg-teal-700 gap-2 h-10"
        >
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Nuevo Proyecto
        </Button>
      </div>

      {/* Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total proyectos', value: projects.length, icon: Film, color: 'text-teal-400' },
            { label: 'Listos para render', value: projects.filter(p => p.qualityCheck?.passed).length, icon: Zap, color: 'text-emerald-400' },
            { label: 'Con timeline', value: projects.filter(p => !!p.timeline).length, icon: Play, color: 'text-blue-400' },
            { label: 'Clips totales', value: projects.reduce((acc, p) => acc + ((p.clips as any[])?.length ?? 0), 0), icon: Video, color: 'text-purple-400' },
          ].map((stat) => (
            <div key={stat.label} className="ds-card rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <stat.icon className={cn('w-4 h-4', stat.color)} />
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {projects.length > 0 && (
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Buscar proyecto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'reels', 'tiktok', 'youtube', 'facebook'].map(p => (
              <button
                key={p}
                onClick={() => setFilterPlatform(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filterPlatform === p
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white',
                )}
              >
                {p === 'all' ? 'Todos' : p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-600/20 border border-teal-500/30 flex items-center justify-center mb-6">
            <Film className="w-10 h-10 text-teal-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Sin proyectos todavía</h2>
          <p className="text-slate-400 text-sm max-w-sm mb-6">
            Crea tu primer proyecto de video y usa la IA para generar timelines, aplicar color grading y exportar listos para publicar.
          </p>
          <Button onClick={handleCreate} disabled={isCreating} className="bg-teal-600 hover:bg-teal-700 gap-2">
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Crear mi primer proyecto
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          No se encontraron proyectos con esos filtros
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => router.push(`/dashboard/video/${project.id}`)}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
