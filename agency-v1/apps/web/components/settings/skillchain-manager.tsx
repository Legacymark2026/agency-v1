"use client";

import { useState } from "react";
import { toast } from "sonner";
import { upsertSkillChain, deleteSkillChain, toggleSkillChain } from "@/actions/skillchains";
import {
    Link2, Plus, Trash2, ToggleLeft, ToggleRight, Zap, ChevronRight,
    Bot, Edit3, Save, X, GripVertical, AlertCircle, CheckCircle2, Layers
} from "lucide-react";
import { AIAgentTools } from "@/lib/services/ai-tools";

// ── Tool pill ────────────────────────────────────────────────────────────────
const TOOL_LABELS: Record<string, { label: string; color: string }> = {
    read_crm_leads:            { label: "Leer CRM",        color: "bg-teal-950/60 text-teal-300 border-teal-800/40" },
    update_deals:              { label: "Mover Deal",       color: "bg-teal-950/60 text-teal-300 border-teal-800/40" },
    create_crm_deal:           { label: "Crear Deal",       color: "bg-teal-950/60 text-teal-300 border-teal-800/40" },
    qualify_and_score_lead:    { label: "Calificar Lead",   color: "bg-teal-950/60 text-teal-300 border-teal-800/40" },
    send_email:                { label: "Enviar Email",     color: "bg-blue-950/60 text-blue-300 border-blue-800/40" },
    transfer_to_human:         { label: "Transfer Humano",  color: "bg-orange-950/60 text-orange-300 border-orange-800/40" },
    create_support_ticket:     { label: "Crear Ticket",     color: "bg-blue-950/60 text-blue-300 border-blue-800/40" },
    check_calendar_availability:{ label: "Ver Calendario",  color: "bg-purple-950/60 text-purple-300 border-purple-800/40" },
    create_calendar_event:     { label: "Agendar Cita",     color: "bg-purple-950/60 text-purple-300 border-purple-800/40" },
    enroll_in_sequence:        { label: "Secuencia Email",  color: "bg-pink-950/60 text-pink-300 border-pink-800/40" },
    web_search:                { label: "Búsqueda Web",     color: "bg-slate-800/80 text-slate-300 border-slate-700/40" },
    execute_skillchain:        { label: "Run Skillchain",   color: "bg-yellow-950/60 text-yellow-300 border-yellow-800/40" },
    agent_self_reflection:     { label: "Auto-Aprendizaje", color: "bg-indigo-950/60 text-indigo-300 border-indigo-800/40" },
    save_user_preference:      { label: "Guardar Memoria",  color: "bg-indigo-950/60 text-indigo-300 border-indigo-800/40" },
};

const ALL_TOOLS = Object.keys(AIAgentTools);

// ── Types ────────────────────────────────────────────────────────────────────
interface Agent  { id: string; name: string; agentType: string }
interface Chain  {
    id: string; name: string; description: string | null;
    tools: string[]; isActive: boolean; agentId: string;
    agent: Agent;
    createdAt: Date;
}

interface Props {
    companyId: string;
    agents: Agent[];
    initialChains: Chain[];
}

// ── Tool Multi-Select ────────────────────────────────────────────────────────
function ToolSelector({ selected, onChange }: {
    selected: string[];
    onChange: (tools: string[]) => void;
}) {
    const toggle = (t: string) => {
        if (selected.includes(t)) {
            onChange(selected.filter(x => x !== t));
        } else if (selected.length < 5) {
            onChange([...selected, t]);
        } else {
            toast.warning("Máximo 5 herramientas por Skillchain (5x)");
        }
    };
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Herramientas ({selected.length}/5)
                </p>
                {selected.length === 5 && (
                    <span className="text-[10px] text-teal-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Cadena 5x completa
                    </span>
                )}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {ALL_TOOLS.map(t => {
                    const meta = TOOL_LABELS[t];
                    const isOn = selected.includes(t);
                    const disabled = !isOn && selected.length >= 5;
                    return (
                        <button
                            key={t}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggle(t)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
                                ${isOn ? (meta?.color || "bg-teal-950/60 text-teal-300 border-teal-800/40") + " ring-1 ring-teal-500/50" : "bg-slate-900/50 text-slate-500 border-slate-700/50"}
                                ${disabled ? "opacity-30 cursor-not-allowed" : "hover:opacity-90 cursor-pointer"}`}
                        >
                            {meta?.label || t}
                        </button>
                    );
                })}
            </div>
            {/* Sequence preview */}
            {selected.length > 0 && (
                <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
                    {selected.map((t, i) => (
                        <div key={t} className="flex items-center gap-1 flex-shrink-0">
                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-[11px] text-slate-200">
                                <span className="text-[9px] text-slate-500 font-mono">{i + 1}</span>
                                {TOOL_LABELS[t]?.label || t}
                            </span>
                            {i < selected.length - 1 && (
                                <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Chain Form ────────────────────────────────────────────────────────────────
function ChainForm({ companyId, agents, initial, onClose }: {
    companyId: string;
    agents: Agent[];
    initial?: Chain;
    onClose: () => void;
}) {
    const [name, setName] = useState(initial?.name || "");
    const [description, setDescription] = useState(initial?.description || "");
    const [agentId, setAgentId] = useState(initial?.agentId || (agents[0]?.id || ""));
    const [tools, setTools] = useState<string[]>(initial?.tools || []);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return toast.error("El nombre es obligatorio");
        if (!agentId) return toast.error("Selecciona un agente");
        if (tools.length === 0) return toast.error("Añade al menos una herramienta");
        setSaving(true);
        try {
            await upsertSkillChain({ id: initial?.id, companyId, agentId, name, description, tools });
            toast.success(initial ? "Skillchain actualizado" : "Skillchain creado");
            onClose();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5 p-6">
            {/* Name + Agent row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                        Nombre del Skillchain *
                    </label>
                    <input
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="Ej: Calificación Express"
                        className="w-full h-10 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                        Agente Asignado *
                    </label>
                    <select
                        value={agentId} onChange={e => setAgentId(e.target.value)}
                        className="w-full h-10 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                        {agents.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Descripción (opcional)
                </label>
                <input
                    value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="¿Qué hace este Skillchain?"
                    className="w-full h-10 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
            </div>

            {/* Tool selector */}
            <div className="p-4 rounded-xl border border-slate-700/60 bg-slate-900/40">
                <ToolSelector selected={tools} onChange={setTools} />
            </div>

            {/* Warning */}
            {tools.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-950/30 border border-orange-900/30 text-xs text-orange-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Selecciona al menos 1 herramienta. Puedes encadenar hasta 5 en secuencia.
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/60">
                <button
                    type="button" onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="button" onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-500 text-slate-950 text-sm font-semibold hover:bg-teal-400 disabled:opacity-50 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {saving ? "Guardando..." : (initial ? "Actualizar" : "Crear Skillchain")}
                </button>
            </div>
        </div>
    );
}

// ── Chain Card ────────────────────────────────────────────────────────────────
function ChainCard({ chain, onEdit, onDelete, onToggle }: {
    chain: Chain;
    onEdit: () => void;
    onDelete: () => void;
    onToggle: () => void;
}) {
    const [toggling, setToggling] = useState(false);
    const handleToggle = async () => {
        setToggling(true);
        await onToggle();
        setToggling(false);
    };

    return (
        <div className={`group relative flex flex-col rounded-xl border transition-all duration-200 overflow-hidden
            ${chain.isActive
                ? "border-slate-700/60 bg-slate-900/50 hover:border-teal-500/40"
                : "border-slate-800/40 bg-slate-950/30 opacity-60 hover:opacity-80"
            }`}
        >
            {/* Top accent line */}
            {chain.isActive && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
            )}

            <div className="p-5 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border
                            ${chain.isActive
                                ? "bg-teal-950/60 border-teal-800/40"
                                : "bg-slate-800/60 border-slate-700/40"
                            }`}
                        >
                            <Layers className={`w-4 h-4 ${chain.isActive ? "text-teal-400" : "text-slate-500"}`} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-sm leading-none">{chain.name}</h3>
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                <Bot className="w-3 h-3" />
                                {chain.agent.name}
                            </p>
                        </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0
                        ${chain.isActive
                            ? "bg-teal-950/60 text-teal-400 border-teal-800/40"
                            : "bg-slate-800 text-slate-500 border-slate-700"
                        }`}
                    >
                        {chain.isActive ? "ACTIVO" : "INACTIVO"}
                    </span>
                </div>

                {chain.description && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{chain.description}</p>
                )}

                {/* Tool chain sequence */}
                <div className="flex items-center gap-1 flex-wrap">
                    {(chain.tools as string[]).map((t, i) => (
                        <div key={t} className="flex items-center gap-0.5">
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold
                                ${TOOL_LABELS[t]?.color || "bg-slate-800 text-slate-300 border-slate-700"}`}
                            >
                                <span className="text-[9px] opacity-60">{i + 1}</span>
                                {TOOL_LABELS[t]?.label || t}
                            </span>
                            {i < (chain.tools as string[]).length - 1 && (
                                <ChevronRight className="w-3 h-3 text-slate-600" />
                            )}
                        </div>
                    ))}
                    {(chain.tools as string[]).length === 5 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-950/60 text-yellow-400 border border-yellow-800/40">
                            5x MAX
                        </span>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800/60 px-5 py-3 flex items-center justify-between bg-slate-950/20">
                <span className="text-[10px] text-slate-600 font-mono">
                    {(chain.tools as string[]).length} herramienta{(chain.tools as string[]).length !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button" onClick={onEdit}
                        className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button" onClick={handleToggle} disabled={toggling}
                        className="p-1.5 text-slate-500 hover:text-yellow-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title={chain.isActive ? "Desactivar" : "Activar"}
                    >
                        {chain.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        type="button" onClick={onDelete}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────
export function SkillchainManager({ companyId, agents, initialChains }: Props) {
    const [chains, setChains] = useState<Chain[]>(initialChains);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Chain | null>(null);

    const refresh = async () => {
        // Re-fetch is handled by revalidatePath; optimistic update here
        const { getSkillChains } = await import("@/actions/skillchains");
        const fresh = await getSkillChains(companyId);
        setChains(fresh as any);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este Skillchain? Esta acción no se puede deshacer.")) return;
        await deleteSkillChain(id);
        setChains(prev => prev.filter(c => c.id !== id));
        toast.success("Skillchain eliminado");
    };

    const handleToggle = async (chain: Chain) => {
        await toggleSkillChain(chain.id, !chain.isActive);
        setChains(prev => prev.map(c => c.id === chain.id ? { ...c, isActive: !c.isActive } : c));
    };

    const openEdit = (chain: Chain) => { setEditing(chain); setShowForm(true); };
    const closeForm = () => { setEditing(null); setShowForm(false); refresh(); };

    const active = chains.filter(c => c.isActive).length;
    const total  = chains.length;

    return (
        <div className="space-y-6">
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Skillchains", value: total,          color: "text-white" },
                    { label: "Activos",           value: active,         color: "text-teal-400" },
                    { label: "Capacidad Máx.",    value: `${total * 5}`, color: "text-slate-300", suffix: " ops" },
                ].map(s => (
                    <div key={s.label} className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{s.label}</p>
                        <p className={`text-2xl font-black mt-0.5 ${s.color}`}>
                            {s.value}{s.suffix}
                        </p>
                    </div>
                ))}
            </div>

            {/* Form panel */}
            {showForm ? (
                <div className="rounded-xl border border-teal-500/30 bg-slate-900/60 shadow-[0_0_32px_-8px_rgba(20,184,166,0.15)] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-950/40">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-teal-400" />
                            <span className="text-sm font-semibold text-white">
                                {editing ? `Editar: ${editing.name}` : "Nuevo 5x Skillchain"}
                            </span>
                        </div>
                        <button type="button" onClick={closeForm} className="text-slate-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <ChainForm
                        companyId={companyId}
                        agents={agents}
                        initial={editing || undefined}
                        onClose={closeForm}
                    />
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => { setEditing(null); setShowForm(true); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-700/60
                        text-sm text-slate-400 hover:text-teal-400 hover:border-teal-500/40 hover:bg-teal-950/10 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Crear Nuevo 5x Skillchain
                </button>
            )}

            {/* Grid */}
            {chains.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-4">
                        <Link2 className="w-6 h-6 text-slate-500" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-300">No hay Skillchains configurados</h3>
                    <p className="text-sm text-slate-600 mt-2 max-w-xs">
                        Un Skillchain encadena hasta 5 herramientas en secuencia automática,
                        eliminando los viajes de ida y vuelta al LLM.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {chains.map(chain => (
                        <ChainCard
                            key={chain.id}
                            chain={chain}
                            onEdit={() => openEdit(chain)}
                            onDelete={() => handleDelete(chain.id)}
                            onToggle={() => handleToggle(chain)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
