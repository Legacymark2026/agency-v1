import { getTasks } from "@/actions/crm-advanced";
import { prisma } from "@/lib/prisma";
import { TasksBoard } from "@/components/crm/tasks-board";
import { CheckSquare, Clock, AlertTriangle, ListTodo } from "lucide-react";

export default async function TasksPage() {
    const company = await prisma.company.findFirst();
    if (!company) return (
        <div className="ds-page flex items-center justify-center">
            <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">&gt; Empresa no configurada_</p>
        </div>
    );

    const tasks = await getTasks(company.id);
    const overdue = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date());
    const pending = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);

    const kpis = [
        { label: "Total", value: tasks.length, icon: ListTodo, code: "TOT" },
        { label: "Pendientes", value: pending.length, icon: Clock, code: "PND" },
        { label: "Vencidas", value: overdue.length, icon: AlertTriangle, code: "VNC" },
        { label: "Completadas", value: completed.length, icon: CheckSquare, code: "CMP" },
    ];

    return (
        <div className="ds-page space-y-8">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* Header */}
            <div className="relative z-10 pb-8 flex flex-col md:flex-row md:items-start justify-between gap-4"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <div className="mb-4">
                        <span className="ds-badge ds-badge-teal">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                            </span>
                            CRM_CORE · TASKS
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-12 h-12">
                            <CheckSquare className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page">Tareas & Recordatorios</h1>
                            <p className="ds-subtext mt-2">Seguimiento de leads y deals · Tareas asignadas</p>
                        </div>
                    </div>
                </div>
                <span className="font-mono text-xs text-slate-700 uppercase tracking-widest hidden md:block">[TSK_BOARD]</span>
            </div>

            {/* KPI Strip */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {kpis.map(k => (
                    <div key={k.label} className="ds-kpi group">
                        <span className="absolute top-3 right-3 font-mono text-xs text-slate-700 uppercase tracking-widest">[{k.code}]</span>
                        <div className="relative z-10">
                            <div className="ds-icon-box w-9 h-9 mb-3">
                                <k.icon size={14} strokeWidth={1.5} className={`transition-colors ${k.code === 'VNC' ? 'text-red-500' : 'text-slate-500 group-hover:text-teal-400'}`} />
                            </div>
                            <p className="ds-stat-value">{k.value}</p>
                            <p className="ds-stat-label">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Board */}
            <div className="relative z-10">
                <TasksBoard tasks={tasks as any} companyId={company.id} />
            </div>
        </div>
    );
}
