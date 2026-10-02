"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Files, Plus, Video, FileText, Image as ImageIcon, Loader2,
  Trash2, Copy, Navigation, Search, Filter, HardDrive, Clock,
  Film, Tag, X
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getMediaAssets, deleteMediaAsset, getMediaStats } from "@/actions/media";
import type { MediaAsset } from "@/actions/media";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type MediaType = 'all' | 'image' | 'video' | 'document' | 'audio' | 'other';

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  image:    ImageIcon,
  video:    Video,
  document: FileText,
  audio:    Files,
  other:    Files,
};

const TYPE_COLORS: Record<string, string> = {
  image:    'text-pink-400 bg-pink-500/10 border-pink-500/20',
  video:    'text-teal-400 bg-teal-500/10 border-teal-500/20',
  document: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  audio:    'text-purple-400 bg-purple-500/10 border-purple-500/20',
  other:    'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

function MediaCard({
  asset,
  onDelete,
  onUseInEditor,
}: {
  asset: MediaAsset;
  onDelete: () => void;
  onUseInEditor: () => void;
}) {
  const Icon = TYPE_ICONS[asset.type] ?? Files;
  const colorClass = TYPE_COLORS[asset.type] ?? TYPE_COLORS.other;

  const copyUrl = () => {
    const fullUrl = `${window.location.origin}${asset.url}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("URL copiada al portapapeles");
  };

  return (
    <div className="ds-card rounded-xl overflow-hidden group hover:border-teal-500/50 transition-all duration-300">
      {/* Preview */}
      <div className="aspect-video bg-slate-900 flex items-center justify-center relative border-b border-slate-800">
        {asset.type === 'image' ? (
          <Image
            src={asset.url}
            alt={asset.name}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : asset.type === 'video' ? (
          <div className="flex flex-col items-center gap-2">
            <Video className="w-10 h-10 text-teal-500/60 group-hover:text-teal-400 transition-colors" />
            {asset.duration && (
              <span className="text-xs text-slate-500 font-mono">
                {asset.duration.toFixed(0)}s
              </span>
            )}
          </div>
        ) : (
          <Icon className="w-10 h-10 text-slate-600 group-hover:text-slate-500 transition-colors" />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all duration-300">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/10 hover:bg-white/20 text-white h-8 text-xs"
            onClick={() => window.open(asset.url, '_blank')}
          >
            <Navigation className="w-3.5 h-3.5 mr-1" />
            Abrir
          </Button>
          {asset.type === 'video' && (
            <Button
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 h-8 text-xs"
              onClick={onUseInEditor}
            >
              <Film className="w-3.5 h-3.5 mr-1" />
              Usar en Editor
            </Button>
          )}
        </div>

        {/* Type badge */}
        <div className={cn('absolute top-2 left-2 px-1.5 py-0.5 rounded border text-[10px] font-medium uppercase', colorClass)}>
          {asset.type}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-slate-200 truncate" title={asset.name}>
          {asset.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-slate-500">
            {formatBytes(asset.sizeBytes)}
          </span>
          <span className="text-xs text-slate-600">
            {formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true, locale: es })}
          </span>
        </div>
        {asset.resolution && (
          <p className="text-[10px] text-slate-600 font-mono mt-0.5">{asset.resolution}</p>
        )}

        {/* Actions */}
        <div className="flex gap-1.5 mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-900/30 gap-1 px-2 flex-1"
            onClick={copyUrl}
          >
            <Copy className="w-3 h-3" />
            Copiar URL
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MediaManagerPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<MediaType>('all');
  const [stats, setStats] = useState<{ total: number; byType: Record<string, number>; totalSizeBytes: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        getMediaAssets(),
        import('@/actions/media').then(m => m.getMediaStats()),
      ]);
      setAssets(data);
      setStats(statsData);
    } catch {
      toast.error('Error cargando medios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Extraer metadatos del archivo si es video/imagen
        let metadata: Record<string, any> = {};

        if (file.type.startsWith('video/')) {
          metadata = await extractVideoMetadata(file);
        } else if (file.type.startsWith('image/')) {
          metadata = await extractImageMetadata(file);
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify({ ...metadata, name: file.name }));

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(`Error subiendo ${file.name}: ${data.error}`);
          continue;
        }

        toast.success(`${file.name} subido correctamente`);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));

      } catch (err: any) {
        toast.error(`Error con ${file.name}: ${err.message}`);
      }
    }

    setIsUploading(false);
    setShowUploader(false);
    loadAssets(); // Recargar desde DB
  };

  const extractVideoMetadata = (file: File): Promise<Record<string, any>> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve({
          duration:   video.duration,
          width:      video.videoWidth,
          height:     video.videoHeight,
          resolution: `${video.videoWidth}x${video.videoHeight}`,
        });
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => {
        resolve({});
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const extractImageMetadata = (file: File): Promise<Record<string, any>> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        resolve({
          width:      img.naturalWidth,
          height:     img.naturalHeight,
          resolution: `${img.naturalWidth}x${img.naturalHeight}`,
        });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => { resolve({}); URL.revokeObjectURL(img.src); };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}" permanentemente?`)) return;
    try {
      await deleteMediaAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
      toast.success('Archivo eliminado');
      loadAssets();
    } catch {
      toast.error('Error eliminando el archivo');
    }
  };

  const handleUseInEditor = (asset: MediaAsset) => {
    router.push(`/dashboard/video?asset=${asset.id}`);
  };

  const filtered = assets.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchType   = filterType === 'all' || a.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="ds-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="ds-heading-1 flex items-center gap-3">
            <Files className="text-teal-400" size={28} />
            Gestor de Medios
          </h1>
          <p className="ds-body-text mt-1 text-slate-400">
            Almacenamiento de archivos en VPS con persistencia de base de datos
          </p>
        </div>
        <Button
          className="ds-btn-primary gap-2"
          onClick={() => setShowUploader(!showUploader)}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
          Subir Archivo
        </Button>
      </div>

      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="ds-card rounded-xl p-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <HardDrive className="w-4 h-4 text-teal-400" />
              <span className="text-xs">Total usado</span>
            </div>
            <p className="text-lg font-bold text-white">{formatBytes(stats.totalSizeBytes)}</p>
          </div>
          {(['image', 'video', 'document', 'audio'] as MediaType[]).map(type => (
            <div key={type} className="ds-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                {React.createElement(TYPE_ICONS[type] ?? Files, { className: cn('w-4 h-4', TYPE_COLORS[type]?.split(' ')[0]) })}
                <span className="text-xs text-slate-400 capitalize">{type === 'image' ? 'Imágenes' : type === 'video' ? 'Videos' : type === 'document' ? 'Docs' : 'Audio'}</span>
              </div>
              <p className="text-lg font-bold text-white">{stats.byType[type] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Uploader */}
      {showUploader && (
        <div className="mb-8 p-6 ds-card rounded-2xl animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white tracking-tight">Subir archivos al VPS</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowUploader(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
              isUploading ? 'border-teal-500 bg-teal-500/5' : 'border-slate-700 hover:border-teal-500/50'
            )}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            {isUploading ? (
              <div className="space-y-3">
                <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto" />
                <p className="text-white font-medium">Subiendo... {uploadProgress}%</p>
                <div className="w-48 mx-auto h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <>
                <Files className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-white font-semibold">Arrastra archivos aquí</p>
                <p className="text-slate-400 text-sm mt-1">o haz clic para seleccionar</p>
                <p className="text-slate-600 text-xs mt-3">Imágenes (50MB) · Videos (500MB) · Documentos (100MB) · Audio (100MB)</p>
                <p className="text-slate-600 text-xs mt-1">Los metadatos (resolución, duración, FPS) se extraen automáticamente</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      {assets.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Buscar archivo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'image', 'video', 'document', 'audio'] as MediaType[]).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filterType === t
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white',
                )}
              >
                {t === 'all' ? 'Todos' : t === 'image' ? 'Imágenes' : t === 'video' ? 'Videos' : t === 'document' ? 'Docs' : 'Audio'}
                {t !== 'all' && stats?.byType[t] ? ` (${stats.byType[t]})` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 ds-card rounded-2xl border-dashed">
          <Files size={48} className="text-slate-700 mb-4" />
          <h3 className="text-slate-300 font-medium mb-1">
            {assets.length === 0 ? 'Sin archivos todavía' : 'Sin resultados'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm text-center">
            {assets.length === 0
              ? 'Sube imágenes, videos y documentos. Se guardan en el VPS y persisten en la base de datos.'
              : 'Intenta con otros filtros o términos de búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(asset => (
            <MediaCard
              key={asset.id}
              asset={asset}
              onDelete={() => handleDelete(asset.id, asset.name)}
              onUseInEditor={() => handleUseInEditor(asset)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
