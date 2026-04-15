"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Volume2, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
    agentId: string;
    agentName?: string;
    onClose?: () => void;
}

export function VoiceWidget({ agentId, agentName = "Agente de Voz", onClose }: Props) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [volumeLevel, setVolumeLevel] = useState(0); // Para animación
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const rafRef = useRef<number>();

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = handleAudioSubmit;

            // Audio Visualization setup
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyzer = ctx.createAnalyser();
            analyzer.fftSize = 256;
            source.connect(analyzer);
            analyzerRef.current = analyzer;

            const updateVolume = () => {
                const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                analyzer.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((a, b) => a + b, 0);
                const avg = sum / dataArray.length;
                setVolumeLevel(avg);
                rafRef.current = requestAnimationFrame(updateVolume);
            };
            updateVolume();

            recorder.start();
            setIsRecording(true);
            setTranscript("Escuchando...");
            
            // Auto stop after 15 seconds to prevent runaway costs
            setTimeout(() => {
                if (recorder.state === "recording") {
                    recorder.stop();
                    stream.getTracks().forEach(t => t.stop());
                }
            }, 15000);

        } catch (error) {
            console.error(error);
            toast.error("No se pudo acceder al micrófono.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
            setIsRecording(false);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            setVolumeLevel(0);
        }
    };

    const handleAudioSubmit = async () => {
        setIsProcessing(true);
        setTranscript("Procesando comando...");

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "voice.webm");

        try {
            const start = performance.now();
            const res = await fetch(`/api/agents/${agentId}/voice`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Error en la respuesta de voz");

            const end = performance.now();
            console.log(`TTFB: ${(end - start).toFixed(0)}ms`);

            const contentType = res.headers.get("Content-Type");
            
            if (contentType?.includes("audio/")) {
                // Se recibió audio de ElevenLabs
                const blob = await res.blob();
                const textHeader = res.headers.get("X-Agent-Text");
                if (textHeader) {
                    setTranscript(decodeURIComponent(textHeader));
                } else {
                    setTranscript("Reproduciendo respuesta...");
                }

                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audioPlayerRef.current = audio;
                
                audio.onended = () => {
                    setIsPlaying(false);
                    URL.revokeObjectURL(url);
                };
                
                setIsPlaying(true);
                audio.play();

            } else {
                // Fallback: No ElevenLabs key -> JSON { text, fallbackTts }
                const data = await res.json();
                setTranscript(data.text);
                
                if (data.fallbackTts && "speechSynthesis" in window) {
                    setIsPlaying(true);
                    const utterance = new SpeechSynthesisUtterance(data.text);
                    utterance.lang = "es-ES";
                    utterance.onend = () => setIsPlaying(false);
                    window.speechSynthesis.speak(utterance);
                } else {
                    toast.success("Respuesta de texto recibida");
                }
            }

        } catch (error) {
            console.error(error);
            toast.error("Error al procesar el audio.");
            setTranscript("Error en la conexión.");
        } finally {
            setIsProcessing(false);
        }
    };

    const renderRings = () => {
        if (!isRecording && !isPlaying && !isProcessing) return null;
        
        const scale = isRecording ? 1 + (volumeLevel / 100) : isPlaying ? 1.2 : 1;
        const color = isRecording ? "border-red-500" : isProcessing ? "border-blue-500" : "border-teal-500";
        
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                    className={`absolute rounded-full border-2 ${color}/30 animate-ping`}
                    style={{ width: '80px', height: '80px', transform: `scale(${scale})` }}
                />
                <div 
                    className={`absolute rounded-full border ${color}/20 transition-transform duration-75`}
                    style={{ width: '100px', height: '100px', transform: `scale(${isRecording ? scale + 0.2 : 1})` }}
                />
            </div>
        );
    };

    return (
        <div className="relative w-80 bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl flex flex-col items-center">
            {onClose && (
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            )}
            
            <p className="text-xs font-mono text-slate-400 mb-6 uppercase tracking-widest">{agentName}</p>
            
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                {renderRings()}
                <button
                    onClick={isRecording ? stopRecording : (!isProcessing && !isPlaying) ? startRecording : undefined}
                    disabled={isProcessing || isPlaying}
                    className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                        isRecording 
                            ? "bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]" 
                            : isProcessing 
                                ? "bg-blue-600 cursor-not-allowed"
                                : isPlaying
                                    ? "bg-teal-600 shadow-[0_0_20px_rgba(13,148,136,0.5)]"
                                    : "bg-slate-800 hover:bg-slate-700 border border-slate-600"
                    }`}
                >
                    {isRecording ? (
                        <Square className="w-6 h-6 text-white fill-current" />
                    ) : isProcessing ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : isPlaying ? (
                        <Volume2 className="w-6 h-6 text-white animate-pulse" />
                    ) : (
                        <Mic className="w-6 h-6 text-teal-400" />
                    )}
                </button>
            </div>

            <div className="w-full h-20 bg-slate-950/50 rounded-lg border border-slate-800 p-3 text-sm text-slate-300 text-center overflow-y-auto flex items-center justify-center">
                {transcript || "Presiona el botón frontal para hablar..."}
            </div>
        </div>
    );
}
