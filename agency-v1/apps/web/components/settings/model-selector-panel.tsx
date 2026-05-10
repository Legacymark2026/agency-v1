"use client";

import { useState, useMemo } from "react";
import { MODEL_CATALOG, AIModelMeta, AIProvider } from "@/lib/universal-model-registry";
import {
    Sparkles, Zap, DollarSign, Brain, Filter, CheckCircle2, ChevronDown
} from "lucide-react";

// ── Provider badge config ─────────────────────────────────────────────────────
const PROVIDER_META: Record<AIProvider, { label: string; color: string; bg: string; dot: string }> = {
    openai:    { label: "OpenAI",    color: "text-green-300",   bg: "bg-green-950/60 border-green-800/40",   dot: "bg-green-400" },
    anthropic: { label: "Anthropic", color: "text-orange-300",  bg: "bg-orange-950/60 border-orange-800/40", dot: "bg-orange-400" },
    gemini:    { label: "Google",    color: "text-blue-300",    bg: "bg-blue-950/60 border-blue-800/40",     dot: "bg-blue-400" },
    deepseek:  { label: "DeepSeek",  color: "text-purple-300",  bg: "bg-purple-950/60 border-purple-800/40", dot: "bg-purple-400" },
    mistral:   { label: "Mistral",   color: "text-yellow-300",  bg: "bg-yellow-950/60 border-yellow-800/40", dot: "bg-yellow-400" },
    cohere:    { label: "Cohere",    color: "text-cyan-300",    bg: "bg-cyan-950/60 border-cyan-800/40",     dot: "bg-cyan-400" },
};

const COST_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    free:   { label: "Free",   color: "text-emerald-400", icon: <span className="text-[10px]">✦</span> },
    low:    { label: "Low",    color: "text-teal-400",    icon: <DollarSign className="w-3 h-3" /> },
    medium: { label: "Mid",    color: "text-yellow-400",  icon: <><DollarSign className="w-3 h-3" /><DollarSign className="w-3 h-3 -ml-1.5" /></> },
    high:   { label: "High",   color: "text-red-400",     icon: <><DollarSign className="w-3 h-3" /><DollarSign className="w-3 h-3 -ml-1.5" /><DollarSign className="w-3 h-3 -ml-1.5" /></> },
};

const CTX_LABEL = (n: number) =>
    n >= 1_000_000 ? `${n / 1_000_000}M ctx` : n >= 1000 ? `${n / 1000}K ctx` : `${n} ctx`;

// ── Compact Model Card ────────────────────────────────────────────────────────
function ModelCard({ model, selected, onSelect }: {
    model: AIModelMeta;
    selected: boolean;
    onSelect: () => void;
}) {
    const pm = PROVIDER_META[model.provider];
    const cm = COST_META[model.costTier];
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full text-left p-3 rounded-xl border transition-all duration-150 group relative overflow-hidden
                ${selected
                    ? "border-teal-500/70 bg-teal-950/40 shadow-[0_0_16px_-4px_rgba(20,184,166,0.3)]"
                    : "border-slate-700/60 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/40"
                }`}
        >
            {/* Selected glow */}
            {selected && (
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent pointer-events-none" />
            )}

            <div className="flex items-start justify-between gap-2">
                {/* Left */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Provider dot */}
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pm.dot}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${pm.color}`}>{pm.label}</span>
                        {/* Tools badge */}
                        {model.supportsTools && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-950/80 text-teal-400 border border-teal-800/40">
                                <Zap className="w-2.5 h-2.5" /> Tools
                            </span>
                        )}
                    </div>
                    <p className={`text-sm font-semibold mt-1 leading-tight truncate ${selected ? "text-teal-100" : "text-slate-200"}`}>
                        {model.label}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                        {model.description}
                    </p>
                </div>

                {/* Right — metadata */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {/* Cost */}
                    <div className={`flex items-center gap-0.5 text-[10px] font-mono ${cm.color}`}>
                        {cm.icon}
                        <span className="ml-0.5">{cm.label}</span>
                    </div>
                    {/* Context window */}
                    <span className="text-[10px] text-slate-500 font-mono">{CTX_LABEL(model.contextWindow)}</span>
                    {/* Selected checkmark */}
                    {selected && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                </div>
            </div>
        </button>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
    value: string;
    onChange: (modelId: string) => void;
}

const ALL_PROVIDERS: (AIProvider | "all")[] = ["all", "openai", "anthropic", "gemini", "deepseek", "mistral", "cohere"];

export function ModelSelectorPanel({ value, onChange }: Props) {
    const [activeFilter, setActiveFilter] = useState<AIProvider | "all">("all");
    const [showTools, setShowTools] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const selectedModel = MODEL_CATALOG.find(m => m.id === value);

    const filtered = useMemo(() =>
        MODEL_CATALOG.filter(m => {
            if (activeFilter !== "all" && m.provider !== activeFilter) return false;
            if (showTools && !m.supportsTools) return false;
            return true;
        }),
        [activeFilter, showTools]
    );

    return (
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 overflow-hidden">
            {/* ── Header ── */}
            <button
                type="button"
                onClick={() => setCollapsed(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-teal-400" />
                    <span className="text-sm font-semibold text-slate-200">Motor de IA</span>
                    {selectedModel && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-teal-950/60 border border-teal-800/40 text-[11px] text-teal-300 font-mono">
                            <span className={`w-1.5 h-1.5 rounded-full ${PROVIDER_META[selectedModel.provider].dot}`} />
                            {selectedModel.label}
                        </span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
            </button>

            {!collapsed && (
                <div className="border-t border-slate-800/60">
                    {/* ── Filter Bar ── */}
                    <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2 items-center border-b border-slate-800/60">
                        <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <div className="flex flex-wrap gap-1.5">
                            {ALL_PROVIDERS.map(p => {
                                const isActive = activeFilter === p;
                                const meta = p === "all" ? null : PROVIDER_META[p];
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setActiveFilter(p)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
                                            ${isActive
                                                ? (meta ? `${meta.bg} ${meta.color} border-current` : "bg-slate-700 text-white border-slate-600")
                                                : "bg-slate-900/50 text-slate-400 border-slate-700/50 hover:border-slate-600"
                                            }`}
                                    >
                                        {p === "all" ? "Todos" : (meta?.label ?? p)}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Tools-only toggle */}
                        <button
                            type="button"
                            onClick={() => setShowTools(v => !v)}
                            className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
                                ${showTools
                                    ? "bg-teal-950/60 text-teal-300 border-teal-700/60"
                                    : "bg-slate-900/50 text-slate-400 border-slate-700/50 hover:border-slate-600"
                                }`}
                        >
                            <Zap className="w-3 h-3" /> Solo con Tools
                        </button>
                    </div>

                    {/* ── Model Grid ── */}
                    <div className="px-3 py-3 grid grid-cols-1 gap-2 max-h-[380px] overflow-y-auto
                        [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-slate-900
                        [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {filtered.length === 0 && (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No hay modelos con ese filtro.
                            </div>
                        )}
                        {filtered.map(model => (
                            <ModelCard
                                key={model.id}
                                model={model}
                                selected={value === model.id}
                                onSelect={() => onChange(model.id)}
                            />
                        ))}
                    </div>

                    {/* ── Footer ── */}
                    {selectedModel && (
                        <div className="border-t border-slate-800/60 px-4 py-2.5 flex items-center gap-2 bg-slate-950/40">
                            <Sparkles className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                            <p className="text-[11px] text-slate-400">
                                Seleccionado:{" "}
                                <span className="text-teal-300 font-semibold">{selectedModel.label}</span>
                                {" · "}{CTX_LABEL(selectedModel.contextWindow)} contexto
                                {selectedModel.supportsTools && " · Soporta herramientas"}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
