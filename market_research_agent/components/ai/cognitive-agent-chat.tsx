"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Bot, Send, X, Loader2, Sparkles, Mic, MicOff, Bell,
    TrendingUp, Search, FileText, Calendar, History, ChevronRight,
    AlertTriangle, Clock, CheckCircle2, GripHorizontal, Paperclip, Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string | any[];
    toolUsed?: string;
}

interface Alert {
    id: string;
    type: "stale_deal" | "overdue_invoice";
    severity: "warning" | "danger";
    title: string;
    description: string;
    value?: string;
    daysStale: number;
}

type Tab = "chat" | "alerts" | "history";

const QUICK_COMMANDS = [
    { icon: TrendingUp, label: "Reporte del mes",   prompt: "Dame el reporte de ventas de este mes",       color: "text-teal-400" },
    { icon: Search,     label: "Buscar deal",        prompt: "Busca mis tratos activos en el CRM",          color: "text-blue-400" },
    { icon: FileText,   label: "Nueva factura",      prompt: "Genera una factura para un nuevo cliente",    color: "text-purple-400" },
    { icon: Calendar,   label: "Agendar reunión",    prompt: "Agenda una reunión para mañana a las 10am",   color: "text-amber-400" },
];

export function CognitiveAgentChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("chat");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [alertCount, setAlertCount] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [historySessions, setHistorySessions] = useState<any[]>([]);
    
    // Nivel 4: Roles y Visión
    const [roleType, setRoleType] = useState<"general"|"marketing"|"sales">("general");
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Draggable
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [initialized, setInitialized] = useState(false);
    const dragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const didDrag = useRef(false);

    useEffect(() => {
        setPos({ x: window.innerWidth - 80, y: 80 });
        setInitialized(true);
    }, []);

    // Load alerts on mount
    useEffect(() => {
        fetch("/api/agent/alerts")
            .then((r) => r.json())
            .then((d) => {
                setAlerts(d.alerts || []);
                setAlertCount(d.count || 0);
            })
            .catch(() => {});
    }, []);

    // Load history when tab switches
    useEffect(() => {
        if (activeTab === "history") {
            fetch("/api/agent/history")
                .then((r) => r.json())
                .then((d) => setHistorySessions(d.conversations || []))
                .catch(() => {});
        }
    }, [activeTab]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading, activeTool]);

    const saveHistory = useCallback(async (msgs: Message[]) => {
        if (msgs.length < 2) return;
        fetch("/api/agent/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: msgs[0]?.content?.slice(0, 60) || "Conversación",
                messages: msgs.map((m) => ({ role: m.role, content: m.content })),
            }),
        }).catch(() => {});
    }, []);

    // Voice input
    const toggleVoice = useCallback(() => {
        if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
            alert("Tu navegador no soporta reconocimiento de voz.");
            return;
        }
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.lang = "es-MX";
        rec.continuous = false;
        rec.interimResults = false;
        rec.onresult = (e: any) => {
            setInput(e.results[0][0].transcript);
            setIsListening(false);
        };
        rec.onerror = () => setIsListening(false);
        rec.onend = () => setIsListening(false);
        rec.start();
        recognitionRef.current = rec;
        setIsListening(true);
    }, [isListening]);

    // Drag handlers
    const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
        if (isOpen) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragging.current = true;
        didDrag.current = false;
        dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    }, [isOpen, pos]);

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
        if (!dragging.current) return;
        didDrag.current = true;
        const newX = Math.min(Math.max(e.clientX - dragOffset.current.x, 0), window.innerWidth - 64);
        const newY = Math.min(Math.max(e.clientY - dragOffset.current.y, 0), window.innerHeight - 64);
        setPos({ x: newX, y: newY });
    }, []);

    const onPointerUp = useCallback(() => { dragging.current = false; }, []);

    const handleButtonClick = useCallback(() => {
        if (!didDrag.current) setIsOpen((v) => !v);
        didDrag.current = false;
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setAttachedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = useCallback(async (e?: React.FormEvent, overrideInput?: string) => {
        e?.preventDefault();
        const userText = (overrideInput || input).trim();
        if ((!userText && !attachedImage) || isLoading) return;

        let finalContent: any = userText;
        if (attachedImage) {
            finalContent = [];
            if (userText) finalContent.push({ type: "text", text: userText });
            finalContent.push({ type: "image", image: attachedImage });
        }

        const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: finalContent };
        const assistantId = crypto.randomUUID();
        const assistantMsg: Message = { id: assistantId, role: "assistant", content: "" };

        const nextMessages = [...messages, userMsg, assistantMsg];
        setMessages(nextMessages);
        setInput("");
        setAttachedImage(null);
        setIsLoading(true);
        setActiveTool(null);

        try {
            const res = await fetch("/api/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
                    roleType
                }),
            });

            if (!res.ok || !res.body) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Error HTTP ${res.status}`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (line.startsWith("0:")) {
                        try {
                            const piece = JSON.parse(line.slice(2));
                            if (typeof piece === "string") {
                                fullText += piece;
                                setMessages((prev) =>
                                    prev.map((m) => m.id === assistantId ? { ...m, content: fullText } : m)
                                );
                            }
                        } catch { /* skip */ }
                    } else if (line.startsWith("8:")) {
                        // Tool call event
                        try {
                            const toolData = JSON.parse(line.slice(2));
                            setActiveTool(toolData?.toolName || null);
                        } catch { /* skip */ }
                    } else if (line.startsWith("data: ") && line !== "data: [DONE]") {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const piece = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (piece) {
                                fullText += piece;
                                setMessages((prev) =>
                                    prev.map((m) => m.id === assistantId ? { ...m, content: fullText } : m)
                                );
                            }
                        } catch { /* skip */ }
                    }
                }
            }

            if (!fullText.trim()) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? { ...m, content: "⚠️ El agente no retornó texto. Verifica que GOOGLE_GENERATIVE_AI_API_KEY esté configurada en el .env del servidor." }
                            : m
                    )
                );
            } else {
                // Save to history after successful response
                const finalMessages = nextMessages.map((m) =>
                    m.id === assistantId ? { ...m, content: fullText } : m
                );
                saveHistory(finalMessages);
            }
        } catch (err: any) {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId
                        ? { ...m, content: `⚠️ Error: ${err.message || "Error de conexión."}` }
                        : m
                )
            );
        } finally {
            setIsLoading(false);
            setActiveTool(null);
        }
    }, [input, attachedImage, isLoading, messages, roleType, saveHistory]);

    const loadHistorySession = useCallback((session: any) => {
        setMessages(
            session.messages.map((m: any) => ({
                id: m.id || crypto.randomUUID(),
                role: m.role,
                content: m.content,
            }))
        );
        setActiveTab("chat");
    }, []);

    if (!initialized) return null;

    const chatWidth = 420;
    const chatHeight = 600;
    const chatX = pos.x + 64 + chatWidth > window.innerWidth
        ? Math.max(pos.x - chatWidth - 8, 8)
        : pos.x + 68;
    const chatY = pos.y + chatHeight > window.innerHeight
        ? Math.max(window.innerHeight - chatHeight - 16, 8)
        : pos.y;

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={handleButtonClick}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{ left: pos.x, top: pos.y, touchAction: "none" }}
                className={cn(
                    "fixed p-4 rounded-full text-white z-[9999] flex items-center justify-center group select-none cursor-grab active:cursor-grabbing shadow-[0_0_24px_rgba(20,184,166,0.7)] transition-colors",
                    isOpen ? "bg-teal-500" : "bg-teal-600 hover:bg-teal-500"
                )}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6 group-hover:scale-110 transition-transform" />}
                {/* Alert badge */}
                {alertCount > 0 && !isOpen && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5 animate-pulse">
                        {alertCount}
                    </span>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div
                    style={{ left: chatX, top: chatY, width: chatWidth, height: chatHeight }}
                    className="fixed bg-slate-950 border border-teal-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[9998]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-teal-500/20 rounded-md">
                                <Bot className="h-4 w-4 text-teal-400" />
                            </div>
                            <div>
                                <select 
                                    value={roleType} 
                                    onChange={(e) => setRoleType(e.target.value as any)}
                                    className="bg-transparent text-sm font-semibold text-slate-200 outline-none cursor-pointer hover:text-teal-400 transition-colors"
                                >
                                    <option value="general" className="bg-slate-900">Copiloto General</option>
                                    <option value="marketing" className="bg-slate-900">CMO (Marketing)</option>
                                    <option value="sales" className="bg-slate-900">Director Ventas</option>
                                </select>
                                <p className="text-[10px] text-teal-500 tracking-wider font-mono">EN LÍNEA · 7 HERRAMIENTAS</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <GripHorizontal className="h-4 w-4 text-slate-600" />
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-800 shrink-0">
                        {([
                            { id: "chat",    label: "Chat",     icon: Bot },
                            { id: "alerts",  label: `Alertas ${alertCount > 0 ? `(${alertCount})` : ""}`, icon: Bell },
                            { id: "history", label: "Historial", icon: History },
                        ] as { id: Tab; label: string; icon: any }[]).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
                                    activeTab === tab.id
                                        ? "text-teal-400 border-b-2 border-teal-400"
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <tab.icon className="h-3.5 w-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab: Chat */}
                    {activeTab === "chat" && (
                        <>
                            {/* Tool indicator */}
                            {activeTool && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-teal-900/30 border-b border-teal-800/30 shrink-0">
                                    <Loader2 className="h-3 w-3 animate-spin text-teal-400" />
                                    <span className="text-xs text-teal-300 font-mono">Ejecutando: {activeTool}...</span>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                                        <div className="p-4 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                                            <Sparkles className="h-10 w-10 text-teal-400 mx-auto" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-300">Copiloto C-Level</p>
                                            <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                                                Acceso directo al CRM, facturación, calendario y comunicaciones de la agencia.
                                            </p>
                                        </div>
                                        {/* Quick commands */}
                                        <div className="grid grid-cols-2 gap-2 w-full mt-2">
                                            {QUICK_COMMANDS.map((cmd) => (
                                                <button
                                                    key={cmd.label}
                                                    type="button"
                                                    onClick={() => handleSubmit(undefined, cmd.prompt)}
                                                    className="flex items-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 hover:border-teal-500/50 transition-all text-left group"
                                                >
                                                    <cmd.icon className={cn("h-4 w-4 shrink-0", cmd.color)} />
                                                    <span className="text-xs text-slate-300 group-hover:text-white leading-tight">{cmd.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map((m) => (
                                    <div key={m.id}
                                        className={cn(
                                            "max-w-[88%] rounded-xl p-3 text-sm",
                                            m.role === "user"
                                                ? "bg-teal-600 text-white self-end ml-auto"
                                                : "bg-slate-800 text-slate-200 self-start border border-slate-700"
                                        )}
                                    >
                                        {m.role === "assistant" && !m.content && isLoading
                                            ? <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                                                <span className="text-xs text-slate-500">Procesando...</span>
                                              </div>
                                            : Array.isArray(m.content) 
                                                ? <div className="flex flex-col gap-2">
                                                    {m.content.map((c: any, i: number) => 
                                                        c.type === "image" 
                                                            ? <img key={i} src={c.image} alt="Upload" className="max-w-full rounded-md object-cover max-h-[200px]" />
                                                            : <span key={i} className="whitespace-pre-wrap leading-relaxed">{c.text}</span>
                                                    )}
                                                  </div>
                                                : <span className="whitespace-pre-wrap leading-relaxed">{m.content as string}</span>
                                        }
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
                                {attachedImage && (
                                    <div className="mb-2 relative inline-block">
                                        <img src={attachedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-700" />
                                        <button 
                                            type="button" 
                                            onClick={() => setAttachedImage(null)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                                <div className="relative flex items-center gap-2">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        ref={fileInputRef} 
                                        onChange={handleImageUpload} 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 rounded-lg transition-colors shrink-0 bg-slate-800 text-slate-400 hover:text-white"
                                        title="Adjuntar Imagen"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={toggleVoice}
                                        className={cn(
                                            "p-2 rounded-lg transition-colors shrink-0",
                                            isListening ? "bg-red-500 text-white animate-pulse" : "bg-slate-800 text-slate-400 hover:text-white"
                                        )}
                                        title="Entrada de voz"
                                    >
                                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                    </button>
                                    <input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        disabled={isLoading}
                                        placeholder="Ordena un comando, pregunta o sube una imagen..."
                                        className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-600 disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={(!input.trim() && !attachedImage) || isLoading}
                                        className="absolute right-2 p-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-md disabled:opacity-50 transition-colors"
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* Tab: Alerts */}
                    {activeTab === "alerts" && (
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {alerts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-50">
                                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                                    <p className="text-sm text-slate-400">¡Sin alertas activas! Todo está al día.</p>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={cn(
                                            "p-3 rounded-xl border flex items-start gap-3 cursor-pointer hover:opacity-90 transition-opacity",
                                            alert.severity === "danger"
                                                ? "bg-red-950/30 border-red-800/50"
                                                : "bg-amber-950/30 border-amber-800/50"
                                        )}
                                        onClick={() => {
                                            setActiveTab("chat");
                                            setInput(`Dame información sobre: ${alert.title}`);
                                        }}
                                    >
                                        {alert.severity === "danger"
                                            ? <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                                            : <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                                        }
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-200 truncate">{alert.title}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{alert.description}</p>
                                            {alert.value && (
                                                <p className={cn("text-xs font-mono font-semibold mt-1", alert.severity === "danger" ? "text-red-400" : "text-amber-400")}>
                                                    {alert.value}
                                                </p>
                                            )}
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-600 shrink-0 mt-1" />
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Tab: History */}
                    {activeTab === "history" && (
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {historySessions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-50">
                                    <History className="h-10 w-10 text-slate-600" />
                                    <p className="text-sm text-slate-400">No hay conversaciones guardadas aún.</p>
                                </div>
                            ) : (
                                historySessions.map((session) => (
                                    <button
                                        key={session.id}
                                        onClick={() => loadHistorySession(session)}
                                        className="w-full text-left p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-teal-500/50 hover:bg-slate-750 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-slate-200 truncate group-hover:text-teal-300">{session.title}</p>
                                            <ChevronRight className="h-4 w-4 text-slate-600 shrink-0" />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {session.messages?.length || 0} mensajes · {new Date(session.updatedAt).toLocaleDateString('es-MX')}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
