import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/types/auth";

export default async function ClientProposalsPage() {
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

    const proposals = await prisma.proposal.findMany({
        where: { companyId: userCompany.companyId },
        orderBy: { createdAt: 'desc' },
        include: { items: true }
    });

    const statusColors: Record<string, string> = {
        DRAFT: "bg-slate-800 text-slate-300",
        SENT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        VIEWED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        SIGNED: "bg-teal-500/20 text-teal-400 border-teal-500/30",
        REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
    };

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-slate-950 text-slate-200 p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <FileText className="h-6 w-6 text-teal-400" />
                    Mis Propuestas
                </h1>
                <p className="text-sm text-slate-400 mt-1">Historial de cotizaciones, alcances y contratos de servicios.</p>
            </header>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-slate-800">
                    <thead className="bg-slate-950/50">
                        <tr>
                            <th className="py-4 pl-6 pr-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Documento</th>
                            <th className="px-3 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
                            <th className="px-3 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Inversión</th>
                            <th className="px-3 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                            <th className="py-4 pl-3 pr-6 text-right"><span className="sr-only">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900">
                        {proposals.length === 0 ? (
                            <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-500">No hay propuestas disponibles.</td></tr>
                        ) : proposals.map(p => (
                            <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="py-4 pl-6 pr-3">
                                    <div className="font-semibold text-slate-200">{p.title}</div>
                                    <div className="text-xs text-slate-500 mt-1">{p.items.length} ítems en contrato</div>
                                </td>
                                <td className="px-3 py-4 text-sm text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                                <td className="px-3 py-4 text-sm font-mono text-slate-300">${p.value.toLocaleString()} {p.currency}</td>
                                <td className="px-3 py-4 text-sm">
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[p.status] || statusColors.DRAFT}`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="py-4 pl-3 pr-6 text-right text-sm">
                                    <Link href={`/proposal/${p.token}`} target="_blank" className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1.5 rounded-lg font-medium">
                                        <ExternalLink className="h-4 w-4" /> Ver Documento
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
