"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Send, 
  ShieldCheck, 
  MessageSquare, 
  Loader2,
  CheckCircle2,
  Mail,
  Share2,
  ChevronUp,
  Sparkles
} from "lucide-react";
import { WhatsAppIcon, LinkedInIcon, InstagramIcon } from "./SocialIcons";

interface ChatMessageItem {
  id: string;
  sender: string;
  text: string;
  createdAt: string;
}

export default function WhatsAppButton() {
  const [chatOpen, setChatOpen] = useState(false);
  const [socialExpanded, setSocialExpanded] = useState(false);
  const [mode, setMode] = useState<"whatsapp" | "web">("whatsapp");
  const [showTooltip, setShowTooltip] = useState(true);

  // Configuración de Canales
  const phoneNumber = "18004508920";
  const emailAddress = "contacto@neogestion.com";
  const linkedinUrl = "https://www.linkedin.com/company/consultoria-de-colombia";
  const instagramUrl = "https://www.instagram.com/neogestion";

  // Estados de WhatsApp
  const [waMessage, setWaMessage] = useState(
    "Hola, deseo solicitar una sesión de diagnóstico estratégico con los directores de NEOGESTIÓN."
  );

  const quickQuestions = [
    "Deseo solicitar una demostración en vivo de NeoGestión.",
    "Quiero información sobre consultoría e implementación ISO / SG-SST.",
    "¿Cómo funciona la política de usuarios ilimitados y Cero Papel?",
  ];

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

  // Consultar mensajes periódicamente cuando el chat web esté activo
  useEffect(() => {
    if (!chatOpen || !conversationId || mode !== "web") return;

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
    const interval = setInterval(loadMessages, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [chatOpen, conversationId, mode]);

  // Enviar a WhatsApp
  const handleSendWhatsApp = (customText?: string) => {
    const textToSend = customText || waMessage;
    if (typeof window !== "undefined" && (window as unknown as { trackConversion?: (name: string, payload: unknown) => void }).trackConversion) {
      (window as unknown as { trackConversion: (name: string, payload: unknown) => void }).trackConversion("whatsapp_click", { message: textToSend });
    }
    const encoded = encodeURIComponent(textToSend);
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto select-none">
      
      {/* 1. Mini-Chat Popup */}
      {chatOpen && (
        <div className="mb-4 w-[330px] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header Directivo con respaldo institucional */}
          <div className="bg-[#01426F] p-4 text-white flex items-center justify-between border-b border-[#B08A1A]/40 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-emerald-950/40">
                <WhatsAppIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Atención en WhatsApp</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h4>
                <p className="text-[11px] text-slate-300 font-helvetica-thin tracking-wider">
                  Consultoría de Colombia • NeoGestión
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              aria-label="Cerrar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Canales: WhatsApp vs Web */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode("whatsapp")}
              className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors ${
                mode === "whatsapp"
                  ? "bg-white text-emerald-600 border-b-2 border-emerald-500 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <WhatsAppIcon className="w-4 h-4 text-emerald-500" />
              <span>WhatsApp Directo</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("web")}
              className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition-colors ${
                mode === "web"
                  ? "bg-white text-[#B08A1A] border-b-2 border-[#B08A1A] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#B08A1A]" />
              <span>Mensaje Web</span>
            </button>
          </div>

          {/* Modo 1: WhatsApp Directo */}
          {mode === "whatsapp" && (
            <div className="p-4 bg-slate-50 min-h-[350px] flex flex-col justify-between text-xs">
              <div className="space-y-3">
                {/* Mensaje de Bienvenida */}
                <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs text-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900">Equipo Directivo:</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> En línea
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    ¡Hola! Conecte directamente con un consultor directivo en nuestra línea corporativa verificada. Tiempo de respuesta promedio: &lt;10 minutos.
                  </p>
                </div>

                {/* Preguntas Rápidas */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                    Consultas Frecuentes:
                  </span>
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendWhatsApp(q)}
                      className="w-full text-left p-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-[11px] transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <span className="line-clamp-1">{q}</span>
                      <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 px-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Atención confidencial amparada bajo acuerdos de no divulgación.</span>
                </div>
              </div>

              {/* Formulario WhatsApp */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <textarea
                  rows={2}
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  placeholder="Escriba su requerimiento personalizado..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp()}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Iniciar Conversación en WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* Modo 2: Chat en Línea Web */}
          {mode === "web" && (
            <div className="flex flex-col h-[350px] bg-slate-50">
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs text-slate-700 max-w-[88%]">
                  <p className="font-bold text-slate-900 mb-1 text-[11px] text-[#B08A1A]">
                    Equipo Directivo NEOGESTIÓN:
                  </p>
                  <p>
                    Déjenos su requerimiento o inquietud técnica. Responderemos directamente a través de este panel y a su correo de contacto.
                  </p>
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
                            ? "bg-[#01426F] text-white rounded-tl-none border border-[#B08A1A]/40"
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
                    className="px-4 py-2 bg-[#01426F] hover:bg-slate-900 text-[#D4AF37] rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
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

          {/* Footer del Modal con Redes Sociales Oficiales */}
          <div className="bg-slate-900 px-4 py-2.5 text-white flex items-center justify-between border-t border-slate-800 text-[11px]">
            <span className="text-slate-400">Canales Oficiales:</span>
            <div className="flex items-center gap-2">
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn Consultoría de Colombia / NeoGestión"
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-[#0A66C2] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <LinkedInIcon className="w-3.5 h-3.5" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram NeoGestión"
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] text-slate-300 hover:text-white flex items-center justify-center transition-all"
              >
                <InstagramIcon className="w-3.5 h-3.5" />
              </a>
              <a
                href={`mailto:${emailAddress}`}
                title={`Correo Directo: ${emailAddress}`}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-[#01426F] hover:text-[#D4AF37] text-slate-300 flex items-center justify-center transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Speed-Dial Social Bubbles (LinkedIn, Instagram, Correo) */}
      <div className="flex flex-col items-end gap-2.5 mb-2.5">
        {/* Toggle para ver más canales o siempre visibles si socialExpanded */}
        <div
          className={`flex flex-col items-end gap-2 transition-all duration-300 ${
            socialExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none sm:opacity-100 sm:translate-y-0 sm:pointer-events-auto"
          }`}
        >
          {/* Burbuja LinkedIn */}
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn Directivo"
            aria-label="Perfil de LinkedIn"
            className="group flex items-center gap-2"
          >
            <span className="hidden group-hover:inline-block px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-medium shadow-md border border-slate-700 whitespace-nowrap transition-opacity">
              LinkedIn Corporativo
            </span>
            <div className="w-10 h-10 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-lg shadow-blue-900/30 hover:scale-110 active:scale-95 transition-transform">
              <LinkedInIcon className="w-5 h-5" />
            </div>
          </a>

          {/* Burbuja Instagram */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram Oficial"
            aria-label="Perfil de Instagram"
            className="group flex items-center gap-2"
          >
            <span className="hidden group-hover:inline-block px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-medium shadow-md border border-slate-700 whitespace-nowrap transition-opacity">
              Instagram @neogestion
            </span>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-lg shadow-rose-900/30 hover:scale-110 active:scale-95 transition-transform">
              <InstagramIcon className="w-5 h-5" />
            </div>
          </a>

          {/* Burbuja Correo Electrónico */}
          <a
            href={`mailto:${emailAddress}`}
            title={`Escríbanos a ${emailAddress}`}
            aria-label="Enviar correo electrónico"
            className="group flex items-center gap-2"
          >
            <span className="hidden group-hover:inline-block px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-medium shadow-md border border-slate-700 whitespace-nowrap transition-opacity">
              {emailAddress}
            </span>
            <div className="w-10 h-10 rounded-full bg-[#01426F] text-[#D4AF37] border border-[#B08A1A]/40 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
          </a>
        </div>
      </div>

      {/* 3. Main Floating WhatsApp Bubble */}
      <div className="flex items-center gap-2 group">
        {/* Tooltip speech bubble */}
        {!chatOpen && showTooltip && (
          <div className="relative hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white text-slate-800 text-xs font-bold shadow-xl border border-slate-200 animate-in fade-in slide-in-from-right-3 duration-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>¿Desea asesoría directiva? ¡Hablemos por WhatsApp!</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 ml-1"
              aria-label="Ocultar sugerencia"
            >
              <X className="w-3 h-3" />
            </button>
            {/* Triángulo de burbuja */}
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-white" />
          </div>
        )}

        {/* Botón Flotante Principal de WhatsApp */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setChatOpen(!chatOpen);
              setShowTooltip(false);
            }}
            aria-label="Abrir WhatsApp corporativo"
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 relative ${
              chatOpen 
                ? "bg-[#01426F] border border-[#B08A1A]" 
                : "bg-[#25D366] hover:bg-[#20bd5a] shadow-emerald-500/40"
            }`}
          >
            {!chatOpen && (
              <>
                <span className="absolute inset-0 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  1
                </span>
              </>
            )}
            {chatOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <WhatsAppIcon className="w-8 h-8 sm:w-9 sm:h-9" />
            )}
          </button>

          {/* Botón de toggle de redes en móviles */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSocialExpanded(!socialExpanded);
            }}
            className="sm:hidden absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#01426F] text-[#D4AF37] border border-[#B08A1A]/40 flex items-center justify-center shadow-md"
            title="Ver más redes sociales"
          >
            <Share2 className="w-3 h-3" />
          </button>
        </div>
      </div>

    </div>
  );
}
