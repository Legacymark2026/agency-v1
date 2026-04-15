"use client";

import { useState, useEffect } from "react";
import { X, Zap, Plus, Trash2, Loader2, PlayCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getSmartRules, saveSmartRules, SmartRule } from "@/actions/marketing/smart-rules";
import { v4 as uuidv4 } from "uuid";

type Props = {
    open: boolean;
    onClose: () => void;
    campaign: { id: string; name: string; spend: number; budget: number | null; conversions: number } | null;
};

const METRIC_OPTIONS: { value: SmartRule["metric"]; label: string }[] = [
    { value: "CPA", label: "CPA (Costo por Conversión)" },
    { value: "SPEND", label: "Gasto Total" },
    { value: "CTR", label: "CTR (%)" },
    { value: "ROAS", label: "ROAS" },
    { value: "IMPRESSIONS", label: "Impresiones" },
];

const OPERATOR_OPTIONS: { value: SmartRule["operator"]; label: string }[] = [
    { value: "gt", label: "es mayor que (>)" },
    { value: "lt", label: "es menor que (<)" },
    { value: "gte", label: "mayor o igual a (≥)" },
    { value: "lte", label: "menor o igual a (≤)" },
];

const ACTION_OPTIONS: { value: SmartRule["action"]; label: string; color: string }[] = [
    { value: "PAUSE", label: "Pausar Campaña", color: "text-red-400" },
    { value: "ALERT", label: "Enviar Alerta", color: "text-amber-400" },
    { value: "INCREASE_BUDGET", label: "Aumentar Presupuesto (%)", color: "text-emerald-400" },
    { value: "DECREASE_BUDGET", label: "Reducir Presupuesto (%)", color: "text-orange-400" },
];

const WINDOW_OPTIONS: { value: SmartRule["window"]; label: string }[] = [
    { value: 1, label: "Último día" },
    { value: 3, label: "Últimos 3 días" },
    { value: 7, label: "Últimos 7 días" },
];

export function SmartRulesDrawer({ open, onClose, campaign }: Props) {
    const [rules, setRules] = useState<SmartRule[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open && campaign) {
            setIsLoading(true);
            getSmartRules(campaign.id).then(r => {
                setRules(r);
                setIsLoading(false);
            });
        }
    }, [open, campaign]);

    const addRule = () => {
        setRules(prev => [
            ...prev,
            {
                id: uuidv4(),
                metric: "CPA",
                operator: "gt",
                threshold: 50,
                window: 3,
                action: "PAUSE",
                isActive: true,
                label: "Nueva Regla",
            }
        ]);
    };

    const updateRule = (id: string, updates: Partial<SmartRule>) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const removeRule = (id: string) => {
        setRules(prev => prev.filter(r => r.id !== id));
    };

    const handleSave = async () => {
        if (!campaign) return;
        setIsSaving(true);
        const res = await saveSmartRules(campaign.id, rules);
        setIsSaving(false);
        if (res.success) {
            toast.success("Reglas guardadas correctamente.");
            onClose();
        } else {
            toast.error(res.error);
        }
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]" onClick={onClose} />
            <div className="fixed top-0 right-0 h-full w-[560px] bg-slate-950 border-l border-slate-800 shadow-2xl z-[90] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
                    <div>
                        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" />
                            Smart Rules Engine
                        </h2>
                        <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[340px]">
                            {campaign?.name || "..."}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={18} />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40 text-slate-500">
                            <Loader2 className="animate-spin mr-2" /> Cargando reglas...
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                            <ShieldAlert className="w-10 h-10 mb-3 text-slate-700" />
                            <p className="text-sm font-medium">Sin reglas activas</p>
                            <p className="text-xs mt-1">Añade reglas para automatizar la gestión del presupuesto.</p>
                        </div>
                    ) : rules.map((rule, idx) => (
                        <div key={rule.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 relative group hover:border-amber-500/30 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                                    Regla #{idx + 1}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={rule.isActive}
                                        onCheckedChange={(v) => updateRule(rule.id, { isActive: v })}
                                        className="data-[state=checked]:bg-amber-500 scale-75"
                                    />
                                    <button onClick={() => removeRule(rule.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* IF condition */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] w-8 text-teal-400 font-mono font-bold">SI</span>
                                <select
                                    value={rule.metric}
                                    onChange={e => updateRule(rule.id, { metric: e.target.value as SmartRule["metric"] })}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                                >
                                    {METRIC_OPTIONS.map(m => (
                                        <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] w-8 text-teal-400 font-mono font-bold"></span>
                                <select
                                    value={rule.operator}
                                    onChange={e => updateRule(rule.id, { operator: e.target.value as SmartRule["operator"] })}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                                >
                                    {OPERATOR_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
                                    ))}
                                </select>
                                <Input
                                    type="number"
                                    value={rule.threshold}
                                    onChange={e => updateRule(rule.id, { threshold: parseFloat(e.target.value) })}
                                    className="w-24 bg-slate-950 border-slate-800 text-xs font-mono h-8"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] w-8 text-slate-500 font-mono font-bold">WIND.</span>
                                <select
                                    value={rule.window}
                                    onChange={e => updateRule(rule.id, { window: parseInt(e.target.value) as SmartRule["window"] })}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                                >
                                    {WINDOW_OPTIONS.map(w => (
                                        <option key={w.value} value={w.value} className="bg-slate-900">{w.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* THEN action */}
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                                <span className="text-[10px] w-8 text-indigo-400 font-mono font-bold">ACCIÓN</span>
                                <select
                                    value={rule.action}
                                    onChange={e => updateRule(rule.id, { action: e.target.value as SmartRule["action"] })}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                                >
                                    {ACTION_OPTIONS.map(a => (
                                        <option key={a.value} value={a.value} className="bg-slate-900">{a.label}</option>
                                    ))}
                                </select>
                                {(rule.action === "INCREASE_BUDGET" || rule.action === "DECREASE_BUDGET") && (
                                    <Input
                                        type="number"
                                        value={rule.actionValue ?? 15}
                                        onChange={e => updateRule(rule.id, { actionValue: parseFloat(e.target.value) })}
                                        className="w-20 bg-slate-950 border-slate-800 text-xs font-mono h-8"
                                        placeholder="%"
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-800 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={addRule}
                            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-mono text-xs gap-2 flex-1"
                        >
                            <Plus size={14} /> Añadir Regla
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs shadow-[0_0_15px_rgba(217,119,6,0.25)] gap-2 flex-1"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle size={14} />}
                            Guardar Reglas
                        </Button>
                    </div>
                    <p className="text-[10px] text-slate-600 font-mono text-center mt-3">
                        El motor evaluará las reglas cada hora vía Cron automáticamente.
                    </p>
                </div>
            </div>
        </>
    );
}
