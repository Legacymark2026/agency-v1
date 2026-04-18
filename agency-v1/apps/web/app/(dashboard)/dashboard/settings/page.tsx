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

const SECTIONS = [
    { href: "/dashboard/settings/company", icon: <Globe className="w-5 h-5 text-teal-400" />, label: "Empresa & Marca", desc: "Logo, dominio, datos fiscales, localización" },
    { href: "/dashboard/settings/security", icon: <Shield className="w-5 h-5 text-blue-400" />, label: "Seguridad", desc: "2FA, sesiones, IP whitelist, audit log" },
    { href: "/dashboard/settings/integrations", icon: <Plug2 className="w-5 h-5 text-violet-400" />, label: "Integraciones", desc: "Google, Meta, Stripe, Twilio, OpenAI y más" },
    { href: "/dashboard/settings/billing", icon: <CreditCard className="w-5 h-5 text-amber-400" />, label: "Facturación", desc: "Plan, uso, facturas, método de pago" },
    { href: "/dashboard/settings/members", icon: <Users className="w-5 h-5 text-emerald-400" />, label: "Equipo & Roles", desc: "Miembros, permisos RBAC, invitaciones" },
    { href: "/dashboard/settings/notifications", icon: <Bell className="w-5 h-5 text-rose-400" />, label: "Notificaciones", desc: "Email, WhatsApp, Push, Slack por evento" },
    { href: "/dashboard/settings/developer", icon: <Code2 className="w-5 h-5 text-cyan-400" />, label: "Developer & API", desc: "API keys, webhooks, request logs" },
    { href: "/dashboard/settings/appearance", icon: <Palette className="w-5 h-5 text-pink-400" />, label: "Apariencia", desc: "Tema, acento, densidad de UI" },
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

    const errorIntegrations = health.filter(h => h.status === "ERROR" || h.status === "DEGRADED");
    const healthyCount = health.filter(h => h.status === "OK").length;

    return (
        <div className="space-y-6 pb-10 max-w-5xl">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-mono mb-3">
                    <Activity className="w-3.5 h-3.5" />
                    <span>CENTRO DE CONTROL — CONFIGURACIÓN DEL SISTEMA</span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Panel de Configuración</h1>
                <p className="text-slate-400 text-sm mt-1">Visión general del sistema, alertas activas y acceso rápido a todos los módulos de configuración.</p>
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
                    { label: "API Keys Activas", value: overview?.apiKeyCount ?? "—", icon: <Key className="w-4 h-4" />, color: "text-teal-400 bg-teal-500/10" },
                    { label: "Webhooks Activos", value: overview?.webhookCount ?? "—", icon: <Webhook className="w-4 h-4" />, color: "text-violet-400 bg-violet-500/10" },
                    { label: "Miembros del Equipo", value: overview?.memberCount ?? "—", icon: <Users className="w-4 h-4" />, color: "text-blue-400 bg-blue-500/10" },
                    { label: "Integraciones OK", value: isLoading ? "—" : `${healthyCount}/${health.length}`, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400 bg-emerald-500/10" },
                ].map((kpi, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className={`inline-flex items-center justify-center p-2 rounded-lg mb-3 ${kpi.color}`}>{kpi.icon}</div>
                        <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
                        <p className="text-2xl font-bold text-white tabular-nums">{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Usage Meters */}
            {usage && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-teal-500" /> Consumo del Plan — Mes Actual
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: "API Calls", val: usage.apiCalls, limit: usage.limits.apiCalls, color: "bg-teal-500" },
                            { label: "Leads", val: usage.leads, limit: usage.limits.leads, color: "bg-blue-500" },
                            { label: "Emails Enviados", val: usage.emailsSent, limit: usage.limits.emailsSent, color: "bg-violet-500" },
                            { label: "AI Tokens", val: usage.aiTokens, limit: usage.limits.aiTokens, color: "bg-amber-500" },
                        ].map((m, i) => {
                            const p = pct(m.val, m.limit);
                            return (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">{m.label}</span>
                                        <span className="text-slate-300 tabular-nums">{fmt(m.val)} / {fmt(m.limit)}</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${p >= 90 ? "bg-red-500" : p >= 75 ? "bg-amber-500" : m.color}`}
                                            style={{ width: `${p}%` }}
                                        />
                                    </div>
                                    <div className="text-right text-xs text-slate-600">{p}% usado</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Integration Health Snapshot */}
            {health.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Server className="w-4 h-4 text-blue-400" /> Estado de Integraciones
                        </h3>
                        <Link href="/dashboard/settings/integrations" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                            Ver todas <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {health.slice(0, 10).map((h: any) => {
                            const cfg = STATUS_CFG[h.status] || STATUS_CFG.UNCONFIGURED;
                            return (
                                <div key={h.key} className="flex flex-col items-center gap-1.5 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
                                    <div className="flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                        <span className={`text-xs font-mono font-bold ${cfg.cls}`}>{cfg.label}</span>
                                    </div>
                                    <span className="text-slate-400 text-xs text-center">{h.key}</span>
                                    {h.latencyMs && <span className="text-slate-600 text-xs">{h.latencyMs}ms</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Navigation Grid */}
            <div>
                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-4">MÓDULOS DE CONFIGURACIÓN</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SECTIONS.map(s => (
                        <Link key={s.href} href={s.href} className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 hover:bg-slate-800/60 transition-all group">
                            <div className="p-2.5 bg-slate-950 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                                {s.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white">{s.label}</div>
                                <div className="text-xs text-slate-500 truncate">{s.desc}</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
