import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Building2, FileText, CheckCircle2, TrendingUp, AlertCircle, Briefcase, CreditCard } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/types/auth";

export default async function ClientPortalPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    // Validar acceso estricto a clientes
    const role = session.user.role as UserRole;
    if (role !== UserRole.EXTERNAL_CLIENT && role !== UserRole.SUPER_ADMIN) {
        redirect("/dashboard/unauthorized");
    }

    // Obtener información del cliente (compañía) a través del usuario
    const userCompany = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        include: { company: true }
    });

    const companyId = userCompany?.companyId;

    if (!companyId) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center p-6 text-center">
                <div className="max-w-md bg-slate-900 border border-red-500/20 rounded-xl p-8">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Empresa no vinculada</h2>
                    <p className="text-slate-400">Tu cuenta no está asociada a ninguna organización válida. Contacta con tu gestor de cuenta para configurar tu acceso.</p>
                </div>
            </div>
        );
    }

    // Fetch data para Módulo C-Level Cliente
    const [proposals, projects, invoices] = await Promise.all([
        prisma.proposal.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 3
        }),
        prisma.kanbanProject.findMany({
            where: { companyId },
            include: {
                kanbanTasks: {
                    select: { status: true, estimatedHours: true }
                }
            },
            take: 3
        }),
        prisma.invoice.findMany({
            where: { companyId, status: "DRAFT_AWAITING_PAYMENT" },
            orderBy: { createdAt: 'asc' }
        })
    ]);

    const activeProposals = proposals.filter(p => p.status === "SENT" || p.status === "VIEWED");
    const activeProjects = projects.filter(p => p.status !== "DONE");

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-y-auto no-scrollbar bg-slate-950 p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Hola, {session.user.name?.split(" ")[0]} 👋</h1>
                <p className="text-slate-400 mt-2">Bienvenido al portal seguro de {userCompany.company.name}. Aquí puedes revisar tus avances, facturación y activos operativos.</p>
            </header>

            {/* KPIs Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 text-emerald-400 mb-2">
                        <TrendingUp className="h-5 w-5" />
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Estado de Proyectos</h3>
                    </div>
                    <div className="text-3xl font-light text-white font-mono">{activeProjects.length}</div>
                    <p className="text-xs text-slate-500 mt-1">Sprints Activos</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 text-amber-400 mb-2">
                        <FileText className="h-5 w-5" />
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Propuestas Pendientes</h3>
                    </div>
                    <div className="text-3xl font-light text-white font-mono">{activeProposals.length}</div>
                    <p className="text-xs text-slate-500 mt-1">Esperando revisión y firma digital</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-1 md:col-span-2">
                     <div className="flex items-center gap-3 text-teal-400 mb-2">
                        <Building2 className="h-5 w-5" />
                        <h3 className="font-semibold text-sm uppercase tracking-wider">Centro Operativo</h3>
                    </div>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                        Este espacio te permite tener auditoría en tiempo real sobre la ejecución de los servicios y acceder al histórico de contratos y SLAs de forma 100% transparente.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Propuestas Recientes */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            Propuestas & Cotizaciones
                        </h3>
                        <Link href="/dashboard/client/proposals" className="text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors">Ver todas &rarr;</Link>
                    </div>
                    <div className="divide-y divide-slate-800/60">
                        {proposals.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-500">No hay propuestas recientes.</div>
                        ) : proposals.map(prop => (
                            <div key={prop.id} className="p-4 sm:px-6 hover:bg-slate-800/30 transition-colors flex items-center justify-between group">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-200 group-hover:text-teal-400 transition-colors">{prop.title}</h4>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono">
                                        <span>${prop.value.toLocaleString()} {prop.currency}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                        <span>{new Date(prop.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                        prop.status === 'SIGNED' ? 'bg-teal-500/10 text-teal-400 ring-teal-500/20' : 
                                        prop.status === 'VIEWED' ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20' : 
                                        'bg-blue-500/10 text-blue-400 ring-blue-500/20'
                                    }`}>
                                        {prop.status}
                                    </span>
                                    <Link href={`/proposal/${prop.token}`} target="_blank" className="text-xs text-slate-400 hover:text-white transition-colors border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-md">
                                        Abrir
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Proyectos Activos */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-slate-400" />
                            Estado de Proyectos
                        </h3>
                         <Link href="/dashboard/client/projects" className="text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors">Detalles &rarr;</Link>
                    </div>
                    <div className="divide-y divide-slate-800/60 p-4 sm:p-6 space-y-6">
                        {projects.length === 0 ? (
                            <div className="text-center text-sm text-slate-500 py-4">Aún no hay proyectos activos en ejecución.</div>
                        ) : projects.map(project => {
                            const totalTasks = project.kanbanTasks.length;
                            const completedTasks = project.kanbanTasks.filter(t => t.status === "DONE").length;
                            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                            
                            return (
                                <div key={project.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-slate-200">{project.name}</h4>
                                        <span className="text-xs font-medium text-teal-400">{progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-teal-500 rounded-full relative" 
                                            style={{ width: `${progress}%` }}
                                        >
                                            <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                                        <span>Status: <strong className="text-slate-400">{project.status}</strong></span>
                                        <span>{completedTasks} de {totalTasks} tickets</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Facturas Pendientes (PayU Integration) */}
            {invoices.length > 0 && (
                <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-emerald-400" />
                            Facturas Pendientes de Pago
                        </h3>
                    </div>
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {invoices.map(invoice => (
                            <div key={invoice.id} className="bg-slate-950 border border-slate-800 rounded-lg p-5 flex flex-col justify-between hover:border-slate-700 transition">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ring-1 ring-amber-500/20">Por Pagar</span>
                                        <span className="text-xs text-slate-500 font-mono">#{invoice.id.split('-')[0].toUpperCase()}</span>
                                    </div>
                                    <h4 className="font-semibold text-white mb-1">{invoice.serviceDescription}</h4>
                                    <p className="text-sm text-slate-400 flex justify-between mt-3">
                                        <span>Total:</span>
                                        <span className="font-mono">${invoice.totalAmount.toLocaleString()} {invoice.currency}</span>
                                    </p>
                                    <p className="text-sm border-t border-slate-800 mt-2 pt-2 flex justify-between font-bold text-white">
                                        <span>Monto a Pagar:</span>
                                        <span className="text-emerald-400 font-mono">${invoice.finalAmount.toLocaleString()} {invoice.currency}</span>
                                    </p>
                                </div>
                                <div className="mt-5">
                                    <Link href={`/api/invoices/${invoice.id}/pay`} className="block w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-md transition cursor-pointer shadow-lg shadow-emerald-500/20 shadow-inner">
                                        Pagar Seguro con PayU
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
