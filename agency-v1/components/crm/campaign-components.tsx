"use client";

import { useState } from "react";
import { createCampaign, updateCampaignStatus } from "@/actions/crm";
import { useRouter } from "next/navigation";
import { Plus, X, Pause, Play, CheckCircle } from "lucide-react";

const PLATFORMS = ["FACEBOOK", "GOOGLE", "INSTAGRAM", "LINKEDIN", "TIKTOK", "EMAIL", "SMS", "YOUTUBE", "OTRO"];

interface Props { companyId: string; }

export function CreateCampaignDialog({ companyId }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", code: "", platform: "GOOGLE", budget: "", startDate: "", endDate: "", description: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        const result = await createCampaign({ ...form, budget: form.budget ? parseFloat(form.budget) : undefined, companyId });
        setLoading(false);
        if ("error" in result) { setError(result.error ?? "Error al crear campaña"); return; }
        setOpen(false);
        setForm({ name: "", code: "", platform: "GOOGLE", budget: "", startDate: "", endDate: "", description: "" });
        router.refresh();
    };

    return (
        <>
            <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200">
                <Plus className="w-4 h-4" /> Nueva Campaña
            </button>

            {open && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Nueva Campaña</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Conecta leads, gasto y resultados</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nombre *</label>
                                    <input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value, code: e.target.value.toUpperCase().replace(/\s+/g, "-") }); }} required
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Ej: Campaña Leads Q1 2025" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Código</label>
                                    <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="CAMP-Q1-2025" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Plataforma *</label>
                                    <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                                        {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Presupuesto ($)</label>
                                    <input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Inicio</label>
                                    <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Fin</label>
                                    <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Descripción</label>
                                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" placeholder="Objetivo y contexto de la campaña..." />
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
                                <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 disabled:opacity-50 transition-colors">
                                    {loading ? "Creando…" : "Crear Campaña ✓"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

const STATUS_CONFIG = {
    ACTIVE: { label: "Activa", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <Play className="w-3 h-3" /> },
    PAUSED: { label: "Pausada", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: <Pause className="w-3 h-3" /> },
    COMPLETED: { label: "Completada", color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: <CheckCircle className="w-3 h-3" /> },
};

const PLATFORM_ICONS: Record<string, string> = { FACEBOOK: "📘", GOOGLE: "🔍", INSTAGRAM: "📷", LINKEDIN: "💼", TIKTOK: "🎵", EMAIL: "✉️", SMS: "💬", YOUTUBE: "🎥", OTRO: "🌐" };

interface Campaign { id: string; name: string; code: string; platform: string; status: string; budget: number | null; spend: number; impressions: number; clicks: number; conversions: number; leadCount: number; cpl: number; roas: number; ctr: number; startDate: Date | null; endDate: Date | null; }

export function CampaignRow({ campaign }: { campaign: Campaign }) {
    const router = useRouter();
    const cfg = STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.ACTIVE;

    const toggleStatus = async () => {
        const next = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
        await updateCampaignStatus(campaign.id, next as "ACTIVE" | "PAUSED" | "COMPLETED");
        router.refresh();
    };

    return (
        <tr className="hover:bg-slate-50 transition-colors border-b border-slate-50">
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="text-xl">{PLATFORM_ICONS[campaign.platform] ?? "🌐"}</span>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">{campaign.name}</p>
                        <p className="text-xs font-mono text-slate-400">{campaign.code}</p>
                    </div>
                </div>
            </td>
            <td className="px-5 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
            </td>
            <td className="px-5 py-4 text-sm text-slate-700 font-bold">{campaign.leadCount}</td>
            <td className="px-5 py-4 text-sm text-slate-600">{campaign.impressions.toLocaleString()}</td>
            <td className="px-5 py-4 text-sm text-slate-600">{campaign.clicks.toLocaleString()} <span className="text-xs text-slate-400">({campaign.ctr}%)</span></td>
            <td className="px-5 py-4">
                <span className={`text-sm font-bold ${campaign.roas >= 3 ? "text-emerald-600" : campaign.roas >= 1 ? "text-amber-600" : "text-red-500"}`}>
                    {campaign.roas}x
                </span>
            </td>
            <td className="px-5 py-4">
                <span className="text-sm font-bold text-slate-700">${campaign.cpl.toLocaleString()}</span>
            </td>
            <td className="px-5 py-4 text-sm text-slate-600">${(campaign.spend || 0).toLocaleString()}</td>
            <td className="px-5 py-4">
                <button onClick={toggleStatus} className={`p-2 rounded-xl ${campaign.status === "ACTIVE" ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"} transition-colors`}>
                    {campaign.status === "ACTIVE" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
            </td>
        </tr>
    );
}
