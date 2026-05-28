"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Shield, Globe, Bell, CreditCard, Users, Code2, Palette,
    Plug2, Key, Webhook, AlertTriangle, CheckCircle2, Activity,
    ArrowRight, Zap, Server, TrendingUp, RefreshCw
} from "lucide-react";
import { getSettingsOverview, getUsageStats, getIntegrationHealthDashboard } from "@/actions/developer";

const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(n);
const pct = (val: number, limit: number) => Math.min(Math.round((val / limit) * 100), 100);

const ORG_SECTIONS = [
    { href: "/dashboard/settings/company", icon: <Globe className="w-5 h-5 text-teal-400" />, label: "Empresa & Marca Blanca", desc: "Logo, dominio, datos fiscales y personalización de marca" },
    { href: "/dashboard/settings/members", icon: <Users className="w-5 h-5 text-emerald-400" />, label: "Equipo & Roles", desc: "Gestión de miembros, invitaciones y permisos de acceso" },
    { href: "/dashboard/admin/marketing/settings", icon: <Plug2 className="w-5 h-5 text-violet-400" />, label: "Biblioteca de Integraciones", desc: "Google, Meta, Stripe, Twilio, OpenAI y APIs" },
    { href: "/dashboard/settings/billing", icon: <CreditCard className="w-5 h-5 text-amber-400" />, label: "Facturación & Plan", desc: "Plan contratado, consumos de cuota, facturas y método de pago" },
    { href: "/dashboard/settings/developer", icon: <Code2 className="w-5 h-5 text-cyan-400" />, label: "Developer & API", desc: "Claves de API, webhooks y registros de solicitudes" },
];

const PERSONAL_SECTIONS = [
    { href: "/dashboard/settings/profile", icon: <Users className="w-5 h-5 text-blue-400" />, label: "Mi Perfil", desc: "Foto de perfil, datos públicos, idioma y zona horaria" },
    { href: "/dashboard/settings/notifications", icon: <Bell className="w-5 h-5 text-rose-400" />, label: "Notificaciones", desc: "Preferencias de alertas por Email, WhatsApp, Slack y Push" },
    { href: "/dashboard/settings/appearance", icon: <Palette className="w-5 h-5 text-pink-400" />, label: "Apariencia & UI", desc: "Temas visuales, colores de acento y densidad de interfaz" },
    { href: "/dashboard/settings/security", icon: <Shield className="w-5 h-5 text-red-400" />, label: "Seguridad y Auditoría", desc: "Autenticación 2FA, historial de sesiones y bitácora de seguridad" },
];

const STATUS_CFG: Record<string, { cls: string; dot: string; label: string }> = {
    OK: { cls: "text-emerald-400", dot: "bg-emerald-400", label: "OK" },
    DEGRADED: { cls: "text-amber-400", dot: "bg-amber-400", label: "DEGRADADO" },
    ERROR: { cls: "text-red-400", dot: "bg-red-400", label: "ERROR" },
    UNCONFIGURED: { cls: "text-slate-500", dot: "bg-slate-600", label: "NO CONFIG" },
};

export default function SettingsHubPage() {
    const [overview, setOverview] = useState<any>(null);
    const [usage, setUsage] = useState<any>(null);
    const [health, setHealth] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const [oRes, uRes, hRes] = await Promise.all([
            getSettingsOverview(),
            getUsageStats(),
            getIntegrationHealthDashboard(),
        ]);
        if (oRes.success) setOverview(oRes.data);
        if (uRes.success) setUsage(uRes.data);
        if (hRes.success) setHealth(hRes.data);
        setIsLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const healthyCount = health.filter(h => h.status === "OK").length;

    return (
        <div className="space-y-8 pb-10 max-w-5xl">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal-md)] text-xs font-mono mb-3">
                    <Activity className="w-3.5 h-3.5" />
                    <span>CENTRO DE CONTROL — CONFIGURACIÓN GLOBAL</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white">Panel de Configuración</h1>
                <p className="text-[var(--ds-text-secondary)] text-sm mt-1">Configura las propiedades de tu organización y tus preferencias de perfil personal.</p>
            </div>

            {/* Alerts */}
            {overview?.alerts?.length > 0 && (
                <div className="space-y-2">
                    {overview.alerts.map((alert: any, i: number) => (
                        <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${alert.type === "error"
                            ? "bg-red-500/10 border-red-500/20 text-red-300"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                            }`}>
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            {alert.message}
                        </div>
                    ))}
                </div>
            )}

            {/* System KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "API Keys Activas", value: overview?.apiKeyCount ?? "—", icon: <Key className="w-4 h-4" />, color: "text-[var(--ds-teal-md)] bg-[var(--ds-teal-dim)] border-[var(--ds-border-glow)]" },
                    { label: "Webhooks Activos", value: overview?.webhookCount ?? "—", icon: <Webhook className="w-4 h-4" />, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
                    { label: "Miembros del Equipo", value: overview?.memberCount ?? "—", icon: <Users className="w-4 h-4" />, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                    { label: "Integraciones OK", value: isLoading ? "—" : `${healthyCount}/${health.length}`, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                ].map((kpi, i) => (
                    <div key={i} className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl p-4 transition-all duration-300 hover:border-[var(--ds-border-glow)] hover:shadow-[var(--ds-shadow-teal)]">
                        <div className={`inline-flex items-center justify-center p-2 rounded-lg mb-3 border ${kpi.color}`}>{kpi.icon}</div>
                        <p className="text-xs text-[var(--ds-text-muted)] mb-1">{kpi.label}</p>
                        <p className="text-2xl font-bold text-[var(--ds-text-primary)] tabular-nums">{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Usage Meters */}
            {usage && (
                <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl p-5 transition-all duration-300 hover:border-[var(--ds-border-glow)] hover:shadow-[var(--ds-shadow-teal)]">
                    <h3 className="text-sm font-semibold text-[var(--ds-text-primary)] mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[var(--ds-teal-md)]" /> Consumo del Plan — Mes Actual
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: "API Calls", val: usage.apiCalls, limit: usage.limits.apiCalls, color: "bg-[var(--ds-teal)]" },
                            { label: "Leads", val: usage.leads, limit: usage.limits.leads, color: "bg-blue-500" },
                            { label: "Emails Enviados", val: usage.emailsSent, limit: usage.limits.emailsSent, color: "bg-violet-500" },
                            { label: "AI Tokens", val: usage.aiTokens, limit: usage.limits.aiTokens, color: "bg-amber-500" },
                        ].map((m, i) => {
                            const p = pct(m.val, m.limit);
                            return (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--ds-text-secondary)]">{m.label}</span>
                                        <span className="text-[var(--ds-text-primary)] tabular-nums">{fmt(m.val)} / {fmt(m.limit)}</span>
                                    </div>
                                    <div className="h-2 bg-[var(--ds-surface-2)] rounded-full overflow-hidden border border-[var(--ds-border)]/50">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${p >= 90 ? "bg-red-500" : p >= 75 ? "bg-amber-500" : m.color}`}
                                            style={{ width: `${p}%` }}
                                        />
                                    </div>
                                    <div className="text-right text-xs text-[var(--ds-text-muted)]">{p}% usado</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Integration Health Snapshot */}
            {health.length > 0 && (
                <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl p-5 transition-all duration-300 hover:border-[var(--ds-border-glow)] hover:shadow-[var(--ds-shadow-teal)]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-[var(--ds-text-primary)] flex items-center gap-2">
                            <Server className="w-4 h-4 text-blue-400" /> Estado de Integraciones
                        </h3>
                        <Link href="/dashboard/admin/marketing/settings" className="text-xs text-[var(--ds-teal-md)] hover:text-[var(--ds-teal-bright)] flex items-center gap-1">
                            Ver todas <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {health.slice(0, 5).map((h: any) => {
                            const cfg = STATUS_CFG[h.status] || STATUS_CFG.UNCONFIGURED;
                            return (
                                <div key={h.key} className="flex flex-col items-center gap-1.5 p-2.5 bg-[var(--ds-surface-2)]/60 rounded-lg border border-[var(--ds-border)]/60">
                                    <div className="flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                        <span className={`text-xs font-mono font-bold ${cfg.cls}`}>{cfg.label}</span>
                                    </div>
                                    <span className="text-[var(--ds-text-secondary)] text-xs text-center">{h.key}</span>
                                    {h.latencyMs && <span className="text-[var(--ds-text-muted)] text-xs">{h.latencyMs}ms</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Navigation Grid by Categories */}
            <div className="space-y-6">
                {/* 1. System/Organization Settings */}
                <div className="space-y-4">
                    <h3 className="text-xs font-mono font-bold text-[var(--ds-teal-md)] uppercase tracking-widest border-b border-[var(--ds-border)] pb-2">Configuración de la Organización</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ORG_SECTIONS.map(s => (
                            <Link key={s.href} href={s.href} className="flex items-center gap-4 p-4 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl hover:border-[var(--ds-border-glow)] hover:bg-[var(--ds-surface-2)]/60 transition-all group">
                                <div className="p-2.5 bg-[var(--ds-bg-deep)] border border-[var(--ds-border)]/50 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                                    {s.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-[var(--ds-text-primary)]">{s.label}</div>
                                    <div className="text-xs text-[var(--ds-text-muted)] truncate">{s.desc}</div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[var(--ds-text-muted)] group-hover:text-[var(--ds-teal-md)] group-hover:translate-x-0.5 transition-all shrink-0" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* 2. Personal Settings */}
                <div className="space-y-4 pt-4">
                    <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest border-b border-[var(--ds-border)] pb-2">Ajustes Personales de Cuenta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {PERSONAL_SECTIONS.map(s => (
                            <Link key={s.href} href={s.href} className="flex items-center gap-4 p-4 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl hover:border-[var(--ds-border-glow)] hover:bg-[var(--ds-surface-2)]/60 transition-all group">
                                <div className="p-2.5 bg-[var(--ds-bg-deep)] border border-[var(--ds-border)]/50 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                                    {s.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-[var(--ds-text-primary)]">{s.label}</div>
                                    <div className="text-xs text-[var(--ds-text-muted)] truncate">{s.desc}</div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-[var(--ds-text-muted)] group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
