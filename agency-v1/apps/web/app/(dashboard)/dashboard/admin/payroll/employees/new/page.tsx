"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, User, Building, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createEmployee } from "@/actions/employees";

export default function NewEmployeePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    // Default structure according to schema
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        documentType: "CC",
        documentNumber: "",
        email: "",
        phone: "",
        contractType: "LABORAL",
        position: "",
        baseSalary: 1300000,
        isActive: true
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const res = await createEmployee(formData);
        if (res.success) {
            toast.success("Empleado registrado correctamente");
            router.push("/dashboard/admin/payroll/employees");
        } else {
            toast.error(res.error || "Hubo un error al registrar el empleado");
        }
        setIsLoading(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link 
                    href="/dashboard/admin/payroll/employees" 
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <User className="w-6 h-6 text-teal-500" />
                        Registrar Empleado
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Al registrar un empleado podrás emitirle Nómina Electrónica</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm shadow-slate-900/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-8">
                    {/* Sección 1: Datos Personales */}
                    <div className="col-span-full pb-4 border-b border-slate-800">
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <User className="w-4 h-4 text-teal-400" />
                            Datos Personales
                        </h3>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Nombres *</label>
                        <input
                            type="text" required name="firstName"
                            placeholder="Ej: Juan Pablo"
                            value={formData.firstName} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Apellidos *</label>
                        <input
                            type="text" required name="lastName"
                            placeholder="Ej: Pérez Gomez"
                            value={formData.lastName} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Tipo de Documento *</label>
                        <select
                            name="documentType" required
                            value={formData.documentType} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
                        >
                            <option value="CC">Cédula de Ciudadanía (CC)</option>
                            <option value="NIT">NIT</option>
                            <option value="CE">Cédula de Extranjería (CE)</option>
                            <option value="PPT">Permiso por Protección Temporal (PPT)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Número de Documento *</label>
                        <input
                            type="text" required name="documentNumber"
                            placeholder="Ej: 1020304050"
                            value={formData.documentNumber} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Correo Electrónico (Opcional)</label>
                        <input
                            type="email" name="email"
                            placeholder="juan@empresa.com"
                            value={formData.email} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Teléfono (Opcional)</label>
                        <input
                            type="tel" name="phone"
                            placeholder="3001234567"
                            value={formData.phone} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
                        />
                    </div>

                    {/* Sección 2: Datos Laborales */}
                    <div className="col-span-full pb-4 pt-4 border-b border-slate-800">
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <Building className="w-4 h-4 text-teal-400" />
                            Datos Laborales y Contractuales
                        </h3>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Tipo de Contrato *</label>
                        <select
                            name="contractType" required
                            value={formData.contractType} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
                        >
                            <option value="LABORAL">Laboral (Término Fijo/Indefinido)</option>
                            <option value="PRESTACION_SERVICIOS">Prestación de Servicios (Freelance)</option>
                        </select>
                         <p className="text-xs text-slate-500 mt-1">El contrato Laboral calcula automáticamente Salud y Pensión. Prestación de servicios calcula Retefuente.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Cargo *</label>
                        <input
                            type="text" required name="position"
                            placeholder="Ej: Diseñador Senior"
                            value={formData.position} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
                        />
                    </div>

                    <div className="space-y-2 col-span-full">
                        <label className="text-xs font-medium text-slate-300">
                            {formData.contractType === 'LABORAL' ? 'Salario Básico Mensual (COP) *' : 'Honorarios Base Mensuales (COP) *'}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-slate-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number" required min="0" step="1000" name="baseSalary"
                                value={formData.baseSalary} onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow font-mono"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3 mt-auto">
                    <Link
                        href="/dashboard/admin/payroll/employees"
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-md transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(20,184,166,0.3)] min-w-[140px] justify-center"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Empleado
                    </button>
                </div>
            </form>
        </div>
    );
}
