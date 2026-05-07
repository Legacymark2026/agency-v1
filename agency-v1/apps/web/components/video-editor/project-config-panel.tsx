'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProjectConfig } from '@/actions/video-editor';

interface ProjectConfigPanelProps {
  config: Partial<ProjectConfig>;
  onChange: (config: Partial<ProjectConfig>) => void;
}

const PROJECT_TYPES = [
  { value: 'product-showcase', label: 'Product Showcase', desc: 'Destaca tu producto con belleza' },
  { value: 'educational', label: 'Educacional', desc: 'Enseña algo útil a tu audiencia' },
  { value: 'brand-marketing', label: 'Brand Marketing', desc: 'Construye identidad de marca' },
  { value: 'viral', label: 'Viral / Atractivo', desc: 'Maximiza engagement y shares' },
  { value: 'documentary', label: 'Documental', desc: 'Cuenta una historia profunda' },
  { value: 'event', label: 'Eventos', desc: 'Captura momentos especiales' },
  { value: 'hybrid', label: 'Híbrido', desc: 'Mezcla varios estilos' },
] as const;

const FORMATS = [
  { value: '9:16', label: '9:16 Vertical', platforms: ['TikTok', 'Reels'] },
  { value: '16:9', label: '16:9 Horizontal', platforms: ['YouTube'] },
  { value: '4:5', label: '4:5 Portrait', platforms: ['Instagram Feed'] },
  { value: '1:1', label: '1:1 Square', platforms: ['Instagram Feed', 'Facebook'] },
] as const;

const STYLES = [
  { value: 'cinematic', label: 'Cinematic', desc: 'Film look profesional', icon: '🎬' },
  { value: 'viral', label: 'Viral', desc: 'Alta energía, rápido', icon: '⚡' },
  { value: 'corporate', label: 'Corporate', desc: 'Profesional y limpio', icon: '💼' },
  { value: 'luxury', label: 'Luxury', desc: 'Elegante y premium', icon: '✨' },
  { value: 'bohemian', label: 'Bohemian', desc: 'Artesanal y orgánico', icon: '🌿' },
] as const;

const RHYTHMS = [
  { value: 'fast', label: 'Fast', desc: 'Cortes rápidos 1.5s', cuts: '~15 cortes' },
  { value: 'medium', label: 'Medium', desc: 'Ritmo balanced 3s', cuts: '~8 cortes' },
  { value: 'cinematic', label: 'Cinematic', desc: 'Lento y dramático 5s', cuts: '~4 cortes' },
] as const;

const PLATFORMS = [
  { value: 'tiktok', label: 'TikTok', color: 'bg-pink-500' },
  { value: 'reels', label: 'Instagram Reels', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { value: 'youtube', label: 'YouTube', color: 'bg-red-600' },
  { value: 'instagram-feed', label: 'Instagram Feed', color: 'bg-pink-600' },
  { value: 'facebook', label: 'Facebook', color: 'bg-blue-600' },
  { value: 'multi', label: 'Multi-Platform', color: 'bg-gradient-to-r from-blue-500 via-green-500 to-red-500' },
] as const;

export function ProjectConfigPanel({ config, onChange }: ProjectConfigPanelProps) {
  const [name, setName] = useState(config.name || '');
  const [projectType, setProjectType] = useState<ProjectConfig['type']>(config.type || 'product-showcase');
  const [format, setFormat] = useState<ProjectConfig['format']>(config.format || '9:16');
  const [style, setStyle] = useState<ProjectConfig['style']>(config.style || 'cinematic');
  const [rhythm, setRhythm] = useState<ProjectConfig['rhythm']>(config.rhythm || 'medium');
  const [platform, setPlatform] = useState<ProjectConfig['platform']>(config.platform || 'tiktok');
  const [duration, setDuration] = useState(config.duration || 20);
  const [hookDuration, setHookDuration] = useState(config.hookDuration || 3);

  const handleChange = (updates: Partial<ProjectConfig>) => {
    const newConfig = {
      ...config,
      ...updates,
      name: name || 'Untitled Project',
    };
    onChange(newConfig);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-300">Nombre del Proyecto</Label>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            handleChange({ name: e.target.value });
          }}
          placeholder="Mi Video Promocional"
          className="h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Project Type */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Tipo de Proyecto</CardTitle>
          <CardDescription className="text-slate-400">Selecciona el objetivo principal del video</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setProjectType(type.value);
                  handleChange({ type: type.value });
                }}
                className={cn(
                  "p-3 rounded-lg text-left transition-all border",
                  projectType === type.value
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-slate-700 bg-slate-800 hover:border-slate-600"
                )}
              >
                <div className="text-sm font-medium text-white">{type.label}</div>
                <div className="text-xs text-slate-400 mt-1">{type.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Format & Platform */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Formato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setFormat(f.value);
                  handleChange({ format: f.value });
                }}
                className={cn(
                  "w-full p-2 rounded-lg text-left transition-all border flex items-center justify-between",
                  format === f.value
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-slate-700 bg-slate-800 hover:border-slate-600"
                )}
              >
                <span className="text-sm font-medium text-white">{f.label}</span>
                <div className="flex gap-1">
                  {f.platforms.map(p => (
                    <Badge key={p} variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                      {p}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">Plataforma Destino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setPlatform(p.value);
                  handleChange({ platform: p.value });
                }}
                className={cn(
                  "w-full p-2 rounded-lg text-left transition-all border flex items-center gap-3",
                  platform === p.value
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-slate-700 bg-slate-800 hover:border-slate-600"
                )}
              >
                <div className={cn("w-3 h-3 rounded-full", p.color)} />
                <span className="text-sm font-medium text-white">{p.label}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Style */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Estilo Visual</CardTitle>
          <CardDescription className="text-slate-400">Define la atmósfera y apariencia del video</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setStyle(s.value);
                  handleChange({ style: s.value });
                }}
                className={cn(
                  "p-3 rounded-lg text-center transition-all border",
                  style === s.value
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-slate-700 bg-slate-800 hover:border-slate-600"
                )}
              >
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-sm font-medium text-white">{s.label}</div>
                <div className="text-xs text-slate-400 mt-1">{s.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rhythm */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Ritmo de Edición</CardTitle>
          <CardDescription className="text-slate-400">Qué tan rápido quieres los cortes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {RHYTHMS.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  setRhythm(r.value);
                  handleChange({ rhythm: r.value });
                }}
                className={cn(
                  "p-3 rounded-lg text-center transition-all border",
                  rhythm === r.value
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-slate-700 bg-slate-800 hover:border-slate-600"
                )}
              >
                <div className="text-sm font-medium text-white">{r.label}</div>
                <div className="text-xs text-slate-400 mt-1">{r.desc}</div>
                <div className="text-xs text-teal-400 mt-1">{r.cuts}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Duration Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-300">Duración Total (segundos)</Label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => {
              setDuration(Number(e.target.value));
              handleChange({ duration: Number(e.target.value) });
            }}
            min={5}
            max={180}
            className="h-11 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-300">Duración del Hook (segundos)</Label>
          <Input
            type="number"
            value={hookDuration}
            onChange={(e) => {
              setHookDuration(Number(e.target.value));
              handleChange({ hookDuration: Number(e.target.value) });
            }}
            min={1}
            max={10}
            className="h-11 bg-slate-800 border-slate-700 text-white"
          />
        </div>
      </div>
    </div>
  );
}