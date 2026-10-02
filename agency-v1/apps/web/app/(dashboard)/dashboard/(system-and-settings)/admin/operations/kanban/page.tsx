import { SwimlaneKanban } from "@/components/operations/swimlane-kanban";
import { KanbanSetup } from "@/components/operations/kanban-setup";
import { KanbanAnalyticsDashboard } from "@/components/operations/kanban-analytics";
import { ProjectSwitcher } from "@/components/operations/project-switcher";
import { ProjectSettingsModal } from "@/components/operations/project-settings-modal";
import { getKanbanBoardData } from "@/actions/kanban-tasks";
import { listKanbanProjects } from "@/actions/kanban-projects";
import { Metadata } from "next";
import { LayoutGrid, BarChart2, Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gestión Operativa | LegacyMark",
  description: "Tablero Kanban empresarial para la gestión del equipo.",
};

export default async function KanbanPage({ searchParams }: { searchParams: { view?: string; projectId?: string } }) {
  const { projects } = await listKanbanProjects();
  const params = await searchParams;
  const view = params?.view || "board";
  const targetProjectId = params?.projectId;

  if (!projects || projects.length === 0 || view === "setup") {
    return <KanbanSetup />;
  }

  const activeProject = targetProjectId ? projects.find(p => p.id === targetProjectId) || projects[0] : projects[0];

  const result = await getKanbanBoardData(activeProject.id);
  if (!result.success || !result.project) {
    return <KanbanSetup />;
  }

  return (
    <div className="p-5 md:p-7 max-w-full h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <ProjectSwitcher projects={projects} activeId={result.project.id} />
          <p className="text-slate-500 text-sm mt-0.5">
            {result.project.description || "Tablero de operaciones del equipo"}
            {result.project.healthScore != null && (
              <span className="ml-2 text-teal-400 font-medium">Health: {result.project.healthScore}/100</span>
            )}
          </p>
        </div>

        {/* Options & View Toggle */}
        <div className="flex items-center gap-3">
          <ProjectSettingsModal project={activeProject} />
          
          <Link href="?view=setup" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nuevo Proyecto
          </Link>
          
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl gap-1 flex-shrink-0">
          <a href={`?view=board&projectId=${activeProject.id}`} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === "board" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}>
            <LayoutGrid className="w-4 h-4" /> Tablero
          </a>
          <a href={`?view=analytics&projectId=${activeProject.id}`} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === "analytics" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}>
            <BarChart2 className="w-4 h-4" /> Analytics
          </a>
        </div>
        </div>
      </div>

      {/* Content */}
      {view === "analytics" ? (
        <div className="flex-1 overflow-y-auto bg-slate-900/20 border border-slate-800 rounded-2xl p-6">
          <KanbanAnalyticsDashboard projectId={result.project.id} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm p-5">
          <SwimlaneKanban initialProject={result.project} />
        </div>
      )}
    </div>
  );
}
