'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Check, Plus, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandStyle {
  id: string;
  clientName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  subtitlePreset?: any;
}

interface BrandStylePickerProps {
  styles: BrandStyle[];
  selectedId?: string;
  onSelect?: (style: BrandStyle) => void;
  onCreate?: (style: Partial<BrandStyle>) => void;
}

export function BrandStylePicker({ styles, selectedId, onSelect, onCreate }: BrandStylePickerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newStyle, setNewStyle] = useState({
    clientName: '',
    primaryColor: '#6D28D9',
    secondaryColor: '#FFFFFF',
    accentColor: '#10B981',
    fontFamily: 'Inter',
  });

  const handleCreate = () => {
    onCreate?.(newStyle);
    setShowCreate(false);
    setNewStyle({
      clientName: '',
      primaryColor: '#6D28D9',
      secondaryColor: '#FFFFFF',
      accentColor: '#10B981',
      fontFamily: 'Inter',
    });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            Estilos de Marca
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
            className="text-slate-400 hover:text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription className="text-slate-400">
          Selecciona o crea un estilo de marca
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {showCreate && (
          <div className="mb-4 p-4 bg-slate-900/50 rounded-lg space-y-3">
            <div>
              <Label className="text-slate-300 text-sm">Nombre del cliente</Label>
              <Input
                value={newStyle.clientName}
                onChange={(e) => setNewStyle({ ...newStyle, clientName: e.target.value })}
                placeholder="Ej: Nido Joyería"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-300 text-sm">Primario</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={newStyle.primaryColor}
                    onChange={(e) => setNewStyle({ ...newStyle, primaryColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <span className="text-xs text-slate-400">{newStyle.primaryColor}</span>
                </div>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Secundario</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={newStyle.secondaryColor}
                    onChange={(e) => setNewStyle({ ...newStyle, secondaryColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <span className="text-xs text-slate-400">{newStyle.secondaryColor}</span>
                </div>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Acento</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={newStyle.accentColor}
                    onChange={(e) => setNewStyle({ ...newStyle, accentColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <span className="text-xs text-slate-400">{newStyle.accentColor}</span>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Fuente</Label>
              <select
                value={newStyle.fontFamily}
                onChange={(e) => setNewStyle({ ...newStyle, fontFamily: e.target.value })}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value="Inter">Inter</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Cormorant Garamond">Cormorant Garamond</option>
                <option value="Roboto">Roboto</option>
              </select>
            </div>
            <Button onClick={handleCreate} className="w-full bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Crear Estilo
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => onSelect?.(style)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                selectedId === style.id
                  ? 'bg-purple-500/20 border border-purple-500/30'
                  : 'bg-slate-900/50 border border-transparent hover:bg-slate-900',
              )}
            >
              <div className="flex -space-x-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-slate-800"
                  style={{ backgroundColor: style.primaryColor }}
                />
                <div
                  className="w-6 h-6 rounded-full border-2 border-slate-800"
                  style={{ backgroundColor: style.secondaryColor }}
                />
                <div
                  className="w-6 h-6 rounded-full border-2 border-slate-800"
                  style={{ backgroundColor: style.accentColor }}
                />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{style.clientName}</p>
                <p className="text-slate-500 text-xs">{style.fontFamily}</p>
              </div>
              {selectedId === style.id && (
                <Check className="w-4 h-4 text-purple-400" />
              )}
            </button>
          ))}

          {styles.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-8">
              No hay estilos de marca guardados
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
