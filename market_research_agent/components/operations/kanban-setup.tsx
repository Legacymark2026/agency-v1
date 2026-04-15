"use client";

import { useState, useTransition } from "react";
import { Kanban, Zap, Users, BarChart2, Plus, ArrowRight, Loader2, Shield, DollarSign, Search, Sparkles } from "lucide-react";
import { createKanbanProject } from "@/actions/kanban-projects";
import { createProjectFromTemplate } from "@/actions/kanban-templates";
import { TemplatePicker } from "./template-picker";
import { useRouter } from "next/navigation";

const FEATURES = [
  { icon: Kanban,      title: "Tablero Swimlane",      desc: "Arrastra y suelta tareas entre columnas y carriles." },
  { icon: Users,       title: "Equipo en tiempo real", desc: "Asigna responsables, deja comentarios y subtareas." },
  { icon: BarChart2,   title: "Analytics Avanzado",    desc: "Velocidad, flujo acumulado, health score." },
  { icon: Zap,         title: "Plantillas Inteligentes",desc: "Proyectos pre-configurados en 1 clic." },
  { icon: Shield,      title: "Auditoría Enterprise",  desc: "Historial de cada movimiento con actor y timestamp." },
  { icon: DollarSign,  title: "Inteligencia Financiera",desc: "Burn rate, costo por tarea, exportar reporte." },
  { icon: Search,      title: "Búsqueda Global Ctrl+K",desc: "Busca en tareas, comentarios y subtareas." },
  { icon: Sparkles,    title: "AI Copilot",            desc: "Genera brief e instrucciones automáticamente con IA." },
];

export function KanbanSetup() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("Gestión Operativa");
  const [description, setDescription] = useState("Tablero principal del equipo de operaciones");
  const [step, setStep] = useState<"welcome" | "template" | "create">("welcome");
  const [error, setError] = useState("");

  const handleCreate = () => {
    startTransition(async () => {
      setError("");
      const fd = new FormData();
      fd.set("name", name || "Gestión Operativa");
      fd.set("description", description);
      const res = await createKanbanProject(fd);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || "Error al crear el proyecto");
      }
    });
  };

  const handleTemplateCreated = (projectId: string) => {
    router.refresh();
  };

  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">

        {/* STEP: Welcome */}
        {step === "welcome" && (
          <>
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 mb-5">
                <Kanban className="w-8 h-8 text-teal-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">Gestión Operativa</h1>
              <p className="text-slate-400 text-lg">Tu tablero Kanban enterprise para gestionar el equipo, proyectos y finanzas de la agencia.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {FEATURES.map(f => (
                <div key={f.title} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-teal-500/20 transition-colors">
                  <f.icon className="w-5 h-5 text-teal-400 mb-2.5" />
                  <h3 className="font-semibold text-slate-200 text-sm mb-1">{f.title}</h3>
                  <p className="text-slate-500 text-xs">{f.desc}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setStep("template")}
              className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-white font-bold rounded-xl text-lg transition-all shadow-lg shadow-teal-500/20">
              <Plus className="w-5 h-5" /> Crear mi tablero Kanban <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* STEP: Template Picker */}
        {step === "template" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <TemplatePicker
              companyId="" // Will be resolved server-side
              onCreated={handleTemplateCreated}
              onSkip={() => setStep("create")}
            />
          </div>
        )}

        {/* STEP: Manual Create */}
        {step === "create" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Configura tu proyecto</h2>
            <p className="text-slate-500 text-sm mb-7">Puedes editar estos datos después en cualquier momento.</p>

            <div className="space-y-5">
              <div>
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-2">Nombre del proyecto *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Gestión Operativa"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-base outline-none focus:border-teal-500 transition-colors placeholder:text-slate-600" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-2">Descripción</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe el propósito del proyecto..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-teal-500 transition-colors resize-none placeholder:text-slate-600" />
              </div>

              <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20 text-sm text-teal-300">
                <p className="font-semibold mb-1">Se crearán automáticamente 3 swimlanes:</p>
                <ul className="text-teal-400/70 space-y-0.5 text-xs">
                  <li>• Backlog</li>
                  <li>• Sprint Activo</li>
                  <li>• Revisión / Bloqueados</li>
                </ul>
              </div>

              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep("template")} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium">
                  Atrás
                </button>
                <button onClick={handleCreate} disabled={isPending || !name.trim()}
                  className="flex-[2] py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-2 text-sm">
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : <><Plus className="w-4 h-4" /> Crear Proyecto</>}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
