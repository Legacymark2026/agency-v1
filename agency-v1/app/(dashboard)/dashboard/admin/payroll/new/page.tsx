"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Loader2, DollarSign, Calendar, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { generatePayroll } from "@/actions/payroll";
import { getEmployees } from "@/actions/employees";

export default function NewPayrollPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    
    // First/Last day of current month by default
    const [formData, setFormData] = useState({
        employeeId: "",
        periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        paymentMethod: "TRANSFERENCIA",
        isElectronic: true,
        notes: ""
    });

    const [manualItems, setManualItems] = useState<{type: 'EARNING' | 'DEDUCTION', concept: string, description: string, amount: number}[]>([]);

    useEffect(() => {
        async function fetchDocs() {
            const res = await getEmployees();
            if (res.success) setEmployees(res.data.filter((e: any) => e.isActive));
        }
        fetchDocs();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
    };

    const addManualItem = (type: 'EARNING' | 'DEDUCTION') => {
        setManualItems([...manualItems, {
            type,
            concept: type === 'EARNING' ? 'BONUS' : 'ADVANCE',
            description: "",
            amount: 0
        }]);
    };

    const updateManualItem = (index: number, key: string, value: any) => {
        const newItems = [...manualItems];
        newItems[index] = { ...newItems[index], [key]: value };
        setManualItems(newItems);
    };

    const removeManualItem = (index: number) => {
        setManualItems(manualItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.employeeId) {
            toast.error("Debes seleccionar un empleado.");
            return;
        }

        setIsLoading(true);

        const payload = {
            ...formData,
            periodStart: new Date(formData.periodStart).toISOString(),
            periodEnd: new Date(formData.periodEnd).toISOString(),
            manualItems: manualItems.filter(item => item.amount > 0 && item.description.trim() !== '') // Clean empty items
        };

        const res = await generatePayroll(payload as any);
        if (res.success) {
            toast.success("Nómina generada exitosamente");
            router.push("/dashboard/admin/payroll");
        } else {
            toast.error(res.error || "Hubo un error al generar la nómina");
        }
        setIsLoading(false);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 flex flex-col h-full">
            <div className="flex items-center gap-4">
                <Link 
                    href="/dashboard/admin/payroll" 
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-teal-500" />
                        Generar Pago (Liquidación)
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Liquida la nómina o el pago de honorarios de un empleado o contratista.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-8 overflow-y-auto">
                    
                    {/* Sección 1: Empleado y Configuración */}
                    <div className="col-span-full pb-3 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-teal-400" />
                            Datos del Periodo
                        </h3>
                        <div className="flex items-center gap-2">
                             <input 
                                type="checkbox" id="isElectronic" name="isElectronic"
                                checked={formData.isElectronic} onChange={handleChange}
                                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-900 border-slate-700"
                            />
                            <label htmlFor="isElectronic" className="text-sm font-medium text-teal-400 cursor-pointer">
                                Habilitar Transmisión DIAN
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2 col-span-full">
                        <label className="text-xs font-medium text-slate-300">Seleccionar Empleado o Contratista *</label>
                        <select
                            name="employeeId" required
                            value={formData.employeeId} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
                        >
                            <option value="" disabled>Seleccione un empleado...</option>
                            {employees.map(e => (
                                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} - {e.documentNumber} ({e.contractType.replace("_", " ")})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Fecha Inicial del Periodo *</label>
                        <input
                            type="date" required name="periodStart"
                            value={formData.periodStart} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Fecha Final del Periodo *</label>
                        <input
                            type="date" required name="periodEnd"
                            value={formData.periodEnd} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
                        />
                    </div>

                    <div className="space-y-2 col-span-full">
                        <label className="text-xs font-medium text-slate-300">Método de Pago *</label>
                        <select
                            name="paymentMethod" required
                            value={formData.paymentMethod} onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow"
                        >
                            <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="CHEQUE">Cheque</option>
                        </select>
                    </div>

                    {/* Manual Items */}
                    <div className="col-span-full pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                                    Adicionales y Descuentos Manuales
                                </h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">La pensión y salud se calculan automáticamente si es contrato Laboral, y la retefuente si es Prestación. Añade aquí extras manuales.</p>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => addManualItem('EARNING')} className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded inline-flex items-center gap-1 hover:bg-emerald-500/20 transition-colors uppercase font-bold tracking-widest">
                                    <Plus className="w-3 h-3" /> Ingreso
                                </button>
                                <button type="button" onClick={() => addManualItem('DEDUCTION')} className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded inline-flex items-center gap-1 hover:bg-red-500/20 transition-colors uppercase font-bold tracking-widest">
                                    <Plus className="w-3 h-3" /> Descuento
                                </button>
                            </div>
                        </div>

                        {manualItems.length > 0 && (
                            <div className="space-y-3">
                                {manualItems.map((item, index) => (
                                    <div key={index} className={`flex gap-3 items-start p-3 rounded-lg border ${item.type === 'EARNING' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                        <div className="w-1/3">
                                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1 block">Concepto</label>
                                            <select
                                                value={item.concept} onChange={e => updateManualItem(index, 'concept', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-teal-500 transition-shadow"
                                            >
                                                {item.type === 'EARNING' ? (
                                                    <>
                                                        <option value="COMMISSION">Comisión</option>
                                                        <option value="BONUS">Bono / Prima Extralegal</option>
                                                        <option value="OTHER">Otro Ingreso</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="ADVANCE">Préstamo / Anticipo</option>
                                                        <option value="OTHER">Otro Descuento</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                        <div className="w-1/3">
                                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1 block">Descripción</label>
                                            <input
                                                type="text" required placeholder="Ej. Bono de cumplimiento"
                                                value={item.description} onChange={e => updateManualItem(index, 'description', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-teal-500 transition-shadow"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1 block">Monto (COP)</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                    <span className={`text-[10px] ${item.type === 'EARNING' ? 'text-emerald-500' : 'text-red-500'}`}>$</span>
                                                </div>
                                                <input
                                                    type="number" required min="1" step="1000"
                                                    value={item.amount || ''} onChange={e => updateManualItem(index, 'amount', Number(e.target.value))}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded pl-5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-shadow font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-5">
                                             <button type="button" onClick={() => removeManualItem(index)} className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                                                 <Trash2 className="w-4 h-4" />
                                             </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {manualItems.length === 0 && (
                             <div className="bg-slate-950 border border-slate-800 border-dashed rounded-lg p-6 text-center text-slate-500 text-xs">
                                 No has agregado ningún ingreso extra ni descuento manual (Las retenciones de ley se hacen automáticas al guardar).
                             </div>
                        )}
                    </div>

                    <div className="col-span-full space-y-2 mt-2">
                         <label className="text-xs font-medium text-slate-300">Notas Adicionales (Internas)</label>
                         <textarea
                             name="notes" rows={2}
                             value={formData.notes} onChange={handleChange}
                             className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-shadow resize-none"
                         />
                    </div>
                </div>

                <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3 mt-auto">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-md transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(20,184,166,0.3)] min-w-[140px] justify-center"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Liquidar Nómina
                    </button>
                </div>
            </form>
        </div>
    );
}
