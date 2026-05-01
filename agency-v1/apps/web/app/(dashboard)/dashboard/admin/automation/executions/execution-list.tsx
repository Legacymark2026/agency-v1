"use client";

import { useState, useTransition } from "react";
import { format, formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale";
import {
    Loader2, Terminal, CheckCircle2, XCircle, Clock, RefreshCw,
    AlertTriangle, ChevronDown, ChevronUp, Zap, Filter
} from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Execution {
    id: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    resumeAt?: Date | null;
    currentStep?: number;
    logs: any;
    workflow: { name: string; id: string };
}

const STATUS_META: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
    SUCCESS: {
        color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.3)",
        icon: <CheckCircle2 size={12} />, label: "Exitoso"
    },
    FAILED: {
        color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.3)",
        icon: <XCircle size={12} />, label: "Fallido"
    },
    RUNNING: {
        color: "#38bdf8", bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.3)",
        icon: <Loader2 size={12} className="animate-spin" />, label: "Ejecutando"
    },
    WAITING: {
        color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.3)",
        icon: <Clock size={12} />, label: "En Espera"
    },
};

function LogViewer({ logs }: { logs: any }) {
    if (!logs || (Array.isArray(logs) && logs.length === 0)) {
        return <p style={{ color: "#475569", fontFamily: "monospace", fontSize: "12px" }}>Sin logs disponibles.</p>;
    }

    const entries = Array.isArray(logs) ? logs : [logs];
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {entries.map((log: any, i: number) => {
                const isError = log.status === "ERROR" || log.status === "FAILED" || log.error;
                const isSuccess = log.status === "SUCCESS";
                const borderColor = isError ? "rgba(248,113,113,0.4)" : isSuccess ? "rgba(52,211,153,0.3)" : "rgba(30,41,59,0.8)";
                return (
                    <div key={i} style={{
                        padding: "10px 14px", borderRadius: "8px",
                        background: isError ? "rgba(248,113,113,0.06)" : "rgba(15,23,42,0.8)",
                        border: `1px solid ${borderColor}`,
                        fontFamily: "monospace", fontSize: "12px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ color: isError ? "#f87171" : isSuccess ? "#34d399" : "#38bdf8", fontWeight: 800 }}>
                                {log.type || log.nodeId || `Step ${i + 1}`}
                            </span>
                            {log.status && (
                                <span style={{
                                    fontSize: "10px", padding: "1px 7px", borderRadius: "99px",
                                    color: isError ? "#f87171" : "#34d399",
                                    background: isError ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)"
                                }}>{log.status}</span>
                            )}
                            {log.timestamp && (
                                <span style={{ color: "#334155", marginLeft: "auto", fontSize: "10px" }}>
                                    {format(new Date(log.timestamp), "HH:mm:ss")}
                                </span>
                            )}
                        </div>
                        {log.details && (
                            <p style={{ color: isError ? "#fca5a5" : "#64748b", marginTop: "4px", lineHeight: "1.5" }}>
                                {log.details}
                            </p>
                        )}
                        {log.error && (
                            <p style={{ color: "#f87171", marginTop: "4px" }}>⚠ {log.error}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function ExecutionList({ executions }: { executions: Execution[] }) {
    const [filter, setFilter] = useState<string>("ALL");
    const [isPending, startTransition] = useTransition();

    const filtered = filter === "ALL" ? executions : executions.filter(e => e.status === filter);
    const failedCount = executions.filter(e => e.status === "FAILED").length;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* ── Alerta de fallos ────────────────────────────────────────── */}
            {failedCount > 0 && (
                <div style={{
                    padding: "12px 18px", borderRadius: "10px",
                    background: "rgba(248,113,113,0.07)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    display: "flex", alignItems: "center", gap: "10px"
                }}>
                    <AlertTriangle size={16} style={{ color: "#f87171", flexShrink: 0 }} />
                    <div>
                        <p style={{ color: "#f87171", fontWeight: 700, fontSize: "13px" }}>
                            {failedCount} workflow{failedCount > 1 ? "s" : ""} fallido{failedCount > 1 ? "s" : ""}
                        </p>
                        <p style={{ color: "#64748b", fontSize: "12px" }}>
                            Revisa los logs para identificar el paso que falló y corregir la configuración del nodo.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Filtros ─────────────────────────────────────────────────── */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Filter size={14} style={{ color: "#475569" }} />
                {["ALL", "SUCCESS", "FAILED", "RUNNING", "WAITING"].map(s => {
                    const meta = STATUS_META[s];
                    const active = filter === s;
                    return (
                        <button key={s} onClick={() => setFilter(s)} style={{
                            padding: "4px 14px", borderRadius: "99px", fontSize: "11px", fontWeight: 700,
                            fontFamily: "monospace", cursor: "pointer", transition: "all 0.15s",
                            border: active
                                ? `1px solid ${meta?.border ?? "rgba(99,102,241,0.4)"}`
                                : "1px solid rgba(30,41,59,0.7)",
                            background: active
                                ? (meta?.bg ?? "rgba(99,102,241,0.1)")
                                : "rgba(15,20,35,0.6)",
                            color: active ? (meta?.color ?? "#818cf8") : "#475569",
                        }}>
                            {s === "ALL" ? "Todos" : meta?.label ?? s}
                        </button>
                    );
                })}
                <span style={{ marginLeft: "auto", color: "#334155", fontSize: "12px", fontFamily: "monospace" }}>
                    {filtered.length} ejecuciones
                </span>
            </div>

            {/* ── Tabla ───────────────────────────────────────────────────── */}
            <div style={{
                background: "rgba(11,15,25,0.7)",
                border: "1px solid rgba(30,41,59,0.8)",
                borderRadius: "12px", overflow: "hidden"
            }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "rgba(15,23,42,0.9)", borderBottom: "1px solid rgba(30,41,59,0.9)" }}>
                            {["Workflow", "Estado", "Inicio", "Duración", "Pasos", ""].map((h, i) => (
                                <th key={i} style={{
                                    padding: "10px 16px",
                                    textAlign: i === 5 ? "right" : "left",
                                    fontSize: "10px", fontWeight: 800, color: "#334155",
                                    textTransform: "uppercase", letterSpacing: "0.08em",
                                    fontFamily: "monospace"
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: "48px", textAlign: "center", fontSize: "12px", color: "#334155", fontFamily: "monospace" }}>
                                    — Sin ejecuciones en este estado —
                                </td>
                            </tr>
                        ) : filtered.map((exec, i) => {
                            const meta = STATUS_META[exec.status] ?? STATUS_META["RUNNING"];
                            const duration = exec.completedAt
                                ? formatDistanceStrict(new Date(exec.completedAt), new Date(exec.startedAt), { locale: es })
                                : null;
                            const logs = Array.isArray(exec.logs) ? exec.logs : [];

                            return (
                                <tr key={exec.id} style={{
                                    background: i % 2 === 0 ? "rgba(15,20,35,0.5)" : "rgba(11,15,25,0.3)",
                                    borderBottom: "1px solid rgba(30,41,59,0.4)",
                                    transition: "background 0.1s"
                                }}>
                                    {/* Workflow name */}
                                    <td style={{ padding: "12px 16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <Zap size={13} style={{ color: "#14b8a6", flexShrink: 0 }} />
                                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>
                                                {exec.workflow.name}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: "10px", color: "#334155", fontFamily: "monospace", marginTop: "2px", paddingLeft: "21px" }}>
                                            {exec.id.substring(0, 16)}...
                                        </p>
                                    </td>

                                    {/* Status badge */}
                                    <td style={{ padding: "12px 16px" }}>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: "5px",
                                            padding: "3px 10px", fontSize: "10px", fontWeight: 800,
                                            fontFamily: "monospace", borderRadius: "99px",
                                            color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`
                                        }}>
                                            {meta.icon}
                                            {meta.label}
                                        </span>
                                        {exec.status === "WAITING" && exec.resumeAt && (
                                            <p style={{ fontSize: "10px", color: "#fb923c", marginTop: "4px", fontFamily: "monospace" }}>
                                                Resume: {format(new Date(exec.resumeAt), "MMM d, HH:mm")}
                                            </p>
                                        )}
                                    </td>

                                    {/* Start time */}
                                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontFamily: "monospace" }}>
                                        {format(new Date(exec.startedAt), "MMM d, HH:mm:ss")}
                                    </td>

                                    {/* Duration */}
                                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontFamily: "monospace" }}>
                                        {duration ?? (
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#38bdf8" }}>
                                                <Loader2 size={11} className="animate-spin" /> Ejecutando...
                                            </span>
                                        )}
                                    </td>

                                    {/* Steps */}
                                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontFamily: "monospace" }}>
                                        {logs.length > 0 ? `${logs.filter((l: any) => l.status === "SUCCESS").length}/${logs.length}` : "—"}
                                    </td>

                                    {/* Actions */}
                                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button style={{
                                                    display: "inline-flex", alignItems: "center", gap: "4px",
                                                    padding: "5px 12px",
                                                    background: exec.status === "FAILED"
                                                        ? "rgba(248,113,113,0.08)"
                                                        : "rgba(30,41,59,0.7)",
                                                    border: exec.status === "FAILED"
                                                        ? "1px solid rgba(248,113,113,0.3)"
                                                        : "1px solid rgba(30,41,59,0.9)",
                                                    borderRadius: "7px",
                                                    color: exec.status === "FAILED" ? "#f87171" : "#64748b",
                                                    fontSize: "11px", fontWeight: 700, cursor: "pointer"
                                                }}>
                                                    <Terminal size={12} /> Logs
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto"
                                                style={{ background: "#0b0f19", border: "1px solid rgba(30,41,59,0.9)" }}>
                                                <DialogHeader>
                                                    <DialogTitle style={{ color: "#e2e8f0", fontFamily: "monospace" }}>
                                                        Logs — {exec.workflow.name}
                                                    </DialogTitle>
                                                    <DialogDescription style={{ fontFamily: "monospace", fontSize: "11px", color: "#475569" }}>
                                                        Execution ID: {exec.id} · Estado: {exec.status}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <LogViewer logs={exec.logs} />
                                            </DialogContent>
                                        </Dialog>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
