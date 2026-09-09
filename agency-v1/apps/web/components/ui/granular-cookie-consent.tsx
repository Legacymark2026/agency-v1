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
        const legacy = safeStorage.getItem("cookie_consent");
        if (!consent && !legacy) {
            const timer = setTimeout(() => setIsVisible(true), 1200);
            return () => clearTimeout(timer);
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
                    initial={{ y: 80, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 80, opacity: 0, scale: 0.98 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[480px] z-[9999] p-6 bg-slate-950/95 border border-slate-800 shadow-2xl rounded-2xl text-white backdrop-blur-xl ring-1 ring-white/10"
                >
                    {!showSettings ? (
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-inner">
                                        <Cookie size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white tracking-wide">
                                            Privacidad y Gestión de Cookies
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            Cumplimiento Ley 1581 de 2012 & ISO 27701
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleRejectNonEssential} 
                                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
                                    aria-label="Rechazar cookies opcionales"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                                Utilizamos cookies propias y de terceros para garantizar la operatividad de la plataforma, analizar el tráfico y personalizar contenidos. Puedes aceptar todas, rechazarlas o configurar tus preferencias. Conoce más en nuestra{" "}
                                <Link href="/politica-cookies" className="text-emerald-400 hover:underline font-medium">
                                    Política de Cookies
                                </Link>{" "}
                                y{" "}
                                <Link href="/politica-privacidad" className="text-emerald-400 hover:underline font-medium">
                                    Aviso de Privacidad
                                </Link>.
                            </p>

                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1">
                                <Button 
                                    onClick={handleAcceptAll} 
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 h-10 rounded-xl shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98]"
                                >
                                    Aceptar Todas
                                </Button>
                                <Button 
                                    onClick={handleRejectNonEssential}
                                    variant="outline" 
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white font-medium text-xs py-2.5 h-10 rounded-xl transition-all active:scale-[0.98]"
                                >
                                    Solo Necesarias
                                </Button>
                                <Button 
                                    onClick={() => setShowSettings(true)}
                                    variant="outline" 
                                    className="w-auto px-3 bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-white font-medium text-xs py-2.5 h-10 rounded-xl transition-all"
                                    title="Personalizar cookies"
                                >
                                    <Settings size={15} />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-emerald-400" />
                                    Preferencias de Cookies
                                </h4>
                                <button 
                                    onClick={() => setShowSettings(false)} 
                                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Preference Items */}
                            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                                <div className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800/80">
                                    <div className="pr-3">
                                        <p className="text-xs font-semibold text-white">Cookies Técnicas / Esenciales</p>
                                        <p className="text-[11px] text-slate-400 leading-snug">Autenticación segura de sesión, balanceo y protección CSRF.</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                                        Obligatorias
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800/80">
                                    <div className="pr-3">
                                        <p className="text-xs font-semibold text-white">Analíticas y Rendimiento</p>
                                        <p className="text-[11px] text-slate-400 leading-snug">Telemetría anónima para optimización de tiempos de respuesta y Core Web Vitals.</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={preferences.analytics}
                                        onChange={(e) => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                                        className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800/80">
                                    <div className="pr-3">
                                        <p className="text-xs font-semibold text-white">Marketing y Atribución</p>
                                        <p className="text-[11px] text-slate-400 leading-snug">Medición de conversiones de campañas en Meta y Google Ads.</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={preferences.marketing}
                                        onChange={(e) => setPreferences(p => ({ ...p, marketing: e.target.checked }))}
                                        className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                                <Button 
                                    onClick={() => savePreferences(preferences)} 
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
                                >
                                    <Check size={14} />
                                    Guardar Configuración
                                </Button>
                                <Button 
                                    onClick={handleAcceptAll}
                                    variant="outline"
                                    className="bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 text-xs py-2.5 h-10 rounded-xl"
                                >
                                    Aceptar Todas
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
