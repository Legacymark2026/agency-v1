"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Terminal } from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Execution {
    id: string; status: string; startedAt: Date; completedAt: Date | null;
    logs: any; workflow: { name: string };
}

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
    SUCCESS: { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.35)" },
    FAILED: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.35)" },
    RUNNING: { color: "#38bdf8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.35)" },
};

export default function ExecutionList({ executions }: { executions: Execution[] }) {
    return (
        <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ background: "rgba(15,23,42,0.9)", borderBottom: "1px solid rgba(30,41,59,0.9)" }}>
                        {["Workflow", "Estado", "Inicio", "Duración", ""].map((h, i) => (
                            <th key={i} style={{ padding: "10px 16px", textAlign: i === 4 ? "right" : "left", fontSize: "10px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {executions.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: "48px", textAlign: "center", fontSize: "12px", color: "#334155", fontFamily: "monospace" }}>— Sin ejecuciones registradas —</td></tr>
                    ) : executions.map((exec, i) => {
                        const sc = STATUS_COLORS[exec.status] ?? STATUS_COLORS["RUNNING"];
                        const duration = exec.completedAt
                            ? `${new Date(exec.completedAt).getTime() - new Date(exec.startedAt).getTime()}ms`
                            : null;
                        return (
                            <tr key={exec.id} style={{ background: i % 2 === 0 ? "rgba(15,20,35,0.5)" : "rgba(11,15,25,0.3)", borderBottom: "1px solid rgba(30,41,59,0.4)" }}>
                                <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>{exec.workflow.name}</td>
                                <td style={{ padding: "12px 16px" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", fontSize: "10px", fontWeight: 800, fontFamily: "monospace", borderRadius: "99px", color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: sc.color }} />
                                        {exec.status}
                                    </span>
                                </td>
                                <td style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontFamily: "monospace" }}>{format(new Date(exec.startedAt), 'MMM d, HH:mm:ss')}</td>
                                <td style={{ padding: "12px 16px", fontSize: "12px", color: "#475569", fontFamily: "monospace" }}>
                                    {duration ?? (
                                        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#38bdf8" }}>
                                            <Loader2 size={11} className="animate-spin" /> Running
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", background: "rgba(30,41,59,0.7)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "7px", color: "#64748b", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                                                <Terminal size={12} /> Logs
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Execution Logs — {exec.workflow.name}</DialogTitle>
                                                <DialogDescription>Detalles paso a paso de la ejecución.</DialogDescription>
                                            </DialogHeader>
                                            <div style={{ background: "rgba(11,15,25,0.98)", border: "1px solid rgba(30,41,59,0.9)", padding: "14px", borderRadius: "10px", fontFamily: "monospace", fontSize: "12px", color: "#94a3b8", whiteSpace: "pre-wrap", maxHeight: "400px", overflowY: "auto" }}>
                                                {JSON.stringify(exec.logs, null, 2)}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
