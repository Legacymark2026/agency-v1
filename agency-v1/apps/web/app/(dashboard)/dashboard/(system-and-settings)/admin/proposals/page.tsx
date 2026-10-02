"use client";

import { useState, useEffect } from "react";
import { Plus, FileText, Search, ExternalLink, Trash2, Edit3, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProposalsPage() {
    const router = useRouter();
    const [proposals, setProposals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/proposals");
            if (res.ok) {
                const data = await res.json();
                setProposals(data);
            }
        } catch (error) {
            console.error("Error fetching proposals:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("¿Eliminar esta propuesta? Esta acción no se puede deshacer.")) return;
        try {
            await fetch(`/api/admin/proposals/${id}`, { method: "DELETE" });
            fetchProposals();
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    const formatCurrency = (value: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return <span className="inline-flex items-center rounded-full bg-slate-800/80 px-2.5 py-0.5 text-xs font-medium tracking-wide text-slate-300 border border-slate-700">BORRADOR</span>;
            case 'SENT':
                return <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium tracking-wide text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">ENVIADA</span>;
            case 'VIEWED':
                return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium tracking-wide text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">VISTA</span>;
            case 'SIGNED':
                return <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-medium tracking-wide text-teal-400 border border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.1)]">FIRMADA</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium tracking-wide text-red-400 border border-red-500/20">RECHAZADA</span>;
            default:
                return <span className="inline-flex items-center rounded-full bg-slate-800/80 px-2.5 py-0.5 text-xs font-medium tracking-wide text-slate-300 border border-slate-700">{status}</span>;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-slate-950 text-slate-200 p-6 md:p-8 overflow-y-auto no-scrollbar">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <div className="p-2 bg-teal-500/10 rounded-lg">
                            <FileText className="h-6 w-6 text-teal-400" />
                        </div>
                        Propuestas Comerciales
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Crea, envía y gestiona firmas digitales de tus cotizaciones.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar propuestas..."
                            className="bg-slate-900 border border-slate-800 text-sm pl-9 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-64 md:w-80 shadow-inner"
                        />
                    </div>
                    <Link href="/dashboard/admin/proposals/new" className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(20,184,166,0.2)] hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]">
                        <Plus className="h-4 w-4" />
                        Nueva Propuesta
                    </Link>
                </div>
            </header>

            <div className="bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-2xl ring-1 ring-slate-800/80 sm:rounded-xl">
                <table className="min-w-full divide-y divide-slate-800/60">
                    <thead className="bg-slate-950/80 backdrop-blur-md">
                        <tr>
                            <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Título de la Propuesta</th>
                            <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                            <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Cotizado</th>
                            <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                            <th scope="col" className="relative py-4 pl-3 pr-6 text-right">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-transparent">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-teal-500 animate-spin"></div>
                                        <p className="text-sm text-slate-400">Cargando portafolio de propuestas...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : proposals.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-16 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="h-16 w-16 bg-slate-800/50 rounded-full flex items-center justify-center">
                                            <FileText className="h-8 w-8 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-slate-300 font-medium">Aún no hay propuestas creadas</p>
                                            <p className="text-sm text-slate-500 mt-1">Crea tu primera cotización ultra profesional.</p>
                                        </div>
                                        <Link href="/dashboard/admin/proposals/new" className="mt-2 text-teal-400 hover:text-teal-300 text-sm font-medium flex items-center gap-1 transition-colors">
                                            Comenzar <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ) : proposals.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-800/40 transition-colors group cursor-pointer" onClick={() => router.push(`/dashboard/admin/proposals/${p.id}`)}>
                                <td className="whitespace-nowrap py-4 pl-6 pr-3">
                                    <Link href={`/dashboard/admin/proposals/${p.id}`} className="text-sm font-semibold text-slate-200 group-hover:text-teal-400 transition-colors block">
                                        {p.title}
                                        <span className="block text-xs font-normal text-slate-500 mt-0.5">Editado hace poco</span>
                                    </Link>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4">
                                    <div className="text-sm text-slate-300 font-medium">{p.contactName || "Sin asignar"}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{p.contactEmail || "—"}</div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4">
                                    <span className="inline-flex items-center text-sm font-mono font-medium text-slate-200 tracking-tight">
                                        {formatCurrency(p.value, p.currency || 'USD')}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4">
                                    {getStatusBadge(p.status)}
                                </td>
                                <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Link 
                                            href={`/dashboard/admin/proposals/${p.id}`} 
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" 
                                            title="Editar"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </Link>
                                        <a 
                                            href={`/proposal/${p.token}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors" 
                                            title="Enlace Público (Client View)"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                        <button 
                                            onClick={(e) => handleDelete(p.id, e)} 
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1" 
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
