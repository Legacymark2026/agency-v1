"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    trackConversion?: (eventType: string, metadata?: Record<string, unknown>) => void;
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Definir función global para conversiones
    window.trackConversion = (eventType: string, metadata?: Record<string, unknown>) => {
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
    // Registrar vista de página al cambiar de ruta
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
  }, [pathname]);

  return null;
}
