"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function ScarcityTimer({ initialMinutes = 15 }) {
    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (timeLeft <= 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 text-red-400 text-xs font-mono font-bold"
            >
                <Timer className="w-3 h-3 animate-pulse" />
                <span>EXPIRA EN: {formatTime(timeLeft)}</span>
            </motion.div>
        </AnimatePresence>
    );
}

export function StickyCountdownBar() {
    // Set timer for 15 minutes from now
    const [timeLeft, setTimeLeft] = useState(15 * 60);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (timeLeft === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 right-0 z-[100] h-14"
            >
                {/* Glass Background */}
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md border-b border-white/10 shadow-2xl" />

                {/* Progress Line */}
                <motion.div
                    className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-red-500 via-orange-500 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 15 * 60, ease: "linear" }}
                />

                <div className="container h-full mx-auto flex items-center justify-between px-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            <span className="text-red-400 font-mono text-xs tracking-widest uppercase">Oferta Terminal</span>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                            <span className="text-slate-400 text-sm hidden sm:inline">El código de descuento expira en:</span>
                            <div className="bg-slate-900/50 border border-slate-700 rounded px-2 py-0.5 min-w-[60px] text-center font-mono font-bold text-red-400 tabular-nums">
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="hidden sm:flex text-slate-400 hover:text-white hover:bg-white/5 text-xs">
                            Cerrar
                        </Button>
                        <Button size="sm" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-0 shadow-[0_0_15px_rgba(220,38,38,0.3)] text-xs font-bold tracking-wide uppercase px-6">
                            Reclamar Ahora
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
