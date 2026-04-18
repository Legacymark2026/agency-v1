"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import {
  X, Clock, CheckCircle2, MessageSquare, Flag, Tag, Calendar, Plus, Loader2, Send,
  Play, Pause, StopCircle, Link2, Copy, Check, Star, Zap, BarChart2, Image,
  ExternalLink, Sparkles, Trash2, AlertTriangle, ChevronDown, ChevronRight, Video,
  History, DollarSign, TrendingUp, Download, Wand2
} from "lucide-react";
import {
  getKanbanTaskDetail, updateTaskDetails, addKanbanComment, createSubtask,
  toggleSubtask, deleteSubtask, getTeamMembersForAssignment, logTimeSession,
  generateClientApprovalLink
} from "@/actions/kanban-tasks";
import { getTaskAuditLog } from "@/actions/kanban-audit";
import { getTaskFinancials, exportTimesheetReport } from "@/actions/kanban-finance";
import { generateTaskBrief } from "@/actions/kanban-copilot";
import { convertTaskToDeal } from "@/actions/kanban-sales-sync";
import { toast } from "sonner";

// ── Config ───────────────────────────────────────────────────────────────────
const PRIORITY_OPTIONS = [
  { value: "URGENT", label: "Urgente", color: "#f87171" },
  { value: "HIGH",   label: "Alta",    color: "#fbbf24" },
  { value: "MEDIUM", label: "Media",   color: "#60a5fa" },
  { value: "LOW",    label: "Baja",    color: "#94a3b8" },
];
const STATUS_OPTIONS = [
  { value: "TODO",        label: "Por Hacer",      color: "#64748b" },
  { value: "IN_PROGRESS", label: "En Progreso",    color: "#0ea5e9" },
  { value: "REVIEW",      label: "Revisión Cliente",color: "#f59e0b" },
  { value: "DONE",        label: "Completado",     color: "#10b981" },
];
const ALL_LABELS = ["Bug","Feature","Mejora","Copy","Diseño","Motion","Pauta","QA","Cliente","Urgente"];
const LABEL_COLORS: Record<string,string> = {
  Bug:"#f87171", Feature:"#818cf8", Mejora:"#34d399", Copy:"#fb923c",
  Diseño:"#e879f9", Motion:"#60a5fa", Pauta:"#fbbf24", QA:"#a3e635",
  Cliente:"#f472b6", Urgente:"#f87171",
};
const EFFORT_POINTS = [1, 2, 3, 5, 8, 13, 21];
const ASSET_VERSIONS = ["V1", "V2", "V3", "V4", "Final", "Final-real", "Aprobada"];

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = "sm" }: { user: any; size?: "sm" | "md" }) {
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : (user?.name || "??").substring(0, 2).toUpperCase();
  const cls = size === "md" ? "w-8 h-8 text-xs" : "w-6 h-6 text-xs";
  return (
    <div className={`${cls} rounded-full bg-teal-700 flex items-center justify-center font-bold text-white border border-slate-800 overflow-hidden flex-shrink-0`}>
      {user?.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : initials}
    </div>
  );
}

// ── Timer Component ───────────────────────────────────────────────────────────
function TimeTracker({ taskId, onLogged }: { taskId: string; onLogged: (comment: any) => void }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const intervalRef = useRef<any>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const handleStop = () => {
    setRunning(false);
    if (elapsed < 5) { setElapsed(0); return; }
    startTransition(async () => {
      const res = await logTimeSession(taskId, elapsed, note);
      if (res.success) {
        toast.success(`Tiempo registrado: ${fmt(elapsed)}`);
        if (res.comment) onLogged(res.comment);
        setElapsed(0);
        setNote("");
      } else toast.error(res.error || "Error al guardar tiempo");
    });
  };

  return (
    <div className={`rounded-xl border p-4 transition-all ${running ? "border-teal-500/50 bg-teal-500/5" : "border-slate-800 bg-slate-900/40"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${running ? "text-teal-400" : "text-slate-500"}`} />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cronómetro</span>
          {running && <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 font-bold animate-pulse">EN CURSO</span>}
        </div>
        <div className="font-mono text-2xl font-bold" style={{ color: running ? "#2dd4bf" : "#64748b" }}>
          {fmt(elapsed)}
        </div>
      </div>

      {running && (
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Nota de esta sesión (opcional)..."
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 outline-none focus:border-teal-500/50 mb-3" />
      )}

      <div className="flex gap-2">
        {!running ? (
          <button onClick={() => setRunning(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-sm font-bold transition-colors flex-1 justify-center">
            <Play className="w-4 h-4" /> Iniciar
          </button>
        ) : (
          <>
            <button onClick={() => setRunning(false)} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors">
              <Pause className="w-4 h-4" /> Pausar
            </button>
            <button onClick={handleStop} disabled={isPending} className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-bold transition-colors flex-1 justify-center disabled:opacity-40">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />} Detener y Guardar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Media Preview ─────────────────────────────────────────────────────────────
function MediaPreview({ url, type }: { url: string; type?: string }) {
  const isVideo = type === "video" || url.match(/\.(mp4|mov|webm)(\?|$)/i);
  const isImage = !isVideo;
  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      {isVideo ? (
        <video src={url} controls className="w-full max-h-64 object-contain" />
      ) : (
        <img src={url} alt="Asset preview" className="w-full max-h-64 object-cover" />
      )}
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-mono truncate">{url.split("/").pop()}</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function TaskDetailModal({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState("");
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [tab, setTab] = useState<"detail"|"checklist"|"timer"|"media"|"approval"|"audit"|"finance"|"ai">("detail");
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("V1");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [addingChecklist, setAddingChecklist] = useState(false);
  // Enterprise state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [financials, setFinancials] = useState<any>(null);
  const [finLoading, setFinLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState<{ description: string; checklist: string[] } | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getKanbanTaskDetail(taskId), getTeamMembersForAssignment()]).then(([tr, mr]) => {
      if (tr.success && tr.task) { setTask(tr.task); setTitleVal(tr.task.title); }
      if (mr.success) setTeamMembers(mr.users);
      setLoading(false);
    });
  }, [taskId]);

  const update = (data: any) => {
    startTransition(async () => {
      const res = await updateTaskDetails(taskId, data);
      if (res.success) { setTask((p: any) => ({ ...p, ...data })); toast.success("Guardado"); }
      else toast.error(res.error || "Error");
    });
  };

  const submitComment = () => {
    if (!newComment.trim()) return;
    startTransition(async () => {
      const res = await addKanbanComment(taskId, newComment.trim());
      if (res.success) {
        setTask((p: any) => ({ ...p, comments: [...(p.comments || []), res.comment] }));
        setNewComment(""); toast.success("Comentario agregado");
      }
    });
  };

  const submitSubtask = (blocking?: boolean) => {
    if (!newSubtask.trim()) return;
    startTransition(async () => {
      const res = await createSubtask(taskId, newSubtask.trim(), blocking);
      if (res.success) {
        setTask((p: any) => ({ ...p, subtasks: [...(p.subtasks || []), { ...res.subtask, isBlocking: blocking }] }));
        setNewSubtask(""); setAddingSubtask(false); setAddingChecklist(false);
      }
    });
  };

  const handleToggleSub = (id: string, completed: boolean) => {
    startTransition(async () => {
      const res = await toggleSubtask(id, !completed);
      if (res.success) setTask((p: any) => ({ ...p, subtasks: p.subtasks.map((s: any) => s.id === id ? { ...s, completed: !completed } : s) }));
    });
  };

  const handleDeleteSub = (id: string) => {
    startTransition(async () => {
      const res = await deleteSubtask(id);
      if (res.success) setTask((p: any) => ({ ...p, subtasks: p.subtasks.filter((s: any) => s.id !== id) }));
    });
  };

  const toggleLabel = (label: string) => {
    const current: string[] = task?.labels || [];
    const next = current.includes(label) ? current.filter((l: string) => l !== label) : [...current, label];
    update({ labels: next });
    setTask((p: any) => ({ ...p, labels: next }));
  };

  const handleGenApproval = () => {
    startTransition(async () => {
      const res = await generateClientApprovalLink(taskId);
      if (res.success) {
        setApprovalUrl(res.url!);
        setTask((p: any) => ({ ...p, status: "REVIEW" }));
        toast.success("Enlace de aprobación generado");
      } else toast.error(res.error || "Error");
    });
  };

  const copyApprovalUrl = () => {
    if (approvalUrl) { navigator.clipboard.writeText(approvalUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const addMedia = () => {
    if (!mediaUrlInput.trim()) return;
    const current = (task?.mediaUrls || []);
    const next = [...current, { url: mediaUrlInput.trim(), version: selectedVersion }];
    update({ mediaUrls: next });
    setTask((p: any) => ({ ...p, mediaUrls: next }));
    setMediaUrlInput("");
  };

  const doneSubtasks = task?.subtasks?.filter((s: any) => s.completed).length || 0;
  const totalSubtasks = task?.subtasks?.length || 0;
  const subPct = totalSubtasks > 0 ? Math.round(doneSubtasks / totalSubtasks * 100) : 0;
  const blockingIncomplete = task?.subtasks?.some((s: any) => s.isBlocking && !s.completed);
  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date() && task?.status !== "DONE";

  const TABS = [
    { key: "detail",    label: "Detalle",    icon: Flag },
    { key: "checklist", label: `Checklist ${totalSubtasks > 0 ? `${doneSubtasks}/${totalSubtasks}` : ""}`, icon: CheckCircle2 },
    { key: "timer",     label: "Tiempo",     icon: Clock },
    { key: "media",     label: `Assets ${(task?.mediaUrls?.length || 0) > 0 ? `(${task?.mediaUrls?.length})` : ""}`, icon: Image },
    { key: "approval",  label: "Aprobación", icon: Link2 },
    { key: "finance",   label: "Finanzas",   icon: DollarSign },
    { key: "ai",        label: "IA Copilot", icon: Wand2 },
    { key: "audit",     label: "Auditoría",  icon: History },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/85 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-4xl bg-[#0c1117] border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[94vh]" onClick={e => e.stopPropagation()}>

        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-teal-500 animate-spin" /></div>
        ) : !task ? (
          <div className="flex items-center justify-center h-64 text-slate-500">Tarea no encontrada</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-800 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-600 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {task.id.split("-")[0].toUpperCase()}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ color: STATUS_OPTIONS.find(s => s.value === task.status)?.color, background: `${STATUS_OPTIONS.find(s => s.value === task.status)?.color}20` }}>
                    {STATUS_OPTIONS.find(s => s.value === task.status)?.label}
                  </span>
                  {blockingIncomplete && (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-bold">
                      <AlertTriangle className="w-3 h-3" /> Checklist incompleto
                    </span>
                  )}
                  {isOverdue && <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">⚠ Vencida</span>}
                  {task.storyPoints && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                      <Zap className="w-3 h-3 inline mr-1" />{task.storyPoints} pts
                    </span>
                  )}
                </div>
                {editingTitle ? (
                  <input autoFocus value={titleVal} onChange={e => setTitleVal(e.target.value)}
                    onBlur={() => { setEditingTitle(false); if (titleVal !== task.title) update({ title: titleVal }); }}
                    onKeyDown={e => { if (e.key === "Enter") { setEditingTitle(false); if (titleVal !== task.title) update({ title: titleVal }); } if (e.key === "Escape") { setEditingTitle(false); setTitleVal(task.title); } }}
                    className="w-full text-xl font-bold text-white bg-slate-800 border border-teal-500 rounded-lg px-3 py-1.5 outline-none"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-slate-100 cursor-pointer hover:text-teal-100 transition-colors line-clamp-2" onClick={() => setEditingTitle(true)} title="Click para editar">
                    {task.title}
                  </h2>
                )}
                {task.labels?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.labels.map((l: string) => (
                      <span key={l} className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: LABEL_COLORS[l] || "#64748b" }}>{l}</span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-800 px-4 gap-1 overflow-x-auto flex-shrink-0">
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.key} onClick={() => setTab(t.key as any)}
                    className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${tab === t.key ? "border-teal-500 text-teal-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                    <Icon className="w-3.5 h-3.5" />{t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto">

              {/* ── DETAIL TAB ── */}
              {tab === "detail" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
                  {/* Main */}
                  <div className="lg:col-span-2 p-5 space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Descripción</h3>
                      <textarea rows={4} defaultValue={task.description || ""}
                        onBlur={e => { if (e.target.value !== task.description) update({ description: e.target.value }); }}
                        placeholder="Describe la tarea..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 outline-none focus:border-teal-500/50 transition-colors resize-none placeholder:text-slate-600"
                      />
                    </div>

                    {/* Comments */}
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Comentarios {task.comments?.length > 0 && <span className="text-teal-400 ml-1">({task.comments.length})</span>}
                      </h3>
                      <div className="space-y-3 mb-4 max-h-52 overflow-y-auto">
                        {task.comments?.filter((c: any) => !c.content.startsWith("⏱")).map((c: any) => (
                          <div key={c.id} className="flex gap-3">
                            <Avatar user={c.author} size="sm" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-slate-300">{c.author?.name || c.author?.firstName}</span>
                                <span className="text-xs text-slate-600">{new Date(c.createdAt).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                              <div className="text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">{c.content}</div>
                            </div>
                          </div>
                        ))}
                        {task.comments?.filter((c: any) => !c.content.startsWith("⏱")).length === 0 && (
                          <p className="text-slate-600 text-xs text-center py-4">Sin comentarios</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <textarea rows={2} value={newComment} onChange={e => setNewComment(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                          placeholder="Comentario... (Enter para enviar)"
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-teal-500/50 transition-colors resize-none" />
                        <button onClick={submitComment} disabled={!newComment.trim()}
                          className="px-3 py-2 bg-teal-500 hover:bg-teal-400 text-white rounded-xl transition-colors disabled:opacity-40 self-end">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="p-5 space-y-5">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Propiedades</h3>

                    {/* Status */}
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block font-semibold">Estado</label>
                      <select value={task.status} onChange={e => update({ status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-teal-500/50 cursor-pointer">
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block font-semibold">Prioridad</label>
                      <div className="grid grid-cols-2 gap-1">
                        {PRIORITY_OPTIONS.map(p => (
                          <button key={p.value} onClick={() => update({ priority: p.value })}
                            className="py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{ color: p.color, background: task.priority === p.value ? `${p.color}20` : "transparent", border: `1px solid ${task.priority === p.value ? p.color : "#334155"}` }}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Story Points */}
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block font-semibold flex items-center gap-1"><Zap className="w-3 h-3 text-purple-400" /> Puntos de Esfuerzo</label>
                      <div className="flex flex-wrap gap-1">
                        {EFFORT_POINTS.map(pt => (
                          <button key={pt} onClick={() => update({ storyPoints: pt })}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${task.storyPoints === pt ? "bg-purple-500 text-white" : "bg-slate-900 border border-slate-700 text-slate-400 hover:border-purple-500/50"}`}>
                            {pt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Assignee */}
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block font-semibold">Asignado a</label>
                      <select value={task.assignee?.id || ""} onChange={e => update({ assigneeId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-teal-500/50 cursor-pointer">
                        <option value="">Sin asignar</option>
                        {teamMembers.map((u: any) => <option key={u.id} value={u.id}>{u.name || `${u.firstName} ${u.lastName}`}</option>)}
                      </select>
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block font-semibold">Vencimiento</label>
                      <input type="date" value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                        onChange={e => update({ dueDate: e.target.value ? new Date(e.target.value) : null })}
                        className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-xs text-slate-200 outline-none focus:border-teal-500/50 cursor-pointer transition-colors ${isOverdue ? "border-red-500/50" : "border-slate-800"}`}
                      />
                    </div>

                    {/* Labels */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-slate-500 font-semibold">Etiquetas</label>
                        <button onClick={() => setShowLabelPicker(v => !v)} className="text-xs text-teal-400 hover:text-teal-300">{showLabelPicker ? "Cerrar" : "Editar"}</button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {task.labels?.length > 0 ? task.labels.map((l: string) => (
                          <span key={l} className="text-xs px-1.5 py-0.5 rounded-full font-semibold text-white" style={{ background: LABEL_COLORS[l] || "#64748b" }}>{l}</span>
                        )) : <span className="text-xs text-slate-600">Sin etiquetas</span>}
                      </div>
                      {showLabelPicker && (
                        <div className="mt-2 p-2 bg-slate-900 border border-slate-700 rounded-xl flex flex-wrap gap-1">
                          {ALL_LABELS.map(label => {
                            const active = task.labels?.includes(label);
                            return (
                              <button key={label} onClick={() => toggleLabel(label)}
                                className="text-xs px-1.5 py-0.5 rounded-full font-semibold transition-all"
                                style={{ color: active ? "#fff" : LABEL_COLORS[label], background: active ? LABEL_COLORS[label] : `${LABEL_COLORS[label]}15`, border: `1px solid ${LABEL_COLORS[label]}50` }}>
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-500">
                      {task.creator && <div>Creado por <span className="text-slate-300">{task.creator.name || task.creator.firstName}</span></div>}
                      <div>{new Date(task.createdAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}</div>
                    </div>

                    {/* Convert to Deal */}
                    {!task.deal && (
                      <div className="pt-3 border-t border-slate-800">
                        <button 
                          onClick={() => {
                            const val = window.prompt("Ingresa el valor del Deal (USD):", "1000");
                            if (val && !isNaN(parseFloat(val))) {
                              startTransition(async () => {
                                const res = await convertTaskToDeal(taskId, parseFloat(val));
                                if (res.success) {
                                  setTask((p: any) => ({ ...p, deal: res.deal }));
                                  toast.success("Tarea vinculada a Sales Deal 💵");
                                } else {
                                  toast.error(res.error || "Error al vincular deal");
                                }
                              });
                            }
                          }}
                          disabled={isPending}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50">
                          <DollarSign className="w-3.5 h-3.5" /> Convertir a Sales Deal
                        </button>
                      </div>
                    )}
                    {task.deal && (
                      <div className="pt-3 border-t border-slate-800">
                         <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                           <CheckCircle2 className="w-3.5 h-3.5" /> Vinculado al Deal: USD {task.deal.value}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── CHECKLIST TAB ── */}
              {tab === "checklist" && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-200">Checklist Condicional</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Los ítems marcados como <span className="text-amber-400 font-semibold">bloqueantes</span> deben completarse antes de mover la tarjeta.</p>
                    </div>
                    {totalSubtasks > 0 && (
                      <span className={`text-sm font-bold px-2 py-1 rounded-lg ${subPct === 100 ? "bg-teal-500/10 text-teal-400" : "bg-slate-800 text-slate-300"}`}>{subPct}%</span>
                    )}
                  </div>

                  {totalSubtasks > 0 && (
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${subPct}%` }} />
                    </div>
                  )}

                  <div className="space-y-2">
                    {task.subtasks?.map((st: any) => (
                      <div key={st.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${st.isBlocking && !st.completed ? "border-amber-500/30 bg-amber-500/5" : "border-slate-800 bg-slate-900/40 hover:border-slate-700"}`}>
                        <button onClick={() => handleToggleSub(st.id, st.completed)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${st.completed ? "border-teal-500 bg-teal-500" : "border-slate-600 hover:border-teal-500/50"}`}>
                          {st.completed && <Check className="w-3 h-3 text-slate-950" />}
                        </button>
                        <span className={`text-sm flex-1 ${st.completed ? "line-through text-slate-600" : "text-slate-300"}`}>{st.title}</span>
                        {st.isBlocking && !st.completed && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold flex-shrink-0">Bloqueante</span>
                        )}
                        <button onClick={() => handleDeleteSub(st.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3.5 h-3.5 text-slate-600 hover:text-red-400 transition-colors" />
                        </button>
                      </div>
                    ))}
                    {totalSubtasks === 0 && !addingChecklist && (
                      <div className="text-center py-8 text-slate-600 text-sm border border-dashed border-slate-800 rounded-xl">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                        Sin ítems de checklist todavía
                      </div>
                    )}
                    {addingChecklist && (
                      <div className="space-y-2 p-3 bg-slate-900 border border-slate-700 rounded-xl">
                        <input autoFocus value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") submitSubtask(false); if (e.key === "Escape") { setAddingChecklist(false); setNewSubtask(""); } }}
                          placeholder="Descripción del ítem..." className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white outline-none focus:border-teal-500/50" />
                        <div className="flex gap-2">
                          <button onClick={() => submitSubtask(false)} className="flex-1 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold transition-colors">Agregar</button>
                          <button onClick={() => submitSubtask(true)} className="flex-1 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-colors">
                            <AlertTriangle className="w-3 h-3 inline mr-1" /> + Bloqueante
                          </button>
                          <button onClick={() => { setAddingChecklist(false); setNewSubtask(""); }} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 transition-colors">✕</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!addingChecklist && (
                    <button onClick={() => setAddingChecklist(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:border-teal-500/40 hover:text-teal-400 transition-all text-sm">
                      <Plus className="w-4 h-4" /> Agregar ítem al checklist
                    </button>
                  )}
                </div>
              )}

              {/* ── TIMER TAB ── */}
              {tab === "timer" && (
                <div className="p-5 space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-200 mb-1">Cronómetro de Trabajo</h3>
                    <p className="text-xs text-slate-500">El tiempo registrado se suma a las horas del proyecto y queda visible en el historial de comentarios.</p>
                  </div>
                  <TimeTracker taskId={taskId} onLogged={c => setTask((p: any) => ({ ...p, comments: [...(p.comments || []), c] }))} />

                  {/* Time sessions log */}
                  {task.comments?.filter((c: any) => c.content.startsWith("⏱")).length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sesiones Registradas</h4>
                      <div className="space-y-2">
                        {task.comments.filter((c: any) => c.content.startsWith("⏱")).map((c: any) => (
                          <div key={c.id} className="flex items-start gap-3 px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                            <Clock className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-slate-300">{c.content.replace("⏱ **Sesión de trabajo:** ", "")}</p>
                              <p className="text-xs text-slate-600 mt-0.5">{c.author?.name} · {new Date(c.createdAt).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Horas estimadas:</span>
                      <span className="font-mono font-bold text-slate-200">{(task.estimatedHours || 0).toFixed(1)}h</span>
                    </div>
                    {task.storyPoints && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-slate-500">Story Points:</span>
                        <span className="font-mono font-bold text-purple-400">{task.storyPoints} pts</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── MEDIA / ASSETS TAB ── */}
              {tab === "media" && (
                <div className="p-5 space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-200 mb-1">Gestión de Assets</h3>
                    <p className="text-xs text-slate-500">Agrega URLs de imágenes, videos de TikTok, artes de Meta Ads u otros recursos versionados.</p>
                  </div>

                  {/* Add media */}
                  <div className="flex gap-2 flex-wrap">
                    <select value={selectedVersion} onChange={e => setSelectedVersion(e.target.value)}
                      className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none cursor-pointer">
                      {ASSET_VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <input value={mediaUrlInput} onChange={e => setMediaUrlInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addMedia()}
                      placeholder="URL de imagen, video o asset..."
                      className="flex-1 min-w-0 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-teal-500/50 transition-colors" />
                    <button onClick={addMedia} disabled={!mediaUrlInput.trim()} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Media grid */}
                  {(task.mediaUrls || []).length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl text-slate-600">
                      <Image className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                      <p className="text-sm">Sin assets adjuntos</p>
                      <p className="text-xs mt-1">Agrega URLs de imágenes o videos para previsualizar</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {task.mediaUrls.map((m: any, i: number) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs px-2 py-0.5 rounded font-bold text-white bg-slate-700">{m.version || "V1"}</span>
                            <button onClick={() => {
                              const next = task.mediaUrls.filter((_: any, idx: number) => idx !== i);
                              update({ mediaUrls: next });
                              setTask((p: any) => ({ ...p, mediaUrls: next }));
                            }} className="text-slate-600 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <MediaPreview url={m.url} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── APPROVAL TAB ── */}
              {tab === "approval" && (
                <div className="p-5 space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-200 mb-1">Portal de Aprobación Cliente</h3>
                    <p className="text-xs text-slate-500">Genera un enlace único para que el cliente apruebe o rechace esta entrega. Al enviarlo, la tarjeta pasa automáticamente a "Revisión Cliente".</p>
                  </div>

                  {!approvalUrl ? (
                    <>
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-amber-200 mb-1">¿Cómo funciona?</p>
                            <ul className="text-xs text-amber-300/70 space-y-1">
                              <li>• Se genera un enlace seguro con token único</li>
                              <li>• El cliente puede ver el asset y dejar feedback</li>
                              <li>• Si aprueba → la tarjeta avanza a <span className="text-teal-400">Completado</span></li>
                              <li>• Si rechaza → la tarjeta vuelve a <span className="text-amber-400">En Progreso</span> con comentario</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <button onClick={handleGenApproval} disabled={isPending}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-white rounded-xl font-bold transition-all shadow-lg shadow-teal-500/20 disabled:opacity-40">
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
                        Generar Enlace de Aprobación
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-teal-500/5 border border-teal-500/20 rounded-xl">
                        <Check className="w-5 h-5 text-teal-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-teal-300 mb-1">Enlace generado:</p>
                          <p className="text-xs font-mono text-slate-300 truncate">{approvalUrl}</p>
                        </div>
                        <button onClick={copyApprovalUrl} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-xs font-bold transition-colors flex-shrink-0">
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">El estado de la tarea fue actualizado a <span className="text-amber-400 font-semibold">Revisión Cliente</span>.</p>
                      <button onClick={() => { setApprovalUrl(null); }} className="text-xs text-slate-600 hover:text-slate-400 underline transition-colors">Generar nuevo enlace</button>
                    </div>
                  )}
                </div>
              )}
              {/* ── FINANCE TAB ── */}
              {tab === "finance" && (
                <div className="p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-200 mb-1">Inteligencia Financiera</h3>
                      <p className="text-xs text-slate-500">Costo real basado en horas × tarifa del empleado vs. presupuesto asignado.</p>
                    </div>
                    <button
                      onClick={async () => {
                        setFinLoading(true);
                        const res = await getTaskFinancials(taskId);
                        if (res.success) setFinancials(res.data);
                        else toast.error("Error al calcular finanzas");
                        setFinLoading(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-lg text-xs text-teal-400 hover:bg-teal-500/20 transition-colors"
                    >
                      {finLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />} Calcular
                    </button>
                  </div>

                  {!financials && !finLoading && (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-600">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                      <p className="text-sm">Haz click en &quot;Calcular&quot; para ver el análisis financiero</p>
                    </div>
                  )}

                  {financials && (
                    <div className="space-y-4">
                      {/* Burn gauge */}
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Burn del Presupuesto</span>
                          <span className={`font-bold text-lg font-mono ${
                            financials.alertLevel === "danger" ? "text-red-400" :
                            financials.alertLevel === "warning" ? "text-amber-400" : "text-teal-400"
                          }`}>{financials.burnPct}%</span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{
                            width: `${Math.min(financials.burnPct, 100)}%`,
                            background: financials.alertLevel === "danger" ? "#f87171" : financials.alertLevel === "warning" ? "#fbbf24" : "#14b8a6"
                          }} />
                        </div>
                        {financials.alertLevel !== "ok" && (
                          <p className={`text-xs flex items-center gap-1 ${
                            financials.alertLevel === "danger" ? "text-red-400" : "text-amber-400"
                          }`}>
                            <AlertTriangle className="w-3 h-3" />
                            {financials.alertLevel === "danger" ? "⚠️ Presupuesto superado" : "🟠 Alcanzando el límite del presupuesto"}
                          </p>
                        )}
                      </div>

                      {/* Metrics grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Horas Registradas", value: `${financials.loggedHours}h`, icon: Clock },
                          { label: "Horas Estimadas",   value: `${financials.estimatedHours}h`, icon: BarChart2 },
                          { label: "Tarifa / Hora",      value: `$${financials.hourlyRate.toFixed(0)}/h`, icon: DollarSign },
                          { label: "Costo Real",         value: `$${financials.actualCost}`, icon: TrendingUp },
                        ].map(m => (
                          <div key={m.label} className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                            <div className="flex items-center gap-1.5 mb-1">
                              <m.icon className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-xs text-slate-500 uppercase tracking-wider">{m.label}</span>
                            </div>
                            <p className="text-base font-bold font-mono text-slate-200">{m.value}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-600">Presupuesto asignado: <span className="text-slate-400 font-mono">${financials.budgetCap}</span></p>
                    </div>
                  )}
                </div>
              )}

              {/* ── AI COPILOT TAB ── */}
              {tab === "ai" && (
                <div className="p-5 space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-200 mb-1 flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-purple-400" /> IA Copilot
                    </h3>
                    <p className="text-xs text-slate-500">Genera automáticamente una descripción profesional y checklist accionable para esta tarea usando Gemini.</p>
                  </div>

                  <button
                    disabled={aiLoading}
                    onClick={async () => {
                      setAiLoading(true);
                      setAiBrief(null);
                      const res = await generateTaskBrief(task.title, taskId, task.projectId);
                      if (res.success && res.brief) {
                        setAiBrief(res.brief);
                        toast.success("✨ Brief generado por IA");
                      } else {
                        toast.error(res.error || "Error al generar brief");
                      }
                      setAiLoading(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-sm transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                  >
                    {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando brief...</> : <><Wand2 className="w-4 h-4" /> Generar Brief con Gemini</>}
                  </button>

                  {aiBrief && (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-3">
                        <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Descripción Generada</h4>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{aiBrief.description}</p>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Checklist Generado</h4>
                        {aiBrief.checklist.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <div className="w-5 h-5 rounded-md border border-slate-600 flex-shrink-0 flex items-center justify-center mt-0.5">
                              <span className="text-xs font-bold text-slate-500">{i + 1}</span>
                            </div>
                            {item}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={async () => {
                          update({ description: aiBrief.description });
                          for (const item of aiBrief.checklist) {
                            await createSubtask(taskId, item, false);
                          }
                          toast.success("Brief e ítems aplicados a la tarea ✅");
                          setTab("detail");
                        }}
                        className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold transition-colors"
                      >
                        Aplicar a la tarea
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── AUDIT TAB ── */}
              {tab === "audit" && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-200 mb-1 flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-400" /> Historial de Auditoría
                      </h3>
                      <p className="text-xs text-slate-500">Registro completo de todos los cambios realizados en esta tarea.</p>
                    </div>
                    <button
                      onClick={async () => {
                        setAuditLoading(true);
                        const res = await getTaskAuditLog(taskId);
                        if (res.success) setAuditLogs(res.data);
                        else toast.error("Error al cargar auditoría");
                        setAuditLoading(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      {auditLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <History className="w-3.5 h-3.5" />} Cargar
                    </button>
                  </div>

                  {!auditLoading && auditLogs.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-600">
                      <History className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                      <p className="text-sm">Sin eventos registrados aún</p>
                      <p className="text-xs mt-1">Los cambios futuros aparecerán aquí</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {auditLogs.map((log: any) => {
                      const actorName = log.actor?.firstName
                        ? `${log.actor.firstName} ${log.actor.lastName}`
                        : log.actor?.name || "Sistema";
                      const actionLabels: Record<string, string> = {
                        STATUS_CHANGE: "Cambió estado",
                        PRIORITY_CHANGE: "Cambió prioridad",
                        ASSIGNEE_CHANGE: "Reasignó",
                        POSITION_CHANGE: "Movió tarea",
                        TITLE_CHANGE: "Editó título",
                        DESCRIPTION_CHANGE: "Editó descripción",
                        DUE_DATE_CHANGE: "Cambió vencimiento",
                        LABEL_CHANGE: "Cambió etiquetas",
                        COMMENT_ADDED: "Agregó comentario",
                        TASK_CREATED: "Creó la tarea",
                        TASK_ARCHIVED: "Archivó tarea",
                      };
                      return (
                        <div key={log.id} className="flex items-start gap-3 px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
                            {log.actor?.image
                              ? <img src={log.actor.image} alt="" className="w-full h-full object-cover" />
                              : <span className="text-xs font-bold text-slate-400">{actorName.substring(0, 2).toUpperCase()}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-300">
                              <span className="font-semibold text-slate-200">{actorName}</span>{" "}
                              {actionLabels[log.action] || log.action}
                              {log.fromValue && log.toValue && (
                                <span className="text-slate-500"> &bull; <span className="line-through text-slate-600">{log.fromValue}</span> → <span className="text-teal-400">{log.toValue}</span></span>
                              )}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {new Date(log.createdAt).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
