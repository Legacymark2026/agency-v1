'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Download,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Film,
  Monitor,
  Smartphone,
  Tablet,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Linkedin,
  FileVideo,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportPreset {
  id: string;
  name: string;
  label: string;
  resolution: string;
  format: string;
  fps: number;
  bitrate: string;
  icon: typeof Film;
  color: string;
}

interface ExportJob {
  id: string;
  presetId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputUrl?: string;
  errorMessage?: string;
}

interface MultiExportPanelProps {
  jobs?: ExportJob[];
  onStartExport?: (presetIds: string[]) => void;
  onCancel?: (jobId: string) => void;
  onDownload?: (jobId: string) => void;
  isExporting?: boolean;
}

const exportPresets: ExportPreset[] = [
  { id: 'youtube', name: 'YouTube HD', label: 'YouTube', resolution: '1920x1080', format: 'MP4 H.264', fps: 30, bitrate: '16 Mbps', icon: Youtube, color: 'text-red-400' },
  { id: 'instagram_feed', name: 'Instagram Feed', label: 'Instagram', resolution: '1080x1080', format: 'MP4 H.264', fps: 30, bitrate: '8 Mbps', icon: Instagram, color: 'text-pink-400' },
  { id: 'instagram_reels', name: 'Instagram Reels', label: 'Reels', resolution: '1080x1920', format: 'MP4 H.264', fps: 30, bitrate: '10 Mbps', icon: Smartphone, color: 'text-rose-400' },
  { id: 'tiktok', name: 'TikTok', label: 'TikTok', resolution: '1080x1920', format: 'MP4 H.264', fps: 30, bitrate: '8 Mbps', icon: Film, color: 'text-cyan-400' },
  { id: 'facebook', name: 'Facebook HD', label: 'Facebook', resolution: '1920x1080', format: 'MP4 H.264', fps: 30, bitrate: '12 Mbps', icon: Facebook, color: 'text-blue-400' },
  { id: 'twitter', name: 'Twitter/X', label: 'Twitter/X', resolution: '1280x720', format: 'MP4 H.264', fps: 30, bitrate: '6 Mbps', icon: Twitter, color: 'text-sky-400' },
  { id: 'linkedin', name: 'LinkedIn', label: 'LinkedIn', resolution: '1920x1080', format: 'MP4 H.264', fps: 30, bitrate: '8 Mbps', icon: Linkedin, color: 'text-blue-500' },
  { id: 'web_optimized', name: 'Web Optimizado', label: 'Web', resolution: '1280x720', format: 'WebM VP9', fps: 30, bitrate: '4 Mbps', icon: Monitor, color: 'text-emerald-400' },
];

export function MultiExportPanel({
  jobs = [],
  onStartExport,
  onCancel,
  onDownload,
  isExporting = false,
}: MultiExportPanelProps) {
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);

  const togglePreset = (presetId: string) => {
    setSelectedPresets((prev) => {
      const next = new Set(prev);
      if (next.has(presetId)) {
        next.delete(presetId);
      } else {
        next.add(presetId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedPresets(new Set(exportPresets.map((p) => p.id)));
  };

  const deselectAll = () => {
    setSelectedPresets(new Set());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 text-slate-400" />;
      case 'processing':
        return <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            Exportación Múltiple
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px]',
              selectedPresets.size > 0
                ? 'border-emerald-500/30 text-emerald-400'
                : 'border-slate-600 text-slate-500',
            )}
          >
            {selectedPresets.size} seleccionados
          </Badge>
        </div>
        <CardDescription className="text-slate-400">
          Exporta a múltiples plataformas simultáneamente
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={selectAll}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 text-[10px] h-7 flex-1"
          >
            Seleccionar todo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={deselectAll}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 text-[10px] h-7 flex-1"
          >
            Desseleccionar
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {exportPresets.map((preset) => {
            const isSelected = selectedPresets.has(preset.id);
            const Icon = preset.icon;
            const activeJob = jobs.find((j) => j.presetId === preset.id);

            return (
              <button
                key={preset.id}
                onClick={() => !activeJob && togglePreset(preset.id)}
                disabled={!!activeJob}
                className={cn(
                  'flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left',
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600',
                  activeJob && 'opacity-60',
                )}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800')}>
                  <Icon className={cn('w-4 h-4', preset.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium">{preset.name}</p>
                  <p className="text-[10px] text-slate-500">{preset.resolution}</p>
                </div>
                {activeJob ? (
                  <div className="flex items-center gap-1">
                    {getStatusIcon(activeJob.status)}
                  </div>
                ) : (
                  <div
                    className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                      isSelected
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-600',
                    )}
                  >
                    {isSelected && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <Button
          size="sm"
          onClick={() => onStartExport?.(Array.from(selectedPresets))}
          disabled={selectedPresets.size === 0 || isExporting}
          className={cn(
            'w-full text-xs h-9',
            isExporting
              ? 'bg-slate-700 text-slate-400'
              : 'bg-emerald-600 hover:bg-emerald-700',
          )}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {isExporting
            ? 'Exportando...'
            : `Exportar a ${selectedPresets.size} plataforma${selectedPresets.size !== 1 ? 's' : ''}`}
        </Button>

        {jobs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-medium">Trabajos activos</p>
            {jobs.map((job) => {
              const preset = exportPresets.find((p) => p.id === job.presetId);
              return (
                <div
                  key={job.id}
                  className="p-3 bg-slate-900/50 rounded-lg space-y-2"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <span className="text-white text-xs flex-1">
                      {preset?.name || job.presetId}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        job.status === 'completed' && 'border-emerald-500/30 text-emerald-400',
                        job.status === 'failed' && 'border-red-500/30 text-red-400',
                        job.status === 'processing' && 'border-amber-500/30 text-amber-400',
                      )}
                    >
                      {job.status}
                    </Badge>
                  </div>

                  {(job.status === 'processing' || job.status === 'pending') && (
                    <Progress value={job.progress} className="h-1.5 bg-slate-700" />
                  )}

                  {job.status === 'failed' && job.errorMessage && (
                    <p className="text-[10px] text-red-400">{job.errorMessage}</p>
                  )}

                  {job.status === 'completed' && job.outputUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDownload?.(job.id)}
                      className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs h-7"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Descargar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
