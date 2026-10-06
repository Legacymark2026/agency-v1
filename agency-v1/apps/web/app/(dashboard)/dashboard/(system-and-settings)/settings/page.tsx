"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Shield, Globe, Bell, CreditCard, Users, Code2, Palette,
    Plug2, Key, Webhook, AlertTriangle, CheckCircle2, Activity,
    ArrowRight, Zap, Server, TrendingUp, Bot, Wand2, UserCheck,
    Building2, Sparkles, Sliders, FileText, Lock, Filter, Layers,
    ChevronRight, ArrowLeft
} from "lucide-react";
import { getSettingsOverview, getUsageStats, getIntegrationHealthDashboard } from "@/actions/developer";
import { SETTINGS_CATEGORIES, resolveActiveSettingsCategory } from "@/components/settings/settings-sidebar";

const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(n);
const pct = (val: number, limit: number) => Math.min(Math.round((val / limit) * 100), 100);

const STATUS_CFG: Record<string, { cls: string; dot: string; label: string }> = {
    OK: { cls: "text-emerald-400", dot: "bg-emerald-400", label: "OK" },
    DEGRADED: { cls: "text-amber-400", dot: "bg-amber-400", label: "DEGRADADO" },
    ERROR: { cls: "text-red-400", dot: "bg-red-400", label: "ERROR" },
    UNCONFIGURED: { cls: "text-slate-500", dot: "bg-slate-600", label: "NO CONFIG" },
};

export default function SettingsHubPage() {
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get("category");

    const [overview, setOverview] = useState<any>(null);
    const [usage, setUsage] = useState<any>(null);
    const [health, setHealth] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Active Category filtered from URL or tabs
    const [selectedTab, setSelectedTab] = useState<string>(() => {
        return categoryParam || "all";
    });

    useEffect(() => {
        if (categoryParam) {
            setSelectedTab(categoryParam);
        }
    }, [categoryParam]);

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

    // Filter categories strictly
    const filteredCategories = useMemo(() => {
        if (selectedTab === "all") {
            return SETTINGS_CATEGORIES;
        }
        return SETTINGS_CATEGORIES.filter(c => c.slug === selectedTab || c.code.toLowerCase() === selectedTab.toLowerCase());
    }, [selectedTab]);

    return (
        <div className="space-y-8 pb-12 max-w-5xl">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--ds-teal-dim)] border border-[var(--ds-border-glow)] text-[var(--ds-teal-md)] text-xs font-mono mb-3 shadow-[var(--ds-shadow-teal)]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>CENTRO DE CONTROL SaaS MULTI-TENANT</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white">
                    {selectedTab !== "all" && filteredCategories.length === 1 
                        ? filteredCategories[0].title 
                        : "Panel de Configuración Global"}
                </h1>
                <p className="text-[var(--ds-text-secondary)] text-sm mt-1 max-w-3xl leading-relaxed">
                    {selectedTab !== "all" && filteredCategories.length === 1 
                        ? filteredCategories[0].description
                        : "Navegación modular y parametrización de ajustes personales, gobernanza de empresa, áreas funcionales, inteligencia artificial y APIs seguras."}
                </p>
            </div>

            {/* STICKY TOP TAB MENU - STRICT CATEGORY SWITCH */}
            <div className="sticky top-0 z-30 pt-2 pb-3 bg-[var(--ds-bg)]/90 backdrop-blur-md border-b border-[var(--ds-border)]">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                    <button
                        onClick={() => setSelectedTab("all")}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                            selectedTab === "all"
                                ? "bg-[var(--ds-teal-dim)] border-[var(--ds-border-glow)] text-white shadow-[var(--ds-shadow-teal)]"
                                : "bg-[var(--ds-surface)] border-[var(--ds-border)] text-[var(--ds-text-secondary)] hover:text-white hover:bg-[var(--ds-surface-2)]"
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5 text-[var(--ds-teal-md)]" />
                        <span>Todas las Secciones</span>
                    </button>

                    {SETTINGS_CATEGORIES.map((cat) => {
                        const isSelected = selectedTab === cat.slug;
                        const CatIcon = cat.icon;
                        return (
                            <button
                                key={cat.code}
                                onClick={() => setSelectedTab(cat.slug)}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                                    isSelected
                                        ? "bg-slate-800 text-white border-teal-500/50 shadow-md font-bold"
                                        : "bg-[var(--ds-surface)] border-[var(--ds-border)] text-[var(--ds-text-secondary)] hover:text-white hover:bg-[var(--ds-surface-2)]"
                                }`}
                            >
                                <CatIcon className={`w-3.5 h-3.5 ${isSelected ? "text-teal-400" : "text-slate-400"}`} />
                                <span>{cat.title}</span>
                                <span className="text-[10px] opacity-60 font-mono">({cat.items.length})</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* If in 'all' view, display system KPIs, Usage & Integration overview */}
            {selectedTab === "all" && (
                <>
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
                </>
            )}

            {/* STRICT ISOLATED CATEGORY MODULES RENDERING */}
            <div className="space-y-10">
                {filteredCategories.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                        <div key={cat.code} className="space-y-4">
                            {/* Category Banner / Section Header */}
                            <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-1.5 rounded-lg border ${cat.color}`}>
                                        <CatIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                                            <span>{cat.title}</span>
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {cat.description}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border font-bold ${cat.color}`}>
                                    {cat.badge}
                                </span>
                            </div>

                            {/* Exclusive Module Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {cat.items.map((item) => {
                                    const ItemIcon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center gap-4 p-4 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl hover:border-teal-500/40 hover:bg-slate-900/80 transition-all duration-200 group shadow-sm hover:shadow-[0_0_20px_-5px_rgba(20,184,166,0.15)]"
                                        >
                                            <div className="p-3 bg-[var(--ds-bg-deep)] border border-[var(--ds-border)]/60 rounded-xl shrink-0 group-hover:scale-105 group-hover:border-teal-500/40 transition-all">
                                                <ItemIcon className="w-5 h-5 text-slate-300 group-hover:text-teal-400 transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors truncate">
                                                        {item.name}
                                                    </span>
                                                    {item.badge && (
                                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-teal-400 border border-slate-700 shrink-0">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 truncate mt-1">
                                                    {item.desc}
                                                </p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all shrink-0" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
