"use client";
import { useState } from "react";
import { toast } from "sonner";
import { upsertAgentTeam, deleteAgentTeam, toggleAgentTeam, runAgentTeamAction } from "@/actions/agent-teams";
import { Users, Plus, Trash2, Play, ToggleLeft, ToggleRight, Edit3, X, Save, Bot, Zap, GitBranch, Vote, ChevronRight, Clock, CheckCircle2, AlertCircle, Layers } from "lucide-react";

const ROLES = ["ORCHESTRATOR", "WORKER", "REVIEWER", "SYNTHESIZER"] as const;
const STRATEGIES = [
    { value: "PARALLEL",   label: "Paralelo",    icon: <Layers className="w-4 h-4" />,    desc: "Todos los agentes trabajan al mismo tiempo" },
    { value: "SEQUENTIAL", label: "Secuencial",  icon: <ChevronRight className="w-4 h-4"/>, desc: "Cada agente recibe el output del anterior" },
    { value: "VOTE",       label: "Votación",    icon: <Vote className="w-4 h-4" />,       desc: "Los agentes votan la mejor respuesta" },
];
const ROLE_COLORS: Record<string, string> = {
    ORCHESTRATOR: "bg-purple-950/60 text-purple-300 border-purple-800/40",
    WORKER:       "bg-teal-950/60 text-teal-300 border-teal-800/40",
    REVIEWER:     "bg-yellow-950/60 text-yellow-300 border-yellow-800/40",
    SYNTHESIZER:  "bg-blue-950/60 text-blue-300 border-blue-800/40",
};

interface Agent  { id: string; name: string; agentType: string; llmModel: string; isActive: boolean }
interface Member { agentId: string; role: string; priority: number; agent: Agent }
interface Team   { id: string; name: string; description: string|null; objective: string; strategy: string; isActive: boolean; members: Member[]; _count: { runs: number } }

// ── Member Row ────────────────────────────────────────────────
function MemberRow({ member, agents, onUpdate, onRemove }: {
    member: { agentId: string; role: string; priority: number };
    agents: Agent[];
    onUpdate: (m: { agentId: string; role: string; priority: number }) => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-700/50 bg-slate-900/40">
            <span className="text-xs text-slate-600 font-mono w-5 text-center">{member.priority + 1}</span>
            <select value={member.agentId} onChange={e => onUpdate({ ...member, agentId: e.target.value })}
                className="flex-1 h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500">
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select value={member.role} onChange={e => onUpdate({ ...member, role: e.target.value })}
                className="w-36 h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="button" onClick={onRemove} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// ── Team Form ─────────────────────────────────────────────────
function TeamForm({ companyId, agents, initial, onClose }: {
    companyId: string; agents: Agent[]; initial?: Team; onClose: () => void;
}) {
    const [name, setName] = useState(initial?.name || "");
    const [description, setDescription] = useState(initial?.description || "");
    const [objective, setObjective] = useState(initial?.objective || "");
    const [strategy, setStrategy] = useState<"PARALLEL"|"SEQUENTIAL"|"VOTE">(initial?.strategy as any || "PARALLEL");
    const [members, setMembers] = useState<{ agentId: string; role: string; priority: number }[]>(
        initial?.members.map(m => ({ agentId: m.agentId, role: m.role, priority: m.priority })) || []
    );
    const [saving, setSaving] = useState(false);

    const addMember = () => {
        const unusedAgent = agents.find(a => !members.some(m => m.agentId === a.id));
        if (!unusedAgent) return toast.warning("Todos los agentes ya están asignados");
        setMembers(prev => [...prev, { agentId: unusedAgent.id, role: "WORKER", priority: prev.length }]);
    };

    const handleSave = async () => {
        if (!name.trim() || !objective.trim()) return toast.error("Nombre y Objetivo son obligatorios");
        if (members.length < 2) return toast.error("Un equipo necesita al menos 2 agentes");
        setSaving(true);
        try {
            await upsertAgentTeam({ id: initial?.id, companyId, name, description, objective, strategy, members });
            toast.success(initial ? "Equipo actualizado" : "Equipo creado ✅");
            onClose();
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-4 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nombre del Equipo *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Fuerza de Ventas Alpha"
                        className="w-full h-10 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estrategia *</label>
                    <div className="grid grid-cols-3 gap-1.5">
                        {STRATEGIES.map(s => (
                            <button key={s.value} type="button" onClick={() => setStrategy(s.value as any)}
                                className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all text-[10px] font-bold
                                    ${strategy === s.value ? "border-teal-500/60 bg-teal-950/40 text-teal-300" : "border-slate-700/50 bg-slate-900/40 text-slate-500 hover:border-slate-600"}`}>
                                {s.icon}<span className="mt-1">{s.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Objetivo del Equipo *</label>
                <textarea value={objective} onChange={e => setObjective(e.target.value)} rows={2}
                    placeholder="¿Qué debe lograr este equipo? Ej: Analizar leads inbound y preparar estrategia de cierre personalizada"
                    className="w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none" />
            </div>
            {/* Members */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 space-y-2">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Agentes del Equipo ({members.length})</p>
                    <button type="button" onClick={addMember} disabled={members.length >= agents.length}
                        className="flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 disabled:opacity-40 transition-colors">
                        <Plus className="w-3 h-3" /> Añadir agente
                    </button>
                </div>
                {members.length === 0 && (
                    <p className="text-xs text-slate-600 text-center py-3">Añade al menos 2 agentes para formar el equipo</p>
                )}
                {members.map((m, i) => (
                    <MemberRow key={i} member={m} agents={agents}
                        onUpdate={updated => setMembers(prev => prev.map((x, j) => j === i ? updated : x))}
                        onRemove={() => setMembers(prev => prev.filter((_, j) => j !== i).map((x, j) => ({ ...x, priority: j })))}
                    />
                ))}
            </div>
            <div className="flex justify-end gap-3 pt-1 border-t border-slate-800/60">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                <button type="button" onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-500 text-slate-950 text-sm font-bold hover:bg-teal-400 disabled:opacity-50 transition-colors">
                    <Save className="w-4 h-4" />{saving ? "Guardando..." : (initial ? "Actualizar" : "Crear Equipo")}
                </button>
            </div>
        </div>
    );
}

// ── Run Panel ─────────────────────────────────────────────────
function RunPanel({ team, onClose }: { team: Team; onClose: () => void }) {
    const [input, setInput] = useState("");
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleRun = async () => {
        if (!input.trim()) return toast.error("Escribe una tarea para el equipo");
        setRunning(true); setResult(null);
        try {
            const { result: r } = await runAgentTeamAction(team.id, input);
            setResult(r);
            toast.success(`Equipo completó la tarea en ${((r.totalLatencyMs || 0) / 1000).toFixed(1)}s`);
        } catch (e: any) { toast.error(e.message); }
        finally { setRunning(false); }
    };

    return (
        <div className="space-y-4 p-6">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tarea para el Equipo</label>
                <textarea value={input} onChange={e => setInput(e.target.value)} rows={3}
                    placeholder={`Instrucción completa para ${team.name}...`}
                    className="w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none" />
            </div>
            <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                <button type="button" onClick={handleRun} disabled={running}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-500 text-slate-950 text-sm font-bold hover:bg-teal-400 disabled:opacity-50 transition-colors">
                    <Play className="w-4 h-4" />{running ? `Ejecutando (${team.members.length} agentes)...` : "Lanzar Equipo"}
                </button>
            </div>
            {result && (
                <div className="space-y-3">
                    <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-800 pt-3">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{((result.totalLatencyMs||0)/1000).toFixed(1)}s</span>
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{result.totalTokens} tokens</span>
                        <span className={`flex items-center gap-1 font-semibold ${result.status==="COMPLETED"?"text-teal-400":"text-yellow-400"}`}>
                            {result.status==="COMPLETED" ? <CheckCircle2 className="w-3 h-3"/> : <AlertCircle className="w-3 h-3"/>} {result.status}
                        </span>
                    </div>
                    {result.agentOutputs?.map((o: any) => (
                        <div key={o.agentId} className="rounded-lg border border-slate-700/40 bg-slate-900/40 p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Bot className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-xs font-semibold text-slate-300">{o.agentName}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${ROLE_COLORS[o.role]||""}`}>{o.role}</span>
                                {o.error && <span className="text-[10px] text-red-400">ERROR</span>}
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">{o.error || o.result}</p>
                        </div>
                    ))}
                    {result.synthesis && (
                        <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-4">
                            <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2">Síntesis Final del Equipo</p>
                            <p className="text-sm text-slate-200 leading-relaxed">{result.synthesis}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Team Card ─────────────────────────────────────────────────
function TeamCard({ team, onEdit, onRun, onDelete, onToggle }: {
    team: Team; onEdit: ()=>void; onRun: ()=>void; onDelete: ()=>void; onToggle: ()=>void;
}) {
    const strategyMeta = STRATEGIES.find(s => s.value === team.strategy);
    return (
        <div className={`group relative flex flex-col rounded-xl border overflow-hidden transition-all
            ${team.isActive ? "border-slate-700/60 bg-slate-900/50 hover:border-teal-500/40" : "border-slate-800/40 bg-slate-950/30 opacity-60"}`}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
            <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-teal-950/60 border border-teal-800/40 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-teal-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">{team.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1 text-[10px] text-slate-500 border border-slate-700/50 rounded px-1.5 py-0.5">
                                    {strategyMeta?.icon}<span>{strategyMeta?.label}</span>
                                </span>
                                <span className="text-[10px] text-slate-500">{team._count.runs} runs</span>
                            </div>
                        </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${team.isActive?"bg-teal-950/60 text-teal-400 border-teal-800/40":"bg-slate-800 text-slate-500 border-slate-700"}`}>
                        {team.isActive ? "ACTIVO" : "INACTIVO"}
                    </span>
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{team.objective}</p>
                {/* Member avatars */}
                <div className="flex flex-wrap gap-1.5">
                    {team.members.map(m => (
                        <div key={m.agentId} className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold ${ROLE_COLORS[m.role]||""}`}>
                            <Bot className="w-2.5 h-2.5" />{m.agent.name}
                        </div>
                    ))}
                </div>
            </div>
            <div className="border-t border-slate-800/60 px-4 py-2.5 flex items-center justify-between bg-slate-950/20">
                <span className="text-[10px] text-slate-600">{team.members.length} agentes</span>
                <div className="flex items-center gap-1">
                    <button onClick={onRun} className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition-colors" title="Ejecutar"><Play className="w-3.5 h-3.5" /></button>
                    <button onClick={onEdit} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors" title="Editar"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={onToggle} className="p-1.5 text-slate-500 hover:text-yellow-400 hover:bg-slate-800 rounded-lg transition-colors">
                        {team.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────
export function AgentTeamManager({ companyId, agents, initialTeams }: {
    companyId: string; agents: Agent[]; initialTeams: Team[];
}) {
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Team|null>(null);
    const [running, setRunning] = useState<Team|null>(null);

    const refresh = async () => {
        const { getAgentTeams } = await import("@/actions/agent-teams");
        const fresh = await getAgentTeams(companyId);
        setTeams(fresh as any);
    };
    const closeAll = () => { setEditing(null); setShowForm(false); setRunning(null); refresh(); };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este equipo permanentemente?")) return;
        await deleteAgentTeam(id);
        setTeams(p => p.filter(t => t.id !== id));
        toast.success("Equipo eliminado");
    };
    const handleToggle = async (team: Team) => {
        await toggleAgentTeam(team.id, !team.isActive);
        setTeams(p => p.map(t => t.id === team.id ? { ...t, isActive: !t.isActive } : t));
    };

    const activeTeams = teams.filter(t => t.isActive).length;
    const totalAgentSlots = teams.reduce((s, t) => s + t.members.length, 0);

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Equipos Activos",    value: activeTeams,     color: "text-teal-400" },
                    { label: "Total Equipos",       value: teams.length,    color: "text-white" },
                    { label: "Agentes Desplegados", value: totalAgentSlots, color: "text-purple-400" },
                ].map(s => (
                    <div key={s.label} className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{s.label}</p>
                        <p className={`text-2xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Active Panel */}
            {(showForm || editing || running) ? (
                <div className="rounded-xl border border-teal-500/30 bg-slate-900/60 shadow-[0_0_32px_-8px_rgba(20,184,166,0.15)] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-950/40">
                        <div className="flex items-center gap-2">
                            {running ? <Play className="w-4 h-4 text-teal-400" /> : <Users className="w-4 h-4 text-teal-400" />}
                            <span className="text-sm font-bold text-white">
                                {running ? `Lanzar: ${running.name}` : editing ? `Editar: ${editing.name}` : "Nuevo Equipo de Trabajo"}
                            </span>
                        </div>
                        <button onClick={closeAll} className="text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                    {running
                        ? <RunPanel team={running} onClose={closeAll} />
                        : <TeamForm companyId={companyId} agents={agents} initial={editing||undefined} onClose={closeAll} />
                    }
                </div>
            ) : (
                <button onClick={() => { setEditing(null); setShowForm(true); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-700/60 text-sm text-slate-400 hover:text-teal-400 hover:border-teal-500/40 hover:bg-teal-950/10 transition-all">
                    <Plus className="w-4 h-4" /> Crear Nuevo Equipo de Trabajo
                </button>
            )}

            {/* Grid */}
            {teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-slate-500" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-300">No hay equipos configurados</h3>
                    <p className="text-sm text-slate-600 mt-2 max-w-sm">
                        Agrupa tus agentes especializados en fuerzas de trabajo paralelas para resolver tareas complejas de manera autónoma.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {teams.map(team => (
                        <TeamCard key={team.id} team={team}
                            onEdit={() => { setEditing(team); setRunning(null); setShowForm(false); }}
                            onRun={() => { setRunning(team); setEditing(null); setShowForm(false); }}
                            onDelete={() => handleDelete(team.id)}
                            onToggle={() => handleToggle(team)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
