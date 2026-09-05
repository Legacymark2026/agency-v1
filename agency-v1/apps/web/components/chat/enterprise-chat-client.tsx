"use client";

import { useState, useEffect, useRef } from "react";
import {
  Hash, Lock, Users, Send, Plus, Search, Circle,
  Smile, Paperclip, MessageSquare, Bell, MoreVertical
} from "lucide-react";
import {
  getChatChannelsAction,
  createChatChannelAction,
  getChannelMessagesAction,
  sendChatMessageAction
} from "@/actions/chat.actions";

interface Channel {
  id: string;
  name: string;
  description?: string;
  type: "PUBLIC" | "PRIVATE" | "DIRECT_MESSAGE";
  _count?: { messages: number };
}

interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: string;
  createdAt: string;
}

export function EnterpriseChatClient({
  initialChannels,
  currentUserId,
  currentUserName,
  companyId
}: {
  initialChannels: Channel[];
  currentUserId: string;
  currentUserName: string;
  companyId: string;
}) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(initialChannels[0] || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [wsConnected, setWsConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect WebSocket for real-time streaming
  useEffect(() => {
    if (typeof window === "undefined") return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    // Connect through gateway / local port or direct websocket url
    const wsUrl = `${protocol}//${host}:4023/ws/chat?companyId=${companyId}&userId=${currentUserId}&userName=${encodeURIComponent(currentUserName)}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        if (activeChannel) {
          ws.send(JSON.stringify({ action: "join_channel", payload: { channelId: activeChannel.id } }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === "message.created" && data.payload) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.payload.id)) return prev;
              return [...prev, data.payload];
            });
          }
        } catch {}
      };

      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
    } catch {
      setWsConnected(false);
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [companyId, currentUserId, currentUserName]);

  // Load messages when channel switches
  useEffect(() => {
    if (!activeChannel) return;
    setLoading(true);

    getChannelMessagesAction(activeChannel.id)
      .then((res: any) => {
        if (res?.data) {
          setMessages(res.data);
        }
      })
      .finally(() => setLoading(false));

    // Join channel in websocket if open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "join_channel", payload: { channelId: activeChannel.id } }));
    }
  }, [activeChannel]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !activeChannel) return;

    const content = inputMessage.trim();
    setInputMessage("");

    // Optimistic message update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      channelId: activeChannel.id,
      senderId: currentUserId,
      senderName: currentUserName,
      content,
      type: "TEXT",
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Send via WebSocket if available, otherwise REST
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: "send_message",
        payload: { channelId: activeChannel.id, content }
      }));
    } else {
      await sendChatMessageAction(activeChannel.id, content);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    const res: any = await createChatChannelAction({
      name: newChannelName.trim(),
      type: newChannelType
    });
    if (res?.data) {
      setChannels((prev) => [res.data, ...prev]);
      setActiveChannel(res.data);
      setIsNewChannelOpen(false);
      setNewChannelName("");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4.5rem)] rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* ── Left Sidebar: Channels List ── */}
      <div className="w-80 border-r border-slate-800/80 bg-slate-950/90 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-400" />
              Chat de Equipo
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Circle className={`w-2 h-2 fill-current ${wsConnected ? "text-emerald-400" : "text-amber-400"}`} />
              <span className="text-xs text-slate-400 font-mono">
                {wsConnected ? "Tiempo Real Activo" : "Modo Resiliente HTTP"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsNewChannelOpen(true)}
            className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-all border border-teal-500/20"
            title="Crear Canal"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Canales ({channels.length})
          </div>

          {channels.map((channel) => {
            const isActive = activeChannel?.id === channel.id;
            return (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-teal-500/15 text-teal-300 font-medium border border-teal-500/30 shadow-[0_0_10px_-2px_rgba(20,184,166,0.3)]"
                    : "text-slate-300 hover:bg-slate-900/80 hover:text-white"
                }`}
              >
                {channel.type === "PUBLIC" ? (
                  <Hash className="w-4 h-4 text-teal-400 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="truncate flex-1 text-sm">{channel.name}</span>
                {channel._count?.messages ? (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    {channel._count.messages}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Chat Room Area ── */}
      <div className="flex-1 flex flex-col bg-slate-900/30">
        {activeChannel ? (
          <>
            {/* Room Header */}
            <div className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-950/40 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  {activeChannel.type === "PUBLIC" ? <Hash className="w-5 h-5" /> : <Lock className="w-5 h-5 text-amber-400" />}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base leading-tight">
                    {activeChannel.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeChannel.description || "Canal de coordinación operativa corporativa"}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full text-sm text-slate-500">
                  Cargando mensajes del canal...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                  <MessageSquare className="w-10 h-10 stroke-1 text-slate-600" />
                  <p className="text-sm">No hay mensajes aún en #{activeChannel.name}.</p>
                  <p className="text-xs text-slate-600">¡Sé el primero en iniciar la conversación!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-xs font-medium text-slate-400">
                          {isMine ? "Tú" : msg.senderName}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div
                        className={`max-w-xl px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? "bg-teal-600 text-white rounded-tr-none shadow-md shadow-teal-900/20"
                            : "bg-slate-800/90 text-slate-100 rounded-tl-none border border-slate-700/50"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Escribe un mensaje en #${activeChannel.name}...`}
                  className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Selecciona un canal para comenzar a conversar.
          </div>
        )}
      </div>

      {/* ── Modal: New Channel ── */}
      {isNewChannelOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Crear Nuevo Canal Corporativo</h3>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nombre del Canal</label>
              <input
                type="text"
                placeholder="ej. ingenieria-despliegues"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Visibilidad</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewChannelType("PUBLIC")}
                  className={`p-3 rounded-xl border text-left text-xs ${
                    newChannelType === "PUBLIC"
                      ? "border-teal-500 bg-teal-500/10 text-teal-300"
                      : "border-slate-800 bg-slate-950 text-slate-400"
                  }`}
                >
                  <div className="font-bold mb-0.5">Público</div>
                  <div className="text-[11px] opacity-75">Visible para todo el equipo</div>
                </button>
                <button
                  type="button"
                  onClick={() => setNewChannelType("PRIVATE")}
                  className={`p-3 rounded-xl border text-left text-xs ${
                    newChannelType === "PRIVATE"
                      ? "border-amber-500 bg-amber-500/10 text-amber-300"
                      : "border-slate-800 bg-slate-950 text-slate-400"
                  }`}
                >
                  <div className="font-bold mb-0.5">Privado</div>
                  <div className="text-[11px] opacity-75">Solo miembros invitados</div>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewChannelOpen(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateChannel}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm"
              >
                Crear Canal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
