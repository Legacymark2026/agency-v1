"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { Cookie, Settings, Check, ShieldAlert } from "lucide-react";

export default function CookieConsent() {
  const t = useTranslations("cookies");
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: true,
    marketing: false,
  });

  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("goldneez_cookie_consent");
    if (!consent) {
      // Delay slightly for better UX/entry feel
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for custom event to open settings from footer
  useEffect(() => {
    const handleOpenSettings = () => {
      const saved = localStorage.getItem("goldneez_cookie_consent_prefs");
      if (saved) {
        try {
          setPreferences(JSON.parse(saved));
        } catch (e) {
          // ignore
        }
      }
      setShowPreferences(true);
      setVisible(true);
    };

    window.addEventListener("open-cookie-settings", handleOpenSettings);
    return () => {
      window.removeEventListener("open-cookie-settings", handleOpenSettings);
    };
  }, []);

  // GSAP animation for entry
  useEffect(() => {
    if (visible && bannerRef.current) {
      gsap.killTweensOf(bannerRef.current);
      gsap.fromTo(
        bannerRef.current,
        { y: 100, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [visible]);

  const handleAcceptAll = () => {
    const allPrefs = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem("goldneez_cookie_consent", "accepted");
    localStorage.setItem("goldneez_cookie_consent_prefs", JSON.stringify(allPrefs));
    closeBanner();
  };

  const handleDecline = () => {
    const essentialPrefs = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem("goldneez_cookie_consent", "declined");
    localStorage.setItem("goldneez_cookie_consent_prefs", JSON.stringify(essentialPrefs));
    closeBanner();
  };

  const handleSavePreferences = () => {
    localStorage.setItem("goldneez_cookie_consent", "custom");
    localStorage.setItem("goldneez_cookie_consent_prefs", JSON.stringify(preferences));
    closeBanner();
  };

  const closeBanner = () => {
    if (bannerRef.current) {
      gsap.to(bannerRef.current, {
        y: 100,
        opacity: 0,
        scale: 0.95,
        duration: 0.5,
        ease: "power3.in",
        onComplete: () => {
          setVisible(false);
          setShowPreferences(false);
        },
      });
    } else {
      setVisible(false);
      setShowPreferences(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50 overflow-hidden rounded-2xl border border-aluminum/10 bg-black/75 backdrop-blur-xl shadow-2xl p-6 transition-all duration-300 select-none"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber/10 rounded-xl text-amber shrink-0 border border-amber/20">
          <Cookie className="h-6 w-6 animate-pulse" />
        </div>
        <div className="flex-1">
          <h4 className="font-cinzel text-amber text-lg font-bold tracking-wider mb-2">
            {t("title")}
          </h4>
          <p className="font-quattrocento text-sm text-aluminum-dark leading-relaxed mb-4">
            {t("text")}
          </p>
        </div>
      </div>

      {/* Preferences Section */}
      {showPreferences && (
        <div className="mt-4 pt-4 border-t border-aluminum/10 flex flex-col gap-4 animate-fadeIn">
          {/* Necessary */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="checkbox"
                checked={preferences.necessary}
                disabled
                className="sr-only peer"
              />
              <div className="w-5 h-5 border border-amber/40 rounded bg-amber/10 flex items-center justify-center peer-checked:bg-amber/20 peer-checked:border-amber transition-all">
                <Check className="h-3 w-3 text-amber font-bold" />
              </div>
            </div>
            <div className="flex-1">
              <span className="font-quattrocento text-sm font-bold text-aluminum group-hover:text-amber transition-colors">
                Estrictamente Necesarias
              </span>
              <p className="font-quattrocento text-xs text-aluminum-dark/80 mt-0.5">
                Requeridas para el funcionamiento básico y seguridad del sitio.
              </p>
            </div>
          </label>

          {/* Analytics */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) =>
                  setPreferences({ ...preferences, analytics: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-5 h-5 border border-aluminum/30 rounded bg-black/30 flex items-center justify-center peer-checked:bg-amber/20 peer-checked:border-amber transition-all">
                {preferences.analytics && <Check className="h-3 w-3 text-amber font-bold" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="font-quattrocento text-sm font-bold text-aluminum group-hover:text-amber transition-colors">
                Estadísticas y Análisis
              </span>
              <p className="font-quattrocento text-xs text-aluminum-dark/80 mt-0.5">
                Nos permiten medir visitas y fuentes de tráfico para mejorar nuestra experiencia.
              </p>
            </div>
          </label>

          {/* Marketing */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) =>
                  setPreferences({ ...preferences, marketing: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-5 h-5 border border-aluminum/30 rounded bg-black/30 flex items-center justify-center peer-checked:bg-amber/20 peer-checked:border-amber transition-all">
                {preferences.marketing && <Check className="h-3 w-3 text-amber font-bold" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="font-quattrocento text-sm font-bold text-aluminum group-hover:text-amber transition-colors">
                Marketing y Publicidad
              </span>
              <p className="font-quattrocento text-xs text-aluminum-dark/80 mt-0.5">
                Utilizadas para mostrar anuncios y promociones personalizadas de nuestro café.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Button Actions */}
      <div className="mt-6 flex flex-wrap gap-3 justify-end items-center border-t border-aluminum/10 pt-4">
        {showPreferences ? (
          <>
            <button
              onClick={() => setShowPreferences(false)}
              className="px-4 py-2 text-xs font-bold font-quattrocento uppercase tracking-wider text-aluminum hover:text-amber transition-colors cursor-pointer"
            >
              Atrás
            </button>
            <button
              onClick={handleSavePreferences}
              className="px-4 py-2 rounded-lg bg-aluminum/10 hover:bg-aluminum/20 border border-aluminum/20 text-xs font-bold font-quattrocento uppercase tracking-wider text-aluminum transition-colors cursor-pointer"
            >
              Guardar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleDecline}
              className="px-4 py-2 rounded-lg hover:bg-white/5 text-xs font-bold font-quattrocento uppercase tracking-wider text-aluminum-dark hover:text-aluminum transition-colors cursor-pointer"
            >
              {t("decline")}
            </button>
            <button
              onClick={() => setShowPreferences(true)}
              className="p-2 rounded-lg bg-aluminum/5 hover:bg-aluminum/10 border border-aluminum/10 text-aluminum-dark hover:text-amber transition-colors cursor-pointer"
              title={t("settings")}
            >
              <Settings className="h-4 w-4" />
            </button>
          </>
        )}
        <button
          onClick={handleAcceptAll}
          className="px-5 py-2.5 rounded-lg bg-amber hover:bg-amber-light text-black text-xs font-bold font-quattrocento uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(249,178,51,0.2)] hover:shadow-[0_0_20px_rgba(249,178,51,0.4)]"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
