"use client";

import React, { useState } from "react";
import { 
    Bot, ShieldCheck, DollarSign, ToggleLeft, ToggleRight, CheckCircle2,
    Lock, LockOpen, Save, AlertTriangle, Key, Zap
} from "lucide-react";
import { createAgentDelegationAction } from "@/actions/ai-delegation.actions";

const AVAILABLE_ACTIONS = [
    { id: "REFUND_APPROVE", label: "Aprobar Reembolsos", icon: <DollarSign size={14}/> },
    { id: "DISCOUNT_APPLY", label: "Aplicar Descuentos en CRM", icon: <Zap size={14}/> },
    { id: "INVOICE_CANCEL", label: "Anular Facturas", icon: <AlertTriangle size={14}/> },
    { id: "MEETING_RESCHEDULE", label: "Reagendar Citas Directas", icon: <CheckCircle2 size={14}/> },
];

export default function AgentDelegationClient({ delegations }: any) {
    const [selectedAgent, setSelectedAgent] = useState("agent-support-1");
    const [role, setRole] = useState("SUPPORT_TIER_1");
    const [budget, setBudget] = useState(50);
    const [requireApproval, setRequireApproval] = useState(false);
    const [selectedActions, setSelectedActions] = useState<string[]>(["MEETING_RESCHEDULE"]);
    const [isSaving, setIsSaving] = useState(false);

    const toggleAction = (actionId: string) => {
        if (selectedActions.includes(actionId)) {
            setSelectedActions(selectedActions.filter(a => a !== actionId));
        } else {
            setSelectedActions([...selectedActions, actionId]);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await createAgentDelegationAction({
                agentId: selectedAgent,
                role,
                allowedActions: selectedActions,
                maxBudgetUsd: budget,
                requireApproval,
            });
            alert("Permisos guardados exitosamente. El agente ahora tiene estos límites en producción.");
        } catch (e) {
            console.error(e);
            alert("Error al guardar.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-200 animate-in fade-in duration-500">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-800/60 bg-slate-900/40 sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                            <span>Inteligencia Artificial</span> <span className="text-slate-700">/</span> <span className="text-cyan-500">Gobernanza</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                            Delegación de Permisos (Role-Based AI)
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20 flex items-center gap-1">
                                <ShieldCheck size={12}/> Zero-Trust
                            </span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-800">
                        <div className="p-4 bg-cyan-500/10 text-cyan-400 rounded-xl"><Bot size={32} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Configurar Empleado Virtual</h2>
                            <p className="text-slate-400 text-sm">Define qué acciones puede ejecutar la IA directamente en la Base de Datos sin intervención humana.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1 */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agente Destino</label>
                                <select 
                                    value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500"
                                >
                                    <option value="agent-support-1">Sarah (Soporte Omnicanal Nivel 1)</option>
                                    <option value="agent-sales-1">Marcus (Closer de Ventas B2B)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rol Asignado (Contexto)</label>
                                <input 
                                    type="text" value={role} onChange={(e) => setRole(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500"
                                    placeholder="Ej. SUPPORT_TIER_1"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                                    Presupuesto Mensual Autorizado 
                                    <span className="text-cyan-500">${budget} USD</span>
                                </label>
                                <input 
                                    type="range" min="0" max="500" step="10" value={budget} onChange={(e) => setBudget(Number(e.target.value))}
                                    className="w-full accent-cyan-500"
                                />
                                <p className="text-xs text-slate-500">Límite máximo que el agente puede gastar en reembolsos o descuentos este mes.</p>
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Key size={14} /> Permisos Duros (Base de Datos)
                                </label>
                                <div className="space-y-2">
                                    {AVAILABLE_ACTIONS.map(action => {
                                        const isSelected = selectedActions.includes(action.id);
                                        return (
                                            <div 
                                                key={action.id} 
                                                onClick={() => toggleAction(action.id)}
                                                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all ${isSelected ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={isSelected ? 'text-cyan-400' : 'text-slate-500'}>
                                                        {action.icon}
                                                    </div>
                                                    <span className={isSelected ? 'text-white font-semibold' : 'text-slate-400'}>
                                                        {action.label}
                                                    </span>
                                                </div>
                                                {isSelected ? <ToggleRight className="text-cyan-400" size={24} /> : <ToggleLeft className="text-slate-600" size={24} />}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <div 
                                    onClick={() => setRequireApproval(!requireApproval)}
                                    className="flex items-center gap-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl cursor-pointer hover:bg-amber-500/10 transition-colors"
                                >
                                    <div className="text-amber-500">
                                        {requireApproval ? <Lock size={24} /> : <LockOpen size={24} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-amber-500">Requiere Aprobación Humana (Human-in-the-loop)</p>
                                        <p className="text-xs text-slate-400">Si está activo, el agente preparará la acción pero te pedirá clic en Slack/Inbox antes de ejecutarla.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
                        >
                            <Save size={18} /> {isSaving ? "Aplicando Políticas..." : "Guardar Políticas de Gobernanza"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
