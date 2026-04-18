"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Mail, MessageSquare, Zap, Slack, Check, Loader2, Save } from "lucide-react";
import { getNotificationPreferences, updateNotificationPreference, getNotificationEvents } from "@/actions/developer";
import { toast } from "sonner";

const CHANNELS = [
    { key: "EMAIL", label: "Email", icon: <Mail className="w-3.5 h-3.5" /> },
    { key: "WHATSAPP", label: "WhatsApp", icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { key: "PUSH", label: "Push", icon: <Zap className="w-3.5 h-3.5" /> },
    { key: "SLACK", label: "Slack", icon: <Slack className="w-3.5 h-3.5" /> },
];

const DIGEST_OPTIONS = [
    { value: "IMMEDIATE", label: "Inmediato" },
    { value: "DAILY", label: "Diario" },
    { value: "WEEKLY", label: "Semanal" },
];

function MatrixCell({ event, channel, pref, onUpdate }: {
    event: string; channel: string;
    pref: { enabled: boolean; digest: string };
    onUpdate: (ev: string, ch: string, enabled: boolean, digest: string) => void;
}) {
    const [saving, setSaving] = useState(false);

    const toggle = async () => {
        setSaving(true);
        await onUpdate(event, channel, !pref.enabled, pref.digest);
        setSaving(false);
    };

    return (
        <td className="py-3 px-3 text-center">
            <button
                onClick={toggle}
                disabled={saving}
                className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center mx-auto ${pref.enabled
                    ? "bg-teal-500/20 border-teal-500/50 text-teal-400"
                    : "bg-slate-900 border-slate-700 text-slate-600 hover:border-slate-600"
                    }`}
            >
                {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : pref.enabled ? (
                    <Check className="w-3.5 h-3.5" />
                ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                )}
            </button>
        </td>
    );
}

export default function NotificationsPage() {
    const [matrix, setMatrix] = useState<Record<string, Record<string, { enabled: boolean; digest: string }>>>({});
    const [events, setEvents] = useState<{ key: string; label: string; group: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        const res = await getNotificationPreferences();
        if (res.success) {
            setMatrix(res.data as any);
            setEvents(res.events as any);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleUpdate = async (event: string, channel: string, enabled: boolean, digest: string) => {
        const res = await updateNotificationPreference(event, channel, enabled, digest);
        if (res.success) {
            setMatrix(prev => ({
                ...prev,
                [event]: { ...prev[event], [channel]: { enabled, digest } },
            }));
        } else {
            toast.error("No se pudo guardar la preferencia. Intenta de nuevo.");
        }
    };

    const groups = [...new Set(events.map(e => e.group))];

    const handleEnableAll = async (channel: string, enabled: boolean) => {
        setIsSaving(true);
        await Promise.all(
            events.map(e => updateNotificationPreference(e.key, channel, enabled, matrix[e.key]?.[channel]?.digest || "IMMEDIATE"))
        );
        await load();
        setIsSaving(false);
        toast.success(enabled ? `${channel}: todas las notificaciones activadas` : `${channel}: todas desactivadas`);
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono mb-3">
                    <Bell className="w-3.5 h-3.5" /> CENTRO DE NOTIFICACIONES
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Notificaciones & Alertas</h2>
                <p className="text-slate-400 text-sm mt-1">
                    Controla qué eventos te notifican y por qué canal. Los cambios se guardan automáticamente.
                </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-teal-500/20 border border-teal-500/50 flex items-center justify-center">
                        <Check className="w-3 h-3 text-teal-400" />
                    </div>
                    <span>Notificación activa</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-slate-900 border border-slate-700" />
                    <span>Desactivada</span>
                </div>
                <div className="text-slate-600">• Cambios guardados automáticamente al hacer clic</div>
            </div>

            {/* Matrix Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                </div>
            ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left px-5 py-4 text-xs text-slate-500 font-semibold uppercase tracking-wider w-64">Evento</th>
                                    {CHANNELS.map(ch => (
                                        <th key={ch.key} className="text-center px-3 py-4 w-24">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
                                                    {ch.icon} {ch.label}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleEnableAll(ch.key, true)} disabled={isSaving}
                                                        className="text-xs text-teal-500 hover:text-teal-400 font-mono transition-colors">ON</button>
                                                    <span className="text-slate-700">·</span>
                                                    <button onClick={() => handleEnableAll(ch.key, false)} disabled={isSaving}
                                                        className="text-xs text-slate-500 hover:text-red-400 font-mono transition-colors">OFF</button>
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {groups.map(group => (
                                    <>
                                        <tr key={`group-${group}`} className="bg-slate-950/40">
                                            <td colSpan={5} className="px-5 py-2">
                                                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">{group}</span>
                                            </td>
                                        </tr>
                                        {events.filter(e => e.group === group).map(event => (
                                            <tr key={event.key} className="hover:bg-slate-800/20 transition-colors">
                                                <td className="px-5 py-3">
                                                    <span className="text-slate-300 text-sm">{event.label}</span>
                                                </td>
                                                {CHANNELS.map(ch => (
                                                    <MatrixCell
                                                        key={`${event.key}-${ch.key}`}
                                                        event={event.key}
                                                        channel={ch.key}
                                                        pref={matrix[event.key]?.[ch.key] || { enabled: false, digest: "IMMEDIATE" }}
                                                        onUpdate={handleUpdate}
                                                    />
                                                ))}
                                            </tr>
                                        ))}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Channel Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    {
                        ch: "EMAIL",
                        title: "Configuración Email",
                        icon: <Mail className="w-4 h-4 text-blue-400" />,
                        fields: [{ label: "Email destino", placeholder: "tu@email.com", type: "email" }],
                    },
                    {
                        ch: "SLACK",
                        title: "Configuración Slack",
                        icon: <Slack className="w-4 h-4 text-violet-400" />,
                        fields: [{ label: "Webhook URL de Slack", placeholder: "https://hooks.slack.com/...", type: "url" }],
                    },
                ].map(cfg => (
                    <div key={cfg.ch} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                            {cfg.icon} {cfg.title}
                        </h3>
                        {cfg.fields.map(f => (
                            <div key={f.label}>
                                <label className="text-xs text-slate-500 block mb-1">{f.label}</label>
                                <input
                                    type={f.type}
                                    placeholder={f.placeholder}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                                />
                            </div>
                        ))}
                        <button className="mt-3 w-full px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <Save className="w-3 h-3" /> Guardar configuración
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
