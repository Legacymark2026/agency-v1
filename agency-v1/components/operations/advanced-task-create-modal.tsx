"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, X, AlignLeft, Calendar, User, Clock, DollarSign, Target, ShieldAlert, Flag } from "lucide-react";
import { createKanbanTask, getTeamMembersForAssignment } from "@/actions/kanban-tasks";
import { toast } from "sonner";

export function AdvancedTaskCreateModal({ 
  project, 
  swimlanes, 
  onClose, 
  onCreated 
}: {
  project: any;
  swimlanes: any[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [swimlaneId, setSwimlaneId] = useState(swimlanes[0]?.id || "");
  
  // Details
  const [users, setUsers] = useState<any[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [storyPoints, setStoryPoints] = useState("");
  
  // Enterprise
  const [budgetCap, setBudgetCap] = useState("");
  const [costPerHour, setCostPerHour] = useState("");
  const [slaDeadline, setSlaDeadline] = useState("");
  useEffect(() => {
    getTeamMembersForAssignment().then(res => {
      if (res.success) setUsers(res.users);
    });
  }, []);

  const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    URGENT: { label: "Urgente", color: "#f43f5e", bg: "rgba(244, 63, 94, 0.1)" }, // rose-500
    HIGH: { label: "Alta", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" }, // amber-500
    MEDIUM: { label: "Media", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" }, // blue-500
    LOW: { label: "Baja", color: "#64748b", bg: "rgba(100, 116, 139, 0.1)" }, // slate-500
  };

  const handleSubmit = () => {
    if (!title.trim()) return toast.error("El título es obligatorio");
    if (!swimlaneId) return toast.error("Debes seleccionar una columna");

    startTransition(async () => {
      const selectedSwimlane = swimlanes.find(s => s.id === swimlaneId);
      const res = await createKanbanTask({
        projectId: project.id,
        swimlaneId,
        status: selectedSwimlane?.status || "TODO",
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        storyPoints: storyPoints ? parseInt(storyPoints) : undefined,
        budgetCap: budgetCap ? parseFloat(budgetCap) : undefined,
        costPerHour: costPerHour ? parseFloat(costPerHour) : undefined,
        slaDeadline: slaDeadline ? new Date(slaDeadline) : undefined,
      });

      if (res.success) {
        toast.success("Tarea principal creada");
        onCreated();
        onClose();
      } else {
        toast.error(res.error || "Error al crear tarea");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-teal-400" /> Crear Tarea Avanzada
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
          
          {/* SECCIÓN 1: Info Básica */}
          <section>
            <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
              <AlignLeft className="w-4 h-4 text-teal-500" /> Información Principal
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Título de la tarea *</label>
                <input 
                  autoFocus
                  placeholder="Ej: Diseñar landing page..."
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-teal-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Descripción detallada</label>
                <textarea 
                  rows={4} placeholder="Describe los requerimientos (soporta markdown en el modal)..."
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 focus:border-teal-500 outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1"><Flag className="w-3 h-3" /> Prioridad</label>
                  <div className="flex gap-2">
                    {["URGENT","HIGH","MEDIUM","LOW"].map(p => {
                      const cfg = PRIORITY_CONFIG[p];
                      return (
                        <button 
                          key={p} onClick={() => setPriority(p)} 
                          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all" 
                          style={{ 
                            color: priority === p ? "#fff" : cfg.color, 
                            background: priority === p ? cfg.color : cfg.bg, 
                            border: `1px solid ${priority === p ? cfg.color : "transparent"}` 
                          }}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1">Columna / Estado</label>
                  <select 
                    value={swimlaneId} onChange={e => setSwimlaneId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-teal-500 outline-none"
                  >
                    {swimlanes.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: Ejecución */}
          <section>
            <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
              <User className="w-4 h-4 text-sky-500" /> Ejecución y Tiempos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Asignar A</label>
                <select 
                  value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-teal-500 outline-none"
                >
                  <option value="">Sin Asignar</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 block"><Calendar className="w-3 h-3" /> Fecha Límite</label>
                <input 
                  type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-teal-500 outline-none [color-scheme:dark]"
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 block"><Clock className="w-3 h-3" /> Horas Est.</label>
                <input 
                  type="number" min="0" step="0.5" placeholder="0" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 block"><Target className="w-3 h-3" /> Story Pts</label>
                <input 
                  type="number" min="0" step="1" placeholder="0" value={storyPoints} onChange={e => setStoryPoints(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-teal-500 outline-none"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: Enterprise */}
          <section>
            <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
              <ShieldAlert className="w-4 h-4 text-indigo-500" /> Enterprise (Finanzas & SLA)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 block"><DollarSign className="w-3 h-3 text-emerald-500" /> Presupuesto Cap</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">$</span>
                  <input 
                    type="number" min="0" step="1" placeholder="0.00" value={budgetCap} onChange={e => setBudgetCap(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 block"><DollarSign className="w-3 h-3 text-emerald-500" /> Costo x Hora</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">$</span>
                  <input 
                    type="number" min="0" step="1" placeholder="0.00" value={costPerHour} onChange={e => setCostPerHour(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 block"><ShieldAlert className="w-3 h-3 text-rose-500" /> SLA Deadline</label>
                <input 
                  type="date" value={slaDeadline} onChange={e => setSlaDeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-rose-200 focus:border-rose-500 outline-none [color-scheme:dark]"
                />
              </div>
            </div>
          </section>

        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose} disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors font-semibold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} disabled={isPending || !title.trim()}
            className="px-8 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? "Creando..." : "Crear Tarea"} <Target className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
