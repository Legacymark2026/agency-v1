"use client";

import { useState } from "react";
import { createDeal } from "@/actions/crm";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { STAGES as BASE_STAGES } from "@/lib/crm-config";

const STAGES = [
    ...BASE_STAGES.map(stage => ({
        value: stage.id,
        label: stage.id === "NEW" ? "Nuevo" :
               stage.id === "CONTACTED" ? "Contactado" :
               stage.id === "QUALIFIED" ? "Calificado" :
               stage.id === "PROPOSAL" ? "Propuesta" :
               stage.id === "NEGOTIATION" ? "Negociación" :
               stage.id === "WON" ? "Ganado" : stage.label
    })),
    { value: "LOST", label: "Perdido" },
];

const PRIORITIES = [
    { value: "LOW", label: "Baja" },
    { value: "MEDIUM", label: "Media" },
    { value: "HIGH", label: "Alta" },
    { value: "CRITICAL", label: "Crítico" },
];

interface Props {
    companyId: string;
    trigger?: React.ReactNode;
}

export function CreateDealDialog({ companyId, trigger }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        title: "",
        value: "",
        stage: "NEW",
        priority: "MEDIUM",
        probability: "10",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        notes: "",
        expectedClose: "",
    });

    const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const result = await createDeal({
                ...form,
                value: parseFloat(form.value) || 0,
                probability: parseInt(form.probability) || 10,
                companyId,
                source: "MANUAL",
            });
            if ("error" in result) {
                setError(result.error ?? "Error al crear deal");
                return;
            }
            toast.success("¡Deal creado exitosamente!");
            setForm({
                title: "", value: "", stage: "NEW", priority: "MEDIUM",
                probability: "10", contactName: "", contactEmail: "",
                contactPhone: "", notes: "", expectedClose: "",
            });
            setOpen(false);
            router.refresh();
        } catch {
            setError("Error inesperado. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const inputCls =
        "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all";

    const dialogContent = open && (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && !loading && setOpen(false)}
        >
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white rounded-t-3xl px-8 pt-8 pb-4 border-b border-slate-100 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Nuevo Deal</h2>
                            <p className="text-xs text-slate-400">Crea un trato en el pipeline</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        disabled={loading}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-8 pb-8 pt-5 space-y-5">
                    {/* Datos del deal */}
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">💼 Datos del Deal</p>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Título del Deal <span className="text-red-400">*</span></label>
                                <input
                                    required
                                    value={form.title}
                                    onChange={(e) => set("title", e.target.value)}
                                    placeholder="Ej: Propuesta Empresa XYZ - Software CRM"
                                    className={inputCls}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Valor ($) <span className="text-red-400">*</span></label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={form.value}
                                        onChange={(e) => set("value", e.target.value)}
                                        placeholder="0"
                                        className={inputCls}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Probabilidad %</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={form.probability}
                                        onChange={(e) => set("probability", e.target.value)}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Etapa</label>
                                    <select value={form.stage} onChange={(e) => set("stage", e.target.value)} className={inputCls}>
                                        {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Prioridad</label>
                                    <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={inputCls}>
                                        {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Fecha estimada de cierre</label>
                                <input
                                    type="date"
                                    value={form.expectedClose}
                                    onChange={(e) => set("expectedClose", e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contacto */}
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">👤 Contacto (opcional)</p>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Nombre</label>
                                    <input
                                        value={form.contactName}
                                        onChange={(e) => set("contactName", e.target.value)}
                                        placeholder="Ana García"
                                        className={inputCls}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={form.contactPhone}
                                        onChange={(e) => set("contactPhone", e.target.value)}
                                        placeholder="+57 300 000 0000"
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Email</label>
                                <input
                                    type="email"
                                    value={form.contactEmail}
                                    onChange={(e) => set("contactEmail", e.target.value)}
                                    placeholder="ana@empresa.com"
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">📝 Notas</p>
                        <textarea
                            value={form.notes}
                            onChange={(e) => set("notes", e.target.value)}
                            rows={3}
                            placeholder="Contexto del deal, requisitos especiales..."
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                        >
                            {loading ? "Creando…" : "Crear Deal ✓"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {trigger ?? (
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
                        <Plus className="w-4 h-4" />
                        Nuevo Deal
                    </button>
                )}
            </div>

            {typeof window !== "undefined" && dialogContent
                ? createPortal(dialogContent, document.body)
                : null}
        </>
    );
}
