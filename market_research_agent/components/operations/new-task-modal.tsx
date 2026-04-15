"use client";

import { useState, useTransition } from "react";
import { X, Loader2, Target, Plus, Flag } from "lucide-react";
import { createKanbanTask } from "@/actions/kanban-tasks";

type NewTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string; // The active project to which this task belongs
  onSuccess?: () => void;
};

export function NewTaskModal({ isOpen, onClose, projectId, onSuccess }: NewTaskModalProps) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createKanbanTask(formData, projectId);
      if (result.success) {
        onClose();
        if (onSuccess) onSuccess();
      } else {
        alert(result.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden shadow-teal-500/10"
        role="dialog"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Create New Kanban Task</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={handleSubmit} className="p-6 space-y-5">
           <div className="space-y-2">
             <label htmlFor="title" className="text-sm font-medium text-slate-300">Task Title <span className="text-red-400">*</span></label>
             <input 
               id="title"
               name="title" 
               required
               placeholder="e.g. Implement Prisma Migration"
               className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500/50"
             />
           </div>

           <div className="space-y-2">
             <label htmlFor="description" className="text-sm font-medium text-slate-300">Description</label>
             <textarea 
               id="description"
               name="description" 
               rows={3}
               placeholder="Details about step-by-step actions required..."
               className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500/50 resize-none"
             />
           </div>
           
           <div className="space-y-2">
             <label htmlFor="priority" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Flag className="w-4 h-4 text-slate-400" />
                Priority
             </label>
             <select 
               id="priority"
               name="priority"
               className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500/50 appearance-none"
               defaultValue="MEDIUM"
             >
                <option value="LOW" className="text-slate-400">Low</option>
                <option value="MEDIUM" className="text-blue-400">Medium</option>
                <option value="HIGH" className="text-amber-400">High</option>
                <option value="URGENT" className="text-red-400">Urgent</option>
             </select>
           </div>

           <div className="pt-4 flex items-center justify-end gap-3">
             <button 
               type="button" 
               onClick={onClose}
               className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 bg-transparent hover:bg-slate-800 rounded-lg transition-colors"
             >
               Cancel
             </button>
             <button 
               type="submit" 
               disabled={isPending}
               className="px-5 py-2.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50"
             >
               {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
               {isPending ? "Creating..." : "Create Task"}
             </button>
           </div>
        </form>
      </div>
    </div>
  );
}
