"use client";

import { useState } from "react";
import {
    Shield, Lock, Key, Globe, FileText, CheckCircle2, AlertTriangle,
    Save, Building2, UserCheck, RefreshCw, Sparkles, ShieldAlert
} from "lucide-react";

export default function PrivacyCompliancePage() {
    const [gdprEnabled, setGdprEnabled] = useState(true);
    const [retentionDays, setRetentionDays] = useState(365);
    const [ssoProvider, setSsoProvider] = useState("google");
    const [saved, setSaved] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="space-y-8 pb-12 max-w-5xl mx-auto px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="border-b border-[var(--ds-border)] pb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono mb-2">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>CUMPLIMIENTO NORMATIVO & SSO ENTERPRISE</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                    <Lock className="w-8 h-8 text-amber-400" />
                    Privacidad, GDPR / Habeas Data & SSO
                </h1>
                <p className="text-[var(--ds-text-secondary)] text-sm mt-1">
                    Gestiona la política de retención de datos, cumplimiento de privacidad y autenticación unificada (SSO SAML 2.0).
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* 1. Cumplimiento GDPR / Habeas Data */}
                <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-4">
                        <div>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-amber-400" />
                                Cumplimiento de Privacidad (GDPR & Habeas Data Ley 1581)
                            </h3>
                            <p className="text-xs text-[var(--ds-text-muted)] mt-0.5">
                                Reglas de tratamiento de datos personales de clientes y prospectos registrados.
                            </p>
                        </div>
                        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                            ACTIVO
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-white">Retención Automática de Datos (Días)</label>
                            <select
                                value={retentionDays}
                                onChange={(e) => setRetentionDays(Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-xs text-white focus:outline-none"
                            >
                                <option value={180}>180 Días (6 Meses)</option>
                                <option value={365}>365 Días (1 Año - Recomendado)</option>
                                <option value={730}>730 Días (2 Años)</option>
                                <option value={1825}>1825 Días (5 Años)</option>
                            </select>
                            <p className="text-[10px] text-[var(--ds-text-muted)]">
                                Los registros inactivos que superen este período se anonimizarán automáticamente.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-white">Derecho al Olvido & Borrado Seguro</label>
                            <div className="p-3 rounded-xl bg-[var(--ds-surface-2)] border border-[var(--ds-border)] text-xs text-[var(--ds-text-secondary)] flex items-center justify-between">
                                <span>Permitir solicitud de eliminación por parte del titular</span>
                                <input
                                    type="checkbox"
                                    checked={gdprEnabled}
                                    onChange={(e) => setGdprEnabled(e.target.checked)}
                                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Autenticación SSO / SAML 2.0 */}
                <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-4">
                        <div>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Key className="w-5 h-5 text-sky-400" />
                                Autenticación Unificada Corporativa (SSO / SAML 2.0)
                            </h3>
                            <p className="text-xs text-[var(--ds-text-muted)] mt-0.5">
                                Permite a los empleados iniciar sesión utilizando las credenciales de tu proveedor de identidad corporativo.
                            </p>
                        </div>
                        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold">
                            ENTERPRISE
                        </span>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-semibold text-white">Proveedor de Identidad (IdP)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { id: "google", name: "Google Workspace", icon: "🌐" },
                                { id: "okta", name: "Okta Identity", icon: "🔐" },
                                { id: "azure", name: "Microsoft Azure AD", icon: "🏢" },
                            ].map((provider) => (
                                <button
                                    key={provider.id}
                                    type="button"
                                    onClick={() => setSsoProvider(provider.id)}
                                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                                        ssoProvider === provider.id
                                            ? "bg-sky-500/20 border-sky-500 text-white shadow-lg"
                                            : "bg-[var(--ds-surface-2)] border-[var(--ds-border)] text-[var(--ds-text-secondary)] hover:text-white"
                                    }`}
                                >
                                    <span className="text-xl mb-1 block">{provider.icon}</span>
                                    <span className="text-xs font-bold block">{provider.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Save Bar */}
                <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all cursor-pointer shadow-lg"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saved ? "¡Cambios Guardados!" : "Guardar Configuración"}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
