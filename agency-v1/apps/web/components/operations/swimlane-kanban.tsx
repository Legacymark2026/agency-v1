"use client";

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import {
  Plus, MoreVertical, GripVertical, AlertTriangle, Search, Filter, X, ChevronDown,
  Clock, User, Tag, BarChart2, Calendar, Zap, Copy, Trash2, CheckSquare, MessageSquare,
  Paperclip, Eye, EyeOff, RefreshCw, ArrowUpDown, LayoutGrid, List, Flag, TrendingUp,
  ChevronRight, ChevronLeft, Star, Flame, Shield, Target, Send, Archive
} from "lucide-react";
import { TaskDetailModal } from "./task-detail-modal";
import { KanbanGlobalSearch } from "./kanban-global-search";
import { AdvancedTaskCreateModal } from "./advanced-task-create-modal";
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateTaskPosition, deleteKanbanTask, duplicateKanbanTask, createKanbanTask, getTeamMembersForAssignment } from "@/actions/kanban-tasks";
import { archiveCompletedTasks } from "@/actions/kanban-archive";
import { toast } from "sonner";


// ── Types ────────────────────────────────────────────────────────────────────
type Task = {
  id: string; title: string; priority: string; status: string; order: number;
  assignee: { name: string; image?: string; firstName?: string; lastName?: string } | null;
  assigneeStr: string; dueDate?: string | null; labels?: string[];
  _count?: { comments: number; subtasks: number; attachments: number };
};
type Column = { id: string; status: string; name: string; tasks: Task[] };
type Swimlane = { id: string; name: string; wipLimit: number | null; columns: Column[]; collapsed?: boolean };

const STATUS_COLUMNS = [
  { status: "TODO",        name: "Por Hacer",   color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  { status: "IN_PROGRESS", name: "En Progreso", color: "#0ea5e9", bg: "rgba(14,165,233,0.1)" },
  { status: "REVIEW",      name: "En Revisión", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  { status: "DONE",        name: "Completado",  color: "#10b981", bg: "rgba(16,185,129,0.1)" },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  URGENT: { label: "Urgente", color: "#f87171", bg: "rgba(239,68,68,0.15)", icon: Flame },
  HIGH:   { label: "Alta",    color: "#fbbf24", bg: "rgba(245,158,11,0.15)", icon: Flag },
  MEDIUM: { label: "Media",   color: "#60a5fa", bg: "rgba(59,130,246,0.15)", icon: Target },
  LOW:    { label: "Baja",    color: "#94a3b8", bg: "rgba(100,116,139,0.1)", icon: Shield },
};

const LABEL_COLORS: Record<string, string> = {
  "Bug": "#f87171", "Feature": "#818cf8", "Mejora": "#34d399", "Urgente": "#fb923c",
  "Diseño": "#e879f9", "Backend": "#60a5fa", "Frontend": "#f472b6", "QA": "#a3e635",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name?: string, first?: string, last?: string) {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (name) return name.substring(0, 2).toUpperCase();
  return "??";
}

function isOverdue(dueDate?: string | null) {
  if (!dueDate) return false;
  try {
    return new Date(dueDate) < new Date();
  } catch (e) {
    return false;
  }
}

function formatDue(dueDate?: string | null) {
  if (!dueDate) return null;
  return new Date(dueDate).toLocaleDateString("es", { month: "short", day: "numeric" });
}

// ── Task Card ────────────────────────────────────────────────────────────────
function SortableTask({ task, onClick, onDelete, onDuplicate, showDetails }: {
  task: Task; onClick: () => void; onDelete: () => void; onDuplicate: () => void; showDetails: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id, data: { type: "Task", task },
  });
  const [menu, setMenu] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
  const PIcon = pCfg.icon;
  const overdue = isOverdue(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      className={`group relative bg-slate-900 border rounded-xl p-3 shadow-sm transition-all cursor-pointer hover:shadow-lg hover:shadow-teal-500/5 ${
        isDragging ? "border-teal-500 shadow-teal-500/30 shadow-xl ring-1 ring-teal-500/30" :
        overdue ? "border-red-500/40 hover:border-red-500/60" : "border-slate-700/60 hover:border-teal-500/40"
      }`}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div {...attributes} {...listeners} className="absolute left-1.5 top-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" onClick={e => e.stopPropagation()}>
        <GripVertical className="w-3 h-3 text-slate-600" />
      </div>

      {/* Priority indicator strip */}
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ background: pCfg.color }} />

      <div className="pl-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1" style={{ color: pCfg.color, background: pCfg.bg }}>
              <PIcon className="w-2.5 h-2.5" />{pCfg.label}
            </span>
            {task.labels?.slice(0, 2).map(label => (
              <span key={label} className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ color: "#fff", background: LABEL_COLORS[label] || "#64748b" }}>
                {label}
              </span>
            ))}
          </div>
          <div className="relative" onClick={e => { e.stopPropagation(); setMenu(v => !v); }}>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-800 rounded">
              <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {menu && (
              <div className="absolute right-0 top-6 z-30 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-36 py-1 text-xs text-slate-300">
                <button onClick={() => { onDuplicate(); setMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-800"><Copy className="w-3.5 h-3.5" /> Duplicar</button>
                <button onClick={() => { onDelete(); setMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-800 text-red-400"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-slate-200 line-clamp-2 leading-snug">{task.title}</p>

        {showDetails && (
          <>
            {/* Due date */}
            {task.dueDate && showDetails && hasMounted && (
              <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${overdue ? "text-red-400" : "text-slate-500"}`}>
                <Clock className="w-3 h-3" /> {overdue ? "Vencida" : ""} {formatDue(task.dueDate)}
              </div>
            )}

            {/* Footer: assignee + metadata counts */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {task.assignee ? (
                  <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold text-white border border-slate-800 overflow-hidden">
                    {task.assignee.image ? (
                      <img src={task.assignee.image} alt="" className="w-full h-full object-cover" />
                    ) : getInitials(task.assignee.name, task.assignee.firstName, task.assignee.lastName)}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-500 border border-slate-700">?</div>
                )}
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                {(task._count?.subtasks || 0) > 0 && <span className="flex items-center gap-0.5"><CheckSquare className="w-3 h-3" />{task._count?.subtasks}</span>}
                {(task._count?.comments || 0) > 0 && <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{task._count?.comments}</span>}
                {(task._count?.attachments || 0) > 0 && <span className="flex items-center gap-0.5"><Paperclip className="w-3 h-3" />{task._count?.attachments}</span>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Column component ─────────────────────────────────────────────────────────
function KanbanColumn({ column, colConfig, swimlaneId, isOverWIP, showDetails, onTaskClick, onTaskDelete, onTaskDuplicate }: {
  column: Column; colConfig: typeof STATUS_COLUMNS[0]; swimlaneId: string;
  isOverWIP: boolean; showDetails: boolean;
  onTaskClick: (id: string) => void; onTaskDelete: (id: string) => void; onTaskDuplicate: (id: string) => void;
}) {
  return (
    <SortableContext items={column.tasks.map(t => t.id)}>
      <div id={column.id} className="min-h-[100px] flex flex-col gap-2">
        {column.tasks.map(task => (
          <SortableTask
            key={task.id} task={task}
            onClick={() => onTaskClick(task.id)}
            onDelete={() => onTaskDelete(task.id)}
            onDuplicate={() => onTaskDuplicate(task.id)}
            showDetails={showDetails}
          />
        ))}
        {column.tasks.length === 0 && (
          <div className="flex-1 min-h-[80px] border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-700 text-xs">
            Sin tareas
          </div>
        )}
      </div>
    </SortableContext>
  );
}

// ── Quick Create Modal ────────────────────────────────────────────────────────
function QuickCreateModal({ swimlaneId, projectId, defaultStatus, onClose, onCreated }: {
  swimlaneId: string; projectId: string; defaultStatus: string; onClose: () => void; onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getTeamMembersForAssignment().then((res: any) => { if (res.success) setUsers(res.users); });
  }, []);

  const handleSubmit = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      const res = await createKanbanTask({ 
        title: title.trim(), 
        priority, 
        status: defaultStatus, 
        projectId, 
        swimlaneId,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined
      });
      if (res.success) { toast.success("Tarea creada"); onCreated(); onClose(); }
      else toast.error(res.error || "Error al crear tarea");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-teal-500" /> Nueva Tarea</h3>
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="Título de la tarea..." className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-teal-500 transition-colors mb-4" />
        <div className="flex gap-2 mb-4">
          {["URGENT","HIGH","MEDIUM","LOW"].map(p => {
            const cfg = PRIORITY_CONFIG[p];
            return (
              <button key={p} onClick={() => setPriority(p)} className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ color: cfg.color, background: priority === p ? cfg.bg : "transparent", border: `1px solid ${priority === p ? cfg.color : "#334155"}` }}>
                {cfg.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Asignar a</label>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-teal-500 outline-none transition-colors">
              <option value="">Automático</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Fecha Límite</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:border-teal-500 outline-none transition-colors [color-scheme:dark]" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={isPending || !title.trim()}
            className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold transition-colors disabled:opacity-50">
            {isPending ? "Creando..." : "Crear Tarea"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ swimlanes }: { swimlanes: Swimlane[] }) {
  const allTasks = useMemo(() => swimlanes.flatMap(sl => sl.columns.flatMap(c => c.tasks)), [swimlanes]);
  const done = allTasks.filter(t => t.status === "DONE").length;
  const inProg = allTasks.filter(t => t.status === "IN_PROGRESS").length;
  const overdue = allTasks.filter(t => isOverdue(t.dueDate) && t.status !== "DONE").length;
  const pct = allTasks.length > 0 ? Math.round(done / allTasks.length * 100) : 0;

  return (
    <div className="flex items-center gap-6 text-xs text-slate-400">
      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />{done} completadas</div>
      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />{inProg} en progreso</div>
      {overdue > 0 && <div className="flex items-center gap-1.5 text-red-400"><AlertTriangle className="w-3 h-3" />{overdue} vencidas</div>}
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-teal-400">{pct}%</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function SwimlaneKanban({ initialProject }: { initialProject: any }) {
  const [swimlanes, setSwimlanes] = useState<Swimlane[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [advancedCreate, setAdvancedCreate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterAssignee, setFilterAssignee] = useState("");
  const [showDetails, setShowDetails] = useState(true);
  const [sortBy, setSortBy] = useState<"default" | "priority" | "dueDate">("default");
  const [quickCreate, setQuickCreate] = useState<{ swimlaneId: string; status: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Set<string>>(new Set());
  const [globalSearch, setGlobalSearch] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Ctrl+K → Open global search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setGlobalSearch(true);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Parse data
  useEffect(() => {
    if (!initialProject?.swimlanes) return;
    const parsed: Swimlane[] = initialProject.swimlanes.map((sl: any) => ({
      id: sl.id, name: sl.name, wipLimit: sl.wipLimit || null,
      columns: STATUS_COLUMNS.map(col => ({
        id: `${sl.id}-${col.status}`, status: col.status, name: col.name,
        tasks: sl.kanbanTasks
          .filter((t: any) => t.status === col.status)
          .sort((a: any, b: any) => a.order - b.order)
          .map((t: any) => ({
            id: t.id, title: t.title, priority: t.priority, status: t.status,
            order: t.order, assignee: t.assignee || null, assigneeStr: t.assignee?.name || "Sin asignar",
            dueDate: t.dueDate, labels: t.labels || [], _count: t._count,
          })),
      })),
    }));
    setSwimlanes(parsed);
  }, [initialProject]);

  // Filter + Sort
  const filteredSwimlanes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return swimlanes.map(sl => ({
      ...sl,
      columns: sl.columns.map(col => ({
        ...col,
        tasks: col.tasks
          .filter(t => {
            if (q && !t.title.toLowerCase().includes(q)) return false;
            if (filterPriority.length > 0 && !filterPriority.includes(t.priority)) return false;
            if (filterAssignee && t.assigneeStr.toLowerCase().includes(filterAssignee.toLowerCase()) === false) return false;
            return true;
          })
          .sort((a, b) => {
            if (sortBy === "priority") {
              const order = ["URGENT","HIGH","MEDIUM","LOW"];
              return order.indexOf(a.priority) - order.indexOf(b.priority);
            }
            if (sortBy === "dueDate") {
              if (!a.dueDate) return 1;
              if (!b.dueDate) return -1;
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            return a.order - b.order;
          }),
      })),
    }));
  }, [swimlanes, searchQuery, filterPriority, filterAssignee, sortBy]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const flatColumns = filteredSwimlanes.flatMap(sl => sl.columns);

  function findColumnOfTask(taskId: string) {
    for (const sl of swimlanes)
      for (const col of sl.columns)
        if (col.tasks.find(t => t.id === taskId)) return col.id;
    return null;
  }

  function handleDragStart(e: DragStartEvent) {
    if (e.active.data.current?.type === "Task") setActiveTask(e.active.data.current.task);
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as string, overId = over.id as string;
    if (activeId === overId) return;
    const activeColId = findColumnOfTask(activeId);
    let overColId = findColumnOfTask(overId) || (flatColumns.some(c => c.id === overId) ? overId : null);
    if (!activeColId || !overColId || activeColId === overColId) return;

    setSwimlanes(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let srcCol: any, dstCol: any;
      for (const sl of next) {
        srcCol = srcCol || sl.columns.find((c: any) => c.id === activeColId);
        dstCol = dstCol || sl.columns.find((c: any) => c.id === overColId);
      }
      if (srcCol && dstCol) {
        const idx = srcCol.tasks.findIndex((t: any) => t.id === activeId);
        const [removed] = srcCol.tasks.splice(idx, 1);
        removed.status = dstCol.status;
        const overIdx = dstCol.tasks.findIndex((t: any) => t.id === overId);
        dstCol.tasks.splice(overIdx >= 0 ? overIdx : dstCol.tasks.length, 0, removed);
      }
      return next;
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as string, overId = over.id as string;
    const activeColId = findColumnOfTask(activeId);
    let overColId = findColumnOfTask(overId) || (flatColumns.some(c => c.id === overId) ? overId : null);
    if (!activeColId || !overColId) return;

    startTransition(async () => {
      const parts = (overColId as string).split("-");
      const newStatus = parts[parts.length - 1];
      const slId = parts.slice(0, -1).join("-");
      let newOrder = 0;
      setSwimlanes(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        for (const sl of next) {
          const col = sl.columns.find((c: any) => c.id === overColId);
          if (col) {
            if (activeColId === overColId) {
              const ai = col.tasks.findIndex((t: any) => t.id === activeId);
              const oi = col.tasks.findIndex((t: any) => t.id === overId);
              col.tasks = arrayMove(col.tasks, ai, oi);
            }
            newOrder = col.tasks.findIndex((t: any) => t.id === activeId);
          }
        }
        return next;
      });
      const res = await updateTaskPosition(activeId, slId, newStatus, newOrder);
      if (!res.success) toast.error("Error al sincronizar posición");
    });
  }

  const handleDelete = (taskId: string) => {
    startTransition(async () => {
      const res = await deleteKanbanTask(taskId);
      if (res.success) {
        setSwimlanes(prev => prev.map(sl => ({ ...sl, columns: sl.columns.map(col => ({ ...col, tasks: col.tasks.filter(t => t.id !== taskId) })) })));
        toast.success("Tarea eliminada");
      } else toast.error(res.error || "Error al eliminar");
    });
  };

  const handleDuplicate = (taskId: string) => {
    startTransition(async () => {
      const res = await duplicateKanbanTask(taskId);
      if (res.success) { toast.success("Tarea duplicada — recarga para ver"); }
      else toast.error(res.error || "Error al duplicar");
    });
  };

  const handleArchive = () => {
    startTransition(async () => {
      const res = await archiveCompletedTasks(initialProject.id, 30);
      if (res.success) {
        setSwimlanes(prev => prev.map(sl => ({ ...sl, columns: sl.columns.map(col => ({ ...col, tasks: col.tasks.filter(t => t.status !== "DONE") })) })));
        toast.success(`${res.count} tarea${res.count !== 1 ? "s" : ""} archivada${res.count !== 1 ? "s" : ""} (completadas hace +30 días)`);
      } else toast.error("Error al archivar");
    });
  };

  const toggleSwimlane = (id: string) => {
    setCollapsedSwimlanes(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const togglePriorityFilter = (p: string) => {
    setFilterPriority(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const activeFilterCount = filterPriority.length + (filterAssignee ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="flex flex-col h-full gap-4">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Advanced Create Task */}
          <button onClick={() => setAdvancedCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-teal-500/20">
            <Plus className="w-4 h-4" /> Crear Tarea
          </button>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar tareas..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 outline-none focus:border-teal-500/50 transition-colors" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-slate-500" /></button>}
          </div>

          {/* Global search Ctrl+K */}
          <button onClick={() => setGlobalSearch(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs">Ctrl+K</span>
          </button>

          {/* Filter toggle */}
          <button onClick={() => setShowFilters(v => !v)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${showFilters || activeFilterCount > 0 ? "bg-teal-500/10 border-teal-500/30 text-teal-400" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"}`}>
            <Filter className="w-3.5 h-3.5" />Filtros {activeFilterCount > 0 && <span className="bg-teal-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{activeFilterCount}</span>}
          </button>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 outline-none focus:border-teal-500/50 cursor-pointer">
            <option value="default">Orden por defecto</option>
            <option value="priority">Por prioridad</option>
            <option value="dueDate">Por vencimiento</option>
          </select>

          {/* Detail toggle */}
          <button onClick={() => setShowDetails(v => !v)} className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-400 hover:bg-slate-800 transition-colors">
            {showDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showDetails ? "Simple" : "Detallado"}
          </button>

          {/* Archive button */}
          <button onClick={handleArchive} disabled={isPending} title="Archivar completadas (+30 días)" className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors disabled:opacity-40">
            <Archive className="w-3.5 h-3.5" />
          </button>

          {/* Stats */}
          <div className="ml-auto">
            {hasMounted && <StatsBar swimlanes={swimlanes} />}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="flex items-center gap-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Prioridad:</span>
              {["URGENT","HIGH","MEDIUM","LOW"].map(p => {
                const cfg = PRIORITY_CONFIG[p];
                const active = filterPriority.includes(p);
                return (
                  <button key={p} onClick={() => togglePriorityFilter(p)} className="text-xs px-2.5 py-1 rounded-full font-bold transition-all"
                    style={{ color: cfg.color, background: active ? cfg.bg : "transparent", border: `1px solid ${active ? cfg.color : "#334155"}` }}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            {(filterPriority.length > 0) && (
              <button onClick={() => setFilterPriority([])} className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Board ────────────────────────────────────────────────────────── */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-auto pb-6">
          <div className="min-w-[900px] space-y-6">

            {/* Column headers (sticky) */}
            <div className="grid grid-cols-4 gap-4 sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md py-3 border-b border-slate-800/50">
              {STATUS_COLUMNS.map(col => {
                const total = filteredSwimlanes.flatMap(sl => sl.columns.filter(c => c.status === col.status).flatMap(c => c.tasks)).length;
                return (
                  <div key={col.status} className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <span className="font-semibold text-slate-300 text-sm">{col.name}</span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{total}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Swimlanes */}
            {filteredSwimlanes.map(swimlane => {
              const inProg = swimlane.columns.find(c => c.status === "IN_PROGRESS")?.tasks.length || 0;
              const review = swimlane.columns.find(c => c.status === "REVIEW")?.tasks.length || 0;
              const total = inProg + review;
              const isOverWIP = swimlane.wipLimit !== null && total > swimlane.wipLimit;
              const isCollapsed = collapsedSwimlanes.has(swimlane.id);

              return (
                <div key={swimlane.id} className="space-y-3">
                  {/* Swimlane header */}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
                    <button onClick={() => toggleSwimlane(swimlane.id)} className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all text-sm font-semibold ${
                      isOverWIP ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-slate-900 border-slate-700 text-slate-300 hover:border-teal-500/40"
                    }`}>
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <GripVertical className="w-3 h-3 text-slate-500" />
                      <span>{swimlane.name}</span>
                      {swimlane.wipLimit && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${isOverWIP ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-400"}`}>
                          {total}/{swimlane.wipLimit} WIP
                        </span>
                      )}
                      {isOverWIP && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                    </button>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQuickCreate({ swimlaneId: swimlane.id, status: "TODO" })}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-400 transition-colors px-2 py-1 rounded hover:bg-teal-500/10">
                        <Plus className="w-3.5 h-3.5" /> Tarea
                      </button>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-800 via-slate-800 to-transparent" />
                  </div>

                  {/* Columns */}
                  {!isCollapsed && (
                    <div className="grid grid-cols-4 gap-4">
                      {swimlane.columns.map((column, ci) => {
                        const statusCfg = STATUS_COLUMNS[ci];
                        return (
                          <div key={column.id} className="flex flex-col gap-2">
                            <div className="rounded-xl border border-dashed p-2 flex flex-col gap-2 min-h-[100px]"
                              style={{ borderColor: `${statusCfg.color}25`, background: statusCfg.bg }}>
                              <KanbanColumn
                                column={column} colConfig={statusCfg} swimlaneId={swimlane.id}
                                isOverWIP={isOverWIP} showDetails={showDetails}
                                onTaskClick={setSelectedTask}
                                onTaskDelete={handleDelete}
                                onTaskDuplicate={handleDuplicate}
                              />
                              <button onClick={() => setQuickCreate({ swimlaneId: swimlane.id, status: column.status })}
                                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors px-1 py-1 rounded hover:bg-slate-800/50 mt-1">
                                <Plus className="w-3 h-3" /> Agregar tarea
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredSwimlanes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <LayoutGrid className="w-10 h-10 text-slate-700 mb-3" />
                <h3 className="text-slate-400 font-semibold">No hay swimlanes en este proyecto</h3>
                <p className="text-slate-600 text-sm mt-1">Crea el primer swimlane para empezar a gestionar tareas.</p>
              </div>
            )}

            {filteredSwimlanes.length > 0 && swimlanes.flatMap(sl => sl.columns.flatMap(c => c.tasks)).length > 0 && filteredSwimlanes.flatMap(sl => sl.columns.flatMap(c => c.tasks)).length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="w-8 h-8 text-slate-700 mb-3" />
                <h3 className="text-slate-400 font-medium">Sin resultados para "{searchQuery}"</h3>
                <button onClick={() => { setSearchQuery(""); setFilterPriority([]); }} className="mt-3 text-teal-400 text-sm hover:underline">Limpiar filtros</button>
              </div>
            )}
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeTask && (
            <div className="bg-slate-900 border border-teal-500 p-3 rounded-xl shadow-2xl shadow-teal-500/20 rotate-2 w-56 ring-1 ring-teal-500/30">
              <p className="text-sm font-medium text-slate-200 line-clamp-2">{activeTask.title}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-xs px-1.5 py-0.5 rounded text-teal-400 bg-teal-500/10 font-bold">{activeTask.priority}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      {selectedTask && <TaskDetailModal taskId={selectedTask} onClose={() => setSelectedTask(null)} />}
      {quickCreate && (
        <QuickCreateModal
          swimlaneId={quickCreate.swimlaneId}
          projectId={initialProject.id}
          defaultStatus={quickCreate.status}
          onClose={() => setQuickCreate(null)}
          onCreated={() => { /* page will auto-revalidate */ }}
        />
      )}
      {advancedCreate && (
        <AdvancedTaskCreateModal
          project={initialProject}
          swimlanes={swimlanes}
          onClose={() => setAdvancedCreate(false)}
          onCreated={() => setAdvancedCreate(false)}
        />
      )}
      {/* Global Search Overlay */}
      {globalSearch && (
        <KanbanGlobalSearch
          projectId={initialProject.id}
          onSelectTask={(taskId: string) => { setSelectedTask(taskId); }}
          onClose={() => setGlobalSearch(false)}
        />
      )}
    </div>
  );
}
