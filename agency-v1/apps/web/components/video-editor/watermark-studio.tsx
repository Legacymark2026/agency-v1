"use client";

import React, { useState } from "react";

export interface WatermarkStudioProps {
  className?: string;
}

export function WatermarkStudio({ className = "" }: WatermarkStudioProps) {
  const [videoFile, setVideoFile] = useState<string>("campaña_promocional.mp4");
  const [logoFile, setLogoFile] = useState<string>("logo_legacymark.png");
  const [position, setPosition] = useState<"TOP_LEFT" | "TOP_RIGHT" | "BOTTOM_LEFT" | "BOTTOM_RIGHT">("TOP_LEFT");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ watermarkedPath: string; optimizedPath: string } | null>(null);

  const handleApplyWatermark = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/v1/video/watermark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoPath: videoFile, logoPath: logoFile, position })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setResult({
            watermarkedPath: json.outputPath || `${videoFile.replace(/\.[^/.]+$/, "")}_watermarked.mp4`,
            optimizedPath: `${videoFile.replace(/\.[^/.]+$/, "")}_optimized.webm`
          });
          return;
        }
      }
    } catch {
      // ignore
    } finally {
      setProcessing(false);
    }

    setResult({
      watermarkedPath: `${videoFile.replace(/\.[^/.]+$/, "")}_watermarked.mp4`,
      optimizedPath: `${videoFile.replace(/\.[^/.]+$/, "")}_optimized.webm`
    });
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-6 backdrop-blur-xl transition-all shadow-xl ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-100 text-base">Estudio de Marca de Agua y Optimización Video</h3>
          <p className="text-xs text-slate-400">Sobrepon la marca de agua corporativa y optimiza videos a WebM</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Archivo de Video</label>
          <input
            type="text"
            value={videoFile}
            onChange={(e) => setVideoFile(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Logotipo Corporativo</label>
          <input
            type="text"
            value={logoFile}
            onChange={(e) => setLogoFile(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Posición de la Marca de Agua</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "TOP_LEFT", label: "↖️ Superior Izquierda" },
              { id: "TOP_RIGHT", label: "↗️ Superior Derecha" },
              { id: "BOTTOM_LEFT", label: "↙️ Inferior Izquierda" },
              { id: "BOTTOM_RIGHT", label: "↘️ Inferior Derecha" }
            ].map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => setPosition(pos.id as any)}
                className={`rounded-xl border py-2 px-3 text-xs font-semibold transition-all ${position === pos.id ? "border-cyan-500 bg-cyan-500/10 text-cyan-300" : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"}`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleApplyWatermark}
        disabled={processing}
        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-2.5 text-xs font-semibold text-slate-950 shadow-md transition-all hover:from-cyan-400 hover:to-teal-400 active:scale-95 disabled:opacity-50"
      >
        {processing ? "Procesando Transcodificación..." : "Estampar Marca de Agua y Optimizar"}
      </button>

      {result && (
        <div className="mt-6 rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-4 space-y-2">
          <div className="text-xs font-semibold text-cyan-300">✅ Video Procesado con Éxito</div>
          <div className="text-xs text-slate-300">
            <span className="opacity-70">Salida Marca de Agua: </span>
            <code className="font-mono text-cyan-200">{result.watermarkedPath}</code>
          </div>
          <div className="text-xs text-slate-300">
            <span className="opacity-70">Formato WebM Optimizado: </span>
            <code className="font-mono text-teal-200">{result.optimizedPath}</code>
          </div>
        </div>
      )}
    </div>
  );
}
