"use client";

import { useState, useEffect } from "react";
import { 
  MessageCircle, 
  X, 
  Send, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Loader2,
  CheckCircle2
} from "lucide-react";

interface ChatMessageItem {
  id: string;
  sender: string;
  text: string;
  createdAt: string;
}

export default function WhatsAppButton() {
  const [chatOpen, setChatOpen] = useState(false);
  const [mode, setMode] = useState<"web" | "whatsapp">("web");

  // Estados de WhatsApp
  const [waMessage, setWaMessage] = useState(
    "Hola, deseo solicitar una sesión de diagnóstico estratégico con los directores de NEOGESTIÓN."
  );
  const phoneNumber = "18004508920";

  // Estados de Chat Web
  const [visitorName, setVisitorName] = useState("");
  const [visitorContact, setVisitorContact] = useState("");
  const [webMessage, setWebMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("neogestion_chat_conv_id");
    }
    return null;
  });
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Consultar mensajes periódicamente cuando el chat esté abierto y exista conversación
  useEffect(() => {
    if (!chatOpen || !conversationId) return;

    let isMounted = true;
    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/chat?conversationId=${conversationId}`);
        const data = await res.json();
        if (isMounted && data.messages) {
          setMessages(data.messages);
        }
      } catch {
        // Silencioso
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 8000); // Polling suave de 8s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [chatOpen, conversationId]);

  // Enviar a WhatsApp
  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.trackConversion) {
      window.trackConversion("whatsapp_click", { message: waMessage });
    }
    const encoded = encodeURIComponent(waMessage);
    window.open(`https://wa.me/${phoneNumber}?text=${encoded}`, "_blank");
    setChatOpen(false);
  };

  // Enviar mensaje Web
  const handleSendWebMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          visitorName: visitorName || "Visitante Directivo",
          visitorContact,
          text: webMessage.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.conversationId) {
        setConversationId(data.conversationId);
        if (typeof window !== "undefined") {
          localStorage.setItem("neogestion_chat_conv_id", data.conversationId);
        }
        setMessages((prev) => [...prev, data.message]);
        setWebMessage("");
        setSentSuccess(true);
        setTimeout(() => setSentSuccess(false), 4000);
      }
    } catch {
      alert("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Mini-Chat Popup */}
      {chatOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header Directivo */}
          <div className="bg-[#0B192C] p-4 text-white flex items-center justify-between border-b border-[#B08A1A]/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1E3E62] border border-[#B08A1A] flex items-center justify-center text-[#D4AF37] shadow-md">
                <MessageSquare className="w-5 h-5" />
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

          {/* Selector de Canales: Chat en Línea vs WhatsApp */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode("web")}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
                mode === "web"
                  ? "bg-white text-[#B08A1A] border-b-2 border-[#B08A1A] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat en Línea</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("whatsapp")}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
                mode === "whatsapp"
                  ? "bg-white text-emerald-600 border-b-2 border-emerald-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp Directo</span>
            </button>
          </div>

          {/* Modo 1: Chat en Línea (Conectado a /admin/mensajes) */}
          {mode === "web" && (
            <div className="flex flex-col h-[340px] bg-slate-50">
              {/* Hilo de Mensajes */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs text-slate-700 max-w-[88%]">
                  <p className="font-bold text-slate-900 mb-1 text-[11px] text-[#B08A1A]">
                    Equipo Directivo NEOGESTIÓN:
                  </p>
                  <p>
                    ¡Bienvenido! Déjenos su requerimiento o consulta corporativa. Nuestro equipo responderá de inmediato en este mismo chat y en su correo/teléfono.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block text-right">
                    Conexión directa con el Panel
                  </span>
                </div>

                {messages.map((m) => {
                  const isAdmin = m.sender === "admin";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`p-3 rounded-2xl shadow-xs max-w-[85%] text-xs ${
                          isAdmin
                            ? "bg-[#0B192C] text-white rounded-tl-none border border-[#B08A1A]/40"
                            : "bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-medium rounded-tr-none"
                        }`}
                      >
                        <p className="font-bold text-[10px] opacity-80 mb-0.5">
                          {isAdmin ? "Consultor NEOGESTIÓN:" : "Usted:"}
                        </p>
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      </div>
                    </div>
                  );
                })}

                {sentSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] text-center font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mensaje recibido en el Panel Directivo</span>
                  </div>
                )}
              </div>

              {/* Formulario de Mensaje Web */}
              <form onSubmit={handleSendWebMessage} className="p-3 bg-white border-t border-slate-200 space-y-2">
                {messages.length === 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="Su Nombre / Cargo"
                      className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#B08A1A]"
                    />
                    <input
                      type="text"
                      value={visitorContact}
                      onChange={(e) => setVisitorContact(e.target.value)}
                      placeholder="Teléfono o Correo"
                      className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#B08A1A]"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={webMessage}
                    onChange={(e) => setWebMessage(e.target.value)}
                    placeholder="Escriba su consulta..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-800 focus:outline-none focus:border-[#B08A1A]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !webMessage.trim()}
                    className="px-4 py-2 bg-[#0B192C] hover:bg-slate-900 text-[#D4AF37] rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                    aria-label="Enviar mensaje al panel"
                  >
                    {sending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modo 2: WhatsApp Directo */}
          {mode === "whatsapp" && (
            <div className="p-4 bg-slate-50 min-h-[340px] flex flex-col justify-between text-xs">
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs text-slate-700">
                  <p className="font-semibold text-slate-900 mb-1">Equipo NEOGESTIÓN:</p>
                  <p>
                    Inicie una conversación instantánea en nuestra línea corporativa verificada de WhatsApp.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1.5 block text-right">
                    Respuesta directiva: &lt;15 min
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 px-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Línea directiva confidencial</span>
                </div>
              </div>

              <form onSubmit={handleSendWhatsApp} className="space-y-2 pt-4 border-t border-slate-200">
                <textarea
                  rows={3}
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-[#B08A1A]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Abrir Conversación en WhatsApp</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Floating Button with Pulse */}
      <div className="flex items-center group">
        {!chatOpen && (
          <span className="mr-3 hidden sm:inline-block px-3 py-1.5 rounded-xl bg-[#0B192C] text-[#D4AF37] text-xs font-semibold shadow-xl border border-[#B08A1A]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            ¿Desea asesoría directiva en vivo?
          </span>
        )}
        <button
          type="button"
          onClick={() => setChatOpen(!chatOpen)}
          aria-label="Abrir chat directivo"
          className="w-14 h-14 rounded-full bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/30 transition-transform duration-200 hover:scale-110 active:scale-95 relative"
        >
          <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping pointer-events-none" />
          {chatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
        </button>
      </div>
    </div>
  );
}
