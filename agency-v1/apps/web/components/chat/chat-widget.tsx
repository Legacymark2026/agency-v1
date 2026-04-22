"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, ChevronDown, Mic } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { LeadForm } from "./lead-form";
import { ChatWindow } from "./chat-window";
import { VoiceWidget } from "@/components/agents/voice-widget";
import { cn } from "@/lib/utils";
import { getPublicVoiceAgent } from "@/actions/ai-agents";

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [voiceAgent, setVoiceAgent] = useState<{ id: string; name: string } | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [visitorId, setVisitorId] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    // Drag state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const positionRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 480);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        const fetchVoiceAgent = async () => {
            const res = await getPublicVoiceAgent();
            if (res?.success) setVoiceAgent(res.agent);
        };
        fetchVoiceAgent();

        const checkExistingChat = async () => {
            const storedVid = localStorage.getItem("chat_visitor_id");
            const storedCid = localStorage.getItem("chat_conversation_id");
            
            if (storedVid) setVisitorId(storedVid);
            
            // Verify conversation exists before using it
            if (storedCid) {
                try {
                    const { verifyConversation } = await import("@/actions/chat");
                    const isValid = await verifyConversation(storedCid);
                    if (isValid) {
                        setConversationId(storedCid);
                    } else {
                        // Clear invalid conversation
                        localStorage.removeItem("chat_conversation_id");
                        localStorage.removeItem("chat_visitor_id");
                        setConversationId(null);
                        setVisitorId(null);
                    }
                } catch {
                    localStorage.removeItem("chat_conversation_id");
                    setConversationId(null);
                }
            }

            const timer = setTimeout(() => {
                if (!isOpen) setHasUnread(true);
            }, 5000);
            return () => clearTimeout(timer);
        };
        
        checkExistingChat();
    }, [isOpen]);

    const handleChatStarted = (cid: string, vid: string) => {
        setConversationId(cid);
        setVisitorId(vid);
        localStorage.setItem("chat_conversation_id", cid);
        localStorage.setItem("chat_visitor_id", vid);
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setHasUnread(false);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX - positionRef.current.x, y: e.clientY - positionRef.current.y };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        
        // Keep within viewport bounds
        const maxX = window.innerWidth - 80;
        const maxY = window.innerHeight - 80;
        
        setPosition({ x: Math.max(-maxX, Math.min(0, newX)), y: Math.max(-maxY, Math.min(0, newY)) });
        positionRef.current = { x: Math.max(-maxX, Math.min(0, newX)), y: Math.max(-maxY, Math.min(0, newY)) };
    }, [isDragging]);

    const toggleVoice = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsVoiceActive(!isVoiceActive);
        if (isOpen) setIsOpen(false);
    };

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            return () => {
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Touch support for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        const touch = e.touches[0];
        dragStartRef.current = { x: touch.clientX - positionRef.current.x, y: touch.clientY - positionRef.current.y };
    };

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        const newX = touch.clientX - dragStartRef.current.x;
        const newY = touch.clientY - dragStartRef.current.y;
        
        const maxX = window.innerWidth - 80;
        const maxY = window.innerHeight - 80;
        
        setPosition({ x: Math.max(-maxX, Math.min(0, newX)), y: Math.max(-maxY, Math.min(0, newY)) });
        positionRef.current = { x: Math.max(-maxX, Math.min(0, newX)), y: Math.max(-maxY, Math.min(0, newY)) };
    }, [isDragging]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("touchmove", handleTouchMove);
            window.addEventListener("touchend", handleTouchEnd);
            return () => {
                window.removeEventListener("touchmove", handleTouchMove);
                window.removeEventListener("touchend", handleTouchEnd);
            };
        }
    }, [isDragging, handleTouchMove, handleTouchEnd]);

    // Mobile: show as floating button at bottom-right, not full screen overlay
    const mobileChatWidth = "sm:max-w-sm w-[85vw] max-h-[70vh]";
    const mobileButtonSize = "h-14 w-14";

    return (
        <div 
            className={cn(
                "fixed z-50 flex flex-col items-end",
                isDragging && "cursor-grabbing"
            )}
            style={{ right: 16 + position.x, bottom: 24 + position.y }}
        >
            <AnimatePresence>
                {isVoiceActive && voiceAgent && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 z-[60]"
                    >
                        <VoiceWidget
                            agentId={voiceAgent.id}
                            agentName={voiceAgent.name}
                            onClose={() => setIsVoiceActive(false)}
                        />
                    </motion.div>
                )}

                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={cn(
                            "pointer-events-auto shadow-2xl overflow-hidden mb-4 rounded-2xl",
                            mobileChatWidth
                        )}
                    >
                        {conversationId && visitorId ? (
                            <ChatWindow 
                                conversationId={conversationId} 
                                visitorId={visitorId} 
                                onClose={() => setIsOpen(false)} 
                            />
                        ) : (
                            <div className={cn(
                                "w-full",
                                "bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
                            )}>
                                <div className="relative bg-gradient-to-br from-teal-600 via-teal-600 to-emerald-600 p-4 sm:p-6 text-white overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                                    <span className="text-white font-bold text-base sm:text-lg">LM</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-base sm:text-lg tracking-tight">LegacyMark AI</h3>
                                                    <p className="text-xs sm:text-sm text-white/80">Asistente Virtual</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setIsOpen(false)}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                aria-label="Cerrar chat"
                                            >
                                                <X className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 sm:mt-4">
                                            <span className="flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                            </span>
                                            <span className="text-xs sm:text-xs text-white/70">En línea</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 overflow-y-auto" style={{ maxHeight: "50vh" }}>
                                    <LeadForm onChatStarted={handleChatStarted} />
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="group relative pointer-events-auto">
                <AnimatePresence>
                    {!isOpen && (isHovered || hasUnread) && !isDragging && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 10, scale: 0.9 }}
                            className="absolute right-16 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 text-foreground px-4 py-3 rounded-2xl shadow-2xl border border-border/50 whitespace-nowrap text-sm font-medium mr-2"
                        >
                            {hasUnread ? (
                                <span className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    ¡Nuevo mensaje!
                                </span>
                            ) : (
                                "¿En qué podemos ayudarte?"
                            )}
                            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-zinc-900 border-r border-b border-border/50 rotate-[-45deg]"></div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex gap-3 items-center">
                    {voiceAgent && (
                        <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleVoice}
                            className={cn(
                                "h-12 w-12 rounded-full shadow-xl flex items-center justify-center transition-all",
                                isVoiceActive
                                    ? "bg-red-500 text-white"
                                    : "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                            )}
                        >
                            <Mic size={20} className={isVoiceActive ? "animate-pulse" : ""} />
                        </motion.button>
                    )}

                    <motion.button
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        whileHover={!isDragging ? { scale: 1.08 } : undefined}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            if (isVoiceActive) setIsVoiceActive(false);
                            toggleChat();
                        }}
                        aria-label={isOpen ? "Cerrar ventana de chat" : "Abrir ventana de chat"}
                        className={cn(
                            "rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center relative overflow-hidden cursor-grab active:cursor-grabbing",
                            "h-14 w-14 sm:h-16 sm:w-16",
                            isOpen
                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                : "bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-500 text-white",
                            isDragging && "cursor-grabbing"
                        )}
                        style={!isMobile && isDragging ? { transform: "scale(1.1)" } : undefined}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />

                        {!isOpen && hasUnread && (
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                        </span>
                    )}

                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="fill-current h-5 w-5 sm:h-6 sm:w-6" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="open"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <MessageCircle className="fill-current h-6 w-6 sm:h-7 sm:w-7" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
                </div>
                
                <div className="hidden sm:block absolute -bottom-6 right-0 text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Arrastra para mover
                    </div>
            </div>
        </div>
    );
}