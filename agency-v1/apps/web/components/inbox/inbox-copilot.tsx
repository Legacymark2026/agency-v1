"use client";

import { useState, useCallback, useRef } from "react";
import { Sparkles, X, ChevronDown, ChevronUp, Copy, CheckCircle2, RefreshCw, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface InboxCopilotProps {
    conversationContext: {
        customerName?: string;
        lastMessage?: string;
        channel?: string;
        tags?: string[];
    };
    onInsertSuggestion: (text: string) => void;
}

const QUICK_ACTIONS = [
    { label: "Saludo Inicial", icon: "👋", prompt: "Genera un saludo profesional para atender al cliente." },
    { label: "Solicitar Info", icon: "📋", prompt: "Redacta un mensaje para solicitar más información al cliente." },
    { label: "Resolver Duda", icon: "✅", prompt: "Genera una respuesta concisa y amigable para resolver una consulta." },
    { label: "Agendar Cita", icon: "📅", prompt: "Propone agendar una cita para continuar la atención al cliente." },
    { label: "Escalar Caso", icon: "🔺", prompt: "Redacta un mensaje para informar que el caso será escalado a un especialista." },
    { label: "Cierre de Chat", icon: "🎯", prompt: "Genera un mensaje de cierre amigable y profesional para finalizar la conversación." },
];

const DEMO_SUGGESTIONS: Record<string, string[]> = {
    "Saludo Inicial": [
        "¡Hola! Bienvenido/a a LegacyMark. Soy tu asesor asignado. ¿En qué puedo ayudarte hoy?",
        "¡Buenos días! Gracias por contactarnos. Estoy aquí para asistirte. ¿Cuál es tu consulta?",
    ],
    "Solicitar Info": [
        "Para poder ayudarte mejor, ¿podrías indicarme tu nombre completo y el número de pedido relacionado?",
        "Con gusto te asisto. ¿Podrías proporcionar más detalles sobre la situación que estás experimentando?",
    ],
    "Resolver Duda": [
        "Claro, entiendo tu consulta. La respuesta es la siguiente: puedes acceder a esa función desde el menú principal en Configuración → Integraciones.",
        "Con mucho gusto te explico: el proceso es completamente automático una vez que configures tu cuenta. ¿Deseas que te guíe paso a paso?",
    ],
    "Agendar Cita": [
        "Para brindarte una atención más personalizada, te invito a agendar una sesión con nuestro equipo en: legacymarksas.com/book/legacymark",
        "¿Te gustaría agendar una llamada de 30 minutos para revisar tu caso en detalle? Puedes elegir tu horario aquí: legacymarksas.com/book/legacymark",
    ],
    "Escalar Caso": [
        "Tu consulta requiere la atención de uno de nuestros especialistas. Voy a escalar tu caso y recibirás respuesta en menos de 2 horas hábiles.",
        "Entiendo la urgencia. He notificado a nuestro equipo técnico especializado. Te contactarán a la brevedad para resolver esto definitivamente.",
    ],
    "Cierre de Chat": [
        "Ha sido un placer atenderte. Si tienes alguna otra consulta, no dudes en escribirnos. ¡Que tengas excelente día! 🌟",
        "Fue un gusto asistirte. Recuerda que estamos disponibles de lunes a viernes de 9am a 6pm. ¡Hasta pronto! 👋",
    ],
};

export function InboxCopilot({ conversationContext, onInsertSuggestion }: InboxCopilotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleQuickAction = useCallback(async (action: { label: string; prompt: string }) => {
        setIsGenerating(true);
        setActiveAction(action.label);
        setSuggestions([]);

        try {
            // Try real AI endpoint first
            const res = await fetch("/api/v1/ai/copilot-suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: action.prompt,
                    context: conversationContext,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.suggestions?.length > 0) {
                    setSuggestions(data.suggestions);
                    return;
                }
            }
        } catch {
            // Fallback to demo suggestions below
        }

        // Fallback to curated demo suggestions
        await new Promise((r) => setTimeout(r, 700));
        setSuggestions(DEMO_SUGGESTIONS[action.label] || [
            `Mensaje generado por IA para: ${action.label}. ${conversationContext.customerName ? `Estimado/a ${conversationContext.customerName}` : "Estimado/a cliente"}, con gusto le atendemos.`,
        ]);
    }, [conversationContext]);

    const handleInsert = (text: string) => {
        onInsertSuggestion(text);
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleRegenerate = () => {
        if (activeAction) {
            const action = QUICK_ACTIONS.find((a) => a.label === activeAction);
            if (action) handleQuickAction(action);
        }
    };

    return (
        <div className={cn(
            "border-t transition-all duration-300",
            isOpen
                ? "bg-gradient-to-b from-slate-900/90 to-slate-950/95 border-teal-500/20"
                : "bg-slate-900/40 border-slate-800/50"
        )}>
            {/* Header toggle */}
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-teal-500/5 transition-all"
            >
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-teal-500/20 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-teal-400" />
                    </div>
                    <span className="text-xs font-bold text-teal-400 font-mono tracking-wide">COPILOTO DE IA</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-500">
                        ENTERPRISE
                    </span>
                    {isGenerating && (
                        <span className="text-[9px] text-amber-400 font-mono animate-pulse">Generando...</span>
                    )}
                </div>
                {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                )}
            </button>

            {/* Copilot Panel */}
            {isOpen && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Quick Action Chips */}
                    <div className="flex flex-wrap gap-2">
                        {QUICK_ACTIONS.map((action) => (
                            <button
                                key={action.label}
                                onClick={async () => {
                                    setIsGenerating(true);
                                    setIsOpen(true);
                                    await handleQuickAction(action);
                                    setIsGenerating(false);
                                }}
                                disabled={isGenerating}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer",
                                    activeAction === action.label
                                        ? "bg-teal-500/20 border-teal-500/50 text-teal-300"
                                        : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-teal-500/30 hover:text-teal-400",
                                    isGenerating && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <span>{action.icon}</span>
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1">
                                    <Lightbulb className="w-3 h-3 text-amber-400" />
                                    Sugerencias Generadas
                                </span>
                                <button
                                    onClick={handleRegenerate}
                                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-teal-400 transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Regenerar</span>
                                </button>
                            </div>

                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="group relative bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:border-teal-500/30 transition-all"
                                >
                                    <p className="text-xs text-slate-300 leading-relaxed pr-16">{suggestion}</p>

                                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleCopy(suggestion, index)}
                                            className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                                            title="Copiar"
                                        >
                                            {copiedIndex === index ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleInsert(suggestion)}
                                            className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold transition-colors"
                                            title="Insertar en chat"
                                        >
                                            Usar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {suggestions.length === 0 && !isGenerating && (
                        <p className="text-[11px] text-slate-600 text-center py-1">
                            Selecciona una acción para que la IA genere respuestas sugeridas para el agente.
                        </p>
                    )}

                    {/* Generating skeleton */}
                    {isGenerating && (
                        <div className="space-y-2">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 animate-pulse">
                                    <div className="h-2 bg-slate-700 rounded w-full mb-2" />
                                    <div className="h-2 bg-slate-700 rounded w-3/4" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
