"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getCookieConsent } from "./CookieConsentBanner";

declare global {
  interface Window {
    trackConversion?: (eventType: string, metadata?: Record<string, unknown>) => void;
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const [hasConsent, setHasConsent] = useState<boolean>(false);

  useEffect(() => {
    // Verificar si el usuario ha otorgado consentimiento para analíticas
    const checkConsent = () => {
      const consent = getCookieConsent();
      setHasConsent(consent?.analytics === true);
    };

    checkConsent();

    // Escuchar actualizaciones de consentimiento en vivo
    const onConsentUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ analytics?: boolean }>;
      const allowed = customEvent.detail?.analytics === true;
      setHasConsent(allowed);
      if (allowed) {
        // Enviar evento de página una vez otorgado el consentimiento
        try {
          fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: window.location.pathname,
              referrer: document.referrer || "",
              eventType: "pageview",
            }),
          }).catch(() => {});
        } catch {
          // Silencioso
        }
      }
    };

    window.addEventListener("cookie_consent_updated", onConsentUpdated);
    return () => {
      window.removeEventListener("cookie_consent_updated", onConsentUpdated);
    };
  }, []);

  useEffect(() => {
    // Definir función global para conversiones (respetando consentimiento)
    window.trackConversion = (eventType: string, metadata?: Record<string, unknown>) => {
      const consent = getCookieConsent();
      if (!consent?.analytics) return;

      try {
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: window.location.pathname,
            referrer: document.referrer || "",
            eventType,
            metadata,
          }),
        }).catch(() => {});
      } catch {
        // Silencioso
      }
    };
  }, []);

  useEffect(() => {
    // Solo registrar vista de página al cambiar de ruta si las cookies analíticas están aceptadas
    if (!hasConsent) return;

    try {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          referrer: document.referrer || "",
          eventType: "pageview",
        }),
      }).catch(() => {});
    } catch {
      // Silencioso
    }
  }, [pathname, hasConsent]);

  return null;
}

