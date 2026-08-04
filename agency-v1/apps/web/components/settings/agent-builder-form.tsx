"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertAIAgent } from "@/actions/ai-agents";
import {
    Bot, Save, ArrowLeft, Terminal, Cpu, Database, Blocks, Plus,
    UserCheck, Brain, Shield, Zap, AlertTriangle, ChevronRight, Info, Mic, Sparkles, Loader2,
    CheckCircle2, Sliders, Layers, Eye
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KnowledgeBaseManager } from "@/components/settings/knowledge-base-manager";
import { AgentSpecializations } from "@/components/settings/agent-specializations";
import { AgentSkillsManager } from "@/components/settings/agent-skills-manager";
import { SkillTemplatesLibrary } from "@/components/settings/skill-templates-library";
import { ModelSelectorPanel } from "@/components/settings/model-selector-panel";
import { generateSystemPromptWithAI } from "@/actions/agent-ai-builder";

// ── CRM Variable Tokens ─────────────────────────────────────────────────────
const CRM_TOKENS = [
    { label: "Nombre", token: "{{contact.first_name}}" },
    { label: "Apellido", token: "{{contact.last_name}}" },
    { label: "Email", token: "{{contact.email}}" },
    { label: "Teléfono", token: "{{contact.phone}}" },
    { label: "Empresa", token: "{{contact.company}}" },
    { label: "Valor Deal", token: "{{deal.value}}" },
    { label: "Etapa Deal", token: "{{deal.stage}}" },
    { label: "Última Int.", token: "{{last_interaction_date}}" },
    { label: "Mi Empresa", token: "{{company.name}}" },
];

// ── Toggle Row Component ───────────────────────────────────────────────────
function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-800/40 last:border-b-0">
            <div>
                <p className="text-sm font-medium text-slate-200">{label}</p>
                {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
            </div>
            <button
                type="button"
                onClick={() => onChange(!value)}
                className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${value ? "bg-teal-500" : "bg-slate-700"}`}
            >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${value ? "translate-x-5" : ""}`} />
            </button>
        </div>
    );
}

interface Props {
    companyId: string;
    knowledgeBases?: { id: string; name: string }[];
    initialData?: any;
}

export function AgentBuilderForm({ companyId, knowledgeBases = [], initialData }: Props) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<"identity" | "prompt" | "knowledge" | "tools" | "governance">("identity");

    // ── State Variables
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [agentType, setAgentType] = useState(initialData?.agentType || "CUSTOM");
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
    const [isInboxAgent, setIsInboxAgent] = useState(initialData?.isInboxAgent ?? false);

    // Prompt & AI
    const [systemPrompt, setSystemPrompt] = useState(initialData?.systemPrompt || "");
    const [generatingPrompt, setGeneratingPrompt] = useState(false);
    const [kbHint, setKbHint] = useState("");

    // Engine LLM
    const [llmModel, setLlmModel] = useState(initialData?.llmModel || "gemini-2.0-flash");
    const [temperature, setTemperature] = useState(initialData?.temperature ?? 0.4);
    const [maxTokens, setMaxTokens] = useState(initialData?.maxTokens ?? 400);
    const [learningMode, setLearningMode] = useState(initialData?.learningMode || "MANUAL");

    // Voice & Persona
    const [voiceId, setVoiceId] = useState(initialData?.voiceId || "");
    const [stability, setStability] = useState(initialData?.stability ?? 0.5);
    const [similarityBoost, setSimilarityBoost] = useState(initialData?.similarityBoost ?? 0.75);
    const [accentRegion, setAccentRegion] = useState(initialData?.accentRegion || "");
    const [gender, setGender] = useState(initialData?.gender || "");

    // RAG & Knowledge
    const initKbIds = initialData?.knowledgeBases?.map((kb: any) => kb.id) || [];
    const [selectedKbIds, setSelectedKbIds] = useState<string[]>(initKbIds);
    const [strictRagMode, setStrictRagMode] = useState(initialData?.strictRagMode ?? false);

    // Multi-Specialization
    const initSkillIds = initialData?.agentSkills?.map((s: any) => s.id) || [];
    const initSpecIds = [...new Set(initialData?.agentSkills?.map((s: any) => s.specializationId) || [])] as string[];
    const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>(initSpecIds);
    const [selectedSkills, setSelectedSkills] = useState<string[]>(initSkillIds);

    // Human in the loop & Guardrails
    const [priorityAlpha, setPriorityAlpha] = useState(initialData?.priorityAlpha ?? true);
    const [humanTransferWebhook, setHumanTransferWebhook] = useState(initialData?.humanTransferWebhook || "");
    const [frustrationThreshold, setFrustrationThreshold] = useState(initialData?.frustrationThreshold ?? 0.8);
    const [suspensionDurationMinutes, setSuspensionDurationMinutes] = useState(initialData?.suspensionDurationMinutes ?? 30);
    const [enforceTempClamp, setEnforceTempClamp] = useState(initialData?.enforceTempClamp ?? false);
    const [enforceTokenLimit, setEnforceTokenLimit] = useState(initialData?.enforceTokenLimit ?? true);
    const [simulateLatency, setSimulateLatency] = useState(initialData?.simulateLatency ?? true);
    const [filterRoboticLists, setFilterRoboticLists] = useState(initialData?.filterRoboticLists ?? true);

    // Tools
    const initTools = initialData?.enabledTools || [];
    const [tools, setTools] = useState({
        read_crm_leads: initTools.includes("read_crm_leads"),
        update_deals: initTools.includes("update_deals"),
        create_crm_deal: initTools.includes("create_crm_deal"),
        qualify_and_score_lead: initTools.includes("qualify_and_score_lead"),
        send_email: initTools.includes("send_email"),
        transfer_to_human: initTools.includes("transfer_to_human"),
        create_support_ticket: initTools.includes("create_support_ticket"),
        check_calendar_availability: initTools.includes("check_calendar_availability"),
        create_calendar_event: initTools.includes("create_calendar_event"),
        enroll_in_sequence: initTools.includes("enroll_in_sequence"),
        web_search: initTools.includes("web_search"),
    });

    const activeToolsCount = Object.values(tools).filter(Boolean).length;

    const toggleKb = (id: string) => {
        setSelectedKbIds((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const insertToken = (token: string) => {
        setSystemPrompt((prev) => prev + token);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !systemPrompt.trim()) {
            toast.error("El nombre y el System Prompt son obligatorios");
            return;
        }
        setIsSubmitting(true);
        const tid = toast.loading("Guardando configuración del agente...");
        try {
            const enabledTools = Object.entries(tools).filter(([, v]) => v).map(([k]) => k);
            const result = await upsertAIAgent({
                id: initialData?.id,
                companyId, name, description, agentType, systemPrompt,
                llmModel, temperature, maxTokens, enabledTools, isActive, isInboxAgent,
                knowledgeBaseIds: selectedKbIds, strictRagMode, learningMode,
                humanTransferWebhook: humanTransferWebhook || undefined,
                suspensionDurationMinutes, priorityAlpha, frustrationThreshold,
                enforceTempClamp, enforceTokenLimit, simulateLatency, filterRoboticLists,
                voiceId, stability, similarityBoost, accentRegion, gender,
                skillIds: selectedSkills,
            });
            if (result.success) {
                toast.success(initialData ? "¡Agente Actualizado!" : "¡Agente creado exitosamente!", { id: tid });
                router.push("/dashboard/settings/agents");
                router.refresh();
            }
        } catch (err: any) {
            toast.error(err.message || "Error al guardar el agente", { id: tid });
        } finally {
            setIsSubmitting(false);
        }
    };

    const tabs = [
        { id: "identity", label: "Perfil & Motor", icon: Cpu, badge: llmModel.split("-")[0].toUpperCase() },
        { id: "prompt", label: "System Prompt & Voz", icon: Terminal, badge: systemPrompt ? "Definido" : "Pendiente" },
        { id: "knowledge", label: "Conocimiento & Skills", icon: Brain, badge: `${selectedKbIds.length} KB · ${selectedSkills.length} Skills` },
        { id: "tools", label: "Herramientas", icon: Blocks, badge: `${activeToolsCount} activas` },
        { id: "governance", label: "Gobernanza & HITL", icon: Shield, badge: priorityAlpha ? "HITL Activo" : "Standard" },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-16">
            {/* ── HEADER DE NAVEGACIÓN Y ACCIONES ────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl sticky top-2 z-20">
                <div>
                    <Link href="/dashboard/settings/agents" className="inline-flex items-center text-xs text-slate-400 hover:text-teal-400 mb-2 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        Volver a Central de Agentes
                    </Link>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
                            <Bot className="w-6 h-6" />
                        </div>
                        {initialData ? (name || "Editar Agente") : (name || "Nuevo Agente Cognitivo")}
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Configuración avanzada de razonamiento ReFRAG, variables CRM, voz y guardrails de seguridad.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isActive ? "bg-teal-950/60 border-teal-800 text-teal-300" : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}
                    >
                        {isActive ? "🟢 Agente Activo" : "⚪ Desactivado"}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-50 h-11 px-6 py-2 text-sm font-bold shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        {isSubmitting ? "Guardando..." : (initialData ? "Actualizar Agente" : "Guardar Agente")}
                    </button>
                </div>
            </div>

            {/* ── TABS NAVIGATION BAR ────────────────────────────────────── */}
            <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-900/60 border border-slate-800/80 rounded-xl no-scrollbar">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActiveTab = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                                isActiveTab
                                    ? "bg-slate-800 text-white shadow-md border border-slate-700/80 font-semibold"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${isActiveTab ? "text-teal-400" : "text-slate-500"}`} />
                            <span>{tab.label}</span>
                            {tab.badge && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                                    isActiveTab ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "bg-slate-800 text-slate-400"
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── LAYOUT PRINCIPAL (CONTENIDO + WIDGET RESUMEN VIVO) ──────── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* ── SECCIÓN CENTRAL PRINCIPAL DE PESTAÑAS (3 COLS) ───────── */}
                <div className="lg:col-span-3 space-y-6">

                    {/* 🟢 TAB 1: PERFIL & MOTOR LLM */}
                    {activeTab === "identity" && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                                    <Bot className="w-5 h-5 text-teal-400" />
                                    Identidad del Agente
                                </h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombre del Agente *</label>
                                        <input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Ej. Asistente Comercial Enterprise"
                                            className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rol / Tipo de Agente</label>
                                        <select
                                            value={agentType}
                                            onChange={e => setAgentType(e.target.value)}
                                            className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                        >
                                            <option value="SUPPORT">Soporte Técnico y Atención</option>
                                            <option value="SALES">Ventas, Cierre y Prospectación</option>
                                            <option value="CUSTOM">Especializado / Personalizado</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Descripción de Propósito</label>
                                    <input
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Encargado de calificar leads entrantes de WhatsApp y coordinar citas de ventas..."
                                        className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                    />
                                </div>

                                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                                    <ToggleRow
                                        label="Agente Activo en Producción"
                                        hint="Determina si el agente responderá chats, workflows y eventos en tiempo real."
                                        value={isActive}
                                        onChange={setIsActive}
                                    />
                                    <ToggleRow
                                        label="Respuesta Autónoma Omnicanal (Inbox Copilot)"
                                        hint="Al activarse, este agente atenderá de forma principal los canales de entrada (WhatsApp, Web, Meta)."
                                        value={isInboxAgent}
                                        onChange={setIsInboxAgent}
                                    />
                                </div>
                            </div>

                            {/* Motor Cognitivo LLM */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                                    <Cpu className="w-5 h-5 text-purple-400" />
                                    Motor Cognitivo & Parámetros LLM
                                </h3>

                                <ModelSelectorPanel value={llmModel} onChange={setLlmModel} />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-xs font-semibold text-slate-300">Temperatura (Creatividad)</label>
                                            <span className="text-xs font-mono text-teal-400 font-bold px-2 py-0.5 bg-teal-950 rounded border border-teal-800">
                                                {temperature.toFixed(2)}
                                            </span>
                                        </div>
                                        <input
                                            type="range" min="0" max="2" step="0.05" value={temperature}
                                            onChange={e => setTemperature(parseFloat(e.target.value))}
                                            className="w-full accent-teal-500 h-2 rounded-lg cursor-pointer bg-slate-800"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-medium">
                                            <span>0.0 Strict & Lógico</span>
                                            <span>1.0 Equilibrado</span>
                                            <span>2.0 Creativo</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Límite de Tokens por Respuesta</label>
                                        <input
                                            type="number" value={maxTokens} min={50} max={4000}
                                            onChange={e => setMaxTokens(parseInt(e.target.value))}
                                            className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                        />
                                        <p className="text-[11px] text-slate-500 mt-1">Límite recomendado: 300 - 800 tokens para respuestas concisas en chat.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 🟣 TAB 2: SYSTEM PROMPT & VOZ */}
                    {activeTab === "prompt" && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <Terminal className="w-5 h-5 text-purple-400" />
                                        System Prompt (Cerebro del Agente)
                                    </h3>

                                    <button
                                        type="button"
                                        disabled={generatingPrompt}
                                        onClick={async () => {
                                            if (!name.trim()) return toast.error("Escribe el nombre del agente primero");
                                            setGeneratingPrompt(true);
                                            try {
                                                const result = await generateSystemPromptWithAI({ agentType, name, description });
                                                setSystemPrompt(result.systemPrompt);
                                                setKbHint(result.usedKBChunks > 0
                                                    ? `✅ Usando ${result.usedKBChunks} fragmentos RAG de la Base de Conocimiento`
                                                    : `✅ Prompt profesional generado con IA`);
                                                toast.success("System Prompt estructurado correctamente");
                                            } catch (e: any) {
                                                toast.error(e.message || "Error al generar prompt");
                                            } finally {
                                                setGeneratingPrompt(false);
                                            }
                                        }}
                                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-300 text-xs font-bold hover:bg-purple-900 disabled:opacity-50 transition-all cursor-pointer"
                                    >
                                        {generatingPrompt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        <span>Generar Prompt con IA</span>
                                    </button>
                                </div>

                                {kbHint && <p className="text-xs text-teal-400 font-medium">{kbHint}</p>}

                                {/* Variables dinámicas CRM */}
                                <div>
                                    <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5 font-medium">
                                        <Zap className="w-3.5 h-3.5 text-teal-400" />
                                        <span>Variables del CRM (Click para insertar):</span>
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {CRM_TOKENS.map(t => (
                                            <button
                                                key={t.token}
                                                type="button"
                                                onClick={() => insertToken(t.token)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-teal-950/70 text-teal-300 border border-teal-800/60 hover:bg-teal-900 transition-colors"
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <textarea
                                    value={systemPrompt}
                                    onChange={e => setSystemPrompt(e.target.value)}
                                    placeholder="Eres un agente de ventas de LegacyMark. Dirígete a {{contact.first_name}} de forma profesional..."
                                    className="w-full min-h-[320px] rounded-xl border border-slate-700 bg-[#0b0d14] px-4 py-3.5 text-sm text-teal-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-mono leading-relaxed resize-y"
                                />
                            </div>

                            {/* Voz y Personalidad (ElevenLabs) */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                                    <Mic className="w-5 h-5 text-pink-400" />
                                    Sintetización de Voz & Persona (ElevenLabs)
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Voice ID (ElevenLabs)</label>
                                        <input
                                            value={voiceId} onChange={e => setVoiceId(e.target.value)}
                                            placeholder="pNInz6obpgDQGcFmaJcg"
                                            className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Género</label>
                                        <select
                                            value={gender} onChange={e => setGender(e.target.value)}
                                            className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                        >
                                            <option value="">Neutro / Por Defecto</option>
                                            <option value="FEMALE">Femenino</option>
                                            <option value="MALE">Masculino</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Región / Acento</label>
                                        <select
                                            value={accentRegion} onChange={e => setAccentRegion(e.target.value)}
                                            className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                        >
                                            <option value="">Neutro / Automático</option>
                                            <option value="es-CO">Colombia</option>
                                            <option value="es-MX">México</option>
                                            <option value="es-ES">España</option>
                                            <option value="es-AR">Argentina</option>
                                            <option value="es-US">EE.UU. (Español)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-xs font-semibold text-slate-300">Estabilidad (Stability)</label>
                                            <span className="text-xs font-mono text-pink-400 font-bold">{stability.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="1" step="0.05" value={stability}
                                            onChange={e => setStability(parseFloat(e.target.value))}
                                            className="w-full accent-pink-500 h-2 rounded-lg cursor-pointer bg-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-xs font-semibold text-slate-300">Claridad (Similarity Boost)</label>
                                            <span className="text-xs font-mono text-pink-400 font-bold">{similarityBoost.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="1" step="0.05" value={similarityBoost}
                                            onChange={e => setSimilarityBoost(parseFloat(e.target.value))}
                                            className="w-full accent-pink-500 h-2 rounded-lg cursor-pointer bg-slate-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 🔵 TAB 3: CONOCIMIENTO RAG & SKILLS */}
                    {activeTab === "knowledge" && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* RAG Knowledge Base */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <Database className="w-5 h-5 text-blue-400" />
                                        Bases de Conocimiento (RAG ReFRAG)
                                    </h3>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button type="button" className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950 border border-teal-800">
                                                <Plus className="w-3.5 h-3.5" />
                                                Administrar Bases de Conocimiento
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-950 border-slate-800 p-6">
                                            <DialogHeader>
                                                <DialogTitle>Administrar Bases de Conocimiento</DialogTitle>
                                                <DialogDescription>Crea o edita documentos y fuentes de conocimiento RAG.</DialogDescription>
                                            </DialogHeader>
                                            <KnowledgeBaseManager companyId={companyId} initialData={knowledgeBases as any} isModal={true} />
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {knowledgeBases.length === 0 ? (
                                    <div className="text-center p-8 rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
                                        <Brain className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">No hay bases de conocimiento creadas aún.</p>
                                        <Link href="/dashboard/settings/agents/knowledge" className="text-xs text-teal-400 hover:underline mt-2 inline-block font-semibold">
                                            + Crear Nueva Base de Conocimiento
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {knowledgeBases.map(kb => {
                                            const isSelected = selectedKbIds.includes(kb.id);
                                            return (
                                                <div
                                                    key={kb.id}
                                                    onClick={() => toggleKb(kb.id)}
                                                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                                        isSelected
                                                            ? "bg-blue-950/40 border-blue-500/60 shadow-[0_0_12px_-3px_rgba(59,130,246,0.3)]"
                                                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                                                    }`}
                                                >
                                                    <span className="text-xs font-semibold text-slate-200">{kb.name}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {}}
                                                        className="h-4 w-4 rounded border-slate-700 accent-blue-500 cursor-pointer"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <ToggleRow
                                    label="Modo RAG Estricto (Sin Alucinaciones)"
                                    hint="Si la respuesta no se encuentra en las Bases de Conocimiento, el agente escalará directamente a un humano."
                                    value={strictRagMode}
                                    onChange={setStrictRagMode}
                                />
                            </div>

                            {/* Especializaciones y Habilidades */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <Brain className="w-5 h-5 text-teal-400" />
                                        Framework de Especializaciones y Habilidades
                                    </h3>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button type="button" variant="outline" size="sm" className="border-slate-700 text-xs">
                                                <Database className="w-3.5 h-3.5 mr-1.5" />
                                                Biblioteca de Skills
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-950 border-slate-800">
                                            <DialogHeader>
                                                <DialogTitle>Biblioteca de Habilidades Profesionales</DialogTitle>
                                                <DialogDescription>Importa habilidades predefinidas creadas para distintas especializaciones.</DialogDescription>
                                            </DialogHeader>
                                            <SkillTemplatesLibrary
                                                companyId={companyId}
                                                onImportSuccess={(skill) => {
                                                    setSelectedSkills(prev => [...prev, skill.id]);
                                                    toast.success(`Habilidad "${skill.name}" vinculada`);
                                                }}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <AgentSpecializations
                                    companyId={companyId}
                                    selectedSpecializations={selectedSpecializations}
                                    onSpecializationsChange={setSelectedSpecializations}
                                />

                                {selectedSpecializations.length > 0 && (
                                    <div className="pt-4 border-t border-slate-800">
                                        <AgentSkillsManager
                                            companyId={companyId}
                                            selectedSpecializations={selectedSpecializations}
                                            selectedSkills={selectedSkills}
                                            onSkillsChange={setSelectedSkills}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 🟠 TAB 4: HERRAMIENTAS & CAPACIDADES */}
                    {activeTab === "tools" && (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
                            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                                <Blocks className="w-5 h-5 text-amber-400" />
                                Herramientas Habilitadas para Ejecución de Tareas
                            </h3>

                            {/* 📊 CRM */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-1.5">
                                    📊 Módulo CRM & Gestor de Negocios
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <ToggleRow label="Leer Leads CRM" hint="Consulta la ficha técnica del cliente" value={tools.read_crm_leads} onChange={v => setTools(p => ({ ...p, read_crm_leads: v }))} />
                                    <ToggleRow label="Actualizar Negocios" hint="Avanza etapas en el pipeline de ventas" value={tools.update_deals} onChange={v => setTools(p => ({ ...p, update_deals: v }))} />
                                    <ToggleRow label="Crear Trato Comercial" hint="Abre nuevas oportunidades en el CRM" value={tools.create_crm_deal} onChange={v => setTools(p => ({ ...p, create_crm_deal: v }))} />
                                    <ToggleRow label="Scoring de Leads" hint="Asigna puntaje según respuestas" value={tools.qualify_and_score_lead} onChange={v => setTools(p => ({ ...p, qualify_and_score_lead: v }))} />
                                </div>
                            </div>

                            {/* ✉️ Inbox y Soporte */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-1.5">
                                    ✉️ Módulo Soporte & Comunicaciones
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <ToggleRow label="Enviar Correos" hint="Dispara emails institucionales" value={tools.send_email} onChange={v => setTools(p => ({ ...p, send_email: v }))} />
                                    <ToggleRow label="Transferencia Humana" hint="Pausa el bot y alerta al equipo" value={tools.transfer_to_human} onChange={v => setTools(p => ({ ...p, transfer_to_human: v }))} />
                                    <ToggleRow label="Crear Ticket de Soporte" hint="Registra una incidencia en el tablero" value={tools.create_support_ticket} onChange={v => setTools(p => ({ ...p, create_support_ticket: v }))} />
                                </div>
                            </div>

                            {/* 📅 Agenda */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-1.5">
                                    📅 Módulo Agenda & Citas
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <ToggleRow label="Consultar Disponibilidad" hint="Revisa huecos libres en el calendario" value={tools.check_calendar_availability} onChange={v => setTools(p => ({ ...p, check_calendar_availability: v }))} />
                                    <ToggleRow label="Agendar Cita Oficial" hint="Registra la reunión y envía invitación" value={tools.create_calendar_event} onChange={v => setTools(p => ({ ...p, create_calendar_event: v }))} />
                                </div>
                            </div>

                            {/* 🚀 Automations & Web */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-1.5">
                                    🚀 Automatización & Búsqueda Web
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <ToggleRow label="Inscribir en Secuencia Email" hint="Suma el lead a secuencias de drip" value={tools.enroll_in_sequence} onChange={v => setTools(p => ({ ...p, enroll_in_sequence: v }))} />
                                    <ToggleRow label="Búsqueda Web en Vivo" hint="Accede a información pública de internet" value={tools.web_search} onChange={v => setTools(p => ({ ...p, web_search: v }))} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 🛡️ TAB 5: GOBERNANZA, GUARDRAILS & HITL */}
                    {activeTab === "governance" && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Human-in-the-Loop */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                                    <UserCheck className="w-5 h-5 text-orange-400" />
                                    Control Humano (Human-in-the-Loop)
                                </h3>

                                <div className="space-y-4">
                                    <ToggleRow
                                        label="Prioridad Alfa (Intervención Humana Inmediata)"
                                        hint="Si un operador escribe manualmente en el chat, el agente se silencia automáticamente."
                                        value={priorityAlpha}
                                        onChange={setPriorityAlpha}
                                    />

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Webhook de Alertas / Escalación</label>
                                        <input
                                            value={humanTransferWebhook}
                                            onChange={e => setHumanTransferWebhook(e.target.value)}
                                            placeholder="https://hooks.slack.com/services/..."
                                            className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="text-xs font-semibold text-slate-300">Umbral de Frustración</label>
                                                <span className="text-xs font-mono text-orange-400 font-bold">{frustrationThreshold.toFixed(1)}</span>
                                            </div>
                                            <input
                                                type="range" min="0.3" max="1" step="0.1" value={frustrationThreshold}
                                                onChange={e => setFrustrationThreshold(parseFloat(e.target.value))}
                                                className="w-full accent-orange-500 h-2 rounded-lg cursor-pointer bg-slate-800"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="text-xs font-semibold text-slate-300">Duración de Suspensión Bot</label>
                                                <span className="text-xs font-mono text-orange-400 font-bold">{suspensionDurationMinutes} min</span>
                                            </div>
                                            <input
                                                type="range" min="5" max="120" step="5" value={suspensionDurationMinutes}
                                                onChange={e => setSuspensionDurationMinutes(parseInt(e.target.value))}
                                                className="w-full accent-orange-500 h-2 rounded-lg cursor-pointer bg-slate-800"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Guardrails y Aprendizaje */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
                                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                                    <Shield className="w-5 h-5 text-red-400" />
                                    Guardrails de Seguridad & Mimetismo Humano
                                </h3>

                                <div className="space-y-3">
                                    <ToggleRow label="Temperatura Dinámica Estricta (0.2 - 0.5)" hint="Asegura respuestas lógicas y predecibles en atención." value={enforceTempClamp} onChange={setEnforceTempClamp} />
                                    <ToggleRow label="Límite Estricto de Tokens (Max 400)" hint="Evita bloques extensos de texto y reduce consumo." value={enforceTokenLimit} onChange={setEnforceTokenLimit} />
                                    <ToggleRow label="Simulación de Latencia de Escritura" hint="Escribe con velocidad humana para mayor naturalidad." value={simulateLatency} onChange={setSimulateLatency} />
                                    <ToggleRow label="Filtro Anti-Listas Robóticas" hint="Sustituye listas estructuradas por párrafos conversacionales." value={filterRoboticLists} onChange={setFilterRoboticLists} />
                                </div>

                                <div className="pt-4 border-t border-slate-800">
                                    <label className="block text-xs font-semibold text-slate-300 mb-2">Modo de Aprendizaje Continuo (Memoria Reflexiva)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: "OFF", label: "Desactivado", hint: "Sin memoria de retroalimentación" },
                                            { value: "MANUAL", label: "Manual", hint: "Aprende por intervención explícita" },
                                            { value: "AUTONOMOUS", label: "Autónomo", hint: "Reflexiona tras cerrar conversaciones" },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setLearningMode(opt.value)}
                                                className={`p-3 rounded-xl border text-center transition-all ${
                                                    learningMode === opt.value
                                                        ? "border-teal-500 bg-teal-950/40 text-teal-300"
                                                        : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700"
                                                }`}
                                            >
                                                <p className="text-xs font-bold">{opt.label}</p>
                                                <p className="text-[10px] opacity-75 mt-0.5">{opt.hint}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── SECCIÓN DERECHA: TARJETA DE RESUMEN EN VIVO (1 COL) ────── */}
                <div className="space-y-6">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 sticky top-28 shadow-xl">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2.5">
                            <Eye className="w-4 h-4 text-teal-400" />
                            Vista Previa de Configuración
                        </h4>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">{name || "Sin nombre"}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{agentType}</p>
                            </div>
                        </div>

                        <div className="space-y-2.5 text-xs text-slate-300">
                            <div className="flex justify-between py-1 border-b border-slate-800/60">
                                <span className="text-slate-400">Estado:</span>
                                <span className={isActive ? "text-teal-400 font-bold" : "text-slate-500 font-bold"}>
                                    {isActive ? "Activo" : "Inactivo"}
                                </span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-slate-800/60">
                                <span className="text-slate-400">Modelo LLM:</span>
                                <span className="font-mono text-purple-300 font-medium truncate max-w-[140px]">{llmModel}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-slate-800/60">
                                <span className="text-slate-400">Temperatura:</span>
                                <span className="font-mono text-teal-400 font-medium">{temperature.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-slate-800/60">
                                <span className="text-slate-400">Herramientas:</span>
                                <span className="font-mono text-amber-400 font-bold">{activeToolsCount} activas</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-slate-800/60">
                                <span className="text-slate-400">Bases RAG:</span>
                                <span className="font-mono text-blue-400 font-bold">{selectedKbIds.length} vinculadas</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-slate-800/60">
                                <span className="text-slate-400">Voz ElevenLabs:</span>
                                <span className="font-mono text-pink-400 font-medium truncate max-w-[120px]">
                                    {voiceId ? "Configurada" : "No asignada"}
                                </span>
                            </div>

                            <div className="flex justify-between py-1">
                                <span className="text-slate-400">Control Humano:</span>
                                <span className="font-mono text-orange-400 font-medium">{priorityAlpha ? "Prioridad Alfa" : "Off"}</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 disabled:opacity-50 h-10 text-xs font-bold transition-all cursor-pointer shadow-md shadow-teal-500/10"
                            >
                                <Save className="w-3.5 h-3.5" />
                                {isSubmitting ? "Guardando..." : (initialData ? "Actualizar Agente" : "Guardar Agente")}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </form>
    );
}
