"use client";
import { useState, useTransition } from "react";
import { createAutomationRule, TriggerType, ActionType } from "@/actions/crm-automation";
import { toast } from "sonner";
import { Zap, X, Plus } from "lucide-react";
import { STAGES as BASE_STAGES } from "@/lib/crm-config";

const TRIGGERS: { value: TriggerType; label: string }[] = [
    { value: "STAGE_STUCK_X_DAYS", label: "Stage estancada X días" },
    { value: "DEAL_CREATED", label: "Deal creado" },
    { value: "WON", label: "Deal ganado" },
    { value: "LOST", label: "Deal perdido" },
];

const ACTIONS: { value: ActionType; label: string }[] = [
    { value: "NOTIFY_ASSIGNEE", label: "Notificar al vendedor asignado" },
    { value: "NOTIFY_ADMIN", label: "Notificar al admin" },
    { value: "CHANGE_PRIORITY", label: "Cambiar prioridad del deal" },
    { value: "MOVE_STAGE", label: "Mover a otra etapa" },
    { value: "ADD_TAG", label: "Agregar tag al deal" },
    { value: "SEND_WEBHOOK", label: "Enviar webhook externo" },
];

const STAGES = [...BASE_STAGES.map(s => s.id), "LOST"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function AutomationRuleForm({ companyId }: { companyId: string }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState({
        name: "", description: "",
        triggerType: "STAGE_STUCK_X_DAYS" as TriggerType,
        triggerStage: "PROPOSAL", triggerDays: "7",
        actionType: "NOTIFY_ASSIGNEE" as ActionType,
        // Action payload fields
        message: "", stage: "NEGOTIATION", priority: "HIGH", tag: "", webhookUrl: "",
    });

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const payload: Record<string, unknown> = {};
            if (form.actionType === "CHANGE_PRIORITY") payload.priority = form.priority;
            if (form.actionType === "MOVE_STAGE") payload.stage = form.stage;
            if (form.actionType === "ADD_TAG") payload.tag = form.tag;
            if (form.actionType === "SEND_WEBHOOK") payload.webhookUrl = form.webhookUrl;
            if (form.actionType === "NOTIFY_ASSIGNEE" || form.actionType === "NOTIFY_ADMIN") payload.message = form.message;

            const res = await createAutomationRule({
                companyId, name: form.name, description: form.description,
                triggerType: form.triggerType,
                triggerStage: form.triggerType === "STAGE_STUCK_X_DAYS" ? form.triggerStage : undefined,
                triggerDays: form.triggerType === "STAGE_STUCK_X_DAYS" ? parseInt(form.triggerDays) : undefined,
                actionType: form.actionType, actionPayload: payload,
            });
            if (res.success) { toast.success("Regla creada"); setOpen(false); }
            else toast.error("Error al crear la regla");
        });
    };

    return (
        <>
            <button onClick={() => setOpen(true)} className="ds-btn ds-btn-primary flex items-center gap-2 text-sm">
                <Plus size={14} />Nueva Regla
            </button>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="relative z-10 rounded-2xl p-6 w-[520px] max-h-[80vh] overflow-y-auto" style={{ background: 'rgba(15,20,35,0.98)', border: '1px solid rgba(30,41,59,0.9)', boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="ds-icon-box w-8 h-8"><Zap size={14} className="text-teal-400" /></div>
                                <p className="font-mono text-xs font-black text-slate-200 uppercase tracking-widest">Nueva Regla de Automatización</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">Nombre de la regla *</label>
                                <input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ej: Alertar deals estancados en Propuesta"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">Disparador (SI...)</label>
                                <select value={form.triggerType} onChange={e => set("triggerType", e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none">
                                    {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            {form.triggerType === "STAGE_STUCK_X_DAYS" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">Etapa</label>
                                        <select value={form.triggerStage} onChange={e => set("triggerStage", e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none">
                                            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">Días sin actividad</label>
                                        <input type="number" min="1" value={form.triggerDays} onChange={e => set("triggerDays", e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none" />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">Acción (ENTONCES...)</label>
                                <select value={form.actionType} onChange={e => set("actionType", e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none">
                                    {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                </select>
                            </div>
                            {(form.actionType === "NOTIFY_ASSIGNEE" || form.actionType === "NOTIFY_ADMIN") && (
                                <div>
                                    <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">Mensaje</label>
                                    <input value={form.message} onChange={e => set("message", e.target.value)} placeholder="El deal requiere seguimiento urgente"
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none" />
                                </div>
                            )}
                            {form.actionType === "CHANGE_PRIORITY" && (
                                <div>
                                    <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">Nueva prioridad</label>
                                    <select value={form.priority} onChange={e => set("priority", e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none">
                                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            )}
                            {form.actionType === "MOVE_STAGE" && (
                                <div>
                                    <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">Mover a etapa</label>
                                    <select value={form.stage} onChange={e => set("stage", e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none">
                                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            )}
                            {form.actionType === "ADD_TAG" && (
                                <div>
                                    <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">Tag a agregar</label>
                                    <input value={form.tag} onChange={e => set("tag", e.target.value)} placeholder="urgente"
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none" />
                                </div>
                            )}
                            {form.actionType === "SEND_WEBHOOK" && (
                                <div>
                                    <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-1.5">URL del Webhook</label>
                                    <input type="url" value={form.webhookUrl} onChange={e => set("webhookUrl", e.target.value)} placeholder="https://hooks.zapier.com/..."
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none" />
                                </div>
                            )}
                            <button type="submit" disabled={isPending}
                                className="w-full py-3 rounded-xl font-mono text-xs font-black uppercase tracking-widest text-slate-900 transition-all disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #0d9488, #0ea5e9)', boxShadow: '0 0 20px rgba(13,148,136,0.3)' }}>
                                {isPending ? "Creando..." : "Crear Regla"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
