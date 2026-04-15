"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Gift } from "lucide-react";
import { motion } from "framer-motion";

export function ExitIntentPopup() {
    const [open, setOpen] = useState(false);
    const [hasShown, setHasShown] = useState(false);

    useEffect(() => {
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !hasShown) {
                setOpen(true);
                setHasShown(true);
            }
        };

        document.addEventListener("mouseleave", handleMouseLeave);
        return () => document.removeEventListener("mouseleave", handleMouseLeave);
    }, [hasShown]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-xl bg-slate-950/95 backdrop-blur-xl border-slate-800 text-white p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">

                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

                <div className="grid md:grid-cols-5 h-full">
                    {/* Visual Side (Left) */}
                    <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 relative overflow-hidden flex flex-col items-center justify-center p-6 border-r border-slate-800/50">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 mb-6 rotate-3 group overflow-hidden relative">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <Gift className="w-10 h-10 text-white" />
                        </div>
                        <div className="text-center relative z-10">
                            <p className="text-xs font-mono text-teal-400 tracking-widest uppercase mb-1">Recurso Premium</p>
                            <h3 className="font-bold text-xl text-white">Strategy<br />Pack 2025</h3>
                        </div>
                    </div>

                    {/* Content Side (Right) */}
                    <div className="md:col-span-3 p-8 flex flex-col justify-center">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="text-2xl font-bold tracking-tight text-white/90">
                                ¿Te vas sin tu regalo?
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 mt-2 text-base leading-relaxed">
                                Antes de cerrar, queremos darte una ventaja competitiva. Descarga nuestra <span className="text-teal-400 font-semibold">Guía de Estrategia Digital</span> (Valorada en $97 USD) completamente <span className="text-white font-bold underline decoration-teal-500/30 underline-offset-4">GRATIS</span>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="bg-slate-900/50 border border-slate-800/60 rounded-lg p-3 flex items-start gap-3">
                                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Acceso Limitado</p>
                                    <p className="text-xs text-slate-400">Este enlace de descarga expira automáticamente al cerrar esta ventana.</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Button className="w-full bg-white text-slate-950 hover:bg-slate-200 font-bold h-12 shadow-xl shadow-white/5 transition-all text-sm tracking-wide" onClick={() => window.open('/guia-digital.pdf', '_blank')}>
                                    <Download className="mr-2 h-4 w-4" /> DESCARGAR AHORA
                                </Button>
                                <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-300 hover:bg-transparent text-xs" onClick={() => setOpen(false)}>
                                    No gracias, prefiero perder esta oportunidad.
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
