"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
    src: string;
    className?: string;
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Force reload when src changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.load();
            setIsPlaying(false);
            setProgress(0);
        }
    }, [src]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    setIsPlaying(true);
                }).catch(error => {
                    console.error("Audio playback error:", error);
                    toast.error("Error al reproducir el audio");
                    setIsPlaying(false);
                });
            } else {
                setIsPlaying(true);
            }
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current && isPlaying && audioRef.current.duration) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
    };

    return (
        <div className={cn("flex items-center gap-3 bg-black/5 dark:bg-white/5 p-2 rounded-xl border border-black/10 dark:border-white/10 min-w-[200px]", className)}>
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => { setIsPlaying(false); setProgress(0); }}
                onError={(e) => {
                    console.error("Audio player error", e);
                    setIsPlaying(false);
                }}
            />
            <Button 
                variant="secondary" 
                size="icon" 
                className="h-8 w-8 rounded-full shrink-0 bg-teal-500 hover:bg-teal-600 text-white border-none shadow-sm flex items-center justify-center transition-all" 
                onClick={togglePlay}
            >
                {isPlaying ? <Pause size={14} className="fill-white" /> : <Play size={14} className="fill-white ml-0.5" />}
            </Button>
            
            <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full relative overflow-hidden">
                <div 
                    className="absolute left-0 top-0 h-full bg-teal-500 rounded-full transition-all duration-75" 
                    style={{ width: `${progress}%` }} 
                />
            </div>
            
            <Volume2 className="h-3.5 w-3.5 text-zinc-400" />
        </div>
    );
}
