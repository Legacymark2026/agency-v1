'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Film, Music, Palette, Image, Download, Plus } from 'lucide-react';

interface Asset {
  id: string;
  type: 'transition' | 'sfx' | 'lut' | 'broll';
  name: string;
  thumbnail: string;
  tags: string[];
  duration?: number;
  isPremium?: boolean;
}

interface AssetLibraryProps {
  assets: Asset[];
  onInsert?: (asset: Asset) => void;
}

const ASSET_ICONS = {
  transition: Film,
  sfx: Music,
  lut: Palette,
  broll: Image,
};

export function AssetLibrary({ assets, onInsert }: AssetLibraryProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const filtered = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'all' || a.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-teal-400" />
          Biblioteca de Assets
        </CardTitle>
        <CardDescription className="text-slate-400">
          Transiciones, SFX, LUTs y B-roll
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar assets..."
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />

          <div className="flex gap-2">
            {['all', 'transition', 'sfx', 'lut', 'broll'].map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? 'bg-teal-600 hover:bg-teal-700' : 'border-slate-600 text-slate-400'}
              >
                {f === 'all' ? 'Todos' : f.toUpperCase()}
              </Button>
            ))}
          </div>

          <ScrollArea className="h-64">
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((asset) => {
                const Icon = ASSET_ICONS[asset.type];
                return (
                  <div
                    key={asset.id}
                    className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden hover:border-teal-500/30 transition-colors"
                  >
                    <div className="h-20 bg-slate-800 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-slate-600" />
                    </div>
                    <div className="p-2">
                      <div className="flex items-center justify-between">
                        <p className="text-white text-xs font-medium truncate">{asset.name}</p>
                        {asset.isPremium && (
                          <Badge className="text-[9px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                            Pro
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {asset.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[9px] border-slate-600 text-slate-500">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-2 text-xs bg-teal-600/20 text-teal-400 hover:bg-teal-600/30"
                        onClick={() => onInsert?.(asset)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Insertar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-8">
                No se encontraron assets
              </p>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
