'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Type, AlignCenter, AlignStart, AlignEnd, Trash2, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TextOverlay } from '@/actions/video-editor';

interface TextOverlaysEditorProps {
  textOverlays: TextOverlay[];
  onTextOverlaysChange: (overlays: TextOverlay[]) => void;
  format?: string;
  platform?: string;
}

const POSITIONS = [
  { value: 'top', label: 'Superior', icon: AlignStart },
  { value: 'center', label: 'Centro', icon: AlignCenter },
  { value: 'bottom', label: 'Inferior', icon: AlignEnd },
] as const;

const ANIMATIONS = [
  { value: 'none', label: 'Sin animación' },
  { value: 'fade', label: 'Fade in' },
  { value: 'slide', label: 'Slide in' },
  { value: 'typewriter', label: 'Typewriter' },
] as const;

const FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Bebas Neue', label: 'Bebas Neue' },
] as const;

const COLORS = [
  { value: '#FFFFFF', label: 'White' },
  { value: '#000000', label: 'Black' },
  { value: '#FF0000', label: 'Red' },
  { value: '#00FF00', label: 'Green' },
  { value: '#0000FF', label: 'Blue' },
  { value: '#FFD700', label: 'Gold' },
];

export function TextOverlaysEditor({ textOverlays, onTextOverlaysChange, format = '9:16', platform = 'tiktok' }: TextOverlaysEditorProps) {
  const [newText, setNewText] = useState('');
  const [newPosition, setNewPosition] = useState<TextOverlay['position']>('center');
  const [newAnimation, setNewAnimation] = useState<TextOverlay['animation']>('fade');
  const [newColor, setNewColor] = useState('#FFFFFF');

  const addTextOverlay = () => {
    if (!newText.trim()) return;

    const newOverlay: TextOverlay = {
      id: `text_${Date.now()}`,
      text: newText,
      position: newPosition,
      animation: newAnimation,
      font: 'Inter',
      color: newColor,
      safeZone: checkSafeZone(newPosition, format, platform),
      duration: 3,
      startTime: 0
    };

    onTextOverlaysChange([...textOverlays, newOverlay]);
    setNewText('');
  };

  const removeOverlay = (id: string) => {
    onTextOverlaysChange(textOverlays.filter(o => o.id !== id));
  };

  const checkSafeZone = (position: string, fmt: string, plat: string): boolean => {
    // Simple safe zone check for 9:16 TikTok/Reels
    if (fmt === '9:16' && (plat === 'tiktok' || plat === 'reels')) {
      if (position === 'top') return false; // Top 15% is UI
      if (position === 'bottom') return false; // Bottom 25% is UI
    }
    return true;
  };

  const getSafeZoneWarnings = () => {
    const warnings: string[] = [];
    textOverlays.forEach(overlay => {
      if (!overlay.safeZone) {
        warnings.push(`"${overlay.text}" está fuera de zona segura para ${platform}`);
      }
    });
    return warnings;
  };

  return (
    <div className="space-y-6">
      {/* Add New Text */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Type className="w-5 h-5 text-cyan-400" />
            Añadir Texto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Escribe tu texto..."
              className="flex-1 bg-slate-800 border-slate-700 text-white"
              onKeyDown={(e) => e.key === 'Enter' && addTextOverlay()}
            />
            <Button onClick={addTextOverlay} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-slate-400 mb-1">Posición</Label>
              <Select value={newPosition} onValueChange={(v) => setNewPosition(v as any)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {POSITIONS.map(p => (
                    <SelectItem key={p.value} value={p.value} className="text-white">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-400 mb-1">Animación</Label>
              <Select value={newAnimation} onValueChange={(v) => setNewAnimation(v as any)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {ANIMATIONS.map(a => (
                    <SelectItem key={a.value} value={a.value} className="text-white">
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-400 mb-1">Color</Label>
              <div className="flex gap-1">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setNewColor(c.value)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2",
                      newColor === c.value ? "border-white" : "border-transparent"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Text List */}
      {textOverlays.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">
              Textos Añadidos ({textOverlays.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {textOverlays.map(overlay => (
              <div key={overlay.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: overlay.color + '20', color: overlay.color }}
                  >
                    T
                  </div>
                  <div>
                    <p className="text-white text-sm">{overlay.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                        {overlay.position}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                        {overlay.animation}
                      </Badge>
                      {overlay.safeZone ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                          <CheckCircle className="w-3 h-3" /> Safe zone
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400">
                          <AlertTriangle className="w-3 h-3" /> Warning
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeOverlay(overlay.id)} className="text-slate-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Safe Zone Warnings */}
      {getSafeZoneWarnings().length > 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 font-medium text-sm">Zonas de Seguridad</p>
                <ul className="mt-1 space-y-1">
                  {getSafeZoneWarnings().map((w, i) => (
                    <li key={i} className="text-amber-300 text-xs">{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}