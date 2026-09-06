"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, Check, X } from "lucide-react";

export const COOKIE_CONSENT_KEY = "neogestion_cookie_consent";

export interface CookieConsentData {
  essential: boolean;
  analytics: boolean;
  timestamp: number;
  version: string;
}

export function getCookieConsent(): CookieConsentData | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_CONSENT_KEY}=([^;]+)`));
  if (!match) return null;

  try {
    const raw = decodeURIComponent(match[2]);
    const data: CookieConsentData = JSON.parse(raw);
    if (typeof data.essential === "boolean" && typeof data.analytics === "boolean") {
      return data;
    }
  } catch {
    return null;
  }
  return null;
}

export function saveCookieConsent(consent: { analytics: boolean }) {
  if (typeof document === "undefined") return;
  const data: CookieConsentData = {
    essential: true,
    analytics: consent.analytics,
    timestamp: Date.now(),
    version: "1.0",
  };

  const json = encodeURIComponent(JSON.stringify(data));
  const maxAge = 60 * 60 * 24 * 365; // 1 año
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_CONSENT_KEY}=${json}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;

  // Notificar a los componentes que dependen del consentimiento (p.ej. AnalyticsTracker)
  window.dispatchEvent(new CustomEvent("cookie_consent_updated", { detail: data }));
}

export default function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = getCookieConsent();
    if (!existing) {
      // Pequeño retraso para no bloquear la animación inicial
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!mounted || !visible) return null;

  const handleAcceptAll = () => {
    saveCookieConsent({ analytics: true });
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    saveCookieConsent({ analytics: false });
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Gestión de consentimiento de cookies"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-[#0B192C]/95 backdrop-blur-md border border-[#B08A1A]/40 text-white p-5 sm:p-6 rounded-3xl shadow-2xl space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-[#B08A1A]/50 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
              <span>Gestión de Cookies &amp; Privacidad</span>
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              En <strong className="text-white font-bold">NEOGESTIÓN</strong> utilizamos cookies técnicas necesarias para el funcionamiento del portal y métricas agregadas anónimas para optimizar los tiempos de carga y respuesta de la plataforma.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
          <Link
            href="/cookies"
            className="text-[#D4AF37] hover:underline font-semibold"
          >
            Leer Política de Cookies
          </Link>
          <span className="text-slate-500">Conforme a RGPD &amp; Cero Papel</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 text-xs font-black hover:brightness-110 transition-all shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aceptar Todas</span>
          </button>
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
            <span>Solo Necesarias</span>
          </button>
        </div>
      </div>
    </div>
  );
}
