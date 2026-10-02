import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Briefcase, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { UserRole } from "@/types/auth";
import Link from "next/link";

export default async function ClientProjectsPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const role = session.user.role as UserRole;
    if (role !== UserRole.EXTERNAL_CLIENT && role !== UserRole.SUPER_ADMIN) {
        redirect("/dashboard/unauthorized");
    }

    const userCompany = await prisma.companyUser.findFirst({
        where: { userId: session.user.id }
    });

    if (!userCompany?.companyId) {
        return <div className="p-8 text-white">Cuenta no vinculada a una empresa.</div>;
    }

    const projects = await prisma.kanbanProject.findMany({
        where: { companyId: userCompany.companyId },
        orderBy: { createdAt: 'desc' },
        include: {
            kanbanTasks: {
                orderBy: { order: 'asc' },
                select: { id: true, title: true, status: true, priority: true }
            }
        }
    });

    const statusMap: Record<string, string> = {
        TODO: "Pendiente",
        IN_PROGRESS: "En Curso",
        REVIEW: "Revisión",
        DONE: "Completado"
    };

    const priorityBadge: Record<string, string> = {
        LOW: "bg-slate-800 text-slate-300 ring-slate-700",
        MEDIUM: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
        HIGH: "bg-red-500/10 text-red-400 ring-red-500/20",
    };

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-slate-950 text-slate-200 p-6 md:p-8 overflow-y-auto no-scrollbar">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Briefcase className="h-6 w-6 text-teal-400" />
                    Ejecución de Proyectos
                </h1>
                <p className="text-sm text-slate-400 mt-1">Sprints activos, auditoría de tickets y avances en tiempo real.</p>
            </header>

            <div className="grid grid-cols-1 gap-8">
                {projects.length === 0 ? (
                    <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500">
                        No tienes proyectos operacionales activos.
                    </div>
                ) : projects.map(project => {
                    const totalTasks = project.kanbanTasks.length;
                    const completedTasks = project.kanbanTasks.filter(t => t.status === "DONE").length;
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return (
                        <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-white">{project.name}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Inicio: {new Date(project.startDate || project.createdAt).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1">Estado: <strong className="text-slate-300">{project.status}</strong></span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3 md:w-64">
                                    <div className="w-full">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Progreso</span>
                                            <span className="text-teal-400 font-bold">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2">
                                            <div className="bg-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                    <Link href={`/dashboard/admin/operations/kanban?projectId=${project.id}`} 
                                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded-lg text-xs font-bold transition-all mt-1">
                                        Ver Tablero Completo <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                            
                            <div className="p-6 bg-slate-950/50">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Desglose de Tickets (Backlog)</h3>
                                
                                {project.kanbanTasks.length === 0 ? (
                                    <div className="text-sm text-slate-500 italic">No hay tickets mapeados aún en este sprint.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {project.kanbanTasks.map(task => (
                                            <div key={task.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col shadow-sm hover:border-slate-700 transition-colors">
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs uppercase font-bold tracking-widest ring-1 ring-inset ${priorityBadge[task.priority] || priorityBadge.LOW}`}>
                                                        {task.priority}
                                                    </span>
                                                    {task.status === "DONE" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                                </div>
                                                <h4 className="text-sm font-medium text-slate-200 leading-snug">{task.title}</h4>
                                                <div className="mt-auto pt-4 flex items-center justify-between">
                                                    <span className="text-xs text-slate-500 font-mono">ID: {task.id.split("-")[0]}</span>
                                                    <span className={`text-xs font-semibold ${task.status === 'DONE' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                        {statusMap[task.status] || task.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
