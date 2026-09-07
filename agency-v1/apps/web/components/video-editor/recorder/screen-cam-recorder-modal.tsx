'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Video, ScreenShare, Mic, MicOff, StopCircle, Play,
  RefreshCw, CheckCircle2, Download, Layers, Radio, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface ScreenCamRecorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClipRecorded: (clip: {
    id: string;
    name: string;
    duration: number;
    url: string;
    type: 'video';
  }) => void;
}

export function ScreenCamRecorderModal({
  open,
  onOpenChange,
  onClipRecorded,
}: ScreenCamRecorderModalProps) {
  const [recordMode, setRecordMode] = useState<'screen_and_cam' | 'screen_only' | 'cam_only'>('screen_and_cam');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [recordedDuration, setRecordedDuration] = useState(0);

  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const camVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopStreams();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopStreams = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    if (camStreamRef.current) {
      camStreamRef.current.getTracks().forEach(t => t.stop());
      camStreamRef.current = null;
    }
  };

  const startRecording = async () => {
    chunksRef.current = [];
    setRecordedBlobUrl(null);
    setRecordingTime(0);

    try {
      let combinedStream: MediaStream;

      if (recordMode === 'cam_only') {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, frameRate: 30 },
          audio: micEnabled,
        });
        camStreamRef.current = camStream;
        if (camVideoRef.current) camVideoRef.current.srcObject = camStream;
        combinedStream = camStream;
      } else {
        // Screen or Screen+Cam
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 },
          audio: true,
        });
        screenStreamRef.current = screenStream;
        if (screenVideoRef.current) screenVideoRef.current.srcObject = screenStream;

        if (recordMode === 'screen_and_cam') {
          const camStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240 },
            audio: micEnabled,
          });
          camStreamRef.current = camStream;
          if (camVideoRef.current) camVideoRef.current.srcObject = camStream;
        }
        combinedStream = screenStream;
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        stopStreams();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);

      toast.success('Grabación iniciada en vivo');
    } catch (err: any) {
      console.error('[Recorder Error]', err);
      toast.error('No se pudo acceder a la pantalla o cámara: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordedDuration(recordingTime);
      toast.success('Grabación completada');
    }
  };

  const handleInsertIntoTimeline = () => {
    if (!recordedBlobUrl) return;

    const clipId = `rec_${Date.now()}`;
    onClipRecorded({
      id: clipId,
      name: `Grabación ${new Date().toLocaleTimeString()}`,
      duration: recordedDuration || 10,
      url: recordedBlobUrl,
      type: 'video',
    });

    toast.success('Clip añadido al proyecto y línea de tiempo');
    onOpenChange(false);
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-slate-950 border border-slate-800 text-white p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  Grabador Multimodal de Pantalla & Cámara (Loom Studio)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Graba tu pantalla, cámara y voz en alta resolución para tutoriales y pitches de venta.
                </DialogDescription>
              </div>
            </div>

            {isRecording && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-xs px-3 py-1 font-mono animate-pulse">
                REC • {formatSec(recordingTime)}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Viewport & Preview */}
        <div className="relative aspect-video w-full rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center mt-4">
          {recordedBlobUrl ? (
            <video
              ref={previewVideoRef}
              src={recordedBlobUrl}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              {/* Screen feed */}
              <video
                ref={screenVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {/* PiP Webcam circle in corner */}
              {recordMode === 'screen_and_cam' && (
                <div className="absolute bottom-4 right-4 w-36 h-36 rounded-full overflow-hidden border-2 border-teal-400 shadow-2xl bg-black">
                  <video
                    ref={camVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {!isRecording && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                    <ScreenShare className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-white">Configura tu modo de grabación</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Selecciona si deseas capturar tu pantalla con cámara circular superpuesta o solo una de las dos fuentes.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          {!recordedBlobUrl ? (
            <>
              {/* Mode Selectors */}
              <div className="flex items-center gap-2">
                <Button
                  variant={recordMode === 'screen_and_cam' ? 'default' : 'outline'}
                  size="sm"
                  disabled={isRecording}
                  onClick={() => setRecordMode('screen_and_cam')}
                  className="text-xs h-8"
                >
                  <Layers className="w-3.5 h-3.5 mr-1.5" />
                  Pantalla + Cam
                </Button>
                <Button
                  variant={recordMode === 'screen_only' ? 'default' : 'outline'}
                  size="sm"
                  disabled={isRecording}
                  onClick={() => setRecordMode('screen_only')}
                  className="text-xs h-8"
                >
                  <ScreenShare className="w-3.5 h-3.5 mr-1.5" />
                  Solo Pantalla
                </Button>
                <Button
                  variant={recordMode === 'cam_only' ? 'default' : 'outline'}
                  size="sm"
                  disabled={isRecording}
                  onClick={() => setRecordMode('cam_only')}
                  className="text-xs h-8"
                >
                  <Video className="w-3.5 h-3.5 mr-1.5" />
                  Solo Cámara
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMicEnabled(m => !m)}
                  className="text-xs h-8 text-slate-300"
                >
                  {micEnabled ? <Mic className="w-3.5 h-3.5 text-teal-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
                </Button>

                {isRecording ? (
                  <Button
                    onClick={stopRecording}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-8 px-4 animate-pulse"
                  >
                    <StopCircle className="w-4 h-4 mr-1.5" />
                    Detener Grabación
                  </Button>
                ) : (
                  <Button
                    onClick={startRecording}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs h-8 px-4 shadow-lg shadow-teal-500/20"
                  >
                    <Radio className="w-3.5 h-3.5 mr-1.5 text-slate-950" />
                    Iniciar Grabación
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRecordedBlobUrl(null)}
                className="text-xs h-8"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Grabar de Nuevo
              </Button>

              <div className="flex items-center gap-2">
                <a
                  href={recordedBlobUrl}
                  download="grabacion_legacymark.webm"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold hover:bg-slate-700 text-slate-300"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Descargar Local
                </a>

                <Button
                  onClick={handleInsertIntoTimeline}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs h-8 px-4"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Insertar en Timeline
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
