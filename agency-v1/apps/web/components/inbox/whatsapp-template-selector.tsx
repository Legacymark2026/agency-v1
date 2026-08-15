"use client";

import { useState, useEffect } from "react";
import { X, Search, MessageSquare, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WaTemplate {
    id: string;
    name: string;
    language: string;
    category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
    components: { type: string; text?: string; format?: string }[];
    status: "APPROVED" | "PENDING" | "REJECTED";
    previewText?: string;
}

interface WhatsappTemplateSelectorProps {
    conversationId: string;
    contactName?: string;
    onSelect: (template: WaTemplate) => void;
    onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
    MARKETING: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    UTILITY: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    AUTHENTICATION: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

// Curated HSM templates for demo + real API fallback
const DEMO_TEMPLATES: WaTemplate[] = [
    {
        id: "tpl-recontact-01",
        name: "Recontacto Inicial",
        language: "es",
        category: "UTILITY",
        components: [{ type: "BODY", text: "Hola {{1}}, te escribimos desde LegacyMark. ¿Podemos retomar nuestra conversación?" }],
        status: "APPROVED",
        previewText: "Hola [Nombre], te escribimos desde LegacyMark. ¿Podemos retomar nuestra conversación?",
    },
    {
        id: "tpl-followup-02",
        name: "Seguimiento de Propuesta",
        language: "es",
        category: "UTILITY",
        components: [{ type: "BODY", text: "Hola {{1}}, quisiera hacer seguimiento a la propuesta que te enviamos. ¿Tienes alguna pregunta?" }],
        status: "APPROVED",
        previewText: "Hola [Nombre], quisiera hacer seguimiento a la propuesta que te enviamos. ¿Tienes alguna pregunta?",
    },
    {
        id: "tpl-appointment-03",
        name: "Recordatorio de Cita",
        language: "es",
        category: "UTILITY",
        components: [{ type: "BODY", text: "Hola {{1}}, te recordamos tu cita programada para mañana. Por favor confirma tu asistencia." }],
        status: "APPROVED",
        previewText: "Hola [Nombre], te recordamos tu cita programada para mañana. Por favor confirma tu asistencia.",
    },
    {
        id: "tpl-promo-04",
        name: "Oferta Especial",
        language: "es",
        category: "MARKETING",
        components: [{ type: "BODY", text: "¡Hola {{1}}! Tenemos una oferta exclusiva para ti esta semana. ¿Te gustaría conocer los detalles?" }],
        status: "APPROVED",
        previewText: "¡Hola [Nombre]! Tenemos una oferta exclusiva para ti esta semana. ¿Te gustaría conocer los detalles?",
    },
    {
        id: "tpl-support-05",
        name: "Soporte Técnico",
        language: "es",
        category: "UTILITY",
        components: [{ type: "BODY", text: "Hola {{1}}, notamos que tuviste un problema recientemente. Nuestro equipo técnico está disponible para ayudarte. ¿Podemos asistirte?" }],
        status: "APPROVED",
        previewText: "Hola [Nombre], notamos que tuviste un problema recientemente. Nuestro equipo técnico está disponible.",
    },
    {
        id: "tpl-satisfaction-06",
        name: "Encuesta de Satisfacción",
        language: "es",
        category: "MARKETING",
        components: [{ type: "BODY", text: "Hola {{1}}, ¿cómo calificarías la atención que recibiste? Tu opinión es muy importante para nosotros." }],
        status: "APPROVED",
        previewText: "Hola [Nombre], ¿cómo calificarías la atención que recibiste? Tu opinión es muy importante para nosotros.",
    },
];

export function WhatsappTemplateSelector({ conversationId, contactName, onSelect, onClose }: WhatsappTemplateSelectorProps) {
    const [templates, setTemplates] = useState<WaTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<WaTemplate | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>("ALL");

    useEffect(() => {
        const loadTemplates = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/whatsapp/templates?conversationId=${conversationId}`);
                if (res.ok) {
                    const data = await res.json();
                    const approved = (data.templates || []).filter((t: WaTemplate) => t.status === "APPROVED");
                    setTemplates(approved.length > 0 ? approved : DEMO_TEMPLATES);
                } else {
                    setTemplates(DEMO_TEMPLATES);
                }
            } catch {
                setTemplates(DEMO_TEMPLATES);
            } finally {
                setIsLoading(false);
            }
        };
        loadTemplates();
    }, [conversationId]);

    const filtered = templates.filter((t) => {
        const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.previewText || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchFilter = activeFilter === "ALL" || t.category === activeFilter;
        return matchSearch && matchFilter;
    });

    const getPreviewWithContact = (template: WaTemplate) => {
        const text = template.previewText || template.components.find(c => c.type === "BODY")?.text || "";
        return text.replace("{{1}}", contactName || "Cliente").replace("[Nombre]", contactName || "Cliente");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
                    <div>
                        <h2 className="text-sm font-black text-slate-100 font-mono tracking-wide">
                            📋 PLANTILLAS HSM APROBADAS
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Ventana de 24h expirada — Selecciona una plantilla pre-aprobada para recontactar al cliente
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                        <X size={16} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 py-3 border-b border-slate-800/60">
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar plantilla..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-teal-500/50 font-mono"
                        />
                    </div>
                    <div className="flex gap-2 mt-2">
                        {["ALL", "UTILITY", "MARKETING", "AUTHENTICATION"].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveFilter(cat)}
                                className={cn(
                                    "text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all font-mono",
                                    activeFilter === cat
                                        ? "bg-teal-500/20 border-teal-500/40 text-teal-300"
                                        : "bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {cat === "ALL" ? "Todas" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Template List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-slate-500 text-xs py-8 font-mono">No se encontraron plantillas</p>
                    ) : (
                        filtered.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => setSelectedTemplate(template === selectedTemplate ? null : template)}
                                className={cn(
                                    "w-full text-left p-3.5 rounded-xl border transition-all group",
                                    selectedTemplate?.id === template.id
                                        ? "bg-teal-500/10 border-teal-500/40"
                                        : "bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60"
                                )}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={11} className="text-teal-400 shrink-0" />
                                        <span className="text-xs font-bold text-slate-200 font-mono">{template.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono", CATEGORY_COLORS[template.category] || "")}>
                                            {template.category}
                                        </span>
                                        {selectedTemplate?.id === template.id && (
                                            <CheckCircle2 size={14} className="text-teal-400" />
                                        )}
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed pl-4">
                                    {getPreviewWithContact(template)}
                                </p>
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
                    <p className="text-[10px] text-slate-600 font-mono">
                        {filtered.length} plantilla{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => selectedTemplate && onSelect(selectedTemplate)}
                            disabled={!selectedTemplate}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                selectedTemplate
                                    ? "bg-teal-600 hover:bg-teal-500 text-white"
                                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                            )}
                        >
                            Enviar Plantilla <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
