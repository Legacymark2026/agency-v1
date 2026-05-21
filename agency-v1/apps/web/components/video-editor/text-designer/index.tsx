'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, Eye, EyeOff } from 'lucide-react';

interface TextOverlayConfig {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  position: string;
  animation: string;
  shadow: boolean;
  backgroundColor: string;
  backgroundOpacity: number;
}

interface TextOverlayDesignerProps {
  config: TextOverlayConfig;
  onChange?: (config: TextOverlayConfig) => void;
  previewDuration?: number;
}

export function TextOverlayDesigner({ config, onChange, previewDuration = 5 }: TextOverlayDesignerProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [localConfig, setLocalConfig] = useState(config);

  const updateConfig = (key: keyof TextOverlayConfig, value: any) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
    onChange?.(updated);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Type className="w-5 h-5 text-amber-400" />
            Text Overlay Designer
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="text-slate-400"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        {showPreview && (
          <div className="relative h-32 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
            <div
              className="px-4 py-2 rounded"
              style={{
                fontFamily: localConfig.fontFamily,
                fontSize: `${Math.min(localConfig.fontSize, 32)}px`,
                color: localConfig.color,
                textShadow: localConfig.shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                backgroundColor: localConfig.backgroundColor,
                opacity: localConfig.backgroundOpacity / 100,
              }}
            >
              {localConfig.text || 'Sample Text'}
            </div>
          </div>
        )}

        <div>
          <Label className="text-slate-300 text-sm">Texto</Label>
          <Input
            value={localConfig.text}
            onChange={(e) => updateConfig('text', e.target.value)}
            placeholder="Escribe el texto..."
            className="bg-slate-900 border-slate-700 text-white mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-slate-300 text-sm">Fuente</Label>
            <Select value={localConfig.fontFamily} onValueChange={(v) => updateConfig('fontFamily', v)}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
                <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300 text-sm">Tamaño: {localConfig.fontSize}px</Label>
            <Slider
              value={[localConfig.fontSize]}
              onValueChange={([v]) => updateConfig('fontSize', v)}
              min={12}
              max={120}
              step={2}
              className="mt-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-slate-300 text-sm">Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={localConfig.color}
                onChange={(e) => updateConfig('color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <span className="text-xs text-slate-400">{localConfig.color}</span>
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-sm">Posición</Label>
            <Select value={localConfig.position} onValueChange={(v) => updateConfig('position', v)}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Arriba</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="bottom">Abajo</SelectItem>
                <SelectItem value="bottom_left">Abajo izquierda</SelectItem>
                <SelectItem value="bottom_right">Abajo derecha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-slate-300 text-sm">Animación</Label>
            <Select value={localConfig.animation} onValueChange={(v) => updateConfig('animation', v)}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide_up">Slide Up</SelectItem>
                <SelectItem value="slide_down">Slide Down</SelectItem>
                <SelectItem value="typewriter">Typewriter</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant={localConfig.shadow ? 'default' : 'outline'}
              onClick={() => updateConfig('shadow', !localConfig.shadow)}
              className="w-full"
            >
              Sombra {localConfig.shadow ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
