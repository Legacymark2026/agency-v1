"use client";

import { useState, useEffect } from "react";
import { convertLeadToDeal } from "@/actions/crm";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface Props { leadId: string; leadName: string; leadEmail: string; companyId: string; }

export function ConvertToDealDialog({ leadId, leadName, leadEmail, companyId }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ title: `Deal — ${leadName}`, value: "", probability: "30", expectedClose: "" });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        const result = await convertLeadToDeal(leadId, {
            title: form.title,
            value: parseFloat(form.value) || 0,
            companyId,
            probability: parseInt(form.probability),
            expectedClose: form.expectedClose || undefined,
        });
        setLoading(false);
        if ("error" in result) { setError(result.error ?? "Error al convertir"); return; }
        setOpen(false);
        router.push(`/dashboard/admin/crm/pipeline`);
    };

    return (
        <>
            <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-200 text-sm">
                🔄 Convertir una oferta
            </button>

            {open && mounted && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto my-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-black text-xl">💼</div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Convertir una oferta</h2>
                                <p className="text-xs text-slate-400 mt-0.5">{leadEmail}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Título del Deal *</label>
                                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Valor ($) *</label>
                                    <input type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required placeholder="0"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Probabilidad %</label>
                                    <input type="number" min="0" max="100" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Fecha estimada de cierre</label>
                                <input type="date" value={form.expectedClose} onChange={(e) => setForm({ ...form, expectedClose: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                            </div>

                            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
                                <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-sm disabled:opacity-50 transition-all hover:scale-[1.02]">
                                    {loading ? "Convirtiendo…" : "Crear Deal ✓"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
