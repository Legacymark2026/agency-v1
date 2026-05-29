"use client";

import { useState, useEffect } from "react";
import { ChatWindow } from "@/components/chat/chat-window";
import { LeadForm } from "@/components/chat/lead-form";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ChatWidgetEmbedProps {
    apiKey: string;
    companyId: string;
    visitorId?: string;
}

export function ChatWidgetEmbed({ apiKey, companyId, visitorId: initialVisitorId }: ChatWidgetEmbedProps) {
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [visitorId, setVisitorId] = useState<string | null>(initialVisitorId || null);

    useEffect(() => {
        const storedVid = localStorage.getItem(`lm_vid_${companyId}`);
        const storedCid = localStorage.getItem(`lm_cid_${companyId}`);
        
        if (storedVid && !visitorId) setVisitorId(storedVid);
        if (storedCid) setConversationId(storedCid);
    }, [companyId, visitorId]);

    const handleChatStarted = (cid: string, vid: string) => {
        setConversationId(cid);
        setVisitorId(vid);
        localStorage.setItem(`lm_cid_${companyId}`, cid);
        localStorage.setItem(`lm_vid_${companyId}`, vid);
    };

    return (
        <div className="w-full h-screen flex flex-col bg-white dark:bg-zinc-950">
            {conversationId && visitorId ? (
                <ChatWindow 
                    conversationId={conversationId} 
                    visitorId={visitorId} 
                    onClose={() => window.parent.postMessage("lm-chat-close", "*")} 
                />
            ) : (
                <div className="flex-1 flex flex-col">
                    <div className="bg-gradient-to-br from-teal-600 via-teal-600 to-emerald-600 p-6 text-white shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-white/20 p-1">
                                    <img src="/favicon.ico" alt="LegacyMark Logo" className="w-full h-full object-contain rounded-lg" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg tracking-tight">LegacyMark AI</h3>
                                    <p className="text-sm text-white/80">Asistente Virtual</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => window.parent.postMessage("lm-chat-close", "*")}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <LeadForm onChatStarted={handleChatStarted} companyId={companyId} />
                    </div>
                </div>
            )}
        </div>
    );
}
