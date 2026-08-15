"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Shield, Search, Download, Filter, RefreshCw, AlertTriangle,
    CheckCircle2, Info, ArrowLeft, Clock, User, Globe, Lock,
    ChevronRight, Sparkles, Database, FileSpreadsheet
} from "lucide-react";

interface AuditLogEntry {
    id: string;
    timestamp: string;
    actor: { name: string; email: string; role: string; avatar?: string };
    action: string;
    category: "AUTH" | "PERMISSIONS" | "DATA_EXPORT" | "SETTINGS" | "BILLING";
    severity: "INFO" | "WARNING" | "SECURITY_ALERT";
    ipAddress: string;
    location: string;
    details: string;
}

const DEMO_LOGS: AuditLogEntry[] = [
    {
        id: "log-101",
        timestamp: new Date().toISOString(),
        actor: { name: "Admin General", email: "admin@legacymarksas.com", role: "SuperAdmin" },
        action: "ROLES_UPDATED",
        category: "PERMISSIONS",
        severity: "WARNING",
        ipAddress: "190.158.42.10",
        location: "Bogotá, CO",
        details: "Se actualizaron los permisos del rol 'Asesor Comercial' otorgando acceso a Exportación de Leads.",
    },
    {
        id: "log-102",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        actor: { name: "Mariana Silva", email: "msilva@legacymarksas.com", role: "ClientAdmin" },
        action: "API_KEY_GENERATED",
        category: "SETTINGS",
        severity: "INFO",
        ipAddress: "186.28.110.5",
        location: "Medellín, CO",
        details: "Creación de la clave de API pública 'Zapier_Production_Integration_v2'.",
    },
    {
        id: "log-103",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        actor: { name: "Carlos Mendoza", email: "cmendoza@legacymarksas.com", role: "ContentManager" },
        action: "DATA_EXPORT_CSV",
        category: "DATA_EXPORT",
        severity: "SECURITY_ALERT",
        ipAddress: "190.24.88.99",
        location: "Cali, CO",
        details: "Exportación masiva de 1,450 Leads a formato CSV desde la sección de CRM.",
    },
    {
        id: "log-104",
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        actor: { name: "Sistema de IA", email: "ai-copilot@system.internal", role: "AI Engine" },
        action: "APPOINTMENT_SCHEDULED",
        category: "SETTINGS",
        severity: "INFO",
        ipAddress: "127.0.0.1",
        location: "Servidor VPS",
        details: "El Agente de IA agendó automáticamente una cita para el cliente 'Carlos Mendoza' en calendar-service.",
    },
    {
        id: "log-105",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        actor: { name: "Admin General", email: "admin@legacymarksas.com", role: "SuperAdmin" },
        action: "BILLING_PLAN_UPGRADED",
        category: "BILLING",
        severity: "INFO",
        ipAddress: "190.158.42.10",
        location: "Bogotá, CO",
        details: "Actualización de plan contratado a Enterprise Pro (Facturación B2B activa).",
    },
];

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>(DEMO_LOGS);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.actor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.details.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSeverity = selectedSeverity === "ALL" || log.severity === selectedSeverity;
        return matchesSearch && matchesSeverity;
    });

    const exportToCSV = () => {
        const headers = "ID,Fecha,Usuario,Email,Rol,Accion,Categoria,Severidad,IP,Ubicacion,Detalles\n";
        const rows = filteredLogs
            .map(
                (l) =>
                    `"${l.id}","${l.timestamp}","${l.actor.name}","${l.actor.email}","${l.actor.role}","${l.action}","${l.category}","${l.severity}","${l.ipAddress}","${l.location}","${l.details}"`
            )
            .join("\n");

        const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--ds-border)] pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
                        <Shield className="w-3.5 h-3.5" />
                        <span>SEGURIDAD & AUDITORÍA ENTERPRISE</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <Lock className="w-8 h-8 text-emerald-400" />
                        Bitácora de Auditoría Inalterable
                    </h1>
                    <p className="text-[var(--ds-text-secondary)] text-sm mt-1">
                        Historial inalterable de accesos, modificaciones de roles, exportaciones de datos y eventos de seguridad.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--ds-surface)] border border-[var(--ds-border)] hover:border-[var(--ds-border-glow)] text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span>Exportar CSV</span>
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl p-4">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-[var(--ds-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por usuario, IP, acción..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] focus:border-emerald-500 text-xs text-white placeholder:text-[var(--ds-text-muted)] focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    <span className="text-xs text-[var(--ds-text-muted)] font-medium shrink-0 flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5" /> Severidad:
                    </span>
                    {["ALL", "INFO", "WARNING", "SECURITY_ALERT"].map((sev) => (
                        <button
                            key={sev}
                            onClick={() => setSelectedSeverity(sev)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                selectedSeverity === sev
                                    ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400"
                                    : "bg-[var(--ds-surface-2)] text-[var(--ds-text-secondary)] hover:text-white"
                            }`}
                        >
                            {sev === "ALL" ? "Todos" : sev}
                        </button>
                    ))}
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-[var(--ds-surface)] border border-[var(--ds-border)] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[var(--ds-text-secondary)]">
                        <thead className="bg-[var(--ds-surface-2)] text-[var(--ds-text-muted)] font-mono uppercase text-[10px] tracking-wider border-b border-[var(--ds-border)]">
                            <tr>
                                <th className="py-3.5 px-4">Fecha & Hora</th>
                                <th className="py-3.5 px-4">Usuario / Actor</th>
                                <th className="py-3.5 px-4">Acción & Categoría</th>
                                <th className="py-3.5 px-4">Dirección IP / Ubicación</th>
                                <th className="py-3.5 px-4">Severidad</th>
                                <th className="py-3.5 px-4">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--ds-border)]/60">
                            {filteredLogs.map((log) => {
                                const dateObj = new Date(log.timestamp);
                                return (
                                    <tr key={log.id} className="hover:bg-[var(--ds-surface-2)]/40 transition-all">
                                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[var(--ds-text-muted)]">
                                            {dateObj.toLocaleDateString("es-CO")} {dateObj.toLocaleTimeString("es-CO")}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-white">{log.actor.name}</div>
                                            <div className="text-[10px] text-[var(--ds-text-muted)]">{log.actor.email}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-mono font-bold text-emerald-400">{log.action}</div>
                                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--ds-bg-deep)] border border-[var(--ds-border)] text-[var(--ds-text-muted)]">
                                                {log.category}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <div className="font-mono text-white flex items-center gap-1">
                                                <Globe className="w-3 h-3 text-sky-400" /> {log.ipAddress}
                                            </div>
                                            <div className="text-[10px] text-[var(--ds-text-muted)]">{log.location}</div>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span
                                                className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                                                    log.severity === "SECURITY_ALERT"
                                                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                                                        : log.severity === "WARNING"
                                                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                }`}
                                            >
                                                {log.severity}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={log.details}>
                                            {log.details}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
