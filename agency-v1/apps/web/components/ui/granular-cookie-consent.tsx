"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Cookie, ShieldCheck, Settings, Check } from "lucide-react";
import Link from "next/link";
import { safeStorage } from "@/lib/utils/storage";

export interface CookiePreferences {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
}

export function GranularCookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>({
        essential: true, // Always true & disabled
        analytics: true,
        marketing: true,
    });

    useEffect(() => {
        const consent = safeStorage.getItem("cookie_consent_v2");
        if (!consent) {
            setTimeout(() => setIsVisible(true), 1500);
        }
    }, []);

    const savePreferences = (prefs: CookiePreferences) => {
        safeStorage.setItem("cookie_consent_v2", JSON.stringify(prefs));
        safeStorage.setItem("cookie_consent", prefs.analytics || prefs.marketing ? "accepted" : "declined");
        window.dispatchEvent(new Event("cookie_consent_updated"));
        setIsVisible(false);
    };

    const handleAcceptAll = () => {
        const allIn = { essential: true, analytics: true, marketing: true };
        setPreferences(allIn);
        savePreferences(allIn);
    };

    const handleRejectNonEssential = () => {
        const onlyEssential = { essential: true, analytics: false, marketing: false };
        setPreferences(onlyEssential);
        savePreferences(onlyEssential);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 22, stiffness: 120 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[460px] z-[1000] p-6 bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl text-white backdrop-blur-xl"
                >
                    {!showSettings ? (
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                                        <Cookie size={18} />
                                    </div>
                                    <h3 className="text-base font-bold text-white">Privacidad & Cookies (ISO 27701)</h3>
                                </div>
                                <button onClick={handleRejectNonEssential} className="text-slate-400 hover:text-white p-1">
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                                Usamos cookies técnicas y analíticas para optimizar el rendimiento y personalizar tu experiencia conforme a ISO 27701 y GDPR. Puedes gestionar tus preferencias granulares en cualquier momento.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-2">
                                <Button 
                                    onClick={handleAcceptAll} 
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 h-auto rounded-xl"
                                >
                                    Aceptar Todas
                                </Button>
                                <Button 
                                    onClick={() => setShowSettings(true)}
                                    variant="outline" 
                                    className="w-full bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-300 font-semibold text-xs py-2.5 h-auto rounded-xl flex items-center justify-center gap-1.5"
                                >
                                    <Settings size={14} />
                                    <span>Configurar</span>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-emerald-400" />
                                    Configuración Granular de Cookies
                                </h4>
                                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Preference Items */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                                    <div>
                                        <p className="text-xs font-bold text-white">Esenciales (Técnicas)</p>
                                        <p className="text-[10px] text-slate-400">Requeridas para autenticación y seguridad.</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Siempre Activas</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                                    <div>
                                        <p className="text-xs font-bold text-white">Analíticas & Rendimiento</p>
                                        <p className="text-[10px] text-slate-400">Medición anónima de uso y métricas ISO 9001.</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={preferences.analytics}
                                        onChange={(e) => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                                        className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                                    <div>
                                        <p className="text-xs font-bold text-white">Marketing & Personalización</p>
                                        <p className="text-[10px] text-slate-400">Publicidad relevante y atribución CRM.</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={preferences.marketing}
                                        onChange={(e) => setPreferences(p => ({ ...p, marketing: e.target.checked }))}
                                        className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <Button 
                                onClick={() => savePreferences(preferences)} 
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 h-auto rounded-xl flex items-center justify-center gap-1.5"
                            >
                                <Check size={14} />
                                Guardar Preferencias
                            </Button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
