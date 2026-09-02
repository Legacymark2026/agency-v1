"use client";

import { useState } from "react";
import { MessageCircle, X, Send, ShieldCheck } from "lucide-react";

export default function WhatsAppButton() {
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState(
    "Hola, deseo solicitar una sesión de diagnóstico estratégico con los directores de NEOGESTIÓN."
  );

  const phoneNumber = "18004508920";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.trackConversion) {
      window.trackConversion("whatsapp_click", { message });
    }
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encoded}`, "_blank");
    setChatOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Mini-Chat Popup */}
      {chatOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-[#0B192C] p-4 text-white flex items-center justify-between border-b border-[#B08A1A]/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Atención Directiva</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h4>
                <p className="text-[11px] text-slate-300">NEOGESTIÓN en línea</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Cerrar mini-chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="p-4 bg-slate-50 min-h-48 flex flex-col justify-end space-y-3 text-xs">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm max-w-[85%] text-slate-700">
              <p className="font-semibold text-slate-900 mb-1">Equipo NEOGESTIÓN:</p>
              <p>
                ¡Hola! Un gusto saludarle. ¿En qué podemos asesorarle hoy respecto a su estrategia corporativa o proyectos de modernización?
              </p>
              <span className="text-[10px] text-slate-400 mt-1.5 block text-right">
                Respuesta típica: &lt;15 min
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 px-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Canal directo y confidencial</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escriba su mensaje..."
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#B08A1A]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
              aria-label="Enviar por WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button with Pulse */}
      <div className="flex items-center group">
        {!chatOpen && (
          <span className="mr-3 hidden sm:inline-block px-3 py-1.5 rounded-xl bg-[#0B192C] text-[#D4AF37] text-xs font-semibold shadow-xl border border-[#B08A1A]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            ¿Hablamos por WhatsApp?
          </span>
        )}
        <button
          type="button"
          onClick={() => setChatOpen(!chatOpen)}
          aria-label="Abrir chat de WhatsApp"
          className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40 transition-transform duration-200 hover:scale-110 active:scale-95 relative"
        >
          <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping pointer-events-none" />
          {chatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
        </button>
      </div>
    </div>
  );
}
