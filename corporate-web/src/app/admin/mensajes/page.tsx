"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  Search, 
  Send, 
  Phone, 
  Clock, 
  RefreshCw, 
  Loader2,
  ExternalLink,
  User
} from "lucide-react";

interface Message {
  id: string;
  sender: string;
  text: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  visitorName: string;
  visitorContact: string | null;
  status: string;
  lastMessageAt: string;
  createdAt: string;
  messages: Message[];
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchChats = async () => {
      try {
        const url = filter !== "todos" 
          ? `/api/admin/chat?status=${filter}` 
          : "/api/admin/chat";
        const res = await fetch(url);
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setConversations(data.conversations || []);
          setLoading(false);
          // Auto seleccionar la primera conversación si no hay ninguna seleccionada
          if (!activeConvId && data.conversations?.length > 0) {
            setActiveConvId(data.conversations[0].id);
          }
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setLoading(false);
      }
    };

    fetchChats();
    return () => {
      isMounted = false;
    };
  }, [router, filter, refreshIndex, activeConvId]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          text: replyText.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Agregar el mensaje al hilo local
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? {
                  ...c,
                  status: "respondido",
                  messages: [...c.messages, data.message],
                }
              : c
          )
        );
        setReplyText("");
      } else {
        alert("Error al enviar la respuesta");
      }
    } catch {
      alert("Error de conexión al enviar");
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activeConvId) return;

    try {
      const res = await fetch("/api/admin/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          status: newStatus,
        }),
      });

      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId ? { ...c, status: newStatus } : c
          )
        );
      }
    } catch {
      alert("Error al cambiar estado");
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const term = search.toLowerCase();
    const matchesSearch =
      c.visitorName.toLowerCase().includes(term) ||
      (c.visitorContact && c.visitorContact.toLowerCase().includes(term)) ||
      c.messages.some((m) => m.text.toLowerCase().includes(term));
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-1">
            Atención al Cliente &amp; Conversiones
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Bandeja de Mensajes &amp; Chat en Vivo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Responda consultas enviadas desde el widget del portal y gestione prospectos corporativos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setRefreshIndex((r) => r + 1);
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-[#B08A1A] transition-colors shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#B08A1A]" : ""}`} />
          <span>Actualizar Bandeja</span>
        </button>
      </div>

      {/* Contenedor Principal de Chat (Layout de 2 Columnas) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Columna Izquierda: Lista de Conversaciones (4 cols) */}
        <div className="lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/50">
          {/* Buscador y Filtros */}
          <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar prospecto o mensaje..."
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#B08A1A]"
              />
            </div>

            {/* Píldoras de Filtro */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {["todos", "nuevo", "respondido", "cerrado"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all whitespace-nowrap text-[11px] ${
                    filter === st
                      ? "bg-[#0B192C] text-[#D4AF37] shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st === "nuevo" ? "Nuevos" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Chats */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No hay conversaciones con este criterio.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                const lastMsg = conv.messages[conv.messages.length - 1];
                const dateFormatted = new Date(conv.lastMessageAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full p-4 text-left transition-colors flex flex-col gap-1.5 ${
                      isActive
                        ? "bg-amber-500/10 border-l-4 border-l-[#B08A1A]"
                        : "hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 line-clamp-1">
                          {conv.visitorName}
                        </span>
                        {conv.status === "nuevo" && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{dateFormatted}</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">
                      {lastMsg ? lastMsg.text : "Sin mensajes aún"}
                    </p>

                    <div className="flex items-center justify-between text-[11px] mt-1">
                      <span className="text-slate-400 font-mono text-[10px]">
                        {conv.visitorContact || "Sin contacto"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          conv.status === "nuevo"
                            ? "bg-emerald-100 text-emerald-800"
                            : conv.status === "respondido"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {conv.status}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Hilo de Chat & Respuesta (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white min-h-[500px]">
          {activeConversation ? (
            <>
              {/* Header del Chat Activo */}
              <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#0B192C] text-[#D4AF37] flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      {activeConversation.visitorName}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      {activeConversation.visitorContact && (
                        <span className="font-mono text-[#B08A1A] font-bold">
                          {activeConversation.visitorContact}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>Iniciado: {new Date(activeConversation.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="flex items-center gap-2">
                  {activeConversation.visitorContact && (
                    <a
                      href={`https://wa.me/${activeConversation.visitorContact.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
                      title="Abrir en WhatsApp"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {/* Selector de Estado */}
                  <select
                    value={activeConversation.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#B08A1A]"
                  >
                    <option value="nuevo">Estado: Nuevo</option>
                    <option value="en_atencion">Estado: En Atención</option>
                    <option value="respondido">Estado: Respondido</option>
                    <option value="cerrado">Estado: Cerrado</option>
                  </select>
                </div>
              </div>

              {/* Mensajes del Hilo */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[440px] bg-slate-50/20">
                {activeConversation.messages.map((msg) => {
                  const isAdmin = msg.sender === "admin";
                  const time = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl shadow-sm text-xs leading-relaxed ${
                          isAdmin
                            ? "bg-[#0B192C] text-white rounded-tr-none border border-[#B08A1A]/40"
                            : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                          <span className="font-bold">
                            {isAdmin ? "Consultor NEOGESTIÓN" : activeConversation.visitorName}
                          </span>
                          <span>{time}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Formulario de Respuesta */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 bg-white flex gap-3">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escriba su respuesta directiva para el cliente..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#B08A1A] focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-xs hover:brightness-110 transition-all shadow-md disabled:opacity-50"
                >
                  {sendingReply ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Enviar</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700">Seleccione una conversación</h3>
              <p className="text-xs max-w-sm">
                Elija un prospecto de la columna izquierda para revisar el historial y responder en directo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
