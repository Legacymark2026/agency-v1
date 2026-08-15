'use client';

import React, { useState, useRef } from 'react';

export interface VoiceNotePlayerProps {
  audioUrl: string;
  transcript: string;
  rawTranscript?: string;
  durationSeconds?: number;
  authorName?: string;
  createdAt?: string;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  transcript,
  rawTranscript,
  durationSeconds = 0,
  authorName = 'Nota de Voz',
  createdAt,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md text-slate-100 space-y-3">
      <audio ref={audioRef} src={audioUrl} onEnded={handleEnded} className="hidden" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-md"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          <div>
            <h4 className="text-sm font-semibold text-white">{authorName}</h4>
            {createdAt && <p className="text-xs text-slate-400">{createdAt}</p>}
          </div>
        </div>

        {durationSeconds > 0 && (
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300">
            {Math.floor(durationSeconds / 60)}:
            {Math.floor(durationSeconds % 60)
              .toString()
              .padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
        <p className="text-sm text-slate-200 leading-relaxed font-sans">
          {showRaw && rawTranscript ? rawTranscript : transcript}
        </p>
      </div>

      {rawTranscript && rawTranscript !== transcript && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            {showRaw ? 'Ver texto refinado' : 'Ver texto original sin depurar'}
          </button>
        </div>
      )}
    </div>
  );
};
