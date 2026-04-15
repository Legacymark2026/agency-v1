"use client";
import { useState, useTransition } from "react";
import { createEmailSequence, SequenceStep } from "@/actions/crm-sequences";
import { toast } from "sonner";
import { Mail, X, Plus, Trash2 } from "lucide-react";
import { STAGES as BASE_STAGES } from "@/lib/crm-config";

const STAGES = BASE_STAGES.map(s => s.id).filter(s => s !== "WON");

export function SequenceFormClient({ companyId }: { companyId: string }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState({ name: "", description: "", triggerStage: "" });
    const [steps, setSteps] = useState<SequenceStep[]>([
        { delayDays: 0, type: "EMAIL", subject: "Hola, te contactamos sobre tu consulta", body: "Queremos retomar el contacto con usted..." },
        { delayDays: 3, type: "EMAIL", subject: "Seguimiento a nuestra propuesta", body: "¿Ha tenido oportunidad de revisar nuestra propuesta?" },
    ]);

    const addStep = () => setSteps(s => [...s, { delayDays: (s[s.length - 1]?.delayDays ?? 0) + 3, type: "EMAIL", subject: "", body: "" }]);
    const removeStep = (i: number) => setSteps(s => s.filter((_, idx) => idx !== i));
    const updateStep = (i: number, k: keyof SequenceStep, v: any) => setSteps(s => s.map((step, idx) => idx === i ? { ...step, [k]: v } : step));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await createEmailSequence({ companyId, ...form, triggerStage: form.triggerStage || undefined, steps });
            if (res.success) { toast.success("Secuencia creada"); setOpen(false); }
            else toast.error("Error al crear la secuencia");
        });
    };

    return (
        <>
            <button onClick={() => setOpen(true)} className="ds-btn ds-btn-primary flex items-center gap-2 text-sm">
                <Plus size={14} />Nueva Secuencia
            </button>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="relative z-10 rounded-2xl p-6 w-[580px] max-h-[85vh] overflow-y-auto" style={{ background: 'rgba(15,20,35,0.98)', border: '1px solid rgba(30,41,59,0.9)', boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="ds-icon-box w-8 h-8"><Mail size={14} className="text-teal-400" /></div>
                                <p className="font-mono text-[11px] font-black text-slate-200 uppercase tracking-widest">Nueva Secuencia</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-1.5">Nombre *</label>
                                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Nurturing Propuesta"
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-1.5">Activar cuando deal entre a</label>
                                    <select value={form.triggerStage} onChange={e => setForm(f => ({ ...f, triggerStage: e.target.value }))}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none">
                                        <option value="">Manual (enrollar individualmente)</option>
                                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            {/* Steps */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Pasos de la Secuencia</label>
                                    <button type="button" onClick={addStep} className="flex items-center gap-1 font-mono text-[9px] text-teal-400 hover:text-teal-300 transition-colors">
                                        <Plus size={11} />Agregar paso
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {steps.map((step, i) => (
                                        <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(30,41,59,0.8)' }}>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-[9px] font-bold text-teal-400">PASO {i + 1}</span>
                                                <button type="button" onClick={() => removeStep(i)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="font-mono text-[8px] text-slate-600 block mb-1">Enviar después de (días)</label>
                                                    <input type="number" min="0" value={step.delayDays} onChange={e => updateStep(i, "delayDays", parseInt(e.target.value))}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="font-mono text-[8px] text-slate-600 block mb-1">Tipo</label>
                                                    <select value={step.type} onChange={e => updateStep(i, "type", e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none">
                                                        <option value="EMAIL">📧 Email</option>
                                                        <option value="TASK">✅ Tarea</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="font-mono text-[8px] text-slate-600 block mb-1">{step.type === "EMAIL" ? "Asunto" : "Título de la tarea"}</label>
                                                <input value={step.subject ?? ""} onChange={e => updateStep(i, "subject", e.target.value)} placeholder={step.type === "EMAIL" ? "Asunto del email" : "Hacer seguimiento a..."}
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="font-mono text-[8px] text-slate-600 block mb-1">Cuerpo / Nota</label>
                                                <textarea rows={2} value={step.body} onChange={e => updateStep(i, "body", e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none resize-none" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" disabled={isPending}
                                className="w-full py-3 rounded-xl font-mono text-[11px] font-black uppercase tracking-widest text-slate-900 transition-all disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #0d9488, #0ea5e9)', boxShadow: '0 0 20px rgba(13,148,136,0.3)' }}>
                                {isPending ? "Creando..." : `Crear Secuencia (${steps.length} pasos)`}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
