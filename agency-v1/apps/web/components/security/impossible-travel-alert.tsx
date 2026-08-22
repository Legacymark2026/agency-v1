"use client";

import React, { useState } from "react";

export interface ImpossibleTravelAlertProps {
  userId?: string;
  priorLocation?: { city: string; country: string; timestamp: string };
  newLocation?: { city: string; country: string; timestamp: string };
  calculatedSpeedKmH?: number;
  onDismiss?: () => void;
  className?: string;
}

export function ImpossibleTravelAlert({
  userId = "user-1",
  priorLocation = { city: "Bogotá", country: "Colombia", timestamp: "Hace 10 min" },
  newLocation = { city: "Madrid", country: "España", timestamp: "Ahora" },
  calculatedSpeedKmH = 4850,
  onDismiss,
  className = ""
}: ImpossibleTravelAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-rose-500/30 bg-rose-950/40 p-5 backdrop-blur-xl transition-all shadow-xl shadow-rose-950/50 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <svg className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-rose-200 text-sm">Alerta de Seguridad: Acceso Sospechoso (Viaje Imposible)</h4>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-extrabold text-rose-300 border border-rose-500/40">HIGH RISK</span>
            </div>

            <p className="mt-1 text-xs text-rose-300/90 leading-relaxed">
              Se ha detectado un inicio de sesión que requeriría una velocidad de desplazamiento de{" "}
              <strong className="text-rose-100">{calculatedSpeedKmH.toLocaleString()} km/h</strong> entre dos ubicaciones.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-rose-200/80">
              <div className="flex items-center gap-1.5 bg-rose-900/40 px-2.5 py-1 rounded-lg border border-rose-500/20">
                <span>📍 Ubicación previa:</span>
                <span className="text-white font-semibold">{priorLocation.city}, {priorLocation.country}</span>
              </div>
              <span>➔</span>
              <div className="flex items-center gap-1.5 bg-rose-900/40 px-2.5 py-1 rounded-lg border border-rose-500/20">
                <span>⚡ Nuevo inicio:</span>
                <span className="text-white font-semibold">{newLocation.city}, {newLocation.country}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setDismissed(true);
            if (onDismiss) onDismiss();
          }}
          className="rounded-lg p-1 text-rose-400 hover:bg-rose-900/50 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3 pt-3 border-t border-rose-500/20">
        <button
          onClick={() => alert("Sesión bloqueada por seguridad.")}
          className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-rose-500 active:scale-95 transition-all"
        >
          Bloquear Sesión Ahora
        </button>
        <button
          onClick={() => alert("Redirigiendo a verificación 2FA...")}
          className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-rose-200 hover:bg-slate-800 border border-rose-500/30 transition-all"
        >
          Verificar con 2FA
        </button>
      </div>
    </div>
  );
}
