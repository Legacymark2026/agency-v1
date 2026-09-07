'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Film, Music, Volume2, Search, Play, Pause, Plus,
  Sparkles, Check, Download, Zap, Flame, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

interface StockMediaPanelProps {
  onAddVideoClip: (clip: { id: string; name: string; duration: number; url: string; type: 'video' }) => void;
  onAddAudioTrack: (track: { id: string; name: string; duration: number; url: string; type: 'audio' }) => void;
}

const STOCK_VIDEOS = [
  { id: 'st_v1', title: 'Data Center & Servidores AI', duration: 8, category: 'Tech', thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80', url: 'https://assets.mixkit.co/videos/preview/mixkit-data-center-network-lights-31806-large.mp4' },
  { id: 'st_v2', title: 'Empresario Analizando Gráficos', duration: 6, category: 'Business', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80', url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-43407-large.mp4' },
  { id: 'st_v3', title: 'Smartphone en Mano 9:16', duration: 7, category: 'Mobile', thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80', url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-using-a-smartphone-at-night-42647-large.mp4' },
  { id: 'st_v4', title: 'Crecimiento Exponencial Fintech', duration: 5, category: 'Fintech', thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80', url: 'https://assets.mixkit.co/videos/preview/mixkit-financial-graphs-moving-43406-large.mp4' },
];

const STOCK_MUSIC = [
  { id: 'st_m1', title: 'Cyber Pulse (High Energy)', duration: 30, mood: 'Energía / Tech', bpm: 128, audioUrl: '/audio/cyber_pulse.mp3' },
  { id: 'st_m2', title: 'Corporate Vanguard (Épico)', duration: 45, mood: 'Corporativo', bpm: 115, audioUrl: '/audio/corporate_vanguard.mp3' },
  { id: 'st_m3', title: 'Lofi Automation (Focus)', duration: 60, mood: 'Calma / Lofi', bpm: 85, audioUrl: '/audio/lofi_focus.mp3' },
  { id: 'st_m4', title: 'Urgent Hook (Dramático)', duration: 25, mood: 'Tensión / Gancho', bpm: 135, audioUrl: '/audio/urgent_hook.mp3' },
];

const STOCK_SFX = [
  { id: 'sfx_1', title: 'Whoosh Rápido', duration: 0.8, type: 'Transición', icon: '💨' },
  { id: 'sfx_2', title: 'Pop Notificación', duration: 0.4, type: 'UI', icon: '💥' },
  { id: 'sfx_3', title: 'Caja Registradora (Kaching)', duration: 1.2, type: 'Finanzas', icon: '💰' },
  { id: 'sfx_4', title: 'Impacto Cinematográfico (Boom)', duration: 2.0, type: 'Gancho', icon: '💣' },
  { id: 'sfx_5', title: 'Ding Acierto', duration: 0.9, type: 'Alerta', icon: '🔔' },
  { id: 'sfx_6', title: 'Camera Shutter Click', duration: 0.5, type: 'Foto', icon: '📸' },
];

export function StockMediaPanel({ onAddVideoClip, onAddAudioTrack }: StockMediaPanelProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'music' | 'sfx'>('video');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);

  const togglePlayMusic = (id: string) => {
    if (playingMusicId === id) {
      setPlayingMusicId(null);
    } else {
      setPlayingMusicId(id);
      toast.info('Reproduciendo vista previa...');
    }
  };

  const handleAddVideo = (item: typeof STOCK_VIDEOS[0]) => {
    onAddVideoClip({
      id: `clip_${item.id}_${Date.now()}`,
      name: item.title,
      duration: item.duration,
      url: item.url,
      type: 'video',
    });
    toast.success(`"${item.title}" añadido al timeline`);
  };

  const handleAddMusic = (item: typeof STOCK_MUSIC[0]) => {
    onAddAudioTrack({
      id: `audio_${item.id}_${Date.now()}`,
      name: item.title,
      duration: item.duration,
      url: item.audioUrl,
      type: 'audio',
    });
    toast.success(`Música "${item.title}" añadida al proyecto`);
  };

  const handleAddSfx = (item: typeof STOCK_SFX[0]) => {
    onAddAudioTrack({
      id: `sfx_${item.id}_${Date.now()}`,
      name: item.title,
      duration: item.duration,
      url: `/audio/sfx/${item.id}.mp3`,
      type: 'audio',
    });
    toast.success(`SFX "${item.title}" colocado en el playhead`);
  };

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Bóveda Media & Recursos Stock
          </h3>
          <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[10px]">
            Libre de Derechos
          </Badge>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar B-Rolls, música o SFX..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 outline-hidden focus:border-teal-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className="grid grid-cols-3 bg-slate-950 border border-slate-800/80 p-0.5 rounded-lg mb-3">
          <TabsTrigger value="video" className="text-[11px] data-[state=active]:bg-teal-600">
            <Film className="w-3 h-3 mr-1" /> Videos
          </TabsTrigger>
          <TabsTrigger value="music" className="text-[11px] data-[state=active]:bg-teal-600">
            <Music className="w-3 h-3 mr-1" /> Música
          </TabsTrigger>
          <TabsTrigger value="sfx" className="text-[11px] data-[state=active]:bg-teal-600">
            <Volume2 className="w-3 h-3 mr-1" /> SFX
          </TabsTrigger>
        </TabsList>

        {/* 1. Videos Tab */}
        <TabsContent value="video" className="mt-0 space-y-2 outline-hidden">
          <div className="grid grid-cols-2 gap-2">
            {STOCK_VIDEOS.map(v => (
              <div key={v.id} className="group relative rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
                <img src={v.thumbnail} alt={v.title} className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent p-2 flex flex-col justify-between">
                  <span className="self-end text-[9px] font-mono bg-black/60 px-1 rounded text-white">{v.duration}s</span>
                  <div>
                    <p className="text-[10px] font-bold text-white leading-tight line-clamp-1">{v.title}</p>
                    <button
                      onClick={() => handleAddVideo(v)}
                      className="mt-1 w-full py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[9px] rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5" /> Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 2. Music Tab */}
        <TabsContent value="music" className="mt-0 space-y-2 outline-hidden">
          {STOCK_MUSIC.map(m => (
            <div key={m.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2">
              <button
                onClick={() => togglePlayMusic(m.id)}
                className="w-7 h-7 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-teal-400 hover:bg-slate-800 shrink-0"
              >
                {playingMusicId === m.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{m.title}</p>
                <p className="text-[10px] text-slate-500">{m.mood} • {m.bpm} BPM • {m.duration}s</p>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAddMusic(m)}
                className="h-7 px-2 text-xs text-teal-400 hover:text-white hover:bg-teal-600/20 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </TabsContent>

        {/* 3. SFX Tab */}
        <TabsContent value="sfx" className="mt-0 space-y-1.5 outline-hidden">
          <div className="grid grid-cols-2 gap-1.5">
            {STOCK_SFX.map(s => (
              <button
                key={s.id}
                onClick={() => handleAddSfx(s)}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-teal-500/40 text-left transition-all flex items-center gap-2 group cursor-pointer"
              >
                <span className="text-base">{s.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-white truncate group-hover:text-teal-300">{s.title}</p>
                  <p className="text-[9px] text-slate-500">{s.duration}s • {s.type}</p>
                </div>
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
