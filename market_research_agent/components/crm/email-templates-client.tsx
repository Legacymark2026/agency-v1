"use client";

import { useState } from "react";
import { createEmailTemplate, deleteEmailTemplate } from "@/actions/crm-advanced";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, Eye, Copy, Mail } from "lucide-react";

interface Template {
    id: string; name: string; subject: string; body: string;
    description: string | null; variables: string[]; category: string;
    createdAt: Date; updatedAt: Date;
}

const CATEGORIES = ["GENERAL", "FOLLOW_UP", "PROPOSAL", "CLOSING", "ONBOARDING", "REACTIVATION"];
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    GENERAL: { label: "General", color: "text-slate-600", bg: "bg-slate-100" },
    FOLLOW_UP: { label: "Seguimiento", color: "text-sky-600", bg: "bg-sky-50" },
    PROPOSAL: { label: "Propuesta", color: "text-violet-600", bg: "bg-violet-50" },
    CLOSING: { label: "Cierre", color: "text-emerald-600", bg: "bg-emerald-50" },
    ONBOARDING: { label: "Bienvenida", color: "text-teal-600", bg: "bg-teal-50" },
    REACTIVATION: { label: "Reactivación", color: "text-amber-600", bg: "bg-amber-50" },
};

interface Props { templates: Template[]; companyId: string; }

export function EmailTemplatesClient({ templates: initial, companyId }: Props) {
    const router = useRouter();
    const [templates, setTemplates] = useState(initial);
    const [showCreate, setShowCreate] = useState(false);
    const [preview, setPreview] = useState<Template | null>(null);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", subject: "", body: "", description: "", category: "GENERAL", variables: "" });

    const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setCreating(true); setError("");
        const result = await createEmailTemplate({
            ...form, variables: form.variables.split(",").map((v) => v.trim()).filter(Boolean), companyId,
        });
        setCreating(false);
        if ("error" in result) { setError(result.error ?? "Error"); return; }
        setShowCreate(false);
        setForm({ name: "", subject: "", body: "", description: "", category: "GENERAL", variables: "" });
        router.refresh();
    };

    const handleDelete = async (id: string) => {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        await deleteEmailTemplate(id);
    };

    const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200">
                    <Plus className="w-4 h-4" /> Nuevo Template
                </button>
            </div>

            {/* Grid of templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {templates.map((tpl) => {
                    const cfg = CATEGORY_CONFIG[tpl.category] ?? CATEGORY_CONFIG["GENERAL"];
                    return (
                        <div key={tpl.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-teal-500" />
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setPreview(tpl)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all"><Eye className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDelete(tpl.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                            <h3 className="font-black text-slate-900 text-sm mb-1">{tpl.name}</h3>
                            <p className="text-xs text-slate-500 mb-2 font-medium">📌 {tpl.subject}</p>
                            {tpl.description && <p className="text-xs text-slate-400 leading-relaxed">{tpl.description}</p>}
                            {tpl.variables.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {tpl.variables.map((v) => <span key={v} className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-violet-50 text-violet-600 border border-violet-100 rounded">{"{{" + v + "}}"}</span>)}
                                </div>
                            )}
                        </div>
                    );
                })}
                {templates.length === 0 && (
                    <div className="md:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                        <Mail className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No hay templates aún. Crea el primero para acelerar tu seguimiento.</p>
                    </div>
                )}
            </div>

            {/* Create Dialog */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white rounded-t-3xl px-8 pt-8 pb-4 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-lg font-black text-slate-900">Nuevo Template de Email</h2>
                            <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="px-8 pb-8 pt-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600">Nombre interno *</label>
                                    <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Ej: Seguimiento día 3" className={inputCls} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600">Categoría</label>
                                    <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
                                        {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_CONFIG[c]?.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">Asunto del email *</label>
                                <input value={form.subject} onChange={(e) => set("subject", e.target.value)} required placeholder="Ej: Hola {{name}}, ¿pudiste revisar la propuesta?" className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">Cuerpo del email *</label>
                                <textarea value={form.body} onChange={(e) => set("body", e.target.value)} required rows={8} placeholder={"Hola {{name}},\n\nEspero que estés muy bien. Quería hacer seguimiento a nuestra conversación...\n\nQuedo atento,\n{{senderName}}"} className={`${inputCls} resize-none font-mono text-xs`} />
                                <p className="text-[10px] text-slate-400">Usa {"{{variable}}"} para las variables personalizables.</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">Variables (separadas por coma)</label>
                                <input value={form.variables} onChange={(e) => set("variables", e.target.value)} placeholder="name, company, dealValue, senderName" className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">Descripción</label>
                                <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="¿Cuándo usar este template?" className={inputCls} />
                            </div>
                            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancelar</button>
                                <button type="submit" disabled={creating} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 shadow-lg shadow-teal-200">
                                    {creating ? "Guardando…" : "Guardar Template ✓"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview Dialog */}
            {preview && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-slate-900">{preview.name}</h3>
                            <button onClick={() => setPreview(null)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ASUNTO</p>
                                <p className="text-sm font-semibold text-slate-900">{preview.subject}</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">CUERPO</p>
                                <pre className="text-sm text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">{preview.body}</pre>
                            </div>
                            {preview.variables.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {preview.variables.map((v) => (
                                        <button key={v} onClick={() => navigator.clipboard.writeText(`{{${v}}}`)} className="flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold bg-violet-50 text-violet-600 border border-violet-100 rounded-lg hover:bg-violet-100 transition-colors">
                                            <Copy className="w-3 h-3" />{"{{" + v + "}}"}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
