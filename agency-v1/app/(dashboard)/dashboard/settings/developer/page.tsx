"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Key, Plus, Copy, RotateCw, Trash2, ChevronDown, CheckCircle2, Clock, Webhook, Send, Activity, FileCode, ExternalLink, ChevronRight, X, Eye, EyeOff, AlertTriangle, Timer, RefreshCw, ShieldCheck } from "lucide-react";
import {
    getApiKeys, createApiKey, revokeApiKey, rotateApiKey,
    getWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook,
    getWebhookDeliveryLogs, getWebhookEvents, getApiUsageLogs,
    getCronSecret, saveCronSecret,
} from "@/actions/developer";
import { toast } from "sonner";

const SCOPE_OPTIONS = [
    "read:leads", "write:leads", "read:contacts", "write:contacts",
    "read:deals", "write:deals", "read:payroll", "write:payroll",
    "read:analytics", "manage:webhooks", "manage:team", "admin:full",
];

function ApiKeySection() {
    const [keys, setKeys] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read:leads", "read:contacts"]);
    const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [rotating, setRotating] = useState<string | null>(null);

    const load = useCallback(async () => {
        const res = await getApiKeys();
        if (res.success) setKeys(res.data);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async () => {
        if (!newKeyName.trim()) return toast.error("Escribe un nombre para la clave");
        setIsCreating(true);
        const res = await createApiKey(newKeyName, newKeyScopes, expiresInDays);
        setIsCreating(false);
        if (res.success) {
            setCreatedKey(res.key!);
            setShowCreate(false);
            setNewKeyName("");
            await load();
        } else {
            toast.error(res.error);
        }
    };

    const handleRevoke = async (id: string, name: string) => {
        if (!confirm(`¿Revocar la clave "${name}"? Esta acción no se puede deshacer.`)) return;
        const res = await revokeApiKey(id);
        if (res.success) { toast.success("Clave revocada"); load(); }
        else toast.error(res.error);
    };

    const handleRotate = async (id: string) => {
        setRotating(id);
        const res = await rotateApiKey(id);
        setRotating(null);
        if (res.success) { setCreatedKey(res.key!); await load(); toast.success("Clave rotada"); }
        else toast.error(res.error);
    };

    const copyKey = () => {
        if (!createdKey) return;
        navigator.clipboard.writeText(createdKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleScope = (scope: string) => {
        setNewKeyScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
    };

    const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-500/10 rounded-lg"><Key className="w-4 h-4 text-teal-400" /></div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Claves API</h3>
                        <p className="text-xs text-slate-500">Usa estas claves para autenticar peticiones a la API de LegacyMark.</p>
                    </div>
                </div>
                <button onClick={() => setShowCreate(v => !v)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-[0_0_12px_rgba(20,184,166,0.3)]">
                    <Plus className="w-3.5 h-3.5" /> Nueva Clave
                </button>
            </div>

            {/* One-time key reveal */}
            {createdKey && (
                <div className="p-4 bg-emerald-950/50 border-b border-emerald-500/30">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-emerald-400 font-semibold mb-2">¡Clave creada! Cópiala ahora, no la verás de nuevo.</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-slate-950 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 truncate">{createdKey}</code>
                                <button onClick={copyKey} className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${copied ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
                                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setCreatedKey(null)} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
                    </div>
                </div>
            )}

            {/* Create form */}
            {showCreate && (
                <div className="p-5 border-b border-slate-800 bg-slate-950/60 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Nombre de la clave *</label>
                            <input
                                value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                                placeholder="ej: Producción - Main App"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Vence en (días, opcional)</label>
                            <input
                                type="number" min={1} max={365}
                                value={expiresInDays ?? ""}
                                onChange={e => setExpiresInDays(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Sin vencimiento"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 mb-2 block">Permisos (Scopes)</label>
                        <div className="flex flex-wrap gap-2">
                            {SCOPE_OPTIONS.map(s => (
                                <button key={s} onClick={() => toggleScope(s)}
                                    className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${newKeyScopes.includes(s) ? "bg-teal-500/20 text-teal-300 border border-teal-500/40" : "bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600"}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
                        <button onClick={handleCreate} disabled={isCreating} className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors">
                            {isCreating ? "Creando..." : "Crear Clave"}
                        </button>
                    </div>
                </div>
            )}

            {/* Keys list */}
            <div className="divide-y divide-slate-800/50">
                {keys.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No hay claves API activas. Crea la primera.</div>
                ) : keys.map((k) => (
                    <div key={k.id} className="flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-slate-200">{k.name}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVA</span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <code className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">{k.prefix}••••••••••••••</code>
                                {k.expiresAt && (
                                    <span className="text-[10px] text-amber-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Vence {new Date(k.expiresAt).toLocaleDateString("es-CO")}
                                    </span>
                                )}
                                {k.lastUsedAt && (
                                    <span className="text-[10px] text-slate-600">Último uso: {new Date(k.lastUsedAt).toLocaleDateString("es-CO")}</span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {k.scopes.map((sc: string) => (
                                    <span key={sc} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{sc}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => handleRotate(k.id)} disabled={rotating === k.id}
                                className="p-1.5 text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors" title="Rotar clave">
                                <RotateCw className={`w-4 h-4 ${rotating === k.id ? "animate-spin" : ""}`} />
                            </button>
                            <button onClick={() => handleRevoke(k.id, k.name)}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Revocar">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


function CronConfigSection() {
    const [secret, setSecret] = useState("");
    const [isEnabled, setIsEnabled] = useState(false);
    const [hasSecret, setHasSecret] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [copied, setCopied] = useState(false);

    const domain = typeof window !== "undefined" ? window.location.origin : "https://tudominio.com";

    useEffect(() => {
        getCronSecret().then(res => {
            setHasSecret(res.hasSecret ?? false);
            setIsEnabled(res.isEnabled ?? false);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        if (!secret.trim()) return toast.error("Escribe una clave secreta");
        setSaving(true);
        const res = await saveCronSecret(secret.trim(), isEnabled);
        setSaving(false);
        if (res.success) {
            toast.success("Configuración guardada");
            setHasSecret(true);
            setSecret("");
        } else {
            toast.error(res.error ?? "Error al guardar");
        }
    };

    const cronUrl = `${domain}/api/crm/run-automation?secret=${secret || "TU_CRON_SECRET"}`;

    const copyUrl = () => {
        navigator.clipboard.writeText(cronUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-500/10 rounded-lg"><Timer className="w-4 h-4 text-teal-400" /></div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Automatización CRM · Cron Secret</h3>
                        <p className="text-xs text-slate-500">Protege el endpoint del motor de automatización y secuencias de email.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasSecret && <span className="flex items-center gap-1.5 text-xs text-emerald-400"><ShieldCheck className="w-3.5 h-3.5" />Configurado</span>}
                    <button
                        onClick={() => setIsEnabled(e => !e)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${isEnabled ? "bg-teal-500" : "bg-slate-700"}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isEnabled ? "translate-x-5" : ""}`} />
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Secret input */}
                <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">{hasSecret ? "Nueva clave (déjala vacía para mantener la actual)" : "Clave secreta *"}</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type={showSecret ? "text" : "password"}
                                value={secret}
                                onChange={e => setSecret(e.target.value)}
                                placeholder={hasSecret ? "••••••••••••••••" : "ej: crm2026SecretoLegacy"}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-teal-500 transition-colors pr-10"
                            />
                            <button onClick={() => setShowSecret(v => !v)} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300">
                                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <button
                            onClick={() => setSecret(`crm_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`)}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0" title="Generar aleatoria">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Preview URL */}
                <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">URL del Cron · (copiar en Railway / Vercel Cron)</label>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-teal-300 truncate">
                            {cronUrl}
                        </code>
                        <button onClick={copyUrl} className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${copied ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5">Configúralo para ejecutarse cada hora: <code className="text-slate-500">0 * * * *</code></p>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-[0_0_12px_rgba(20,184,166,0.2)]"
                    >
                        {saving ? "Guardando..." : "Guardar Configuración"}
                    </button>
                </div>
            </div>
        </div>
    );
}


function WebhookSection() {
    const [webhooks, setWebhooks] = useState<any[]>([]);
    const [events, setEvents] = useState<string[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: "", url: "", events: [] as string[] });
    const [testing, setTesting] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<Record<string, any>>({});
    const [logs, setLogs] = useState<any[]>([]);
    const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const load = useCallback(async () => {
        const [wRes, eRes] = await Promise.all([getWebhooks(), getWebhookEvents()]);
        if (wRes.success) setWebhooks(wRes.data);
        if (eRes.success) setEvents(eRes.events);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async () => {
        if (!form.name || !form.url) return toast.error("Completa nombre y URL");
        setIsSubmitting(true);
        const res = await createWebhook(form);
        setIsSubmitting(false);
        if (res.success) {
            toast.success(`Webhook creado. Secret: ${res.secret!.slice(0, 20)}...`);
            setShowCreate(false);
            setForm({ name: "", url: "", events: [] });
            load();
        } else toast.error(res.error);
    };

    const handleTest = async (id: string) => {
        setTesting(id);
        const res = await testWebhook(id);
        setTesting(null);
        setTestResult(prev => ({ ...prev, [id]: res }));
        if (res.testPassed) toast.success(`✅ HTTP ${res.statusCode} en ${res.durationMs}ms`);
        else toast.error(`❌ HTTP ${res.statusCode || "Error"} — conexión fallida`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este webhook?")) return;
        await deleteWebhook(id);
        toast.success("Webhook eliminado");
        load();
    };

    const toggleEvent = (ev: string) => {
        setForm(prev => ({
            ...prev,
            events: prev.events.includes(ev) ? prev.events.filter(e => e !== ev) : [...prev.events, ev],
        }));
    };

    const STATUS_DOT: Record<string, string> = {
        success: "bg-emerald-400",
        fail: "bg-red-400",
        default: "bg-slate-600",
    };

    const getStatusCode = (w: any) => w.lastStatusCode;
    const isSuccess = (code: number | null) => code && code >= 200 && code < 300;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-lg"><Webhook className="w-4 h-4 text-violet-400" /></div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Webhooks</h3>
                        <p className="text-xs text-slate-500">Recibe eventos en tiempo real cuando ocurran acciones en tu cuenta.</p>
                    </div>
                </div>
                <button onClick={() => setShowCreate(v => !v)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Nuevo Endpoint
                </button>
            </div>

            {showCreate && (
                <div className="p-5 border-b border-slate-800 bg-slate-950/60 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Nombre</label>
                            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="ej: Slack Notifier"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">URL *</label>
                            <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                                placeholder="https://hooks.example.com/..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 mb-2 block">Eventos a suscribir</label>
                        <div className="flex flex-wrap gap-2">
                            {events.map(ev => (
                                <button key={ev} onClick={() => toggleEvent(ev)}
                                    className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${form.events.includes(ev) ? "bg-violet-500/20 text-violet-300 border border-violet-500/40" : "bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600"}`}>
                                    {ev}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
                        <button onClick={handleCreate} disabled={isSubmitting} className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors">
                            {isSubmitting ? "Creando..." : "Crear Webhook"}
                        </button>
                    </div>
                </div>
            )}

            <div className="divide-y divide-slate-800/50">
                {webhooks.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No hay webhooks configurados.</div>
                ) : webhooks.map(w => (
                    <div key={w.id} className="p-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${isSuccess(getStatusCode(w)) ? "bg-emerald-400" : w.lastStatusCode ? "bg-red-400" : "bg-slate-600"}`} />
                                    <span className="text-sm font-medium text-slate-200">{w.name}</span>
                                    {w.deliveryCount > 0 && <span className="text-[10px] text-slate-500">{w.deliveryCount} entregas</span>}
                                    {w.failureCount > 0 && <span className="text-[10px] font-bold text-red-400">{w.failureCount} fallos</span>}
                                </div>
                                <code className="text-xs text-slate-400 font-mono">{w.url}</code>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {w.events.map((ev: string) => (
                                        <span key={ev} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{ev}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => handleTest(w.id)} disabled={testing === w.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50">
                                    <Send className={`w-3 h-3 ${testing === w.id ? "animate-pulse" : ""}`} />
                                    {testing === w.id ? "Enviando..." : "Test"}
                                </button>
                                <button onClick={() => handleDelete(w.id)}
                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        {testResult[w.id] && (
                            <div className={`mt-2 p-3 rounded-lg border text-xs font-mono ${testResult[w.id].testPassed ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-300" : "bg-red-950/40 border-red-500/20 text-red-300"}`}>
                                HTTP {testResult[w.id].statusCode || "---"} · {testResult[w.id].durationMs}ms
                                {testResult[w.id].responseBody && <div className="mt-1 text-slate-500 truncate">{testResult[w.id].responseBody}</div>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DeveloperPage() {
    return (
        <div className="space-y-6 pb-10">
            <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-3">
                    <Activity className="w-3.5 h-3.5" /> DEVELOPER CONSOLE
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Developer & API</h2>
                <p className="text-slate-400 text-sm mt-1">Gestiona claves API con scopes granulares, configura webhooks con entrega verificada y monitorea el uso.</p>
            </div>

            {/* Code snippets bar */}
            <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
                <FileCode className="w-4 h-4 text-slate-500 shrink-0" />
                <code className="text-xs text-slate-400 font-mono whitespace-nowrap">
                    <span className="text-slate-500">curl</span>{" "}
                    <span className="text-teal-400">-H</span>{" "}
                    <span className="text-amber-300">"Authorization: Bearer lm_live_•••"</span>{" "}
                    <span className="text-blue-400">https://api.legacymark.com/v1/leads</span>
                </code>
                <a href="#" className="ml-auto shrink-0 text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                    Docs <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            <ApiKeySection />
            <WebhookSection />
            <CronConfigSection />
        </div>
    );
}
