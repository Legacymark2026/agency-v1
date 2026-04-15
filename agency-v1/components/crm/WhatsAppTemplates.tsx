"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

const TEMPLATES = [
    { id: "1", title: "Primer Contacto", text: "Hola {{name}}, recibimos tu solicitud sobre {{dealTitle}}. ¿Cuándo tendrías 5 mins para hablar?" },
    { id: "2", title: "Seguimiento Propuesta", text: "Hola {{name}}, ¿tuviste oportunidad de revisar la propuesta de {{dealTitle}}? Quedo atento a tus dudas." },
    { id: "3", title: "Agendar Reunión", text: "Hola {{name}}, te comparto mi calendario para conversar sobre {{dealTitle}}: calendly.com/mi-link" },
];

export function WhatsAppTemplatesModal({ open, onOpenChange, contactPhone, contactName, dealTitle }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contactPhone?: string | null;
    contactName?: string | null;
    dealTitle?: string;
}) {
    const [templateId, setTemplateId] = useState<string>("1");
    
    if (!contactPhone) return null;
    
    // Clean phone
    const phone = contactPhone.replace(/\D/g, "");
    const selected = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
    
    const message = selected.text.replace("{{name}}", contactName || "").replace("{{dealTitle}}", dealTitle || "");
    const encodedMessage = encodeURIComponent(message);
    const link = `https://wa.me/${phone}?text=${encodedMessage}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-white text-slate-900 border-none shadow-2xl rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-emerald-600 font-bold">
                        <MessageSquare className="w-5 h-5" /> Enviar WhatsApp
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm font-medium text-slate-700">Selecciona Plantilla</p>
                    <div className="grid gap-2">
                        {TEMPLATES.map(t => (
                            <button key={t.id} onClick={() => setTemplateId(t.id)}
                                className={`text-left p-3 border rounded-xl text-sm transition-all focus:outline-none ${templateId === t.id ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"}`}>
                                <span className="font-bold block mb-1">{t.title}</span>
                                <span className="text-xs opacity-80">{t.text.replace("{{name}}", contactName || "N/A").replace("{{dealTitle}}", dealTitle || "")}</span>
                            </button>
                        ))}
                    </div>
                    
                    <textarea 
                        value={message} 
                        readOnly 
                        className="w-full h-24 p-3 text-sm border rounded-xl bg-slate-50 text-slate-600 font-mono resize-none focus:outline-none focus:ring-2 ring-emerald-100"
                    />

                    <div className="flex gap-2 pt-2">
                        <button onClick={() => { navigator.clipboard.writeText(message); toast.success("Copiado!"); }}
                            className="flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all active:scale-95">
                            <Copy size={14} /> Copiar
                        </button>
                        <a href={link} target="_blank" rel="noopener noreferrer"
                            className="flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-0.5 active:scale-95"
                            onClick={() => onOpenChange(false)}>
                            <ExternalLink size={14} /> Abrir WhatsApp
                        </a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
