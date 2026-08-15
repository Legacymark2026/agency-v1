"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Shield, Globe, Bell, CreditCard, Users, Code2, Palette,
    Plug2, Key, Webhook, AlertTriangle, CheckCircle2, Activity,
    ArrowRight, Zap, Server, TrendingUp, Bot, Wand2, UserCheck,
    Building2, Sparkles, Sliders, FileText, Lock, Filter, Layers
} from "lucide-react";
import { getSettingsOverview, getUsageStats, getIntegrationHealthDashboard } from "@/actions/developer";

const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(n);
const pct = (val: number, limit: number) => Math.min(Math.round((val / limit) * 100), 100);

const PERSONAL_SECTIONS = [
    { href: "/dashboard/settings/profile", icon: <UserCheck className="w-5 h-5 text-blue-400" />, label: "Mi Perfil y Cuenta", desc: "Foto de perfil, datos públicos, idioma y zona horaria" },
    { href: "/dashboard/settings/appearance", icon: <Palette className="w-5 h-5 text-pink-400" />, label: "Apariencia & UI", desc: "Modos visuales (Oscuro/Claro), acento y densidad de pantalla" },
    { href: "/dashboard/settings/notifications", icon: <Bell className="w-5 h-5 text-rose-400" />, label: "Notificaciones Personales", desc: "Preferencias de alertas por Email, WhatsApp, Push e In-App" },
    { href: "/dashboard/settings/security", icon: <Shield className="w-5 h-5 text-red-400" />, label: "Seguridad Personal", desc: "Autenticación 2FA, contraseña y dispositivos activos" },
];

const ORG_SECTIONS = [
    { href: "/dashboard/settings/company", icon: <Globe className="w-5 h-5 text-teal-400" />, label: "Compañía & Marca Blanca", desc: "Logo, dominio CNAME, datos fiscales (RUT/NIT) y personalización" },
    { href: "/dashboard/settings/members", icon: <Users className="w-5 h-5 text-emerald-400" />, label: "Equipo & Colaboradores", desc: "Gestión de miembros, invitaciones y asignación de puestos" },
    { href: "/dashboard/settings/roles", icon: <Shield className="w-5 h-5 text-amber-400" />, label: "Roles & Permisos (RBAC)", desc: "Matriz de control de acceso por roles estándar y personalizados" },
    { href: "/dashboard/settings/billing", icon: <CreditCard className="w-5 h-5 text-violet-400" />, label: "Facturación & Plan B2B", desc: "Suscripción contratada, consumo de cuotas, facturas e historial" },
    { href: "/dashboard/admin/marketing/settings", icon: <Plug2 className="w-5 h-5 text-cyan-400" />, label: "Biblioteca de Integraciones", desc: "Conexiones empresariales: Meta, WhatsApp, Google, Stripe y Twilio" },
];

const AI_PLATFORM_SECTIONS = [
    { href: "/dashboard/settings/agents", icon: <Bot className="w-5 h-5 text-purple-400" />, label: "Agentes de IA", desc: "Configuración de agentes cognitivos asignados a la empresa" },
    { href: "/dashboard/voice", icon: <Wand2 className="w-5 h-5 text-emerald-400" />, label: "Voice Studio (Voicebox)", desc: "Estudio de voz por IA: clonación, síntesis expresiva y STT Whisper" },
    { href: "/dashboard/settings/inbox/macros", icon: <Sliders className="w-5 h-5 text-amber-400" />, label: "Macros & Atajos de Inbox", desc: "Respuestas automáticas, plantillas y etiquetas de conversación" },
];

const ENTERPRISE_DEV_SECTIONS = [
    { href: "/dashboard/settings/developer", icon: <Code2 className="w-5 h-5 text-sky-400" />, label: "Developer & API Keys", desc: "Claves de API de la organización, Webhooks e historial de peticiones" },
    { href: "/dashboard/settings/audit-logs", icon: <FileText className="w-5 h-5 text-emerald-400" />, label: "Bitácora de Auditoría", desc: "Registro inalterable de actividad, accesos y cambios en la organización" },
    { href: "/dashboard/settings/privacy", icon: <Lock className="w-5 h-5 text-amber-400" />, label: "Privacidad & Cumplimiento", desc: "Políticas GDPR/Habeas Data, retención de datos y solicitudes de borrado" },
];

const STATUS_CFG: Record<string, { cls: string; dot: string; label: string }> = {
    OK: { cls: "text-emerald-400", dot: "bg-emerald-400", label: "OK" },
    DEGRADED: { cls: "text-amber-400", dot: "bg-amber-400", label: "DEGRADADO" },
    ERROR: { cls: "text-red-400", dot: "bg-red-400", label: "ERROR" },
    UNCONFIGURED: { cls: "text-slate-500", dot: "bg-slate-600", label: "NO CONFIG" },
};

const CATEGORIES_NAV = [
    { id: "all", label: "Todas las Secciones", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "user", label: "Usuario", icon: <UserCheck className="w-3.5 h-3.5" />, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
    { id: "org", label: "Organización", icon: <Globe className="w-3.5 h-3.5" />, color: "text-teal-400 border-teal-500/30 bg-teal-500/10" },
    { id: "ai", label: "IA & Canales", icon: <Bot className="w-3.5 h-3.5" />, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
    { id: "dev", label: "Enterprise & APIs", icon: <Code2 className="w-3.5 h-3.5" />, color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
];

export default function SettingsHubPage() {
    const [overview, setOverview] = useState<any>(null);
    const [usage, setUsage] = useState<any>(null);
    const [health, setHealth] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");

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
        <div className="space-y-8 pb-12 max-w-5xl">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal-md)] text-xs font-mono mb-3 shadow-[var(--ds-shadow-teal)]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>CENTRO DE CONTROL SaaS MULTI-TENANT</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white">Panel de Configuración Global</h1>
                <p className="text-[var(--ds-text-secondary)] text-sm mt-1">
                    Gestiona tu perfil de usuario, los parámetros de tu empresa, los motores de Inteligencia Artificial y las APIs empresariales.
                </p>
            </div>

            {/* STICKY TOP TAB MENU */}
            <div className="sticky top-0 z-30 pt-2 pb-3 bg-[var(--ds-bg)]/90 backdrop-blur-md border-b border-[var(--ds-border)]">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                    {CATEGORIES_NAV.map((tab) => {
                        const isSelected = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                                    isSelected
                                        ? "bg-[var(--ds-teal-dim)] border-[var(--ds-border-glow)] text-white shadow-[var(--ds-shadow-teal)]"
                                        : "bg-[var(--ds-surface)] border-[var(--ds-border)] text-[var(--ds-text-secondary)] hover:text-white hover:bg-[var(--ds-surface-2)]"
                                }`}
                            >
                                <span className={tab.color || "text-[var(--ds-teal-md)]"}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
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
                        <TrendingUp className="w-4 h-4 text-[var(--ds-teal-md)]" /> Consumo del Plan de Empresa — Mes Actual
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
                            <Server className="w-4 h-4 text-blue-400" /> Estado de Conexiones e Integraciones
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

            {/* Categorized SaaS Navigation */}
            <div className="space-y-8">
                {/* CATEGORÍA 1: AJUSTES PERSONALES (Nivel Usuario) */}
                {(activeTab === "all" || activeTab === "user") && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-2">
                            <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <span>Ajustes Personales de Cuenta</span>
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
                                NIVEL USUARIO
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {PERSONAL_SECTIONS.map(s => (
                                <Link key={s.href} href={s.href} className="flex items-center gap-4 p-4 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl hover:border-blue-500/40 hover:bg-[var(--ds-surface-2)]/60 transition-all group">
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
                )}

                {/* CATEGORÍA 2: CONFIGURACIÓN DE EMPRESA (Nivel Tenant) */}
                {(activeTab === "all" || activeTab === "org") && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-2">
                            <h3 className="text-xs font-mono font-bold text-[var(--ds-teal-md)] uppercase tracking-widest flex items-center gap-2">
                                <span>Configuración de la Organización</span>
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal-md)] font-semibold">
                                NIVEL ORGANIZACIÓN / TENANT
                            </span>
                        </div>
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
                )}

                {/* CATEGORÍA 3: IA & CANALES (Nivel Plataforma & Infraestructura) */}
                {(activeTab === "all" || activeTab === "ai") && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-2">
                            <h3 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                <span>Motor de Inteligencia Artificial & Canales</span>
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold">
                                TECNOLOGÍA IA
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {AI_PLATFORM_SECTIONS.map(s => (
                                <Link key={s.href} href={s.href} className="flex items-center gap-4 p-4 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl hover:border-purple-500/40 hover:bg-[var(--ds-surface-2)]/60 transition-all group">
                                    <div className="p-2.5 bg-[var(--ds-bg-deep)] border border-[var(--ds-border)]/50 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                                        {s.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-[var(--ds-text-primary)]">{s.label}</div>
                                        <div className="text-xs text-[var(--ds-text-muted)] truncate">{s.desc}</div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-[var(--ds-text-muted)] group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* CATEGORÍA 4: SEGURIDAD ENTERPRISE & DESARROLLADOR */}
                {(activeTab === "all" || activeTab === "dev") && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-2">
                            <h3 className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest flex items-center gap-2">
                                <span>Seguridad Enterprise & Desarrollador</span>
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold">
                                INFRAESTRUCTURA & APIs
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {ENTERPRISE_DEV_SECTIONS.map(s => (
                                <Link key={s.href} href={s.href} className="flex items-center gap-4 p-4 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-xl hover:border-sky-500/40 hover:bg-[var(--ds-surface-2)]/60 transition-all group">
                                    <div className="p-2.5 bg-[var(--ds-bg-deep)] border border-[var(--ds-border)]/50 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                                        {s.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-[var(--ds-text-primary)]">{s.label}</div>
                                        <div className="text-xs text-[var(--ds-text-muted)] truncate">{s.desc}</div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-[var(--ds-text-muted)] group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
