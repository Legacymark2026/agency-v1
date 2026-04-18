"use client";

import { useState } from "react";
import { createScoringRule, deleteScoringRule, toggleScoringRule, recalculateAllScores } from "@/actions/crm-advanced";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, ToggleLeft, ToggleRight, RefreshCw, Zap } from "lucide-react";

interface Rule {
    id: string; name: string; field: string; operator: string;
    value: string | null; points: number; active: boolean;
}

const FIELDS = [
    // Identity & Source
    { value: "phone", label: "Tiene teléfono" },
    { value: "company", label: "Tiene empresa" },
    { value: "source", label: "Fuente del lead" },
    { value: "message", label: "Tiene mensaje" },
    { value: "utmCampaign", label: "Viene de campaña" },
    { value: "jobTitle", label: "Tiene cargo" },
    { value: "score", label: "Score actual" },

    // Profile (from Form Data)
    { value: "formData.companySize", label: "Perfil: Tamaño de la empresa" },
    { value: "formData.sector", label: "Perfil: Sector o Industria" },
    { value: "formData.budget", label: "Perfil: Presupuesto" },

    // Interaction Level
    { value: "events.website_visits", label: "Interacción: Visitas web" },
    { value: "events.email_opens", label: "Interacción: Correos abiertos" },
    { value: "events.downloads", label: "Interacción: Descargas de contenido" },
    { value: "events.webinars", label: "Interacción: Asistencia a eventos/webinars" },

    // Intent
    { value: "events.quote_requests", label: "Intención: Solicitud de cotización" },
    { value: "events.demos", label: "Intención: Demo programada" },
    { value: "events.pricing_visits", label: "Intención: Visitas a página de precios" },
];

const OPERATORS: Record<string, string[]> = {
    phone: ["exists"],
    company: ["exists", "contains"],
    source: ["equals", "in"],
    message: ["exists", "contains"],
    utmCampaign: ["exists", "equals"],
    jobTitle: ["exists", "contains"],
    score: ["greaterThan", "lessThan"],

    // Profile
    "formData.companySize": ["exists", "equals", "contains"],
    "formData.sector": ["exists", "equals", "contains", "in"],
    "formData.budget": ["exists", "greaterThan", "lessThan", "contains"],

    // Interaction & Intent (Numeric counts)
    "events.website_visits": ["greaterThan", "lessThan", "equals"],
    "events.email_opens": ["greaterThan", "lessThan", "equals"],
    "events.downloads": ["greaterThan", "lessThan", "equals"],
    "events.webinars": ["greaterThan", "lessThan", "equals"],
    "events.quote_requests": ["greaterThan", "lessThan", "equals"],
    "events.demos": ["greaterThan", "lessThan", "equals"],
    "events.pricing_visits": ["greaterThan", "lessThan", "equals"],
};

const OPERATOR_LABELS: Record<string, string> = {
    exists: "Existe / no vacío", equals: "Es igual a", contains: "Contiene",
    greaterThan: "Mayor que", lessThan: "Menor que", in: "Está en la lista (separar ,)",
};

interface Props { rules: Rule[]; companyId: string; }

export function ScoringRulesClient({ rules: initial, companyId }: Props) {
    const router = useRouter();
    const [rules, setRules] = useState(initial);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [recalcResult, setRecalcResult] = useState<string>("");
    const [form, setForm] = useState({ name: "", field: "phone", operator: "exists", value: "", points: "10" });

    const set = (k: string, v: string) => {
        const updated = { ...form, [k]: v };
        if (k === "field") updated.operator = OPERATORS[v]?.[0] ?? "exists";
        setForm(updated);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setCreating(true);
        const result = await createScoringRule({
            name: form.name, field: form.field, operator: form.operator,
            value: form.operator === "exists" ? undefined : form.value || undefined,
            points: parseInt(form.points), companyId,
        });
        setCreating(false);
        if ("success" in result) {
            setShowCreate(false);
            setForm({ name: "", field: "phone", operator: "exists", value: "", points: "10" });
            router.refresh();
        }
    };

    const handleToggle = async (id: string) => {
        setRules((prev) => prev.map((r) => r.id === id ? { ...r, active: !r.active } : r));
        await toggleScoringRule(id);
    };

    const handleDelete = async (id: string) => {
        setRules((prev) => prev.filter((r) => r.id !== id));
        await deleteScoringRule(id);
    };

    const handleRecalc = async () => {
        setRecalculating(true); setRecalcResult("");
        const result = await recalculateAllScores(companyId);
        setRecalculating(false);
        if ("updated" in result) setRecalcResult(`✓ ${result.updated} leads actualizados`);
        else setRecalcResult("Error al recalcular");
        setTimeout(() => setRecalcResult(""), 3000);
    };

    const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400";

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    {recalcResult && <span className="text-sm font-bold text-emerald-600">{recalcResult}</span>}
                    <button onClick={handleRecalc} disabled={recalculating} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${recalculating ? "animate-spin" : ""}`} /> Recalcular Todos
                    </button>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200">
                    <Plus className="w-4 h-4" /> Nueva Regla
                </button>
            </div>

            {/* Rules Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Regla</th>
                            <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Condición</th>
                            <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Puntos</th>
                            <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Estado</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {rules.map((rule) => (
                            <tr key={rule.id} className={`hover:bg-slate-50 transition-colors ${!rule.active ? "opacity-50" : ""}`}>
                                <td className="px-5 py-4 font-semibold text-slate-900 text-sm">{rule.name}</td>
                                <td className="px-5 py-4 text-sm text-slate-600">
                                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{rule.field}</span>
                                    <span className="mx-2 text-slate-400">{OPERATOR_LABELS[rule.operator] ?? rule.operator}</span>
                                    {rule.value && <span className="font-mono text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">{rule.value}</span>}
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`text-sm font-black ${rule.points >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                        {rule.points >= 0 ? "+" : ""}{rule.points} pts
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <button onClick={() => handleToggle(rule.id)} className="transition-colors">
                                        {rule.active ? <ToggleRight className="w-6 h-6 text-teal-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}
                                    </button>
                                </td>
                                <td className="px-5 py-4">
                                    <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {rules.length === 0 && (
                            <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">
                                No hay reglas aún. Crea la primera para empezar a calificar leads automáticamente.
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Dialog */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" />Nueva Regla de Scoring</h2>
                            <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">Nombre de la regla *</label>
                                <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Ej: Tiene teléfono" className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">Campo a evaluar</label>
                                <select value={form.field} onChange={(e) => set("field", e.target.value)} className={inputCls}>
                                    {FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">Operador</label>
                                <select value={form.operator} onChange={(e) => set("operator", e.target.value)} className={inputCls}>
                                    {(OPERATORS[form.field] ?? ["exists"]).map((op) => (
                                        <option key={op} value={op}>{OPERATOR_LABELS[op] ?? op}</option>
                                    ))}
                                </select>
                            </div>
                            {form.operator !== "exists" && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600">Valor *</label>
                                    <input value={form.value} onChange={(e) => set("value", e.target.value)} placeholder={form.operator === "in" ? "GOOGLE,FACEBOOK,INSTAGRAM" : "Valor..."} className={inputCls} />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">Puntos (negativo = penalización)</label>
                                <input type="number" value={form.points} onChange={(e) => set("points", e.target.value)} className={inputCls} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm">Cancelar</button>
                                <button type="submit" disabled={creating} className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-50">
                                    {creating ? "Guardando…" : "Guardar Regla ✓"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
