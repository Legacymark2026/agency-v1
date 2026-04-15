"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SoundNotificationOptions {
    enabled: boolean;
    volume?: number;
}

const DEFAULT_NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR4GLI3a6K2GVRENZZ3h26p1IgsuXaDm3q58KAQqVZjn4bCRZTM9Y7fW4a+cdy8uZ73Z5LqghzIjcLnl7L+shS4fgr3j7cWxiVovM2S+2+S4p4ZFHSllv9Xju6qHRCQ7X73c6MGxiF4lN1+/2eS5pYVGHTRjv9fhsaGGTBklYL7Y4bKjhUMYJ1+/2eS4pYVEFTJfv9rhsaGGTBglX77Y4bGjhUMYJW+/2eS4pYVEFTJfv9rhsZ2GTBgkX77Y4bGjhUMYJW+/2eS4pYVEFTJfv9rhsZ2GTBgkX77Y4bGjhUMYJW+/2eS4pYVEFTJfv9rhsZ2GTBgkX77Y4bGjhUMYJW+/2eS4pYV...";

export function useSoundNotification(options: SoundNotificationOptions) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playNotification = useCallback(() => {
        if (!options.enabled) return;
        
        if (!audioRef.current) {
            audioRef.current = new Audio(DEFAULT_NOTIFICATION_SOUND);
            audioRef.current.volume = options.volume ?? 0.5;
        }
        
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
    }, [options.enabled, options.volume]);

    const playMessageSent = useCallback(() => {
        if (!options.enabled) return;
        
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    }, [options.enabled]);

    return { playNotification, playMessageSent };
}

export function NotificationSoundToggle({ 
    enabled, 
    onToggle 
}: { 
    enabled: boolean; 
    onToggle: (enabled: boolean) => void 
}) {
    return (
        <button
            onClick={() => onToggle(!enabled)}
            className={`p-2 rounded-lg transition-colors ${
                enabled 
                    ? "bg-teal-100 dark:bg-teal-900/50 text-teal-600" 
                    : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title={enabled ? "Sonido activado" : "Sonido desactivado"}
        >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {enabled ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                )}
            </svg>
        </button>
    );
}