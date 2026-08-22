"use client";

import React, { useState } from "react";

export default function VideoDashboardPage() {
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [scriptText, setScriptText] = useState("Transforma tu empresa con inteligencia artificial y automatización de microservicios en tiempo real");
  const [generatedSubtitles, setGeneratedSubtitles] = useState<string>("");

  const handleGenerateCaptions = () => {
    const words = scriptText.split(" ");
    let vtt = "WEBVTT\n\n";
    for (let i = 0; i < words.length; i += 4) {
      const chunk = words.slice(i, i + 4).join(" ");
      vtt += `00:00:0${i}.000 --> 00:00:0${i + 3}.000\n${chunk}\n\n`;
    }
    setGeneratedSubtitles(vtt);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-300 to-rose-400 bg-clip-text text-transparent">
            Estudio de Video & Subtítulos 9:16
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generador automático de subtítulos WEBVTT/SRT y reencuadre vertical para TikTok, Instagram Reels y Shorts.
          </p>
        </div>
        <button
          onClick={handleGenerateCaptions}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          🎬 Generar Subtítulos VTT & Crop 9:16
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Config */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Configuración del Video</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Relación de Aspecto Target</label>
            <div className="grid grid-cols-3 gap-3">
              {(["9:16", "16:9", "1:1"] as const).map((aspect) => (
                <button
                  key={aspect}
                  onClick={() => setAspectRatio(aspect)}
                  className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                    aspectRatio === aspect
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  {aspect} {aspect === "9:16" ? "(TikTok/Reels)" : aspect === "16:9" ? "(YouTube)" : "(Instagram Post)"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Guion del Video (Texto para Subtítulos)</label>
            <textarea
              rows={4}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {generatedSubtitles && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Archivo WEBVTT Generado</label>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-purple-300 font-mono overflow-x-auto">
                {generatedSubtitles}
              </pre>
            </div>
          )}
        </div>

        {/* Live Preview Box */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center space-y-4 text-center">
          <h2 className="text-lg font-bold text-slate-200">Vista Previa de Reencuadre ({aspectRatio})</h2>
          <div
            className={`bg-slate-950 border-2 border-dashed border-purple-500/40 rounded-2xl flex items-center justify-center p-6 ${
              aspectRatio === "9:16" ? "w-44 h-80" : aspectRatio === "16:9" ? "w-80 h-44" : "w-60 h-60"
            }`}
          >
            <span className="text-xs text-purple-300 font-mono">Encuadre {aspectRatio} Activo</span>
          </div>
          <button
            onClick={() => alert("Renderizado de video en cola de procesamiento.")}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            🚀 Exportar Video en {aspectRatio}
          </button>
        </div>
      </div>
    </div>
  );
}
