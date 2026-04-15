"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { WhatsAppTemplatesModal } from "@/components/crm/WhatsAppTemplates";

export function WhatsAppFloatingBtn({ contactPhone, contactName, dealTitle }: {
    contactPhone?: string | null;
    contactName?: string | null;
    dealTitle?: string;
}) {
    const [open, setOpen] = useState(false);

    if (!contactPhone) return null;

    return (
        <>
            <button 
                onClick={() => setOpen(true)}
                title="Contactar vía WhatsApp"
                className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50 group"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)' }}>
                <MessageSquare size={24} className="text-white drop-shadow-md group-hover:animate-pulse" />
                <span className="absolute right-16 px-3 py-1.5 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 shadow-xl pointer-events-none">
                    WhatsApp
                </span>
            </button>
            <WhatsAppTemplatesModal 
                open={open}
                onOpenChange={setOpen}
                contactPhone={contactPhone}
                contactName={contactName}
                dealTitle={dealTitle}
            />
        </>
    );
}
