"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Mail, MessageSquare, Zap, Slack, Check, Loader2, Save } from "lucide-react";
import { getNotificationPreferences, updateNotificationPreference, getNotificationEvents, getChannelConfigs, updateChannelConfig } from "@/actions/developer";
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
                className={`w-7 h-7 rounded-[0.15rem] border transition-all flex items-center justify-center mx-auto ${pref.enabled
                    ? "bg-[var(--ds-teal-dim)] border-[var(--ds-border-glow)] text-[var(--ds-teal-md)]"
                    : "bg-[var(--ds-surface-2)] border-[var(--ds-border)] text-[var(--ds-text-dim)] hover:border-[var(--ds-border-glow)] hover:text-[var(--ds-text-primary)]"
                    }`}
            >
                {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : pref.enabled ? (
                    <Check className="w-3.5 h-3.5" />
                ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--ds-text-muted)]" />
                )}
            </button>
        </td>
    );
}

function ChannelConfig({ cfg, initialValue }: { cfg: any, initialValue: string }) {
    const [value, setValue] = useState(initialValue);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const res = await updateChannelConfig(cfg.ch, value);
        setSaving(false);
        if (res.success) {
            toast.success(`${cfg.title} guardada exitosamente`);
        } else {
            toast.error(`No se pudo guardar la configuración de ${cfg.ch}`);
        }
    };

    return (
        <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[0.15rem] p-4 backdrop-blur-md">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--ds-text-primary)] mb-3">
                {cfg.icon} {cfg.title}
            </h3>
            {cfg.fields.map((f: any) => (
                <div key={f.label} className="space-y-1">
                    <label className="text-xs text-[var(--ds-text-muted)] block mb-1">{f.label}</label>
                    <input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        className="w-full bg-[var(--ds-surface-2)] border border-[var(--ds-border)] rounded-[0.15rem] px-3 py-2 text-sm text-[var(--ds-text-primary)] placeholder-[var(--ds-text-dim)] focus:outline-none focus:border-[var(--ds-teal-md)] transition-colors"
                    />
                </div>
            ))}
            <button 
                onClick={handleSave} 
                disabled={saving}
                className="mt-3 w-full px-3 py-2 text-xs bg-[var(--ds-surface-2)] hover:bg-[var(--ds-surface)] text-[var(--ds-text-secondary)] rounded-[0.15rem] border border-[var(--ds-border)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} 
                {saving ? "Guardando..." : "Guardar configuración"}
            </button>
        </div>
    );
}

export default function NotificationsPage() {
    const [matrix, setMatrix] = useState<Record<string, Record<string, { enabled: boolean; digest: string }>>>({});
    const [events, setEvents] = useState<{ key: string; label: string; group: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [configs, setConfigs] = useState<Record<string, string>>({});

    const load = useCallback(async () => {
        setIsLoading(true);
        const res = await getNotificationPreferences();
        if (res.success) {
            setMatrix(res.data as any);
            setEvents(res.events as any);
        }
        
        const cfgRes = await getChannelConfigs();
        if (cfgRes.success) {
            const cfgMap: Record<string, string> = {};
            for (const c of cfgRes.data) {
                const target = c.config ? (c.config as any).target : "";
                if (c.provider === "EMAIL_NOTIFICATIONS") cfgMap["EMAIL"] = target;
                if (c.provider === "SLACK_NOTIFICATIONS") cfgMap["SLACK"] = target;
            }
            setConfigs(cfgMap);
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
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[0.15rem] bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal-md)] text-xs font-mono mb-3">
                    <Bell className="w-3.5 h-3.5" /> CENTRO DE NOTIFICACIONES
                </div>
                <h2 className="text-2xl font-bold text-[var(--ds-text-primary)] tracking-tight">Notificaciones & Alertas</h2>
                <p className="text-[var(--ds-text-secondary)] text-sm mt-1">
                    Controla qué eventos te notifican y por qué canal. Los cambios se guardan automáticamente.
                </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-[var(--ds-text-muted)]">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-[0.15rem] bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] flex items-center justify-center">
                        <Check className="w-3 h-3 text-[var(--ds-teal-md)]" />
                    </div>
                    <span>Notificación activa</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-[0.15rem] bg-[var(--ds-surface-2)] border border-[var(--ds-border)]" />
                    <span>Desactivada</span>
                </div>
                <div className="text-[var(--ds-text-dim)]">• Cambios guardados automáticamente al hacer clic</div>
            </div>

            {/* Matrix Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-[var(--ds-teal)] animate-spin" />
                </div>
            ) : (
                <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-[0.15rem] overflow-hidden backdrop-blur-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--ds-border)]">
                                    <th className="text-left px-5 py-4 text-xs text-[var(--ds-text-muted)] font-semibold uppercase tracking-wider w-64">Evento</th>
                                    {CHANNELS.map(ch => (
                                        <th key={ch.key} className="text-center px-3 py-4 w-24">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center gap-1.5 text-[var(--ds-text-primary)] text-xs font-semibold">
                                                    {ch.icon} {ch.label}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleEnableAll(ch.key, true)} disabled={isSaving}
                                                        className="text-xs text-[var(--ds-teal)] hover:text-[var(--ds-teal-md)] font-mono transition-colors">ON</button>
                                                    <span className="text-[var(--ds-text-dim)]">·</span>
                                                    <button onClick={() => handleEnableAll(ch.key, false)} disabled={isSaving}
                                                        className="text-xs text-[var(--ds-text-muted)] hover:text-red-400 font-mono transition-colors">OFF</button>
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--ds-border)]/50">
                                {groups.map(group => (
                                    <>
                                        <tr key={`group-${group}`} className="bg-[var(--ds-surface-2)]/40">
                                            <td colSpan={5} className="px-5 py-2">
                                                <span className="text-xs font-mono font-bold text-[var(--ds-text-muted)] uppercase tracking-widest">{group}</span>
                                            </td>
                                        </tr>
                                        {events.filter(e => e.group === group).map(event => (
                                            <tr key={event.key} className="hover:bg-[var(--ds-surface-2)]/20 transition-colors">
                                                <td className="px-5 py-3">
                                                    <span className="text-[var(--ds-text-primary)] text-sm">{event.label}</span>
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
                    <ChannelConfig key={cfg.ch} cfg={cfg} initialValue={configs[cfg.ch] || ""} />
                ))}
            </div>
        </div>
    );
}
