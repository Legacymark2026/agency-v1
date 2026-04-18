"use client";

import { useState } from "react";
import { createDeal, checkDuplicateEmail } from "@/actions/crm";
import { useRouter } from "next/navigation";
import { Plus, X, AlertTriangle, Briefcase } from "lucide-react";
import Link from "next/link";

const SOURCES = ["GOOGLE", "FACEBOOK", "INSTAGRAM", "LINKEDIN", "TIKTOK", "REFERRAL", "DIRECT", "EMAIL", "ORGANIC", "WHATSAPP", "OTRO"];

interface Props { companyId: string; }

export function NewDealDialog({ companyId }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [duplicate, setDuplicate] = useState<{ leadId: string; leadName?: string } | null>(null);

    // States match exactly the Lead structure PLUS Deal specific structure
    const [form, setForm] = useState({
        title: "", value: "", stage: "NEW", priority: "MEDIUM",
        contactName: "", contactEmail: "", contactPhone: "", contactCompany: "",
        source: "DIRECT", notes: "",
        utmSource: "", utmMedium: "", utmCampaign: "",
    });

    const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

    const handleEmailBlur = async () => {
        if (!form.contactEmail || !form.contactEmail.includes("@")) return;
        const res = await checkDuplicateEmail(form.contactEmail, companyId);
        if (res.isDuplicate) setDuplicate({ leadId: res.leadId!, leadName: res.leadName });
        else setDuplicate(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const result = await createDeal({
                ...form,
                value: parseFloat(form.value) || 0,
                // Si el título viene vacío, generamos uno autodescriptivo
                title: form.title.trim() || `Negocio: ${form.contactCompany || form.contactName || form.contactEmail.split('@')[0]}`,
                companyId
            });
            if ("error" in result && result.error) { setError(result.error); return; }
            setSuccess(true);
            setForm({
                title: "", value: "", stage: "NEW", priority: "MEDIUM",
                contactName: "", contactEmail: "", contactPhone: "", contactCompany: "",
                source: "DIRECT", notes: "", utmSource: "", utmMedium: "", utmCampaign: ""
            });
            setTimeout(() => { setSuccess(false); setOpen(false); router.refresh(); }, 1500);
        } catch {
            setError("Error inesperado al crear el negocio. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all";

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
            >
                <Plus className="w-4 h-4" /> Add Deal
            </button>

            {open && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => e.target === e.currentTarget && !loading && setOpen(false)}
                >
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white rounded-t-3xl px-8 pt-8 pb-4 border-b border-slate-50 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white flex-shrink-0 shadow-inner">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">Nuevo Deal</h2>
                                    <p className="text-xs text-slate-400">Agrega una oportunidad de negocio</p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} disabled={loading} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {success ? (
                            <div className="px-8 py-16 text-center">
                                <div className="text-5xl mb-4">🎉</div>
                                <h3 className="text-lg font-black text-slate-900">¡Deal Creado!</h3>
                                <p className="text-sm text-slate-400 mt-2">La oportunidad se agregó al Pipeline y el Lead fue sincronizado con éxito.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="px-8 pb-8 pt-5 space-y-6">
                                {/* Datos del Negocio (Específico de Deal) */}
                                <div>
                                    <p className="text-xs font-black text-violet-500 uppercase tracking-wider mb-3">🎯 Datos del Negocio</p>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600">Título del Deal</label>
                                                <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="(Auto-generado)" className={inputCls} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600">Valor Estimado ($)</label>
                                                <input type="number" min="0" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="0.00" className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600">Etapa Inicial</label>
                                                <select value={form.stage} onChange={(e) => set("stage", e.target.value)} className={inputCls}>
                                                    <option value="NEW">New Lead</option>
                                                    <option value="CONTACTED">Contacted</option>
                                                    <option value="PROPOSAL">Proposal</option>
                                                    <option value="NEGOTIATION">Negotiation</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600">Prioridad</label>
                                                <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={inputCls}>
                                                    <option value="LOW">Low</option>
                                                    <option value="MEDIUM">Medium</option>
                                                    <option value="HIGH">High</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Datos de contacto (Idéntico a Lead) */}
                                <div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">📋 Info de Contacto</p>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600">Nombre</label>
                                                <input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Ana García" className={inputCls} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600">Empresa</label>
                                                <input value={form.contactCompany} onChange={(e) => set("contactCompany", e.target.value)} placeholder="Mi Empresa S.A.S" className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-600">Email <span className="text-red-400">*</span></label>
                                            <input type="email" required value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} onBlur={handleEmailBlur} placeholder="ana@empresa.com" className={inputCls} />
                                            {duplicate && (
                                                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                                    <span className="text-amber-800">Lead Existente: <strong>{duplicate.leadName ?? duplicate.leadId}</strong></span>
                                                    <Link href={`/dashboard/admin/crm/leads/${duplicate.leadId}`} onClick={() => setOpen(false)} className="ml-auto font-bold text-violet-600 hover:underline">Ver →</Link>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-600">WhatsApp / Teléfono</label>
                                            <input type="tel" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+57 300 000 0000" className={inputCls} />
                                        </div>
                                    </div>
                                </div>

                                {/* Fuente */}
                                <div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">🌐 Fuente de Origen</p>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-600">¿De dónde viene este negocio? <span className="text-red-400">*</span></label>
                                        <select required value={form.source} onChange={(e) => set("source", e.target.value)} className={inputCls}>
                                            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Mensaje */}
                                <div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">💬 Requerimiento / Notas</p>
                                    <textarea
                                        value={form.notes} onChange={(e) => set("notes", e.target.value)}
                                        rows={3} placeholder="¿Qué necesita o qué cotización pidió?..."
                                        className={`${inputCls} resize-none`}
                                    />
                                </div>

                                {/* UTMs (collapsible) */}
                                <details className="group">
                                    <summary className="text-xs font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none flex items-center gap-2">
                                        <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                                        📊 UTM / Atribución (opcional)
                                    </summary>
                                    <div className="mt-3 grid grid-cols-3 gap-3">
                                        {[
                                            { key: "utmSource", label: "UTM Source", placeholder: "google" },
                                            { key: "utmMedium", label: "UTM Medium", placeholder: "cpc" },
                                            { key: "utmCampaign", label: "UTM Campaign", placeholder: "brand-q1" },
                                        ].map((f) => (
                                            <div key={f.key} className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600">{f.label}</label>
                                                <input value={form[f.key as keyof typeof form]} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} className={inputCls} />
                                            </div>
                                        ))}
                                    </div>
                                </details>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        type="button" onClick={() => setOpen(false)} disabled={loading}
                                        className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit" disabled={loading}
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:from-violet-700 hover:to-fuchsia-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-violet-200 disabled:opacity-50"
                                    >
                                        {loading ? "Guardando..." : "Agregar Deal ✓"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
