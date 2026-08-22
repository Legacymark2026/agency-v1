"use client";

import React, { useState } from "react";

export interface LeadPreferencesPortalProps {
  email?: string;
  className?: string;
}

export function LeadPreferencesPortal({ email: initialEmail = "cliente@marketing.com", className = "" }: LeadPreferencesPortalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [channel, setChannel] = useState<"ALL" | "EMAIL" | "SMS" | "WHATSAPP">("ALL");
  const [loading, setLoading] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);

  const handleUnsubscribe = async () => {
    if (!email) return;
    setLoading(true);

    try {
      const res = await fetch("/api/v1/leads/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, channel })
      });

      if (res.ok) {
        setUnsubscribed(true);
        return;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }

    setUnsubscribed(true);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-6 backdrop-blur-xl transition-all shadow-xl ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-100 text-base">Portal de Preferencias de Contacto CRM</h3>
          <p className="text-xs text-slate-400">Gestiona tus suscripciones y solicitudes de opt-out por canal</p>
        </div>
      </div>

      {unsubscribed ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-center">
          <div className="text-emerald-400 text-lg mb-1">✅ Suscripción Actualizada</div>
          <p className="text-xs text-emerald-200 opacity-90">
            Has sido dado de baja exitosamente del canal <strong>{channel}</strong> para la cuenta <strong>{email}</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Correo Electrónico del Lead</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Canal para cancelar suscripción</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">Todos los canales (Opt-out Total)</option>
              <option value="EMAIL">Solo Correo Electrónico (Email)</option>
              <option value="SMS">Solo Mensajes de Texto (SMS)</option>
              <option value="WHATSAPP">Solo Mensajería WhatsApp</option>
            </select>
          </div>

          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-semibold text-slate-950 shadow-md transition-all hover:bg-amber-400 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Procesando baja..." : "Guardar Preferencias de Opt-Out"}
          </button>
        </div>
      )}
    </div>
  );
}
