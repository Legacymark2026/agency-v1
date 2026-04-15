"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertAIAgent } from "@/actions/ai-agents";
import {
    Bot, Save, ArrowLeft, Terminal, Cpu, Database, Blocks, Plus,
    UserCheck, Brain, Shield, Zap, AlertTriangle, ChevronDown, ChevronUp, Info, Mic
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { KnowledgeBaseManager } from "@/components/settings/knowledge-base-manager";

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

// ── Collapsible Section ──────────────────────────────────────────────────────
function Section({ icon: Icon, title, color = "text-slate-400", children }: {
    icon: any; title: string; color?: string; children: React.ReactNode
}) {
    const [open, setOpen] = useState(true);
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors"
            >
                <span className="flex items-center gap-2 font-medium text-white">
                    <Icon className={`w-5 h-5 ${color}`} />
                    {title}
                </span>
                {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
        </div>
    );
}

// ── Toggle Row ───────────────────────────────────────────────────────────────
function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-start justify-between gap-4 py-1">
            <div>
                <p className="text-sm font-medium text-slate-300">{label}</p>
                {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
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

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
    companyId: string;
    knowledgeBases?: { id: string; name: string }[];
    initialData?: any; // The whole AIAgent object including knowledgeBases if editing
}

export function AgentBuilderForm({ companyId, knowledgeBases = [], initialData }: Props) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Identity
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [agentType, setAgentType] = useState(initialData?.agentType || "CUSTOM");
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

    // ── System Prompt
    const [systemPrompt, setSystemPrompt] = useState(initialData?.systemPrompt || "");
    const promptRef = useState<HTMLTextAreaElement | null>(null);

    // ── Engine
    const [llmModel, setLlmModel] = useState(initialData?.llmModel || "gemini-2.0-flash");
    const [temperature, setTemperature] = useState(initialData?.temperature ?? 0.4);
    const [maxTokens, setMaxTokens] = useState(initialData?.maxTokens ?? 400);

    // ── Tools
    // Note: enabledTools is a string array in db, but form uses an object
    const initTools = initialData?.enabledTools || [];
    const [tools, setTools] = useState({
        // CRM & Ventas
        read_crm_leads: initTools.includes("read_crm_leads"),
        update_deals: initTools.includes("update_deals"),
        create_crm_deal: initTools.includes("create_crm_deal"),
        qualify_and_score_lead: initTools.includes("qualify_and_score_lead"),
        // Comunicaciones & Inbox
        send_email: initTools.includes("send_email"),
        transfer_to_human: initTools.includes("transfer_to_human"),
        create_support_ticket: initTools.includes("create_support_ticket"),
        // Agenda & Eventos
        check_calendar_availability: initTools.includes("check_calendar_availability"),
        create_calendar_event: initTools.includes("create_calendar_event"),
        // Marketing Automations
        enroll_in_sequence: initTools.includes("enroll_in_sequence"),
        // General
        web_search: initTools.includes("web_search"),
    });

    // ── RAG
    const initKbIds = initialData?.knowledgeBases?.map((kb: any) => kb.id) || [];
    const [selectedKbIds, setSelectedKbIds] = useState<string[]>(initKbIds);
    const [strictRagMode, setStrictRagMode] = useState(initialData?.strictRagMode ?? false);

    // ── Human-in-the-Loop
    const [humanTransferWebhook, setHumanTransferWebhook] = useState(initialData?.humanTransferWebhook || "");
    const [suspensionDurationMinutes, setSuspensionDurationMinutes] = useState(initialData?.suspensionDurationMinutes ?? 30);
    const [priorityAlpha, setPriorityAlpha] = useState(initialData?.priorityAlpha ?? true);
    const [frustrationThreshold, setFrustrationThreshold] = useState(initialData?.frustrationThreshold ?? 0.8);

    // ── Guardrails
    const [enforceTempClamp, setEnforceTempClamp] = useState(initialData?.enforceTempClamp ?? false);
    const [enforceTokenLimit, setEnforceTokenLimit] = useState(initialData?.enforceTokenLimit ?? true);

    // ── Mimicry
    const [simulateLatency, setSimulateLatency] = useState(initialData?.simulateLatency ?? true);
    const [filterRoboticLists, setFilterRoboticLists] = useState(initialData?.filterRoboticLists ?? true);

    // ── Voice & Persona
    const [voiceId, setVoiceId] = useState(initialData?.voiceId || "");
    const [stability, setStability] = useState(initialData?.stability ?? 0.5);
    const [similarityBoost, setSimilarityBoost] = useState(initialData?.similarityBoost ?? 0.75);
    const [accentRegion, setAccentRegion] = useState(initialData?.accentRegion || "");
    const [gender, setGender] = useState(initialData?.gender || "");

    const insertToken = (token: string) => {
        setSystemPrompt((prev: string) => prev + token);
    };

    const [isInboxAgent, setIsInboxAgent] = useState(initialData?.isInboxAgent ?? false);

    const toggleKb = (id: string) => {
        setSelectedKbIds((prev: string[]) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !systemPrompt.trim()) {
            toast.error("El nombre y el System Prompt son obligatorios");
            return;
        }
        setIsSubmitting(true);
        const tid = toast.loading("Creando agente Ultra-Pro...");
        try {
            const enabledTools = Object.entries(tools).filter(([, v]) => v).map(([k]) => k);
            const result = await upsertAIAgent({
                id: initialData?.id, // ID is present if editing
                companyId, name, description, agentType, systemPrompt,
                llmModel, temperature, maxTokens, enabledTools, isActive, isInboxAgent,
                knowledgeBaseIds: selectedKbIds, strictRagMode,
                humanTransferWebhook: humanTransferWebhook || undefined,
                suspensionDurationMinutes, priorityAlpha, frustrationThreshold,
                enforceTempClamp, enforceTokenLimit, simulateLatency, filterRoboticLists,
                voiceId, stability, similarityBoost, accentRegion, gender,
            });
            if (result.success) {
                toast.success(initialData ? "¡Agente Actualizado!" : "¡Agente Ultra-Pro creado!", { id: tid });
                router.push("/dashboard/settings/agents");
                router.refresh();
            }
        } catch (err: any) {
            toast.error(err.message || "Error desconocido", { id: tid });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <Link href="/dashboard/settings/agents" className="flex items-center text-sm text-slate-400 hover:text-white mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver a Central de Agentes
                    </Link>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bot className="w-6 h-6 text-teal-400" />
                        {initialData ? "Editar Agente Ultra-Pro" : "Nuevo Agente Ultra-Pro"}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Motor cognitivo con RAG, CRM variables, Human-in-the-Loop y guardrails.</p>
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-md bg-teal-500 text-slate-950 hover:bg-teal-400 disabled:opacity-50 h-10 px-6 py-2 text-sm font-semibold transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Guardando..." : (initialData ? "Actualizar Agente" : "Guardar Agente")}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── LEFT COLUMN ─────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Identity */}
                    <Section icon={Bot} title="Identidad del Agente">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre *</label>
                                <input value={name} onChange={e => setName(e.target.value)}
                                    placeholder="Ej. Soporte Técnico Nivel 1"
                                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Agente</label>
                                <select value={agentType} onChange={e => setAgentType(e.target.value)}
                                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500">
                                    <option value="SUPPORT">Soporte / Atención</option>
                                    <option value="SALES">Ventas / Cierre</option>
                                    <option value="CUSTOM">Personalizado</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Descripción corta</label>
                            <input value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="Agente para pre-calificar leads entrantes..."
                                className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </div>
                        <ToggleRow label="Agente Activo" hint="Si está desactivado no procesará tareas ni bots." value={isActive} onChange={setIsActive} />
                        <div className="pt-4 border-t border-slate-800">
                            <ToggleRow 
                                label="Respuestas Omnicanal (Inbox Copilot)" 
                                hint="Si se activa, este Agente será el único responsable de auto-contestar mensajes en Meta, WhatsApp, Web, etc." 
                                value={isInboxAgent} 
                                onChange={setIsInboxAgent} 
                                color="bg-blue-500"
                            />
                        </div>
                    </Section>

                    {/* System Prompt with CRM Token Helper */}
                    <Section icon={Terminal} title="System Prompt (Brain del Agente)" color="text-purple-400">
                        {/* CRM Token chips */}
                        <div>
                            <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-teal-400" />
                                <span>Inserta variables del CRM en tu prompt con un clic:</span>
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {CRM_TOKENS.map(t => (
                                    <button
                                        key={t.token}
                                        type="button"
                                        onClick={() => insertToken(t.token)}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono bg-teal-950 text-teal-300 border border-teal-800 hover:bg-teal-900 transition-colors"
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <textarea
                            value={systemPrompt}
                            onChange={e => setSystemPrompt(e.target.value)}
                            placeholder={`Eres un especialista en ventas de LegacyMark. Habla con {{contact.first_name}} como si lo conocieras. Su último contacto fue {{last_interaction_date}}...`}
                            className="w-full min-h-[260px] rounded-md border border-slate-700 bg-[#0f111a] px-4 py-3 text-sm text-teal-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono resize-y"
                        />
                    </Section>

                    {/* RAG — Knowledge Base */}
                    <Section icon={Database} title="Base de Conocimiento (RAG)" color="text-blue-400">
                        {knowledgeBases.length === 0 ? (
                            <div className="text-center p-6 rounded-lg border border-dashed border-slate-700">
                                <Brain className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">No hay bases de conocimiento. Crea una primero en la pestaña de Conocimiento.</p>
                                <Link href="/dashboard/settings/agents/knowledge" className="text-xs text-teal-400 hover:underline mt-1 inline-block">
                                    + Crear Base de Conocimiento
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {knowledgeBases.map(kb => (
                                    <label key={kb.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedKbIds.includes(kb.id)}
                                            onChange={() => toggleKb(kb.id)}
                                            className="h-4 w-4 rounded border-slate-700 accent-teal-500"
                                        />
                                        <span className="text-sm text-slate-300">{kb.name}</span>
                                    </label>
                                ))}
                                <div className="mt-4 pt-4 border-t border-slate-800">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button type="button" className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1">
                                                <Plus className="w-4 h-4" />
                                                Administrar Bases de Conocimiento (CRUD)
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-950 border-slate-800 p-6">
                                            <KnowledgeBaseManager 
                                                companyId={companyId} 
                                                initialData={knowledgeBases as any} 
                                                isModal={true} 
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        )}
                        <ToggleRow
                            label="Modo RAG Estricto"
                            hint="El agente NO puede responder fuera del contexto de los documentos. Si no sabe, escala."
                            value={strictRagMode} onChange={setStrictRagMode}
                        />
                    </Section>

                    {/* Human-in-the-Loop */}
                    <Section icon={UserCheck} title="Control Humano (Human-in-the-Loop)" color="text-orange-400">
                        <ToggleRow
                            label="Prioridad Alfa"
                            hint="Si un humano (Admin/Agente) escribe, el motor se suspende automáticamente."
                            value={priorityAlpha} onChange={setPriorityAlpha}
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Webhook de Notificación</label>
                            <input
                                value={humanTransferWebhook} onChange={e => setHumanTransferWebhook(e.target.value)}
                                placeholder="https://hooks.slack.com/services/..."
                                className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Se llamará cuando haya alta frustración o intervención humana.</p>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-slate-300">Umbral de Frustración</label>
                                <span className="text-xs text-orange-400 font-mono">{frustrationThreshold.toFixed(1)}</span>
                            </div>
                            <input type="range" min="0.3" max="1" step="0.1" value={frustrationThreshold}
                                onChange={e => setFrustrationThreshold(parseFloat(e.target.value))}
                                className="w-full accent-orange-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700" />
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                <span>Sensible (0.3)</span>
                                <span>Tolerante (1.0)</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-slate-300">Tiempo de Suspensión</label>
                                <span className="text-xs text-orange-400 font-mono">{suspensionDurationMinutes} min</span>
                            </div>
                            <input type="range" min="5" max="120" step="5" value={suspensionDurationMinutes}
                                onChange={e => setSuspensionDurationMinutes(parseInt(e.target.value))}
                                className="w-full accent-orange-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700" />
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                <span>5 min</span>
                                <span>2 horas</span>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* ── RIGHT COLUMN ──────────────────────────────────────── */}
                <div className="space-y-6">

                    {/* Cognitive Engine */}
                    <Section icon={Cpu} title="Motor Cognitivo">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Modelo de Lenguaje</label>
                            <select value={llmModel} onChange={e => setLlmModel(e.target.value)}
                                className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500">
                                <optgroup label="Google (Recomendado)">
                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash ⚡ Rápido</option>
                                    <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite 💰 Económico</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro 🧠 Potente</option>
                                </optgroup>
                                <optgroup label="Anthropic">
                                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                                </optgroup>
                                <optgroup label="OpenAI">
                                    <option value="gpt-4o">GPT-4o</option>
                                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-slate-300">Temperatura</label>
                                <span className="text-xs text-teal-400 font-mono">{temperature.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0" max="2" step="0.05" value={temperature}
                                onChange={e => setTemperature(parseFloat(e.target.value))}
                                className="w-full accent-teal-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700" />
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                <span>Preciso/Lógico</span>
                                <span>Creativo</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Max Tokens (Respuesta)</label>
                            <input type="number" value={maxTokens} min={50} max={4000}
                                onChange={e => setMaxTokens(parseInt(e.target.value))}
                                className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </div>
                    </Section>

                    {/* Voice & Persona */}
                    <Section icon={Mic} title="Voz y Personalidad (ElevenLabs)" color="text-pink-400">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">ID de Voz (ElevenLabs)</label>
                            <input value={voiceId} onChange={e => setVoiceId(e.target.value)}
                                placeholder="Ej. pNInz6obpgDQGcFmaJcg"
                                className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Género</label>
                                <select value={gender} onChange={e => setGender(e.target.value)}
                                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500">
                                    <option value="">(No definido)</option>
                                    <option value="FEMALE">Femenino</option>
                                    <option value="MALE">Masculino</option>
                                    <option value="NEUTRAL">Neutro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Acento / Región</label>
                                <select value={accentRegion} onChange={e => setAccentRegion(e.target.value)}
                                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500">
                                    <option value="">(Neutro / Automático)</option>
                                    <option value="es-CO">Colombia</option>
                                    <option value="es-ES">España</option>
                                    <option value="es-MX">México</option>
                                    <option value="es-AR">Argentina</option>
                                    <option value="es-CL">Chile</option>
                                    <option value="es-US">Estados Unidos (Latino)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-slate-300">Estabilidad (Stability)</label>
                                <span className="text-xs text-pink-400 font-mono">{stability.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.05" value={stability}
                                onChange={e => setStability(parseFloat(e.target.value))}
                                className="w-full accent-pink-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700" />
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                <span>Expresiva</span>
                                <span>Monótona</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-slate-300">Claridad (Similarity Boost)</label>
                                <span className="text-xs text-pink-400 font-mono">{similarityBoost.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.05" value={similarityBoost}
                                onChange={e => setSimilarityBoost(parseFloat(e.target.value))}
                                className="w-full accent-pink-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-700" />
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                <span>Baja</span>
                                <span>Alta</span>
                            </div>
                        </div>
                    </Section>

                    {/* Guardrails */}
                    <Section icon={Shield} title="Guardrails de Seguridad" color="text-red-400">
                        <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/30 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-300">Los guardrails fuerzan límites técnicos para agentes de producción.</p>
                        </div>
                        <ToggleRow
                            label="Temperatura Dinámica (0.2–0.5)"
                            hint="Fuerza consistencia lógica para agentes SUPPORT/SALES"
                            value={enforceTempClamp} onChange={setEnforceTempClamp}
                        />
                        <ToggleRow
                            label="Límite de Tokens Estricto (400 max)"
                            hint="Previene respuestas largas y costos innecesarios"
                            value={enforceTokenLimit} onChange={setEnforceTokenLimit}
                        />
                    </Section>

                    {/* Human Mimicry */}
                    <Section icon={Zap} title="Mimetismo Humano" color="text-yellow-400">
                        <ToggleRow
                            label="Simular Latencia de Escritura"
                            hint="Añade un delay proporcional al texto para parecer humano"
                            value={simulateLatency} onChange={setSimulateLatency}
                        />
                        <ToggleRow
                            label="Filtro Anti-Listas Robóticas"
                            hint='Convierte listas de 5+ puntos en párrafos. Elimina "Como IA..."'
                            value={filterRoboticLists} onChange={setFilterRoboticLists}
                        />
                    </Section>

                    {/* Tools Modularizados */}
                    <Section icon={Blocks} title="Permisos y Herramientas (Por Módulos)">
                        {/* 📊 Módulo CRM y Ventas */}
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1 flex items-center gap-2">
                                📊 CRM y Ventas
                            </h4>
                            <div className="space-y-1">
                                <ToggleRow label="Leer CRM Leads" hint="Consulta el perfil del lead en tiempo real" value={tools.read_crm_leads} onChange={v => setTools(p => ({ ...p, read_crm_leads: v }))} />
                                <ToggleRow label="Modificar Negocios" hint="Mueve deals de etapa en el pipeline" value={tools.update_deals} onChange={v => setTools(p => ({ ...p, update_deals: v }))} />
                                <ToggleRow label="Crear Nuevo Trato (Deal)" hint="Permite al agente abrir una nueva oportunidad de venta" value={tools.create_crm_deal} onChange={v => setTools(p => ({ ...p, create_crm_deal: v }))} />
                                <ToggleRow label="Calificar Lead (Scoring)" hint="Aumenta o reduce el puntaje de ventas del contacto" value={tools.qualify_and_score_lead} onChange={v => setTools(p => ({ ...p, qualify_and_score_lead: v }))} />
                            </div>
                        </div>

                        {/* ✉️ Módulo Inbox, Soporte y Comunicaciones */}
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1 flex items-center gap-2">
                                ✉️ Soporte e Inbox
                            </h4>
                            <div className="space-y-1">
                                <ToggleRow label="Enviar Correos" hint="Envía plantillas de correo electrónico al lead" value={tools.send_email} onChange={v => setTools(p => ({ ...p, send_email: v }))} />
                                <ToggleRow label="Transferir a Humano" hint="Delega la conversación alertando a equipo de soporte" value={tools.transfer_to_human} onChange={v => setTools(p => ({ ...p, transfer_to_human: v }))} />
                                <ToggleRow label="Crear Ticket de Soporte (Kanban)" hint="Genera una tarea oficial de soporte técnico" value={tools.create_support_ticket} onChange={v => setTools(p => ({ ...p, create_support_ticket: v }))} />
                            </div>
                        </div>

                        {/* 📅 Módulo Agenda */}
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1 flex items-center gap-2">
                                📅 Agenda y Eventos
                            </h4>
                            <div className="space-y-1">
                                <ToggleRow label="Consultar Disponibilidad" hint="Lee el calendario para buscar huecos libres" value={tools.check_calendar_availability} onChange={v => setTools(p => ({ ...p, check_calendar_availability: v }))} />
                                <ToggleRow label="Agendar Cita Oficial" hint="Anota el evento en Enterprise Scheduling" value={tools.create_calendar_event} onChange={v => setTools(p => ({ ...p, create_calendar_event: v }))} />
                            </div>
                        </div>

                        {/* 🚀 Módulo Automations */}
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1 flex items-center gap-2">
                                🚀 Automations
                            </h4>
                            <div className="space-y-1">
                                <ToggleRow label="Inscribir en Secuencia (Email)" hint="Añade al lead a una campaña de retargeting automático" value={tools.enroll_in_sequence} onChange={v => setTools(p => ({ ...p, enroll_in_sequence: v }))} />
                            </div>
                        </div>

                        {/* 🌐 Módulo General */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1 flex items-center gap-2">
                                🌐 Herramientas Generales
                            </h4>
                            <div className="space-y-1">
                                <ToggleRow label="Búsqueda Web" hint="Acceso a internet para información externa" value={tools.web_search} onChange={v => setTools(p => ({ ...p, web_search: v }))} />
                            </div>
                        </div>
                    </Section>
                </div>
            </div>
        </form>
    );
}
