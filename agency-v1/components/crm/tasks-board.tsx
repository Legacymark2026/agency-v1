"use client";

import { useState, useCallback } from "react";
import { toggleTask, deleteTask, createTask } from "@/actions/crm-advanced";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Trash2, Plus, X, Calendar, Flag, AlertTriangle } from "lucide-react";

interface Task {
    id: string; title: string; description: string | null; dueDate: Date | null;
    priority: string; completed: boolean; dealId: string | null; leadId: string | null;
    assignee?: { name: string | null; image: string | null } | null;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string; border: string }> = {
    LOW: { label: "Baja", color: "#64748b", dot: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.3)" },
    MEDIUM: { label: "Media", color: "#fbbf24", dot: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)" },
    HIGH: { label: "Alta", color: "#fb923c", dot: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.3)" },
    URGENT: { label: "Urgente", color: "#f87171", dot: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.4)" },
};

const FILTERS = ["ALL", "PENDING", "OVERDUE", "DONE"] as const;
const FILTER_LABELS = { ALL: "Todas", PENDING: "Pendientes", OVERDUE: "Vencidas", DONE: "Completadas" };

interface Props { tasks: Task[]; companyId: string; }

const inputStyle: React.CSSProperties = {
    background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)",
    borderRadius: "10px", padding: "9px 14px", fontSize: "13px",
    color: "#cbd5e1", width: "100%", outline: "none",
};

export function TasksBoard({ tasks: initial, companyId }: Props) {
    const router = useRouter();
    const [tasks, setTasks] = useState(initial);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", dueDate: "", priority: "MEDIUM" });
    const [creating, setCreating] = useState(false);
    const [filter, setFilter] = useState<"ALL" | "PENDING" | "DONE" | "OVERDUE">("ALL");

    const pending = tasks.filter((t) => !t.completed);
    const done = tasks.filter((t) => t.completed);
    const overdue = pending.filter((t) => t.dueDate && isPast(new Date(t.dueDate)));
    const filtered = filter === "PENDING" ? pending : filter === "DONE" ? done : filter === "OVERDUE" ? overdue : tasks;

    const handleToggle = async (id: string) => {
        setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
        await toggleTask(id);
        router.refresh();
    };

    const handleDelete = async (id: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        await deleteTask(id);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        const result = await createTask({ ...form, companyId });
        setCreating(false);
        if ("success" in result) {
            setForm({ title: "", description: "", dueDate: "", priority: "MEDIUM" });
            setShowCreate(false);
            router.refresh();
        }
    };

    const counts = { ALL: tasks.length, PENDING: pending.length, OVERDUE: overdue.length, DONE: done.length };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Filter tabs + Create */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "4px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "12px", padding: "4px" }}>
                    {FILTERS.map((f) => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{
                                padding: "6px 14px", fontSize: "11px", fontWeight: 800, borderRadius: "8px", border: "none",
                                background: filter === f ? "rgba(13,148,136,0.25)" : "transparent",
                                color: filter === f ? "#2dd4bf" : "#475569",
                                cursor: "pointer", transition: "all 0.15s", fontFamily: "monospace",
                            }}>
                            {FILTER_LABELS[f]}{f !== "ALL" ? ` (${counts[f]})` : ""}
                        </button>
                    ))}
                </div>
                <button onClick={() => setShowCreate(true)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "linear-gradient(135deg,#0d9488,#0f766e)", color: "#fff", fontSize: "12px", fontWeight: 800, borderRadius: "10px", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(13,148,136,0.3)" }}>
                    <Plus style={{ width: "14px", height: "14px" }} /> Nueva Tarea
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <div style={{ background: "rgba(11,15,25,0.9)", border: "1px solid rgba(13,148,136,0.3)", borderRadius: "14px", padding: "18px" }}>
                    <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "12px", fontWeight: 900, color: "#2dd4bf", fontFamily: "monospace" }}>NUEVA_TAREA</span>
                            <button type="button" onClick={() => setShowCreate(false)} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                                <X style={{ width: "15px", height: "15px" }} />
                            </button>
                        </div>
                        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="¿Qué hay que hacer?" style={inputStyle} />
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Descripción (opcional)..." style={{ ...inputStyle, resize: "none" }} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <div>
                                <label style={{ fontSize: "10px", color: "#475569", display: "block", marginBottom: "4px", fontFamily: "monospace", fontWeight: 700 }}>Vence</label>
                                <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: "10px", color: "#475569", display: "block", marginBottom: "4px", fontFamily: "monospace", fontWeight: 700 }}>Prioridad</label>
                                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
                                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button type="button" onClick={() => setShowCreate(false)}
                                style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid rgba(30,41,59,0.9)", background: "transparent", color: "#64748b", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={creating}
                                style={{ flex: 1, padding: "8px", borderRadius: "8px", background: "linear-gradient(135deg,#0d9488,#0f766e)", color: "#fff", fontWeight: 800, fontSize: "12px", border: "none", cursor: "pointer", opacity: creating ? 0.5 : 1 }}>
                                {creating ? "Creando…" : "Crear Tarea"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Task list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {filtered.length === 0 && (
                    <div style={{ background: "rgba(11,15,25,0.4)", border: "1px dashed rgba(30,41,59,0.7)", borderRadius: "12px", padding: "48px 16px", textAlign: "center" }}>
                        <p style={{ color: "#334155", fontSize: "12px", fontFamily: "monospace" }}>— Sin tareas aquí —</p>
                    </div>
                )}
                {filtered.map((task) => {
                    const cfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG["MEDIUM"];
                    const isOverdue = !task.completed && task.dueDate && isPast(new Date(task.dueDate));
                    return (
                        <div key={task.id}
                            style={{
                                background: isOverdue ? "rgba(248,113,113,0.05)" : "rgba(15,20,35,0.6)",
                                border: `1px solid ${isOverdue ? "rgba(248,113,113,0.2)" : "rgba(30,41,59,0.7)"}`,
                                borderRadius: "12px", padding: "12px 14px",
                                display: "flex", alignItems: "flex-start", gap: "12px",
                                transition: "all 0.15s",
                            }}>
                            <button onClick={() => handleToggle(task.id)}
                                style={{
                                    marginTop: "2px", width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                                    border: task.completed ? "none" : "2px solid rgba(30,41,59,0.9)",
                                    background: task.completed ? "#0d9488" : "transparent",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", transition: "all 0.2s",
                                    boxShadow: task.completed ? "0 0 8px rgba(13,148,136,0.4)" : "none",
                                }}>
                                {task.completed && <Check style={{ width: "10px", height: "10px", color: "#fff" }} strokeWidth={3} />}
                            </button>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: "13px", fontWeight: 700, color: task.completed ? "#334155" : "#e2e8f0", margin: 0, textDecoration: task.completed ? "line-through" : "none" }}>
                                    {task.title}
                                </p>
                                {task.description && <p style={{ fontSize: "11px", color: "#475569", margin: "3px 0 0", lineHeight: 1.5 }}>{task.description}</p>}
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 800, fontFamily: "monospace", color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "2px 8px", borderRadius: "99px" }}>
                                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                                        {cfg.label}
                                    </span>
                                    {task.dueDate && (
                                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: isOverdue ? "#f87171" : "#475569", fontFamily: "monospace" }}>
                                            {isOverdue ? <AlertTriangle style={{ width: "11px", height: "11px" }} /> : <Calendar style={{ width: "11px", height: "11px" }} />}
                                            {format(new Date(task.dueDate), "d MMM · HH:mm", { locale: es })}
                                        </span>
                                    )}
                                    {task.assignee?.name && <span style={{ fontSize: "11px", color: "#475569" }}>👤 {task.assignee.name}</span>}
                                </div>
                            </div>
                            <button onClick={() => handleDelete(task.id)}
                                style={{ padding: "5px", borderRadius: "7px", color: "#334155", background: "none", border: "none", cursor: "pointer", display: "flex", flexShrink: 0, transition: "all 0.15s" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.1)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#334155"; (e.currentTarget as HTMLElement).style.background = "none"; }}>
                                <Trash2 style={{ width: "13px", height: "13px" }} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
