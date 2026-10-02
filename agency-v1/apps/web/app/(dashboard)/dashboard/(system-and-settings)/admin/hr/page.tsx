import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTimesheets, getTimeOffRequests } from "@/actions/hr-time";
import { TimesheetManager } from "@/components/hr/timesheet-manager";
import { TimeOffManager } from "@/components/hr/time-off-manager";
import Link from "next/link";
import { Users, Clock, Calendar, ShieldCheck, ArrowRight, Activity, DollarSign, FileSpreadsheet } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function HRAdminPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    let companyId = session.user.companyId;

    if (!companyId) {
        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id },
            select: { companyId: true }
        });
        companyId = companyUser?.companyId;
    }

    if (!companyId) {
        return (
            <div className="p-8 text-center text-slate-400">
                No se encontró una empresa asociada a tu cuenta.
            </div>
        );
    }

    // Fetch live HR data concurrently
    const [timesheets, timeOffRequests, employeeCount] = await Promise.all([
        getTimesheets(companyId).catch(() => []),
        getTimeOffRequests(companyId).catch(() => []),
        prisma.user.count({
            where: {
                companies: {
                    some: { companyId }
                }
            }
        }).catch(() => 0),
    ]);

    const pendingTimeOff = Array.isArray(timeOffRequests) 
        ? timeOffRequests.filter((r: any) => r.status === "PENDING").length 
        : 0;

    const totalHoursLogged = Array.isArray(timesheets)
        ? timesheets.reduce((acc: number, item: any) => acc + (Number(item.hours) || 0), 0)
        : 0;

    return (
        <div className="animate-in fade-in duration-300 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            Enterprise HR & Time Tracking
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 mt-1">
                        Centro de Control de Recursos Humanos
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Supervisión integral de tiempo laborado, gestión de permisos, turnos y personal de tu organización.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/admin/payroll/employees"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                        <Users size={14} />
                        Personal y Contratistas
                    </Link>
                    <Link
                        href="/dashboard/admin/payroll"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-sm transition-colors"
                    >
                        <DollarSign size={14} />
                        Nómina Electrónica
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Total Colaboradores</span>
                        <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                            <Users size={18} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-100 mt-2">{employeeCount}</p>
                    <span className="text-[11px] text-teal-400 flex items-center gap-1 mt-1 font-mono">
                        <ShieldCheck size={12} /> Activos en nómina
                    </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Horas Registradas</span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                            <Clock size={18} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-100 mt-2">{totalHoursLogged.toFixed(1)} hrs</p>
                    <span className="text-[11px] text-blue-400 flex items-center gap-1 mt-1 font-mono">
                        <Activity size={12} /> Registradas en timesheets
                    </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Permisos Pendientes</span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                            <Calendar size={18} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-100 mt-2">{pendingTimeOff}</p>
                    <span className="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-mono">
                        Por autorizar o validar
                    </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Nómina y PILA</span>
                        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                            <FileSpreadsheet size={18} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-100 mt-2">100%</p>
                    <span className="text-[11px] text-violet-400 flex items-center gap-1 mt-1 font-mono">
                        Cumplimiento DIAN al día
                    </span>
                </div>
            </div>

            {/* Main Interactive Workspaces */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Timesheets Widget */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="text-teal-400" size={18} />
                            <h2 className="text-lg font-semibold text-slate-100">Control de Horas (Timesheets)</h2>
                        </div>
                        <Link 
                            href="/dashboard/admin/payroll/timesheets"
                            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
                        >
                            Ver completo <ArrowRight size={12} />
                        </Link>
                    </div>
                    <TimesheetManager companyId={companyId} initialData={timesheets} />
                </div>

                {/* Time-Off Requests Widget */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="text-blue-400" size={18} />
                            <h2 className="text-lg font-semibold text-slate-100">Permisos, Vacaciones y Licencias</h2>
                        </div>
                        <Link 
                            href="/dashboard/admin/payroll/time-off"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                        >
                            Ver completo <ArrowRight size={12} />
                        </Link>
                    </div>
                    <TimeOffManager companyId={companyId} initialData={timeOffRequests} />
                </div>
            </div>
        </div>
    );
}
