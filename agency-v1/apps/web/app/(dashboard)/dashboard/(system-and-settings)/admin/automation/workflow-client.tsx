"use client";

import React, { useState } from "react";
import { Play, Pause, Plus, Zap, Settings, ArrowRight, Activity, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function WorkflowEngineClient({ initialWorkflows }: any) {
    const [workflows, setWorkflows] = useState(initialWorkflows || []);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-200 animate-in fade-in duration-500 p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Zap className="text-emerald-400" /> Motor RPA & Workflows
                    </h1>
                    <p className="text-slate-400 mt-2">Automatización de Procesos Robóticos basados en Eventos.</p>
                </div>
                <button 
                    onClick={() => setIsBuilderOpen(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                    <Plus size={18} /> Crear Workflow
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Default Mock Workflows for demo if DB is empty */}
                <WorkflowCard 
                    name="Auto-Facturación al Ganar Deal" 
                    trigger="crm.deal.won" 
                    actions={2} 
                    status="ACTIVE" 
                    lastRun="Hace 5 mins"
                />
                <WorkflowCard 
                    name="Alerta Desviación Presupuesto" 
                    trigger="finance.budget.exceeded" 
                    actions={1} 
                    status="ACTIVE" 
                    lastRun="Ayer"
                />
                <WorkflowCard 
                    name="Onboarding Nuevos Empleados" 
                    trigger="hr.employee.created" 
                    actions={4} 
                    status="PAUSED" 
                    lastRun="Nunca"
                />
            </div>

            {isBuilderOpen && <WorkflowBuilder onClose={() => setIsBuilderOpen(false)} />}
        </div>
    );
}

function WorkflowCard({ name, trigger, actions, status, lastRun }: any) {
    return (
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 relative group hover:border-emerald-500/50 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Activity size={20} />
                </div>
                {status === 'ACTIVE' ? (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} /> Activo
                    </span>
                ) : (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-full flex items-center gap-1">
                        <Pause size={12} /> Pausado
                    </span>
                )}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
            <p className="text-xs font-mono text-slate-500 mb-4">{trigger}</p>
            
            <div className="flex justify-between items-center pt-4 border-t border-slate-800/60 text-sm">
                <span className="text-slate-400">{actions} acciones</span>
                <span className="text-slate-500 text-xs flex items-center gap-1"><Clock size={12}/> {lastRun}</span>
            </div>
        </div>
    );
}

function WorkflowBuilder({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <h2 className="font-bold text-lg">Constructor de Workflow</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><Settings size={20}/></button>
                </div>
                
                <div className="p-8 space-y-8 bg-slate-900/50 h-[60vh] overflow-y-auto">
                    {/* Trigger */}
                    <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/30 relative">
                        <div className="absolute -top-3 left-6 px-2 bg-slate-900 text-xs font-bold text-emerald-400 uppercase tracking-wider">Disparador (Trigger)</div>
                        <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500">
                            <option>Cuando un Lead cambie a "Ganado"</option>
                            <option>Cuando un Presupuesto de Costos se exceda</option>
                            <option>Cuando se reciba un Email en Soporte</option>
                        </select>
                    </div>

                    <div className="flex justify-center text-slate-600"><ArrowRight className="rotate-90" size={24} /></div>

                    {/* Action 1 */}
                    <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/30 relative">
                        <div className="absolute -top-3 left-6 px-2 bg-slate-900 text-xs font-bold text-blue-400 uppercase tracking-wider">Acción Automática 1</div>
                        <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 mb-4">
                            <option>Crear Factura Electrónica (DIAN)</option>
                            <option>Crear Proyecto en Operaciones</option>
                        </select>
                    </div>

                    <div className="flex justify-center text-slate-600"><Plus size={24} className="hover:text-emerald-400 cursor-pointer" /></div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white rounded-lg">Cancelar</button>
                    <button onClick={onClose} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">Activar RPA</button>
                </div>
            </div>
        </div>
    );
}
