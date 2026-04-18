"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Users, Search, MoreHorizontal, Briefcase, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { getEmployees, deactivateEmployee } from "@/actions/employees";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function EmployeesList() {
    const router = useRouter();
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchEmployees();
    }, []);

    async function fetchEmployees() {
        setIsLoading(true);
        const res = await getEmployees();
        if (res.success) setEmployees(res.data);
        setIsLoading(false);
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Desactivar empleado ${name}?`)) return;
        const res = await deactivateEmployee(id);
        if (res.success) {
            toast.success("Empleado desactivado");
            fetchEmployees();
            router.refresh();
        } else {
            toast.error(res.error || "Error al desactivar");
        }
    };

    const filtered = employees.filter(e => 
        e.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.documentNumber.includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/dashboard/admin/payroll" className="text-teal-400 hover:text-teal-300 text-sm font-medium mb-2 inline-block">
                        &larr; Volver a Nómina
                    </Link>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-teal-500" />
                        Personal y Contratistas
                    </h1>
                </div>
                <Link
                    href="/dashboard/admin/payroll/employees/new"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Empleado
                </Link>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o documento..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Empleado</th>
                                <th className="px-6 py-4 font-semibold">Contacto</th>
                                <th className="px-6 py-4 font-semibold">Cargo y Contrato</th>
                                <th className="px-6 py-4 font-semibold text-right">Salario Base</th>
                                <th className="px-6 py-4 font-semibold text-center">Estado</th>
                                <th className="px-6 py-4 font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Cargando...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No hay empleados registrados.</td></tr>
                            ) : filtered.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-200">{row.firstName} {row.lastName}</div>
                                        <div className="text-xs text-slate-500">{row.documentType} {row.documentNumber}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs text-slate-400">
                                            {row.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {row.email}</span>}
                                            {row.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {row.phone}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-slate-500" />
                                            <div>
                                                <div className="text-slate-300">{row.position}</div>
                                                <div className="text-xs font-mono text-teal-500/80 uppercase tracking-wider">{row.contractType.replace("_", " ")}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right tabular-nums text-white font-medium">
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(row.baseSalary)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            {row.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-widest uppercase bg-teal-500/10 text-teal-400 border border-teal-500/20">ACTIVO</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-widest uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">INACTIVO</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleDelete(row.id, row.firstName)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
