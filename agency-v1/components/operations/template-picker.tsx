"use client";

import { useState } from "react";
import { Plus, ChevronRight, Clock, Loader2, Zap } from "lucide-react";
import { listProjectTemplates, createProjectFromTemplate } from "@/actions/kanban-templates";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TemplatePicker {
  companyId?: string;
  onCreated: (projectId: string) => void;
  onSkip: () => void;
}

const TEMPLATE_COLORS = [
  "from-blue-600/20 to-blue-800/10 border-blue-500/20",
  "from-pink-600/20 to-pink-800/10 border-pink-500/20",
  "from-teal-600/20 to-teal-800/10 border-teal-500/20",
  "from-purple-600/20 to-purple-800/10 border-purple-500/20",
];

export function TemplatePicker({ companyId, onCreated, onSkip }: TemplatePicker) {
  const [templates, setTemplates] = useState<any[]>([
    { id: "tpl_meta_ads",      name: "🚀 Lanzamiento Meta Ads", description: "Facebook, Instagram, Pixel + CAPI", icon: "📣", taskCount: 10 },
    { id: "tpl_tiktok",        name: "🎵 Campaña TikTok Ads",   description: "Producción, edición de video y pauta", icon: "🎵", taskCount: 9 },
    { id: "tpl_email_marketing",name: "📧 Email Marketing",      description: "Segmentación, diseño y envío", icon: "📧", taskCount: 7 },
    { id: "tpl_web_redesign",  name: "🌐 Rediseño Web",         description: "Discovery, diseño y desarrollo", icon: "🌐", taskCount: 10 },
  ]);
  const [selected, setSelected] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!selected) return;
    const tpl = templates.find(t => t.id === selected);
    setCreating(true);

    // Don't pass companyId - let server resolve it
    const result = await createProjectFromTemplate(selected, projectName || tpl?.name || "Nuevo Proyecto", undefined);
    if (result.success && result.project) {
      toast.success(`Proyecto "${result.project.name}" creado con plantilla 🎉`);
      onCreated(result.project.id);
    } else {
      toast.error(result.error || "Error al crear proyecto");
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-3">
          <Zap className="w-6 h-6 text-teal-400" />
        </div>
        <h2 className="text-xl font-bold text-white">¿Usar una plantilla?</h2>
        <p className="text-slate-400 text-sm mt-1">Empieza con tareas y swimlanes pre-configurados en 1 clic</p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {templates.map((tpl, i) => (
          <button
            key={tpl.id}
            onClick={() => setSelected(selected === tpl.id ? null : tpl.id)}
            className={`text-left p-4 rounded-xl border bg-gradient-to-br transition-all ${TEMPLATE_COLORS[i % TEMPLATE_COLORS.length]} ${
              selected === tpl.id ? "ring-2 ring-teal-500 scale-[1.02]" : "hover:scale-[1.01]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{tpl.icon}</span>
              <div>
                <p className="font-semibold text-white text-sm">{tpl.name}</p>
                <p className="text-slate-400 text-xs mt-0.5">{tpl.description}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span className="text-xs text-slate-500">{tpl.taskCount} tareas pre-configuradas</span>
                </div>
              </div>
              {selected === tpl.id && (
                <div className="ml-auto w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Name override */}
      {selected && (
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Nombre del proyecto (opcional)</label>
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder={templates.find(t => t.id === selected)?.name || "Nombre del proyecto"}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onSkip} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors">
          Crear desde cero
        </button>
        <button
          onClick={handleCreate}
          disabled={!selected || creating}
          className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {creating ? "Creando..." : "Usar plantilla"}
        </button>
      </div>
    </div>
  );
}
