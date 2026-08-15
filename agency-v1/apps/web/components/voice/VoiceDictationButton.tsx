'use client';

import React, { useState, useRef } from 'react';
import { transcribeAudioAction } from '../../actions/voicebox-actions';

export interface VoiceDictationButtonProps {
  companyId: string;
  userId?: string;
  onTranscriptComplete: (transcript: string) => void;
  className?: string;
  placeholder?: string;
}

type DictationState = 'idle' | 'recording' | 'transcribing' | 'refining' | 'error';

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  companyId,
  userId,
  onTranscriptComplete,
  className = '',
  placeholder = 'Dictar nota de voz...',
}) => {
  const [state, setState] = useState<DictationState>('idle');
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setState('recording');
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setState('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setState('transcribing');
    }
  };

  const processAudio = async (blob: Blob) => {
    try {
      setState('refining');
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const res = await transcribeAudioAction({
          companyId,
          userId,
          audioBase64: base64Audio,
          language: 'es',
          cleanFillers: true,
        });

        if (res.success && res.transcript) {
          onTranscriptComplete(res.transcript);
          setState('idle');
        } else {
          setState('error');
        }
      };
    } catch (err) {
      console.error('Error processing voice dictation:', err);
      setState('error');
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {state === 'idle' && (
        <button
          type="button"
          onClick={startRecording}
          title={placeholder}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
          </svg>
          <span>Dictar</span>
        </button>
      )}

      {state === 'recording' && (
        <button
          type="button"
          onClick={stopRecording}
          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-all shadow-md animate-pulse flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Grabando ({recordingTime}s) - Detener</span>
        </button>
      )}

      {(state === 'transcribing' || state === 'refining') && (
        <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-sm font-medium flex items-center gap-2 shadow-inner border border-slate-700">
          <svg className="w-4 h-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{state === 'transcribing' ? 'Transcribiendo Whisper...' : 'Refinando con LLM...'}</span>
        </div>
      )}

      {state === 'error' && (
        <button
          type="button"
          onClick={() => setState('idle')}
          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm flex items-center gap-1"
        >
          <span>Error. Reintentar</span>
        </button>
      )}
    </div>
  );
};
