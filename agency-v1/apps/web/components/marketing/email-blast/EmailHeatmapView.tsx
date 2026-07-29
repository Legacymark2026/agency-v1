'use client';

import { useState } from 'react';
import { Flame, MousePointerClick, ExternalLink, Percent, ShieldCheck } from 'lucide-react';

export interface HeatmapItem {
  url: string;
  clickCount: number;
  percentage: number;
}

export interface EmailHeatmapViewProps {
  campaignName: string;
  totalClicks: number;
  heatmapItems: HeatmapItem[];
  htmlBody: string;
}

export function EmailHeatmapView({
  campaignName,
  totalClicks,
  heatmapItems,
  htmlBody
}: EmailHeatmapViewProps) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Mapa de Calor de Clics — {campaignName}</h2>
            <p className="text-xs text-slate-400">Distribución de interacción de clics por enlace en la plantilla</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total de Clics</p>
            <p className="text-lg font-black text-teal-400">{totalClicks}</p>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Enlaces Detectados</p>
            <p className="text-lg font-black text-amber-400">{heatmapItems.length}</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
        {/* Tabla de Enlaces e Interacción */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Enlaces Más Clicados</h3>
          <div className="space-y-2">
            {heatmapItems.map((item, idx) => (
              <div
                key={item.url}
                onClick={() => setSelectedUrl(item.url)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedUrl === item.url
                    ? 'bg-orange-500/15 border-orange-500/50 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200 truncate flex items-center gap-2 max-w-[220px]">
                    <MousePointerClick className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                    {item.url}
                  </span>
                  <span className="text-xs font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                    {item.percentage}% ({item.clickCount} clics)
                  </span>
                </div>

                {/* Progress Bar Thermal */}
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      background: `linear-gradient(90deg, #f97316 0%, #ef4444 100%)`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Previsualización Térmica */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[620px] bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-2xl relative">
            <iframe
              srcDoc={htmlBody}
              title="Heatmap View"
              className="w-full min-h-[550px] border-0 rounded-xl bg-slate-950 pointer-events-none opacity-80"
            />

            {/* Overlays Térmicos Simulados */}
            <div className="absolute inset-0 p-8 pointer-events-none flex flex-col justify-around items-center">
              {heatmapItems.slice(0, 3).map((item) => (
                <div
                  key={item.url}
                  className="px-4 py-2 rounded-full font-black text-xs text-white shadow-2xl flex items-center gap-2 border border-orange-400 animate-pulse"
                  style={{
                    background: 'rgba(239, 68, 68, 0.85)',
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)'
                  }}
                >
                  <Flame className="w-4 h-4 text-amber-300" />
                  {item.percentage}% ({item.clickCount} clics)
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
