"use client";
import { useState, useTransition } from "react";
import { upsertSalesGoal } from "@/actions/crm-goals";
import { toast } from "sonner";
import { Target, X, Plus } from "lucide-react";

type User = { id: string; name: string | null; email: string | null };

export function GoalFormClient({ companyId, period, teamUsers }: { companyId: string; period: string; teamUsers: User[] }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState({ userId: "", targetAmount: "", label: "" });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await upsertSalesGoal({
                companyId,
                period,
                userId: form.userId || null,
                targetAmount: parseFloat(form.targetAmount) || 0,
                label: form.label || `Meta ${period}`,
                currency: "USD",
            });
            if (res.success) {
                toast.success("Meta guardada exitosamente");
                setOpen(false);
                setForm({ userId: "", targetAmount: "", label: "" });
            } else {
                toast.error("Error al guardar la meta");
            }
        });
    };

    return (
        <>
            <button onClick={() => setOpen(true)} className="ds-btn ds-btn-primary flex items-center gap-2 text-sm">
                <Plus size={14} />Nueva Meta
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="relative z-10 rounded-2xl p-6 w-[440px]" style={{ background: 'rgba(15,20,35,0.98)', border: '1px solid rgba(30,41,59,0.9)', boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="ds-icon-box w-8 h-8"><Target size={14} className="text-teal-400" /></div>
                                <p className="font-mono text-xs font-black text-slate-200 uppercase tracking-widest">Nueva Meta · {period}</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300 transition-colors"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-2">Vendedor (vacío = meta global)</label>
                                <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none">
                                    <option value="">📊 Meta Global de la Empresa</option>
                                    {teamUsers.map(u => <option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-2">Target ($USD)</label>
                                <input type="number" min="0" step="100" required value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                                    placeholder="50000"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block mb-2">Etiqueta (opcional)</label>
                                <input type="text" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                                    placeholder={`Q1 ${new Date().getFullYear()}`}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-200 focus:border-teal-500 focus:outline-none" />
                            </div>
                            <button type="submit" disabled={isPending}
                                className="w-full py-3 rounded-xl font-mono text-xs font-black uppercase tracking-widest text-slate-900 transition-all disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #0d9488, #0ea5e9)', boxShadow: '0 0 20px rgba(13,148,136,0.3)' }}>
                                {isPending ? "Guardando..." : "Guardar Meta"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
