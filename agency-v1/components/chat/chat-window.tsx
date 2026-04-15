"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, CheckCheck, Check, Minimize2, X, Volume2, Settings, Maximize2, Paperclip, Smile, Clock, Shield, Zap, Mic } from "lucide-react";
import { getMessages, sendMessage } from "@/actions/chat";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { EmojiButton } from "./emoji-picker";
import { FileAttachmentButton } from "./file-attachment";
import { useSoundNotification } from "./sound-notifications";
import { AudioPlayer } from "./audio-player";

interface Message {
    id: string;
    content: string | null;
    direction: string;
    createdAt: Date;
    senderId: string | null;
    status: string;
    mediaUrl?: string;
    mediaType?: string;
    attachments?: { url: string; type: string; name: string }[];
}

interface ChatWindowProps {
    conversationId: string;
    visitorId: string;
    onClose: () => void;
}

const QUICK_REPLIES = [
    "¿Cuáles son sus servicios?",
    "Quiero una cotización",
    "¿Cómo funciona?",
    "Hablar con un asesor",
];

const AGENT = {
    name: "LegacyMark AI",
    avatar: "/images/support-agent.png",
    initials: "LM",
};

type AgentStatus = "online" | "away" | "offline";

function TypingIndicator() {
    return (
        <div className="flex items-end gap-2">
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={AGENT.avatar} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-teal-500 to-emerald-500 text-white font-bold">
                    {AGENT.initials}
                </AvatarFallback>
            </Avatar>
            <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-zinc-400"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function DateSeparator({ date }: { date: Date }) {
    const label = new Date(date).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
    return (
        <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium px-2">
                {label}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />
        </div>
    );
}

function MessageReactions({ onReact }: { onReact: (emoji: string) => void }) {
    const [showPicker, setShowPicker] = useState(false);
    const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

    return (
        <div className="relative">
            <button
                onClick={() => setShowPicker(!showPicker)}
                className="text-[10px] text-zinc-400 hover:text-teal-500 opacity-0 group-hover:opacity-100 transition-all"
            >
                <Smile className="h-3.5 w-3.5" />
            </button>
            {showPicker && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute bottom-full mb-2 left-0 bg-white dark:bg-zinc-800 rounded-full shadow-xl border border-zinc-100 dark:border-zinc-700 p-1.5 flex gap-0.5 z-20"
                >
                    {commonEmojis.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => { onReact(emoji); setShowPicker(false); }}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full text-sm transition-colors"
                        >
                            {emoji}
                        </button>
                    ))}
                </motion.div>
            )}
        </div>
    );
}

function MessageBubble({ msg, onReact }: { msg: Message; onReact: (emoji: string) => void }) {
    const isInbound = msg.direction === "INBOUND";
    const time = new Date(msg.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn("flex items-end gap-2 group", isInbound ? "justify-end" : "justify-start")}
        >
            {!isInbound && (
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={AGENT.avatar} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-teal-500 to-emerald-500 text-white font-bold">
                        {AGENT.initials}
                    </AvatarFallback>
                </Avatar>
            )}

            <div className={cn("max-w-[75%] flex flex-col", isInbound ? "items-end" : "items-start")}>
                {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex gap-2 mb-1.5 flex-wrap">
                        {msg.attachments.map((att, i) => (
                            att.type.startsWith("image/") ? (
                                <img 
                                    key={i}
                                    src={att.url} 
                                    alt={att.name}
                                    className="max-w-[180px] rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm"
                                />
                            ) : (
                                <div key={i} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 border border-zinc-100 dark:border-zinc-700">
                                    <Paperclip className="h-4 w-4 text-zinc-400" />
                                    <span className="text-xs font-medium">{att.name}</span>
                                </div>
                            )
                        ))}
                    </div>
                )}
                <div
                    className={cn(
                        "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm min-w-[60px]",
                        isInbound
                            ? "bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-br-md"
                            : "bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-bl-md"
                    )}
                >
                    {msg.mediaType === "AUDIO" || msg.mediaUrl?.includes(".webm") || msg.mediaUrl?.includes(".mp4") ? (
                        <div className="py-1">
                            <AudioPlayer 
                                src={msg.mediaUrl || ""} 
                                className={isInbound ? "bg-white/10 border-white/20" : ""} 
                            />
                        </div>
                    ) : (
                        msg.content
                    )}
                </div>
                <div className={cn("flex items-center gap-1.5 mt-1", isInbound ? "flex-row-reverse" : "flex-row")}>
                    <span className="text-[10px] text-zinc-400 font-medium">{time}</span>
                    {isInbound && (
                        msg.status === "SENDING"
                            ? <Check className="h-3 w-3 text-zinc-400" />
                            : <CheckCheck className="h-3 w-3 text-teal-500" />
                    )}
                    <MessageReactions onReact={onReact} />
                </div>
            </div>
        </motion.div>
    );
}

function SettingsPanel({ onClose, soundEnabled, onSoundToggle }: { 
    onClose: () => void;
    soundEnabled: boolean;
    onSoundToggle: (enabled: boolean) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-zinc-900 border-l border-zinc-100 dark:border-zinc-800 z-20"
        >
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-foreground">Configuración</h3>
                <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <X className="h-4 w-4" />
                </button>
            </div>
            
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                            <Volume2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <span className="text-sm font-medium">Sonido</span>
                    </div>
                    <button 
                        onClick={() => onSoundToggle(!soundEnabled)}
                        className={cn(
                            "w-11 h-6 rounded-full transition-all duration-300 relative",
                            soundEnabled ? "bg-teal-500" : "bg-zinc-200 dark:bg-zinc-700"
                        )}
                    >
                        <span className={cn(
                            "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300",
                            soundEnabled ? "left-5" : "left-0.5"
                        )} />
                    </button>
                </div>

                <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-xl border border-teal-100 dark:border-teal-900/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-sm">LM</span>
                        </div>
                        <div>
                            <p className="font-bold text-sm">LegacyMark AI</p>
                            <p className="text-xs text-teal-600 font-medium">● En línea</p>
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Nuestro equipo typically responde en menos de 2 minutos.
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Horario de atención</p>
                            <p className="text-xs text-zinc-400">Lun-Vie 9am-6pm</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Privacidad</p>
                            <p className="text-xs text-zinc-400">Datos seguros</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Respuesta rápida</p>
                            <p className="text-xs text-zinc-400">IA avanzada</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export function ChatWindow({ conversationId, visitorId, onClose }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [agentStatus] = useState<AgentStatus>("online");
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Voice note recording
    const [isRecording, setIsRecording] = useState(false);
    const [recordDuration, setRecordDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);

    const { playNotification, playMessageSent } = useSoundNotification({ enabled: soundEnabled });

    // Recording duration timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => setRecordDuration(p => p + 1), 1000);
        } else {
            setRecordDuration(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatDuration = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    // Resolves with the File only after onstop fires (all chunks are ready)
    const stopRecordingAndGetFile = (): Promise<File> => {
        return new Promise((resolve, reject) => {
            if (!mediaRecorderRef.current) return reject(new Error('No recorder'));
            const rec = mediaRecorderRef.current;
            rec.onstop = () => {
                const mimeType = rec.mimeType || 'audio/ogg';
                const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
                const blob = new Blob(audioChunksRef.current, { type: mimeType });
                const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: mimeType });
                rec.stream.getTracks().forEach(t => t.stop());
                audioChunksRef.current = [];
                resolve(file);
            };
            rec.stop();
        });
    };

    const toggleVoiceRecording = async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : MediaRecorder.isTypeSupported('audio/mp4')
                        ? 'audio/mp4'
                        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
                            ? 'audio/ogg;codecs=opus'
                            : 'audio/webm';
                const rec = new MediaRecorder(stream, { mimeType });
                mediaRecorderRef.current = rec;
                audioChunksRef.current = [];
                rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
                rec.start(200);
                setIsRecording(true);
            } catch {
                alert('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
            }
        } else {
            setIsRecording(false);
            try {
                const file = await stopRecordingAndGetFile();
                setAttachments(prev => [...prev, file]);
            } catch (err) {
                console.error('Error al procesar nota de voz:', err);
            }
        }
    };

    const cancelVoiceRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
            mediaRecorderRef.current.stop();
            audioChunksRef.current = [];
        }
        setIsRecording(false);
    };

    const fetchMessages = useCallback(async () => {
        const result = await getMessages(conversationId);
        if (result.success && result.data) {
            const newMessages = result.data as Message[];
            const prevCount = messages.length;
            setMessages(newMessages);
            
            if (newMessages.length > prevCount && newMessages[newMessages.length - 1].direction === "OUTBOUND") {
                playNotification();
            }
        }
    }, [conversationId, messages.length, playNotification]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
        }
    };

    const handleEmojiSelect = (emoji: string) => setInputValue(prev => prev + emoji);

    const handleFilesSelected = (files: File[]) => setAttachments(prev => [...prev, ...files].slice(0, 5));

    const handleSend = async (content?: string) => {
        const text = content ?? inputValue;
        if (!text.trim() && attachments.length === 0 && !isRecording) return;

        // If mid-recording pressing send: stop, get file, then re-send
        if (isRecording && mediaRecorderRef.current) {
            setIsRecording(false);
            try {
                const file = await stopRecordingAndGetFile();
                setAttachments(prev => [...prev, file]);
                setTimeout(() => handleSend(content), 50);
            } catch { /* ignore */ }
            return;
        }

        setInputValue("");
        setShowQuickReplies(false);
        if (textareaRef.current) textareaRef.current.style.height = "auto";

        const tempMsg: Message = {
            id: crypto.randomUUID(),
            content: text || "[Archivo]",
            direction: "INBOUND",
            createdAt: new Date(),
            senderId: null,
            status: "SENDING",
        };
        setMessages((prev) => [...prev, tempMsg]);

        playMessageSent();
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2500);

        setIsLoading(true);
        try {
            let mediaUrl: string | undefined;
            let mediaType: string | undefined;

            // Upload first attachment if exists (since schema supports one mediaUrl)
            if (attachments.length > 0) {
                const file = attachments[0];
                const formData = new FormData();
                formData.append("file", file);
                
                const res = await fetch("/api/public/chat/upload", {
                    method: "POST",
                    body: formData
                });
                
                if (res.ok) {
                    const data = await res.json();
                    mediaUrl = data.url;
                    mediaType = data.type; // AUDIO, IMAGE, etc.
                }
            }

            await sendMessage(conversationId, text, undefined, mediaUrl, mediaType || (attachments[0]?.type.includes('audio') ? 'AUDIO' : undefined));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
            setAttachments([]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleReaction = (msgId: string, emoji: string) => console.log("React:", msgId, emoji);

    const agentStatusColor = { online: "bg-emerald-400", away: "bg-amber-400", offline: "bg-zinc-400" };
    const agentStatusText = { online: "En línea", away: "Ausente", offline: "Desconectado" };

    const isMobile = typeof window !== "undefined" && window.innerWidth < 480;

    return (
        <div className={cn(
            "flex bg-zinc-50 dark:bg-zinc-950 overflow-hidden transition-all duration-300",
            isFullscreen ? "w-full h-full" : isMobile ? "w-full" : "w-[380px] h-[600px]",
            isFullscreen ? "rounded-none" : "rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800"
        )}>
            {isFullscreen && (
                <button 
                    onClick={() => setIsFullscreen(false)}
                    className="absolute top-4 right-4 z-50 p-2.5 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                    <Minimize2 className="h-5 w-5" />
                </button>
            )}
            
            <div className="flex-1 flex flex-col relative">
                <div className="bg-gradient-to-r from-teal-600 via-teal-600 to-emerald-600 px-4 py-3.5 flex items-center gap-3 relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                    <div className="relative flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                            <Avatar className="h-11 w-11 border-2 border-white/30 shadow-lg">
                                <AvatarImage src={AGENT.avatar} />
                                <AvatarFallback className="bg-white/20 text-white font-bold">
                                    {AGENT.initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className={cn("absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full", agentStatusColor[agentStatus])} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white font-bold text-sm truncate">{AGENT.name}</p>
                            <p className="text-white/70 text-xs flex items-center gap-1.5">
                                <span className={cn("w-2 h-2 rounded-full inline-block", agentStatusColor[agentStatus], agentStatus === "online" && "animate-pulse")} />
                                {agentStatusText[agentStatus]} • Responde en minutos
                            </p>
                        </div>
                    </div>
                    <div className="relative flex items-center gap-1">
                        <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
                            <Maximize2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setShowSettings(!showSettings)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
                            <Settings className="h-4 w-4" />
                        </button>
                        <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
                        <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-teal-500 to-emerald-500 text-white font-bold">
                                LM
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-[75%]">
                            <p className="text-sm text-zinc-800 dark:text-zinc-100">
                                ¡Hola! 👋 Bienvenido a <strong className="text-teal-600">LegacyMark</strong>. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?
                            </p>
                        </div>
                    </motion.div>

                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} msg={msg} onReact={(emoji) => handleReaction(msg.id, emoji)} />
                    ))}

                    {isTyping && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <TypingIndicator />
                        </motion.div>
                    )}

                    <div ref={scrollRef} />
                </div>

                <AnimatePresence>
                    {showQuickReplies && messages.length === 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-4 pb-3 flex gap-2 flex-wrap">
                            {QUICK_REPLIES.map((reply) => (
                                <button key={reply} onClick={() => handleSend(reply)} className="text-xs px-3 py-1.5 rounded-full border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-all font-medium">
                                    {reply}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {attachments.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-4 pb-2">
                            <div className="flex gap-2 flex-wrap">
                                {attachments.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-1.5 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-xs truncate max-w-[100px] font-medium">{file.name}</span>
                                        <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-zinc-400 hover:text-red-500 transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                    {/* Recording indicator bar */}
                    {isRecording && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-3 mb-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50"
                        >
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex-1">Grabando... {formatDuration(recordDuration)}</span>
                            <button
                                onClick={cancelVoiceRecording}
                                className="text-xs text-zinc-500 hover:text-red-600 transition-colors font-medium flex items-center gap-1"
                            >
                                <X className="h-3 w-3" /> Cancelar
                            </button>
                        </motion.div>
                    )}

                    <div className="flex items-end gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 focus-within:border-teal-400 dark:focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/10 transition-all">
                        <EmojiButton onEmojiSelect={handleEmojiSelect} />
                        <FileAttachmentButton onFilesSelected={handleFilesSelected} />
                        <textarea ref={textareaRef} value={inputValue} onChange={handleInput} onKeyDown={handleKeyDown} placeholder={isRecording ? 'Grabando nota de voz...' : 'Escribe tu mensaje...'} rows={1} disabled={isRecording} className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-zinc-400 max-h-[120px] leading-relaxed py-0.5 disabled:opacity-50" />

                        {/* Voice recording button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleVoiceRecording}
                            title={isRecording ? 'Detener grabación' : 'Grabar nota de voz'}
                            className={cn(
                                "h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                                isRecording
                                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
                                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                            )}
                        >
                            <Mic className="h-4 w-4" />
                        </motion.button>

                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleSend()} disabled={(!inputValue.trim() && attachments.length === 0 && !isRecording) || isLoading} className={cn("h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0", inputValue.trim() || attachments.length > 0 || isRecording ? "bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400")}>
                            <Send className="h-4 w-4" />
                        </motion.button>
                    </div>
                    <p className="text-[10px] text-center text-zinc-400 mt-2.5">
                        <span className="font-semibold text-teal-600">LegacyMark</span> • Asistente Virtual
                    </p>
                </div>
            </div>

            <AnimatePresence>
                {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} soundEnabled={soundEnabled} onSoundToggle={setSoundEnabled} />}
            </AnimatePresence>
        </div>
    );
}