"use client";

import { useState, useTransition } from "react";
import { Settings, Trash2, X, AlertTriangle, Save, Loader2, DollarSign } from "lucide-react";
import { updateKanbanProject, deleteKanbanProject } from "@/actions/kanban-projects";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ProjectSettingsModal({ project }: { project: any }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [budget, setBudget] = useState(project.budget?.toString() || "");
  const [isPending, startTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const router = useRouter();

  const handleUpdate = () => {
    if (!name.trim()) return toast.error("El nombre es requerido");
    startTransition(async () => {
      const b = parseFloat(budget);
      const res = await updateKanbanProject(project.id, {
        name: name.trim(),
        description: description.trim(),
        budget: isNaN(b) ? null : b
      });
      if (res.success) {
        toast.success("Proyecto actualizado");
        setOpen(false);
      } else {
        toast.error(res.error || "Error al actualizar");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("¿Estás seguro de que deseas eliminar este proyecto y todas sus tareas? Esta acción es irreversible.")) return;
    
    startDeleteTransition(async () => {
      const res = await deleteKanbanProject(project.id);
      if (res.success) {
        toast.success("Proyecto eliminado");
        setOpen(false);
        // Clean URL to avoid staying on deleted project
        router.push("/dashboard/admin/operations/kanban");
      } else {
        toast.error(res.error || "Error al eliminar");
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold transition-colors shadow-sm"
      >
        <Settings className="w-4 h-4" /> Configurar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => !isPending && !isDeletePending && setOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-400" /> Configuración del Proyecto
              </h3>
              <button onClick={() => !isPending && !isDeletePending && setOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Nombre del Proyecto</label>
                  <input 
                    value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-teal-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Descripción</label>
                  <textarea 
                    value={description} onChange={e => setDescription(e.target.value)} rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-teal-500 outline-none transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Presupuesto ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="number" min="0" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-teal-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="mt-8 pt-6 border-t border-slate-800/60">
                <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Zona de Peligro
                </h4>
                <p className="text-xs text-slate-500 mb-3">La eliminación es permanente y borrará todas las columnas, tareas, anotaciones e historial de auditoría de este proyecto.</p>
                <button 
                  onClick={handleDelete} disabled={isDeletePending || isPending}
                  className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold transition-colors text-sm disabled:opacity-50"
                >
                  {isDeletePending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} 
                  {isDeletePending ? "Eliminando..." : "Eliminar Proyecto Permanentemente"}
                </button>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex gap-3">
              <button 
                onClick={() => setOpen(false)} disabled={isPending || isDeletePending}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdate} disabled={isPending || isDeletePending || !name.trim()}
                className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                {isPending ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
