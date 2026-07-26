"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Users, Search, Briefcase, Mail, Phone, Edit, Trash2, RefreshCw, Eye, Shield, Landmark, X, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { getEmployees, updateEmployee, deactivateEmployee, reactivateEmployee } from "@/actions/employees";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function EmployeesList() {
    const router = useRouter();
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTab, setFilterTab] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ACTIVE");

    // Modal States
    const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
    const [viewingEmployee, setViewingEmployee] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, [filterTab]);

    async function fetchEmployees() {
        setIsLoading(true);
        const res = await getEmployees(filterTab === "ALL" || filterTab === "INACTIVE");
        if (res.success) setEmployees(res.data);
        setIsLoading(false);
    }

    const handleDeactivate = async (id: string, name: string) => {
        if (!confirm(`¿Deseas desactivar al colaborador ${name}?`)) return;
        const res = await deactivateEmployee(id);
        if (res.success) {
            toast.success(`Colaborador ${name} desactivado correctamente`);
            fetchEmployees();
            router.refresh();
        } else {
            toast.error(res.error || "Error al desactivar el colaborador");
        }
    };

    const handleReactivate = async (id: string, name: string) => {
        const res = await reactivateEmployee(id);
        if (res.success) {
            toast.success(`Colaborador ${name} reactivado correctamente`);
            fetchEmployees();
            router.refresh();
        } else {
            toast.error(res.error || "Error al reactivar el colaborador");
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEmployee) return;
        setIsSaving(true);

        const res = await updateEmployee(editingEmployee.id, {
            firstName: editingEmployee.firstName,
            lastName: editingEmployee.lastName,
            position: editingEmployee.position,
            baseSalary: Number(editingEmployee.baseSalary),
            contractType: editingEmployee.contractType,
            email: editingEmployee.email,
            phone: editingEmployee.phone,
            epsName: editingEmployee.epsName,
            afpName: editingEmployee.afpName,
            arlName: editingEmployee.arlName,
            riskLevel: Number(editingEmployee.riskLevel),
            bankName: editingEmployee.bankName,
            bankAccount: editingEmployee.bankAccount,
        });

        if (res.success) {
            toast.success("Información del colaborador actualizada correctamente");
            setEditingEmployee(null);
            fetchEmployees();
            router.refresh();
        } else {
            toast.error(res.error || "Error al actualizar los datos");
        }
        setIsSaving(false);
    };

    const filtered = employees.filter(e => {
        const matchText = (e.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (e.lastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.documentNumber || "").includes(searchTerm);
        
        if (filterTab === "ACTIVE") return matchText && e.isActive;
        if (filterTab === "INACTIVE") return matchText && !e.isActive;
        return matchText;
    });

    const fmtMoney = (n: number) =>
        new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n || 0);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/dashboard/admin/payroll" className="text-teal-400 hover:text-teal-300 text-xs font-bold mb-2 inline-block">
                        &larr; Volver al Panel de Nómina
                    </Link>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-teal-400" />
                        Gestión Completa de Personal y Contratistas (CRUD) 🇨🇴
                    </h1>
                    <p className="text-slate-400 text-xs mt-0.5">
                        Alta, consulta, modificación y retiro de colaboradores con parámetros de Seguridad Social.
                    </p>
                </div>
                
                <Link
                    href="/dashboard/admin/payroll/employees/new"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition-all shadow-lg shadow-teal-600/20"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Empleado
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o documento..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-500"
                    />
                </div>

                <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                        onClick={() => setFilterTab("ACTIVE")}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            filterTab === "ACTIVE" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Activos ({employees.filter(e => e.isActive).length})
                    </button>
                    <button
                        onClick={() => setFilterTab("INACTIVE")}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            filterTab === "INACTIVE" ? "bg-slate-800 text-slate-200 shadow" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Inactivos ({employees.filter(e => !e.isActive).length})
                    </button>
                    <button
                        onClick={() => setFilterTab("ALL")}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            filterTab === "ALL" ? "bg-slate-800 text-slate-200 shadow" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Todos ({employees.length})
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4 font-bold">Colaborador</th>
                                <th className="px-6 py-4 font-bold">Contacto</th>
                                <th className="px-6 py-4 font-bold">Cargo y Contrato</th>
                                <th className="px-6 py-4 font-bold text-right">Salario Base</th>
                                <th className="px-6 py-4 font-bold text-center">Estado</th>
                                <th className="px-6 py-4 font-bold text-right">Acciones CRUD</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-semibold">Cargando nómina de colaboradores...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-semibold">No se encontraron colaboradores.</td></tr>
                            ) : filtered.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white text-sm">{row.firstName} {row.lastName}</div>
                                        <div className="text-slate-500 font-mono text-[11px]">{row.documentType} {row.documentNumber}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5 text-slate-400">
                                            {row.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500"/> {row.email}</span>}
                                            {row.phone && <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3 text-slate-500"/> {row.phone}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-teal-400 shrink-0" />
                                            <div>
                                                <div className="text-slate-200 font-semibold">{row.position}</div>
                                                <div className="text-[10px] font-mono text-teal-400 uppercase tracking-wider">{row.contractType.replace("_", " ")}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right tabular-nums text-emerald-400 font-mono font-bold text-sm">
                                        {fmtMoney(row.baseSalary)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            {row.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3 h-3" /> Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
                                                    Inactivo
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {/* READ DETAIL */}
                                            <button
                                                onClick={() => setViewingEmployee(row)}
                                                title="Ver Ficha Completa"
                                                className="p-2 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-xl transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            {/* UPDATE EDIT */}
                                            <button
                                                onClick={() => setEditingEmployee({ ...row })}
                                                title="Editar Colaborador"
                                                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-all"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            {/* DELETE / REACTIVATE */}
                                            {row.isActive ? (
                                                <button
                                                    onClick={() => handleDeactivate(row.id, `${row.firstName} ${row.lastName}`)}
                                                    title="Desactivar"
                                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleReactivate(row.id, `${row.firstName} ${row.lastName}`)}
                                                    title="Reactivar Colaborador"
                                                    className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: EDIT EMPLOYEE (UPDATE) */}
            {editingEmployee && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Edit className="w-5 h-5 text-indigo-400" />
                                Editar Colaborador: {editingEmployee.firstName} {editingEmployee.lastName}
                            </h3>
                            <button onClick={() => setEditingEmployee(null)} className="p-1.5 text-slate-400 hover:text-white rounded-xl">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-300 block mb-1">Nombres</label>
                                    <input
                                        type="text" required
                                        value={editingEmployee.firstName}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, firstName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-300 block mb-1">Apellidos</label>
                                    <input
                                        type="text" required
                                        value={editingEmployee.lastName}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, lastName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-300 block mb-1">Cargo / Posición</label>
                                    <input
                                        type="text" required
                                        value={editingEmployee.position}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-300 block mb-1">Salario Base / Honorarios ($)</label>
                                    <input
                                        type="number" required step="1000"
                                        value={editingEmployee.baseSalary}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, baseSalary: Number(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-300 block mb-1">EPS</label>
                                    <input
                                        type="text"
                                        value={editingEmployee.epsName || ""}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, epsName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-300 block mb-1">AFP (Pensiones)</label>
                                    <input
                                        type="text"
                                        value={editingEmployee.afpName || ""}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, afpName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-300 block mb-1">Banco</label>
                                    <input
                                        type="text"
                                        value={editingEmployee.bankName || ""}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, bankName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-300 block mb-1">Número de Cuenta</label>
                                    <input
                                        type="text"
                                        value={editingEmployee.bankAccount || ""}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, bankAccount: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button" onClick={() => setEditingEmployee(null)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit" disabled={isSaving}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                                >
                                    <Save className="w-4 h-4" /> Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: VIEW EMPLOYEE DETAIL (READ) */}
            {viewingEmployee && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-teal-400" />
                                Ficha Laboral del Colaborador
                            </h3>
                            <button onClick={() => setViewingEmployee(null)} className="p-1.5 text-slate-400 hover:text-white rounded-xl">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                                <div className="text-base font-bold text-white">{viewingEmployee.firstName} {viewingEmployee.lastName}</div>
                                <div className="text-slate-400 font-mono">{viewingEmployee.documentType}: {viewingEmployee.documentNumber}</div>
                                <div className="text-teal-400 font-semibold">{viewingEmployee.position} — <span className="uppercase">{viewingEmployee.contractType}</span></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 font-mono">
                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                    <span className="text-[10px] text-slate-400 block font-sans">Salario Base</span>
                                    <span className="font-bold text-emerald-400 text-sm">{fmtMoney(viewingEmployee.baseSalary)}</span>
                                </div>
                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                    <span className="text-[10px] text-slate-400 block font-sans">Estado laboral</span>
                                    <span className={`font-bold ${viewingEmployee.isActive ? "text-emerald-400" : "text-rose-400"}`}>
                                        {viewingEmployee.isActive ? "ACTIVO" : "INACTIVO"}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">Seguridad Social & Banco</h4>
                                <div className="grid grid-cols-2 gap-2 text-slate-400">
                                    <div>EPS: <span className="text-white font-semibold">{viewingEmployee.epsName || "No asignada"}</span></div>
                                    <div>AFP: <span className="text-white font-semibold">{viewingEmployee.afpName || "No asignada"}</span></div>
                                    <div>ARL: <span className="text-white font-semibold">{viewingEmployee.arlName || "ARL Sura"} (Riesgo {viewingEmployee.riskLevel || 1})</span></div>
                                    <div>Banco: <span className="text-white font-semibold">{viewingEmployee.bankName || "Bancolombia"}</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button onClick={() => setViewingEmployee(null)} className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
