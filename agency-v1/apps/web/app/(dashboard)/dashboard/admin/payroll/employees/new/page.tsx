"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, User, Building, ArrowLeft, Loader2, Shield, Landmark, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createEmployee } from "@/actions/employees";

export default function NewEmployeePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        documentType: "CC",
        documentNumber: "",
        email: "",
        phone: "",
        contractType: "LABORAL",
        position: "",
        department: "OPERACIONES",
        baseSalary: 1750000,
        joiningDate: new Date().toISOString().split("T")[0],
        ptoDays: 15,
        riskLevel: 1,
        // Safety & Health Entities
        epsName: "EPS Sura",
        afpName: "Porvenir",
        arlName: "ARL Sura",
        compensationBox: "Compensar",
        // Bank Information
        bankName: "Bancolombia",
        bankAccountType: "AHORROS",
        bankAccount: "",
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
            toast.success("Empleado registrado correctamente con parámetros legales de Colombia");
            router.push("/dashboard/admin/payroll/employees");
        } else {
            toast.error(res.error || "Hubo un error al registrar el empleado");
        }
        setIsLoading(false);
    };

    const appliesSubsidioTransporte = formData.contractType === "LABORAL" && formData.baseSalary <= 3500000;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 flex flex-col h-full text-slate-100">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link 
                    href="/dashboard/admin/payroll/employees" 
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-800"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <User className="w-6 h-6 text-teal-400" />
                        Registrar Empleado o Contratista 🇨🇴
                    </h1>
                    <p className="text-slate-400 text-xs mt-0.5">
                        Filiación laboral, Seguridad Social (EPS/AFP/ARL) y parámetros de Nómina Electrónica DIAN.
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-8">
                    
                    {/* Sección 1: Datos Personales */}
                    <div className="col-span-full pb-3 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                            <User className="w-4 h-4" /> 1. Datos Personales del Colaborador
                        </h3>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Nombres *</label>
                        <input
                            type="text" required name="firstName"
                            placeholder="Ej: HEYBER"
                            value={formData.firstName} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold outline-none focus:border-teal-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Apellidos *</label>
                        <input
                            type="text" required name="lastName"
                            placeholder="Ej: FLOREZ"
                            value={formData.lastName} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold outline-none focus:border-teal-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Tipo de Documento *</label>
                        <select
                            name="documentType" required
                            value={formData.documentType} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500 font-semibold"
                        >
                            <option value="CC">Cédula de Ciudadanía (CC)</option>
                            <option value="NIT">NIT (Contratista Persona Jurídica / PN)</option>
                            <option value="CE">Cédula de Extranjería (CE)</option>
                            <option value="PPT">Permiso por Protección Temporal (PPT)</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Número de Documento *</label>
                        <input
                            type="text" required name="documentNumber"
                            placeholder="Ej: 1007306770"
                            value={formData.documentNumber} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold outline-none focus:border-teal-500"
                        />
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Correo Electrónico (Para Desprendible)</label>
                        <input
                            type="email" name="email"
                            placeholder="ejemplo@gmail.com"
                            value={formData.email} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Teléfono / Celular de Contacto</label>
                        <input
                            type="tel" name="phone"
                            placeholder="31451629141"
                            value={formData.phone} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-teal-500"
                        />
                    </div>

                    {/* Sección 2: Datos Laborales */}
                    <div className="col-span-full pb-3 pt-3 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Building className="w-4 h-4" /> 2. Datos Laborales y Tipo de Vinculación
                        </h3>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Tipo de Contrato *</label>
                        <select
                            name="contractType" required
                            value={formData.contractType} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 font-semibold"
                        >
                            <option value="LABORAL">Laboral (Término Indefinido / Fijo / Obra)</option>
                            <option value="PRESTACION_SERVICIOS">Prestación de Servicios (Contratista Freelance)</option>
                            <option value="APRENDIZ_SENA">Aprendiz SENA (Lectiva / Productiva)</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Cargo / Posición *</label>
                        <input
                            type="text" required name="position"
                            placeholder="Ej: SEO Specialist, Desarrollador, Cajero"
                            value={formData.position} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Salario Básico o Honorarios Mensuales (COP) *</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold">$</span>
                            <input
                                type="number" required min="0" step="1000" name="baseSalary"
                                value={formData.baseSalary} onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-xs text-emerald-400 font-mono font-bold outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Fecha de Ingreso / Incio Contrato</label>
                        <input
                            type="date" name="joiningDate"
                            value={formData.joiningDate} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-indigo-500"
                        />
                    </div>

                    {/* Subsidio de Transporte Notification Card */}
                    <div className="col-span-full">
                        <div className={`p-3 rounded-xl border text-xs flex items-center gap-3 ${
                            appliesSubsidioTransporte ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-400"
                        }`}>
                            {appliesSubsidioTransporte ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />}
                            <span>
                                {appliesSubsidioTransporte 
                                    ? "Aplica Auxilio de Transporte legal (Salario <= 2 SMMLV). Se liquidará automáticamente en Nómina Electrónica."
                                    : "No aplica Auxilio de Transporte (Salario > 2 SMMLV o Contrato de Prestación de Servicios)."}
                            </span>
                        </div>
                    </div>

                    {/* Sección 3: Seguridad Social & Parafiscales */}
                    <div className="col-span-full pb-3 pt-3 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                            <Shield className="w-4 h-4" /> 3. Afiliación a Seguridad Social & Parafiscales 🇨🇴
                        </h3>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">EPS (Entidad Promotora de Salud)</label>
                        <select name="epsName" value={formData.epsName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500 font-semibold">
                            <option value="EPS Sura">EPS Sura</option>
                            <option value="Sanitas">EPS Sanitas</option>
                            <option value="Compensar EPS">Compensar EPS</option>
                            <option value="Nueva EPS">Nueva EPS</option>
                            <option value="Salud Total">Salud Total EPS</option>
                            <option value="Famisanar">Famisanar EPS</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">AFP (Fondo de Pensiones)</label>
                        <select name="afpName" value={formData.afpName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500 font-semibold">
                            <option value="Porvenir">Porvenir Pensiones</option>
                            <option value="Proteccion">Protección Pensiones</option>
                            <option value="Colfondos">Colfondos</option>
                            <option value="Skandia">Skandia</option>
                            <option value="Colpensiones">Colpensiones (RPM)</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">ARL (Riesgos Laborales)</label>
                        <select name="arlName" value={formData.arlName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500 font-semibold">
                            <option value="ARL Sura">ARL Sura</option>
                            <option value="Positiva">Positiva Compañía de Seguros</option>
                            <option value="Seguros Bolivar">Seguros Bolívar ARL</option>
                            <option value="AxA Colpatria">AxA Colpatria ARL</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Nivel de Riesgo ARL *</label>
                        <select name="riskLevel" value={formData.riskLevel} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-teal-500 font-mono font-bold">
                            <option value={1}>Nivel 1 (0.522% - Oficina / Administrativo)</option>
                            <option value={2}>Nivel 2 (1.044% - Comercio / Ventas)</option>
                            <option value={3}>Nivel 3 (2.436% - Operativo / Procesos Taller)</option>
                            <option value={4}>Nivel 4 (4.350% - Transporte / Logística)</option>
                            <option value={5}>Nivel 5 (6.960% - Alto Riesgo / Minería / Alturas)</option>
                        </select>
                    </div>

                    {/* Sección 4: Información Bancaria para Pago de Nómina */}
                    <div className="col-span-full pb-3 pt-3 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <Landmark className="w-4 h-4" /> 4. Cuenta Bancaria para Dispersión Masiva de Nómina
                        </h3>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Banco Emisor</label>
                        <select name="bankName" value={formData.bankName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-semibold">
                            <option value="Bancolombia">Bancolombia</option>
                            <option value="Banco de Bogota">Banco de Bogotá</option>
                            <option value="Davivienda">Davivienda / Daviplata</option>
                            <option value="Nequi">Nequi</option>
                            <option value="BBVA">BBVA Colombia</option>
                            <option value="Banco de Occidente">Banco de Occidente</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Número de Cuenta Bancaria</label>
                        <input
                            type="text" name="bankAccount"
                            placeholder="Ej: 03149819284"
                            value={formData.bankAccount} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
                    <Link
                        href="/dashboard/admin/payroll/employees"
                        className="px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-teal-600/20"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Empleado
                    </button>
                </div>
            </form>
        </div>
    );
}
